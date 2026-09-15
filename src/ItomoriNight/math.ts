import * as THREE from "three";

/**
 * 确定性随机 / 噪声 / 几何工具
 *
 * 这里所有随机数都必须是确定性的:
 * Remotion 渲染会把帧区间分给多个 Chrome 实例并行渲染，
 * 如果用 Math.random()，不同实例会得到不同的地形/房屋布局，
 * 拼接起来就会出现接缝处的突变。所以一律走种子 PRNG。
 */

// ==================== 确定性随机 ====================

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 基于整数坐标的哈希，返回 [0,1) */
export function hash2i(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iy | 0, 0x165667b1);
  h = h ^ Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ==================== 数值工具 ====================

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** smootherstep — 地形过渡更柔和 */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** 确定性的一维"时间哈希"，用于窗灯次第明灭这类离散事件 */
export function hashTime(seed: number, slot: number): number {
  return hash2i(seed, slot, 0x5bf03635);
}

// ==================== 噪声 ====================

/** 二维值噪声 */
export function valueNoise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const a = hash2i(xi, yi, seed);
  const b = hash2i(xi + 1, yi, seed);
  const c = hash2i(xi, yi + 1, seed);
  const d = hash2i(xi + 1, yi + 1, seed);

  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

/** 分形叠加噪声，返回 [0,1] */
export function fbm2(
  x: number,
  y: number,
  octaves: number,
  seed: number,
  lacunarity = 2.0,
  gain = 0.5,
): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * freq, y * freq, seed + i * 131);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/** 山脊噪声 — 用来做尖锐的山脊线，返回 [0,1] */
export function ridgedFbm2(
  x: number,
  y: number,
  octaves: number,
  seed: number,
): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise2(x * freq, y * freq, seed + i * 197);
    const r = 1 - Math.abs(n * 2 - 1);
    sum += amp * r * r;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

// ==================== 几何工具 ====================

export interface XfOpts {
  pos?: [number, number, number];
  /** 欧拉角，弧度 */
  rot?: [number, number, number];
  scale?: [number, number, number] | number;
}

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

/** 组装一个变换矩阵 */
export function xf(opts: XfOpts = {}): THREE.Matrix4 {
  const p = opts.pos ?? [0, 0, 0];
  const r = opts.rot ?? [0, 0, 0];
  const sc = opts.scale ?? 1;
  _p.set(p[0], p[1], p[2]);
  _e.set(r[0], r[1], r[2], "YXZ");
  _q.setFromEuler(_e);
  if (typeof sc === "number") _s.set(sc, sc, sc);
  else _s.set(sc[0], sc[1], sc[2]);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

export interface Part {
  geo: THREE.BufferGeometry;
  /** sRGB 色值，最终会被乘进顶点色 aTint */
  color: THREE.ColorRepresentation;
  matrix?: THREE.Matrix4;
}

/**
 * 把一堆带变换的几何体合并成一个非索引 BufferGeometry，
 * 颜色烘进顶点属性 aTint。
 *
 * 这么做的好处: 整个小镇 / 整片松林都只占 1 个 draw call，
 * 而三渲二材质只需要读 aTint 就能表现多种材质分色。
 * 也避免了给自定义 ShaderMaterial 写 instancing 支持的麻烦。
 */
export function mergeParts(parts: Part[]): THREE.BufferGeometry {
  let total = 0;
  const prepared = parts.map((part) => {
    const g = part.geo.index ? part.geo.toNonIndexed() : part.geo.clone();
    if (part.matrix) g.applyMatrix4(part.matrix);
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    const count = g.getAttribute("position").count;
    total += count;
    return { g, count, color: new THREE.Color(part.color) };
  });

  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const tint = new Float32Array(total * 3);

  let offset = 0;
  for (const { g, count, color } of prepared) {
    const gp = g.getAttribute("position");
    const gn = g.getAttribute("normal");
    for (let i = 0; i < count; i++) {
      const o = (offset + i) * 3;
      position[o] = gp.getX(i);
      position[o + 1] = gp.getY(i);
      position[o + 2] = gp.getZ(i);
      normal[o] = gn.getX(i);
      normal[o + 1] = gn.getY(i);
      normal[o + 2] = gn.getZ(i);
      tint[o] = color.r;
      tint[o + 1] = color.g;
      tint[o + 2] = color.b;
    }
    offset += count;
    g.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(position, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  out.setAttribute("aTint", new THREE.BufferAttribute(tint, 3));
  out.computeBoundingSphere();
  return out;
}

/** 给单个几何体补上 aTint（用统一色） */
export function tintGeometry(
  geo: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
): THREE.BufferGeometry {
  return mergeParts([{ geo, color }]);
}

// ==================== 基础形体 ====================

export function box(w: number, h: number, d: number): THREE.BufferGeometry {
  return new THREE.BoxGeometry(w, h, d);
}

/**
 * 默认 openEnded = true。
 * 松林里一棵树 4 个部件、2200 棵，底面盖全是看不见的，
 * 去掉之后一棵树从 ~200 顶点压到 ~78 顶点。需要盖子的地方显式传 false。
 */
export function cylinder(
  rTop: number,
  rBottom: number,
  h: number,
  seg = 10,
  openEnded = true,
): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, openEnded);
}

export function cone(
  r: number,
  h: number,
  seg = 8,
  openEnded = true,
): THREE.BufferGeometry {
  return new THREE.ConeGeometry(r, h, seg, 1, openEnded);
}

/**
 * 双坡屋顶（切妻）棱柱。
 * 屋脊沿 Z 轴，底面 w×d 位于 y=0，屋脊在 y=h。
 * 直接用三角面汤构造 → 顶点法线是平面法线 → 平直硬朗的动画屋顶。
 */
export function gableRoof(w: number, d: number, h: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hd = d / 2;
  const A: [number, number, number] = [-hw, 0, -hd];
  const B: [number, number, number] = [hw, 0, -hd];
  const C: [number, number, number] = [0, h, -hd];
  const D: [number, number, number] = [-hw, 0, hd];
  const E: [number, number, number] = [hw, 0, hd];
  const F: [number, number, number] = [0, h, hd];

  // 直接铺三角面汤 —— 顶点法线就是面法线，屋顶才会硬朗
  const tri = (...vs: [number, number, number][]): number[] => {
    const out: number[] = [];
    for (const v of vs) out.push(v[0], v[1], v[2]);
    return out;
  };

  const positions = new Float32Array([
    // 左坡
    ...tri(A, D, F),
    ...tri(A, F, C),
    // 右坡
    ...tri(B, C, F),
    ...tri(B, F, E),
    // 前后山墙
    ...tri(A, C, B),
    ...tri(D, E, F),
    // 底面
    ...tri(A, B, E),
    ...tri(A, E, D),
  ]);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * 四坡屋顶（寄栋）— 底 w×d 在 y=0，顶在 y=h。
 *
 * ConeGeometry 的 4 个底顶点落在坐标轴上（0,±1）(±1,0)，是个菱形。
 * 所以要先把菱形转到正方形方位（绕 Y 转 45°），再沿 x/z 缩放，
 * 即 M = S · R —— 顺序反了就会得到菱形屋顶。
 */
export function hipRoof(w: number, d: number, h: number): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(1, 1, 4, 1, false);
  g.translate(0, 0.5, 0);
  const m = new THREE.Matrix4()
    .makeScale(w / Math.SQRT2, h, d / Math.SQRT2)
    .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 4));
  g.applyMatrix4(m);
  return g;
}
