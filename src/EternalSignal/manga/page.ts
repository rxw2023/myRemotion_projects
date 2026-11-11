/**
 * 页与格。
 *
 * 漫画的节奏单位是"格"，不是"镜头"。所以转场不是淡入淡出，是**硬切 + 一下轻微的撞击**
 * （格子从 1.06 缩回 1，四帧完成）——读者的眼睛靠这个"啪"来翻页。
 */

import { INK } from "./ink";

export const W = 1920;
export const H = 1080;
export const M = 56;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** 出格：reveal 0→1，四帧撞进来 */
export function panel(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  reveal: number,
  draw: () => void,
  borderWidth = 7,
) {
  if (reveal <= 0.001) return;
  const ease = reveal * reveal * (3 - 2 * reveal);
  const s = 1 + 0.055 * (1 - ease);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  draw();
  ctx.restore();

  // 框：先画一遍粗黑，再在内侧压一道白，出"墨压纸"的双线感
  ctx.strokeStyle = INK;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(rect.x + borderWidth / 2, rect.y + borderWidth / 2, rect.w - borderWidth, rect.h - borderWidth);
  ctx.strokeStyle = "rgba(242,238,226,0.55)";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(rect.x + borderWidth + 1, rect.y + borderWidth + 1, rect.w - borderWidth * 2 - 2, rect.h - borderWidth * 2 - 2);
}

/** 拟声字：压在格子里，斜切，外描一圈白，像贴上去的 */
export function boom(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  rot = -0.14,
  fill = INK,
  outline = "rgba(242,238,226,0.95)",
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${size}px SimSun, 'Songti SC', serif`;
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.13;
  ctx.strokeStyle = outline;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * 贴片格：叠在现有格上面的小格。
 *
 * 这是漫画做"大特写"的常规手法——不是把整页切掉，而是在原来的画面上贴一个
 * 更近的镜头（手、眼睛、一个字的局部）。它不打断阅读，只是突然凑近。
 */
export function inset(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  reveal: number,
  draw: () => void,
  bw = 6,
) {
  if (reveal <= 0.001) return;
  const e = reveal * reveal * (3 - 2 * reveal);

  // 硬投影：漫画贴片格爱用的那种"纸片翘起来"的影子
  ctx.fillStyle = "rgba(18,16,14,0.28)";
  ctx.fillRect(rect.x + 9, rect.y + 9, rect.w, rect.h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const s = 1 + 0.09 * (1 - e);
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  draw();
  ctx.restore();

  ctx.strokeStyle = INK;
  ctx.lineWidth = bw;
  ctx.strokeRect(rect.x + bw / 2, rect.y + bw / 2, rect.w - bw, rect.h - bw);
}

/** 格的进度：第 i 个格在 from 出现，持续到 to（秒，相对本幕） */
export const rev = (t: number, from: number, dur = 0.16) =>
  t < from ? 0 : Math.min(1, (t - from) / dur);
