/**
 * 确定性伪随机
 *
 * 为什么必须用它而不是 Math.random():
 * Remotion 渲染时会把帧区间分给多个 Chrome 实例并行渲染。
 * Math.random() 在不同实例里给出不同结果，于是:
 *   - 同一个组件的 useMemo([]) 在 A 实例和 B 实例里生成出两套不同的布局
 *   - 相邻帧区间拼接的地方就会出现突变（星空跳一下、屋群挪一块）
 *
 * 用固定种子之后，任何实例、任何时刻跑出来的布局都完全一致。
 * 这是 @remotion/deterministic-randomness 这条 lint 规则真正想防的东西。
 */

/** 32 位整数哈希 → [0,1)，用于按坐标取值（地形噪声、逐格随机） */
export function hash2i(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iy | 0, 0x165667b1);
  h = h ^ Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * mulberry32 —— 小而快的种子 PRNG。
 * 返回一个每次调用给出 [0,1) 的函数，序列由 seed 完全决定。
 */
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

/** 一维"时间哈希"，用于窗灯明灭这类离散事件 */
export function hashTime(seed: number, slot: number): number {
  return hash2i(seed, slot, 0x5bf03635);
}
