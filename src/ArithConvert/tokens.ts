// 「比特网格」视觉语言（系列第二期）—— 浅色工程笔记风，与《整数与浮点数表示》同源。
// 细线、圆角、柔和投影、单色高亮；强调色只用来区分语义（和/进位/溢出/转换）。

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

/** 内容可用宽度：1080 - 64*2 */
export const W = 952;

export const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** 本片总场景数（进度轨用） */
export const SCENE_TOTAL = 15;
