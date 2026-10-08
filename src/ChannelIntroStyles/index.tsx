/**
 * 频道片头 · 风格候选样张（style samples）
 *
 * 目的：给"换一种风格重做片头"提供可比较的图例。
 *
 * 十二张样张**画的是同一件事**，只有视觉语言不同 —— 这样比较才是公平的：
 *   地球先生（public/channel/globe.png，真实头像预切的贴纸）
 *   + 字标 MRDave + 「先生」印章 + 签名「知识科普向」
 *   + 一组**样张内容**（集数 / 标题 / 副题 / 时长），用来看各风格怎么处理正文
 *
 * 那组内容只属于样张。真正的片头（src/PixelIntro/、src/ChannelIntro/）刻意
 * 不写任何内容主张与 UID —— 选题会变，片头不该跟着过期。
 * 这里写「缓存原理」是因为**没有正文就评不出字体的好坏**。
 *
 * 每张都是**静态帧**（30 帧同图），只为出图，不做动画。
 * 想变成真片头，需要按各风格的语法重新配时间轴 —— 样张只回答"长什么样"。
 */

import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { CHANNEL } from "../ChannelIntro/tokens";

const GLOBE = staticFile("channel/globe.png");
const GLOBE_PX = staticFile("channel/globe-px32.png");
const SIGN = CHANNEL.sign; // 知识科普向
const MARK = "MRDave";

/** 样张内容 —— 十二张完全一致，只有排版语言不同 */
export const SAMPLE = {
  ep: "EP.07",
  title: "缓存原理",
  sub: "一条数据从内存到屏幕的旅程",
  meta: "08:24 · 知识科普向 · BILIBILI",
};

// ==================== 风格元数据 ====================

export type StyleKey =
  | "swiss"
  | "crt"
  | "blueprint"
  | "memphis"
  | "editorial"
  | "whiteboard"
  | "neon"
  | "retrofuture"
  | "pixel"
  | "vaporwave"
  | "ink"
  | "comic";

export const STYLE_KEYS: StyleKey[] = [
  "swiss",
  "crt",
  "blueprint",
  "memphis",
  "editorial",
  "whiteboard",
  "neon",
  "retrofuture",
  "pixel",
  "vaporwave",
  "ink",
  "comic",
];

// ---- 字体栈（本机实测可用的族） ----
const F_HELV = '"Swis721 BT", "Helvetica Neue", Arial, sans-serif';
const F_ENG = '"Bahnschrift", "Swis721 BT", "Arial Black", Arial, sans-serif';
const F_MONO = '"Cascadia Mono", Consolas, "Courier New", monospace';
const F_CN = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
const F_SONG = '"Noto Serif SC", "Source Han Serif SC", SimSun, serif';
const F_KAI = '"华文行楷", "STXingkai", KaiTi, serif';
const F_BLACK = '"Arial Black", "Arial Bold", Impact, sans-serif';
const F_ROUND = '"Arial Rounded MT Bold", "Microsoft YaHei", sans-serif';
const F_PRINT = '"Segoe Print", "华文行楷", cursive';

/**
 * 每种风格怎么排「样张内容」。
 * 内容十二张完全一样，只有这一组参数不同 —— 于是"哪种风格排得出正文"变成可比的。
 */
export type ContentCfg = {
  x: number;
  y: number;
  width: number;
  align?: "left" | "center";
  font: string;
  epColor: string;
  epSize?: number;
  epBg?: string;
  epBorder?: string;
  epTracking?: number;
  titleColor: string;
  titleFont?: string;
  titleSize: number;
  titleWeight?: number | string;
  titleTracking?: number;
  titleShadow?: string;
  titleStroke?: string;
  titleBg?: string;
  titlePad?: number;
  subColor: string;
  subFont?: string;
  subSize?: number;
  metaColor: string;
  metaSize?: number;
  metaFont?: string;
  metaTracking?: number;
  rule?: string;
  ruleW?: number;
  box?: string;
  boxBg?: string;
  padded?: number;
  opacity?: number;
};

export const STYLE_META: Record<
  StyleKey,
  {
    no: string;
    name: string;
    en: string;
    line: string;
    borrow: string;
    feel: string;
    content: ContentCfg;
  }
> = {
  swiss: {
    no: "01",
    name: "瑞士网格",
    en: "SWISS / GRID",
    line: "Helvetica 式无衬线 + 严格左对齐 + 唯一一抹红。信息即装饰。",
    borrow: "mg-styles-15 风格 11「网格秩序」",
    feel: "可信、克制、有学术气。最像「正经科普」。",
    content: {
      x: 96,
      y: 1548,
      width: 700,
      font: F_HELV,
      epColor: "#E30613",
      epSize: 20,
      epTracking: 0.18,
      titleColor: "#101010",
      titleSize: 62,
      titleWeight: 700,
      titleTracking: -0.02,
      subColor: "#4A4A48",
      subSize: 24,
      metaColor: "#8A8A86",
      metaSize: 19,
      metaTracking: 0.06,
      rule: "#101010",
      ruleW: 2,
    },
  },
  crt: {
    no: "02",
    name: "磷光终端",
    en: "CRT / PHOSPHOR",
    line: "黑底绿字 + 扫描线 + RGB 色散 + 余晖。让画面本身像一台机器。",
    borrow: "mg-styles-15 风格 08「赛博 HUD」",
    feel: "硬核、极客。最像「懂技术的人」。",
    content: {
      x: 96,
      y: 1470,
      width: 820,
      font: F_MONO,
      epColor: "#FFB300",
      epSize: 20,
      epBorder: "#1B6B37",
      titleColor: "#3BFF7A",
      titleFont: F_CN,
      titleSize: 66,
      titleWeight: 700,
      titleShadow: "0 0 22px rgba(59,255,122,0.55), 2px 0 0 rgba(255,0,90,0.5), -2px 0 0 rgba(0,200,255,0.5)",
      subColor: "#2E8F52",
      subSize: 23,
      metaColor: "#2E8F52",
      metaSize: 18,
      metaTracking: 0.1,
      rule: "#1B6B37",
      ruleW: 1,
      opacity: 0.96,
    },
  },
  blueprint: {
    no: "03",
    name: "工程蓝图",
    en: "BLUEPRINT",
    line: "晒蓝图 + 尺寸标注 + 标题栏。把头像当成一个被测绘的零件。",
    borrow: "RuiC-motion-reel 的「颜色是被算出来的」",
    feel: "严谨、有出处。最像「我拆开给你看」。",
    content: {
      // 窄左栏：右边界必须停在 x≈392，避开工程图标题栏（它从 x=422 起）
      x: 124,
      y: 1400,
      width: 268,
      font: F_MONO,
      epColor: "#5E93D8",
      epSize: 16,
      epTracking: 0.16,
      titleColor: "#CFE2FF",
      titleFont: F_ENG,
      titleSize: 34,
      titleWeight: 700,
      subColor: "#5E93D8",
      subSize: 15,
      metaColor: "#5E93D8",
      metaSize: 13,
      metaTracking: 0.08,
      box: "#5E93D8",
      padded: 12,
    },
  },
  memphis: {
    no: "04",
    name: "孟菲斯波普",
    en: "MEMPHIS POP",
    line: "高饱和撞色 + 漂浮几何 + 逐字变色。完全不严肃。",
    borrow: "mg-styles-15 风格 15「花字冲击」",
    feel: "活泼、抓眼。最适合信息流里被点开。",
    content: {
      x: 96,
      y: 1420,
      width: 760,
      font: F_ROUND,
      epColor: "#141414",
      epSize: 22,
      epBg: "#FFD400",
      epBorder: "5px solid #141414",
      epTracking: 0.08,
      titleColor: "#2F6BFF",
      titleFont: F_BLACK,
      titleSize: 70,
      titleWeight: 900,
      titleShadow: "6px 6px 0 #141414",
      subColor: "#141414",
      subSize: 24,
      subFont: F_ROUND,
      metaColor: "#141414",
      metaSize: 19,
      metaTracking: 0.05,
    },
  },
  editorial: {
    no: "05",
    name: "杂志封面",
    en: "EDITORIAL COVER",
    line: "超大衬线刊头 + 出血照片 + 侧栏导读 + 条码。把频道当一本刊。",
    borrow: "awesome-opus5-5-videos 的编辑式排版",
    feel: "人文、有品。最像「值得收藏的一期」。",
    content: {
      x: 96,
      y: 1470,
      width: 560,
      font: F_SONG,
      epColor: "#C8102E",
      epSize: 19,
      epTracking: 0.24,
      titleColor: "#14110F",
      titleFont: F_SONG,
      titleSize: 54,
      titleWeight: 700,
      subColor: "#4A443E",
      subSize: 21,
      metaColor: "#8C857C",
      metaSize: 17,
      metaTracking: 0.1,
      rule: "#C8102E",
      ruleW: 3,
    },
  },
  whiteboard: {
    no: "06",
    name: "手绘白板",
    en: "WHITEBOARD",
    line: "马克笔 + 荧光笔 + 手写箭头。封面就是一块被讲过的白板。",
    borrow: "mg-styles-15 风格 04「线稿生长」",
    feel: "亲切、门槛低。最像「我讲给你听」。",
    content: {
      x: 104,
      y: 1478,
      width: 720,
      font: F_PRINT,
      epColor: "#D2453C",
      epSize: 22,
      titleColor: "#1F2933",
      titleFont: F_KAI,
      titleSize: 68,
      titleBg: "rgba(255,233,77,0.85)",
      subColor: "#4A5568",
      subSize: 24,
      metaColor: "#9AA0A6",
      metaSize: 19,
    },
  },
  neon: {
    no: "07",
    name: "霓虹夜市",
    en: "NEON / NIGHT MARKET",
    line: "钨丝管发光 + 双色色散 + 湿沥青反光。字不是印上去的，是通了电亮起来的。",
    borrow: "mg-styles-15 风格 15「花字冲击」（发光版）",
    feel: "夜、潮、带劲。最像「这事儿有意思」。",
    content: {
      x: 120,
      y: 1530,
      width: 840,
      align: "center",
      font: F_CN,
      epColor: "#FFE24B",
      epSize: 22,
      epBorder: "#FF2D95",
      epTracking: 0.2,
      titleColor: "#FFF6FB",
      titleFont: F_BLACK,
      titleSize: 78,
      titleWeight: 900,
      titleTracking: 0.04,
      titleShadow:
        "0 0 6px #FFF6FB, 0 0 18px #FF2D95, 0 0 38px #FF2D95, 0 0 64px rgba(255,45,149,0.6), 3px 0 2px rgba(0,229,255,0.75), -3px 0 2px rgba(255,45,149,0.75)",
      subColor: "#00E5FF",
      subSize: 25,
      metaColor: "rgba(255,246,251,0.5)",
      metaSize: 18,
      metaTracking: 0.16,
    },
  },
  retrofuture: {
    no: "08",
    name: "复古未来",
    en: "RETROFUTURE / 70s",
    line: "锈橙 + 米白 + 同心轨道 + 小卫星。像 1972 年那份「我们即将抵达」的宣传册。",
    borrow: "awesome-opus5-5-videos 的科普片版式（70 年代配色）",
    feel: "怀旧、乐观、有使命感。最像「一起去看看」。",
    content: {
      x: 96,
      y: 1470,
      width: 880,
      font: F_HELV,
      epColor: "#F4EADA",
      epSize: 19,
      epBg: "#C4552A",
      epTracking: 0.3,
      titleColor: "#3B2F2A",
      titleFont: F_ENG,
      titleSize: 66,
      titleWeight: 700,
      titleTracking: 0.01,
      subColor: "#7A5A3A",
      subSize: 23,
      metaColor: "#A08A6E",
      metaSize: 18,
      metaTracking: 0.14,
      rule: "#C4552A",
      ruleW: 4,
    },
  },
  pixel: {
    no: "09",
    name: "像素游戏",
    en: "PIXEL / 8-BIT",
    line: "限定色板 + 最近邻降采样 + 硬阴影 + 状态条。画面被当成一台 8 位机。",
    borrow: "mg-styles-15 风格 07「粗描边贴纸角色」（降采样成像素）",
    feel: "游戏、极客、童年。最像「这一关我带你过」。",
    content: {
      x: 96,
      y: 1396,
      width: 880,
      font: F_MONO,
      epColor: "#FFCD75",
      epSize: 22,
      epBg: "#B13E53",
      epTracking: 0.14,
      titleColor: "#F4F4F4",
      titleFont: F_MONO,
      titleSize: 74,
      titleWeight: 700,
      titleTracking: 0.06,
      titleShadow: "6px 6px 0 #5D275D",
      subColor: "#73EFF7",
      subSize: 24,
      metaColor: "#41A6F6",
      metaSize: 19,
      metaTracking: 0.1,
      box: "#41A6F6",
      padded: 18,
    },
  },
  vaporwave: {
    no: "10",
    name: "蒸汽波",
    en: "VAPORWAVE",
    line: "粉紫渐变 + 透视网格地平线 + 铬合金字 + 日文点缀。故意的不合时宜。",
    borrow: "RuiC-motion-reel 的「颜色是被算出来的」（把渐变当颜色源）",
    feel: "亚文化、迷幻。最像「这个频道有点上瘾」。",
    content: {
      x: 120,
      y: 1520,
      width: 840,
      align: "center",
      font: F_CN,
      epColor: "#05FFA1",
      epSize: 21,
      epTracking: 0.34,
      titleColor: "#FFFFFF",
      titleFont: F_BLACK,
      titleSize: 78,
      titleWeight: 900,
      titleTracking: 0.1,
      titleShadow: "0 0 26px rgba(1,205,254,0.9), 4px 4px 0 #B967FF",
      subColor: "#FFFB96",
      subSize: 24,
      metaColor: "rgba(255,255,255,0.72)",
      metaSize: 18,
      metaTracking: 0.2,
    },
  },
  ink: {
    no: "11",
    name: "水墨宣纸",
    en: "INK / RICE PAPER",
    line: "宣纸 + 浓淡墨 + 竖排题款 + 朱砂印。地球先生从贴纸变成一枚水墨形象。",
    borrow: "—（东方版式，三个参考库里没有，属原创方向）",
    feel: "静、有文化底。最像「慢慢讲，讲透」。",
    content: {
      // 右栏题款。titleSize 必须 < width/4，否则「缓存原理」会一个字一行地折下去
      x: 680,
      y: 660,
      width: 320,
      font: F_KAI,
      epColor: "#C0392B",
      epSize: 24,
      titleColor: "#1C1A17",
      titleFont: F_KAI,
      titleSize: 62,
      titleWeight: 400,
      subColor: "#6B6459",
      subSize: 23,
      metaColor: "#8A8177",
      metaSize: 18,
      metaTracking: 0.08,
      rule: "#1C1A17",
      ruleW: 2,
    },
  },
  comic: {
    no: "12",
    name: "漫画分格",
    en: "COMIC PANEL",
    line: "粗黑描边 + 网点 + 速度线 + 拟声词。头像那圈黑边天生就是漫画线。",
    borrow: "mg-styles-15 风格 07「粗描边贴纸角色」（放大成漫画）",
    feel: "热血、有叙事感。最像「翻开第一格」。",
    content: {
      x: 96,
      y: 1450,
      width: 888,
      font: F_CN,
      epColor: "#FFF8E7",
      epSize: 24,
      epBg: "#E63A2E",
      epBorder: "5px solid #111111",
      epTracking: 0.1,
      titleColor: "#FFD23F",
      titleFont: F_BLACK,
      titleSize: 84,
      titleWeight: 900,
      titleTracking: -0.01,
      titleStroke: "6px #111111",
      titleShadow: "8px 8px 0 #111111",
      subColor: "#111111",
      subSize: 25,
      subFont: F_CN,
      metaColor: "#6B6259",
      metaSize: 19,
      metaTracking: 0.08,
    },
  },
};

// ==================== 共用零件 ====================

/** 样张右下角的风格署名 —— 用该风格自己的字体写，顺便当设计的一部分 */
const StyleTag: React.FC<{
  s: StyleKey;
  color: string;
  font: string;
  size?: number;
  align?: "left" | "right";
  y?: number;
  x?: number;
  opacity?: number;
}> = ({ s, color, font, size = 22, align = "left", y = 1806, x = 96, opacity = 1 }) => {
  const m = STYLE_META[s];
  return (
    <div
      style={{
        position: "absolute",
        [align === "left" ? "left" : "right"]: x,
        top: y,
        fontFamily: font,
        fontSize: size,
        color,
        opacity,
        letterSpacing: "0.16em",
        whiteSpace: "nowrap",
      }}
    >
      STYLE {m.no} · {m.en}
    </div>
  );
};

/**
 * 样张内容块 —— 十二张样张共用同一组内容（SAMPLE），
 * 只有 `STYLE_META[style].content` 里的排版参数不同。
 * 于是"哪种风格排得出正文"变成可比的：不是内容变了，是排版语言变了。
 */
const ContentBlock: React.FC<{ cfg: ContentCfg }> = ({ cfg: c }) => {
  const center = c.align === "center";
  const pad = c.padded ?? 0;
  const chip = Boolean(c.epBg || c.epBorder);
  return (
    <div
      style={{
        position: "absolute",
        left: c.x,
        top: c.y,
        width: c.width,
        opacity: c.opacity ?? 1,
        textAlign: center ? "center" : "left",
        fontFamily: c.font,
      }}
    >
      {c.box ? (
        <div style={{ position: "absolute", inset: 0, border: `1px solid ${c.box}`, background: c.boxBg }} />
      ) : null}
      <div style={{ padding: pad, position: "relative" }}>
        {c.rule ? (
          <div
            style={{
              height: c.ruleW ?? 2,
              background: c.rule,
              width: center ? "100%" : "26%",
              marginBottom: Math.round(c.titleSize * 0.36),
            }}
          />
        ) : null}
        <div
          style={{
            display: "inline-block",
            fontSize: c.epSize ?? 20,
            color: c.epColor,
            letterSpacing: `${c.epTracking ?? 0}em`,
            background: c.epBg,
            border: c.epBorder,
            padding: chip ? "7px 16px" : 0,
            marginBottom: Math.round(c.titleSize * 0.2),
          }}
        >
          {SAMPLE.ep}
        </div>
        <div
          style={{
            fontFamily: c.titleFont ?? c.font,
            fontSize: c.titleSize,
            fontWeight: c.titleWeight ?? 700,
            color: c.titleColor,
            letterSpacing: `${c.titleTracking ?? 0}em`,
            textShadow: c.titleShadow,
            WebkitTextStroke: c.titleStroke,
            paintOrder: "stroke fill",
            lineHeight: 1.06,
            background: c.titleBg,
            display: c.titleBg ? "inline-block" : undefined,
            padding: c.titleBg
              ? `${Math.round(c.titleSize * 0.06)}px ${Math.round(c.titleSize * 0.16)}px`
              : undefined,
          }}
        >
          {SAMPLE.title}
        </div>
        <div
          style={{
            fontFamily: c.subFont ?? c.font,
            fontSize: c.subSize ?? 22,
            color: c.subColor,
            marginTop: Math.round(c.titleSize * 0.24),
            lineHeight: 1.35,
          }}
        >
          {SAMPLE.sub}
        </div>
        <div
          style={{
            fontFamily: c.metaFont ?? c.font,
            fontSize: c.metaSize ?? 18,
            color: c.metaColor,
            letterSpacing: `${c.metaTracking ?? 0}em`,
            marginTop: Math.round(c.titleSize * 0.22),
          }}
        >
          {SAMPLE.meta}
        </div>
      </div>
    </div>
  );
};

/** 确定性伪随机 —— Remotion 逐帧可能在多进程重算，Math.random() 会让同一帧每次不同 */
const rnd = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ==================== 01 · 瑞士网格 ====================

const Swiss: React.FC = () => {
  const bg = "#EDEDE8";
  const ink = "#101010";
  const red = "#E30613";
  const grey = "#8B8B85";
  const F = '"Swis721 BT", Arial, Helvetica, sans-serif';
  const M = 96;

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: F, color: ink }}>
      {/* 顶栏：一条实线 + 两端对齐的小标签 */}
      <div style={{ position: "absolute", left: M, right: M, top: 128, height: 3, background: ink }} />
      <div style={{ position: "absolute", left: M, top: 74, fontSize: 21, letterSpacing: "0.3em" }}>
        MRDAVE · BILIBILI
      </div>
      <div
        style={{
          position: "absolute",
          right: M,
          top: 74,
          fontSize: 21,
          letterSpacing: "0.3em",
          color: red,
        }}
      >
        {SIGN}
      </div>

      {/* 唯一的红：一根从栏顶贯到底的竖条，替所有装饰 */}
      <div style={{ position: "absolute", left: M, top: 300, width: 16, height: 980, background: red }} />

      {/* 地球落在第二列上，下方标图号 —— 瑞士式地把图片当"图 1"处理 */}
      <Img
        src={GLOBE}
        alt=""
        style={{ position: "absolute", left: M + 150, top: 430, width: 430, height: 430 }}
      />
      <div
        style={{
          position: "absolute",
          left: M + 150,
          top: 878,
          width: 430,
          display: "flex",
          justifyContent: "space-between",
          borderTop: `2px solid ${ink}`,
          paddingTop: 12,
          fontSize: 19,
          letterSpacing: "0.18em",
        }}
      >
        <span>FIG. 01</span>
        <span style={{ color: grey }}>Ø 140.57</span>
      </div>

      {/* 字标：紧字距、齐左边距、压在基线上 */}
      <div
        style={{
          position: "absolute",
          left: M,
          top: 1160,
          fontSize: 198,
          fontWeight: 900,
          lineHeight: 0.9,
          letterSpacing: "-0.048em",
        }}
      >
        {MARK}
      </div>
      <div style={{ position: "absolute", left: M, right: M, top: 1382, height: 3, background: ink }} />
      <div
        style={{
          position: "absolute",
          left: M,
          top: 1404,
          fontSize: 74,
          letterSpacing: "0.02em",
          color: red,
        }}
      >
        先生
      </div>
      <div
        style={{
          position: "absolute",
          right: M,
          top: 1452,
          fontSize: 22,
          letterSpacing: "0.28em",
          color: grey,
          textAlign: "right",
          lineHeight: 1.7,
        }}
      >
        1080 × 1920
        <br />
        30 FPS
      </div>

      <ContentBlock cfg={STYLE_META.swiss.content} />
      <StyleTag s="swiss" color={grey} font={F} />
    </AbsoluteFill>
  );
};

// ==================== 02 · 磷光终端 ====================

const CRT: React.FC = () => {
  const bg = "#050A06";
  const phos = "#3BFF7A";
  const dim = "#2E8F52";
  const amber = "#FFB300";
  const F = '"Cascadia Mono", Consolas, "Courier New", monospace';

  // 暗底才能用辉光 —— 亮底（纸白）下辉光会把整帧洗白，这是现有片头的一条 gotcha
  const bloom = `0 0 8px ${phos}, 0 0 26px ${phos}, 0 0 60px ${dim}`;

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: F }}>
      {/* 网格底纹 */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${dim}33 1px, transparent 1px), linear-gradient(90deg, ${dim}33 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      {/* 磷光晕（中心稍亮） */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${dim}30 0%, transparent 70%)`,
        }}
      />

      <div style={{ position: "absolute", left: 76, top: 76, color: dim, fontSize: 24, lineHeight: 1.8 }}>
        <div>SYS.INIT .......... OK</div>
        <div>VIDEO.OUT ......... 1080x1920</div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 76,
          top: 76,
          color: amber,
          fontSize: 24,
          textAlign: "right",
          textShadow: `0 0 12px ${amber}`,
        }}
      >
        ● REC
      </div>

      {/* 地球：转成磷光单色 */}
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 470,
          width: 560,
          height: 560,
        }}
      >
        <Img
          src={GLOBE}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            filter:
              "grayscale(1) brightness(1.28) contrast(1.2) sepia(1) saturate(4.5) hue-rotate(55deg)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 1052,
          width: 560,
          textAlign: "center",
          color: phos,
          fontSize: 22,
          letterSpacing: "0.22em",
          textShadow: `0 0 10px ${dim}`,
        }}
      >
        [ GEO.UNIT · ONLINE ]
      </div>

      {/* 字标：RGB 色散用 textShadow，不做分层绝对定位 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1148,
          textAlign: "center",
          fontSize: 150,
          letterSpacing: "0.06em",
          color: "#EAFFF0",
          textShadow: `4px 0 0 rgba(255,0,70,0.7), -4px 0 0 rgba(0,190,255,0.7), ${bloom}`,
        }}
      >
        {MARK.toUpperCase()}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1330,
          textAlign: "center",
          fontSize: 44,
          letterSpacing: "0.5em",
          color: amber,
          textShadow: `0 0 14px ${amber}`,
        }}
      >
        先生
      </div>

      {/* 命令行 + 光标 */}
      <div style={{ position: "absolute", left: 76, top: 1466, color: phos, fontSize: 34, textShadow: bloom }}>
        {"> "}
        <span style={{ color: amber }}>{SIGN}</span>
        <span style={{ color: dim }}>.log</span>
        <span
          style={{
            display: "inline-block",
            width: 20,
            height: 36,
            background: phos,
            marginLeft: 12,
            verticalAlign: "-6px",
            boxShadow: `0 0 14px ${phos}`,
          }}
        />
      </div>

      <ContentBlock cfg={STYLE_META.crt.content} />
      <StyleTag s="crt" color={dim} font={F} y={1820} />

      {/* 扫描线 + 暗角 —— 放在最上层，整帧统一处理 */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.42) 0px, rgba(0,0,0,0.42) 1px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 78% 62% at 50% 50%, transparent 45%, rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ==================== 03 · 工程蓝图 ====================

const Blueprint: React.FC = () => {
  const bg = "#0A2E6B";
  const line = "#CFE2FF";
  const dim = "#5E93D8";
  const F = 'Bahnschrift, "Arial Narrow", Arial, sans-serif';
  const NUM = '"OCR A Extended", "Courier New", monospace';
  const M = 84;
  const GX = 300;
  const GY = 500;
  const GD = 480;

  const dimLine = (top: number, label: string) => (
    <div style={{ position: "absolute", left: GX - 90, top, width: GD + 180, display: "flex", alignItems: "center" }}>
      <div style={{ width: 1, height: 22, background: line }} />
      <div style={{ flex: 1, height: 1, background: line, opacity: 0.85 }} />
      <div style={{ fontFamily: NUM, fontSize: 19, color: line, padding: "0 12px", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: line, opacity: 0.85 }} />
      <div style={{ width: 1, height: 22, background: line }} />
    </div>
  );

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: F }}>
      {/* 制图纸网格：10px 细格 + 50px 粗格 */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${line}14 1px, transparent 1px), linear-gradient(90deg, ${line}14 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${line}22 1px, transparent 1px), linear-gradient(90deg, ${line}22 1px, transparent 1px)`,
          backgroundSize: "250px 250px",
        }}
      />
      {/* 图框 */}
      <div style={{ position: "absolute", left: M, right: M, top: 150, bottom: 250, border: `3px solid ${line}` }} />
      <div style={{ position: "absolute", left: M + 14, right: M + 14, top: 164, bottom: 264, border: `1px solid ${line}66` }} />

      <div style={{ position: "absolute", left: M + 40, top: 96, color: line, fontSize: 26, letterSpacing: "0.22em" }}>
        MRDAVE / CHANNEL MARK
      </div>
      <div
        style={{ position: "absolute", right: M + 40, top: 96, color: dim, fontSize: 24, letterSpacing: "0.18em" }}
      >
        SHEET 1 OF 1
      </div>

      {/* 中心线 */}
      <div style={{ position: "absolute", left: GX + GD / 2, top: 240, width: 1, height: 1180, background: `${line}55` }} />
      <div style={{ position: "absolute", left: 200, top: GY + GD / 2, width: 700, height: 1, background: `${line}55` }} />

      {/* 地球：白描剪影 + 外接圆 */}
      <div
        style={{
          position: "absolute",
          left: GX,
          top: GY,
          width: GD,
          height: GD,
          borderRadius: "50%",
          border: `3px solid ${line}`,
        }}
      />
      <Img
        src={GLOBE}
        alt=""
        style={{
          position: "absolute",
          left: GX,
          top: GY,
          width: GD,
          height: GD,
          // 蓝图上的照片版：先把原图拆成灰阶、拉对比把海洋/大陆分开，
          // 再用 sepia + hue-rotate 把整块染成图纸同族的蓝。
          // 不要用 brightness(0) invert(1) —— 那会把 RGB 全压平，只剩一个白饼。
          filter:
            "grayscale(1) brightness(1.15) contrast(2.05) sepia(1) hue-rotate(180deg) saturate(3.2)",
        }}
      />
      {/* 半径引出线：往左上引。往右上引时文字会落在球体范围内、被球自己盖住 */}
      <div
        style={{
          position: "absolute",
          left: GX + GD / 2,
          top: GY + GD / 2,
          width: GD / 2 + 96,
          height: 1,
          background: line,
          transformOrigin: "left center",
          transform: "rotate(-148deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: GX + GD / 2 - 430,
          top: GY + GD / 2 - 212,
          fontFamily: NUM,
          fontSize: 20,
          color: line,
        }}
      >
        R 240.0
      </div>

      {/* 尺寸标注 */}
      {dimLine(430, "Ø 480.0")}
      {dimLine(GY + GD + 54, "480.0")}

      {/* 字标：工程字，宽字距 */}
      <div
        style={{
          position: "absolute",
          left: M + 40,
          top: 1170,
          color: line,
          fontSize: 132,
          fontWeight: 600,
          letterSpacing: "0.06em",
        }}
      >
        {MARK.toUpperCase()}
      </div>
      <div style={{ position: "absolute", left: M + 46, top: 1326, color: dim, fontSize: 30, letterSpacing: "0.34em" }}>
        {"// "}
        {SIGN}
      </div>

      {/* 手写体「先生」批注 */}
      <div
        style={{
          position: "absolute",
          left: 690,
          top: 1210,
          fontFamily: '"华文行楷", "Segoe Script", cursive',
          fontSize: 76,
          color: line,
          transform: "rotate(-6deg)",
          border: `2px solid ${line}`,
          borderRadius: "50%",
          padding: "10px 26px 22px",
        }}
      >
        先生
      </div>

      {/* 工程图标题栏 */}
      <div
        style={{
          position: "absolute",
          right: M + 14,
          bottom: 264,
          width: 560,
          border: `2px solid ${line}`,
          fontFamily: NUM,
          fontSize: 19,
          color: line,
        }}
      >
        {[
          ["TITLE", "MRDAVE 先生"],
          ["SIGN", SIGN],
          ["SCALE", "1 : 1"],
          ["UNIT", "PX"],
          ["DRAWN", "RXW"],
          ["DATE", "2026-10-08"],
        ].map(([k, v], i) => (
          <div
            key={k}
            style={{
              display: "flex",
              borderTop: i === 0 ? "none" : `1px solid ${line}77`,
            }}
          >
            <div style={{ width: 150, padding: "7px 12px", color: dim, borderRight: `1px solid ${line}77` }}>{k}</div>
            <div style={{ flex: 1, padding: "7px 12px" }}>{v}</div>
          </div>
        ))}
      </div>

      <ContentBlock cfg={STYLE_META.blueprint.content} />
      <StyleTag s="blueprint" color={dim} font={NUM} size={19} align="left" x={M + 40} y={1814} />
    </AbsoluteFill>
  );
};

// ==================== 04 · 孟菲斯波普 ====================

const Memphis: React.FC = () => {
  const bg = "#FFF4E3";
  const ink = "#141414";
  const pink = "#FF3D7F";
  const blue = "#2F6BFF";
  const yellow = "#FFD400";
  const teal = "#00C9A7";
  const F = '"Arial Rounded MT Bold", "Arial Black", Arial, sans-serif';
  const letters = MARK.split("");
  const letterColors = [pink, blue, teal, yellow, ink, pink, blue];

  /** 漂浮几何：撒在四周，绝不挡主体 */
  const bits: { x: number; y: number; el: React.ReactNode }[] = [
    {
      x: 70,
      y: 240,
      el: (
        <svg width="180" height="90" viewBox="0 0 180 90">
          <path d="M6 60 Q 30 6 54 60 T 102 60 T 150 60" fill="none" stroke={pink} strokeWidth="14" strokeLinecap="round" />
        </svg>
      ),
    },
    { x: 830, y: 190, el: <div style={{ width: 130, height: 130, borderRadius: "50%", background: yellow, border: `8px solid ${ink}` }} /> },
    {
      x: 800,
      y: 560,
      el: (
        <svg width="150" height="140" viewBox="0 0 150 140">
          <polygon points="75,8 142,132 8,132" fill={teal} stroke={ink} strokeWidth="8" />
        </svg>
      ),
    },
    {
      x: 60,
      y: 980,
      el: (
        <svg width="160" height="180" viewBox="0 0 60 70">
          <polyline points="4,66 20,10 36,52 56,4" fill="none" stroke={blue} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    { x: 870, y: 1080, el: <div style={{ width: 96, height: 96, background: pink, border: `8px solid ${ink}`, transform: "rotate(18deg)" }} /> },
    { x: 110, y: 1500, el: <div style={{ width: 44, height: 44, borderRadius: "50%", background: blue }} /> },
    { x: 900, y: 1620, el: <div style={{ width: 44, height: 44, borderRadius: "50%", background: pink }} /> },
  ];

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: F }}>
      {/* 底纹圆点 */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${ink}26 2.5px, transparent 2.5px)`,
          backgroundSize: "46px 46px",
        }}
      />
      {bits.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x, top: b.y }}>
          {b.el}
        </div>
      ))}

      {/* 地球：粗描边 + 硬偏移影 + 微旋转 */}
      <div style={{ position: "absolute", left: 250, top: 470, width: 580, height: 580 }}>
        <Img
          src={GLOBE}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            transform: "rotate(-7deg)",
            filter: "drop-shadow(16px 16px 0 #141414)",
          }}
        />
        {/* 描一圈粗边，让它更像贴纸 */}
        <div
          style={{
            position: "absolute",
            inset: -14,
            borderRadius: "50%",
            border: `12px solid ${ink}`,
          }}
        />
      </div>

      {/* 字标：逐字变色 + 逐字旋转 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center" }}>
        {letters.map((ch, i) => (
          <span
            key={i}
            style={{
              fontSize: 168,
              lineHeight: 1,
              color: letterColors[i % letterColors.length],
              WebkitTextStroke: `7px ${ink}`,
              paintOrder: "stroke fill",
              transform: `rotate(${[-6, 4, -3, 7, -5, 3, -8][i % 7]}deg)`,
              margin: "0 4px",
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* 「先生」做成一张歪贴纸 */}
      <div
        style={{
          position: "absolute",
          left: 620,
          top: 1352,
          background: pink,
          color: "#fff",
          border: `8px solid ${ink}`,
          padding: "10px 26px 18px",
          fontSize: 62,
          transform: "rotate(-8deg)",
          boxShadow: `12px 12px 0 ${ink}`,
        }}
      >
        先生
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 1372,
          background: yellow,
          border: `8px solid ${ink}`,
          padding: "6px 20px 14px",
          fontSize: 42,
          transform: "rotate(3deg)",
        }}
      >
        {SIGN}
      </div>

      <ContentBlock cfg={STYLE_META.memphis.content} />
      <StyleTag s="memphis" color={ink} font={F} size={20} y={1760} />
    </AbsoluteFill>
  );
};

// ==================== 05 · 杂志封面 ====================

const Editorial: React.FC = () => {
  const paper = "#FBFAF6";
  const ink = "#14110F";
  const red = "#C8102E";
  const grey = "#6E6A63";
  const SERIF = '"Bodoni MT", "Bodoni Bd BT", Georgia, serif';
  const BODY = 'Georgia, "Times New Roman", serif';
  const M = 84;

  return (
    <AbsoluteFill style={{ background: paper, color: ink }}>
      {/* 出血头像：从顶部压下来，边缘做网点（杂志照片的印刷感） */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1010, overflow: "hidden" }}>
        <Img
          src={GLOBE}
          alt=""
          style={{ position: "absolute", left: 190, top: 150, width: 700, height: 700 }}
        />
        {/* 网点只覆在地球自己身上（拿贴纸的 alpha 当遮罩）。
            铺满整块会连白底一起变成灰点阵，整张图像蒙了一层雾。 */}
        <div
          style={{
            position: "absolute",
            left: 190,
            top: 150,
            width: 700,
            height: 700,
            backgroundImage: `radial-gradient(${ink} 2.6px, transparent 2.6px)`,
            backgroundSize: "13px 13px",
            opacity: 0.42,
            mixBlendMode: "multiply",
            WebkitMaskImage: `url(${GLOBE})`,
            WebkitMaskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      </div>

      {/* 刊头：超大衬线，压紧字距，压在照片上 */}
      <div
        style={{
          position: "absolute",
          left: M,
          top: 40,
          fontFamily: SERIF,
          fontSize: 196,
          lineHeight: 0.86,
          letterSpacing: "-0.035em",
        }}
      >
        {MARK}
      </div>
      {/* 刊头下的双细线 */}
      <div style={{ position: "absolute", left: M, right: M, top: 220, height: 3, background: ink }} />
      <div style={{ position: "absolute", left: M, right: M, top: 229, height: 1, background: ink }} />

      {/* 左侧导读栏 */}
      <div style={{ position: "absolute", left: M, top: 1050, width: 420, fontFamily: BODY }}>
        {[
          ["本期", "一颗会眨眼的地球"],
          ["签名", SIGN],
          ["刊号", "NO.001"],
        ].map(([k, v], i) => (
          <div key={k} style={{ borderTop: `1px solid ${ink}`, paddingTop: 12, marginTop: i === 0 ? 0 : 26 }}>
            <div style={{ fontSize: 19, letterSpacing: "0.3em", color: red, marginBottom: 6 }}>{k}</div>
            <div style={{ fontSize: 40, lineHeight: 1.3 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* 右侧封面语：只写角色名，不写内容主张（片头不该替频道许诺选题） */}
      <div
        style={{
          position: "absolute",
          right: M,
          top: 1050,
          width: 430,
          fontFamily: SERIF,
          fontSize: 56,
          lineHeight: 1.28,
          letterSpacing: "0.04em",
          color: red,
          textAlign: "right",
        }}
      >
        地球先生
      </div>

      {/* 朱红圆印，压在刊头右下角 */}
      <div
        style={{
          position: "absolute",
          right: M + 10,
          top: 232,
          width: 168,
          height: 168,
          borderRadius: "50%",
          background: red,
          color: paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SERIF,
          fontSize: 62,
          letterSpacing: "0.06em",
          boxShadow: `6px 6px 0 ${ink}`,
        }}
      >
        先生
      </div>

      {/* 条码 + 定价，杂志封面的收尾 */}
      <div style={{ position: "absolute", left: M, bottom: 128, display: "flex", alignItems: "flex-end", gap: 26 }}>
        <div
          style={{
            width: 260,
            height: 92,
            backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 3px, transparent 3px 6px, ${ink} 6px 8px, transparent 8px 15px)`,
          }}
        />
        <div style={{ fontFamily: BODY, fontSize: 20, letterSpacing: "0.2em", color: grey, lineHeight: 1.6 }}>
          BILIBILI
          <br />
          知识科普向
        </div>
      </div>

      <ContentBlock cfg={STYLE_META.editorial.content} />
      <StyleTag s="editorial" color={grey} font={BODY} size={19} align="right" x={M} y={1824} />
    </AbsoluteFill>
  );
};

// ==================== 06 · 手绘白板 ====================

const Whiteboard: React.FC = () => {
  const board = "#FFFDF8";
  const marker = "#1B3A6B";
  const pen = "#D93A2B";
  const F = '"Segoe Print", "Bradley Hand ITC", cursive';
  const CN = '"华文行楷", "方正舒体", KaiTi, "Segoe Print", cursive';
  const M = 90;
  const GX = 250;
  const GY = 470;
  const GD = 560;

  return (
    <AbsoluteFill style={{ background: board, fontFamily: F, color: marker }}>
      {/* 白板笔迹的灰雾 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 30%, #00000010 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 75% 70%, #0000000C 0%, transparent 70%)",
        }}
      />

      <Img src={GLOBE} alt="" style={{ position: "absolute", left: GX, top: GY, width: GD, height: GD }} />

      {/* 手绘圈：两笔画不重合，反而更像马克笔 */}
      <svg
        style={{ position: "absolute", left: GX - 70, top: GY - 60, pointerEvents: "none" }}
        width={GD + 160}
        height={GD + 150}
        viewBox={`0 0 ${GD + 160} ${GD + 150}`}
      >
        <ellipse
          cx={(GD + 160) / 2}
          cy={(GD + 150) / 2}
          rx={GD / 2 + 58}
          ry={GD / 2 + 46}
          fill="none"
          stroke={pen}
          strokeWidth="9"
          strokeLinecap="round"
          transform={`rotate(-4 ${(GD + 160) / 2} ${(GD + 150) / 2})`}
          strokeDasharray="1200 40"
        />
        <ellipse
          cx={(GD + 160) / 2 + 6}
          cy={(GD + 150) / 2 - 5}
          rx={GD / 2 + 52}
          ry={GD / 2 + 52}
          fill="none"
          stroke={pen}
          strokeWidth="5"
          opacity="0.55"
          strokeLinecap="round"
          transform={`rotate(3 ${(GD + 160) / 2} ${(GD + 150) / 2})`}
          strokeDasharray="900 320"
        />
      </svg>

      {/* 手写箭头 + 批注 */}
      <svg style={{ position: "absolute", left: 760, top: 300 }} width="260" height="220" viewBox="0 0 260 220">
        <path d="M250 16 C 210 120, 150 150, 30 168" fill="none" stroke={pen} strokeWidth="8" strokeLinecap="round" />
        <polyline points="62,140 26,170 70,190" fill="none" stroke={pen} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: 828, top: 236, fontFamily: CN, fontSize: 54, color: pen, transform: "rotate(4deg)" }}>
        就是它
      </div>

      {/* 字标：荧光笔高亮 + 手写体 */}
      <div style={{ position: "absolute", left: M - 20, top: 1146, width: 900 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 52,
            width: 810,
            height: 116,
            background: "#FFE94D",
            transform: "rotate(-1.4deg)",
            mixBlendMode: "multiply",
          }}
        />
        <div style={{ position: "relative", fontSize: 156, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{MARK}</div>
      </div>

      {/* 「先生」：手写加方框，框故意画歪 */}
      <div style={{ position: "absolute", left: 700, top: 1330, transform: "rotate(-5deg)" }}>
        <svg style={{ position: "absolute", left: -14, top: -12 }} width="240" height="150" viewBox="0 0 240 150">
          <rect
            x="8"
            y="8"
            width="224"
            height="134"
            fill="none"
            stroke={pen}
            strokeWidth="7"
            strokeLinecap="round"
            rx="6"
          />
        </svg>
        <div style={{ position: "relative", fontFamily: CN, fontSize: 72, color: pen, padding: "22px 34px 30px" }}>先生</div>
      </div>

      <div style={{ position: "absolute", left: M - 18, top: 1372, fontFamily: CN, fontSize: 46, color: marker, opacity: 0.82 }}>
        {SIGN}
      </div>

      <ContentBlock cfg={STYLE_META.whiteboard.content} />
      <StyleTag s="whiteboard" color="#9AA0A6" font={F} size={20} y={1800} x={M - 18} />
    </AbsoluteFill>
  );
};

// ==================== 07 · 霓虹夜市 ====================

const Neon: React.FC = () => (
  <AbsoluteFill style={{ background: "#0A0713", overflow: "hidden" }}>
    {/* 湿沥青上反着两片霓虹 */}
    <div style={{ position: "absolute", left: -180, top: 160, width: 980, height: 980, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,149,0.34), transparent 62%)" }} />
    <div style={{ position: "absolute", right: -240, top: 640, width: 920, height: 920, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,229,255,0.26), transparent 64%)" }} />
    {/* 招牌灯管 */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 148, height: 4, background: "#FF2D95", boxShadow: "0 0 14px #FF2D95, 0 0 46px rgba(255,45,149,0.7)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 160, height: 2, background: "#00E5FF", boxShadow: "0 0 12px #00E5FF" }} />
    {/* 吊着的 OPEN 挂牌 */}
    <div style={{ position: "absolute", left: 748, top: 288, transform: "rotate(-8deg)", transformOrigin: "top center" }}>
      <div style={{ width: 2, height: 86, background: "rgba(255,246,251,0.32)", margin: "0 auto" }} />
      <div style={{ border: "3px solid #FFE24B", borderRadius: 14, padding: "12px 22px", fontFamily: F_BLACK, fontSize: 34, color: "#FFE24B", letterSpacing: "0.12em", textShadow: "0 0 10px #FFE24B, 0 0 32px rgba(255,226,75,0.75)" }}>OPEN</div>
    </div>
    {/* 竖排汉字霓虹 */}
    <div style={{ position: "absolute", left: 74, top: 420, writingMode: "vertical-rl", fontFamily: F_CN, fontSize: 40, letterSpacing: "0.26em", color: "#00E5FF", textShadow: "0 0 8px #00E5FF, 0 0 26px #00E5FF, 0 0 58px rgba(0,229,255,0.55)" }}>知识科普</div>
    <div style={{ position: "absolute", right: 88, top: 700, writingMode: "vertical-rl", fontFamily: F_KAI, fontSize: 48, letterSpacing: "0.22em", color: "#FF2D95", textShadow: "0 0 8px #FF2D95, 0 0 28px #FF2D95, 0 0 64px rgba(255,45,149,0.6)" }}>先生</div>
    {/* 地球被一圈灯管描了边 */}
    <div style={{ position: "absolute", left: 146, top: 396, width: 788, height: 788, borderRadius: "50%", border: "3px solid rgba(0,229,255,0.85)", boxShadow: "0 0 26px rgba(0,229,255,0.75), inset 0 0 46px rgba(255,45,149,0.35)" }} />
    <Img src={GLOBE} style={{ position: "absolute", left: 174, top: 424, width: 732, height: 732, filter: "saturate(1.5) contrast(1.12) brightness(0.96)" }} />
    <ContentBlock cfg={STYLE_META.neon.content} />
    <StyleTag s="neon" color="rgba(255,246,251,0.55)" font={F_MONO} opacity={0.9} />
  </AbsoluteFill>
);

// ==================== 08 · 复古未来 ====================

const RetroFuture: React.FC = () => (
  <AbsoluteFill style={{ background: "#E8DCC8", overflow: "hidden" }}>
    {/* 同心轨道 */}
    {[300, 424, 548, 672].map((d, i) => (
      <div
        key={d}
        style={{
          position: "absolute",
          left: 540 - d / 2,
          top: 640 - d / 2,
          width: d,
          height: d,
          borderRadius: "50%",
          border: `${i % 2 ? 2 : 1}px ${i % 2 ? "dashed" : "solid"} rgba(196,85,42,${i % 2 ? 0.42 : 0.58})`,
          transform: `rotate(${i * 19}deg)`,
        }}
      />
    ))}
    <Img src={GLOBE} style={{ position: "absolute", left: 300, top: 400, width: 480, height: 480, filter: "sepia(0.42) saturate(1.45) contrast(1.06)" }} />
    {/* 一颗卫星、一块碎片 */}
    <div style={{ position: "absolute", left: 888, top: 352, width: 26, height: 26, borderRadius: "50%", background: "#C4552A" }} />
    <div style={{ position: "absolute", left: 194, top: 876, width: 18, height: 18, background: "#3B2F2A", transform: "rotate(45deg)" }} />
    {/* 页眉 */}
    <div style={{ position: "absolute", left: 96, top: 166, display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ background: "#C4552A", color: "#F4EADA", fontFamily: F_MONO, fontSize: 20, letterSpacing: "0.3em", padding: "8px 18px" }}>MISSION</div>
      <div style={{ fontFamily: F_MONO, fontSize: 20, color: "#7A5A3A", letterSpacing: "0.24em" }}>ORBIT No. 07</div>
    </div>
    <div style={{ position: "absolute", left: 96, top: 222, right: 96, height: 3, background: "#3B2F2A" }} />
    <div style={{ position: "absolute", left: 96, bottom: 154, fontFamily: F_MONO, fontSize: 19, color: "#A08A6E", letterSpacing: "0.22em" }}>
      APPROVED FOR ALL AUDIENCES · 知识科普向
    </div>
    <ContentBlock cfg={STYLE_META.retrofuture.content} />
    <StyleTag s="retrofuture" color="#A08A6E" font={F_MONO} />
  </AbsoluteFill>
);

// ==================== 09 · 像素游戏 ====================

const Pixel: React.FC = () => (
  <AbsoluteFill style={{ background: "#1A1C2C", overflow: "hidden" }}>
    {/* 星空：硬边小方块，不用圆点——这个风格里没有曲线 */}
    {Array.from({ length: 64 }, (_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: Math.round(rnd(i * 3 + 1) * 1064 / 8) * 8,
          top: Math.round(rnd(i * 3 + 2) * 1904 / 8) * 8,
          width: Math.round(rnd(i * 3 + 3) * 3 + 1) * 6,
          height: Math.round(rnd(i * 3 + 3) * 3 + 1) * 6,
          background: ["#F4F4F4", "#73EFF7", "#FFCD75"][i % 3],
          opacity: 0.55 + rnd(i * 5 + 4) * 0.45,
        }}
      />
    ))}
    {/* 远处的地面 */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 1304, height: 24, background: "#38B764" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1328, height: 8, background: "#A7F070" }} />
    <Img src={GLOBE_PX} style={{ position: "absolute", left: 172, top: 344, width: 736, height: 736, imageRendering: "pixelated", filter: "saturate(1.7) contrast(1.18)" }} />
    {/* 状态条 */}
    <div style={{ position: "absolute", left: 96, top: 148, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ fontFamily: F_MONO, fontSize: 22, color: "#1A1C2C", background: "#FFCD75", padding: "4px 12px", letterSpacing: "0.08em" }}>LV.05</div>
      <div style={{ fontFamily: F_MONO, fontSize: 22, color: "#F4F4F4", letterSpacing: "0.14em" }}>MRDAVE</div>
    </div>
    <div style={{ position: "absolute", left: 96, top: 196, display: "flex", gap: 6 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ width: 22, height: 22, background: i < 7 ? "#B13E53" : "#5D275D", border: "2px solid #1A1C2C" }} />
      ))}
    </div>
    <div style={{ position: "absolute", right: 96, top: 152, fontFamily: F_MONO, fontSize: 22, color: "#41A6F6", letterSpacing: "0.16em" }}>×03</div>
    <ContentBlock cfg={STYLE_META.pixel.content} />
    <StyleTag s="pixel" color="#41A6F6" font={F_MONO} />
  </AbsoluteFill>
);

// ==================== 10 · 蒸汽波 ====================

const Vaporwave: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(to bottom, #2B0B4D 0%, #7A1E6E 54%, #FF6EC7 100%)", overflow: "hidden" }}>
    {/* 落日圆盘 */}
    <div style={{ position: "absolute", left: 140, top: 286, width: 800, height: 800, borderRadius: "50%", background: "linear-gradient(to bottom, #FFFB96, #FF71CE 58%, #B967FF)" }} />
    {/* 落日下半部的切片 */}
    {Array.from({ length: 7 }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: 140, top: 686 + i * 56, width: 800, height: 14 + i * 4, background: "#7A1E6E" }} />
    ))}
    {/* 透视网格地平线 */}
    <div style={{ position: "absolute", left: -400, top: 1000, width: 1880, height: 1200, transform: "perspective(420px) rotateX(74deg)", transformOrigin: "top center", backgroundImage: "linear-gradient(rgba(1,205,254,0.75) 3px, transparent 3px), linear-gradient(90deg, rgba(255,113,206,0.75) 3px, transparent 3px)", backgroundSize: "120px 120px" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 996, height: 5, background: "#01CDFE" }} />
    {/* 地球：镀铬处理 */}
    <Img src={GLOBE} style={{ position: "absolute", left: 214, top: 424, width: 652, height: 652, filter: "saturate(0.6) contrast(1.25) brightness(1.06) hue-rotate(300deg)" }} />
    <div style={{ position: "absolute", left: 206, top: 416, width: 668, height: 668, borderRadius: "50%", border: "4px solid rgba(255,251,150,0.85)" }} />
    {/* 日文点缀 */}
    <div style={{ position: "absolute", left: 92, top: 300, writingMode: "vertical-rl", fontFamily: F_CN, fontSize: 34, letterSpacing: "0.3em", color: "rgba(255,251,150,0.8)" }}>知識・解説</div>
    <div style={{ position: "absolute", right: 96, top: 660, writingMode: "vertical-rl", fontFamily: F_CN, fontSize: 34, letterSpacing: "0.3em", color: "rgba(1,205,254,0.85)" }}>地球先生</div>
    <ContentBlock cfg={STYLE_META.vaporwave.content} />
    <StyleTag s="vaporwave" color="rgba(255,255,255,0.6)" font={F_MONO} />
  </AbsoluteFill>
);

// ==================== 11 · 水墨宣纸 ====================

const Ink: React.FC = () => (
  <AbsoluteFill style={{ background: "#EFE7D6", overflow: "hidden" }}>
    {/* 纸纤维 */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(28,26,23,0.035) 0px, rgba(28,26,23,0.035) 1px, transparent 1px, transparent 4px)" }} />
    {/* 远山：用 clip-path 起形，不引 SVG */}
    <div style={{ position: "absolute", left: -60, top: 880, width: 720, height: 320, background: "rgba(28,26,23,0.11)", clipPath: "polygon(0% 100%, 26% 24%, 44% 64%, 62% 8%, 100% 100%)" }} />
    <div style={{ position: "absolute", left: 400, top: 950, width: 780, height: 250, background: "rgba(28,26,23,0.07)", clipPath: "polygon(0% 100%, 30% 34%, 52% 72%, 74% 18%, 100% 100%)" }} />
    {/* 地球：淡化成一枚水墨形象，边缘用径向遮罩收掉硬圈 */}
    <div style={{ position: "absolute", left: 76, top: 396, width: 560, height: 560, borderRadius: "50%", WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 78%, transparent 100%)", maskImage: "radial-gradient(circle at 50% 50%, #000 78%, transparent 100%)" }}>
      <Img src={GLOBE} style={{ width: "100%", height: "100%", filter: "grayscale(0.62) sepia(0.55) contrast(1.22) brightness(0.97)" }} />
    </div>
    <div style={{ position: "absolute", left: 76, top: 396, width: 560, height: 560, borderRadius: "50%", border: "2px solid rgba(28,26,23,0.5)" }} />
    {/* 题款竖排 + 朱砂印 */}
    <div style={{ position: "absolute", left: 56, top: 250, writingMode: "vertical-rl", fontFamily: F_KAI, fontSize: 30, letterSpacing: "0.24em", color: "#6B6459" }}>知识科普向</div>
    <div style={{ position: "absolute", left: 84, top: 1224, width: 74, height: 74, background: "#C0392B", color: "#EFE7D6", fontFamily: F_KAI, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-3deg)" }}>先</div>
    <div style={{ position: "absolute", left: 168, top: 1224, width: 74, height: 74, background: "#C0392B", color: "#EFE7D6", fontFamily: F_KAI, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(2deg)" }}>生</div>
    <div style={{ position: "absolute", right: 96, top: 1520, height: 300, width: 3, background: "rgba(28,26,23,0.35)" }} />
    <ContentBlock cfg={STYLE_META.ink.content} />
    <StyleTag s="ink" color="#8A8177" font={F_KAI} />
  </AbsoluteFill>
);

// ==================== 12 · 漫画分格 ====================

const Comic: React.FC = () => (
  <AbsoluteFill style={{ background: "#FFF8E7", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 40, top: 40, width: 1000, height: 1330, border: "7px solid #111111", overflow: "hidden" }}>
      {/* 网点 */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(17,17,17,0.5) 2.4px, transparent 2.6px)", backgroundSize: "18px 18px" }} />
      {/* 放射速度线：整圆铺，再用遮罩挖成地球外围的一圈 */}
      <div style={{ position: "absolute", left: 100, top: 110, width: 800, height: 800, borderRadius: "50%", background: "repeating-conic-gradient(from 0deg, #111111 0deg 1.1deg, transparent 1.1deg 5.4deg)", WebkitMaskImage: "radial-gradient(circle, transparent 236px, #000 242px, #000 400px, transparent 402px)", maskImage: "radial-gradient(circle, transparent 236px, #000 242px, #000 400px, transparent 402px)" }} />
      <div style={{ position: "absolute", left: 172, top: 182, width: 656, height: 656, borderRadius: "50%", background: "#FFF8E7", border: "7px solid #111111" }} />
      <Img src={GLOBE} style={{ position: "absolute", left: 190, top: 200, width: 620, height: 620, filter: "saturate(1.55) contrast(1.22)" }} />
      {/* 拟声词 */}
      <div style={{ position: "absolute", left: 706, top: 116, transform: "rotate(-11deg)" }}>
        <div style={{ fontFamily: F_CN, fontSize: 92, fontWeight: 900, color: "#FFD23F", WebkitTextStroke: "7px #111111", paintOrder: "stroke fill", letterSpacing: "0.04em" }}>咚！</div>
      </div>
      {/* 旁白框 */}
      <div style={{ position: "absolute", left: 76, top: 76, background: "#FFF8E7", border: "5px solid #111111", padding: "8px 18px", fontFamily: F_CN, fontSize: 24, color: "#111111" }}>PANEL 1 — 地球先生登场</div>
      <div style={{ position: "absolute", right: 76, bottom: 62, background: "#FFD23F", border: "5px solid #111111", padding: "10px 20px", fontFamily: F_CN, fontSize: 26, fontWeight: 700, color: "#111111" }}>知识科普向</div>
    </div>
    <ContentBlock cfg={STYLE_META.comic.content} />
    <StyleTag s="comic" color="#6B6259" font={F_MONO} />
  </AbsoluteFill>
);

// ==================== 分发 ====================

const REGISTRY: Record<StyleKey, React.FC> = {
  swiss: Swiss,
  crt: CRT,
  blueprint: Blueprint,
  memphis: Memphis,
  editorial: Editorial,
  whiteboard: Whiteboard,
  neon: Neon,
  retrofuture: RetroFuture,
  pixel: Pixel,
  vaporwave: Vaporwave,
  ink: Ink,
  comic: Comic,
};

export const StyleSample: React.FC<{ style: StyleKey }> = ({ style }) => {
  const C = REGISTRY[style];
  return <C />;
};

export const STYLE_SAMPLE_FRAMES = 30;
