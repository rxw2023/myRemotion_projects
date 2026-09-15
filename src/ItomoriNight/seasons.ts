/**
 * 四季配置
 *
 * 一支视频里 春 → 夏 → 秋 → 冬 各占 15 秒（帧数以 Camera.tsx 的 FRAMES_PER_SEASON 为准）。
 * 四季共用同一套场景（地形、湖、町、神社、机位逻辑），
 * 差别全部收在这一个文件里 —— 这样"改一季的某个细节"只改一处，
 * 而不是在四个副本里各改一遍。
 *
 * 每一季真正变的东西只有七类:
 *   天 / 光 / 地 / 树 / 水 / 云 / 粒子
 * 其中"光"是最关键的: 季节感有一半来自光的角度和色温，
 * 而不是来自把树叶换个颜色。所以四季的 keyDir 和 keyColor 差别给得很大。
 */

import { BASE, INK, SHRINE, TOWN } from "./palette";

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

/**
 * 每季的秒数。必须与 Camera.tsx 的 FRAMES_PER_SEASON 一致
 * （450 帧 @30fps = 15 秒）。
 */
export const SECONDS_PER_SEASON = 15;

export interface SkyColors {
  zenith: string;
  upper: string;
  mid: string;
  horizon: string;
  glow: string;
  /** 地平线以下的近侧（模型四周的虚空） */
  ground: string;
  /** 地平线以下的远侧 */
  groundFar: string;
  /** 远山雾霭 */
  haze: string;
}

export interface WaterColors {
  deep: string;
  mid: string;
  shallow: string;
  shore: string;
  mirror: string;
  skyHi: string;
  skyLo: string;
  cometRefl: string;
  lampRefl: string;
  ripple: string;
}

export interface TerrainColors {
  grassLow: string;
  grassMid: string;
  forestFloor: string;
  forestFloorDeep: string;
  rock: string;
  rockDark: string;
  moss: string;
  shore: string;
  shoreWet: string;
  pale: string;
  snow: string;
  lakeBedMud: string;
  lakeBedDeep: string;
  shoreShallow: string;
  /**
   * 地面整体覆雪量 0..1。
   * 冬天地面不是"高处才有雪"，而是整个湖盆都盖上 ——
   * 只靠高度阈值做不出冬天。
   */
  groundSnow: number;
}

export interface ForestColors {
  /** 树冠的三层色（针叶树是三层塔，阔叶树是三层伞） */
  canopyA: string;
  canopyB: string;
  canopyC: string;
  trunk: string;
  /** 御神木（更大更老的那几棵） */
  sacred: string;
  trunkSacred: string;
  /** 树形: 针叶（塔状松）还是阔叶（团状） */
  shape: "conifer" | "broadleaf";
  /** 冬季: 树冠顶上压一层雪 */
  snowCap: boolean;
  /** 林间地面色（烘进地形顶点色用） */
  floor: string;
}

export interface LightSetup {
  /** 主光方向（会被归一化） */
  keyDir: [number, number, number];
  keyColor: string;
  /** 主光强度基准（各材质会在此基础上再乘自己的系数） */
  keyIntensity: number;
  /** 暗部乘子 —— 决定阴影往哪个色相走 */
  shadeMul: string;
  /** 暗部地板色，避免死黑 */
  shadeAdd: string;
  ambient: string;
  /** 天光补光（自上而下） */
  fillColor: string;
  /** 菲涅尔轮廓边光 */
  rimColor: string;
}

export type ParticleMode = "petal" | "firefly" | "leaf" | "snow" | "none";

export interface SeasonPreset {
  id: Season;
  label: string;
  sky: SkyColors;
  water: WaterColors;
  terrain: TerrainColors;
  forest: ForestColors;
  light: LightSetup;
  /** 云海不透明度倍率 */
  cloudOpacity: number;
  particles: ParticleMode;
  /** 粒子颜色（主色 + 次色） */
  particleColor: string;
  particleColor2: string;
  /** 粒子大小倍率 */
  particleSize: number;
  /** 粒子下落速度倍率 */
  particleFall: number;
  /** ACES 曝光 */
  exposure: number;
  /** 月光/日照那一半的总增益 */
  lightGain: number;
  /** 湖面辉光（小镇灯影）强度倍率 —— 冬天白天短、灯亮得早 */
  lampGlow: number;
}

// ==================== 春 ====================

const SPRING: SeasonPreset = {
  id: "spring",
  label: "春 · 樱",
  /*
   * 第一版的春天整体过曝了: 主光是近白色(#fff2e2)而且强度 1.9，
   * 乘上 lightGain 1.3 等于 2.47 倍白光，浅粉的樱花固有色被直接推过白 ——
   * 远景里整圈樱花糊成一片白色巨石，地面也读不出绿。
   *
   * "清新"不等于"把一切都推到白"。改法是**降光 + 加饱和**:
   *   主光换成带黄的暖白、强度收到 1.35、lightGain 收到 1.05
   *   樱花与草地整体加深一档，让粉色和绿色真的读得出来
   *   暗部压深（原来的 #a49ac0 太浅，暗部一浅整幅就没层次）
   */
  sky: {
    zenith: "#5a72b0",
    upper: "#8ba2cc",
    mid: "#bc9cb4",
    horizon: "#e0a890",
    glow: "#ffd0a8",
    ground: "#6a5870",
    groundFar: "#322838",
    haze: "#8a7a92",
  },
  water: {
    deep: "#1c3450",
    mid: "#2e4a6a",
    shallow: "#54789a",
    shore: "#86c8cc",
    mirror: "#f0c8d4",
    skyHi: "#a08cb4",
    skyLo: "#e0a888",
    cometRefl: "#f0f8ff",
    lampRefl: "#ffbc84",
    ripple: "#ffe0ea",
  },
  terrain: {
    // 嫩绿 —— 比夏天更黄更亮，是"新叶"的绿。
    // 但整体比第一版压深一档，否则会被主光冲成灰绿
    grassLow: "#4a6a38",
    grassMid: "#3a5a2e",
    forestFloor: "#2e4a26",
    forestFloorDeep: "#22381c",
    rock: "#4c4738",
    rockDark: "#38342a",
    moss: "#4a6a38",
    shore: "#5a5648",
    shoreWet: "#3e4a44",
    pale: "#9aa8b0",
    snow: "#c8d4dc",
    lakeBedMud: "#22322a",
    lakeBedDeep: "#141e1a",
    shoreShallow: "#5ab4b0",
    groundSnow: 0,
  },
  forest: {
    /*
     * 樱花: 照搬"冬天的方法" —— 深色主体 + 小面积亮点。
     *
     * 原来三层是 #cf88a0 / #e8aabc / #fbe0e6，三层都亮，而且底层(面积最大)
     * 就已经很浅 —— 一堆亮团叠起来必然糊成一片粉色块。
     * 冬天成立是因为: 树体是深的，白只是每层顶上一点点。
     * 所以底层压到暗玫瑰(占面积最大)，中间层中粉，只有顶部那团是小面积亮粉。
     */
    canopyA: "#8e5a70",
    canopyB: "#c88aa0",
    canopyC: "#f0ccd8",
    trunk: "#3e3028",
    sacred: "#b87890",
    trunkSacred: "#342a22",
    shape: "broadleaf",
    snowCap: false,
    floor: "#36502a",
  },
  light: {
    keyDir: [-0.42, 0.58, 0.7],
    // 带黄的暖白，不是近白 —— 近白会把所有浅色固有色推到过曝
    keyColor: "#ffe6c6",
    keyIntensity: 1.35,
    // 暗部必须够深，否则整幅挤在高端没有层次
    shadeMul: "#7e72a0",
    shadeAdd: "#241e38",
    ambient: "#2e2846",
    fillColor: "#6e6494",
    rimColor: "#ffe0c4",
  },
  cloudOpacity: 0.32,
  particles: "petal",
  particleColor: "#f0b8c8",
  particleColor2: "#d890a8",
  particleSize: 1.5,
  particleFall: 1.0,
  exposure: 1.18,
  lightGain: 1.05,
  lampGlow: 0.75,
};

// ==================== 夏 ====================

const SUMMER: SeasonPreset = {
  id: "summer",
  label: "夏 · 黄昏",
  sky: {
    zenith: "#2b2a5e",
    upper: "#4b3a72",
    mid: "#8f5c80",
    horizon: "#e08a5c",
    glow: "#ffc98a",
    ground: "#5a4658",
    groundFar: "#241b2a",
    haze: "#6a4a5e",
  },
  water: {
    deep: "#101a33",
    mid: "#1e3050",
    shallow: "#3d5c7c",
    shore: "#7fd0d4",
    mirror: "#e0aa82",
    skyHi: "#d09aa0",
    skyLo: "#f0a86a",
    cometRefl: "#eaf4ff",
    lampRefl: "#ffb066",
    ripple: "#ffe0c0",
  },
  terrain: {
    grassLow: "#25402c",
    grassMid: "#1d3524",
    forestFloor: "#152718",
    forestFloorDeep: "#0f1c13",
    rock: "#413b33",
    rockDark: "#2f2b25",
    moss: "#3a5230",
    shore: "#56524a",
    shoreWet: "#3f453f",
    pale: "#a08a88",
    snow: "#c4a89e",
    lakeBedMud: "#16241f",
    lakeBedDeep: "#0a1412",
    shoreShallow: "#4fb0ae",
    groundSnow: 0,
  },
  forest: {
    canopyA: "#16301f",
    canopyB: "#1c3a28",
    canopyC: "#254732",
    trunk: "#2b2319",
    sacred: "#142a1c",
    trunkSacred: "#261e16",
    shape: "conifer",
    snowCap: false,
    floor: "#152718",
  },
  light: {
    keyDir: [-0.6, 0.32, 0.73],
    keyColor: "#ffb877",
    keyIntensity: 1.5,
    shadeMul: "#8a7aa8",
    shadeAdd: "#241c38",
    ambient: "#2e2544",
    fillColor: "#8a6fa8",
    rimColor: "#e8bc92",
  },
  cloudOpacity: 0.6,
  particles: "firefly",
  particleColor: "#d8f06a",
  particleColor2: "#a8e050",
  particleSize: 1.0,
  particleFall: 0,
  exposure: 1.3,
  lightGain: 1.34,
  lampGlow: 1.0,
};

// ==================== 秋 ====================

const AUTUMN: SeasonPreset = {
  id: "autumn",
  label: "秋 · 红叶",
  sky: {
    // 秋天空气干、通透 —— 天顶蓝得更纯，地平线是琥珀金
    zenith: "#2e4a86",
    upper: "#5a72a4",
    mid: "#b8825e",
    horizon: "#f0a050",
    glow: "#ffd898",
    ground: "#6a4a44",
    groundFar: "#2a1c20",
    haze: "#8a6a52",
  },
  water: {
    deep: "#1c2a44",
    mid: "#33465e",
    shallow: "#6a786c",
    shore: "#9ac4b8",
    mirror: "#ffd8a0",
    skyHi: "#a88478",
    skyLo: "#f0a45c",
    cometRefl: "#fff0d8",
    lampRefl: "#ffa850",
    ripple: "#ffe4b8",
  },
  terrain: {
    /*
     * 关键修正: 地面改成**浅稻草色**，而不是褐色。
     *
     * 做了个实验才想明白: 冬天 1600 棵针叶树不糊，秋天 550 棵阔叶却糊，
     * 而针叶树底部半径其实比阔叶还宽 —— 差别不在树，在**对比度**:
     *   冬天 = 深绿树 + 白雪地  → 明度差拉满，每棵树的轮廓都跳出来
     *   秋天 = 金树  + 褐地     → 明度几乎相同，树和地糊成一片
     * 所以照搬冬天的方法不是"缩树"，是**深色树 + 浅色地面**。
     * 秋天的地面本来也该是收割后的浅色稻茬/枯草，不是深褐。
     */
    grassLow: "#8a7a50",
    grassMid: "#786a44",
    forestFloor: "#5e5238",
    forestFloorDeep: "#4a4030",
    rock: "#7a6a54",
    rockDark: "#5e5240",
    moss: "#6a6a3c",
    shore: "#7a6e58",
    shoreWet: "#5a5444",
    pale: "#b0a088",
    snow: "#ccc0a8",
    lakeBedMud: "#2e2a1e",
    lakeBedDeep: "#1c1a12",
    shoreShallow: "#6aa89c",
    groundSnow: 0,
  },
  forest: {
    /*
     * 树冠整体再压深一档，让"深色树 + 浅色地"的对比真的成立。
     * 之前 canopyB #a8501e 是主体（面积最大），它一亮，
     * 金黄就和浅色地面撞在一起了。
     */
    canopyA: "#4e2418",
    canopyB: "#7a3818",
    canopyC: "#c08828",
    trunk: "#332a20",
    sacred: "#7a3c1c",
    trunkSacred: "#2c241c",
    shape: "broadleaf",
    snowCap: false,
    floor: "#5e5238",
  },
  light: {
    /*
     * 秋光原来是 #ffa855（饱和暖橙）强度 1.7 × lightGain 1.34 = 2.28 倍。
     * 这盏灯会把**所有**树冠推向亮橙金 —— 我把底层固有色压到暗栗 #5e2a1c
     * 却完全看不出效果，就是被它洗掉了。
     *
     * 对照冬天: 光色是 #d4e4f8（冷、低饱和），所以深绿树冠保得住深绿。
     * 教训是**光越饱和，固有色越没有意义** —— 秋冬的差别不在树的固有色，
     * 在这盏灯。现在把光的饱和度和强度都收下来，让暗部的栗色真的暗得下去。
     */
    keyDir: [-0.68, 0.26, 0.68],
    keyColor: "#ffce9a",
    keyIntensity: 1.3,
    shadeMul: "#8a6a74",
    shadeAdd: "#2a1e1a",
    ambient: "#362828",
    fillColor: "#8a7078",
    // 边光从 #ffd8a8 收到 #c89870: 秋色的边光最容易在近处山坡上糊成一片金
    rimColor: "#c89870",
  },
  cloudOpacity: 0.45,
  particles: "leaf",
  particleColor: "#d88c34",
  particleColor2: "#a84c22",
  particleSize: 1.6,
  particleFall: 0.85,
  exposure: 1.2,
  lightGain: 1.1,
  lampGlow: 0.9,
};

// ==================== 冬 ====================

const WINTER: SeasonPreset = {
  id: "winter",
  label: "冬 · 雪",
  sky: {
    // 冬日天短、空气冷 —— 天顶是很深的蓝，地平线冷白
    zenith: "#152444",
    upper: "#2c4066",
    mid: "#5a7298",
    horizon: "#a8bcd0",
    glow: "#dce8f4",
    ground: "#4a5468",
    groundFar: "#1a2030",
    haze: "#8a9ab0",
  },
  water: {
    deep: "#101e34",
    mid: "#1e3048",
    shallow: "#42586a",
    shore: "#86c4d4",
    mirror: "#dceaf4",
    skyHi: "#8aa0b8",
    skyLo: "#c0d0e0",
    cometRefl: "#f0f8ff",
    lampRefl: "#ffb878",
    ripple: "#e8f2fa",
  },
  terrain: {
    // 覆雪: 地面整体压向冷白，露出的岩与枯草是很暗的一点点
    grassLow: "#7a8a90",
    grassMid: "#6a7a82",
    forestFloor: "#5a6a72",
    forestFloorDeep: "#46545c",
    rock: "#586070",
    rockDark: "#414854",
    moss: "#5a6a5c",
    shore: "#7a8490",
    shoreWet: "#5a6670",
    pale: "#c8d6e2",
    snow: "#f0f6fc",
    lakeBedMud: "#26323a",
    lakeBedDeep: "#141c22",
    shoreShallow: "#7cc4d4",
    // 冬天地面整体盖雪 —— 光靠高度阈值做不出冬天
    groundSnow: 0.88,
  },
  forest: {
    // 雪压松: 树冠是深墨绿，但每层顶上加一圈白
    canopyA: "#243c34",
    canopyB: "#2c4a3e",
    canopyC: "#e8f2f6",
    trunk: "#2e2820",
    sacred: "#1e342c",
    trunkSacred: "#28221c",
    shape: "conifer",
    snowCap: true,
    floor: "#5a6a72",
  },
  light: {
    // 冬光冷、清、对比强，阴影是蓝紫
    keyDir: [-0.5, 0.34, 0.79],
    keyColor: "#d4e4f8",
    keyIntensity: 1.8,
    shadeMul: "#7a88ac",
    shadeAdd: "#2a3448",
    ambient: "#2e3a54",
    fillColor: "#7a8ab0",
    rimColor: "#eaf4ff",
  },
  // 冬天云低而厚，压在山腰
  cloudOpacity: 0.9,
  particles: "snow",
  particleColor: "#f0f6fc",
  particleColor2: "#c8d8e8",
  particleSize: 1.3,
  particleFall: 0.5,
  exposure: 1.34,
  lightGain: 1.32,
  lampGlow: 1.2,
};

export const SEASONS: Record<Season, SeasonPreset> = {
  spring: SPRING,
  summer: SUMMER,
  autumn: AUTUMN,
  winter: WINTER,
};

/** 按帧号取当前季节（四季等长） */
export function seasonAtFrame(
  frame: number,
  framesPerSeason: number,
): SeasonPreset {
  const idx = Math.floor(frame / framesPerSeason);
  const i = Math.max(0, Math.min(SEASON_ORDER.length - 1, idx));
  return SEASONS[SEASON_ORDER[i]];
}

/** 与季节无关的配色（建筑、神社、底座、墨线） */
export const SHARED_PALETTE = { TOWN, SHRINE, BASE, INK };
