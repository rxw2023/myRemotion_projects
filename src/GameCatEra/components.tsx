import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { rgba, clamp01, pad2, ERAS, REVERSE, TIMELINE, TOTAL_FRAMES, type Era } from "./data";

// ==================== 字体栈 ====================

const CJK = '"Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", sans-serif';
const DISPLAY_LATIN = '"Bahnschrift", "DIN Alternate", "Segoe UI", Arial, sans-serif';
const MONO_LATIN = '"Cascadia Mono", Consolas, "Courier New", monospace';

export const F_DISPLAY = `${DISPLAY_LATIN}, ${CJK}`;
export const F_TEXT = `${CJK}, ${DISPLAY_LATIN}`;
export const F_MONO = `${MONO_LATIN}, ${CJK}`;

// ==================== 版式 ====================

export const LAYOUT = {
  stageTop: 120,
  stageHeight: 656,
  left: 60,
  right: 1860,
  imageWidth: 1010,
  panelLeft: 1110,
  panelWidth: 750,
  narrationTop: 792,
  narrationHeight: 92,
  rulerTop: 898,
  rulerHeight: 92,
};

// ==================== 棋盘格 / 屏幕纹理 ====================

/** 胶片颗粒：预先用 Pillow 生成的 192×192 无缝噪点瓦片（比 SVG feTurbulence 快得多） */
export const GRAIN_URL = `url("${staticFile("gameCatEra/grain.png")}")`;

export const Grain: React.FC<{ opacity: number }> = ({ opacity }) => {
  if (opacity <= 0) {
    return null;
  }
  return (
    <AbsoluteFill
      style={{
        backgroundImage: GRAIN_URL,
        backgroundRepeat: "repeat",
        backgroundSize: "192px 192px",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

export const Scanlines: React.FC<{ intensity: number; gap?: number; color?: string }> = ({
  intensity,
  gap = 3,
  color = "rgba(0,0,0,0.72)",
}) => {
  if (intensity <= 0) {
    return null;
  }
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0px, ${color} ${gap / 2}px, rgba(0,0,0,0) ${gap / 2}px, rgba(0,0,0,0) ${gap}px)`,
        opacity: intensity,
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength: number }> = ({ strength }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(118% 86% at 50% 44%, rgba(0,0,0,0) 38%, rgba(0,0,0,${0.9 * strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** CRT 开机 / 关机时那一道横向亮线 */
export const ScanBeam: React.FC<{ opacity: number; color: string; y: string }> = ({
  opacity,
  color,
  y,
}) => {
  if (opacity <= 0.001) {
    return null;
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: y,
          height: 4,
          background: color,
          boxShadow: `0 0 40px 14px ${color}`,
        }}
      />
    </AbsoluteFill>
  );
};

// ==================== 顶部 HUD ====================

export const TopHud: React.FC<{ frame: number; opacity: number }> = ({ frame, opacity }) => {
  const blinkOn = Math.floor(frame / 18) % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        left: LAYOUT.left,
        right: 1920 - LAYOUT.right,
        top: 52,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity,
        fontFamily: F_MONO,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 11,
            height: 11,
            borderRadius: 6,
            background: "#FF3B30",
            boxShadow: blinkOn ? "0 0 16px 3px rgba(255,59,48,0.85)" : "none",
            opacity: blinkOn ? 1 : 0.25,
          }}
        />
        <div
          style={{
            fontSize: 20,
            letterSpacing: 8,
            color: "rgba(255,255,255,0.72)",
            fontFamily: F_DISPLAY,
          }}
        >
          像素到光子
        </div>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.22)" }} />
        <div style={{ fontSize: 13, letterSpacing: 4, color: "rgba(255,255,255,0.34)" }}>
          FIFTY YEARS OF GAME ART
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            fontSize: 15,
            letterSpacing: 3,
            color: "rgba(255,255,255,0.5)",
            opacity: blinkOn ? 1 : 0.45,
          }}
        >
          {REVERSE ? "◀◀ REW" : "▶ PLAY"}
        </div>
        <div style={{ fontSize: 15, letterSpacing: 2, color: "rgba(255,255,255,0.5)" }}>
          {pad2(Math.floor(frame / 30 / 60))}:{pad2(Math.floor(frame / 30) % 60)}
          {" / "}
          {pad2(Math.floor(TOTAL_FRAMES / 30 / 60))}:{pad2(Math.floor(TOTAL_FRAMES / 30) % 60)}
        </div>
      </div>
    </div>
  );
};

// ==================== 底部时间轴（倒带进度尺） ====================

export const TimelineRuler: React.FC<{ progress: number; activeIndex: number }> = ({
  progress,
  activeIndex,
}) => {
  const x0 = LAYOUT.left;
  const x1 = LAYOUT.right;
  const span = x1 - x0;
  const yearMin = ERAS[0].yearStart;
  const yearSpan = ERAS[ERAS.length - 1].yearStart - yearMin;
  // 刻度永远按年份排布：1970 在左、2023 在右，与叙事方向无关
  const xOf = (year: number) => x0 + ((year - yearMin) / yearSpan) * span;
  // 正序时播放头从左往右走；倒叙时从右往左
  const playX = x0 + (REVERSE ? 1 - progress : progress) * span;

  return (
    <div style={{ position: "absolute", left: 0, top: LAYOUT.rulerTop, width: 1920, height: LAYOUT.rulerHeight }}>
      {/* 轴 */}
      <div
        style={{
          position: "absolute",
          left: x0,
          top: 26,
          width: span,
          height: 2,
          background: "rgba(255,255,255,0.16)",
        }}
      />
      {/* 已播放部分 */}
      <div
        style={{
          position: "absolute",
          left: REVERSE ? playX : x0,
          top: 25,
          width: REVERSE ? Math.max(0, x1 - playX) : Math.max(0, playX - x0),
          height: 4,
          background: REVERSE
            ? "linear-gradient(90deg, rgba(255,255,255,0.85), rgba(255,255,255,0.15))"
            : "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.85))",
        }}
      />
      {TIMELINE.map((era) => {
        const x = xOf(era.yearStart);
        const current = era.index === activeIndex;
        const passed = REVERSE ? x >= playX - 0.5 : x <= playX + 0.5;
        return (
          <div key={era.years}>
            <div
              style={{
                position: "absolute",
                left: x - 1,
                top: current ? 12 : 18,
                width: 2,
                height: current ? 30 : 18,
                background: passed ? era.accent : "rgba(255,255,255,0.2)",
                boxShadow: current ? `0 0 16px 2px ${rgba(era.accent, 0.75)}` : "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x - 34,
                top: 54,
                width: 68,
                textAlign: "center",
                fontFamily: F_MONO,
                fontSize: current ? 16 : 13,
                letterSpacing: 1,
                color: passed ? rgba(era.accent, current ? 1 : 0.62) : "rgba(255,255,255,0.28)",
              }}
            >
              {era.yearStart}
            </div>
          </div>
        );
      })}
      {/* 播放头 */}
      <div
        style={{
          position: "absolute",
          left: playX - 8,
          top: 4,
          width: 16,
          height: 48,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 3,
            height: 48,
            background: "#FFFFFF",
            boxShadow: "0 0 18px 4px rgba(255,255,255,0.6)",
          }}
        />
      </div>
    </div>
  );
};

// ==================== 字幕条 ====================

export const NarrationBar: React.FC<{
  text: string | null;
  years: string | null;
  accent: string;
  appear: number;
}> = ({ text, years, accent, appear }) => {
  if (!text) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: LAYOUT.left,
        top: LAYOUT.narrationTop,
        width: LAYOUT.right - LAYOUT.left,
        height: LAYOUT.narrationHeight,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 30px",
        boxSizing: "border-box",
        background: "linear-gradient(90deg, rgba(6,6,12,0.92), rgba(6,6,12,0.55))",
        borderLeft: `4px solid ${accent}`,
        boxShadow: `0 0 60px -10px ${rgba(accent, 0.5)}`,
      }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 14,
          letterSpacing: 4,
          color: rgba(accent, 0.95),
          border: `1px solid ${rgba(accent, 0.5)}`,
          padding: "5px 10px",
          flexShrink: 0,
        }}
      >
        旁白
      </div>
      <div
        style={{
          fontFamily: F_TEXT,
          fontSize: 34,
          fontWeight: 500,
          color: "rgba(255,255,255,0.95)",
          letterSpacing: 1.5,
          flex: 1,
        }}
      >
        {text}
      </div>
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 22,
          letterSpacing: 2,
          color: rgba(accent, 0.9),
          flexShrink: 0,
        }}
      >
        {years}
      </div>
    </div>
  );
};

// ==================== 技术标尺（信息面板底部） ====================

export const TechScale: React.FC<{ era: Era; frame: number }> = ({ era, frame }) => {
  const rows: { label: string; value: number }[] = [
    { label: "分辨率", value: era.metrics.resolution },
    { label: "多边形数", value: era.metrics.polys },
    { label: "光影复杂度", value: era.metrics.light },
  ];

  return (
    <div>
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 13,
          letterSpacing: 5,
          color: rgba(era.accent, 0.92),
          marginBottom: 10,
        }}
      >
        技术标尺
      </div>
      {rows.map((row, i) => {
        const p = clamp01((frame - 56 - i * 8) / 26);
        return (
          <div
            key={row.label}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}
          >
            <div
              style={{
                width: 92,
                fontFamily: F_MONO,
                fontSize: 13,
                letterSpacing: 1,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                flex: 1,
                height: 6,
                background: "rgba(255,255,255,0.1)",
                borderRadius: era.radius > 0 ? 3 : 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${row.value * p * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${rgba(era.accent, 0.45)}, ${era.accent})`,
                  boxShadow: `0 0 12px ${rgba(era.accent, 0.85)}`,
                }}
              />
            </div>
            <div
              style={{
                width: 34,
                textAlign: "right",
                fontFamily: F_MONO,
                fontSize: 13,
                color: rgba(era.accent, 0.95),
              }}
            >
              {Math.round(row.value * p * 100)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== 片尾用的缩略图 ====================

export const ThumbFrame: React.FC<{
  src: string;
  accent: string;
  radius: number;
}> = ({ src, accent, radius }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      overflow: "hidden",
      borderRadius: radius,
      border: `1px solid ${rgba(accent, 0.55)}`,
      background: "#05050A",
      position: "relative",
    }}
  >
    <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  </div>
);
