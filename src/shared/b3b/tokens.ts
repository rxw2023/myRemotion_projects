// 3Blue1Brown 视觉语言 · 横版 1920×1080（多期知识点视频共用）
// 深灰底 + 等宽字 + 四色语义高亮 + 一笔一笔"写"出来的线条。
// 原则：颜色只承担语义（操作码/地址/剩余/冲突），不做装饰。
//
// 来源：src/InstructionFormat/tokens.ts（《指令格式与寻址方式》），抽出来给后续各期复用。
// 单期视频自己的颜色语义写在各自的 tokens.ts 里，不再往这里堆。

export const T = {
  bg: "#1C1C1C",
  bg2: "#202020",
  ink: "#ECECEC",
  ink2: "#C4C4C4",
  sub: "#8C8C8C",
  faint: "#5A5A5A",
  line: "#3A3A3A",
  grid: "rgba(255,255,255,0.055)",

  blue: "#58C4DD",
  green: "#83C167",
  yellow: "#F1E05A",
  red: "#FC6255",
  teal: "#5CD0B3",
  purple: "#B189C6",
  orange: "#F0A32B",
  pink: "#E48BA8",

  blueDim: "rgba(88,196,221,0.16)",
  greenDim: "rgba(131,193,103,0.16)",
  yellowDim: "rgba(241,224,90,0.14)",
  redDim: "rgba(252,98,85,0.16)",
  purpleDim: "rgba(177,137,198,0.16)",
  orangeDim: "rgba(240,163,43,0.16)",
  inkDim: "rgba(236,236,236,0.07)",
} as const;

export const F = {
  mono: "'Cascadia Mono','JetBrains Mono',Consolas,'Microsoft YaHei UI',monospace",
  cn: "'Microsoft YaHei UI','Microsoft YaHei','PingFang SC',sans-serif",
  serif: "'Cambria Math','Times New Roman',serif",
} as const;

export const W = 1920;
export const H = 1080;
export const PAD = 128;
