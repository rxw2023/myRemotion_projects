import { mulberry32 } from "../shared/random";
import { LAKE } from "./layout";

/**
 * 落水涟漪调度
 *
 * 从参考实现里学到的做法: 涟漪不是一个固定落点无限循环的圆环，
 * 而是**一颗颗碎光各自落水，各自扩散一圈** —— 事件驱动的。
 *
 * 这里用确定性 PRNG 预生成一批落点与落水时刻，
 * 每帧根据时间挑出还"活着"的涟漪传给水面着色器。
 * 因为完全由 (时间) 决定，所以并行渲染的每个实例结果一致。
 */

/** 着色器里 vec4 uRipples[8] 的槽位数，改这里必须同步改 shader */
export const RIPPLE_SLOTS = 8;
/** 一圈涟漪从生到灭的秒数 */
const RIPPLE_LIFE = 7.5;
/** 扩散到的最大半径 */
const RIPPLE_MAX_R = 7.5;
/** 落点数量 */
const RIPPLE_TOTAL = 16;
/**
 * 每颗碎光重复落水的周期（秒）。
 *
 * 这里用**周期制**而不是一次性排程。
 * 原来是一串一次性的落水时刻（最后一次在 40 秒），
 * 片子比这长的时候，尾巴上就完全没有涟漪 ——
 * 周期制不管片子多长都不会中途停掉。
 *
 * 周期 15 / 生命 7.5 / 16 个落点、相位均匀错开，
 * 于是任意时刻都恰好有 8 圈活着，正好填满着色器的 8 个槽位。
 */
const RIPPLE_PERIOD = 15.0;

export interface Ripple {
  x: number;
  z: number;
  /** 当前半径 */
  r: number;
  /** 当前强度 0..1 */
  s: number;
}

interface RippleSeed {
  x: number;
  z: number;
  /** 相位（秒，0..RIPPLE_PERIOD） */
  t0: number;
}

let seeds: RippleSeed[] | null = null;

function buildSeeds(): RippleSeed[] {
  if (seeds) return seeds;
  const out: RippleSeed[] = [];
  const r = mulberry32(20240808);
  for (let i = 0; i < RIPPLE_TOTAL; i++) {
    /*
     * 落点撒在湖心半径 13 以内。
     * 湖水面半径约 16.5，留出余量保证涟漪全程都在水里，
     * 不会扩散到岸上画出穿帮的圆。
     */
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 13;
    out.push({
      x: LAKE.x + Math.cos(a) * rad,
      z: LAKE.z + Math.sin(a) * rad,
      // 相位均匀错开，任意时刻活跃的圈数才是恒定的
      t0: i * (RIPPLE_PERIOD / RIPPLE_TOTAL) + (r() - 0.5) * 0.3,
    });
  }
  seeds = out;
  return out;
}

/**
 * 取当前时刻还活着的涟漪，写进 out（长度至少 RIPPLE_SLOTS），返回有效个数。
 * out 里多余的槽位强度会被置 0，正好对应 shader 里 "s<=0 就跳过"。
 */
export function ripplesAt(time: number, out: Ripple[]): number {
  const all = buildSeeds();
  let n = 0;
  for (let i = 0; i < all.length && n < RIPPLE_SLOTS; i++) {
    // 取"相对最近一次落水"的年龄
    let age = (time - all[i].t0) % RIPPLE_PERIOD;
    if (age < 0) age += RIPPLE_PERIOD;
    if (age >= RIPPLE_LIFE) continue;

    const t = age / RIPPLE_LIFE;
    const slot = out[n];
    slot.x = all[i].x;
    slot.z = all[i].z;
    slot.r = RIPPLE_MAX_R * t;
    // 刚落下时快速涨起，之后缓慢衰减
    slot.s = Math.min(1, t / 0.06) * Math.pow(1 - t, 1.4);
    n++;
  }
  // 清空剩余槽位
  for (let i = n; i < RIPPLE_SLOTS; i++) {
    out[i].s = 0;
    out[i].x = 0;
    out[i].z = 0;
    out[i].r = 0;
  }
  return n;
}

/** 预分配的输出缓冲，避免每帧 new */
export function makeRippleBuffer(): Ripple[] {
  const out: Ripple[] = [];
  for (let i = 0; i < RIPPLE_SLOTS; i++) out.push({ x: 0, z: 0, r: 0, s: 0 });
  return out;
}
