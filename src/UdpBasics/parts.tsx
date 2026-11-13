import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Rule, p } from "../shared/b3b/ui";

// ==========================================================================
// 这一期专用的零件：字段带 / 跨度标注 / 计数条目 / 分组行
// 只在本期内部复用（跨期共用件在 src/shared/b3b/）。
// ==========================================================================

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
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 22, height: 1, background: color, display: "inline-block" }} />
      <span>{text}</span>
    </div>
  );
};

/** 一条"编号 + 标题 + 右侧注释"的清单行，配一条下划线 */
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
  noteSize?: number;
  noteColor?: string;
}> = ({
  x,
  y,
  i,
  title,
  note,
  color = T.teal,
  delay = 0,
  w = 900,
  dim = false,
  rule = true,
  size = 27,
  noteSize = 17,
  noteColor = T.faint,
}) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 16);

  return (
    <>
      {rule ? (
        <Rule w={w} color={T.line} delay={delay} dur={22} style={{ position: "absolute", left: x, top: y + 58 }} />
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
        <span style={{ fontFamily: F.mono, fontSize: 20, color, letterSpacing: 1.2, width: 26 }}>
          {i < 10 ? `0${i}` : `${i}`}
        </span>
        <span style={{ fontFamily: F.cn, fontSize: size, color: T.ink, letterSpacing: 0.6 }}>{title}</span>
        <span style={{ flex: 1 }} />
        {note ? (
          <span style={{ fontFamily: F.mono, fontSize: noteSize, color: noteColor, letterSpacing: 0.4 }}>{note}</span>
        ) : null}
      </div>
    </>
  );
};

/** 四步里的一步：编号 + 粗标题 + 两行细节 */
export const Step: React.FC<{
  x: number;
  y: number;
  n: number;
  title: string;
  detail: string;
  /** 追加在 detail 下面的一行小注（用于"补 0"这类补充条件） */
  extra?: string;
  extraDelay?: number;
  color?: string;
  delay?: number;
  w?: number;
  active?: boolean;
}> = ({ x, y, n, title, detail, extra, extraDelay, color = T.blue, delay = 0, w = 700, active = false }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  const ve = extraDelay === undefined ? 0 : p(frame, extraDelay, 16);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        display: "flex",
        gap: 20,
        opacity: v,
        transform: `translateX(${(1 - v) * 14}px)`,
      }}
    >
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 22,
          color,
          border: `1px solid ${color}66`,
          background: active ? `${color}22` : "transparent",
          borderRadius: 6,
          width: 42,
          height: 42,
          flex: "0 0 42px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.cn, fontSize: 29, color: T.ink, letterSpacing: 0.6 }}>{title}</div>
        <div
          style={{
            fontFamily: F.cn,
            fontSize: 19,
            color: T.sub,
            lineHeight: 1.5,
            marginTop: 8,
            letterSpacing: 0.3,
          }}
        >
          {detail}
        </div>
        {extra ? (
          <div
            style={{
              fontFamily: F.cn,
              fontSize: 19,
              color: T.yellow,
              lineHeight: 1.5,
              marginTop: 4,
              letterSpacing: 0.3,
              opacity: ve,
            }}
          >
            {extra}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ==================== 字段带 ====================

export interface Seg {
  label: string;
  sub?: string;
  bytes: number;
  color: string;
  dashed?: boolean;
  fill?: boolean;
  /** 不画这一段的字节刻度（数据段长度不定，刻度会误导） */
  noTick?: boolean;
  /** 单独覆盖字号：窄字段塞不进中文时用 */
  size?: number;
}

/**
 * 按字节数排布的一条字段带：宽度 = 字节数 × pxPerByte，下方带字节刻度。
 * 首部布局、伪首部的覆盖范围都用它画，保证两处比例一致。
 */
export const ByteBand: React.FC<{
  x: number;
  y: number;
  segs: Seg[];
  pxPerByte?: number;
  h?: number;
  delay?: number;
  gap?: number;
  size?: number;
  subSize?: number;
  ticks?: boolean;
  stagger?: number;
}> = ({ x, y, segs, pxPerByte = 110, h = 88, delay = 0, gap = 3, size = 25, subSize = 15, ticks = true, stagger = 4 }) => {
  const frame = useCurrentFrame();
  let cur = 0;
  return (
    <>
      {segs.map((s, i) => {
        const left = x + cur;
        const w = s.bytes * pxPerByte - gap;
        cur += s.bytes * pxPerByte;
        const v = p(frame, delay + i * stagger, 18);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top: y,
              width: w,
              height: h,
              borderRadius: 8,
              border: `1.5px ${s.dashed ? "dashed" : "solid"} ${v > 0 ? s.color : "transparent"}`,
              background: s.fill ? `${s.color}1F` : "transparent",
              opacity: v,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              transform: `scaleY(${0.86 + 0.14 * v})`,
            }}
          >
            <span
              style={{
                fontFamily: F.cn,
                fontSize: s.size ?? size,
                color: s.color,
                letterSpacing: 0.4,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
            {s.sub ? (
              <span style={{ fontFamily: F.mono, fontSize: subSize, color: T.sub, letterSpacing: 0.6 }}>{s.sub}</span>
            ) : null}
          </div>
        );
      })}
      {ticks
        ? segs.reduce<React.ReactNode[]>((acc, s, si) => {
            if (s.noTick) return acc;
            const base = segs.slice(0, si).reduce((a, b) => a + b.bytes, 0);
            for (let k = 0; k < s.bytes; k += 1) {
              const bi = base + k;
              const v = p(frame, delay + si * stagger + k * 1.2, 12);
              acc.push(
                <div
                  key={`t${bi}`}
                  style={{
                    position: "absolute",
                    left: x + bi * pxPerByte,
                    top: y + h + 6,
                    width: pxPerByte - gap,
                    textAlign: "center",
                    fontFamily: F.mono,
                    fontSize: 14,
                    color: T.faint,
                    opacity: v * 0.9,
                  }}
                >
                  {bi}
                </div>,
              );
            }
            return acc;
          }, [])
        : null}
    </>
  );
};

/** 字段带上方（或下方）的跨度标注：一条线 + 两端短竖 + 居中标签 */
export const Span: React.FC<{
  x: number;
  y: number;
  w: number;
  label: string;
  color?: string;
  delay?: number;
  down?: boolean;
  size?: number;
}> = ({ x, y, w, label, color = T.faint, delay = 0, down = false, size = 19 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 20);
  const dir = down ? 1 : -1;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: 1,
          background: color,
          opacity: 0.55 * v,
          transform: `scaleX(${v})`,
          transformOrigin: "left center",
        }}
      />
      <div
        style={{ position: "absolute", left: x, top: y - (down ? 0 : 7), width: 1, height: 7, background: color, opacity: 0.55 * v }}
      />
      <div
        style={{ position: "absolute", left: x + w, top: y - (down ? 0 : 7), width: 1, height: 7, background: color, opacity: 0.55 * v }}
      />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y + dir * 12 - (down ? 0 : 26),
          width: w,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: size,
          letterSpacing: 1.2,
          color,
          opacity: v * 0.9,
        }}
      >
        {label}
      </div>
    </>
  );
};

/** 一行"16 位分组"：等宽十六进制 + 含义 */
export const GRow: React.FC<{
  x: number;
  y: number;
  hex: string;
  mean: string;
  color?: string;
  delay?: number;
  w?: number;
  lead?: boolean;
}> = ({ x, y, hex, mean, color = T.ink2, delay = 0, w = 520, lead = true }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        display: "flex",
        alignItems: "baseline",
        gap: 24,
        opacity: v,
        transform: `translateX(${(1 - v) * 10}px)`,
      }}
    >
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 22,
          color,
          border: `1px solid ${color}44`,
          borderRadius: 4,
          padding: "2px 8px",
          minWidth: 74,
          textAlign: "center",
        }}
      >
        {hex}
      </span>
      <span style={{ fontFamily: F.cn, fontSize: 19, color: T.sub, letterSpacing: 0.4 }}>{mean}</span>
      {lead ? <span style={{ flex: 1, height: 1, background: T.line, opacity: 0.4 }} /> : null}
    </div>
  );
};

/** 一个带边框的小结论块 */
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
  color?: string;
  delay?: number;
  dashed?: boolean;
  fill?: boolean;
  pad?: number;
}> = ({ x, y, w, h, children, color = T.line, delay = 0, dashed = false, fill = false, pad = 22 }) => {
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
        borderRadius: 10,
        border: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
        background: fill ? `${color}14` : "transparent",
        padding: pad,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: v,
        transform: `scaleY(${0.9 + 0.1 * v})`,
      }}
    >
      {children}
    </div>
  );
};
