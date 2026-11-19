import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { p } from "../shared/b3b/ui";

// ==========================================================================
// 这一期专用的零件。跨期共用件在 src/shared/b3b/，这里只放《CPU 的结构》用得到的东西。
//
// 全片的核心符号是 Bus —— 一条内总线。
// 颜色语义贯穿 14 场，不许改动（尽量延续上一期，观众有记忆）：
//   BUS  灰白  内总线：数据走的路
//   REG  蓝    寄存器 / 时序元件
//   MEM  橙    内存 / 段
//   FLAG 黄    标志位
//   PC   绿    程序计数器 / CS:IP
//   CTRL 紫    控制器 / 控制信号
//   COMB 青    组合逻辑元件（会忘的）
// ==========================================================================

export const C = {
  bus: T.ink2,
  reg: T.blue,
  mem: T.orange,
  flag: T.yellow,
  pc: T.green,
  ctrl: T.purple,
  comb: T.teal,
  key: T.red,
} as const;

// ==================== 标题、标签 ====================

export const Head: React.FC<{
  x: number;
  y: number;
  text: string;
  color?: string;
  delay?: number;
  size?: number;
}> = ({ x, y, text, color = T.faint, delay = 0, size = 18 }) => {
  const frame = useCurrentFrame();
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
        letterSpacing: 2.4,
        color,
        opacity: p(frame, delay, 14),
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 22, height: 1, background: color, opacity: 0.85, display: "inline-block" }} />
      <span>{text}</span>
    </div>
  );
};

/** 段首大字（中英双行） */
export const Title: React.FC<{
  x: number;
  y: number;
  zh: string;
  en?: string;
  color?: string;
  delay?: number;
  size?: number;
}> = ({ x, y, zh, en, color = T.ink, delay = 0, size = 34 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: v, transform: `translateY(${(1 - v) * 10}px)` }}>
      {en ? (
        <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 3.2, color: T.faint, marginBottom: 6, whiteSpace: "nowrap" }}>{en}</div>
      ) : null}
      <div style={{ fontFamily: F.cn, fontSize: size, color, letterSpacing: 1.4, fontWeight: 500 }}>{zh}</div>
    </div>
  );
};

/** 行末小注（右对齐到某个 x） */
export const Note: React.FC<{
  x: number;
  y: number;
  text: string;
  color?: string;
  delay?: number;
  size?: number;
  align?: "left" | "right" | "center";
  w?: number;
}> = ({ x, y, text, color = T.sub, delay = 0, size = 17, align = "left", w }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: align,
        fontFamily: F.cn,
        fontSize: size,
        color,
        letterSpacing: 0.5,
        lineHeight: 1.45,
        opacity: p(frame, delay, 14),
      }}
    >
      {text}
    </div>
  );
};

// ==================== 总线 ====================

/**
 * 内总线：一条粗横线 + 若干竖直分叉。
 * 全片最核心的符号 —— 所有"为什么长这样"都回到这条线的物理约束。
 */
export const Bus: React.FC<{
  x: number;
  y: number;
  w: number;
  delay?: number;
  color?: string;
  /** 分叉点（0..1 的比例） */
  drops?: number[];
  /** 分叉方向：-1 朝上，1 朝下 */
  dir?: -1 | 1;
  dropLen?: number;
  thick?: number;
  label?: string;
  labelColor?: string;
  /** 高亮其中一段（比例区间），用于"这一刻总线在传谁" */
  hot?: [number, number];
  hotColor?: string;
}> = ({
  x,
  y,
  w,
  delay = 0,
  color = C.bus,
  drops = [],
  dir = 1,
  dropLen = 30,
  thick = 5,
  label,
  labelColor,
  hot,
  hotColor = T.blue,
}) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 26);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w * v,
          height: thick,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${color}55, ${color}, ${color}55)`,
          opacity: 0.9,
        }}
      />
      {hot ? (
        <div
          style={{
            position: "absolute",
            left: x + w * hot[0],
            top: y - 3,
            width: w * (hot[1] - hot[0]),
            height: thick + 6,
            borderRadius: 4,
            background: `${hotColor}AA`,
            boxShadow: `0 0 26px ${hotColor}88`,
            opacity: p(frame, delay + 4, 16),
          }}
        />
      ) : null}
      {drops.map((t, i) => {
        const dv = p(frame, delay + 10 + i * 3, 14);
        const c = hot && t >= hot[0] && t <= hot[1] ? hotColor : color;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + w * t - 1,
              top: dir < 0 ? y - dropLen * dv : y + thick,
              width: 2,
              height: dropLen * dv,
              background: `${c}99`,
            }}
          />
        );
      })}
      {label ? (
        <div
          style={{
            position: "absolute",
            left: x + w - 6,
            top: y - 34,
            fontFamily: F.mono,
            fontSize: 15,
            letterSpacing: 2.6,
            color: labelColor ?? color,
            opacity: p(frame, delay + 8, 14) * 0.9,
            textAlign: "right",
            width: 220,
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
};

// ==================== 元件框 ====================

/** 时钟小图标（方波）。有时序元件才配它。 */
export const ClkIcon: React.FC<{ x: number; y: number; delay?: number; color?: string; scale?: number }> = ({
  x,
  y,
  delay = 0,
  color = T.yellow,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg
      style={{ position: "absolute", left: x, top: y, opacity: p(frame, delay, 16) }}
      width={40 * scale}
      height={16 * scale}
      viewBox="0 0 40 16"
    >
      <path
        d="M0 14 H6 V2 H14 V14 H22 V2 H30 V14 H38"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="miter"
      />
    </svg>
  );
};

/** 元件框：组合元件（青）/ 时序元件（黄，带时钟小图标） */
export const Elem: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  color?: string;
  delay?: number;
  clk?: boolean;
  /** 虚线：还没讲到的、或"被省略的部件" */
  dashed?: boolean;
  fill?: boolean;
  size?: number;
  subSize?: number;
  dim?: number;
  /** 右上角角标，如 "P1" */
  corner?: string;
}> = ({
  x,
  y,
  w,
  h,
  title,
  sub,
  color = T.ink2,
  delay = 0,
  clk = false,
  dashed = false,
  fill = false,
  size = 24,
  subSize = 14,
  dim = 0,
  corner,
}) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 9,
          border: `${dashed ? 1.5 : 1.5}px ${dashed ? "dashed" : "solid"} ${color}${dim ? "55" : "CC"}`,
          background: fill ? `${color}18` : "rgba(255,255,255,0.018)",
          opacity: v * (1 - dim * 0.55),
          transform: `scaleY(${0.9 + 0.1 * v})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: size, color, letterSpacing: 1 }}>{title}</div>
        {sub ? (
          <div style={{ fontFamily: F.cn, fontSize: subSize, color: T.sub, letterSpacing: 0.4 }}>{sub}</div>
        ) : null}
      </div>
      {clk ? <ClkIcon x={x + w - 46} y={y + 10} delay={delay + 8} color={T.yellow} /> : null}
      {corner ? (
        <div
          style={{
            position: "absolute",
            left: x + 10,
            top: y - 9,
            padding: "0 6px",
            fontFamily: F.mono,
            fontSize: 12,
            color,
            background: T.bg,
            opacity: v * 0.9,
          }}
        >
          {corner}
        </div>
      ) : null}
    </>
  );
};

// ==================== 组合逻辑三件套 ====================

/**
 * 多路选择器：等距梯形，左边 n 路输入，右边一路输出，下方一根 Select。
 * active 指定当前被选中的输入下标，那根线会亮。
 */
export const Mux: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  ins?: number;
  active?: number;
  delay?: number;
  color?: string;
  labels?: string[];
}> = ({ x, y, w = 108, h = 160, ins = 2, active = 0, delay = 0, color = C.comb, labels }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  const lead = 54;
  const step = h / ins;
  return (
    <>
      <svg style={{ position: "absolute", left: x - lead, top: y - 26, overflow: "visible" }} width={w + lead + 90} height={h + 90}>
        <polygon
          points={`0,0 ${w},${h * 0.26} ${w},${h * 0.74} 0,${h}`}
          transform={`translate(${lead} ${26})`}
          fill={`${color}14`}
          stroke={color}
          strokeWidth={1.6}
          opacity={v}
        />
        {Array.from({ length: ins }).map((_, i) => {
          const iy = 26 + step * i + step / 2;
          const on = i === active;
          return (
            <line
              key={i}
              x1={0}
              y1={iy}
              x2={lead}
              y2={iy}
              stroke={on ? color : `${color}66`}
              strokeWidth={on ? 2.4 : 1.4}
              opacity={p(frame, delay + 6 + i * 4, 12)}
            />
          );
        })}
        <line x1={lead + w} y1={26 + h / 2} x2={lead + w + 74} y2={26 + h / 2} stroke={color} strokeWidth={2} opacity={p(frame, delay + 12, 12)} />
        <line x1={lead + w * 0.62} y1={26 + h} x2={lead + w * 0.62} y2={26 + h + 40} stroke={C.ctrl} strokeWidth={1.6} opacity={p(frame, delay + 16, 12)} />
        <text x={lead + w * 0.62 + 8} y={26 + h + 38} fill={C.ctrl} fontSize={14} fontFamily={F.mono} opacity={p(frame, delay + 20, 12)}>
          SEL
        </text>
      </svg>
      {labels?.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - lead - 8,
            top: y - 26 + step * i + step / 2 - 26,
            transform: "translateX(-100%)",
            fontFamily: F.mono,
            fontSize: 15,
            color: i === active ? color : T.faint,
            opacity: p(frame, delay + 6 + i * 4, 12),
            whiteSpace: "nowrap",
            textAlign: "right",
          }}
        >
          {l}
        </div>
      ))}
    </>
  );
};

/** 译码器：左边 n 位输入，右边 2^n 根输出，只有一根被拉高 */
export const Decode: React.FC<{
  x: number;
  y: number;
  bits?: number;
  delay?: number;
  color?: string;
  active?: number;
  w?: number;
}> = ({ x, y, bits = 2, delay = 0, color = C.comb, active = 1, w = 120 }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  const outs = 2 ** bits;
  const h = 54 + outs * 34;
  const inLead = 60;
  const outLead = 110;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 8,
          border: `1.5px solid ${color}`,
          background: `${color}14`,
          opacity: v,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 22,
          color,
        }}
      >
        DEC
      </div>
      {Array.from({ length: bits }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - inLead,
            top: y + 22 + i * 34,
            width: inLead,
            height: 1.5,
            background: `${color}88`,
            opacity: p(frame, delay + 6 + i * 3, 12),
          }}
        />
      ))}
      {Array.from({ length: outs }).map((_, i) => {
        const on = i === active;
        const oy = y + 30 + i * 34;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x + w,
                top: oy,
                width: outLead,
                height: on ? 2.4 : 1.2,
                background: on ? color : `${color}55`,
                opacity: p(frame, delay + 12 + i * 3, 12),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x + w + outLead + 8,
                top: oy - 11,
                fontFamily: F.mono,
                fontSize: 15,
                color: on ? color : T.faint,
                opacity: p(frame, delay + 12 + i * 3, 12),
                whiteSpace: "nowrap",
              }}
            >
              Y{i}
            </div>
            {on ? (
              <div
                style={{
                  position: "absolute",
                  left: x + w + outLead + 2,
                  top: oy - 5,
                  width: 9,
                  height: 9,
                  borderRadius: 9,
                  background: color,
                  boxShadow: `0 0 14px ${color}`,
                  opacity: p(frame, delay + 18, 12),
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 三态门：三角形闸门 + 顶部 EN 控制线 */
export const TriGate: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  open?: boolean;
  delay?: number;
  color?: string;
}> = ({ x, y, w = 62, h = 56, open = true, delay = 0, color = C.comb }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 18);
  const c = open ? color : T.faint;
  return (
    <>
      <svg style={{ position: "absolute", left: x - 46, top: y - 40, overflow: "visible" }} width={w + 130} height={h + 80}>
        <line x1={0} y1={40 + h / 2} x2={46} y2={40 + h / 2} stroke={`${c}AA`} strokeWidth={1.6} opacity={v} />
        <polygon points={`0,0 ${w},${h / 2} 0,${h}`} transform={`translate(46 ${40})`} fill={`${c}16`} stroke={c} strokeWidth={1.6} opacity={v} />
        <line x1={46 + w} y1={40 + h / 2} x2={46 + w + 76} y2={40 + h / 2} stroke={`${c}AA`} strokeWidth={1.6} opacity={v} />
        {/* EN 控制线插在三角形底边 */}
        <line x1={46} y1={0} x2={46} y2={40 + h / 2} stroke={C.ctrl} strokeWidth={1.6} opacity={p(frame, delay + 10, 12)} />
        <text x={52} y={12} fill={C.ctrl} fontSize={14} fontFamily={F.mono} opacity={p(frame, delay + 14, 12)}>
          EN
        </text>
        {!open ? (
          <line
            x1={46 + w + 12}
            y1={40 + h / 2 - 14}
            x2={46 + w + 30}
            y2={40 + h / 2 + 14}
            stroke={T.red}
            strokeWidth={2.4}
            opacity={p(frame, delay + 18, 12)}
          />
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          left: x + w + 66,
          top: y + h / 2 - 30,
          fontFamily: F.cn,
          fontSize: 15,
          color: open ? color : T.red,
          opacity: p(frame, delay + 18, 14),
          whiteSpace: "nowrap",
        }}
      >
        {open ? "通" : "高阻 · 断开"}
      </div>
    </>
  );
};

// ==================== 寄存器 / 内存 ====================

/** 四个通用寄存器：名字 + 默认职业 */
export const RegBank: React.FC<{
  x: number;
  y: number;
  delay?: number;
  active?: number;
  cw?: number;
  ch?: number;
}> = ({ x, y, delay = 0, active = -1, cw = 136, ch = 74 }) => {
  const frame = useCurrentFrame();
  const regs = [
    { n: "AX", zh: "累加" },
    { n: "BX", zh: "基址" },
    { n: "CX", zh: "计数" },
    { n: "DX", zh: "数据" },
  ];
  return (
    <>
      {regs.map((r, i) => {
        const on = i === active;
        const v = p(frame, delay + i * 5, 14);
        return (
          <div
            key={r.n}
            style={{
              position: "absolute",
              left: x + i * (cw + 6),
              top: y,
              width: cw,
              height: ch,
              borderRadius: 8,
              border: `1.5px solid ${on ? C.reg : `${C.reg}77`}`,
              background: on ? `${C.reg}22` : "rgba(255,255,255,0.016)",
              opacity: v,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 25, color: C.reg, letterSpacing: 1 }}>{r.n}</span>
            <span style={{ fontFamily: F.cn, fontSize: 14, color: T.sub }}>{r.zh}</span>
          </div>
        );
      })}
    </>
  );
};

/** 段式内存：竖排四段，左侧挂段寄存器 */
export const SegMem: React.FC<{
  x: number;
  y: number;
  delay?: number;
  active?: string;
  w?: number;
  gap?: number;
  h?: number;
}> = ({ x, y, delay = 0, active, w = 250, gap = 10, h = 76 }) => {
  const frame = useCurrentFrame();
  const segs = [
    { s: "CS", zh: "代码段" },
    { s: "DS", zh: "数据段" },
    { s: "SS", zh: "栈段" },
    { s: "ES", zh: "附加段" },
  ];
  return (
    <>
      {segs.map((g, i) => {
        const on = active === g.s;
        const v = p(frame, delay + i * 5, 14);
        return (
          <React.Fragment key={g.s}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y + i * (h + gap),
                width: w,
                height: h,
                borderRadius: 8,
                border: `1.5px solid ${on ? C.mem : `${C.mem}66`}`,
                background: on ? `${C.mem}1E` : "rgba(255,255,255,0.014)",
                opacity: v,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.cn,
                fontSize: 20,
                color: on ? C.mem : `${C.mem}CC`,
                letterSpacing: 2,
              }}
            >
              {g.zh}
            </div>
            <div
              style={{
                position: "absolute",
                left: x - 16,
                top: y + i * (h + gap) + h / 2 - 16,
                transform: "translateX(-100%)",
                fontFamily: F.mono,
                fontSize: 22,
                color: on ? C.reg : `${C.reg}AA`,
                opacity: v,
                textAlign: "right",
              }}
            >
              {g.s}
            </div>
            <div
              style={{
                position: "absolute",
                left: x + w + 14,
                top: y + i * (h + gap) + h / 2 - 11,
                fontFamily: F.mono,
                fontSize: 15,
                color: T.faint,
                opacity: v * 0.9,
              }}
            >
              0x{["1000", "2000", "3000", "4000"][i]}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 栈帧堆叠：三层函数栈 + 右侧 BP/SP */
export const StackFrames: React.FC<{
  x: number;
  y: number;
  delay?: number;
  w?: number;
}> = ({ x, y, delay = 0, w = 300 }) => {
  const frame = useCurrentFrame();
  const frames = [
    { n: "main", rows: 2 },
    { n: "f()", rows: 2 },
    { n: "g()", rows: 2 },
  ];
  const rowH = 34;
  let acc = 0;
  const geoms = frames.map((f) => {
    const g = { ...f, top: acc, h: f.rows * rowH };
    acc += g.h + 6;
    return g;
  });
  return (
    <>
      {geoms.map((g, i) => {
        const v = p(frame, delay + i * 8, 16);
        const last = i === geoms.length - 1;
        return (
          <React.Fragment key={g.n}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y + g.top,
                width: w,
                height: g.h,
                borderRadius: 6,
                border: `1.5px solid ${last ? C.mem : `${C.mem}55`}`,
                background: last ? `${C.mem}1C` : "rgba(255,255,255,0.012)",
                opacity: v,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize: 17,
                color: last ? C.mem : `${C.mem}99`,
                letterSpacing: 1.6,
              }}
            >
              {g.n} 栈帧
            </div>
            {last ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: x + w + 26,
                    top: y + g.top + 4,
                    fontFamily: F.mono,
                    fontSize: 19,
                    color: C.pc,
                    opacity: p(frame, delay + 26, 14),
                  }}
                >
                  BP →
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: x + w + 26,
                    top: y + g.top + g.h - 24,
                    fontFamily: F.mono,
                    fontSize: 19,
                    color: C.flag,
                    opacity: p(frame, delay + 32, 14),
                  }}
                >
                  SP →
                </div>
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ==================== 标志位 ====================

/**
 * 16 位标志寄存器（8086）。
 * 真正有含义的 9 位：条件 OF SF ZF AF PF CF（黄）、控制 TF IF DF（紫）。
 * 其余 7 位在图上压暗，正好对上旁白里的"十六位里只有九位有用"。
 */
export const Flags16: React.FC<{
  x: number;
  y: number;
  delay?: number;
  cw?: number;
  ch?: number;
  /** 只亮其中几位（按名字） */
  focus?: string[];
}> = ({ x, y, delay = 0, cw = 78, ch = 76, focus }) => {
  const frame = useCurrentFrame();
  // index 0 = bit15 ... index 15 = bit0
  const bits = ["", "", "", "", "OF", "DF", "IF", "TF", "SF", "ZF", "", "AF", "", "PF", "", "CF"];
  const cond = ["OF", "SF", "ZF", "AF", "PF", "CF"];
  return (
    <>
      {bits.map((b, i) => {
        const bitNo = 15 - i;
        const isCtrl = ["TF", "IF", "DF"].indexOf(b) >= 0;
        const isCond = cond.indexOf(b) >= 0;
        const c = isCtrl ? C.ctrl : C.flag;
        const lit = !!b && (!focus || focus.indexOf(b) >= 0);
        const v = p(frame, delay + i * 2.4, 12);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x + i * (cw + 5),
                top: y,
                width: cw,
                height: ch,
                borderRadius: 6,
                border: `1.2px solid ${lit ? c : T.line}`,
                background: lit ? `${c}${isCtrl ? "1A" : "16"}` : "transparent",
                opacity: v * (lit ? 1 : 0.55),
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 19, color: lit ? c : T.faint }}>{b || "—"}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.faint }}>{bitNo}</span>
            </div>
            {isCtrl || isCond ? (
              <div
                style={{
                  position: "absolute",
                  left: x + i * (cw + 5),
                  top: y + ch + 8,
                  width: cw,
                  textAlign: "center",
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: 0.6,
                  color: lit ? `${c}AA` : T.faint,
                  opacity: v,
                }}
              >
                {isCtrl ? "ctrl" : "cond"}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 8 位加法竖式：演示 CF 与 OF 是同一组比特的两种解释 */
export const Add8: React.FC<{
  x: number;
  y: number;
  delay?: number;
  a?: string;
  b?: string;
  sum?: string;
  cf?: string;
  of?: string;
}> = ({ x, y, delay = 0, a = "01111111", b = "+ 00000001", sum = "10000000", cf = "0", of = "1" }) => {
  const frame = useCurrentFrame();
  const rows = [
    { t: a, c: T.ink2, note: "+127" },
    { t: b, c: T.ink2, note: "+1" },
    { t: sum, c: T.red, note: "−128" },
  ];
  return (
    <>
      {rows.map((r, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              position: "absolute",
              left: x,
              top: y + i * 46,
              fontFamily: F.mono,
              fontSize: 30,
              letterSpacing: 5,
              color: r.c,
              opacity: p(frame, delay + i * 8, 14),
            }}
          >
            {r.t}
          </div>
          <div
            style={{
              position: "absolute",
              left: x + 330,
              top: y + i * 46 + 8,
              fontFamily: F.mono,
              fontSize: 16,
              color: T.faint,
              opacity: p(frame, delay + i * 8 + 2, 14),
            }}
          >
            {r.note}
          </div>
        </React.Fragment>
      ))}
      <div style={{ position: "absolute", left: x, top: y + 46 * 2, width: 322, height: 1.5, background: T.line, opacity: p(frame, delay + 16, 12) }} />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y + 152,
          display: "flex",
          gap: 26,
          fontFamily: F.mono,
          fontSize: 21,
          opacity: p(frame, delay + 26, 14),
        }}
      >
        <span style={{ color: T.faint }}>CF=</span>
        <span style={{ color: C.flag, fontSize: 26 }}>{cf}</span>
        <span style={{ color: T.faint, marginLeft: 26 }}>OF=</span>
        <span style={{ color: C.key, fontSize: 26 }}>{of}</span>
      </div>
    </>
  );
};

// ==================== 芯片与引脚 ====================

/** 8086 俯视图：左右各一排引脚，可以高亮某一组 */
export const ChipPins: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  delay?: number;
  /** 高亮第几根引脚（0..19），以及颜色 */
  hot?: number[];
  hotColor?: string;
  label?: string;
}> = ({ x, y, w = 300, h = 340, delay = 0, hot = [], hotColor = C.bus, label = "8086" }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 20);
  const n = 20;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 10,
          border: `1.5px solid ${T.line}`,
          background: "rgba(255,255,255,0.022)",
          opacity: v,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: h / 2 - 26,
            textAlign: "center",
            fontFamily: F.mono,
            fontSize: 28,
            letterSpacing: 4,
            color: T.ink2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: h / 2 + 8,
            textAlign: "center",
            fontFamily: F.mono,
            fontSize: 14,
            letterSpacing: 2,
            color: T.faint,
          }}
        >
          16-BIT · 40 PIN
        </div>
      </div>
      {Array.from({ length: n }).map((_, i) => {
        const on = hot.indexOf(i) >= 0;
        const step = (h - 40) / (n - 1);
        const py = y + 20 + i * step;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x - 22,
                top: py,
                width: 22,
                height: 2,
                background: on ? hotColor : `${T.faint}88`,
                opacity: p(frame, delay + 4 + i * 1.6, 10) * (on ? 1 : 0.8),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x + w,
                top: py,
                width: 22,
                height: 2,
                background: on ? hotColor : `${T.faint}88`,
                opacity: p(frame, delay + 4 + i * 1.6, 10) * (on ? 1 : 0.8),
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

// ==================== 时序节拍 ====================

/**
 * 三拍时序：横向三大列，每列说"这一刻总线上是谁"。
 * 讲暂存器 T 的存在理由时用 —— 画面本身就是那条约束的证明。
 */
export const Beats: React.FC<{
  x: number;
  y: number;
  delay?: number;
  cols?: { t: string; bus: string; reg: string; c: string }[];
  w?: number;
  h?: number;
}> = ({
  x,
  y,
  delay = 0,
  w = 420,
  h = 150,
  cols = [
    { t: "T1", bus: "操作数 1", reg: "T ← 操作数1", c: T.blue },
    { t: "T2", bus: "操作数 2", reg: "T 保持", c: T.teal },
    { t: "T3", bus: "（空闲）", reg: "ALU ← T + 操作数2", c: T.yellow },
  ],
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {cols.map((c, i) => {
        const v = p(frame, delay + i * 10, 16);
        return (
          <React.Fragment key={c.t}>
            <div
              style={{
                position: "absolute",
                left: x + i * (w + 12),
                top: y,
                width: w,
                height: h,
                borderRadius: 10,
                border: `1.5px solid ${c.c}88`,
                background: `${c.c}12`,
                opacity: v,
                transform: `translateY(${(1 - v) * 12}px)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x + i * (w + 12) + 18,
                top: y + 14,
                fontFamily: F.mono,
                fontSize: 17,
                letterSpacing: 2,
                color: c.c,
                opacity: v,
              }}
            >
              {c.t}
            </div>
            <div
              style={{
                position: "absolute",
                left: x + i * (w + 12) + 18,
                top: y + 52,
                fontFamily: F.cn,
                fontSize: 17,
                color: T.faint,
                opacity: v,
              }}
            >
              总线
            </div>
            <div
              style={{
                position: "absolute",
                left: x + i * (w + 12) + 78,
                top: y + 50,
                fontFamily: F.mono,
                fontSize: 19,
                color: T.ink2,
                opacity: v,
              }}
            >
              {c.bus}
            </div>
            <div
              style={{
                position: "absolute",
                left: x + i * (w + 12) + 18,
                top: y + 96,
                fontFamily: F.cn,
                fontSize: 17,
                color: T.faint,
                opacity: v,
              }}
            >
              暂存器
            </div>
            <div
              style={{
                position: "absolute",
                left: x + i * (w + 12) + 78,
                top: y + 94,
                fontFamily: F.mono,
                fontSize: 18,
                color: c.c,
                opacity: v,
              }}
            >
              {c.reg}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 一行键值：左边名字（可着色），右边说明 */
export const Kv: React.FC<{
  x: number;
  y: number;
  k: string;
  v: string;
  color?: string;
  delay?: number;
  kw?: number;
  size?: number;
}> = ({ x, y, k, v, color = T.ink2, delay = 0, kw = 150, size = 19 }) => {
  const frame = useCurrentFrame();
  const vv = p(frame, delay, 14);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: kw,
          fontFamily: F.mono,
          fontSize: size,
          color,
          opacity: vv,
          letterSpacing: 0.6,
          whiteSpace: "nowrap",
        }}
      >
        {k}
      </div>
      <div
        style={{
          position: "absolute",
          left: x + kw,
          top: y + 1,
          fontFamily: F.cn,
          fontSize: size - 2,
          color: T.sub,
          opacity: vv,
          whiteSpace: "nowrap",
        }}
      >
        {v}
      </div>
    </>
  );
};
