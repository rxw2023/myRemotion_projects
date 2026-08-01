// 全片常量
export const DURATION = 100; // 秒
export const TOTAL_FRAMES = 3000; // 30fps * 100s

// 箔面扫掠时间区间
export const SWEEP0 = 0.16;
export const SWEEP1 = 0.78;

// 太阳二维化时刻
export const SUN_CATCH_P = 0.53;

// 机位过渡时长
export const CAM_EPSILON = 0.022;

// smoothstep
export const SMOOTH = (t: number): number =>
  t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

// 计算箔面 z 位置
export const foilZ = (p: number): number => {
  if (p < SWEEP0) return 60;
  const t = Math.min(1, Math.max(0, (p - SWEEP0) / (SWEEP1 - SWEEP0)));
  return 60 - 120 * t;
};

// 计算某个 z 坐标的行星被二维化的时刻
export const catchP = (z: number): number =>
  SWEEP0 + ((60 - z) / 120) * (SWEEP1 - SWEEP0);
