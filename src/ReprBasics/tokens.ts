// 「比特网格」视觉语言 —— 浅色工程笔记风，用于《整数与浮点数表示》
// 与频道既有 Neo-Brutalism 区分：细线、圆角、柔和投影、单色高亮。

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

/** 常用缓动区间 */
export const ease = (frame: number, from: number, dur = 12) => ({
  opacity: Math.max(0, Math.min(1, (frame - from) / dur)),
});

export const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
