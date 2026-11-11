/**
 * 《永不消逝的电波》· 电台体 —— 声音模型 + 信号模型
 *
 * 这一层只做一件事：把 frame 变成"信号强度"和"频谱像素"。
 * 关键约束：Remotion 逐帧并行渲染，任何"上一帧画了什么"都不能依赖。
 * 所以瀑布图的每列都是回头去读更早的时间，而不是往后累积。
 */

import { hash2i, hashTime } from "../shared/random";
import { LINES } from "./timeline";

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const seg = (f: number, a: number, b: number) =>
  smooth(clamp01((f - a) / Math.max(1, b - a)));

/** 瀑布每列代表多少帧之前 */
export const COL_STEP = 2;

/**
 * 信号强度 = 当前有没有人在说话。
 * 这不是装饰：瀑布的起伏直接跟着台本的每一行，声音停，载波就落。
 */
const envCache = new Map<number, number>();

export function envelopeAt(f: number): number {
  const hit = envCache.get(f);
  if (hit !== undefined) return hit;

  let w = 0;
  for (const l of LINES) {
    if (f < l.start - 14 || f > l.end + 14) continue;
    const inW = clamp01((f - (l.start - 14)) / 14);
    const outW = clamp01((l.end + 14 - f) / 14);
    const v = Math.min(inW, outW);
    if (v > w) w = v;
  }
  // 底噪永不归零：机器一直开着
  const v = 0.07 + 0.85 * w;
  envCache.set(f, v);
  return v;
}

/** 点火时刻：F 幕最后一句"永别了"之前的那一下 */
const F_LINES = LINES.filter((l) => l.scene === "F");
export const BOOM_AT =
  (F_LINES[F_LINES.length - 1]?.start ?? 0) - 4;

/** 过曝：点火之后光才到（4 帧的因果延迟） */
export function flashAt(f: number): number {
  const d = f - BOOM_AT;
  if (d < 0) return 0;
  if (d < 44) return 0.9 * seg(d, 0, 44);
  if (d < 70) return 0.9 + 0.1 * seg(d, 44, 70);
  if (d < 150) return 1 - seg(d, 70, 150);
  return 0;
}

/**
 * 频谱：col=0 是最新列（贴右），col 越大越旧。
 * bin 是频率轴，0 → 低端载波，1 → 高端。
 */
export function spectrumAt(
  env: number,
  frame: number,
  col: number,
  bin: number,
  bins: number,
): number {
  const t = frame - col * COL_STEP;
  const x = bin / Math.max(1, bins - 1);

  // 载波：始终在最低端，说话时才亮
  const carrier = Math.exp(-Math.pow((x - 0.045) / 0.013, 2)) * (0.22 + 0.78 * env);

  // 人声共振峰：三条带，靠音节包络跳动，所以读起来像有人在说话
  const syl = Math.abs(Math.sin(t * 0.085 + hash2i(col, 3, 0x1f) * 6.283));
  const f1 = Math.exp(-Math.pow((x - (0.25 + 0.045 * syl)) / 0.055, 2));
  const f2 = Math.exp(-Math.pow((x - (0.43 + 0.055 * syl)) / 0.048, 2)) * 0.72;
  const f3 = Math.exp(-Math.pow((x - 0.65) / 0.075, 2)) * (0.2 + 0.34 * syl);
  const voice = (f1 + f2 + f3) * env;

  // 底噪：稀疏火点，不是均匀绿雾
  const spec = hash2i(col * 31 + 7, bin, 0x3df);
  const noise = spec > 0.88 ? (spec - 0.88) * 3.2 * (0.3 + 0.7 * (1 - env)) : 0;

  // 静噪门：必须平滑，二元判断会在瀑布上切出硬直边
  const gate = 0.5 + 0.5 * smooth(clamp01((env - 0.03) / 0.16));
  return clamp01((carrier + voice + noise) * gate);
}

export function scopeAt(env: number, frame: number, i: number, n: number): number {
  const t = frame / 30;
  const ph = i / n;
  const v =
    Math.sin(ph * Math.PI * 2 * 3 + t * 6.5) * 0.52 +
    Math.sin(ph * Math.PI * 2 * 11 + t * 13.1) * 0.24 +
    Math.sin(ph * Math.PI * 2 * 23 + t * 3.3) * 0.12;
  const nz = (hash2i(i, frame, 0x9c1) - 0.5) * (1.7 - 1.3 * env);
  return v * env + nz * 0.85;
}

/** 星点亮度的缓慢呼吸 + 一颗星的死亡（D 幕） */
export function starLum(f: number, id: number, x: number, y: number, dieAt: number): number {
  const base = 0.18 + 0.55 * hash2i(id, 17, 0x7a1);
  const breath = 0.82 + 0.18 * Math.sin(f * 0.031 + hash2i(id, 5, 0x11) * 6.283);
  let v = base * breath;
  if (id === 3 && dieAt > 0) {
    const die = seg(f, dieAt, dieAt + 20);
    v *= 1 - die;
    v += (1 - die) * die * 4 * (hashTime(0x21, Math.floor(f / 2)) > 0.6 ? 1 : 0);
  }
  const edge = 1 - 0.5 * Math.abs(x - 0.5) - 0.4 * Math.abs(y - 0.5);
  return clamp01(v * (0.5 + 0.5 * edge));
}
