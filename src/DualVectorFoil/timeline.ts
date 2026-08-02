// 全片常量（TTS 71.3s + 尾声缓冲 ~8.7s）
export const DURATION = 80; // 秒
export const TOTAL_FRAMES = 2400; // 30fps * 80s

// 箔面扫掠时间区间
export const SWEEP0 = 0.16;
export const SWEEP1 = 0.78;

// 太阳二维化时刻
export const SUN_CATCH_P = 0.53;

// 平面模式时刻: 40s 之后隐藏 3D 太阳系, 只保留箔面与二维画
export const PLANAR_P = 0.5;

// 箔面可见时刻(从深空加速飞来)
export const FOIL_VISIBLE_P = 0.02;

// 机位过渡时长
export const CAM_EPSILON = 0.022;

// smoothstep
export const SMOOTH = (t: number): number =>
  t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

// 计算箔面 z 位置: 从深空(180)加速飞向太阳系(60), 然后扫掠 60 → -60
export const foilZ = (p: number): number => {
  if (p < SWEEP0) {
    // t² 曲线: 速度越来越快(加速接近)
    const t = Math.min(1, Math.max(0, p / SWEEP0));
    return 180 - 120 * t * t;
  }
  const t = Math.min(1, Math.max(0, (p - SWEEP0) / (SWEEP1 - SWEEP0)));
  return 60 - 120 * t;
};

// 计算某个 z 坐标的行星被二维化的时刻
export const catchP = (z: number): number =>
  SWEEP0 + ((60 - z) / 120) * (SWEEP1 - SWEEP0);

// 箔面大小: 从深空一路长大, 信封(0.02) → 全尺寸(1.0)
export const foilGrow = (p: number): number => {
  if (p < SWEEP0) {
    const t = Math.min(1, Math.max(0, p / SWEEP0));
    return 0.02 + 0.10 * t; // 0.02 → 0.12
  }
  const t = Math.min(1, Math.max(0, (p - SWEEP0) / (SWEEP1 - SWEEP0)));
  return 0.12 + 0.88 * t; // 0.12 → 1.0
};
