import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { ALCOVE, HILL, SHRINE, forestCover, scatter, terrainHeight, terrainSlope } from "./layout";
import { SHRINE as SHRINE_PAL } from "./palette";
import { cone, cylinder, mergeParts, mulberry32, xf, type Part } from "./math";
import { createOutlineMaterial, type SceneMaterials } from "./materials";
import { useSeason } from "./SeasonContext";
import type { SeasonPreset } from "./seasons";

/**
 * 森林 / 御神木 / 季节粒子 / 山脊裸岩
 *
 * 树形只有两种:
 *   conifer  塔状针叶（夏、冬）
 *   broadleaf 团状阔叶（春樱、秋红）
 * 四季的差别只在配色、雪盖和粒子 —— 所以不是四套树，是两套形状 × 四套配色。
 *
 * 整片林合并成 1 个 draw call。刻意**不给远景林描边** ——
 * 上千个小圆锥做反向壳会在轮廓上炸成一团噪点，
 * 而且日式动画背景里远景树本来也不勾线。
 */

// ==================== 单棵树 ====================

/**
 * 树叶团。
 *
 * 试过两版:
 *   二十面体 detail=1: 240 顶点/团，3 团就是 720 顶点/棵 —— 2200 棵下来 158 万顶点，太重
 *   八面体: 只有 24 顶点，但 8 个面太棱角，渲出来是一堆水晶而不是叶子
 * 折中: 二十面体 detail=0，60 顶点 / 20 个面，圆度够、成本可接受。
 * 团数也降到 6 —— 靠重叠而不是靠数量去成团。
 */
const BLOB = () => new THREE.IcosahedronGeometry(1, 0);

/**
 * 树的密度。
 *
 * 阔叶季只留 150 棵 —— 这是做了对照实验之后的结论。
 * 之前从 1200 → 950 → 750 → 550 一路降，画面完全看不出区别，
 * 因为前景那几棵离相机只有二三十单位，**数量多少不影响近处那几棵的大小**。
 * 把树全部关掉之后画面立刻干净了，说明问题就是树本身占的画面比例太大。
 * 所以这次直接压到数量级以下，让地形成为主体、树成为点缀。
 */
const TREE_COUNT_CONIFER = 1600;
const TREE_COUNT_BROADLEAF = 150;

function treeParts(season: SeasonPreset, rand: () => number): Part[] {
  const F = season.forest;
  const lean = (rand() - 0.5) * 0.12;
  const parts: Part[] = [];

  // 树干
  parts.push({
    geo: cylinder(0.03, 0.045, 0.34, 5),
    color: F.trunk,
    matrix: xf({ pos: [0, 0.17, 0], rot: [lean * 0.4, 0, lean] }),
  });

  if (F.shape === "conifer") {
    // 塔状针叶: 三层圆锥，下深上浅
    const layers: [number, number, number, string][] = [
      [0.33, 0.46, 0.3, F.canopyA],
      [0.25, 0.42, 0.53, F.canopyB],
      [0.15, 0.36, 0.74, F.canopyC],
    ];
    for (const [r, h, y, color] of layers) {
      parts.push({
        geo: cone(r, h, 6),
        color,
        matrix: xf({ pos: [lean * y, y + h * 0.5, 0] }),
      });
      /*
       * 冬季雪盖: 每层锥体的上缘再压一个扁的白锥。
       * 只把顶层染白是不够的 —— 雪压松的读法是每一层枝上都积着雪。
       */
      if (F.snowCap) {
        parts.push({
          geo: cone(r * 0.82, h * 0.42, 6),
          color: season.terrain.snow,
          matrix: xf({ pos: [lean * y, y + h * 0.72, 0] }),
        });
      }
    }
  } else {
    /*
     * 阔叶: **窄柱状**，不是宽伞。
     *
     * 这是从冬天学来的。四个季节里只有冬天不糊，差别不在配色而在树形:
     *   针叶树又窄又深  → 每棵的轮廓都分得开
     *   阔叶原来冠幅接近高度的一半 → 相邻的树一重叠就糊成一整块色块
     * 试过缩尺寸、降密度、加深固有色，都没用 ——
     * 只要冠幅宽，近处那几棵就必然连成一片。
     *
     * 所以保留阔叶的团状质感（小球堆），但把轮廓收窄到冠幅≈高度的三成。
     * 颜色按"深色主体 + 小面积亮点"排:
     *   底层面积最大 → 最深的 canopyA
     *   顶部那一小团 → 最亮的 canopyC（它在冬天对应的就是那块雪）
     */
    const layers: [number, number, number, string][] = [
      // [高度, 团半径, 环半径, 颜色]
      [0.38, 0.145, 0.062, F.canopyA],
      [0.54, 0.125, 0.055, F.canopyB],
      [0.69, 0.1, 0.045, F.canopyB],
    ];
    for (let li = 0; li < layers.length; li++) {
      const [y, r, rr, color] = layers[li];
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + li * 0.9;
        parts.push({
          geo: BLOB(),
          color,
          matrix: xf({
            pos: [Math.cos(a) * rr + lean * y, y, Math.sin(a) * rr],
            scale: [r, r * 0.82, r],
          }),
        });
      }
    }
    // 中心补一团避免空心
    parts.push({
      geo: BLOB(),
      color: F.canopyB,
      matrix: xf({ pos: [lean * 0.46, 0.46, 0], scale: [0.12, 0.11, 0.12] }),
    });
    // 顶部的小亮团 —— 对应冬天松树顶上那块雪
    parts.push({
      geo: BLOB(),
      color: F.canopyC,
      matrix: xf({ pos: [lean * 0.82, 0.82, 0], scale: [0.085, 0.075, 0.085] }),
    });
  }

  return parts;
}

// ==================== 松林 ====================

function buildForest(season: SeasonPreset): THREE.BufferGeometry {
  const count =
    season.forest.shape === "conifer" ? TREE_COUNT_CONIFER : TREE_COUNT_BROADLEAF;

  const spots = scatter({
    cx: 0,
    cz: 0,
    radius: 49,
    count,
    seed: 424242,
    accept: (x, z) => {
      const cover = forestCover(x, z);
      if (cover < 0.18) return 0;
      return cover;
    },
  });

  const template = treeParts(season, mulberry32(7));
  const rand = mulberry32(31337);
  const parts: Part[] = [];

  for (const s of spots) {
    const cover = s.w;
    /*
     * 树体尺寸。
     * 阔叶再砍一半: au1 那种机位离前景的树只有二三十单位，
     * 5~6 单位的树会直接糊满下半幅画面。压到 3 单位左右才留得住地平线。
     */
    const h =
      season.forest.shape === "conifer"
        ? 2.2 + cover * 3.0 + rand() * 2.2
        : 1.4 + cover * 1.3 + rand() * 1.0;
    const w = h * (0.82 + rand() * 0.4);
    const rotY = rand() * Math.PI * 2;
    for (const t of template) {
      parts.push({
        geo: t.geo,
        color: t.color,
        matrix: xf({
          pos: [s.x, s.y - 0.15, s.z],
          rot: [0, rotY, 0],
          scale: [w, h, w],
        }),
      });
    }
  }

  return mergeParts(parts);
}

// ==================== 御神木 ====================

interface SacredSpec {
  x: number;
  z: number;
  h: number;
  seed: number;
}

const SACRED_TREES: SacredSpec[] = [
  { x: 5.0, z: -12.0, h: 15, seed: 11 },
  { x: 13.5, z: -10.5, h: 17, seed: 23 },
  { x: 3.0, z: -16.5, h: 14, seed: 37 },
  { x: 17.0, z: -18.0, h: 13, seed: 51 },
  { x: -16.0, z: -16.0, h: 12, seed: 67 },
];

const SacredTree: React.FC<{ spec: SacredSpec; mat: SceneMaterials }> = ({ spec, mat }) => {
  const season = useSeason();
  const y = terrainHeight(spec.x, spec.z);

  const body = useMemo(() => {
    const F = season.forest;
    const rand = mulberry32(spec.seed);
    const h = spec.h;
    const parts: Part[] = [];

    parts.push({
      geo: cylinder(0.16, 0.34, h * 0.62, 7),
      color: F.trunkSacred,
      matrix: xf({ pos: [0, h * 0.31, 0] }),
    });
    parts.push({
      geo: cylinder(0.1, 0.18, h * 0.3, 6),
      color: F.trunkSacred,
      matrix: xf({ pos: [h * 0.02, h * 0.76, 0], rot: [0, 0, 0.07] }),
    });

    // 树冠: 五层伞盖。针叶用圆锥，阔叶用球
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const r = (1.9 - t * 1.25) * (0.85 + rand() * 0.3);
      const ch = 1.5 - t * 0.55;
      const cy = h * (0.5 + t * 0.44);
      const color = i >= 3 ? F.canopyC : i >= 1 ? F.canopyB : F.canopyA;
      parts.push({
        geo: F.shape === "conifer" ? cone(r, ch, 7) : BLOB(),
        color,
        matrix: xf({
          pos: [(rand() - 0.5) * 0.7, cy, (rand() - 0.5) * 0.7],
          scale: F.shape === "conifer" ? 1 : [r, r * 0.85, r],
          rot: [(rand() - 0.5) * 0.16, rand() * 3.1, (rand() - 0.5) * 0.16],
        }),
      });
    }

    // 缠在树干上的注连绳
    const ropeY = h * 0.42;
    parts.push({
      geo: new THREE.TorusGeometry(0.42, 0.07, 5, 14),
      color: SHRINE_PAL.rope,
      matrix: xf({ pos: [0, ropeY, 0], rot: [Math.PI / 2, 0, 0] }),
    });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3;
      parts.push({
        geo: new THREE.PlaneGeometry(0.16, 0.34),
        color: SHRINE_PAL.paper,
        matrix: xf({
          pos: [Math.cos(a) * 0.42, ropeY - 0.22, Math.sin(a) * 0.42],
          rot: [0, -a, 0],
        }),
      });
    }

    return mergeParts(parts);
  }, [spec.seed, spec.h, season]);

  return (
    <group position={[spec.x, y, spec.z]}>
      <mesh geometry={body} material={mat.foliage} />
      <mesh geometry={body} material={mat.outlineFine} />
    </group>
  );
};

// ==================== 季节粒子 ====================

/**
 * 一套粒子系统跑四季:
 *   春 = 樱花花瓣（椭圆、翻转、缓慢横飘）
 *   秋 = 落叶（同形，橙红、飘得更稳）
 *   冬 = 雪（圆形、小而密、飘得慢）
 *   夏 = 用下面的萤火（发光、忽明忽暗、原地游移），形态完全不同所以单独一套
 *
 * 形状靠 gl_PointCoord 里做旋转椭圆实现 —— 比给每片花瓣做四边形省得多，
 * 而且花瓣本来就是薄片，不需要真实的朝向。
 */
const FALL_VERT = /* glsl */ `
attribute vec3 aAnchor;
attribute float aPhase;
attribute float aSpeed;
attribute float aSway;
attribute float aSize;
attribute float aAngle;
uniform float uTime;
uniform float uFall;
uniform float uSize;
varying float vAngle;

void main() {
  // 竖直方向循环下落
  float span = 52.0;
  float y = aAnchor.y + 26.0 - mod(uTime * aSpeed * uFall * 2.4 + aPhase * span, span);

  vec3 p = vec3(
    aAnchor.x + sin(uTime * 0.6 + aPhase * 31.0) * aSway,
    y,
    aAnchor.z + cos(uTime * 0.45 + aPhase * 17.0) * aSway
  );

  vAngle = aAngle + uTime * aSpeed * 1.7;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * uSize * (150.0 / max(-mv.z, 1.0));
  gl_Position = projectionMatrix * mv;
}
`;

const FALL_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uColor2;
/** 椭圆半轴: 花瓣/叶子是 (0.15,0.3)，雪是 (0.26,0.26) */
uniform vec2 uShape;
varying float vAngle;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float c = cos(vAngle);
  float s = sin(vAngle);
  vec2 r = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
  vec2 e = r / uShape;
  float q = dot(e, e);
  if (q > 1.0) discard;
  float a = 1.0 - q * 0.5;
  // 沿片子的长短轴做一点明暗，让薄片看起来有正反面
  vec3 col = mix(uColor, uColor2, gl_PointCoord.y);
  gl_FragColor = vec4(col, a * 0.95);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const FALL_COUNT = 460;

const FallingParticles: React.FC<{ time: number }> = ({ time }) => {
  const season = useSeason();
  const mode = season.particles;

  const geo = useMemo(() => {
    const r = mulberry32(771103);
    const n = FALL_COUNT;
    const pos = new Float32Array(n * 3);
    const anchor = new Float32Array(n * 3);
    const phase = new Float32Array(n);
    const speed = new Float32Array(n);
    const sway = new Float32Array(n);
    const size = new Float32Array(n);
    const angle = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      anchor[i * 3] = (r() * 2 - 1) * 46;
      anchor[i * 3 + 1] = 0;
      anchor[i * 3 + 2] = (r() * 2 - 1) * 46;
      phase[i] = r();
      speed[i] = 0.5 + r() * 1.1;
      sway[i] = 1.2 + r() * 3.4;
      size[i] = 0.75 + r() * 1.1;
      angle[i] = r() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aAnchor", new THREE.BufferAttribute(anchor, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aSway", new THREE.BufferAttribute(sway, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 900);
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FALL_VERT,
        fragmentShader: FALL_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0xffffff) },
          uColor2: { value: new THREE.Color(0xffffff) },
          uShape: { value: new THREE.Vector2(0.16, 0.3) },
          uFall: { value: 1 },
          uSize: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useLayoutEffect(() => {
    const u = mat.uniforms;
    u.uTime.value = time;
    (u.uColor.value as THREE.Color).set(season.particleColor);
    (u.uColor2.value as THREE.Color).set(season.particleColor2);
    u.uFall.value = season.particleFall;
    u.uSize.value = season.particleSize;
    // 雪是圆的，花瓣/落叶是拉长的薄片
    (u.uShape.value as THREE.Vector2).set(
      mode === "snow" ? 0.26 : 0.16,
      mode === "snow" ? 0.26 : 0.3,
    );
  });

  if (mode !== "petal" && mode !== "leaf" && mode !== "snow") return null;

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />;
};

// ==================== 萤火（夏）====================

const FIREFLY_VERT = /* glsl */ `
attribute float aPhase;
attribute float aSpeed;
attribute float aSize;
attribute vec3 aAnchor;
attribute vec3 aDrift;
uniform float uTime;
varying float vGlow;

void main() {
  vec3 p = aAnchor;
  p.x += sin(uTime * aSpeed * 0.30 + aPhase * 6.28) * aDrift.x;
  p.y += sin(uTime * aSpeed * 0.21 + aPhase * 9.42) * aDrift.y + aDrift.y * 0.3 * sin(uTime * 0.13);
  p.z += cos(uTime * aSpeed * 0.26 + aPhase * 4.71) * aDrift.z;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * (150.0 / max(-mv.z, 1.0));
  gl_Position = projectionMatrix * mv;

  // 忽明忽暗: 四次方把正弦削成"长时间暗、短促地亮一下"
  float f = 0.5 + 0.5 * sin(uTime * (0.55 + aSpeed * 0.9) + aPhase * 31.4);
  vGlow = pow(f, 4.0);
}
`;

const FIREFLY_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vGlow;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  if (r2 > 0.25) discard;
  float a = pow(smoothstep(0.25, 0.0, r2), 1.7) * vGlow;
  gl_FragColor = vec4(uColor * a * 1.6, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const FIREFLY_COUNT = 130;

const Fireflies: React.FC<{ time: number }> = ({ time }) => {
  const season = useSeason();
  const geo = useMemo(() => {
    const rand = mulberry32(20240808);
    const n = FIREFLY_COUNT;
    const pos = new Float32Array(n * 3);
    const anchor = new Float32Array(n * 3);
    const drift = new Float32Array(n * 3);
    const phase = new Float32Array(n);
    const speed = new Float32Array(n);
    const size = new Float32Array(n);

    let i = 0;
    let guard = 0;
    while (i < n && guard < n * 60) {
      guard++;
      const x = (rand() * 2 - 1) * 44;
      const z = (rand() * 2 - 1) * 44;
      const cover = forestCover(x, z);
      const h = terrainHeight(x, z);
      if (h < 1.6) continue;
      const nearRavine = Math.hypot(x + 30, z + 4) < 22 ? 0.55 : 0;
      const w = cover * 0.75 + nearRavine + 0.1;
      if (rand() > w) continue;

      anchor[i * 3] = x;
      anchor[i * 3 + 1] = h + 0.8 + rand() * 4.5;
      anchor[i * 3 + 2] = z;
      drift[i * 3] = 1.6 + rand() * 3.4;
      drift[i * 3 + 1] = 0.8 + rand() * 2.2;
      drift[i * 3 + 2] = 1.6 + rand() * 3.4;
      phase[i] = rand();
      speed[i] = 0.5 + rand() * 1.3;
      size[i] = 1.0 + rand() * 1.4;
      i++;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aAnchor", new THREE.BufferAttribute(anchor, 3));
    g.setAttribute("aDrift", new THREE.BufferAttribute(drift, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FIREFLY_VERT,
        fragmentShader: FIREFLY_FRAG,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useLayoutEffect(() => {
    mat.uniforms.uTime.value = time;
    (mat.uniforms.uColor.value as THREE.Color).set(season.particleColor);
  });

  if (season.particles !== "firefly") return null;

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={3} />;
};

// ==================== 山脊裸岩 ====================

const RIDGE_ROCK_SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

const RidgeRocks: React.FC<{ mat: SceneMaterials }> = ({ mat }) => {
  const season = useSeason();

  const geo = useMemo(() => {
    const rand = mulberry32(6060);
    const parts: Part[] = [];
    const base = new THREE.IcosahedronGeometry(1, 1);
    const T = season.terrain;

    const alcoveAz = Math.atan2(ALCOVE.z - HILL.z, ALCOVE.x - HILL.x);

    for (let i = 0; i < 90; i++) {
      const a = rand() * Math.PI * 2;
      const diff = Math.abs(((a - alcoveAz + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (diff < 0.8) continue;

      const ringR = HILL.r * (0.42 + rand() * 0.2);
      const x = HILL.x + Math.cos(a) * ringR;
      const z = HILL.z + Math.sin(a) * ringR;
      const y = terrainHeight(x, z);
      const s = 0.5 + rand() * 1.0;

      parts.push({
        geo: base,
        color: rand() > 0.55 ? T.rock : T.rockDark,
        matrix: xf({
          pos: [x, y + s * 0.12, z],
          rot: [rand() * 3.14, rand() * 3.14, rand() * 3.14],
          scale: [s, s * (0.35 + rand() * 0.3), s * (0.8 + rand() * 0.5)],
        }),
      });
    }

    for (const seed of RIDGE_ROCK_SEEDS) {
      const rr = mulberry32(seed * 977);
      const a = rr() * Math.PI * 2;
      const x = SHRINE.x + Math.cos(a) * (7 + rr() * 5);
      const z = SHRINE.z + Math.sin(a) * (6 + rr() * 5);
      const y = terrainHeight(x, z);
      const s = 0.7 + rr() * 1.7;
      parts.push({
        geo: base,
        color: T.rock,
        matrix: xf({
          pos: [x, y + s * 0.25, z],
          rot: [rr() * 3.14, rr() * 3.14, rr() * 3.14],
          scale: [s, s * 0.7, s],
        }),
      });
    }

    return mergeParts(parts);
    // 季节变了要重建: 岩石颜色是按季节烘进顶点色的
  }, [season]);

  const outlineMat = useMemo(() => createOutlineMaterial(0.0009), []);

  return (
    <>
      <mesh geometry={geo} material={mat.rock} />
      <mesh geometry={geo} material={outlineMat} />
    </>
  );
};

// ==================== 导出 ====================

export const Forest: React.FC<{ mat: SceneMaterials; time: number }> = ({ mat, time }) => {
  const season = useSeason();
  // 树形和配色都烘进了几何，所以季节变了必须重建
  const forestGeo = useMemo(() => buildForest(season), [season]);
  const hasTrees = forestGeo.getAttribute("position")?.count > 0;

  return (
    <>
      {hasTrees ? <mesh geometry={forestGeo} material={mat.foliage} /> : null}
      {SACRED_TREES.map((s) => (
        <SacredTree key={s.seed} spec={s} mat={mat} />
      ))}
      <Fireflies time={time} />
      <FallingParticles time={time} />
      <RidgeRocks mat={mat} />
    </>
  );
};

/** 松林是否覆盖该点 —— 给其它模块判断用 */
export function isForested(x: number, z: number): boolean {
  return forestCover(x, z) > 0.35 && terrainSlope(x, z) < 0.5;
}
