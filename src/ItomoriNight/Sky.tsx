import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildCometSparkSeeds, cometState, SHOW_COMET, type CometState } from "./comet";
import { mulberry32 } from "./math";
import { createSoftGlowMaterial } from "./materials";
import { COMET, STAR } from "./palette";
import { useSeason } from "./SeasonContext";

/**
 * 天空 = 天顶渐变穹顶 + 星空 + 彗星 + 远山云海
 *
 * 所有动画都只由 time（来自 useCurrentFrame）驱动。
 * 这里绝对不能出现任何自走动画 —— 渲染时 frameloop 是 'never'，
 * 靠 Remotion 手动 advance() 逐帧推进，任何 rAF/时钟动画都会闪烁。
 */

const SKY_RADIUS = 900;

// ==================== 天顶渐变穹顶 ====================

const DOME_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const DOME_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uZenith;
uniform vec3 uUpper;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform vec3 uGlowDir;
uniform float uGlowStrength;
uniform vec3 uSunDir;
uniform float uSunStrength;
uniform vec3 uGround;
uniform vec3 uGroundFar;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float y = d.y;

  /*
   * 渐变区间是给黄昏收窄过的。
   * 夜空版本用的是 0~0.17 / 0.15~0.44 / 0.42~0.9 ——
   * 那套区间会把暖橙摊成一大片，天顶永远紫不下去。
   * 现在暖色只占地平线上方很窄的一条，0.26 之后就开始转靛蓝，
   * 才有"夕阳刚沉下去"的那种上紫下橙的层次。
   */
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.09, y));
  col = mix(col, uUpper, smoothstep(0.07, 0.28, y));
  col = mix(col, uZenith, smoothstep(0.26, 0.62, y));

  /*
   * 地平线以下: 由暖紫渐变到深色，而不是一块平黑。
   *
   * 模型是浮在天穹里的，底座四周看到的就是这一片 ——
   * 给平黑会在模型周围切出一条生硬的水平线。
   * 渐变区间也拉长到 y ∈ [-0.34, 0.04]，让过渡足够软。
   */
  float deep = smoothstep(-0.5, 0.0, y);
  vec3 abyss = mix(uGroundFar, uGround, deep);
  float below = 1.0 - smoothstep(-0.34, 0.04, y);
  col = mix(col, abyss, below);

  // 落日方位上的辉光: 天边最亮的那一片暖色
  float sg = pow(clamp(dot(d, normalize(uSunDir)), 0.0, 1.0), 7.0);
  sg *= smoothstep(-0.06, 0.16, y) * (1.0 - smoothstep(0.22, 0.62, y));
  col += uGlow * sg * uSunStrength;

  // 彗星方位上的辉光: 让彗星"扫过天际"有迹可循
  float g = pow(clamp(dot(d, normalize(uGlowDir)), 0.0, 1.0), 5.0);
  g *= smoothstep(-0.05, 0.3, y) * (1.0 - smoothstep(0.35, 0.8, y));
  col += uGlow * g * uGlowStrength;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const SkyDome: React.FC<{ cometDir: THREE.Vector3; glow: number }> = ({
  cometDir,
  glow,
}) => {
  const season = useSeason();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DOME_VERT,
        fragmentShader: DOME_FRAG,
        uniforms: {
          // 季节配色每帧写入，这里只给占位
          uZenith: { value: new THREE.Color(0xffffff) },
          uUpper: { value: new THREE.Color(0xffffff) },
          uMid: { value: new THREE.Color(0xffffff) },
          uHorizon: { value: new THREE.Color(0xffffff) },
          uGlow: { value: new THREE.Color(0xffffff) },
          uGlowDir: { value: new THREE.Vector3(0, 0.3, -1) },
          uGlowStrength: { value: 0.55 },
          uSunDir: { value: new THREE.Vector3(0.42, 0.1, -0.9) },
          uSunStrength: { value: 0.42 },
          uGround: { value: new THREE.Color(0xffffff) },
          uGroundFar: { value: new THREE.Color(0xffffff) },
        },
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );

  const geo = useMemo(() => new THREE.SphereGeometry(SKY_RADIUS, 40, 28), []);

  useLayoutEffect(() => {
    const S = season.sky;
    const u = mat.uniforms;
    (u.uZenith.value as THREE.Color).set(S.zenith);
    (u.uUpper.value as THREE.Color).set(S.upper);
    (u.uMid.value as THREE.Color).set(S.mid);
    (u.uHorizon.value as THREE.Color).set(S.horizon);
    (u.uGlow.value as THREE.Color).set(S.glow);
    (u.uGround.value as THREE.Color).set(S.ground);
    (u.uGroundFar.value as THREE.Color).set(S.groundFar);
    (u.uGlowDir.value as THREE.Vector3).copy(cometDir);
    u.uGlowStrength.value = 0.4 + glow * 0.35;
  });

  return <mesh geometry={geo} material={mat} renderOrder={-10} frustumCulled={false} />;
};

// ==================== 星空 ====================

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aStarTint;
attribute float aPhase;
uniform float uTime;
varying vec3 vC;
varying float vTw;
void main() {
  vC = aStarTint;
  // 每颗星有独立的闪烁相位与频率
  vTw = 0.55 + 0.45 * sin(uTime * 1.1 + aPhase * 43.0) * sin(uTime * 0.37 + aPhase * 17.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (760.0 / max(-mv.z, 1.0));
  gl_Position = projectionMatrix * mv;
}
`;

const STAR_FRAG = /* glsl */ `
precision highp float;
varying vec3 vC;
varying float vTw;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  if (r2 > 0.25) discard;
  float a = pow(smoothstep(0.25, 0.0, r2), 1.6);
  // 黄昏只留稀疏几颗，乘子从 2.0 压到 0.7
  gl_FragColor = vec4(vC * a * vTw * 0.7, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const STAR_COUNT = 2400;

const Stars: React.FC<{ time: number }> = ({ time }) => {
  const geo = useMemo(() => {
    const rand = mulberry32(20240707);
    const pos = new Float32Array(STAR_COUNT * 3);
    const size = new Float32Array(STAR_COUNT);
    const tint = new Float32Array(STAR_COUNT * 3);
    const phase = new Float32Array(STAR_COUNT);

    const c = new THREE.Color();
    // 银河带: 一个倾斜的大圆平面法线
    const bandNormal = new THREE.Vector3(0.32, 0.86, -0.4).normalize();

    let i = 0;
    let guard = 0;
    while (i < STAR_COUNT && guard < STAR_COUNT * 40) {
      guard++;
      // 球面均匀采样
      const u = rand() * 2 - 1;
      const theta = Math.acos(u);
      const phi = rand() * Math.PI * 2;
      const dir = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      );
      if (dir.y < 0.015) continue;

      // 45% 的星聚在银河带附近
      if (rand() < 0.45) {
        const distToBand = Math.abs(dir.dot(bandNormal));
        if (distToBand > 0.16) continue;
      }

      const radius = SKY_RADIUS * (0.62 + rand() * 0.36);
      pos[i * 3] = dir.x * radius;
      pos[i * 3 + 1] = dir.y * radius;
      pos[i * 3 + 2] = dir.z * radius;

      // 少量亮星，大部分是暗星
      const bright = rand();
      size[i] = bright > 0.965 ? 3.2 + rand() * 2.2 : 0.7 + rand() * 1.5;
      phase[i] = rand();

      // 冷白为主，掺一点暖色
      const warm = rand();
      if (warm > 0.9) c.set(STAR.warm);
      else if (warm > 0.62) c.set(STAR.bright);
      else c.set(STAR.dim);
      tint[i * 3] = c.r;
      tint[i * 3 + 1] = c.g;
      tint[i * 3 + 2] = c.b;

      i++;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aStarTint", new THREE.BufferAttribute(tint, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SKY_RADIUS * 1.1);
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useLayoutEffect(() => {
    mat.uniforms.uTime.value = time;
  });

  return <points geometry={geo} material={mat} renderOrder={-8} frustumCulled={false} />;
};

// ==================== 彗尾 ====================

const TAIL_VERT = /* glsl */ `
uniform float uLen;
varying float vAx;
varying float vRad;
varying vec3 vWorld;
varying vec3 vNrm;
void main() {
  // 几何体已经把顶点烘在"锥尖在原点、尾巴沿 +X"的位置
  vAx = clamp(position.x / uLen, 0.0, 1.0);
  vRad = length(position.yz);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNrm = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const TAIL_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uGlow;
uniform float uOpacity;
uniform float uTime;
uniform float uPowder;
varying float vAx;
varying float vRad;
varying vec3 vWorld;
varying vec3 vNrm;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
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
  // 体积感: 正对相机的部分最亮，侧掠的部分淡出
  vec3 N = normalize(vNrm);
  vec3 V = normalize(cameraPosition - vWorld);
  float face = clamp(dot(N, V), 0.0, 1.0);
  float soft = pow(face, 1.25);

  // 从头到尾渐隐
  float fade = pow(1.0 - vAx, 1.5);
  // 头部的实心亮芯
  float core = pow(1.0 - vAx, 6.0);

  /*
   * 粉状发光: 两层不同频率的噪声叠加。
   * 这里用 (轴向, 径向) 而不是 uv 当噪声坐标 ——
   * 圆锥的 uv.x 是环绕的，用 uv 会在接缝处出现一条明显的裂缝。
   */
  float n =
    vnoise(vec2(vAx * 14.0 - uTime * 0.28, vRad * 0.42)) * 0.62 +
    vnoise(vec2(vAx * 38.0 - uTime * 0.71, vRad * 1.15)) * 0.38;
  float grain = mix(1.0, 0.35 + 0.65 * n * n, uPowder);

  float a = (fade * 0.62 + core * 0.85) * soft * grain * uOpacity;
  vec3 col = mix(uColor, uCoreColor, core);
  gl_FragColor = vec4(col * uGlow * (0.75 + core * 1.8), a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** 把圆锥烘成"锥尖在原点、尾巴沿 +X 伸出 len" */
function tailCone(len: number, radius: number, seg = 26): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(radius, len, seg, 1, true);
  // 绕 Z 转 +90°: +Y → -X，于是锥尖到 -X、底面到 +X
  g.rotateZ(Math.PI / 2);
  // 再沿 +X 平移 len/2: 锥尖落到原点，底面落到 +len
  g.translate(len / 2, 0, 0);
  return g;
}

const TAIL_LEN = 170;
const TAIL_RADIUS = 16;

const CometTails: React.FC<{ comet: CometState; time: number }> = ({ comet, time }) => {
  const geo = useMemo(() => tailCone(TAIL_LEN, TAIL_RADIUS), []);

  const makeMat = (color: string, coreColor: string, opacity: number, powder: number) =>
    new THREE.ShaderMaterial({
      vertexShader: TAIL_VERT,
      fragmentShader: TAIL_FRAG,
      uniforms: {
        uLen: { value: TAIL_LEN },
        uColor: { value: new THREE.Color(color) },
        uCoreColor: { value: new THREE.Color(coreColor) },
        uGlow: { value: 1 },
        uOpacity: { value: opacity },
        uPowder: { value: powder },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

  const matA = useMemo(() => makeMat(COMET.tailA, COMET.head, 0.85, 0.72), []);
  const matB = useMemo(() => makeMat(COMET.tailB, COMET.head, 0.7, 0.85), []);

  useLayoutEffect(() => {
    const g = comet.glow;
    matA.uniforms.uGlow.value = g * 1.05;
    matB.uniforms.uGlow.value = g * 0.92;
    matA.uniforms.uTime.value = time;
    matB.uniforms.uTime.value = time;
  });

  // 分裂角度: 从 0 张到 ±9°
  const spread = comet.split * 0.16;

  return (
    <>
      <mesh geometry={geo} material={matA} rotation={[0, 0, spread]} />
      <mesh geometry={geo} material={matB} rotation={[0, 0, -spread * 1.35]} />
    </>
  );
};

// ==================== 彗尾碎光 ====================

const SPARK_VERT = /* glsl */ `
attribute float aAlong;
attribute float aLat;
attribute float aVert;
attribute float aPhase;
attribute float aSpeed;
attribute float aSize;
uniform float uTime;
uniform float uLen;
uniform float uRadius;
varying float vAlpha;

void main() {
  float t = clamp(aAlong, 0.0, 1.4);
  float r = uRadius * min(t, 1.0);
  // 缓缓下坠，落到尾端就淡出
  float fall = fract(aPhase + uTime * aSpeed * 0.055);

  vec3 p;
  p.x = t * uLen;
  p.y = aVert * r - fall * 30.0 + sin(uTime * 0.26 + aPhase * 31.0) * 1.8;
  p.z = aLat * r;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * (620.0 / max(-mv.z, 1.0));
  gl_Position = projectionMatrix * mv;

  vAlpha =
    smoothstep(0.0, 0.12, t) *
    (1.0 - smoothstep(0.82, 1.0, t)) *
    (1.0 - fall * fall);
}
`;

const SPARK_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uGlow;
varying float vAlpha;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  if (r2 > 0.25) discard;
  float a = pow(smoothstep(0.25, 0.0, r2), 1.8) * vAlpha;
  gl_FragColor = vec4(uColor * uGlow * a * 2.4, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const CometSparks: React.FC<{ comet: CometState; time: number }> = ({ comet, time }) => {
  const geo = useMemo(() => {
    const seeds = buildCometSparkSeeds(mulberry32(90210));
    const n = seeds.length;
    const pos = new Float32Array(n * 3); // 位置全部在顶点着色器里算，这里占位
    const aAlong = new Float32Array(n);
    const aLat = new Float32Array(n);
    const aVert = new Float32Array(n);
    const aPhase = new Float32Array(n);
    const aSpeed = new Float32Array(n);
    const aSize = new Float32Array(n);
    seeds.forEach((s, i) => {
      aAlong[i] = s.along;
      aLat[i] = s.lateral;
      aVert[i] = s.vertical;
      aPhase[i] = s.phase;
      aSpeed[i] = s.speed;
      aSize[i] = s.size;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aAlong", new THREE.BufferAttribute(aAlong, 1));
    g.setAttribute("aLat", new THREE.BufferAttribute(aLat, 1));
    g.setAttribute("aVert", new THREE.BufferAttribute(aVert, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(aPhase, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(aSpeed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1200);
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SPARK_VERT,
        fragmentShader: SPARK_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uLen: { value: TAIL_LEN },
          uRadius: { value: TAIL_RADIUS },
          uColor: { value: new THREE.Color(COMET.spark) },
          uGlow: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useLayoutEffect(() => {
    mat.uniforms.uTime.value = time;
    mat.uniforms.uGlow.value = comet.glow;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

// ==================== 彗星整体 ====================

const _xAxis = new THREE.Vector3();
const _yAxis = new THREE.Vector3();
const _zAxis = new THREE.Vector3();
const _basis = new THREE.Matrix4();

/**
 * 把局部坐标系对到彗星的尾巴方向上:
 *   局部 +X → 尾巴伸出的方向（运动方向的反向）
 *   局部 +Y → 世界"上"在垂直于尾巴的平面上的投影
 *   局部 +Z → 侧向
 * 这样两条尾巴绕局部 Z 轴一正一负旋转，就会在竖直平面里上下分开。
 */
function cometBasis(comet: CometState, out: THREE.Quaternion): THREE.Quaternion {
  _xAxis.copy(comet.dir).multiplyScalar(-1).normalize();
  _yAxis.set(0, 1, 0).addScaledVector(_xAxis, -_xAxis.y).normalize();
  _zAxis.crossVectors(_xAxis, _yAxis).normalize();
  _basis.makeBasis(_xAxis, _yAxis, _zAxis);
  return out.setFromRotationMatrix(_basis);
}

export const Comet: React.FC<{ comet: CometState; time: number }> = ({ comet, time }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreMat = useMemo(
    () => createSoftGlowMaterial(COMET.head, 1.6, 1.9, 1),
    [],
  );
  const haloMat = useMemo(
    () => createSoftGlowMaterial(COMET.halo, 0.5, 1.25, 1),
    [],
  );
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 3), []);
  const haloGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const _quat = useRef(new THREE.Quaternion());

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (g) {
      g.position.copy(comet.pos);
      g.quaternion.copy(cometBasis(comet, _quat.current));
    }
    coreMat.uniforms.uIntensity.value = 1.3 * comet.glow;
    haloMat.uniforms.uIntensity.value = 0.42 * comet.glow;
  });

  // 彗核在 540 单位外，5.5 半径只能换到 ~12px，撑不起"主角"的分量
  const coreR = 7;
  const haloR = 30;

  return (
    <group ref={groupRef}>
      <CometTails comet={comet} time={time} />
      <CometSparks comet={comet} time={time} />
      {/* 彗核 */}
      <mesh geometry={coreGeo} material={coreMat} scale={coreR} renderOrder={5} />
      {/* 核外光晕 */}
      <mesh geometry={haloGeo} material={haloMat} scale={haloR} renderOrder={4} />
    </group>
  );
};

// ==================== 山脊云海 ====================

const CLOUD_VERT = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const CLOUD_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uOpacity;
/** 雾带的中心半径与宽度（沿"方形半径"度量，见下） */
uniform float uRingR;
uniform float uRingW;
uniform vec3 uLo;
uniform vec3 uHi;
varying vec3 vWorld;

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
  /*
   * 用"方形半径" max(|x|,|z|) 而不是 length(xz)。
   *
   * 这里的环形山脊是沿底座方块边缘成环的（高度场里用的就是 squareRadius），
   * 圆形半径会让雾带在轴向正好贴着山脊、到对角线却掉进山脊内侧，
   * 看起来像一圈套歪了的橡皮筋。方形半径才能和山脊严丝合缝。
   */
  float sr = max(abs(vWorld.x), abs(vWorld.z));

  // 径向高斯: 云只可能出现在山脊那一圈，湖面上方天然是干净的
  float band = exp(-pow(abs((sr - uRingR) / uRingW), 2.0));

  /*
   * 噪声频率按场景尺度换算过。
   * 参考实现的湖半径约 7、山脊半径约 7；我这里湖半径约 17、山脊约 35，
   * 尺度差 2.5~5 倍，频率要跟着降，否则云会碎成细渣而不是大团。
   */
  float n = vnoise(vWorld.xz * 0.13 + vec2(uTime * 0.012, uTime * 0.008)) * 0.6
          + vnoise(vWorld.xz * 0.32 - vec2(uTime * 0.02, 0.0)) * 0.4;

  float a = band * smoothstep(0.34, 0.84, n) * uOpacity;
  if (a < 0.006) discard;

  // mix(暗蓝, 近白, n) —— 云因此自带"顶部受光、底部背光"的内部结构，
  // 单一色 + alpha 的云看起来就是一块塑料膜
  vec3 c = mix(uLo, uHi, n);
  gl_FragColor = vec4(c, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

interface CloudLayer {
  y: number;
  ringR: number;
  ringW: number;
  opacity: number;
}

/**
 * 两层雾: 低的一层沉在街面高度，高的一层挂在山肩。
 *
 * 高度是校过的 —— 小镇架在陨石坑边缘上（屋脊大约在 y=8~18），
 * 第一版把低层放在 13.5，雾带正好横着切过屋群，把整座町洗白了。
 * 现在低层压到 9（读起来是街上的一层地雾）、高层抬到 20（过了屋脊），
 * 中间那一段留给小镇的灯火。
 */
const CLOUD_LAYERS: CloudLayer[] = [
  { y: 9.0, ringR: 33, ringW: 7.5, opacity: 0.42 },
  { y: 20.0, ringR: 38, ringW: 9.5, opacity: 0.3 },
];

const CloudSea: React.FC<{ time: number }> = ({ time }) => {
  const season = useSeason();
  /*
   * 几何体用一张大平面就够 —— 真正决定"云在哪"的是着色器里那个径向高斯，
   * 平面只负责铺满可能的范围。用 RingGeometry 反而会和方形雾带错位。
   */
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(116, 116);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const mats = useMemo(
    () =>
      CLOUD_LAYERS.map(
        (l) =>
          new THREE.ShaderMaterial({
            vertexShader: CLOUD_VERT,
            fragmentShader: CLOUD_FRAG,
            uniforms: {
              uTime: { value: 0 },
              uOpacity: { value: l.opacity },
              uRingR: { value: l.ringR },
              uRingW: { value: l.ringW },
              // 云海在黄昏是"顶被夕阳照亮、底还在紫影里"
              uLo: { value: new THREE.Color("#7a5f96") },
              uHi: { value: new THREE.Color("#ffc79a") },
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [],
  );

  useLayoutEffect(() => {
    // 云量按季节缩放: 冬天云低而厚，春天薄
    for (let i = 0; i < mats.length; i++) {
      mats[i].uniforms.uTime.value = time;
      mats[i].uniforms.uOpacity.value = CLOUD_LAYERS[i].opacity * season.cloudOpacity;
    }
  });

  return (
    <>
      {CLOUD_LAYERS.map((l, i) => (
        <mesh key={i} geometry={geo} material={mats[i]} position={[0, l.y, 0]} renderOrder={3} />
      ))}
    </>
  );
};

// ==================== 导出 ====================

export const Sky: React.FC<{ progress: number; time: number }> = ({
  progress,
  time,
}) => {
  const comet = useMemo(() => cometState(progress), [progress]);
  // 彗星在天空里的方向（从原点看出去的方位）
  const cometDir = useMemo(() => comet.pos.clone().normalize(), [comet]);

  return (
    <>
      {/* 落日方位固定朝 -Z 偏 +X；彗星关掉时穹顶辉光就不再跟着它跑 */}
      <SkyDome
        cometDir={SHOW_COMET ? cometDir : new THREE.Vector3(0.42, 0.12, -0.9).normalize()}
        glow={SHOW_COMET ? comet.glow : 0.8}
      />
      <Stars time={time} />
      <CloudSea time={time} />
      {SHOW_COMET ? <Comet comet={comet} time={time} /> : null}
    </>
  );
};

export { cometState };
