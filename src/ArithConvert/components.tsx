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
import { T, W, clamp, SCENE_TOTAL } from "./tokens";
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

// ==================== 出场动画 ====================

export const useAppear = (delay = 0, dur = 10) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: dur });
  return {
    opacity: interpolate(frame, [delay, delay + dur * 0.6], [0, 1], clamp),
    transform: `translateY(${(1 - s) * 24}px)`,
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
      <Audio src={staticFile(`arith-convert/${id}.mp3`)} />
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
      <ProgressRail index={index} total={SCENE_TOTAL} />
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
}> = ({ children, style, accent, pad = 24 }) => (
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

/** 给前 n 个位块统一染色 */
export const paint = (n: number, color: string): Record<number, string> => {
  const o: Record<number, string> = {};
  for (let i = 0; i < n; i++) o[i] = color;
  return o;
};

/** 逐格点亮的位块行 */
export const BitRow: React.FC<{
  bits: string;
  from?: string;
  cell?: number;
  gap?: number;
  labels?: (string | undefined)[];
  labelColor?: Record<number, string>;
  hl?: Record<number, string>;
  outline?: Record<number, string>;
  dim?: number[];
  reveal?: number;
  stagger?: number;
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
          const isDim = dim ? dim.indexOf(i) >= 0 : false;
          const darkText = hl?.[i] === T.amber || hl?.[i] === T.amberSoft || hl?.[i] === T.greenSoft;
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
                    ? darkText
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

/** 横向箭头 */
export const Arrow: React.FC<{
  delay?: number;
  label?: string;
  w?: number;
  color?: string;
  dir?: "right" | "down";
}> = ({ delay = 0, label, w = 120, color = T.faint, dir = "right" }) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [delay, delay + 12], [0, 1], clamp);
  if (dir === "down") {
    return (
      <div
        style={{
          height: 56,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          opacity: grow,
        }}
      >
        {label && (
          <span style={{ fontFamily: T.mono, fontSize: 18, color, fontWeight: 700 }}>{label}</span>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div style={{ width: 2, flex: 1, background: color, transform: `scaleY(${grow})` }} />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: `10px solid ${color}`,
            }}
          />
        </div>
      </div>
    );
  }
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
        <span style={{ fontFamily: T.mono, fontSize: 18, color, fontWeight: 700 }}>{label}</span>
      )}
      <div style={{ display: "flex", alignItems: "center", width: w }}>
        <div
          style={{
            flex: 1,
            height: 2,
            background: color,
            transform: `scaleX(${grow})`,
            transformOrigin: "left",
          }}
        />
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "7px solid transparent",
            borderBottom: "7px solid transparent",
            borderLeft: `10px solid ${color}`,
            transform: `translateX(-1px) scaleY(${grow})`,
          }}
        />
      </div>
    </div>
  );
};

// ==================== 逻辑门 ====================

type GateKind = "and" | "or" | "xor" | "not" | "ha" | "fa";

const BODY: Record<string, string> = {
  and: "M24,10 H44 A22,22 0 0 1 44,54 H24 Z",
  or: "M24,10 Q50,10 62,32 Q50,54 24,54 Q36,32 24,10 Z",
  xor: "M24,10 Q50,10 62,32 Q50,54 24,54 Q36,32 24,10 Z",
  not: "M26,10 L58,32 L26,54 Z",
};

export const Gate: React.FC<{
  kind: GateKind;
  label?: string;
  sub?: string;
  color?: string;
  delay?: number;
  w?: number;
  h?: number;
}> = ({ kind, label, sub, color = T.ink, delay = 0, w = 108, h = 64 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 12 });
  const op = interpolate(frame, [delay, delay + 8], [0, 1], clamp);

  if (kind === "ha" || kind === "fa") {
    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 10,
          border: `2.5px solid ${color}`,
          background: T.panel,
          boxShadow: "0 6px 16px rgba(20,26,34,0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: op,
          transform: `scale(${0.7 + 0.3 * s})`,
        }}
      >
        <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 800, color }}>
          {kind.toUpperCase()}
        </div>
        {sub && (
          <div style={{ fontFamily: T.cn, fontSize: 13, color: T.faint, marginTop: 2 }}>{sub}</div>
        )}
      </div>
    );
  }

  const vb = kind === "not" ? "0 0 76 64" : "0 0 76 64";
  return (
    <div style={{ width: w, height: h, opacity: op, position: "relative" }}>
      <svg viewBox={vb} width={w} height={h} style={{ overflow: "visible" }}>
        {/* 输入引线 */}
        <line x1="0" y1={kind === "not" ? 32 : 22} x2="26" y2={kind === "not" ? 32 : 22} stroke={T.faint} strokeWidth="2.5" />
        {kind !== "not" && <line x1="0" y1="42" x2="26" y2="42" stroke={T.faint} strokeWidth="2.5" />}
        <path d={BODY[kind]} fill={T.panel} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {kind === "xor" && (
          <path d="M14,10 Q26,32 14,54" fill="none" stroke={color} strokeWidth="2.5" />
        )}
        {kind === "not" && <circle cx="64" cy="32" r="5" fill={T.panel} stroke={color} strokeWidth="2.5" />}
        {/* 输出引线 */}
        {kind === "not" ? (
          <line x1="69" y1="32" x2="76" y2="32" stroke={T.faint} strokeWidth="2.5" />
        ) : (
          <line x1="62" y1="32" x2="76" y2="32" stroke={T.faint} strokeWidth="2.5" />
        )}
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: h + 4,
            textAlign: "center",
            fontFamily: T.mono,
            fontSize: 20,
            fontWeight: 800,
            color,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

// ==================== 真值表 ====================

export const TruthTable: React.FC<{
  head: string[];
  rows: (string | number)[][];
  delay?: number;
  rowGap?: number;
  cellW?: number;
  size?: number;
  colColor?: string[];
}> = ({ head, rows, delay = 0, rowGap = 46, cellW = 96, size = 26, colColor }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex" }}>
        {head.map((h, i) => (
          <div
            key={i}
            style={{
              width: cellW,
              textAlign: "center",
              fontFamily: T.mono,
              fontSize: 20,
              fontWeight: 800,
              color: colColor?.[i] ?? T.sub,
              letterSpacing: 0.5,
              paddingBottom: 8,
              borderBottom: `2px solid ${T.ink}`,
            }}
          >
            {h}
          </div>
        ))}
      </div>
      {rows.map((r, ri) => {
        const op = interpolate(frame, [delay + ri * 3, delay + ri * 3 + 8], [0, 1], clamp);
        return (
          <div
            key={ri}
            style={{
              display: "flex",
              opacity: op,
              background: ri % 2 === 0 ? "rgba(20,26,34,0.025)" : "transparent",
              borderBottom: `1px solid ${T.line}`,
            }}
          >
            {r.map((c, ci) => (
              <div
                key={ci}
                style={{
                  width: cellW,
                  height: rowGap,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: T.mono,
                  fontSize: size,
                  fontWeight: 700,
                  color: colColor?.[ci] ?? T.ink2,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ==================== 代码块 ====================

export const Code: React.FC<{
  title?: string;
  lines: { text: string; hl?: boolean }[];
  delay?: number;
  size?: number;
  width?: number;
}> = ({ title, lines, delay = 0, size = 25, width = W }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 10], [0, 1], clamp);
  return (
    <div
      style={{
        width,
        background: "#151A21",
        borderRadius: 14,
        padding: "16px 22px 20px",
        opacity: op,
        transform: `translateY(${interpolate(frame, [delay, delay + 12], [14, 0], clamp)}px)`,
        boxShadow: "0 14px 30px rgba(20,26,34,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: "#FF5F57" }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, background: "#FEBC2E" }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, background: "#28C840" }} />
        {title && (
          <span
            style={{
              marginLeft: 10,
              fontFamily: T.mono,
              fontSize: 17,
              color: "#6E7B8B",
              letterSpacing: 1,
            }}
          >
            {title}
          </span>
        )}
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: T.mono,
            fontSize: size,
            lineHeight: 1.6,
            color: l.hl ? "#FFD479" : "#D7DEE8",
            whiteSpace: "pre",
            opacity: interpolate(
              frame,
              [delay + 4 + i * 2, delay + 10 + i * 2],
              [0, 1],
              clamp,
            ),
          }}
        >
          {l.text}
        </div>
      ))}
    </div>
  );
};

// ==================== 分段位条 ====================

export const BitStrip: React.FC<{
  bits: string;
  segs?: { text: string; from: number; to: number; color: string; bg: string }[];
  cell?: number;
  gap?: number;
  delay?: number;
  showIndex?: boolean;
  indexLabels?: (string | undefined)[];
  hl?: Record<number, string>;
  mono?: number;
}> = ({
  bits,
  segs = [],
  cell = 46,
  gap = 4,
  delay = 0,
  showIndex = false,
  indexLabels,
  hl,
  mono = 22,
}) => {
  const frame = useCurrentFrame();
  const arr = bits.split("");
  const totalW = arr.length * cell + (arr.length - 1) * gap;

  return (
    <div style={{ width: totalW, position: "relative" }}>
      {segs.length > 0 && (
        <div style={{ position: "relative", height: 34, marginBottom: 6 }}>
          {segs.map((s, i) => {
            const left = s.from * (cell + gap);
            const width = (s.to - s.from + 1) * cell + (s.to - s.from) * gap;
            const op = interpolate(frame, [delay + i * 5, delay + i * 5 + 8], [0, 1], clamp);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left,
                  width,
                  height: 28,
                  borderRadius: 7,
                  background: s.bg,
                  color: s.color,
                  border: `1.5px solid ${s.color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: T.cn,
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  opacity: op,
                  whiteSpace: "nowrap",
                }}
              >
                {s.text}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap }}>
        {arr.map((b, i) => {
          const op = interpolate(frame, [delay + i * 1.5, delay + i * 1.5 + 6], [0, 1], clamp);
          const bg = hl?.[i] ?? (b === "1" ? T.ink : T.panel);
          const dark = hl?.[i] === T.amber || hl?.[i] === T.greenSoft;
          return (
            <div
              key={i}
              style={{
                width: cell,
                height: cell,
                borderRadius: 8,
                background: bg,
                border: `2px solid ${b === "1" ? T.ink : "#D8DFE8"}`,
                color: dark ? T.ink : b === "1" ? "#FFF" : "#AEB8C4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: mono,
                fontWeight: 800,
                opacity: op,
              }}
            >
              {b}
            </div>
          );
        })}
      </div>
      {showIndex && (
        <div style={{ display: "flex", gap, marginTop: 6 }}>
          {arr.map((_, i) => (
            <div
              key={i}
              style={{
                width: cell,
                textAlign: "center",
                fontFamily: T.mono,
                fontSize: 15,
                color: T.faint,
              }}
            >
              {indexLabels?.[i] ?? arr.length - 1 - i}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== 步骤条 ====================

export const Steps: React.FC<{
  items: { n: string; title: string; note?: string }[];
  active?: number;
  delay?: number;
  color?: string;
  vertical?: boolean;
}> = ({ items, active = -1, delay = 0, color = T.blue, vertical = true }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        gap: vertical ? 12 : 10,
        alignItems: vertical ? "stretch" : "center",
      }}
    >
      {items.map((it, i) => {
        const on = i === active;
        const done = i < active;
        const op = interpolate(frame, [delay + i * 4, delay + i * 4 + 10], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: op,
              background: on ? `${color}12` : "transparent",
              border: `2px solid ${on ? color : "transparent"}`,
              borderRadius: 12,
              padding: vertical ? "10px 16px" : "10px 14px",
              transform: `translateX(${interpolate(frame, [delay + i * 4, delay + i * 4 + 12], [on ? -6 : 0, 0], clamp)}px)`,
              flex: vertical ? undefined : 1,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: on || done ? color : "#E7EBF2",
                color: on || done ? "#FFF" : T.sub,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: 19,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {done ? "✓" : it.n}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: T.cn,
                  fontSize: 26,
                  fontWeight: 800,
                  color: on ? color : T.ink,
                  whiteSpace: "nowrap",
                }}
              >
                {it.title}
              </div>
              {it.note && (
                <div style={{ fontFamily: T.cn, fontSize: 19, color: T.sub, marginTop: 2 }}>
                  {it.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== 结论条 ====================

export const Callout: React.FC<{
  children: React.ReactNode;
  color?: string;
  delay?: number;
  icon?: string;
  style?: React.CSSProperties;
}> = ({ children, color = T.blue, delay = 0, icon, style }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 10], [0, 1], clamp);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: T.panel,
        borderLeft: `7px solid ${color}`,
        borderTop: `1px solid ${T.line}`,
        borderRight: `1px solid ${T.line}`,
        borderBottom: `1px solid ${T.line}`,
        borderRadius: 12,
        padding: "16px 24px",
        boxShadow: "0 10px 24px rgba(20,26,34,0.06)",
        opacity: op,
        ...style,
      }}
    >
      {icon && <div style={{ fontSize: 26 }}>{icon}</div>}
      <div style={{ fontFamily: T.cn, fontSize: 28, fontWeight: 700, color: T.ink, lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
};

// ==================== 字幕触发点 ====================

export const cueAt = (id: string, i: number, fallback = 0): number => {
  const cues = CUES[id];
  return cues?.[i]?.start ?? fallback;
};

export const cueCount = (id: string): number => (CUES[id] ?? []).length;
