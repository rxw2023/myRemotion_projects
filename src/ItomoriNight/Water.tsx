import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { LAKE, TOWN_SHORE, WATER_Y, lakeMask, terrainHeight, warpedLakeDistance } from "./layout";
import { SHOW_COMET, type CometState } from "./comet";
import { makeRippleBuffer, ripplesAt, RIPPLE_SLOTS } from "./ripples";
import { useSeason } from "./SeasonContext";

/**
 * 糸守湖的湖面
 *
 * 这一版的关键改动: 从"画家式假反射"改成**真做法线扰动 + Fresnel + reflect()**。
 * 思路来自参考实现（suwa-lake-comet-night.html 第 8 节）:
 *
 *   vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));   // 多层方向波叠出法线
 *   float fres = pow(1.0 - dot(N,V), 2.2);
 *   vec3 R = reflect(-V, N);
 *   vec3 refl = mix(uSkyLo, uSkyHi, R.y*1.15 + 0.15);
 *   col = mix(body, refl, fres*0.86 + 0.12);
 *
 * 为什么这样更好:
 *   1. Fresnel 是从扰动后的法线导出的 —— 波纹会自动把倒影打碎，
 *      掠射角变亮是几何的自然结果，不需要手调"按水深假装掠射"。
 *   2. 有了真实的反射向量 R，彗星倒影可以直接算:
 *      pow(dot(R, 彗星方向), 220) 取一个窄波瓣 ——
 *      它自然就是一条被波纹切成碎光的竖向光带，而不是手绘的柱子。
 *   3. 涟漪也参与法线扰动（grad += 环向波形），所以会真的扭曲倒影。
 *
 * 光照仍然是冷蓝月光 + 暖色小镇灯影，与场景其余部分一致。
 */

const PAD = 1.28;
const BBOX = {
  minX: LAKE.x - LAKE.r * PAD,
  maxX: LAKE.x + LAKE.r * PAD,
  minZ: LAKE.z - LAKE.r * PAD,
  maxZ: LAKE.z + LAKE.r * PAD,
};
/** 湖是正圆，用正方网格，分辨率给足才能让岸线干净 */
const SEG = 224;

const WATER_VERT = /* glsl */ `
attribute float aMask;
attribute float aDepth;
varying vec3 vWorld;
varying float vMask;
varying float vDepth;

void main() {
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  vMask = aMask;
  vDepth = aDepth;
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
}
`;

const WATER_FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uShallow;
uniform vec3 uShore;
uniform vec3 uMirror;
uniform vec3 uSkyHi;
uniform vec3 uSkyLo;
uniform vec3 uCometRefl;
uniform vec3 uLampRefl;
uniform vec3 uRippleCol;
uniform vec3 uCometPos;
uniform float uCometGlow;
/** 0 = 关掉彗星倒影（见 comet.ts 的 SHOW_COMET） */
uniform float uCometOn;
uniform vec2 uTown;
uniform float uLampGlow;
uniform vec2 uLakeCenter;
uniform vec3 uHazeColor;
uniform float uHazeNear;
uniform float uHazeFar;
uniform vec4 uRipples[${RIPPLE_SLOTS}];

varying vec3 vWorld;
varying float vMask;
varying float vDepth;

float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  if (vMask < 0.03) discard;

  vec2 p = vWorld.xz;
  float t = uTime;

  /* ---------- 1. 多层方向波 → 水面法线扰动 ----------
   * 四个方向、四种流速叠起来，才有整体缓慢漂流感。
   * 单层正弦会立刻露出"规则条纹"的机器味。
   *
   * 频率整体乘了 0.42: 参考实现的湖半径约 7，我这个约 17。
   * 噪声频率是世界坐标下的绝对值，直接照搬会让点密度高 2.4 倍 ——
   * 湖面会碎成一片起沫的样子，而不是一层细浪。
   */
  vec2 w1 = p * 0.44 + vec2( t * 0.21,  t * 0.13);
  vec2 w2 = p * 0.76 + vec2(-t * 0.30,  t * 0.18);
  vec2 w3 = p * 0.22 + vec2( t * 0.09, -t * 0.06);
  vec2 w4 = p * 1.35 + vec2(-t * 0.46, -t * 0.33);

  vec2 grad = vec2(0.0);
  grad += vec2(cos(w1.x * 1.15 + w1.y * 0.75), sin(w1.y * 1.05 - w1.x * 0.55)) * 0.022;
  grad += vec2(cos(w2.x * 1.85 - w2.y * 1.20), sin(w2.y * 1.65 + w2.x * 0.95)) * 0.014;
  grad += vec2(cos(w3.x * 0.75 + w3.y * 1.05), sin(w3.y * 0.90 - w3.x * 0.65)) * 0.028;
  grad += vec2(cos(w4.x * 2.60 + w4.y * 1.90), sin(w4.y * 2.30 - w4.x * 1.55)) * 0.007;

  /* ---------- 2. 落水涟漪: 阻尼环形波，同时扰动法线 ----------
   * 关键是 grad 那一项 —— 涟漪真的会扭曲倒影，
   * 只在颜色上加一圈亮边会显得像贴纸。
   */
  float ripple = 0.0;
  for (int i = 0; i < ${RIPPLE_SLOTS}; i++) {
    float s = uRipples[i].w;
    if (s <= 0.001) continue;
    vec2 d = p - uRipples[i].xy;
    float dist = length(d) + 0.0001;
    float rad = uRipples[i].z;
    float w = sin((dist - rad) * 20.0) * exp(-abs(dist - rad) * 4.5);
    ripple += w * s;
    grad += (d / dist) * w * s * 0.045;
  }

  vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));
  vec3 V = normalize(cameraPosition - vWorld);

  /* ---------- 3. 水体固有色: 岸线亮青环 → 浅滩 → 深靛 ---------- */
  vec3 body = mix(uShore, uShallow, smoothstep(0.0, 0.13, vDepth));
  body = mix(body, uMid, smoothstep(0.11, 0.38, vDepth));
  body = mix(body, uDeep, smoothstep(0.36, 0.78, vDepth));

  /* ---------- 4. Fresnel + 真实反射向量 ---------- */
  /*
   * 指数提到 4.0、并且**不给下限**。
   *
   * 真实水面的 Fresnel 在 60° 视角只有约 0.06，要到接近掠射（<10°）才变成镜子。
   * 第一版给了 fres*0.9+0.3 一个 0.3 的下限，等于整片湖都被强制带反射 ——
   * 近处和远处一样亮，水就丢掉了"近处看见水深、远处照出天色"的结构，
   * 整片糊成一块白。
   *
   * 现在: 近岸 ≈ 0（露出深水固有色）→ 远岸掠射 ≈ 0.7（成为明亮的镜面）。
   * 这道"由暗到亮"的横向渐变本身就是湖面最重要的形体语言。
   */
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
  vec3 R = reflect(-V, N);
  vec3 refl = mix(uSkyLo, uSkyHi, clamp(R.y * 1.15 + 0.15, 0.0, 1.0));
  vec3 col = mix(body, refl, clamp(fres * 1.7, 0.0, 0.95));

  /* ---------- 5. 彗星倒影 ----------
   * 用反射向量和"水面指向彗星"的方向做点积，取窄波瓣。
   * pow 指数越高越像镜面；这里叠两层:
   *   窄的一层是彗核的像，宽的一层是尾迹拖出的光雾。
   * uCometOn 为 0 时整项关闭（见 comet.ts 的 SHOW_COMET）。
   */
  vec3 toComet = normalize(uCometPos - vWorld);
  float align = max(dot(R, toComet), 0.0);
  float cometImg = pow(align, 260.0) * 1.5 + pow(align, 42.0) * 0.30;
  col += uCometRefl * cometImg * uCometGlow * uCometOn;

  /* ---------- 6. 星光碎镜面 ----------
   * 门控用 fres（视角）而不是 N.y（法线）。
   *
   * 原来用 smoothstep(0.62,0.99,N.y) —— 那在低角度机位下是对的，
   * 但俯视机位（s4）水面法线全是竖直的，N.y 恒为 1，门控等于全开，
   * 整片湖被碎光糊成一块灰白。
   * 用 fres 门控在物理上也更对: 俯视时 Fresnel≈0，本来就不该看到反射碎光。
   */
  float sp = vnoise(p * 10.0 + vec2(t * 0.55, -t * 0.42));
  sp = pow(sp, 8.0) * 0.85 * smoothstep(0.04, 0.42, fres);
  col += uMirror * sp;

  /* ---------- 7. 水面流动条带 ----------
   * 噪声在 z 方向比 x 方向变化快 → 特征是沿 x 拉长的横向亮纹。
   * 这就是"细碎的镜面反光"的条带状来源。
   */
  float ribbon = vnoise(p * vec2(0.48, 1.38) + vec2(t * 0.38, -t * 0.16));
  ribbon = smoothstep(0.52, 0.96, ribbon) * smoothstep(0.08, 0.5, fres);
  col += uMirror * ribbon * 0.2;

  /* ---------- 8. 岸畔暖色灯影 ----------
   * 半径从 /150 收到 /70、系数从 0.85 降到 0.45。
   * 俯视机位会把整片湖都收进画面，原来那个半径下灯影铺满全湖，
   * 加上深水底色被抬成粉白 —— 现在它只贴在近岸一带。
   */
  float dTown = length(p - uTown);
  float shoreWarm = exp(-dTown * dTown / 70.0);
  float warmBreak = 0.5 + 0.5 * vnoise(p * 1.35 + vec2(0.0, t * 0.06));
  col += uLampRefl * shoreWarm * warmBreak * uLampGlow * 0.45;

  /* ---------- 9. 涟漪高光 ---------- */
  // uRippleCol 是接近白的暖色，系数从 0.34 降到 0.2
  col += uRippleCol * max(ripple, 0.0) * 0.2;

  /* ---------- 10. 岸线薄雾 ---------- */
  float grazing = smoothstep(0.1, 0.95, vDepth);
  float edgeMist = (1.0 - smoothstep(0.5, 1.0, vMask)) * grazing;
  col = mix(col, uHazeColor * 1.7, edgeMist * 0.22);

  /* ---------- 11. 距离雾霭 ---------- */
  float dc = length(cameraPosition - vWorld);
  col = mix(col, uHazeColor, smoothstep(uHazeNear, uHazeFar, dc) * 0.28);

  gl_FragColor = vec4(col, smoothstep(0.03, 0.22, vMask));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const Water: React.FC<{
  /** 已推进到当前帧的时间（秒） */
  time: number;
  comet: CometState;
  lampGlow: number;
}> = ({ time, comet, lampGlow }) => {
  const season = useSeason();
  const geo = useMemo(() => {
    const w = BBOX.maxX - BBOX.minX;
    const d = BBOX.maxZ - BBOX.minZ;
    const g = new THREE.PlaneGeometry(w, d, SEG, SEG);
    g.rotateX(-Math.PI / 2);
    g.translate((BBOX.minX + BBOX.maxX) / 2, 0, (BBOX.minZ + BBOX.maxZ) / 2);

    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const count = pos.count;
    const aMask = new Float32Array(count);
    const aDepth = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      aMask[i] = lakeMask(x, z);
      // 湖底 -4.9，量程 6.2，深浅层次才铺得开
      const depth = WATER_Y - terrainHeight(x, z);
      aDepth[i] = Math.min(1, Math.max(0, depth / 6.2));
      pos.setY(i, WATER_Y);
    }

    g.setAttribute("aMask", new THREE.BufferAttribute(aMask, 1));
    g.setAttribute("aDepth", new THREE.BufferAttribute(aDepth, 1));
    pos.needsUpdate = true;
    g.computeBoundingSphere();
    return g;
  }, []);

  const rippleBuf = useMemo(() => makeRippleBuffer(), []);

  const mat = useMemo(() => {
    const rippleUniform = new Float32Array(RIPPLE_SLOTS * 4);
    return new THREE.ShaderMaterial({
      vertexShader: WATER_VERT,
      fragmentShader: WATER_FRAG,
      uniforms: {
        uTime: { value: 0 },
        /*
         * 季节配色全部先给占位值，真正的颜色在下面的 useLayoutEffect 里每帧写入。
         * 这样切季不用重建材质（重建会丢掉已编译的 shader program）。
         */
        uDeep: { value: new THREE.Color(0xffffff) },
        uMid: { value: new THREE.Color(0xffffff) },
        uShallow: { value: new THREE.Color(0xffffff) },
        uShore: { value: new THREE.Color(0xffffff) },
        uMirror: { value: new THREE.Color(0xffffff) },
        uSkyHi: { value: new THREE.Color(0xffffff) },
        uSkyLo: { value: new THREE.Color(0xffffff) },
        uCometRefl: { value: new THREE.Color(0xffffff) },
        uLampRefl: { value: new THREE.Color(0xffffff) },
        uRippleCol: { value: new THREE.Color(0xffffff) },
        uCometPos: { value: new THREE.Vector3() },
        uCometGlow: { value: 0.6 },
        uCometOn: { value: SHOW_COMET ? 1 : 0 },
        uTown: { value: new THREE.Vector2(TOWN_SHORE.x, TOWN_SHORE.z) },
        uLampGlow: { value: 0.5 },
        uLakeCenter: { value: new THREE.Vector2(LAKE.x, LAKE.z) },
        uHazeColor: { value: new THREE.Color(0xffffff) },
        uHazeNear: { value: 70 },
        uHazeFar: { value: 190 },
        uRipples: { value: rippleUniform },
      },
      transparent: true,
      depthWrite: true,
    });
  }, []);

  useLayoutEffect(() => {
    const u = mat.uniforms;
    u.uTime.value = time;

    // 季节配色: 每帧写一次，切季自动生效，不用重建材质
    const W = season.water;
    (u.uDeep.value as THREE.Color).set(W.deep);
    (u.uMid.value as THREE.Color).set(W.mid);
    (u.uShallow.value as THREE.Color).set(W.shallow);
    (u.uShore.value as THREE.Color).set(W.shore);
    (u.uMirror.value as THREE.Color).set(W.mirror);
    (u.uSkyHi.value as THREE.Color).set(W.skyHi);
    (u.uSkyLo.value as THREE.Color).set(W.skyLo);
    (u.uCometRefl.value as THREE.Color).set(W.cometRefl);
    (u.uLampRefl.value as THREE.Color).set(W.lampRefl);
    (u.uRippleCol.value as THREE.Color).set(W.ripple);
    (u.uHazeColor.value as THREE.Color).set(season.sky.haze);

    // 彗星在天空中的世界坐标 —— 镜面反射直接用它算方向
    (u.uCometPos.value as THREE.Vector3).copy(comet.pos);
    u.uCometGlow.value = 0.35 + comet.glow * 0.85;

    // 落水涟漪
    const n = ripplesAt(time, rippleBuf);
    const arr = u.uRipples.value as Float32Array;
    for (let i = 0; i < RIPPLE_SLOTS; i++) {
      const r = rippleBuf[i];
      arr[i * 4] = r.x;
      arr[i * 4 + 1] = r.z;
      arr[i * 4 + 2] = r.r;
      arr[i * 4 + 3] = i < n ? r.s : 0;
    }
    u.uLampGlow.value = lampGlow * season.lampGlow;
  });

  return <mesh geometry={geo} material={mat} renderOrder={2} />;
};

/** 湖面是否覆盖该点 —— 给码头/小船判断用 */
export function isOnWater(x: number, z: number): boolean {
  return warpedLakeDistance(x, z) < 1.0;
}
