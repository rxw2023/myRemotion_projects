import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { T, W, clamp } from "./tokens";
import { CUES } from "./timings";

// ==================== 背景 ====================

export const Backdrop: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: T.bg }} />
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(to right, ${T.grid} 1px, transparent 1px), linear-gradient(to bottom, ${T.grid} 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        opacity: 0.9,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 70% 45% at 50% 32%, rgba(255,255,255,0.95) 0%, rgba(244,246,249,0) 70%)",
      }}
    />
  </>
);

// ==================== 出场动画助手 ====================

export const useAppear = (delay = 0, dur = 10) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: dur });
  return {
    opacity: interpolate(frame, [delay, delay + dur * 0.6], [0, 1], clamp),
    transform: `translateY(${(1 - s) * 26}px)`,
  };
};

export const FadeUp: React.FC<{
  delay?: number;
  dur?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, dur = 10, children, style }) => {
  const a = useAppear(delay, dur);
  return <div style={{ ...a, ...style }}>{children}</div>;
};

// ==================== 场景外壳 ====================

const Header: React.FC<{ no: string; title: string; en: string }> = ({ no, title, en }) => {
  const frame = useCurrentFrame();
  const barW = interpolate(frame, [4, 22], [0, 1], clamp);
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 40,
            fontWeight: 800,
            color: T.blue,
            lineHeight: 1,
            opacity: interpolate(frame, [0, 8], [0, 1], clamp),
            transform: `translateX(${interpolate(frame, [0, 12], [-16, 0], clamp)}px)`,
          }}
        >
          {no}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: T.cn,
              fontSize: 46,
              fontWeight: 800,
              color: T.ink,
              letterSpacing: 1,
              lineHeight: 1.15,
              opacity: interpolate(frame, [2, 12], [0, 1], clamp),
              transform: `translateY(${interpolate(frame, [2, 14], [14, 0], clamp)}px)`,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 18,
              fontWeight: 600,
              color: T.faint,
              letterSpacing: 4,
              marginTop: 6,
              textTransform: "uppercase",
              opacity: interpolate(frame, [6, 16], [0, 1], clamp),
            }}
          >
            {en}
          </div>
        </div>
      </div>
      <div style={{ height: 2, background: T.line, marginTop: 18, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 2,
            width: `${barW * 34}%`,
            background: T.blue,
          }}
        />
      </div>
    </div>
  );
};

const Subtitle: React.FC<{ id: string }> = ({ id }) => {
  const frame = useCurrentFrame();
  const cues = CUES[id] ?? [];
  const cue = cues.find((c) => frame >= c.start && frame < c.end) ?? null;
  if (!cue) return null;
  const fade = interpolate(
    frame,
    [cue.start, cue.start + 5, cue.end - 5, cue.end],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 92,
        display: "flex",
        justifyContent: "center",
        zIndex: 50,
        opacity: fade,
      }}
    >
      <div
        style={{
          maxWidth: W,
          background: T.panel,
          border: `2px solid ${T.line}`,
          borderRadius: 20,
          boxShadow: "0 18px 40px rgba(20,26,34,0.10)",
          padding: "20px 34px",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ width: 5, alignSelf: "stretch", background: T.blue, borderRadius: 3 }} />
        <div
          style={{
            fontFamily: T.cn,
            fontSize: 36,
            fontWeight: 700,
            color: T.ink,
            lineHeight: 1.45,
            letterSpacing: 0.6,
          }}
        >
          {cue.text}
        </div>
      </div>
    </div>
  );
};

/** 底部章节进度轨：14 段，当前段拉长并染色 */
const ProgressRail: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 7,
        zIndex: 40,
        opacity: interpolate(frame, [0, 14], [0, 1], clamp),
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === index ? 34 : 12,
            height: 5,
            borderRadius: 3,
            background: i === index ? T.blue : i < index ? "#B9C6E2" : "#DFE5EE",
          }}
        />
      ))}
    </div>
  );
};

export const Scene: React.FC<{
  id: string;
  no: string;
  title: string;
  en: string;
  children: React.ReactNode;
}> = ({ id, no, title, en, children }) => {
  const index = parseInt(id.slice(1), 10);
  return (
    <AbsoluteFill>
      <Backdrop />
      {/* 章节水印：填充版面留白，不抢内容 */}
      <div
        style={{
          position: "absolute",
          right: 46,
          bottom: 150,
          fontFamily: T.mono,
          fontSize: 300,
          fontWeight: 800,
          lineHeight: 1,
          color: "#E6EBF3",
          letterSpacing: -10,
          zIndex: 0,
          userSelect: "none",
        }}
      >
        {no}
      </div>
      <Audio src={staticFile(`repr-basics/${id}.mp3`)} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "78px 64px 270px",
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
        }}
      >
        <Header no={no} title={title} en={en} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      </div>
      <ProgressRail index={index} total={14} />
      <Subtitle id={id} />
    </AbsoluteFill>
  );
};

// ==================== 基础块 ====================

export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
  pad?: number;
}> = ({ children, style, accent, pad = 26 }) => (
  <div
    style={{
      background: T.panel,
      border: `2px solid ${accent ?? T.line}`,
      borderRadius: 18,
      boxShadow: "0 10px 26px rgba(20,26,34,0.06)",
      padding: pad,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{
  children: React.ReactNode;
  color?: string;
  bg?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, color = T.blue, bg = T.blueSoft, size = 22, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      background: bg,
      color,
      border: `1.5px solid ${color}33`,
      borderRadius: 999,
      padding: "6px 18px",
      fontFamily: T.mono,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 0.5,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

export const Mono: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 34, color = T.ink, weight = 700, style }) => (
  <span
    style={{
      fontFamily: T.mono,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing: 1,
      ...style,
    }}
  >
    {children}
  </span>
);

export const CN: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 28, color = T.ink, weight = 700, style }) => (
  <span
    style={{
      fontFamily: T.cn,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing: 0.5,
      ...style,
    }}
  >
    {children}
  </span>
);

/** 从 delay 开始逐格点亮的一行比特 */
export const BitRow: React.FC<{
  bits: string;
  /** 给定时做翻转动画：从 from 翻到 bits */
  from?: string;
  cell?: number;
  gap?: number;
  labels?: (string | undefined)[];
  labelColor?: Record<number, string>;
  /** i -> 填充色（记录已点亮/高亮位） */
  hl?: Record<number, string>;
  /** i -> 边框色 */
  outline?: Record<number, string>;
  /** 变灰的位 */
  dim?: number[];
  reveal?: number;
  stagger?: number;
  /** 在这几帧里做一次呼吸高亮 */
  pulse?: { index: number; at: number }[];
  labelSize?: number;
  radius?: number;
  style?: React.CSSProperties;
}> = ({
  bits,
  from,
  cell = 82,
  gap = 8,
  labels,
  labelColor,
  hl,
  outline,
  dim,
  reveal = 0,
  stagger = 3,
  pulse = [],
  labelSize = 20,
  radius = 12,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arr = bits.split("");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...style }}>
      <div style={{ display: "flex", gap }}>
        {arr.map((b, i) => {
          const local = frame - reveal - i * stagger;
          const s = spring({ frame: local, fps, config: { damping: 13, stiffness: 170 } });
          const p = pulse.find((x) => x.index === i);
          const pulseAmt = p ? Math.max(0, 1 - Math.abs(frame - p.at) / 14) : 0;
          const swapping = from !== undefined;
          const shown = swapping && local < 0 ? from[i] : b;
          const flip = swapping
            ? interpolate(frame, [reveal + i * stagger - 5, reveal + i * stagger + 5], [0, 180], clamp)
            : 0;
          const filled = shown === "1";
          const bgColor = hl?.[i] ?? (filled ? T.ink : T.panel);
          const useDark = hl?.[i] === T.amber || hl?.[i] === T.amberSoft;
          const isDim = dim ? dim.indexOf(i) >= 0 : false;
          return (
            <div
              key={i}
              style={{
                width: cell,
                height: cell,
                borderRadius: radius,
                background: isDim ? "#EDF1F6" : bgColor,
                border: `2px solid ${outline?.[i] ?? (filled ? T.ink : "#D8DFE8")}`,
                color: isDim
                  ? T.faint
                  : hl?.[i]
                    ? useDark
                      ? T.ink
                      : "#FFFFFF"
                    : filled
                      ? "#FFFFFF"
                      : "#AEB8C4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: cell * 0.5,
                fontWeight: 800,
                opacity: Math.min(1, Math.max(0, s * 1.4)),
                transform: `perspective(700px) rotateX(${flip}deg) scale(${0.55 + 0.45 * s}) translateY(${(1 - s) * -10}px)`,
                boxShadow:
                  pulseAmt > 0.02
                    ? `0 0 0 ${6 + pulseAmt * 10}px rgba(47,98,245,${0.22 * pulseAmt})`
                    : "none",
              }}
            >
              {shown}
            </div>
          );
        })}
      </div>
      {labels && (
        <div style={{ display: "flex", gap, marginTop: 10 }}>
          {arr.map((_, i) => {
            const lab = labels[i];
            const op = interpolate(frame, [reveal + i * stagger, reveal + i * stagger + 8], [0, 1], clamp);
            return (
              <div
                key={i}
                style={{
                  width: cell,
                  textAlign: "center",
                  fontFamily: T.mono,
                  fontSize: labelSize,
                  fontWeight: 700,
                  color: labelColor?.[i] ?? T.faint,
                  opacity: op,
                  letterSpacing: 0,
                }}
              >
                {lab ?? ""}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** 数轴/范围条 */
export const RangeBar: React.FC<{
  left: string;
  right: string;
  fill: number;
  color?: string;
  note?: string;
  delay?: number;
  width?: number;
  marks?: { pos: number; label: string }[];
}> = ({ left, right, fill, color = T.blue, note, delay = 0, width = W - 60, marks }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 26], [0, fill], clamp);
  return (
    <div style={{ width }}>
      {note && (
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <CN size={22} color={T.sub}>
            {note}
          </CN>
        </div>
      )}
      <div
        style={{
          position: "relative",
          height: 30,
          background: T.panel,
          border: `2px solid ${T.ink}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${p * 100}%`,
            background: color,
            opacity: 0.85,
          }}
        />
        {marks?.map((m) => (
          <div
            key={m.label}
            style={{
              position: "absolute",
              left: `${m.pos * 100}%`,
              top: -2,
              bottom: -2,
              width: 3,
              background: T.panel,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <Mono size={30} color={T.ink}>
          {left}
        </Mono>
        <Mono size={30} color={T.ink}>
          {right}
        </Mono>
      </div>
    </div>
  );
};

/** 取某场景第 i 条字幕的起始帧，用作动效触发点（自动跟旁白对齐） */
export const cueAt = (id: string, i: number, fallback = 0): number => {
  const cues = CUES[id];
  return cues?.[i]?.start ?? fallback;
};

/** 取某场景字幕条数 */
export const cueCount = (id: string): number => (CUES[id] ?? []).length;

/** 箭头（横向） */
export const Arrow: React.FC<{ delay?: number; label?: string; w?: number }> = ({
  delay = 0,
  label,
  w = 120,
}) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [delay, delay + 12], [0, 1], clamp);
  return (
    <div
      style={{
        width: w,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: grow,
      }}
    >
      {label && (
        <span style={{ fontFamily: T.mono, fontSize: 17, color: T.faint, fontWeight: 700 }}>
          {label}
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", width: w }}>
        <div style={{ flex: 1, height: 2, background: T.faint, transform: `scaleX(${grow})`, transformOrigin: "left" }} />
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderLeft: `9px solid ${T.faint}`,
            transform: `translateX(-1px) scaleY(${grow})`,
          }}
        />
      </div>
    </div>
  );
};
