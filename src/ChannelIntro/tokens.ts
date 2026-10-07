/**
 * 频道设计令牌 —— 全部"量"出来的，不是挑出来的。
 *
 * 数据来源：public/channel/avatar.jpg（从频道首页取回的真实头像）
 * 测量脚本：scripts/channel-intro/measure_avatar.py
 * 取回脚本：scripts/fetch_bili_info.mjs
 *
 * 这是本片头借自 RuiC-motion-reel 的第一条规矩：
 *   "品牌色必须实测（官网样式表 / 官方图），不凭印象挑。"
 * 换成别的头像，重跑两个脚本即可，不需要改画面代码。
 */

export const CHANNEL = {
  /** @ 昵称（B 站 card API 实测 name 字段） */
  handle: "MRDave先生",
  /** 个性签名（实测 sign 字段） */
  sign: "知识科普向",

  /** ---- 实测色板 ---- */
  colors: {
    /** 头像纸底，300×300 中 3962px。与 FrontendIsms 新粗野主义 bg #f5f3ee 同族。 */
    paper: "#F2F3EE",
    /** 眼球白 */
    paperHi: "#FEFEFE",
    /** 描边色。实测是 #242D34 冷墨，不是纯黑 —— 纯黑会显得廉价。 */
    ink: "#242D34",
    /** 海洋蓝，占画面 31.0% */
    ocean: "#2895FE",
    /** 大陆酸绿，占 24.0%，饱和度 1.000 —— 全图最纯的色。 */
    land: "#BBEB00",
    /**
     * 落款朱砂。全片唯一一个"非实测"色。
     * 之所以破例：中文印章的朱砂是语义色，不是装饰色。
     * 想回到 100% 实测配色，把这里改成 CHANNEL.colors.ink 即可（白文黑印）。
     */
    seal: "#E5341C",
  },

  /**
   * ---- 实测几何（归一化到头像 0..1） ----
   * 第二次最小二乘圆拟合的结果（scripts/channel-intro/make_globe.py）：
   * center=(147.83, 155.20) r=140.57 → cx=0.4928 cy=0.5173 r=0.4686。
   * 头像里地球的底部被画布切掉了，所以拟合只用了上半圈 + 左右极值。
   */
  globe: { cx: 0.4928, cy: 0.5173, r: 0.4686 },
  /** 两只眼睛。注意右眼(0.4053)比左眼(0.4636)高 —— 脸本来就是歪的，别"修正"它。 */
  eyes: [
    { cx: 0.3402, cy: 0.4636, r: 0.09 },
    { cx: 0.7156, cy: 0.4053, r: 0.1017 },
  ],
};

/**
 * 把"头像归一化坐标"换算成"贴纸 globe.png 内的归一化坐标"（0..1，贴纸直径 = 地球直径）。
 * 眼睛位置必须走这个换算，否则贴纸和眨眼位置会各说各话。
 */
export const toSticker = (nx: number, ny: number, nr: number) => ({
  x: 0.5 + (nx - CHANNEL.globe.cx) / CHANNEL.globe.r / 2,
  y: 0.5 + (ny - CHANNEL.globe.cy) / CHANNEL.globe.r / 2,
  r: nr / CHANNEL.globe.r / 2,
});

/** ---- 实测色板的 RGB 三元组，做网点/混色时要用数值 ---- */
export const hexToRgb = (hex: string): [number, number, number] => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

export const rgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * ---- 时间网格 ----
 * 借自 RuiC-motion-reel 的第二条规矩：时间网格先于镜头。
 * 120 BPM → 1 拍 = 0.5s = 15 帧；1 小节 = 2s = 60 帧；5 小节 = 300 帧 = 10.000s 整。
 * 所有入场/硬切/打字换行都必须落在 15 帧的整数倍上，不允许"差不多到了"。
 */
export const FPS = 30;
export const BPM = 120;
export const BEAT = 15;
export const BAR = 60;
export const TOTAL_FRAMES = 300; // 5 小节 × 60 帧

/** 拍点工具：第 n 拍（0 起）的帧号 */
export const beat = (n: number) => n * BEAT;

/**
 * 每个元素只在这里出现一次，画面代码里不允许再写裸数字。
 *
 * ⚠️ 这里刻意**不放任何"内容主张"** —— 不说这个频道讲什么、不放 UID。
 * 片头只负责说"我是谁"（昵称 + 头像 + 印章），不负责说"我讲什么"：
 * 选题会变，片头不该跟着过期。所以自检清单和标语都被拿掉了。
 */
export const T = {
  powerOn: 0, // BAR1 f0   0.0s 点阵逐行上电 + 扫描线
  terminal: 15, //        f15  0.5s 终端开始打字（> MRDAVE.SYS），带字符乱码落定
  barFrom: 18, //         f18  0.6s 块状进度条开始逐格硬跳（16 格，1.5 帧/格）
  barTo: 42, //           f42  1.4s 进度条填满 → 整条翻绿闪 3 帧（音床上同刻一声完成咔哒）
  ready: 45, //           f45  1.5s POST 通过，"OK" 硬切入（音床上同刻 1kHz 蜂鸣）
  wipe: beat(5), //       f75  2.5s 终端向上擦除 + 线框地球起
  spin: beat(7), //       f105 3.5s 线框自转
  flatten: beat(10), //   f150 5.0s 二维化压扁（本片头 signature moment）
  print: beat(11), //     f165 5.5s 网点印刷，真实头像显影
  crisp: beat(12), //     f180 6.0s 网点压实成实心
  blink: 189, //          f189 6.3s 眨眼 —— 地球"活了"
  frameIn: beat(13), //   f195 6.5s 头像框落定 + 字标硬切入
  stamp: beat(14), //     f210 7.0s「先生」盖章（套印错位）
  marks: beat(16), //     f240 8.0s 四角套准十字 + 底部签名条 + 3 音动机
  freeze: beat(18), //    f270 9.0s 之后完全静止，方便剪辑硬切进正片
} as const;


/**
 * ---- 亮底片的后期是反的 ----
 * 借自 RuiC-motion-reel 的 gotcha：纸白本身亮度约 0.95，
 * 任何 bloom / glow 的阈值低于底色亮度，整帧会被底色洗白，
 * 症状看起来像"调色不对"，真因在阈值。
 * 本片头底色 #F2F3EE 亮度 ≈ 0.95 → 因此全片不用辉光，只用硬阴影 + 粗描边。
 */
export const ALLOW_GLOW = false;

/** 粗描边贴纸的统一材质（与 src/CachePrinciple 的新粗野主义令牌同源） */
export const SKIN = {
  border: `5px solid ${CHANNEL.colors.ink}`,
  shadow: `10px 10px 0 ${CHANNEL.colors.ink}`,
  shadowSm: `5px 5px 0 ${CHANNEL.colors.ink}`,
  fontMono: `"Cascadia Mono", Consolas, "DM Mono", "Courier New", monospace`,
  fontCN: `"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif`,
  fontHeavy: `"Arial Black", "Arial Bold", Impact, sans-serif`,
} as const;
