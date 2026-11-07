// 「虚拟存储器」视觉语言 —— 与《TCP 可靠传输》同源的浅色工程笔记风，
// 但画幅从 1080×1920 换成 1920×1080，版心改为宽幅双栏。
// 强调色只区分语义：虚拟侧（蓝）/ 物理侧（绿）/ 缺页与风险（红）/ 缓存硬件（紫）。

export const T = {
  bg: "#F4F6F9",
  panel: "#FFFFFF",
  ink: "#141A22",
  ink2: "#3B4654",
  sub: "#6B7684",
  faint: "#9AA5B2",
  line: "#E2E7EE",
  grid: "#E7EBF2",

  blue: "#2F62F5",
  blueSoft: "#E9EFFF",
  amber: "#F0A32B",
  amberSoft: "#FFF3DE",
  green: "#0E9F6E",
  greenSoft: "#E4F7EF",
  red: "#DE4A3F",
  redSoft: "#FDEAE7",
  purple: "#7050F0",
  purpleSoft: "#EEEAFF",
  cyan: "#0C8FA8",
  cyanSoft: "#E2F4F8",

  mono: "'JetBrains Mono', 'DM Mono', Consolas, 'Courier New', monospace",
  cn: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
} as const;

/** 版心宽度：1920 − 72×2 */
export const W = 1776;

/** 内容区高度：1080 − 顶 52 − 底 196 − 页眉约 112 */
export const CONTENT_H = 716;

export const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** 本片总场景数（进度轨用） */
export const SCENE_TOTAL = 20;
