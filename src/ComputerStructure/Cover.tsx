import React from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { CHANNEL } from "../shared/brand";

/**
 * 《计算机系统层次结构》视频封面 —— 静态帧，供 `npx remotion still` 出 PNG。
 *
 *   npx remotion still ComputerStructureCover     out/computer-structure-cover.png      # 竖版 1080×1920
 *   npx remotion still ComputerStructureCoverWide out/computer-structure-cover-wide.png # 横版 1920×1080
 *
 * 设计思路：
 *   1. 沿用正片的视觉语言（#F8F9FC 纸底 + #2563EB 主色 + 白卡片 + 圆角 16/18），
 *      让封面和点进去的正片是同一套设计，不像两张皮。
 *   2. 封面只讲一件事：层次结构。五层梯形堆叠（越往下越宽、越实），
 *      一眼就能读出"从应用软件到硬件，层层抽象"。
 *   3. 缩略图要能认出来：标题最大，右上角红底"考研 408"是唯一一块非蓝彩色。
 *   4. 频道品牌取实测值（src/shared/brand.ts）：真实头像 + MRDave先生。
 *
 * 同一份内容两种排版：竖版单列居中（标题 → 堆叠 → 关键词），横版左右分栏
 * （左标题、右堆叠）。尺寸全部走下面的 MODE 表，改比例不用碰 JSX。
 *
 * 注意：本组件不读 useCurrentFrame，任何一帧渲染结果都一样。
 */

const C = {
  bg: "#F8F9FC",
  card: "#FFFFFF",
  accent: "#2563EB",
  text: "#1F2937",
  textMid: "#6B7280",
  textDim: "#9CA3AF",
  border: "#E5E7EB",
};

/** 五层结构：越靠下越"贴近硬件"，所以越宽、色越实。wf = 占堆叠总宽的比例。 */
const LAYERS = [
  { cn: "应用软件", en: "App · 浏览器 · 游戏", wf: 0.7081, bg: "#EAF1FE", fg: C.text, sub: "#6B7280" },
  { cn: "高级语言", en: "C · Java · Python", wf: 0.7811, bg: "#D8E6FD", fg: C.text, sub: "#6B7280" },
  { cn: "汇编语言", en: "MOV · ADD · JMP", wf: 0.8541, bg: "#B7D1FB", fg: C.text, sub: "#4B5563" },
  { cn: "机器语言", en: "1011 0101 0010", wf: 0.9270, bg: "#7FA9F5", fg: "#0B2545", sub: "#1E3A5F" },
  { cn: "硬　件", en: "CPU · 存储器 · I/O", wf: 1, bg: C.accent, fg: "#FFFFFF", sub: "rgba(255,255,255,0.82)" },
];

const KEYWORDS = ["冯·诺依曼机", "硬件 vs 软件", "源程序 → 可执行"];

/** 两种画幅的全部尺寸。竖版这一列是调好的成品，别随手改数。 */
const MODE = {
  portrait: {
    pad: "76px 74px",
    avatar: 92,
    avatarRadius: 26,
    headerGap: 22,
    handle: 36,
    sign: 24,
    sealFont: 32,
    sealPad: "14px 30px",
    badge: { mt: 92, pad: "12px 34px", font: 28, spacing: 5, justify: "center" as const },
    title: { mt: 40, font: 148, spacing: 6, lineHeight: 1.12, line2Gap: 6, align: "center" as const },
    sub: { mt: 30, font: 34, spacing: 4, align: "center" as const, dashW: 46 },
    stack: { mt: 116, width: 932, gap: 18, bandH: 146, radius: 18, pad: "0 38px", cn: 52, en: 26 },
    chips: { mt: "auto" as const, width: 932 as number | string, gap: 18, pad: "18px 26px", font: 29 },
    twoColumn: false,
    colGap: 0,
  },
  wide: {
    pad: "72px 84px",
    avatar: 78,
    avatarRadius: 22,
    headerGap: 18,
    handle: 32,
    sign: 22,
    sealFont: 28,
    sealPad: "12px 26px",
    badge: { mt: 0, pad: "10px 28px", font: 24, spacing: 4, justify: "flex-start" as const },
    title: { mt: 38, font: 146, spacing: 6, lineHeight: 1.1, line2Gap: 4, align: "left" as const },
    sub: { mt: 26, font: 32, spacing: 4, align: "left" as const, dashW: 40 },
    stack: { mt: 0, width: 742, gap: 16, bandH: 106, radius: 16, pad: "0 28px", cn: 38, en: 21 },
    chips: { mt: 46, width: "100%" as number | string, gap: 16, pad: "16px 22px", font: 27 },
    twoColumn: true,
    colGap: 76,
  },
};

export const ComputerStructureCover: React.FC = () => {
  const { width, height } = useVideoConfig();
  const m = width > height ? MODE.wide : MODE.portrait;

  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: m.headerGap }}>
        <Img
          src={staticFile("shared/avatar.jpg")}
          style={{
            width: m.avatar,
            height: m.avatar,
            borderRadius: m.avatarRadius,
            border: `2px solid ${C.border}`,
            objectFit: "cover",
          }}
        />
        <div>
          <div style={{ fontSize: m.handle, fontWeight: 800, color: C.text, letterSpacing: 1 }}>
            {CHANNEL.handle}
          </div>
          <div style={{ fontSize: m.sign, color: C.textDim, letterSpacing: 3, marginTop: 4 }}>
            {CHANNEL.sign}
          </div>
        </div>
      </div>

      <div
        style={{
          background: CHANNEL.colors.seal,
          color: "#FFFFFF",
          fontSize: m.sealFont,
          fontWeight: 800,
          letterSpacing: 3,
          padding: m.sealPad,
          borderRadius: 999,
          boxShadow: "0 8px 20px rgba(229,52,28,0.28)",
        }}
      >
        考研 408
      </div>
    </div>
  );

  const badge = (
    <div style={{ marginTop: m.badge.mt, display: "flex", justifyContent: m.badge.justify }}>
      <div
        style={{
          padding: m.badge.pad,
          borderRadius: 999,
          border: `1.5px solid ${C.accent}40`,
          backgroundColor: `${C.accent}0A`,
          color: C.accent,
          fontSize: m.badge.font,
          fontWeight: 600,
          letterSpacing: m.badge.spacing,
        }}
      >
        计算机组成原理 · 第一章
      </div>
    </div>
  );

  const title = (
    <div style={{ marginTop: m.title.mt, textAlign: m.title.align }}>
      <div
        style={{
          fontSize: m.title.font,
          fontWeight: 900,
          color: C.text,
          letterSpacing: m.title.spacing,
          lineHeight: m.title.lineHeight,
        }}
      >
        计算机系统
      </div>
      <div
        style={{
          fontSize: m.title.font,
          fontWeight: 900,
          color: C.accent,
          letterSpacing: m.title.spacing,
          lineHeight: m.title.lineHeight,
          marginTop: m.title.line2Gap,
        }}
      >
        层次结构
      </div>
      <div
        style={{
          marginTop: m.sub.mt,
          display: "flex",
          alignItems: "center",
          justifyContent: m.sub.align === "center" ? "center" : "flex-start",
          gap: 18,
        }}
      >
        <div
          style={{
            width: m.sub.dashW,
            height: 4,
            borderRadius: 2,
            background: `${C.accent}55`,
            flexShrink: 0,
          }}
        />
        <div style={{ fontSize: m.sub.font, color: C.textMid, letterSpacing: m.sub.spacing }}>
          从硬件到应用，层层封装
        </div>
        <div
          style={{
            width: m.sub.dashW,
            height: 4,
            borderRadius: 2,
            background: `${C.accent}55`,
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );

  const stack = (
    <div
      style={{
        marginTop: m.stack.mt,
        width: m.stack.width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: m.stack.gap,
      }}
    >
      {LAYERS.map((l) => (
        <div
          key={l.cn}
          style={{
            width: m.stack.width * l.wf,
            height: m.stack.bandH,
            background: l.bg,
            border: `1.5px solid ${C.accent}22`,
            borderRadius: m.stack.radius,
            boxShadow: "0 8px 22px rgba(37,99,235,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: m.stack.pad,
            boxSizing: "border-box",
          }}
        >
          <span style={{ fontSize: m.stack.cn, fontWeight: 800, color: l.fg, letterSpacing: 3 }}>
            {l.cn}
          </span>
          <span style={{ fontSize: m.stack.en, fontWeight: 600, color: l.sub, letterSpacing: 1.5 }}>
            {l.en}
          </span>
        </div>
      ))}
    </div>
  );

  const chips = (
    <div
      style={{
        marginTop: m.chips.mt,
        width: m.chips.width,
        display: "flex",
        gap: m.chips.gap,
      }}
    >
      {KEYWORDS.map((k) => (
        <div
          key={k}
          style={{
            flex: 1,
            textAlign: "center",
            background: C.card,
            border: `1.5px solid ${C.border}`,
            borderRadius: 16,
            padding: m.chips.pad,
            fontSize: m.chips.font,
            fontWeight: 600,
            color: C.text,
            letterSpacing: 1,
            boxShadow: "0 4px 14px rgba(31,41,55,0.05)",
            whiteSpace: "nowrap",
          }}
        >
          {k}
        </div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        fontFamily: "system-ui, sans-serif",
        padding: m.pad,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 背景：淡蓝光晕 + 正片同款粒子点，压得很低，只为不显空 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 620px at 12% -6%, rgba(37,99,235,0.10), transparent 62%)," +
            "radial-gradient(760px 560px at 96% 104%, rgba(5,150,105,0.08), transparent 60%)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        {Array.from({ length: 34 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 137 + 40) % 96}%`,
              top: `${(i * 89 + 6) % 94}%`,
              width: 4 + (i % 4),
              height: 4 + (i % 4),
              borderRadius: "50%",
              backgroundColor: i % 3 === 0 ? C.accent : "#059669",
              opacity: 0.1 + (i % 5) * 0.05,
            }}
          />
        ))}
      </div>

      {header}

      {m.twoColumn ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: m.colGap,
            paddingBottom: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {badge}
            {title}
            {chips}
          </div>
          {stack}
        </div>
      ) : (
        <>
          {badge}
          {title}
          {stack}
          {chips}
        </>
      )}
    </AbsoluteFill>
  );
};
