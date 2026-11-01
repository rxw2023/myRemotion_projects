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
      <Audio src={staticFile(`tcp-basics/${id}.mp3`)} />
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

export const Callout: React.FC<{
  children: React.ReactNode;
  color?: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, color = T.blue, delay = 0, style }) => {
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
      <div style={{ fontFamily: T.cn, fontSize: 28, fontWeight: 700, color: T.ink, lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
};

/** 逐条淡入的要点列表 */
export const Bullets: React.FC<{
  items: React.ReactNode[];
  delay?: number;
  step?: number;
  color?: string;
  size?: number;
  gap?: number;
  dot?: string;
  width?: number;
}> = ({ items, delay = 0, step = 28, color = T.blue, size = 27, gap = 14, dot, width }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, width }}>
      {items.map((it, i) => {
        const at = delay + i * step;
        const op = interpolate(frame, [at, at + 9], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              opacity: op,
              transform: `translateX(${interpolate(frame, [at, at + 12], [-10, 0], clamp)}px)`,
            }}
          >
            <div
              style={{
                minWidth: dot ? undefined : 12,
                width: dot ? undefined : 12,
                height: 12,
                marginTop: size * 0.42,
                borderRadius: 6,
                background: color,
                fontFamily: T.mono,
                fontSize: 18,
                fontWeight: 800,
                color: T.sub,
                flexShrink: 0,
              }}
            >
              {dot}
            </div>
            <div
              style={{
                fontFamily: T.cn,
                fontSize: size,
                fontWeight: 700,
                color: T.ink2,
                lineHeight: 1.45,
              }}
            >
              {it}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== 箭头 ====================

export const FlowArrow: React.FC<{
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

// ==================== 首部字段条 ====================

export interface FieldSeg {
  name: string;
  bits: number;
  color?: string;
  bg?: string;
  /** 标签下方小字（位宽等） */
  note?: string;
}

/** 一行 32 位（或按比例）的字段条，用于 TCP 首部结构图 */
export const FieldRow: React.FC<{
  segs: FieldSeg[];
  delay?: number;
  height?: number;
  gap?: number;
  showBits?: boolean;
  totalBits?: number;
  hl?: Record<number, boolean>;
  width?: number;
}> = ({ segs, delay = 0, height = 74, gap = 6, showBits = true, totalBits, hl = {}, width = W }) => {
  const frame = useCurrentFrame();
  const total = totalBits ?? segs.reduce((a, s) => a + s.bits, 0);
  const usable = width - gap * (segs.length - 1);
  return (
    <div style={{ display: "flex", gap, width, alignItems: "stretch" }}>
      {segs.map((s, i) => {
        const at = delay + i * 3;
        const op = interpolate(frame, [at, at + 9], [0, 1], clamp);
        const on = hl[i];
        return (
          <div
            key={i}
            style={{
              width: (usable * s.bits) / total,
              height,
              borderRadius: 10,
              background: on ? s.color ?? T.blue : s.bg ?? T.panel,
              border: `2px solid ${on ? s.color ?? T.blue : T.line}`,
              opacity: op,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              overflow: "hidden",
              boxShadow: on ? `0 8px 22px ${(s.color ?? T.blue) + "33"}` : "none",
            }}
          >
            <div
              style={{
                fontFamily: T.cn,
                fontSize: height > 64 ? 21 : 18,
                fontWeight: 800,
                color: on ? "#FFFFFF" : T.ink,
                whiteSpace: "nowrap",
              }}
            >
              {s.name}
            </div>
            {showBits && (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 14,
                  fontWeight: 700,
                  color: on ? "rgba(255,255,255,0.82)" : T.faint,
                  whiteSpace: "nowrap",
                }}
              >
                {s.note ?? `${s.bits} bit`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ==================== 时序泳道图 ====================

export interface LaneStep {
  /** c = 客户端 → 服务端；s = 服务端 → 客户端 */
  from: "c" | "s";
  label: string;
  sub?: string;
  kind?: "syn" | "ack" | "fin" | "data" | "lost";
  at: number;
}

export interface LaneState {
  side: "c" | "s";
  text: string;
  at: number;
  /** 垂直位置（像素，相对 Lane 顶部）；缺省时按顺序均分 */
  y?: number;
}

const KIND_COLOR: Record<string, string> = {
  syn: T.blue,
  ack: T.green,
  fin: T.amber,
  data: T.cyan,
  lost: T.red,
};

/** 双端时序图：两条状态竖线 + 斜向报文箭头 */
export const Lane: React.FC<{
  steps: LaneStep[];
  states?: LaneState[];
  gap?: number;
  top?: number;
  leftName?: string;
  rightName?: string;
  height?: number;
  noteSize?: number;
}> = ({
  steps,
  states = [],
  gap = 96,
  top = 92,
  leftName = "客户端",
  rightName = "服务端",
  height,
  noteSize = 21,
}) => {
  const frame = useCurrentFrame();
  const x1 = 150;
  const x2 = W - 150;
  const h = height ?? top + steps.length * gap + 56;

  const head = (name: string, color: string, x: number) => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: x - 92,
        width: 184,
        height: 54,
        borderRadius: 12,
        background: T.panel,
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: T.cn,
        fontSize: 25,
        fontWeight: 800,
        color,
        boxShadow: "0 8px 20px rgba(20,26,34,0.08)",
      }}
    >
      {name}
    </div>
  );

  return (
    <div style={{ position: "relative", width: W, height: h }}>
      {head(leftName, T.blue, x1)}
      {head(rightName, T.purple, x2)}

      <svg width={W} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={x1} y1={58} x2={x1} y2={h - 6} stroke={T.line} strokeWidth="3" strokeDasharray="7 7" />
        <line x1={x2} y1={58} x2={x2} y2={h - 6} stroke={T.line} strokeWidth="3" strokeDasharray="7 7" />
        {steps.map((s, i) => {
          const y = top + i * gap;
          const color = KIND_COLOR[s.kind ?? "data"];
          const p = interpolate(frame, [s.at, s.at + 10], [0, 1], clamp);
          const xa = s.from === "c" ? x1 : x2;
          const xb = s.from === "c" ? x2 : x1;
          const dir = xb > xa ? 1 : -1;
          const tipX = xb - dir * 12;
          const tipY = y + 20;
          return (
            <g key={i} opacity={p > 0.01 ? 1 : 0}>
              <line
                x1={xa}
                y1={y}
                x2={tipX}
                y2={tipY}
                stroke={color}
                strokeWidth="3.5"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p}
              />
              <polygon
                points={`${xb + dir * 2},${y + 21} ${tipX - 2},${tipY - 9} ${tipX - 2},${tipY + 9}`}
                fill={color}
                opacity={p}
              />
              {s.kind === "lost" && (
                <g opacity={p}>
                  <line x1={xb - 26} y1={y + 6} x2={xb - 6} y2={y + 30} stroke={T.red} strokeWidth="4" />
                  <line x1={xb - 6} y1={y + 6} x2={xb - 26} y2={y + 30} stroke={T.red} strokeWidth="4" />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {steps.map((s, i) => {
        const y = top + i * gap;
        const op = interpolate(frame, [s.at + 2, s.at + 12], [0, 1], clamp);
        const color = KIND_COLOR[s.kind ?? "data"];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: y + 26,
              left: 0,
              width: W,
              display: "flex",
              justifyContent: "center",
              opacity: op,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: T.panel,
                border: `1.5px solid ${color}44`,
                borderRadius: 8,
                padding: "2px 12px",
                fontFamily: T.mono,
                fontSize: noteSize,
                fontWeight: 800,
                color,
                whiteSpace: "nowrap",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span>{s.label}</span>
              {s.sub && (
                <span style={{ fontFamily: T.cn, fontSize: noteSize - 2, color: T.sub, fontWeight: 700 }}>
                  {s.sub}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {states.map((st, i) => {
        const op = interpolate(frame, [st.at, st.at + 10], [0, 1], clamp);
        const isLeft = st.side === "c";
        const ySlot = st.y ?? top + ((i + 0.5) * (h - top - 20)) / Math.max(1, states.length);
        return (
          <div
            key={`st${i}`}
            style={{
              position: "absolute",
              top: ySlot,
              left: isLeft ? 0 : x2 + 18,
              width: isLeft ? x1 - 20 : W - x2 - 20,
              opacity: op,
            }}
          >
            <div style={{ display: "flex", justifyContent: isLeft ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  background: isLeft ? T.blueSoft : T.purpleSoft,
                  color: isLeft ? T.blue : T.purple,
                  borderRadius: 7,
                  padding: "3px 10px",
                  fontFamily: T.mono,
                  fontSize: 16,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                {st.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== 窗口条 ====================

export interface WindowSeg {
  text: string;
  n: number;
  color: string;
  bg: string;
}

/** 字节流四段窗口条：可随 frames 整体右移 */
export const WindowStrip: React.FC<{
  segs: WindowSeg[];
  cell?: number;
  delay?: number;
  shift?: number;
  labelAbove?: boolean;
  mono?: number;
}> = ({ segs, cell = 22, delay = 0, shift = 0, labelAbove = true, mono = 13 }) => {
  const frame = useCurrentFrame();
  const total = segs.reduce((a, s) => a + s.n, 0);
  const shiftX = interpolate(frame, [shift, shift + 18], [0, 1], clamp);
  return (
    <div style={{ width: total * cell, position: "relative" }}>
      <div style={{ position: "relative", height: labelAbove ? 38 : 0 }}>
        {segs.map((s, i) => {
          const from = segs.slice(0, i).reduce((a, x) => a + x.n, 0);
          const op = interpolate(frame, [delay + i * 6, delay + i * 6 + 10], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (from + s.n / 2) * cell - (s.n * cell) / 2,
                width: s.n * cell,
                textAlign: "center",
                fontFamily: T.cn,
                fontSize: 17,
                fontWeight: 800,
                color: s.color,
                opacity: op,
                whiteSpace: "nowrap",
              }}
            >
              {s.text}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex" }}>
        {segs.map((s, i) => {
          const op = interpolate(frame, [delay + i * 6, delay + i * 6 + 10], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                width: s.n * cell,
                height: cell * 2,
                background: s.bg,
                border: `2px solid ${s.color}`,
                borderRight: i === segs.length - 1 ? undefined : "none",
                borderRadius:
                  i === 0 ? "10px 0 0 10px" : i === segs.length - 1 ? "0 10px 10px 0" : 0,
                opacity: op,
                transform: `translateX(${i >= 2 ? shiftX * cell * 0.6 : 0}px)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: mono,
                fontWeight: 800,
                color: s.color,
                overflow: "hidden",
              }}
            >
              {s.n > 2 ? Array.from({ length: s.n }).map((_, k) => (
                <span key={k} style={{ flex: 1, textAlign: "center", opacity: 0.5 }}>
                  {k % 2 === 0 ? "·" : ""}
                </span>
              )) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== 拥塞窗口曲线 ====================

/** cwnd 随 RTT 变化的折线图，支持区间着色与标注 */
export const CwndChart: React.FC<{
  data: number[];
  max?: number;
  delay?: number;
  height?: number;
  width?: number;
  bands?: { from: number; to: number; label: string; color: string }[];
  marks?: { i: number; text: string; color?: string; dy?: number }[];
  yLabel?: string;
  speed?: number;
  showGrid?: boolean;
}> = ({
  data,
  max,
  delay = 0,
  height = 300,
  width = W,
  bands = [],
  marks = [],
  yLabel = "cwnd",
  speed = 2.2,
  showGrid = true,
}) => {
  const frame = useCurrentFrame();
  const n = data.length;
  const padL = 64;
  const padR = 24;
  const padT = 26;
  const padB = 44;
  const iw = width - padL - padR;
  const ih = height - padT - padB;
  const yMax = max ?? Math.max(...data) * 1.15;
  const px = (i: number) => padL + (iw * i) / Math.max(1, n - 1);
  const py = (v: number) => padT + ih - (ih * v) / yMax;

  const progress = interpolate(frame, [delay, delay + n * speed], [0, 1], clamp);
  const head = progress * (n - 1);
  const upto = Math.floor(head);
  const frac = head - upto;

  const pts: string[] = [];
  for (let i = 0; i <= upto; i++) pts.push(`${px(i)},${py(data[i])}`);
  if (upto < n - 1) {
    const v = data[upto] + (data[upto + 1] - data[upto]) * frac;
    pts.push(`${px(upto + frac)},${py(v)}`);
  }

  return (
    <div style={{ width, height, position: "relative" }}>
      <svg width={width} height={height}>
        {showGrid &&
          [0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={padL}
              y1={py(yMax * g)}
              x2={width - padR}
              y2={py(yMax * g)}
              stroke={T.grid}
              strokeWidth="1.5"
            />
          ))}
        {bands.map((b, i) => {
          const op = interpolate(frame, [delay + b.from * speed, delay + b.from * speed + 8], [0, 0.13], clamp);
          return (
            <rect
              key={i}
              x={px(b.from)}
              y={padT}
              width={px(b.to) - px(b.from)}
              height={ih}
              fill={b.color}
              opacity={op}
            />
          );
        })}
        <line x1={padL} y1={padT} x2={padL} y2={padT + ih} stroke={T.faint} strokeWidth="2" />
        <line x1={padL} y1={padT + ih} x2={width - padR} y2={padT + ih} stroke={T.faint} strokeWidth="2" />
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={T.blue}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {marks.map((m, i) => {
          const at = delay + m.i * speed;
          const op = interpolate(frame, [at, at + 8], [0, 1], clamp);
          return (
            <g key={i} opacity={op}>
              <circle cx={px(m.i)} cy={py(data[m.i])} r="6" fill={T.panel} stroke={m.color ?? T.red} strokeWidth="3.5" />
            </g>
          );
        })}
      </svg>
      {marks.map((m, i) => {
        const at = delay + m.i * speed;
        const op = interpolate(frame, [at, at + 8], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px(m.i),
              top: py(data[m.i]) + (m.dy ?? -44),
              transform: "translateX(-50%)",
              opacity: op,
              background: T.panel,
              border: `1.5px solid ${(m.color ?? T.red) + "55"}`,
              borderRadius: 7,
              padding: "2px 10px",
              fontFamily: T.cn,
              fontSize: 17,
              fontWeight: 800,
              color: m.color ?? T.red,
              whiteSpace: "nowrap",
            }}
          >
            {m.text}
          </div>
        );
      })}
      {bands.map((b, i) => {
        const at = delay + b.from * speed;
        const op = interpolate(frame, [at, at + 10], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (px(b.from) + px(b.to)) / 2,
              top: padT + 4,
              transform: "translateX(-50%)",
              opacity: op,
              fontFamily: T.cn,
              fontSize: 19,
              fontWeight: 800,
              color: b.color,
              whiteSpace: "nowrap",
            }}
          >
            {b.label}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: padT - 12,
          fontFamily: T.mono,
          fontSize: 16,
          fontWeight: 700,
          color: T.faint,
        }}
      >
        {yLabel}
      </div>
      <div
        style={{
          position: "absolute",
          left: padL,
          bottom: 12,
          fontFamily: T.mono,
          fontSize: 16,
          fontWeight: 700,
          color: T.faint,
        }}
      >
        RTT →
      </div>
    </div>
  );
};

// ==================== 状态胶囊 ====================

export const StateChip: React.FC<{
  text: string;
  color?: string;
  bg?: string;
  delay?: number;
  size?: number;
  on?: boolean;
}> = ({ text, color = T.blue, bg = T.blueSoft, delay = 0, size = 20, on = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = interpolate(frame, [delay, delay + 9], [0, 1], clamp);
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 180 } });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: bg,
        border: `2px solid ${on ? color : color + "33"}`,
        borderRadius: 9,
        padding: "5px 12px",
        fontFamily: T.mono,
        fontSize: size,
        fontWeight: 800,
        color,
        opacity: op,
        transform: `scale(${0.85 + 0.15 * s})`,
        whiteSpace: "nowrap",
        boxShadow: on ? `0 6px 16px ${color}33` : "none",
      }}
    >
      {text}
    </div>
  );
};

// ==================== 字幕触发点 ====================

export const cueAt = (id: string, i: number, fallback = 0): number => {
  const cues = CUES[id];
  return cues?.[i]?.start ?? fallback;
};

export const cueCount = (id: string): number => (CUES[id] ?? []).length;
