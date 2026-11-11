/**
 * 漫画的画材层：纸、墨、网点、速度线、剪影。
 *
 * 全部在 Canvas 2D 里画，不用任何外部图片——这是这个项目的底线。
 * 也正因为"只出现剪影和背影"，纯代码才画得动：不需要画脸。
 *
 * 三种质感缺一不可：
 *   1. 纸 —— 不是纯白，是有点脏的米白 + 纤维噪点
 *   2. 墨 —— 边缘不是数学曲线，是带抖动的粗线
 *   3. 网点 —— 漫画的灰阶全靠它，不是 alpha 渐层
 */

import { hash2i } from "../../shared/random";

export const PAPER = "#f2eee2";
export const INK = "#12100e";

/** 由坐标取稳定随机，保证并行渲染一致 */
export const rnd = (a: number, b: number, seed = 1) => hash2i(a, b, seed);

/** 纸：预渲染一次，之后每帧只是贴图。1400 个纤维点不该每帧重画。 */
let paperCache: HTMLCanvasElement | null = null;

export function paper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!paperCache || paperCache.width !== w || paperCache.height !== h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const p = c.getContext("2d");
    if (p) {
      p.fillStyle = PAPER;
      p.fillRect(0, 0, w, h);
      p.fillStyle = "rgba(18,16,14,0.05)";
      for (let i = 0; i < 1400; i++) {
        p.fillRect(rnd(i, 1, 7) * w, rnd(i, 2, 7) * h, 1, 1);
      }
      for (let i = 0; i < 5; i++) {
        const cx = rnd(i, 3, 9) * w;
        const cy = rnd(i, 4, 9) * h;
        const r = 180 + rnd(i, 5, 9) * 320;
        const g = p.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, "rgba(120,108,88,0.05)");
        g.addColorStop(1, "rgba(120,108,88,0)");
        p.fillStyle = g;
        p.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    }
    paperCache = c;
  }
  ctx.drawImage(paperCache, 0, 0);
}

/**
 * 网点：漫画的灰。
 *
 * 做法是"图案填充"，不是"画点"。逐点画一块 900×894 的灰要一万多个形状，
 * 一帧四格就五万个——整片会慢到两小时以上。这里把网目烘焙成一张小瓦片
 * （对角线排列，瓦片边长 cell·√2），然后用 createPattern 一次铺满。
 * 视觉上仍是 45° 的菱形网目，开销从"一万次绘制"降到"一次填充"。
 */
const patternCache = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>();

function tonePattern(ctx: CanvasRenderingContext2D, coverage: number, cell: number) {
  let m = patternCache.get(ctx);
  if (!m) {
    m = new Map();
    patternCache.set(ctx, m);
  }
  const q = Math.max(1, Math.round(coverage * 20)) / 20;
  const key = `${q}|${cell}`;
  const hit = m.get(key);
  if (hit) return hit;

  const T = Math.max(3, Math.round(cell * Math.SQRT2));
  const tile = document.createElement("canvas");
  tile.width = T;
  tile.height = T;
  const c = tile.getContext("2d");
  const side = Math.min(cell * 0.94, cell * 0.94 * Math.sqrt(q));
  if (c) {
    c.fillStyle = INK;
    // 四角 + 中心：这样瓦片内的晶格间距是 T/√2，等价于 45° 斜网目。
    // 只放四角会退化成方正网格，一眼就假。
    for (const [x, y] of [
      [0, 0],
      [T, 0],
      [0, T],
      [T, T],
      [T / 2, T / 2],
    ]) {
      c.fillRect(x - side / 2, y - side / 2, side, side);
    }
  }
  const pat = ctx.createPattern(tile, "repeat");
  if (pat) m.set(key, pat);
  return pat;
}

export function halftone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  coverage: number,
  cell = 8,
  angle = Math.PI / 4,
) {
  if (coverage <= 0.02) return;
  const pat = tonePattern(ctx, coverage, cell);
  if (!pat) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = pat;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  void angle;
}

/** 一块实黑，边缘带毛刺（别让形状看起来像 Illustrator 画的） */
export function blob(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  seed = 1,
  jitter = 1.6,
) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const dx = (rnd(i, seed, 3) - 0.5) * jitter;
    const dy = (rnd(i, seed, 5) - 0.5) * jitter;
    if (i === 0) ctx.moveTo(x + dx, y + dy);
    else ctx.lineTo(x + dx, y + dy);
  }
  ctx.closePath();
  ctx.fill();
}

/** 墨线：同一根线画两遍，第二遍偏一点，出毛边 */
export function line(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  width = 3,
  seed = 1,
) {
  for (let pass = 0; pass < 2; pass++) {
    const j = pass === 0 ? 0 : 1.1;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const dx = pass === 0 ? 0 : (rnd(i, seed, 11) - 0.5) * j;
      const dy = pass === 0 ? 0 : (rnd(i, seed, 13) - 0.5) * j;
      if (i === 0) ctx.moveTo(x + dx, y + dy);
      else ctx.lineTo(x + dx, y + dy);
    }
    ctx.lineWidth = pass === 0 ? width : Math.max(0.8, width * 0.45);
    ctx.strokeStyle = pass === 0 ? INK : "rgba(18,16,14,0.55)";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

/** 速度线：从焦点向外放射，漫画里表示"冲击/推进" */
export function speedLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  count: number,
  inner: number,
  outer: number,
  seed = 1,
  width = 2,
) {
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rnd(i, seed, 17) * 0.08;
    const r0 = inner + rnd(i, seed, 19) * inner * 0.9;
    const r1 = outer * (0.6 + rnd(i, seed, 23) * 0.4);
    ctx.lineWidth = width * (0.35 + rnd(i, seed, 29) * 0.9);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
}

/** 横向流线（宇宙/风） */
export function streamLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
  seed = 1,
) {
  ctx.strokeStyle = "rgba(18,16,14,0.75)";
  for (let i = 0; i < count; i++) {
    const yy = y + rnd(i, seed, 31) * h;
    const len = w * (0.08 + rnd(i, seed, 37) * 0.3);
    const xx = x + rnd(i, seed, 41) * w;
    ctx.lineWidth = 0.8 + rnd(i, seed, 43) * 2.2;
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    ctx.lineTo(Math.min(x + w, xx + len), yy);
    ctx.stroke();
  }
}

// ==================== 剪影 ====================

/**
 * 背影。没有脸，只有头、肩、一点姿态。
 * kind: sit 坐着（驼背） / stand 站着（挺） / child 小一号 / raise 举手
 */
export function figure(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  s: number,
  kind: "sit" | "stand" | "child" | "raise" = "sit",
  faceLeft = false,
) {
  ctx.save();
  ctx.translate(cx, baseY);
  if (faceLeft) ctx.scale(-1, 1);

  const head = s * 0.16;
  const neckY = -s * (kind === "sit" ? 0.52 : 0.72);
  const shoulderW = s * (kind === "child" ? 0.2 : 0.3);

  // 身体
  ctx.beginPath();
  ctx.moveTo(-shoulderW, 0);
  ctx.bezierCurveTo(
    -shoulderW * 1.05,
    neckY * 0.55,
    -shoulderW * 0.7,
    neckY + head * 0.4,
    -head * 0.42,
    neckY + head * 0.35,
  );
  ctx.lineTo(head * 0.42, neckY + head * 0.35);
  ctx.bezierCurveTo(
    shoulderW * 0.7,
    neckY + head * 0.4,
    shoulderW * 1.05,
    neckY * 0.55,
    shoulderW,
    0,
  );
  ctx.closePath();
  ctx.fillStyle = INK;
  ctx.fill();

  // 头
  ctx.beginPath();
  ctx.arc(0, neckY - head * 0.35, head, 0, Math.PI * 2);
  ctx.fill();

  // 举手
  if (kind === "raise") {
    ctx.beginPath();
    ctx.moveTo(shoulderW * 0.7, neckY * 0.7);
    ctx.lineTo(shoulderW * 1.35, neckY * 1.45);
    ctx.lineWidth = s * 0.055;
    ctx.strokeStyle = INK;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.restore();
}

/** 侧脸轮廓（不画五官，只有额头-鼻-下巴那条线，靠留白认人） */
export function profile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  faceLeft = true,
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (faceLeft) ctx.scale(-1, 1);
  const pts: [number, number][] = [
    [0.1 * s, -1.0 * s],
    [0.55 * s, -0.75 * s],
    [0.62 * s, -0.35 * s],
    [0.5 * s, -0.1 * s],
    [0.66 * s, 0.02 * s],
    [0.52 * s, 0.1 * s],
    [0.56 * s, 0.22 * s],
    [0.42 * s, 0.34 * s],
    [0.2 * s, 0.42 * s],
  ];
  blob(ctx, pts, 5, 1.2);
  ctx.restore();
}
