import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { F, T } from "./tokens";

// ==========================================================================
// 3b1b 视觉语言组件库（多期知识点视频共用）
//
// 与 src/InstructionFormat/ui.tsx 的差别只有一处：字幕通过 CueProvider 注入，
// 不再直接 import 某一期的 timings.ts —— 这样两期视频能共用同一套组件。
// ==========================================================================

export interface Cue {
  text: string;
  start: number;
  end: number;
}

const CueCtx = createContext<Record<string, Cue[]>>({});

/** 把某一期的 CUES 挂到树上，Subs / useCues 从这里取 */
export const CueProvider: React.FC<{
  cues: Record<string, Cue[]>;
  children: React.ReactNode;
}> = ({ cues, children }) => <CueCtx.Provider value={cues}>{children}</CueCtx.Provider>;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const EASE = Easing.bezier(0.33, 0, 0.2, 1);

/** 归一化进度：frame 从 start 起、历时 dur 帧，缓动到 1 */
export const p = (frame: number, start: number, dur = 16) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: EASE });

/** 场景内的字幕节拍：用来让每个元素跟着旁白出场 */
export const useCues = (id: string) => {
  const all = useContext(CueCtx);
  const list = all[id] ?? [];
  const starts = list.map((c) => c.start);
  const at = (i: number) => starts[Math.min(i, Math.max(0, starts.length - 1))] ?? 0;
  return { list, starts, at };
};

// ==================== 舞台 ====================

/** 深灰底 + 点阵 + 极轻的呼吸（4 秒一个来回，看不出来，但画面不死） */
export const Stage: React.FC<{
  children: React.ReactNode;
  label?: string;
  accent?: string;
}> = ({ children, label, accent = T.faint }) => {
  const frame = useCurrentFrame();
  const breath = 1 + Math.sin(frame / 120) * 0.004;
  const drift = Math.sin(frame / 210) * 4;

  return (
    <AbsoluteFill style={{ backgroundColor: T.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${T.grid} 1.1px, transparent 1.1px)`,
          backgroundSize: "48px 48px",
          backgroundPosition: "0 0",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 70% 65% at 50% 45%, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 68,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: F.mono,
            fontSize: 20,
            letterSpacing: 2.5,
            color: accent,
            opacity: 0.9,
          }}
        >
          <span style={{ width: 26, height: 1, background: accent, display: "inline-block" }} />
          <span>{label}</span>
        </div>
      ) : null}
      <AbsoluteFill style={{ transform: `scale(${breath}) translateY(${drift}px)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ==================== 文字 ====================

/** 从左往右"写"出来（clip 揭示），3b1b 的 Write 效果近似 */
export const Write: React.FC<{
  text?: string;
  children?: React.ReactNode;
  delay?: number;
  dur?: number;
  size?: number;
  color?: string;
  weight?: number;
  mono?: boolean;
  serif?: boolean;
  spacing?: number;
  style?: React.CSSProperties;
}> = ({
  text,
  children,
  delay = 0,
  dur = 22,
  size = 40,
  color = T.ink,
  weight = 400,
  mono = false,
  serif = false,
  spacing = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, dur);
  return (
    <div
      style={{
        fontFamily: serif ? F.serif : mono ? F.mono : F.cn,
        fontSize: size,
        color,
        fontWeight: weight,
        letterSpacing: spacing,
        lineHeight: 1.35,
        clipPath: `inset(-12% ${(1 - v) * 100}% -12% 0)`,
        ...style,
      }}
    >
      {children ?? text}
    </div>
  );
};

/** 纯淡入（用于已经在画面里的东西做二次强调） */
export const Fade: React.FC<{
  delay?: number;
  dur?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, dur = 16, y = 14, children, style }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, dur);
  return (
    <div style={{ opacity: v, transform: `translateY(${(1 - v) * y}px)`, ...style }}>{children}</div>
  );
};

// ==================== 线、框、箭头 ====================

/** 横线：从左往右长出来 */
export const Rule: React.FC<{
  w?: number | string;
  color?: string;
  delay?: number;
  h?: number;
  dur?: number;
  style?: React.CSSProperties;
}> = ({ w = 200, color = T.line, delay = 0, h = 1, dur = 18, style }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, dur);
  return (
    <div
      style={{
        width: w,
        height: h,
        background: color,
        transform: `scaleX(${v})`,
        transformOrigin: "left center",
        ...style,
      }}
    />
  );
};

/** 矩形边框：用 stroke 画出来，不是淡入 */
export const Frame: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  r?: number;
  delay?: number;
  dur?: number;
  fill?: string;
  dash?: string;
  sw?: number;
}> = ({ x, y, w, h, color = T.line, r = 12, delay = 0, dur = 20, fill, dash, sw = 1.5 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, dur);
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1920} height={1080}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill={fill ?? "transparent"}
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={dash ?? 1}
        pathLength={dash ? undefined : 1}
        strokeDashoffset={dash ? 0 : 1 - v}
        opacity={dash ? 0.7 : 1}
      />
    </svg>
  );
};

/** 箭头：线先长，箭头再落 */
export const Arrow: React.FC<{
  from: [number, number];
  to: [number, number];
  color?: string;
  delay?: number;
  dur?: number;
  dashed?: boolean;
  curve?: number;
  sw?: number;
  head?: number;
}> = ({ from, to, color = T.sub, delay = 0, dur = 20, dashed = false, curve = 0, sw = 2, head = 11 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, dur);
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const cx = mx + curve * (y2 - y1) * 0.5;
  const cy = my - curve * (x2 - x1) * 0.5;
  const ang = Math.atan2(y2 - cy, x2 - cx);
  const hx = x2 - Math.cos(ang) * head * 1.2;
  const hy = y2 - Math.sin(ang) * head * 1.2;

  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1920} height={1080}>
      <path
        d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={dashed ? "7 9" : 1}
        pathLength={dashed ? undefined : 1}
        strokeDashoffset={dashed ? 0 : 1 - v}
        opacity={dashed ? 0.75 : 1}
      />
      <polygon
        points={`0,0 ${-head * 1.7},${head * 0.72} ${-head * 1.7},${-head * 0.72}`}
        fill={color}
        opacity={p(frame, delay + dur * 0.7, 10)}
        transform={`translate(${Math.cos(ang) * head * 1.7 + hx} ${Math.sin(ang) * head * 1.7 + hy}) rotate(${(ang * 180) / Math.PI})`}
      />
    </svg>
  );
};

// ==================== 位域 / 字段 ====================

/** 一行比特格：可逐格点亮，可给某几格单独上色 */
export const Bits: React.FC<{
  bits: string;
  x: number;
  y: number;
  cw?: number;
  ch?: number;
  gap?: number;
  delay?: number;
  stagger?: number;
  color?: string;
  /** 覆盖某几位的颜色（下标 → 颜色） */
  paint?: Record<number, string>;
  /** 只显示某几位的颜色，其余压暗 */
  focus?: number[];
  size?: number;
  labels?: string[];
  radius?: number;
}> = ({
  bits,
  x,
  y,
  cw = 34,
  ch = 46,
  gap = 4,
  delay = 0,
  stagger = 1.2,
  color = T.ink2,
  paint,
  focus,
  size,
  labels,
  radius = 5,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {bits.split("").map((b, i) => {
        const v = p(frame, delay + i * stagger, 10);
        const isFocus = !focus || focus.indexOf(i) >= 0;
        const c = paint?.[i] ?? color;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x + i * (cw + gap),
                top: y,
                width: cw,
                height: ch,
                borderRadius: radius,
                border: `1px solid ${isFocus ? c : T.line}`,
                background: isFocus && paint?.[i] ? `${c}22` : "transparent",
                opacity: v * (isFocus ? 1 : 0.35),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize: size ?? Math.round(ch * 0.54),
                color: isFocus ? c : T.faint,
              }}
            >
              {b}
            </div>
            {labels?.[i] ? (
              <div
                style={{
                  position: "absolute",
                  left: x + i * (cw + gap),
                  top: y + ch + 8,
                  width: cw,
                  textAlign: "center",
                  fontFamily: F.mono,
                  fontSize: 17,
                  color: T.sub,
                  opacity: v * 0.8,
                }}
              >
                {labels[i]}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/**
 * 一行存储单元（内存格）。讲对齐、Cache、栈帧都要用它。
 * 每格可单独写 label / 副标 / 颜色 / 实心 / 斜线填充（padding 的视觉语言）。
 */
export interface Cell {
  label?: string;
  sub?: string;
  color?: string;
  fill?: boolean;
  /** 斜线填充：表示"空着的填充字节" */
  hatch?: string;
  dim?: boolean;
}

export const Cells: React.FC<{
  x: number;
  y: number;
  cells: Cell[];
  cw?: number;
  ch?: number;
  gap?: number;
  delay?: number;
  stagger?: number;
  size?: number;
  subSize?: number;
  radius?: number;
  /** 格子下方的偏移 / 地址标签 */
  ticks?: string[];
  tickSize?: number;
  border?: string;
}> = ({
  x,
  y,
  cells,
  cw = 96,
  ch = 84,
  gap = 6,
  delay = 0,
  stagger = 3,
  size = 26,
  subSize = 17,
  radius = 8,
  ticks,
  tickSize = 18,
  border = T.line,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {cells.map((c, i) => {
        const v = p(frame, delay + i * stagger, 12);
        const col = c.color ?? T.ink2;
        let bg = "transparent";
        if (c.hatch) {
          // 斜线要能在深底上被看见：线宽 2.5px、间隔 10px、透明度 0.62
          bg = `repeating-linear-gradient(45deg, ${c.hatch}9E 0 2.5px, transparent 2.5px 10px)`;
        } else if (c.fill) {
          bg = `${col}1F`;
        }
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x + i * (cw + gap),
                top: y,
                width: cw,
                height: ch,
                borderRadius: radius,
                border: `1.5px ${c.hatch ? "dashed" : "solid"} ${c.dim ? border : col}`,
                background: bg,
                opacity: v * (c.dim ? 0.5 : 1),
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                fontFamily: F.mono,
                fontSize: size,
                color: c.dim ? T.faint : col,
                transform: `scale(${0.9 + 0.1 * v})`,
              }}
            >
              <span>{c.label ?? ""}</span>
              {c.sub ? (
                <span style={{ fontSize: subSize, color: T.sub, fontFamily: F.cn }}>{c.sub}</span>
              ) : null}
            </div>
            {ticks?.[i] ? (
              <div
                style={{
                  position: "absolute",
                  left: x + i * (cw + gap),
                  top: y + ch + 9,
                  width: cw,
                  textAlign: "center",
                  fontFamily: F.mono,
                  fontSize: tickSize,
                  color: T.sub,
                  opacity: v * 0.85,
                }}
              >
                {ticks[i]}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 带标签的色块（一个字段），宽 w */
export const Field: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  sub?: string;
  color?: string;
  delay?: number;
  fill?: boolean;
  dashed?: boolean;
  align?: "center" | "left";
  size?: number;
  subSize?: number;
  mono?: boolean;
}> = ({
  x,
  y,
  w,
  h = 72,
  label,
  sub,
  color = T.ink2,
  delay = 0,
  fill = false,
  dashed = false,
  align = "center",
  size = 30,
  subSize = 18,
  mono = true,
}) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 9,
        border: dashed ? `1.5px dashed ${color}` : `1.5px solid ${color}`,
        background: fill ? `${color}1F` : "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        justifyContent: "center",
        paddingLeft: align === "left" ? 18 : 0,
        gap: 3,
        opacity: v,
        transform: `scaleY(${0.82 + 0.18 * v})`,
      }}
    >
      <div style={{ fontFamily: mono ? F.mono : F.cn, fontSize: size, color }}>{label}</div>
      {sub ? (
        <div style={{ fontFamily: F.cn, fontSize: subSize, color: T.sub, letterSpacing: 0.5 }}>{sub}</div>
      ) : null}
    </div>
  );
};

/** 小标签（chip / 徽标） */
export const Chip: React.FC<{
  x: number;
  y: number;
  text: string;
  color?: string;
  delay?: number;
  mono?: boolean;
  size?: number;
  pad?: number;
}> = ({ x, y, text, color = T.sub, delay = 0, mono = true, size = 19, pad = 10 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: `${pad * 0.5}px ${pad}px`,
        borderRadius: 999,
        border: `1px solid ${color}55`,
        color,
        fontFamily: mono ? F.mono : F.cn,
        fontSize: size,
        letterSpacing: 1,
        opacity: v,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** 表格：一行一行地长出来 */
export const Table: React.FC<{
  x: number;
  y: number;
  cols: { label: string; w: number; align?: "left" | "center" }[];
  rows: { cells: React.ReactNode[]; color?: string; dim?: boolean }[];
  delay?: number;
  stagger?: number;
  rowH?: number;
  size?: number;
  mono?: boolean;
}> = ({ x, y, cols, rows, delay = 0, stagger = 12, rowH = 62, size = 25, mono = false }) => {
  const frame = useCurrentFrame();
  const totalW = cols.reduce((a, c) => a + c.w, 0);
  let acc = 0;
  const xs = cols.map((c) => {
    const v = acc;
    acc += c.w;
    return v;
  });

  return (
    <>
      <div style={{ position: "absolute", left: x, top: y }}>
        {cols.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: xs[i],
              top: 0,
              width: c.w,
              fontFamily: F.mono,
              fontSize: 18,
              letterSpacing: 1.6,
              color: T.faint,
              textAlign: c.align ?? "left",
            }}
          >
            {c.label}
          </div>
        ))}
      </div>
      <Rule w={totalW} color={T.line} delay={delay + 4} style={{ position: "absolute", left: x, top: y + 34 }} />
      {rows.map((r, ri) => {
        const v = p(frame, delay + 10 + ri * stagger, 16);
        return (
          <div
            key={ri}
            style={{
              position: "absolute",
              left: x,
              top: y + 50 + ri * rowH,
              width: totalW,
              height: rowH,
              opacity: v * (r.dim ? 0.45 : 1),
              transform: `translateY(${(1 - v) * 8}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: rowH - 1,
                width: totalW,
                height: 1,
                background: T.line,
                opacity: 0.6,
              }}
            />
            {r.cells.map((c, ci) => (
              <div
                key={ci}
                style={{
                  position: "absolute",
                  left: xs[ci],
                  top: 0,
                  height: rowH,
                  width: cols[ci].w,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: cols[ci].align === "center" ? "center" : "flex-start",
                  fontFamily: mono ? F.mono : F.cn,
                  fontSize: size,
                  color: r.color ?? T.ink2,
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};

// ==================== 字幕 ====================

/** 极淡的单行字幕（3b1b 没有字幕，但中文科普需要一个对照） */
export const Subs: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const frame = useCurrentFrame();
  const all = useContext(CueCtx);
  const list = all[sceneId] ?? [];
  if (!list.length) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 54,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {list.map((c, i) => {
        const inV = p(frame, c.start, 7);
        const outV = 1 - p(frame, c.end - 6, 7);
        const v = Math.min(inV, outV);
        if (v <= 0.001) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 0,
              fontFamily: F.cn,
              fontSize: 27,
              letterSpacing: 1,
              color: "rgba(232,232,232,0.62)",
              opacity: v,
              whiteSpace: "nowrap",
            }}
          >
            {c.text}
          </div>
        );
      })}
    </div>
  );
};
