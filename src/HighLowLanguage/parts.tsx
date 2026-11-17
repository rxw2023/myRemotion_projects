import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Rule, p } from "../shared/b3b/ui";

// ==========================================================================
// 这一期专用的零件：代码块 / 阶段卡 / 栈帧图 / 条目行
// 跨期共用件在 src/shared/b3b/，这里只放《高级语言与机器码》用得到的东西。
// ==========================================================================

/** 代码块：一行一行亮起来，可高亮某几行、右侧挂等宽注释 */
export interface CodeLine {
  t: string;
  /** 行内文字颜色（整行统一，够用） */
  c?: string;
  /** 高亮底色（传颜色） */
  hl?: string;
  /** 右侧注释 */
  note?: string;
  /** 淡出（上一段用过的行） */
  dim?: boolean;
  /** 行首缩进的空格数，写代码时懒得数空格 */
  ind?: number;
  /** 行前的小圆点/标记 */
  mark?: string;
}

export const Code: React.FC<{
  x: number;
  y: number;
  w?: number;
  title?: string;
  lines: CodeLine[];
  delay?: number;
  stagger?: number;
  size?: number;
  lh?: number;
  noteGap?: number;
}> = ({ x, y, w = 640, title, lines, delay = 0, stagger = 9, size = 24, lh = 1.95, noteGap = 18 }) => {
  const frame = useCurrentFrame();
  const padX = 26;
  const padY = title ? 62 : 22;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: padY + lines.length * size * lh + 18,
          borderRadius: 10,
          border: `1px solid ${T.line}`,
          background: "rgba(255,255,255,0.022)",
          opacity: p(frame, delay - 6, 16),
        }}
      />
      {title ? (
        <>
          <div
            style={{
              position: "absolute",
              left: x + padX,
              top: y + 20,
              fontFamily: F.mono,
              fontSize: 17,
              letterSpacing: 2,
              color: T.faint,
              opacity: p(frame, delay - 4, 14),
            }}
          >
            {title}
          </div>
          <div style={{ position: "absolute", left: x + 1, top: y + 48, width: w - 2, height: 1, background: T.line, opacity: 0.7 }} />
        </>
      ) : null}
      {lines.map((l, i) => {
        const d = delay + i * stagger;
        const v = p(frame, d, 12);
        return (
          <React.Fragment key={i}>
            {l.hl ? (
              <div
                style={{
                  position: "absolute",
                  left: x + 6,
                  top: y + padY + i * size * lh - 4,
                  width: w - 12,
                  height: size * lh,
                  borderRadius: 5,
                  background: `${l.hl}14`,
                  borderLeft: `2px solid ${l.hl}`,
                  opacity: v,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: x + padX,
                top: y + padY + i * size * lh,
                fontFamily: F.mono,
                fontSize: size,
                lineHeight: 1,
                color: l.dim ? T.faint : (l.c ?? T.ink2),
                whiteSpace: "pre",
                opacity: v * (l.dim ? 0.55 : 1),
                transform: `translateX(${(1 - v) * 8}px)`,
              }}
            >
              {l.ind ? "  ".repeat(l.ind) : ""}
              {l.t}
            </div>
            {l.note ? (
              <div
                style={{
                  position: "absolute",
                  left: x + w - padX - noteGap,
                  top: y + padY + i * size * lh,
                  transform: "translateX(-100%)",
                  fontFamily: F.cn,
                  fontSize: 17,
                  lineHeight: 1,
                  color: l.hl ?? T.sub,
                  whiteSpace: "nowrap",
                  opacity: v * 0.95,
                }}
              >
                {l.note}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 段首小标题：一根短线 + 等宽字 */
export const Head: React.FC<{ x: number; y: number; text: string; color?: string; delay?: number; size?: number }> = ({
  x,
  y,
  text,
  color = T.sub,
  delay = 0,
  size = 19,
}) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: F.mono,
        fontSize: size,
        letterSpacing: 2,
        color,
        opacity: v * 0.95,
      }}
    >
      <span style={{ width: 22 * v, height: 1, background: color, display: "inline-block" }} />
      <span>{text}</span>
    </div>
  );
};

/** 条目行：编号 + 标题 + 右侧等宽注释 */
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
}> = ({ x, y, i, title, note, color = T.teal, delay = 0, w = 900, dim = false, rule = true, size = 26 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 16);
  return (
    <>
      {rule ? <Rule w={w} color={T.line} delay={delay} dur={22} style={{ position: "absolute", left: x, top: y + 56 }} /> : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          opacity: v * (dim ? 0.45 : 1),
          transform: `translateX(${(1 - v) * 12}px)`,
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 18, color, letterSpacing: 1.2 }}>{i < 10 ? `0${i}` : i}</span>
        <span style={{ fontFamily: F.cn, fontSize: size, color: T.ink, flex: 1, letterSpacing: 0.5 }}>{title}</span>
        {note ? <span style={{ fontFamily: F.mono, fontSize: 16, color: T.faint }}>{note}</span> : null}
      </div>
    </>
  );
};

/** 阶段卡：序号 / 动作 / 角色 / 产物 —— 编译四步用它排一行 */
export const PhaseCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  n: number;
  zh: string;
  en: string;
  role: string;
  out: string;
  color: string;
  delay?: number;
}> = ({ x, y, w, h = 250, n, zh, en, role, out, color, delay = 0 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 20);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 12,
        border: `1.5px solid ${color}55`,
        background: `${color}0D`,
        opacity: v,
        transform: `translateY(${(1 - v) * 16}px)`,
        padding: "22px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: F.mono, fontSize: 16, color, letterSpacing: 1 }}>0{n}</span>
        <span style={{ fontFamily: F.cn, fontSize: 30, color: T.ink, letterSpacing: 1 }}>{zh}</span>
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 15, color: `${color}AA`, letterSpacing: 2.4, marginTop: 6 }}>{en}</div>
      <div style={{ height: 1, background: T.line, margin: "16px 0 12px" }} />
      <div style={{ fontFamily: F.cn, fontSize: 17, color: T.sub, lineHeight: 1.6 }}>{role}</div>
      <div style={{ fontFamily: F.mono, fontSize: 17, color, marginTop: 8, whiteSpace: "nowrap" }}>{out}</div>
    </div>
  );
};

/** 栈帧：从上往下是"高地址 → 低地址"，带地址偏移与 ebp 标注 */
export interface StackCell {
  label: string;
  note?: string;
  color?: string;
  h?: number;
  dashed?: boolean;
  dim?: boolean;
}

export const Stack: React.FC<{
  x: number;
  y: number;
  w?: number;
  cells: StackCell[];
  ebpAt?: number;
  gap?: number;
  delay?: number;
  stagger?: number;
  size?: number;
}> = ({ x, y, w = 420, cells, ebpAt, gap = 6, delay = 0, stagger = 7, size = 22 }) => {
  const frame = useCurrentFrame();
  let cy = y;

  return (
    <>
      {cells.map((c, i) => {
        const h = c.h ?? 62;
        const top = cy;
        cy += h + gap;
        const v = p(frame, delay + i * stagger, 14);
        const col = c.color ?? T.ink2;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top,
                width: w,
                height: h,
                borderRadius: 7,
                border: `1.5px ${c.dashed ? "dashed" : "solid"} ${c.dim ? T.line : `${col}99`}`,
                background: c.dim ? "transparent" : `${col}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
                boxSizing: "border-box",
                opacity: v * (c.dim ? 0.55 : 1),
                transform: `translateX(${(1 - v) * -10}px)`,
              }}
            >
              <span style={{ fontFamily: F.cn, fontSize: size, color: c.dim ? T.faint : col }}>{c.label}</span>
              <span style={{ fontFamily: F.mono, fontSize: 16, color: T.faint }}>{c.note}</span>
            </div>
            {ebpAt === i ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: x - 96,
                    top: top + h / 2 - 1,
                    width: 78,
                    height: 2,
                    background: T.yellow,
                    opacity: v,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: x - 150,
                    top: top + h / 2 - 13,
                    fontFamily: F.mono,
                    fontSize: 19,
                    color: T.yellow,
                    opacity: v,
                  }}
                >
                  EBP →
                </div>
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 小标签块：一个词，带边框，用来指"这就是那条指令" */
export const Tok: React.FC<{
  x: number;
  y: number;
  text: string;
  color?: string;
  delay?: number;
  size?: number;
  strike?: boolean;
}> = ({ x, y, text, color = T.ink2, delay = 0, size = 22, strike = false }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "5px 12px",
        borderRadius: 6,
        border: `1px solid ${color}66`,
        background: `${color}10`,
        fontFamily: F.mono,
        fontSize: size,
        color,
        opacity: v,
        whiteSpace: "nowrap",
        textDecoration: strike ? "line-through" : undefined,
        transform: `scale(${0.92 + 0.08 * v})`,
      }}
    >
      {text}
    </div>
  );
};
