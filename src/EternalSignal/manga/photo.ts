/**
 * 图页：把生成好的漫画图排成一页。
 *
 * 三条规矩，都是从"这是一本漫画"出发的，不是从"这是一堆图片"出发的：
 *
 * 1. **一页最多 3–4 格。** 6 格挤在一页，每格只剩 596×438，AI 图的细节全丢了。
 *    图多的幕分成两页，中缝转到半途——读者该翻页了。
 * 2. **单格页用 contain 而不是 cover。** 有些图本身就是一整页（比如 d-05 是三条
 *    横格的书页）。硬塞进格子里会变成"页中页"；单格页就完整显示，四周留纸色。
 * 3. **翻页对齐台词。** 页的切换点往最近的台词起点上吸——漫画是说话的时候翻页的。
 * 4. **页面本身不动。** 第一版给每格加了 1.00→1.045 的极慢推镜，结果半调网点在连续
 *    缩放里疯狂爬行——实测两秒内 50% 的像素在变（摩尔纹），码率也飙到 12 Mbps。
 *    漫画页是印在纸上的，它不该动。真正该动的是"翻页"这个动作。
 */

import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { INK, PAPER } from "./ink";
import { M, Rect, W } from "./page";
import { PANELS } from "./panels.generated";

const cache = new Map<string, HTMLImageElement>();
let handle: number | null = null;

/**
 * 图是异步解码的，而 canvas 只在 effect 里画一次——先画、后加载完，就会画出一张白纸。
 * 所以每有一张图就绪就抬一次版本号，让组件重渲染、把这一帧重画一遍。
 */
let version = 0;
const subs = new Set<() => void>();

export function usePanelVersion(): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    const f = () => setV(version);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  return v;
}

/** 在组件渲染体里调一次即可；没有图时什么都不做 */
export function preloadPanels() {
  if (handle !== null) return;
  const all: string[] = [];
  for (const k of Object.keys(PANELS)) all.push(...PANELS[k]);
  if (!all.length) return;
  handle = delayRender(`panels:${all.length}`);
  let left = all.length;
  let shown = false;
  const done = () => {
    if (--left > 0) return;
    if (shown) return;
    shown = true;
    continueRender(handle as number);
  };
  for (const f of all) {
    const img = new Image();
    img.onload = () => {
      cache.set(f, img);
      version += 1;
      subs.forEach((fn) => fn());
      done();
    };
    // 图坏了也要放行，否则整片渲染会挂死在一个 404 上
    img.onerror = () => done();
    img.src = staticFile(`eternal-signal/panels/${f}`);
  }
}

export const hasPanels = (act: string) => (PANELS[act]?.length ?? 0) > 0;

// ---------------- 版面 ----------------

const GAP = 10;
const TOP = M;
const BOTTOM = 948; // 给说白框留位
const LEFT = M;
const BW = W - M * 2;
const BH = BOTTOM - TOP;

const cols = (n: number, y: number, h: number): Rect[] =>
  Array.from({ length: n }, (_, i) => ({
    x: LEFT + (i * (BW + GAP)) / n,
    y,
    w: BW / n - (GAP * (n - 1)) / n,
    h,
  }));

/** 每个数量对应一种版面。刻意让每格接近 3:2，AI 图裁掉的最少 */
export function layout(n: number): Rect[] {
  if (n <= 0) return [];
  if (n === 1) return [{ x: LEFT, y: TOP, w: BW, h: BH }];
  if (n === 2) return cols(2, TOP, BH);

  if (n === 3) {
    const bigW = BW * 0.62;
    const sw = BW - bigW - GAP;
    const h1 = (BH - GAP) / 2;
    return [
      { x: LEFT, y: TOP, w: bigW, h: BH },
      { x: LEFT + bigW + GAP, y: TOP, w: sw, h: h1 },
      { x: LEFT + bigW + GAP, y: TOP + h1 + GAP, w: sw, h: h1 },
    ];
  }

  if (n === 4) {
    const half = (BH - GAP) / 2;
    return [...cols(2, TOP, half), ...cols(2, TOP + half + GAP, half)];
  }

  return cols(3, TOP, (BH - GAP) / 2);
}

/**
 * 一幕分成几页、每页放哪几张。
 *
 * D 幕单独特判：d-05 本身就是一张排好三格的书页，必须独占一页、完整显示，
 * 否则会变成"小格里还套着一整页"。剩下四张排 2×2。
 */
export function pagePlan(act: string, shots: string[]): string[][] {
  if (!shots.length) return [];
  if (act === "D" && shots.length === 5) return [shots.slice(4), shots.slice(0, 4)];
  if (shots.length <= 4) return [shots];
  const half = Math.ceil(shots.length / 2);
  return [shots.slice(0, half), shots.slice(half)];
}

/** 页的切换时刻：均分之后往最近的台词起点上吸 */
function pageStarts(n: number, dur: number, lineTimes: number[]): number[] {
  const out = [0];
  for (let k = 1; k < n; k++) {
    const ideal = (dur * k) / n;
    let best = ideal;
    let bd = 2.6; // 只在 ±2.6 秒内找，太远就别硬吸
    for (const lt of lineTimes) {
      const d = Math.abs(lt - ideal);
      if (d < bd) {
        bd = d;
        best = lt;
      }
    }
    out.push(best);
  }
  out.push(dur);
  return out;
}

// ---------------- 画 ----------------

/** 等比铺满（cover），多出来的裁掉 */
function cover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rc: Rect,
  zoom: number,
  ay: number,
) {
  const ir = img.naturalWidth / Math.max(1, img.naturalHeight);
  const rr = rc.w / rc.h;
  let w = rc.w;
  let h = rc.h;
  if (ir > rr) w = rc.h * ir;
  else h = rc.w / ir;
  w *= zoom;
  h *= zoom;
  ctx.drawImage(img, rc.x + (rc.w - w) / 2, rc.y + (rc.h - h) * ay, w, h);
}

/** 完整显示（contain）：单格页用，保证"这一页"一点不裁 */
function contained(img: HTMLImageElement, rc: Rect, zoom: number): Rect {
  const ir = img.naturalWidth / Math.max(1, img.naturalHeight);
  const rr = rc.w / rc.h;
  let w = rc.w;
  let h = rc.h;
  if (ir > rr) h = rc.w / ir;
  else w = rc.h * ir;
  w *= zoom;
  h *= zoom;
  return { x: rc.x + (rc.w - w) / 2, y: rc.y + (rc.h - h) / 2, w, h };
}

/** 框：与手绘版同一套双线，保证图页和手绘页看法一致 */
function border(ctx: CanvasRenderingContext2D, rc: Rect, bw = 7) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = bw;
  ctx.strokeRect(rc.x + bw / 2, rc.y + bw / 2, rc.w - bw, rc.h - bw);
  ctx.strokeStyle = "rgba(242,238,226,0.5)";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(rc.x + bw + 1, rc.y + bw + 1, rc.w - bw * 2 - 2, rc.h - bw * 2 - 2);
}

const ease = (x: number) => x * x * (3 - 2 * x);

/**
 * @param act       幕号，用于特殊版面
 * @param shots     该幕的图文件名
 * @param t         幕内秒数
 * @param dur       该幕总秒数
 * @param lineTimes 这一幕里每句台词的起点（秒），翻页时用来对齐
 */
export function drawPhotoPage(
  ctx: CanvasRenderingContext2D,
  act: string,
  shots: string[],
  t: number,
  dur: number,
  lineTimes: number[] = [],
) {
  const pages = pagePlan(act, shots);
  if (!pages.length) return;

  const starts = pageStarts(pages.length, dur, lineTimes);
  let pi = 0;
  for (let i = 0; i < pages.length; i++) if (t >= starts[i]) pi = i;
  const pageT = t - starts[pi];
  const page = pages[pi];
  const boxes = layout(page.length);

  // 单格页：完整显示，四周留纸色。这一页就是"整页一格"，不该被裁
  if (page.length === 1) {
    const img = cache.get(page[0]);
    if (!img) return;
    // 第一帧就必须有画：原来从 alpha 0 淡入，翻页时会闪一帧空白内框页
    const rv = Math.min(1, (pageT + 0.04) / 0.16);
    const inner = contained(img, boxes[0], 1 + 0.03 * (1 - ease(rv)));
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.fillRect(boxes[0].x, boxes[0].y, boxes[0].w, boxes[0].h);
    ctx.drawImage(img, inner.x, inner.y, inner.w, inner.h);
    ctx.restore();
    border(ctx, { x: inner.x - 4, y: inner.y - 4, w: inner.w + 8, h: inner.h + 8 });
    return;
  }

  page.forEach((f, i) => {
    const rc = boxes[i];
    const img = cache.get(f);
    if (!rc || !img) return;

    // 整页一起落位，不逐格错峰。
    // 逐格错峰会让翻页的**第一帧**是一张空白纸——实测全片有十几处 33ms 的白闪。
    // 而且漫画本来就是"一整页翻过来"，不是格子一张张飞进来。
    const rv = Math.min(1, (pageT + 0.04) / 0.16);
    const e = ease(rv);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rc.x, rc.y, rc.w, rc.h);
    ctx.clip();

    // 撞进来的那一下：1.06 → 1
    const s = 1 + 0.06 * (1 - e);
    const cx = rc.x + rc.w / 2;
    const cy = rc.y + rc.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);

    // 不推镜。缩放网点会让整页的灰"沸腾"，那是印刷品不会有的动静
    cover(ctx, img, rc, 1, 0.5);
    ctx.restore();

    border(ctx, rc);
  });
}
