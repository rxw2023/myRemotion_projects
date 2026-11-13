import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Rule, p } from "../shared/b3b/ui";

// ==========================================================================
// 这一期专用的零件：条目行 / 字节条 / 小标题
// 只在本期内部复用（跨期共用件在 src/shared/b3b/）。
// ==========================================================================

/** 一条"编号 + 标题 + 右侧等宽注释"的清单行，配一条下划线 */
export const Item: React.FC<{
  x: number;
  y: number;
  i: number;
  title: string;
  note?: string;
  color?: string;
  delay?: number;
  w?: number;
  dim?: boolean;
  rule?: boolean;
  size?: number;
}> = ({ x, y, i, title, note, color = T.teal, delay = 0, w = 900, dim = false, rule = true, size = 27 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 16);

  return (
    <>
      {rule ? (
        <Rule w={w} color={T.line} delay={delay} dur={22} style={{ position: "absolute", left: x, top: y + 60 }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          display: "flex",
          alignItems: "baseline",
          gap: 20,
          opacity: v * (dim ? 0.42 : 1),
          transform: `translateX(${(1 - v) * 12}px)`,
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 20, color, letterSpacing: 1.2 }}>
          {i < 10 ? `0${i}` : `${i}`}
        </span>
        <span style={{ fontFamily: F.cn, fontSize: size, color: T.ink, flex: 1, letterSpacing: 0.6 }}>{title}</span>
        {note ? (
          <span style={{ fontFamily: F.mono, fontSize: 17, color: T.faint, letterSpacing: 0.5 }}>{note}</span>
        ) : null}
      </div>
    </>
  );
};

/** 一块"XX 字节"的字节条：格子里写十六进制 */
export const Bytes: React.FC<{
  x: number;
  y: number;
  bytes: string[];
  cw?: number;
  ch?: number;
  gap?: number;
  color?: string;
  delay?: number;
  size?: number;
  dim?: boolean;
  label?: string;
}> = ({ x, y, bytes, cw = 62, ch = 46, gap = 3, color = T.orange, delay = 0, size = 20, dim = false, label }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {bytes.map((b, i) => {
        const v = p(frame, delay + i * 2.4, 10);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x + i * (cw + gap),
                top: y,
                width: cw,
                height: ch,
                borderRadius: 4,
                border: `1px solid ${dim ? T.line : `${color}88`}`,
                background: dim ? "transparent" : `${color}18`,
                color: dim ? T.faint : color,
                fontFamily: F.mono,
                fontSize: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: v,
                letterSpacing: 0.5,
              }}
            >
              {b}
            </div>
          </React.Fragment>
        );
      })}
      {label ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y + ch + 10,
            fontFamily: F.mono,
            fontSize: 17,
            color: T.sub,
            letterSpacing: 1,
            opacity: p(frame, delay + bytes.length * 2.4, 14),
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
};

/** 段首小标题：一条短线 + 等宽字 */
export const Head: React.FC<{
  x: number;
  y: number;
  text: string;
  color?: string;
  delay?: number;
  size?: number;
}> = ({ x, y, text, color = T.faint, delay = 0, size = 20 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 16);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: v * 0.9,
        fontFamily: F.mono,
        fontSize: size,
        letterSpacing: 2.4,
        color,
      }}
    >
      <span style={{ width: 22, height: 1, background: color, display: "inline-block" }} />
      <span>{text}</span>
    </div>
  );
};
