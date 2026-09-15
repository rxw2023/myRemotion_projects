/**
 * 与季节无关的配色（小镇 / 神社 / 底座 / 墨线 / 星 / 彗星）
 *
 * 随季节变化的部分 —— 天空、湖水、地形、森林、光照 —— 已经全部移到
 * seasons.ts。那里是四季配置的单一数据源: 改一季只改一处，
 * 而不是在四个副本里各改一遍。
 *
 * 所有色值按 sRGB 书写，交给 THREE.Color 自动转到线性工作空间，
 * 光照在线性空间计算，最后由 colorspace_fragment 转回 sRGB 输出。
 */

export const STAR = {
  bright: "#f0f6ff",
  dim: "#9db4d8",
  warm: "#ffe6c0",
};

// ==================== 彗星 ====================
// 彗星目前关闭（见 comet.ts 的 SHOW_COMET），配色先留着
export const COMET = {
  head: "#f2f8ff",
  tailA: "#cfeef0",
  tailB: "#c9b8e8",
  spark: "#ffe8cc",
  halo: "#e8f0ff",
};

// ==================== 小镇 ====================
export const TOWN = {
  wall: "#3b332a",
  wallAlt: "#463b2f",
  wallPale: "#4e4234",
  roof: "#1f2129",
  roofAlt: "#2a2c36",
  roofBlue: "#242a38",
  /** 窗内透出的暖光 */
  window: "#ffb45c",
  windowBright: "#ffd28e",
  windowDim: "#c47a34",
  /** 巷子与路 */
  street: "#4a463d",
  streetDark: "#3a362f",
  /** 便利店灯箱 */
  signBox: "#e8f4ff",
  signGlow: "#8fd8ff",
  /** 稻田 */
  paddy: "#3f5a34",
  paddyWater: "#4a5c46",
  /** 电线杆 */
  pole: "#3a352d",
};

// ==================== 神社 / 御神体 ====================
export const SHRINE = {
  /** 鸟居的朱漆（夜色下压暗） */
  torii: "#7a3520",
  toriiDark: "#5c2716",
  /** 木构 */
  wood: "#6b4028",
  woodDark: "#4a2b1a",
  woodOld: "#553423",
  /** 注连绳 */
  rope: "#bfae7e",
  ropeShadow: "#8e7f57",
  /** 纸垂 */
  paper: "#e6e0cb",
  /** 石 */
  stone: "#6b6a66",
  stoneDark: "#4d4c49",
  stoneStep: "#5e5d59",
  /** 暖光 */
  lantern: "#ffa24d",
  candle: "#ffb35c",
  /** 苔 */
  moss: "#3f5c3a",
  /** 内部陈设 */
  sakeJar: "#7a5236",
  sakeJarDark: "#5a3a26",
  offeringTable: "#5e3a24",
  cup: "#e8e6dc",
  ema: "#c9a86e",
  emaWood: "#8a6a3e",
  mirror: "#cfd8e0",
  sakaki: "#2f5238",
  calendar: "#d8cba8",
  chest: "#4a3222",
  bell: "#c9a44e",
  offeringBox: "#4e3320",
  veil: "#8a4a3a",
};

// ==================== 底座 ====================
export const BASE = {
  /** 底座侧面 — 像一层地层剖面 */
  soil: "#241d18",
  soilMid: "#2c241c",
  soilPale: "#3a3026",
  stone: "#25252b",
  /** 顶部压边。第一版给了 #8d8577，在夜景里亮成一条白线 */
  edge: "#4a463d",
  bottom: "#111015",
};

// ==================== 轮廓 / 渲染参数 ====================
export const INK = {
  /** 轮廓线颜色 — 不用纯黑，用极深的蓝紫，更"动画" */
  line: "#0a0c18",
  /** 阴影色调 — 亮部与暗部之间的分色，冷蓝 */
  shade: "#25314f",
  /** 阴影更暗的版本（地形用） */
  shadeDeep: "#1a2438",
};
