import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Rule, p } from "../shared/b3b/ui";

// ==========================================================================
// 这一期专用的零件。跨期共用件在 src/shared/b3b/，这里只放《指令操作码》用得到的东西。
//
// 全片的核心符号是 Board —— 五格状态板。
// 颜色语义贯穿 12 场，不许改动：
//   REG 蓝   寄存器
//   MEM 橙   内存（含运行栈）
//   FLAGS 黄 标志位
//   PC 绿    程序计数器
//   PORT 紫  I/O 端口
// 观众看到哪一格亮了，就知道这条指令动了什么。
// ==========================================================================

export type StateKey = "reg" | "mem" | "flag" | "pc" | "port";

export const STATES: { k: StateKey; en: string; zh: string; c: string }[] = [
  { k: "reg", en: "REG", zh: "寄存器", c: T.blue },
  { k: "mem", en: "MEM", zh: "内存", c: T.orange },
  { k: "flag", en: "FLAGS", zh: "标志位", c: T.yellow },
  { k: "pc", en: "PC", zh: "计数器", c: T.green },
  { k: "port", en: "PORT", zh: "端口", c: T.purple },
];

export const stateColor = (k: StateKey) => STATES.find((s) => s.k === k)!.c;

/** 五格状态板：亮着的是这条指令改动的状态，其余压暗 */
export const Board: React.FC<{
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  active?: StateKey[];
  delay?: number;
  label?: string;
  /** 整体透明度，用来把板子退到背景 */
  dim?: number;
  /** 只点亮某几格、其余完全不显示（用于"还没讲到"的渐进感） */
  reveal?: number;
}> = ({ x = 1136, y = 72, w = 690, h = 78, active = [], delay = 0, label, dim = 1, reveal = 5 }) => {
  const frame = useCurrentFrame();
  const gap = 8;
  const cw = (w - gap * (STATES.length - 1)) / STATES.length;

  return (
    <>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y - 30,
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: 2.4,
            color: T.faint,
            opacity: p(frame, delay - 6, 14) * dim,
          }}
        >
          {label}
        </div>
      ) : null}
      {STATES.map((s, i) => {
        const on = active.indexOf(s.k) >= 0;
        const vis = i < reveal;
        const v = p(frame, delay + i * 4, 14);
        // 点亮的那一格比别的晚一拍，让"哪份状态被动了"有先后感
        const bump = on ? Math.min(1, Math.max(0, (frame - (delay + 12 + i * 4)) / 10)) : 0;
        return (
          <div
            key={s.k}
            style={{
              position: "absolute",
              left: x + i * (cw + gap),
              top: y,
              width: cw,
              height: h,
              borderRadius: 8,
              border: `${on ? 1.5 : 1}px solid ${on ? s.c : T.line}`,
              background: on ? `${s.c}1C` : "rgba(255,255,255,0.014)",
              opacity: vis ? v * dim * (on ? 1 : 0.42) : 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              transform: `scale(${1 + (on ? 0.035 * Math.sin(bump * Math.PI) : 0)})`,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: 1.6, color: on ? s.c : T.sub }}>{s.en}</span>
            <span style={{ fontFamily: F.cn, fontSize: 14, letterSpacing: 0.6, color: on ? `${s.c}C8` : T.faint }}>{s.zh}</span>
          </div>
        );
      })}
    </>
  );
};

/** 代码块：一行行亮起，可高亮某行、右侧挂中文注释 */
export interface CodeLine {
  t: string;
  c?: string;
  hl?: string;
  note?: string;
  dim?: boolean;
  ind?: number;
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
}> = ({ x, y, w = 620, title, lines, delay = 0, stagger = 8, size = 23, lh = 1.95 }) => {
  const frame = useCurrentFrame();
  const padX = 24;
  const padY = title ? 58 : 20;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: padY + lines.length * size * lh + 16,
          borderRadius: 10,
          border: `1px solid ${T.line}`,
          background: "rgba(255,255,255,0.022)",
          opacity: p(frame, delay - 8, 16),
        }}
      />
      {title ? (
        <>
          <div
            style={{
              position: "absolute",
              left: x + padX,
              top: y + 18,
              fontFamily: F.mono,
              fontSize: 16,
              letterSpacing: 2,
              color: T.faint,
              opacity: p(frame, delay - 6, 14),
            }}
          >
            {title}
          </div>
          <div
            style={{ position: "absolute", left: x + 1, top: y + 45, width: w - 2, height: 1, background: T.line, opacity: 0.7 }}
          />
        </>
      ) : null}
      {lines.map((l, i) => {
        const v = p(frame, delay + i * stagger, 12);
        return (
          <React.Fragment key={i}>
            {l.hl ? (
              <div
                style={{
                  position: "absolute",
                  left: x + 6,
                  top: y + padY + i * size * lh - 5,
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
                opacity: v * (l.dim ? 0.68 : 1),
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
                  left: x + w - padX,
                  top: y + padY + i * size * lh + 3,
                  transform: "translateX(-100%)",
                  fontFamily: F.cn,
                  fontSize: 16,
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
  size = 18,
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
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 22 * v, height: 1, background: color, display: "inline-block" }} />
      <span>{text}</span>
    </div>
  );
};

/** 指令名小标签 */
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

/**
 * 移位演示：原值 8 位 → 移出的位 + 结果 8 位。
 * 被"补"的位置单独上色，一眼看出逻辑移位补 0、算术移位补符号位、循环移位补回来。
 */
export const Shift: React.FC<{
  x: number;
  y: number;
  tag: string;
  tagColor: string;
  from: string;
  to: string;
  /** 被填充的位下标（0 起，从左数） */
  fill: number[];
  fillColor: string;
  /** 移出的位，显示在左侧 */
  carry?: string;
  delay?: number;
  cw?: number;
  ch?: number;
}> = ({ x, y, tag, tagColor, from, to, fill, fillColor, carry, delay = 0, cw = 38, ch = 44 }) => {
  const frame = useCurrentFrame();
  const gap = 3;
  const bitsW = from.length * (cw + gap);
  const v = p(frame, delay, 16);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          fontFamily: F.mono,
          fontSize: 19,
          letterSpacing: 1.4,
          color: tagColor,
          opacity: v,
        }}
      >
        {tag}
      </div>
      {/* 原值 */}
      <div style={{ position: "absolute", left: x, top: y + 34, opacity: v }}>
        {from.split("").map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * (cw + gap),
              top: 0,
              width: cw,
              height: ch,
              borderRadius: 4,
              border: `1px solid ${T.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.mono,
              fontSize: 22,
              color: T.sub,
            }}
          >
            {b}
          </div>
        ))}
      </div>
      {/* 下移箭头 */}
      <div
        style={{
          position: "absolute",
          left: x + bitsW / 2 - 1,
          top: y + 34 + ch + 10,
          width: 1,
          height: 22 * v,
          background: `${tagColor}88`,
        }}
      />
      {/* 结果 */}
      <div style={{ position: "absolute", left: x, top: y + 34 + ch + 40, opacity: v }}>
        {to.split("").map((b, i) => {
          const isFill = fill.indexOf(i) >= 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: i * (cw + gap),
                top: 0,
                width: cw,
                height: ch,
                borderRadius: 4,
                border: `${isFill ? 1.5 : 1}px ${isFill ? "dashed" : "solid"} ${isFill ? fillColor : T.line}`,
                background: isFill ? `${fillColor}1A` : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize: 22,
                color: isFill ? fillColor : T.ink2,
              }}
            >
              {b}
            </div>
          );
        })}
      </div>
      {/* 移出的位：挂在标题行右侧，避免挤压左边相邻那块 */}
      {carry ? (
        <div
          style={{
            position: "absolute",
            left: x + bitsW + 22,
            top: y + 2,
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontFamily: F.mono,
            fontSize: 17,
            color: T.red,
            whiteSpace: "nowrap",
            opacity: v,
          }}
        >
          <span>移出</span>
          <span style={{ fontSize: 20 }}>{carry}</span>
        </div>
      ) : null}
    </>
  );
};

/** EDX:EAX 寄存器对：乘除法的固定数据通路 */
export const RegPair: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  delay?: number;
  hi?: string;
  lo?: string;
  note?: string;
  highlight?: "hi" | "lo" | null;
}> = ({ x, y, w = 520, h = 96, delay = 0, hi = "EDX", lo = "EAX", note, highlight = null }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  const gap = 22;
  const half = (w - gap) / 2;

  const cell = (label: string, left: number, which: "hi" | "lo", sub: string) => {
    const on = highlight === which;
    const c = which === "hi" ? T.purple : T.blue;
    return (
      <div
        style={{
          position: "absolute",
          left,
          top: 0,
          width: half,
          height: h,
          borderRadius: 8,
          border: `${on ? 2 : 1.5}px solid ${on ? c : `${c}88`}`,
          background: `${c}${on ? "24" : "12"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          transform: `scale(${0.94 + 0.06 * v})`,
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 30, letterSpacing: 2, color: c }}>{label}</span>
        <span style={{ fontFamily: F.cn, fontSize: 14, color: T.sub }}>{sub}</span>
      </div>
    );
  };

  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: v }}>
        {cell(hi, 0, "hi", "高位 32 位")}
        {cell(lo, half + gap, "lo", "低位 32 位")}
        <div
          style={{
            position: "absolute",
            left: half,
            top: h / 2 - 19,
            width: gap,
            height: 38,
            textAlign: "center",
            fontFamily: F.mono,
            fontSize: 26,
            lineHeight: "38px",
            color: T.sub,
          }}
        >
          :
        </div>
      </div>
      {note ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y + h + 14,
            fontFamily: F.cn,
            fontSize: 18,
            color: T.sub,
            letterSpacing: 0.4,
            opacity: v,
          }}
        >
          {note}
        </div>
      ) : null}
    </>
  );
};

/**
 * 地址轴：讲 jmp 相对寻址时装下"当前指令 / 下一条 / 目标标签"三个位置，
 * 以及那个要减出来的偏移量。
 */
export interface AddrItem {
  addr: string;
  text: string;
  color?: string;
  /** 虚线框：目标标签 */
  target?: boolean;
  /** 这一行就是 PC 现在的位置 */
  current?: boolean;
}

export const AddrAxis: React.FC<{
  x: number;
  y: number;
  w?: number;
  items: AddrItem[];
  delay?: number;
  /** 在 items 之间画一条偏移量标注：[from 行, to 行] */
  span?: { from: number; to: number; label: string; color?: string };
}> = ({ x, y, w = 620, items, delay = 0, span }) => {
  const frame = useCurrentFrame();
  const rowH = 62;

  return (
    <>
      {/* 左侧地址轴 */}
      <div
        style={{
          position: "absolute",
          left: x - 22,
          top: y + 6,
          width: 1,
          height: (items.length - 1) * rowH + 8,
          background: T.line,
          opacity: p(frame, delay - 4, 14),
        }}
      />
      {items.map((it, i) => {
        const v = p(frame, delay + i * 6, 14);
        const c = it.color ?? T.ink2;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x - 18,
                top: y + i * rowH + rowH / 2 - 3,
                width: 9,
                height: 9,
                borderRadius: 999,
                background: it.current ? T.green : it.target ? T.yellow : T.line,
                opacity: v,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x,
                top: y + i * rowH,
                display: "flex",
                alignItems: "center",
                gap: 20,
                opacity: v,
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 18, color: T.faint, width: 84 }}>{it.addr}</span>
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 5,
                  border: `${it.target ? 1.5 : 1}px ${it.target ? "dashed" : "solid"} ${it.target ? T.yellow : `${T.line}`}`,
                  background: it.target ? `${T.yellow}12` : "transparent",
                  fontFamily: F.mono,
                  fontSize: 20,
                  color: c,
                  whiteSpace: "nowrap",
                }}
              >
                {it.text}
              </div>
              {it.current ? (
                <span style={{ fontFamily: F.mono, fontSize: 15, color: T.green, letterSpacing: 1 }}>← PC</span>
              ) : null}
            </div>
          </React.Fragment>
        );
      })}
      {span ? (
        <>
          {/* 竖线从起点行中心连到终点行中心，两端各一小段横杠，读起来才像"区间" */}
          <div
            style={{
              position: "absolute",
              left: x + w * 0.73,
              top: y + span.from * rowH + rowH / 2,
              width: 1,
              height: (span.to - span.from) * rowH,
              background: span.color ?? T.yellow,
              opacity: 0.75 * p(frame, delay + 20, 16),
            }}
          />
          {[span.from, span.to].map((r, k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: x + w * 0.73,
                top: y + r * rowH + rowH / 2 - 1,
                width: 11,
                height: 1,
                background: span.color ?? T.yellow,
                opacity: 0.75 * p(frame, delay + 20, 16),
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: x + w * 0.73 + 22,
              top: y + ((span.from + span.to) / 2) * rowH + rowH / 2 - 12,
              fontFamily: F.mono,
              fontSize: 17,
              color: span.color ?? T.yellow,
              whiteSpace: "nowrap",
              opacity: p(frame, delay + 24, 16),
            }}
          >
            {span.label}
          </div>
        </>
      ) : null}
    </>
  );
};

/** 竖排小栈：push / pop / call 用它，从高地址往下长 */
export interface StackSlot {
  text: string;
  note?: string;
  color?: string;
  dashed?: boolean;
  /** 空槽（还没压东西） */
  empty?: boolean;
}

export const StackMini: React.FC<{
  x: number;
  y: number;
  w?: number;
  slots: StackSlot[];
  delay?: number;
  stagger?: number;
  /** ESP 指向第几个槽（0 起），在右肩标记 */
  espAt?: number;
  size?: number;
}> = ({ x, y, w = 300, slots, delay = 0, stagger = 7, espAt, size = 20 }) => {
  const frame = useCurrentFrame();
  const h = 54;
  const gap = 4;

  return (
    <>
      {slots.map((s, i) => {
        const v = p(frame, delay + i * stagger, 14);
        const c = s.color ?? T.orange;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y + i * (h + gap),
                width: w,
                height: h,
                borderRadius: 6,
                border: `1.5px ${s.dashed ? "dashed" : "solid"} ${s.empty ? T.line : `${c}99`}`,
                background: s.empty ? "transparent" : `${c}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                boxSizing: "border-box",
                opacity: v * (s.empty ? 0.5 : 1),
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: size, color: s.empty ? T.faint : c }}>{s.text}</span>
              {s.note ? <span style={{ fontFamily: F.cn, fontSize: 15, color: T.faint }}>{s.note}</span> : null}
            </div>
            {espAt === i ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: x + w + 8,
                    top: y + i * (h + gap) + h / 2 - 1,
                    width: 26,
                    height: 2,
                    background: T.green,
                    opacity: v,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: x + w + 40,
                    top: y + i * (h + gap) + h / 2 - 12,
                    fontFamily: F.mono,
                    fontSize: 17,
                    color: T.green,
                    opacity: v,
                  }}
                >
                  ESP
                </div>
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 分类清单：六类指令 + 右边挂每类的代表指令，s01 用它立总纲 */
export const CatRow: React.FC<{
  x: number;
  y: number;
  w?: number;
  n: number;
  zh: string;
  ops: string;
  state: StateKey[];
  delay?: number;
  size?: number;
}> = ({ x, y, w = 760, n, zh, ops, state, delay = 0, size = 25 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 16);
  return (
    <>
      <Rule w={w} color={T.line} delay={delay} dur={20} style={{ position: "absolute", left: x, top: y + 50 }} />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: v,
          transform: `translateX(${(1 - v) * 10}px)`,
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 15, color: T.faint, width: 22 }}>0{n}</span>
        <span style={{ fontFamily: F.cn, fontSize: size, color: T.ink, width: 132, letterSpacing: 0.5 }}>{zh}</span>
        <span style={{ fontFamily: F.mono, fontSize: 16, color: T.faint, flex: 1, letterSpacing: 0.4 }}>{ops}</span>
        <div style={{ display: "flex", gap: 5, width: 132, justifyContent: "flex-end" }}>
          {state.map((k) => {
            const c = stateColor(k);
            return (
              <span
                key={k}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: c,
                  opacity: 0.9,
                  display: "inline-block",
                }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};
