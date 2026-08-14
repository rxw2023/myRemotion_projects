import React from "react";
import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  interpolate,
  staticFile,
} from "remotion";
import { STYLES, TOTAL_STYLES, type StyleData } from "./styles";

// ==================== 时间常量 ====================

const FRAMES_PER_STYLE = 120; // 4s @30fps
const FADE_FRAMES = 12;
const OPENING_FRAMES = 150; // 5s opening
const CLOSING_FRAMES = 150; // 5s closing
const TOTAL_FRAMES = OPENING_FRAMES + TOTAL_STYLES * FRAMES_PER_STYLE + CLOSING_FRAMES;

// ==================== 辅助函数 ====================

/** 判断值是否为 CSS 渐变/复杂背景 */
const isComplexBg = (s: string) =>
  s.startsWith("linear-gradient") ||
  s.startsWith("radial-gradient") ||
  s.startsWith("rgba") ||
  s === "transparent";

/** 浅色背景上标签用深色文字，深色背景上用白色 */
const isLightBg = (s: string) =>
  s.startsWith("#fff") ||
  s.startsWith("#faf") ||
  s.startsWith("#f5f") ||
  s.startsWith("#fdf") ||
  s.startsWith("#e0") ||
  s.startsWith("#eef") ||
  s.startsWith("#fffaee") ||
  s.startsWith("#f8f") ||
  s.startsWith("#f0c");
const tagTextColor = (bg: string, accent: string) =>
  isLightBg(bg) || accent === "#111" || accent === "#000" ? "#fff" : "#0a0a0a";

// ==================== 片头 ====================

const Opening: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame,
    [OPENING_FRAMES - 15, OPENING_FRAMES],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: opacity * fadeOut,
      }}
    >
      {/* CRT scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ transform: `translateY(${titleY}px)`, textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 32,
            color: "#5a6a8a",
            letterSpacing: "0.3em",
            marginBottom: 24,
          }}
        >
          ── FRONT-END DESIGN STYLES ──
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 96,
            fontWeight: 900,
            background: "linear-gradient(135deg, #dfff00, #2454ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          50种
        </div>
        <div
          style={{
            fontFamily: "Noto Sans SC, Inter, sans-serif",
            fontSize: 64,
            fontWeight: 900,
            color: "#e8eaf0",
            lineHeight: 1.2,
          }}
        >
          前端设计主义
        </div>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 20,
            color: "#5a6a8a",
            letterSpacing: "0.15em",
            marginTop: 32,
          }}
        >
          从新粗野主义到复古胶片
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 片尾 ====================

const Closing: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - (OPENING_FRAMES + TOTAL_STYLES * FRAMES_PER_STYLE);
  const opacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 72,
            fontWeight: 900,
            background: "linear-gradient(135deg, #dfff00, #2454ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 32,
          }}
        >
          50 / 50
        </div>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 24,
            color: "#5a6a8a",
            letterSpacing: "0.2em",
          }}
        >
          END
        </div>
        <div
          style={{
            fontFamily: "Noto Sans SC, Inter, sans-serif",
            fontSize: 20,
            color: "#8a9aca",
            marginTop: 24,
          }}
        >
          前端设计主义 · 全风格展示
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 风格名片卡 ====================

const StyleCard: React.FC<{ style: StyleData; frame: number }> = ({ style, frame }) => {
  // 淡入淡出
  const opacity = (() => {
    if (frame < FADE_FRAMES) {
      return interpolate(frame, [0, FADE_FRAMES], [0, 1], { extrapolateRight: "clamp" });
    }
    if (frame > FRAMES_PER_STYLE - FADE_FRAMES) {
      return interpolate(
        frame,
        [FRAMES_PER_STYLE - FADE_FRAMES, FRAMES_PER_STYLE],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
    }
    return 1;
  })();

  // 动画微动
  const cardY = interpolate(frame, [0, FADE_FRAMES], [30, 0], { extrapolateRight: "clamp" });

  const paletteW = 72;
  const paletteGap = 12;
  const paletteTotalW = style.palette.length * paletteW + (style.palette.length - 1) * paletteGap;

  return (
    <AbsoluteFill
      style={{
        background: isComplexBg(style.bgColor) ? undefined : style.bgColor,
        ...(isComplexBg(style.bgColor) ? { background: style.bgColor } : {}),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        fontFamily: style.fontFamily,
      }}
    >
      {/* ===== 背景装饰：点阵/扫描线等 ===== */}
      {style.id === 1 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, #d4d0c8 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            opacity: 0.5,
          }}
        />
      )}
      {style.id === 5 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
            pointerEvents: "none",
          }}
        />
      )}
      {style.id === 6 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
      )}

      {/* ===== 主卡片 ===== */}
      <div
        style={{
          width: 880,
          transform: `translateY(${cardY}px)`,
          background: isComplexBg(style.cardBg) ? undefined : style.cardBg,
          ...(isComplexBg(style.cardBg) ? { background: style.cardBg } : {}),
          border: style.borderStyle,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          padding: "48px 56px",
          position: "relative",
        }}
      >
        {/* 序号徽章 */}
        <div
          style={{
            position: "absolute",
            top: -20,
            right: 40,
            background: style.accentColor,
            color: tagTextColor(style.bgColor, style.accentColor),
            fontFamily: "DM Mono, monospace",
            fontSize: 22,
            fontWeight: 700,
            padding: "8px 24px",
            borderRadius: style.borderRadius > 0 ? style.borderRadius : 4,
            letterSpacing: "0.1em",
          }}
        >
          #{("0" + style.id).slice(-2)} / {TOTAL_STYLES}
        </div>

        {/* 中文名 */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: style.textColor,
            lineHeight: 1.15,
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          {style.nameCN}
        </div>

        {/* 英文名 */}
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 22,
            color: style.textColor,
            opacity: 0.45,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          {style.nameEN}
        </div>

        {/* 色板 */}
        <div
          style={{
            display: "flex",
            gap: paletteGap,
            marginBottom: 32,
            justifyContent: "center",
            width: paletteTotalW,
          }}
        >
          {style.palette.map((c, i) => (
            <div
              key={i}
              style={{
                width: paletteW,
                height: paletteW,
                background: c,
                borderRadius: style.borderRadius > 0 ? Math.min(style.borderRadius, 12) : 0,
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            />
          ))}
        </div>

        {/* 特征标签 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 28,
            justifyContent: "center",
          }}
        >
          {style.tags.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: 20,
                padding: "8px 22px",
                background: style.accentColor,
                color: tagTextColor(style.bgColor, style.accentColor),
                borderRadius: style.borderRadius > 0 ? style.borderRadius : 4,
                fontFamily: "DM Mono, monospace",
                letterSpacing: "0.05em",
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 装饰线 */}
        <div
          style={{
            width: "100%",
            height: 2,
            background: style.accentColor,
            opacity: 0.2,
            marginBottom: 24,
          }}
        />

        {/* 简介 */}
        <div
          style={{
            fontSize: 22,
            color: style.textColor,
            opacity: 0.6,
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: 700,
            margin: "0 auto",
          }}
        >
          {style.description}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 主组件 ====================

export const FrontendIsms: React.FC = () => {
  const frame = useCurrentFrame();

  // 计算当前显示的是哪个风格
  const effectiveFrame = Math.max(0, frame - OPENING_FRAMES);
  const styleIndex = Math.floor(effectiveFrame / FRAMES_PER_STYLE);
  const styleFrame = effectiveFrame - styleIndex * FRAMES_PER_STYLE;

  const isOpening = frame < OPENING_FRAMES;
  const isClosing = frame >= OPENING_FRAMES + TOTAL_STYLES * FRAMES_PER_STYLE;
  const showStyle = !isOpening && !isClosing && styleIndex < TOTAL_STYLES;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* BGM */}
      <Audio src={staticFile("frontend-isms/bgm.mp3")} />

      {isOpening && <Opening frame={frame} />}
      {isClosing && <Closing frame={frame} />}
      {showStyle && (
        <StyleCard key={styleIndex} style={STYLES[styleIndex]} frame={styleFrame} />
      )}
    </AbsoluteFill>
  );
};

export { TOTAL_FRAMES };
