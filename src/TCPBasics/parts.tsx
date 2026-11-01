import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { T, clamp } from "./tokens";

// ==================== 小方块（报文 / 字节） ====================

export type BlockState = "ok" | "lost" | "late" | "idle" | "on";

const BLOCK_COLOR: Record<BlockState, { bd: string; bg: string; fg: string }> = {
  ok: { bd: T.green, bg: T.greenSoft, fg: T.green },
  lost: { bd: T.red, bg: T.redSoft, fg: T.red },
  late: { bd: T.amber, bg: T.amberSoft, fg: T.amber },
  idle: { bd: "#D8DFE8", bg: T.panel, fg: "#AEB8C4" },
  on: { bd: T.ink, bg: T.ink, fg: "#FFFFFF" },
};

/** 一排带状态的小方块，用于报文序列 / 字节序列 */
export const MiniBlocks: React.FC<{
  items: { text: string; state?: BlockState; label?: string }[];
  delay?: number;
  step?: number;
  size?: number;
  height?: number;
  gap?: number;
  labelSize?: number;
}> = ({ items, delay = 0, step = 6, size = 78, height = 62, gap = 8, labelSize = 16 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap }}>
      {items.map((it, i) => {
        const at = delay + i * step;
        const op = interpolate(frame, [at, at + 9], [0, 1], clamp);
        const c = BLOCK_COLOR[it.state ?? "idle"];
        const s = interpolate(frame, [at, at + 10], [0.8, 1], clamp);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: size,
                height,
                borderRadius: 10,
                background: c.bg,
                border: `2px solid ${c.bd}`,
                color: c.fg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: height * 0.36,
                fontWeight: 800,
                opacity: op,
                transform: `scale(${s})`,
                position: "relative",
                textDecoration: it.state === "lost" ? "line-through" : undefined,
              }}
            >
              {it.text}
            </div>
            {it.label && (
              <div
                style={{
                  fontFamily: T.cn,
                  fontSize: labelSize,
                  fontWeight: 700,
                  color: it.state ? BLOCK_COLOR[it.state].bd : T.faint,
                  opacity: op,
                  whiteSpace: "nowrap",
                }}
              >
                {it.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ==================== 公式 ====================

export const Formula: React.FC<{
  parts: { text: string; color?: string; size?: number }[];
  delay?: number;
  size?: number;
  align?: "center" | "left";
  gap?: number;
}> = ({ parts, delay = 0, size = 32, align = "center", gap = 10 }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 10], [0, 1], clamp);
  const shift = interpolate(frame, [delay, delay + 12], [12, 0], clamp);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap,
        opacity: op,
        transform: `translateY(${shift}px)`,
        flexWrap: "wrap",
      }}
    >
      {parts.map((p, i) => (
        <span
          key={i}
          style={{
            fontFamily: T.mono,
            fontSize: p.size ?? size,
            fontWeight: 800,
            color: p.color ?? T.ink,
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
};

// ==================== 数字指标 ====================

export const Stat: React.FC<{
  value: string;
  label: string;
  color?: string;
  delay?: number;
  size?: number;
}> = ({ value, label, color = T.blue, delay = 0, size = 46 }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 10], [0, 1], clamp);
  const s = interpolate(frame, [delay, delay + 14], [0.86, 1], clamp);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: op }}>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: size,
          fontWeight: 800,
          color,
          lineHeight: 1.1,
          transform: `scale(${s})`,
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: T.cn, fontSize: 18, fontWeight: 700, color: T.sub, whiteSpace: "nowrap" }}>
        {label}
      </div>
    </div>
  );
};

// ==================== 比例条 ====================

export const MiniBar: React.FC<{
  ratio: number;
  width?: number;
  height?: number;
  color?: string;
  bg?: string;
  delay?: number;
  label?: string;
}> = ({ ratio, width = 320, height = 22, color = T.blue, bg = "#EDF1F6", delay = 0, label }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [delay, delay + 18], [0, ratio], clamp);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width,
          height,
          borderRadius: height / 2,
          background: bg,
          overflow: "hidden",
          border: `1.5px solid ${T.line}`,
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(1, w)) * 100}%`,
            height: "100%",
            background: color,
            borderRadius: height / 2,
          }}
        />
      </div>
      {label && (
        <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color }}>{label}</div>
      )}
    </div>
  );
};

// ==================== 标签行 ====================

export const TagLine: React.FC<{
  tag: string;
  color?: string;
  bg?: string;
  text: React.ReactNode;
  delay?: number;
  size?: number;
  width?: number;
}> = ({ tag, color = T.blue, bg = T.blueSoft, text, delay = 0, size = 22, width }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 9], [0, 1], clamp);
  const x = interpolate(frame, [delay, delay + 12], [-12, 0], clamp);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: op,
        transform: `translateX(${x}px)`,
        width,
      }}
    >
      <div
        style={{
          background: bg,
          color,
          border: `1.5px solid ${color}44`,
          borderRadius: 8,
          padding: "4px 12px",
          fontFamily: T.mono,
          fontSize: size,
          fontWeight: 800,
          whiteSpace: "nowrap",
          minWidth: 64,
          textAlign: "center",
        }}
      >
        {tag}
      </div>
      <div style={{ fontFamily: T.cn, fontSize: size + 3, fontWeight: 700, color: T.ink2, lineHeight: 1.4 }}>
        {text}
      </div>
    </div>
  );
};
