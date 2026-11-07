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
import { T, clamp, SCENE_TOTAL } from "./tokens";
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
          "radial-gradient(ellipse 62% 50% at 50% 34%, rgba(255,255,255,0.96) 0%, rgba(244,246,249,0) 72%)",
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
    transform: `translateY(${(1 - s) * 22}px)`,
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
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 44,
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
              fontSize: 44,
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
        </div>
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 17,
            fontWeight: 600,
            color: T.faint,
            letterSpacing: 4,
            textTransform: "uppercase",
            paddingBottom: 6,
            opacity: interpolate(frame, [6, 16], [0, 1], clamp),
          }}
        >
          {en}
        </div>
      </div>
      <div style={{ height: 2, background: T.line, marginTop: 14, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 2,
            width: `${barW * 22}%`,
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
        bottom: 68,
        display: "flex",
        justifyContent: "center",
        zIndex: 50,
        opacity: fade,
      }}
    >
      <div
        style={{
          maxWidth: 1420,
          background: T.panel,
          border: `2px solid ${T.line}`,
          borderRadius: 18,
          boxShadow: "0 16px 36px rgba(20,26,34,0.10)",
          padding: "17px 30px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ width: 5, alignSelf: "stretch", background: T.blue, borderRadius: 3 }} />
        <div
          style={{
            fontFamily: T.cn,
            fontSize: 34,
            fontWeight: 700,
            color: T.ink,
            lineHeight: 1.4,
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
        bottom: 30,
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
            width: i === index ? 36 : 12,
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
          right: 40,
          bottom: 128,
          fontFamily: T.mono,
          fontSize: 260,
          fontWeight: 800,
          lineHeight: 1,
          color: "#E6EBF3",
          letterSpacing: -8,
          zIndex: 0,
          userSelect: "none",
        }}
      >
        {no}
      </div>
      <Audio src={staticFile(`virtual-memory/${id}.mp3`)} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "52px 72px 196px",
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
            justifyContent: "center",
            paddingTop: 22,
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
  soft?: boolean;
}> = ({ children, style, accent, pad = 24, soft }) => (
  <div
    style={{
      background: soft ? "#FBFCFE" : T.panel,
      border: `2px solid ${accent ?? T.line}`,
      borderRadius: 16,
      boxShadow: "0 8px 22px rgba(20,26,34,0.05)",
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
}> = ({ children, color = T.blue, bg = T.blueSoft, size = 20, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      background: bg,
      color,
      border: `1.5px solid ${color}33`,
      borderRadius: 999,
      padding: "5px 15px",
      fontFamily: T.mono,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 0.4,
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
}> = ({ children, size = 30, color = T.ink, weight = 700, style }) => (
  <span style={{ fontFamily: T.mono, fontSize: size, color, fontWeight: weight, ...style }}>
    {children}
  </span>
);

export const CN: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 24, color = T.ink2, weight = 600, style }) => (
  <span style={{ fontFamily: T.cn, fontSize: size, color, fontWeight: weight, ...style }}>
    {children}
  </span>
);

/** 小标签：面板上方的一行引导文字 */
export const Kicker: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, color = T.blue, style }) => (
  <div
    style={{
      fontFamily: T.mono,
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: 3,
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

/** 带序号或色点的要点行 */
export const Bullet: React.FC<{
  children: React.ReactNode;
  dot?: string;
  marker?: string;
  size?: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, dot = T.blue, marker, size = 24, delay = 0, style }) => (
  <FadeUp delay={delay} style={{ display: "flex", alignItems: "flex-start", gap: 12, ...style }}>
    {marker ? (
      <span
        style={{
          fontFamily: T.mono,
          fontSize: size * 0.82,
          fontWeight: 800,
          color: dot,
          lineHeight: 1.5,
          minWidth: 24,
        }}
      >
        {marker}
      </span>
    ) : (
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          background: dot,
          marginTop: size * 0.56,
          flexShrink: 0,
        }}
      />
    )}
    <span
      style={{
        fontFamily: T.cn,
        fontSize: size,
        fontWeight: 600,
        color: T.ink2,
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  </FadeUp>
);

/** 关键结论条 */
export const KeyLine: React.FC<{
  children: React.ReactNode;
  color?: string;
  bg?: string;
  delay?: number;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, color = T.blue, bg = T.blueSoft, delay = 0, size = 25, style }) => (
  <FadeUp
    delay={delay}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      background: bg,
      borderLeft: `5px solid ${color}`,
      borderRadius: 10,
      padding: "14px 20px",
      ...style,
    }}
  >
    <span style={{ fontFamily: T.cn, fontSize: size, fontWeight: 800, color, lineHeight: 1.45 }}>
      {children}
    </span>
  </FadeUp>
);

/** 公式块 */
export const Formula: React.FC<{
  label?: string;
  children: React.ReactNode;
  delay?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ label, children, delay = 0, color = T.ink, style }) => (
  <FadeUp delay={delay} style={{ display: "flex", alignItems: "baseline", gap: 14, ...style }}>
    {label ? (
      <span style={{ fontFamily: T.cn, fontSize: 19, fontWeight: 700, color: T.sub }}>{label}</span>
    ) : null}
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 28,
        fontWeight: 800,
        color,
        letterSpacing: 0.5,
      }}
    >
      {children}
    </span>
  </FadeUp>
);

// ==================== 地址位段条 ====================

export interface BitSeg {
  label: string;
  sub?: string;
  bits: number | string;
  color?: string;
  bg?: string;
  /** 相对宽度，默认等于 bits */
  flex?: number;
  dim?: boolean;
}

export const BitStrip: React.FC<{
  segs: BitSeg[];
  height?: number;
  delay?: number;
  step?: number;
  showBits?: boolean;
  labelSize?: number;
  style?: React.CSSProperties;
}> = ({ segs, height = 92, delay = 0, step = 5, showBits = true, labelSize = 24, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: 8, width: "100%", ...style }}>
      {segs.map((s, i) => {
        const d = delay + i * step;
        const sp = spring({
          frame: frame - d,
          fps,
          config: { damping: 18, stiffness: 120 },
        });
        const color = s.color ?? T.blue;
        return (
          <div
            key={`${s.label}-${i}`}
            style={{
              flex: s.flex ?? (typeof s.bits === "number" ? s.bits : 1),
              height,
              borderRadius: 12,
              background: s.dim ? "#F5F7FA" : (s.bg ?? T.blueSoft),
              border: `2px ${s.dim ? "dashed" : "solid"} ${s.dim ? "#CBD4E1" : color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              position: "relative",
              opacity: interpolate(frame, [d, d + 8], [0, 1], clamp),
              transform: `scaleY(${0.6 + sp * 0.4})`,
            }}
          >
            <div
              style={{
                fontFamily: T.cn,
                fontSize: labelSize,
                fontWeight: 800,
                color: s.dim ? T.faint : color,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </div>
            {s.sub ? (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 15,
                  fontWeight: 600,
                  color: T.sub,
                  whiteSpace: "nowrap",
                }}
              >
                {s.sub}
              </div>
            ) : null}
            {showBits ? (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: s.dim ? T.faint : color,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {s.bits}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// ==================== 箭头 ====================

export const Arrow: React.FC<{
  label?: string;
  width?: number;
  delay?: number;
  color?: string;
  dashed?: boolean;
  vertical?: boolean;
  style?: React.CSSProperties;
}> = ({ label, width = 84, delay = 0, color = T.faint, dashed, vertical, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay + 2, delay + 12], [0, 1], clamp);
  if (vertical) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          opacity: p,
          ...style,
        }}
      >
        <svg width={26} height={44} style={{ overflow: "visible" }}>
          <line
            x1={13}
            y1={0}
            x2={13}
            y2={34}
            stroke={color}
            strokeWidth={2}
            strokeDasharray={dashed ? "5 4" : undefined}
          />
          <path d="M6 32 L13 43 L20 32" fill={color} />
        </svg>
        {label ? (
          <span style={{ fontFamily: T.mono, fontSize: 15, color, fontWeight: 700 }}>{label}</span>
        ) : null}
      </div>
    );
  }
  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        opacity: p,
        flexShrink: 0,
        ...style,
      }}
    >
      {label ? (
        <span style={{ fontFamily: T.mono, fontSize: 15, color, fontWeight: 700 }}>{label}</span>
      ) : null}
      <svg width={width} height={16} style={{ overflow: "visible" }}>
        <line
          x1={2}
          y1={8}
          x2={width - 16}
          y2={8}
          stroke="currentColor"
          style={{ color }}
          strokeWidth={2}
          strokeDasharray={dashed ? "5 4" : undefined}
        />
        <path d={`M${width - 16} 2 L${width - 2} 8 L${width - 16} 14`} fill={color} />
      </svg>
    </div>
  );
};

// ==================== 横向流程 ====================

export interface FlowStep {
  no?: string;
  title: string;
  desc?: string;
  color?: string;
  bg?: string;
}

export const FlowRow: React.FC<{
  steps: FlowStep[];
  delay?: number;
  gap?: number;
  stepWidth?: number;
  size?: number;
  style?: React.CSSProperties;
}> = ({ steps, delay = 0, gap = 10, stepWidth, size = 21, style }) => (
  <div style={{ display: "flex", alignItems: "stretch", gap, ...style }}>
    {steps.map((s, i) => (
      <React.Fragment key={s.title}>
        <FadeUp
          delay={delay + i * 5}
          style={{
            flex: stepWidth ? undefined : 1,
            width: stepWidth,
            background: s.bg ?? T.panel,
            border: `2px solid ${s.color ?? T.line}`,
            borderRadius: 14,
            padding: "16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 7,
            boxShadow: "0 6px 16px rgba(20,26,34,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {s.no ? (
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: s.color ?? T.blue,
                  color: "#fff",
                  fontFamily: T.mono,
                  fontSize: 15,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {s.no}
              </span>
            ) : null}
            <span
              style={{
                fontFamily: T.cn,
                fontSize: size,
                fontWeight: 800,
                color: s.color ?? T.ink,
                lineHeight: 1.25,
              }}
            >
              {s.title}
            </span>
          </div>
          {s.desc ? (
            <span
              style={{
                fontFamily: T.cn,
                fontSize: size - 3,
                fontWeight: 500,
                color: T.sub,
                lineHeight: 1.45,
              }}
            >
              {s.desc}
            </span>
          ) : null}
        </FadeUp>
        {i < steps.length - 1 ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Arrow width={34} delay={delay + i * 5 + 3} />
          </div>
        ) : null}
      </React.Fragment>
    ))}
  </div>
);

// ==================== 数据表 ====================

export interface TableRow {
  cells: React.ReactNode[];
  accent?: string;
  bg?: string;
}

export const DataTable: React.FC<{
  head?: React.ReactNode[];
  rows: TableRow[];
  widths?: (string | undefined)[];
  delay?: number;
  size?: number;
  headColor?: string;
  style?: React.CSSProperties;
  rowGap?: number;
}> = ({ head, rows, widths, delay = 0, size = 21, headColor = T.sub, style, rowGap = 6 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: rowGap, width: "100%", ...style }}>
    {head ? (
      <FadeUp
        delay={delay}
        style={{
          display: "flex",
          gap: 10,
          padding: "0 14px 6px",
          borderBottom: `2px solid ${T.line}`,
        }}
      >
        {head.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              width: widths?.[i],
              fontFamily: T.mono,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 2,
              color: headColor,
              textTransform: "uppercase",
            }}
          >
            {h}
          </div>
        ))}
      </FadeUp>
    ) : null}
    {rows.map((r, i) => (
      <FadeUp
        key={i}
        delay={delay + 4 + i * 4}
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: r.bg ?? T.panel,
          border: `1.5px solid ${r.accent ? `${r.accent}44` : T.line}`,
          borderLeft: `5px solid ${r.accent ?? T.line}`,
          borderRadius: 10,
          padding: "11px 14px",
        }}
      >
        {r.cells.map((c, j) => (
          <div
            key={j}
            style={{
              flex: 1,
              width: widths?.[j],
              fontFamily: T.cn,
              fontSize: size,
              fontWeight: j === 0 ? 700 : 500,
              color: j === 0 ? T.ink : T.ink2,
              lineHeight: 1.4,
            }}
          >
            {c}
          </div>
        ))}
      </FadeUp>
    ))}
  </div>
);

// ==================== 页表格子（页表 / TLB 表项示意） ====================

export const EntryTable: React.FC<{
  cols: string[];
  rows: (string | number)[][];
  delay?: number;
  highlight?: number;
  accent?: string;
  width?: number;
  size?: number;
  indexLabel?: string;
  style?: React.CSSProperties;
}> = ({
  cols,
  rows,
  delay = 0,
  highlight = -1,
  accent = T.blue,
  width = 460,
  size = 19,
  indexLabel = "VPN",
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width, ...style }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 74 }} />
        {cols.map((c) => (
          <div
            key={c}
            style={{
              flex: 1,
              fontFamily: T.mono,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: T.sub,
              textAlign: "center",
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map((r, i) => {
          const on = i === highlight || highlight === -2;
          const ap = interpolate(frame, [delay + i * 4, delay + i * 4 + 8], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                opacity: ap,
                background: on ? `${accent}12` : T.panel,
                border: `1.5px solid ${on ? accent : T.line}`,
                borderRadius: 8,
                padding: "7px 0",
              }}
            >
              <div
                style={{
                  width: 74,
                  textAlign: "center",
                  fontFamily: T.mono,
                  fontSize: 15,
                  fontWeight: 700,
                  color: T.faint,
                }}
              >
                {indexLabel === "VPN" ? i.toString(16).toUpperCase() : `${indexLabel}${i}`}
              </div>
              {r.map((c, j) => (
                <div
                  key={j}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontFamily: T.mono,
                    fontSize: size,
                    fontWeight: on ? 800 : 600,
                    color: on ? accent : T.ink2,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== 存储块网格 ====================

export const BlockGrid: React.FC<{
  cols: number;
  rows: number;
  labels?: string[];
  highlight?: number[];
  dimFrom?: number;
  color?: string;
  bg?: string;
  cellH?: number;
  gap?: number;
  delay?: number;
  size?: number;
  style?: React.CSSProperties;
}> = ({
  cols,
  rows,
  labels,
  highlight = [],
  dimFrom,
  color = T.blue,
  bg = T.blueSoft,
  cellH = 44,
  gap = 6,
  delay = 0,
  size = 15,
  style,
}) => {
  const frame = useCurrentFrame();
  const total = cols * rows;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const on = highlight.indexOf(i) >= 0;
        const dim = dimFrom !== undefined && i >= dimFrom;
        const ap = interpolate(frame, [delay + i * 1.2, delay + i * 1.2 + 6], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              height: cellH,
              borderRadius: 7,
              background: dim ? "#F2F5F9" : on ? bg : T.panel,
              border: `1.5px ${dim ? "dashed" : "solid"} ${dim ? "#D7DEE9" : on ? color : T.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: T.mono,
              fontSize: size,
              fontWeight: 700,
              color: dim ? "#C3CBD8" : on ? color : T.faint,
              opacity: ap,
            }}
          >
            {labels?.[i] ?? i}
          </div>
        );
      })}
    </div>
  );
};
