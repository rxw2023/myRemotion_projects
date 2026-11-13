import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Bits, Cells, Fade, Frame, Rule, Stage, Subs, Table, Write, p, useCues } from "../shared/b3b/ui";
import type { Cell } from "../shared/b3b/ui";

// ==========================================================================
// s00 · 有的地址能放，有的不能
// ==========================================================================
export const S00: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s00");

  const N = 8;
  const CW = 118;
  const GAP = 8;
  const CH = 108;
  const X0 = (1920 - (N * CW + (N - 1) * GAP)) / 2;
  const Y = 452;
  const step = CW + GAP;

  const redV = p(f, at(1), 16);
  const redOut = 1 - p(f, at(2), 18) * 0.75;
  const greenV = p(f, at(2) + 6, 16);
  // 判词不能跟着色块一起淡——色块退场后，"0x1001 放不下" 这个结论还得留在画面上
  const redLabel = redV * (0.62 + 0.38 * redOut);

  const empty: Cell[] = Array.from({ length: N }).map(() => ({}));
  const ticks = Array.from({ length: N }).map((_, i) => `0x100${i}`);

  const redCx = X0 + step + (4 * step - GAP) / 2;
  const greenCx = X0 + 4 * step + (4 * step - GAP) / 2;

  return (
    <Stage label="第 1 幕 · 为什么要对齐">
      <div style={{ position: "absolute", left: 0, right: 0, top: 196, display: "flex", justifyContent: "center" }}>
        <Write text="同样是一个 int，为什么有的地址能放，有的不能？" delay={at(0)} size={54} weight={500} />
      </div>

      <Cells x={X0} y={Y} cells={empty} cw={CW} ch={CH} gap={GAP} ticks={ticks} delay={at(0) + 10} size={24} tickSize={19} />

      {/* 错误位置：0x1001 起 4 格 */}
      <div
        style={{
          position: "absolute",
          left: X0 + step,
          top: Y,
          width: 4 * step - GAP,
          height: CH,
          borderRadius: 8,
          border: `1.5px solid ${T.red}`,
          background: T.redDim,
          opacity: redV * redOut,
        }}
      />
      {/* 文字独立于块的淡出，否则退场时连字一起糊掉 */}
      <div
        style={{
          position: "absolute",
          left: X0 + step,
          top: Y,
          width: 4 * step - GAP,
          height: CH,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingLeft: 30,
          fontFamily: F.mono,
          fontSize: 27,
          color: T.ink,
          gap: 14,
          opacity: redV * (0.5 + 0.5 * redOut),
        }}
      >
        int · 4B
        <span style={{ fontSize: 23, color: T.red }}>✗</span>
      </div>

      {/* 正确位置：0x1004 起 4 格 */}
      <div
        style={{
          position: "absolute",
          left: X0 + 4 * step,
          top: Y,
          width: 4 * step - GAP,
          height: CH,
          borderRadius: 8,
          border: `1.5px solid ${T.green}`,
          background: T.greenDim,
          opacity: greenV,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingLeft: 30,
          fontFamily: F.mono,
          fontSize: 27,
          color: T.ink,
          gap: 14,
        }}
      >
        int · 4B
        <span style={{ fontSize: 23, color: T.green }}>✓</span>
      </div>

      {/* 两条判词，各自对齐到色块中心 */}
      <div style={{ position: "absolute", left: redCx - 150, top: 616, width: 300, textAlign: "center", opacity: redLabel }}>
        <span style={{ fontFamily: F.mono, fontSize: 27, color: T.red }}>0x1001 % 4 = 1 ✗</span>
      </div>
      <div style={{ position: "absolute", left: greenCx - 150, top: 616, width: 300, textAlign: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 27, color: T.green, opacity: greenV }}>0x1004 % 4 = 0 ✓</span>
      </div>

      <Rule w={560} color={T.line} delay={at(3)} style={{ position: "absolute", left: 680, top: 726 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 754, display: "flex", justifyContent: "center" }}>
        <Write text="数据在内存里，为什么要对齐" delay={at(3) + 10} size={40} color={T.ink2} spacing={2} />
      </div>

      <Subs sceneId="s00" />
    </Stage>
  );
};

// ==========================================================================
// s01 · 对齐因子的定义
// ==========================================================================
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s01");

  const BW = 34;
  const BGAP = 4;
  const BX = 240;
  const BITS_W = 16 * BW + 15 * BGAP;
  const bitsY1 = 588;
  const bitsY2 = 700;
  const TX = BX + BITS_W + 56;

  return (
    <Stage label="01 / 对齐因子">
      <div style={{ position: "absolute", left: 128, top: 150 }}>
        <Write text="data alignment" delay={at(0)} size={24} color={T.faint} mono spacing={3} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 200, width: 1664 }}>
        <Write text="数据的起始地址，必须是某个数的整数倍" delay={at(1)} size={44} weight={500} />
      </div>

      {/* 公式 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 300,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 22,
          opacity: p(f, at(3), 22),
        }}
      >
        <span style={{ fontFamily: F.serif, fontSize: 96, color: T.ink }}>addr</span>
        <span style={{ fontFamily: F.serif, fontSize: 88, color: T.sub }}>%</span>
        <span style={{ fontFamily: F.serif, fontSize: 96, color: T.green, textShadow: `0 0 40px ${T.green}55` }}>K</span>
        <span style={{ fontFamily: F.serif, fontSize: 88, color: T.sub }}>=</span>
        <span style={{ fontFamily: F.serif, fontSize: 96, color: T.ink }}>0</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 428, display: "flex", justifyContent: "center" }}>
        <Write text="K 就叫对齐因子 · alignment factor" delay={at(2) + 6} size={26} color={T.sub} spacing={1} />
      </div>

      {/* 二进制视角 */}
      <div style={{ position: "absolute", left: 128, top: 512 }}>
        <Write text="换成二进制：地址的低几位必须全为零" delay={at(4)} size={26} color={T.faint} spacing={1.5} />
      </div>

      <div style={{ position: "absolute", left: BX, top: bitsY1 - 32, width: BITS_W, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.mono, fontSize: 16, color: T.faint, letterSpacing: 1 }}>BIT 15</span>
        <span style={{ fontFamily: F.mono, fontSize: 16, color: T.faint, letterSpacing: 1 }}>BIT 0</span>
      </div>

      <Bits
        bits="0001000000000100"
        x={BX}
        y={bitsY1}
        cw={BW}
        ch={46}
        gap={BGAP}
        delay={at(4) + 8}
        paint={{ 14: T.green, 15: T.green }}
      />
      <div style={{ position: "absolute", left: TX, top: bitsY1 - 6, width: 620 }}>
        <Write text="0x1004 低 2 位是 00" delay={at(4) + 14} size={26} color={T.green} mono />
        <Write text="能被 4 整除" delay={at(4) + 22} size={21} color={T.sub} style={{ marginTop: 4 }} />
      </div>

      <Bits
        bits="0001000000000101"
        x={BX}
        y={bitsY2}
        cw={BW}
        ch={46}
        gap={BGAP}
        delay={at(5) + 4}
        paint={{ 14: T.red, 15: T.red }}
      />
      <div style={{ position: "absolute", left: TX, top: bitsY2 - 6, width: 620 }}>
        <Write text="0x1005 低 2 位是 01" delay={at(5) + 10} size={26} color={T.red} mono />
        <Write text="不能被 4 整除" delay={at(5) + 18} size={21} color={T.sub} style={{ marginTop: 4 }} />
      </div>

      <Subs sceneId="s01" />
    </Stage>
  );
};

// ==========================================================================
// s02 · 各类型的对齐因子
// ==========================================================================
const TYPES = [
  { t: "char", s: "1", a: "1", req: "任意地址" },
  { t: "short", s: "2", a: "2", req: "2 的倍数" },
  { t: "int", s: "4", a: "4", req: "4 的倍数" },
  { t: "float", s: "4", a: "4", req: "4 的倍数" },
  { t: "double", s: "8", a: "8", req: "8 的倍数" },
  { t: "long long", s: "8", a: "8", req: "8 的倍数" },
  { t: "指针（64 位）", s: "8", a: "8", req: "8 的倍数" },
];

export const S02: React.FC = () => {
  const { at } = useCues("s02");

  return (
    <Stage label="01 / 对齐因子">
      <div style={{ position: "absolute", left: 128, top: 140 }}>
        <Write text="对齐因子由类型大小决定" delay={at(0)} size={26} color={T.faint} spacing={2} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 186 }}>
        <Write text="规律：对齐因子 = 类型自身字节数" delay={at(1)} size={36} color={T.yellow} weight={500} />
      </div>

      <Table
        x={128}
        y={286}
        cols={[
          { label: "TYPE", w: 300 },
          { label: "SIZE", w: 170, align: "center" },
          { label: "ALIGN", w: 170, align: "center" },
          { label: "ADDRESS MUST BE", w: 420 },
        ]}
        rows={TYPES.map((r, i) => {
          const isNew = i >= 2;
          return {
            cells: [
              <span key="t" style={{ fontFamily: F.mono, color: T.ink }}>
                {r.t}
              </span>,
              <span key="s" style={{ fontFamily: F.mono, color: T.ink2 }}>
                {r.s}
              </span>,
              <span key="a" style={{ fontFamily: F.mono, color: isNew ? T.green : T.ink2, fontSize: 28 }}>
                {r.a}
              </span>,
              <span key="r" style={{ fontFamily: F.cn, color: T.sub, fontSize: 23 }}>
                {r.req}
              </span>,
            ],
            dim: i === 6,
          };
        })}
        delay={at(2)}
        stagger={11}
        rowH={66}
        size={26}
      />

      <div style={{ position: "absolute", left: 1210, top: 300, width: 560 }}>
        <Fade delay={at(6) + 6}>
          <div style={{ fontFamily: F.cn, fontSize: 22, color: T.sub, lineHeight: 1.9 }}>
            <span style={{ color: T.orange }}>上限</span>：对齐因子不会超过硬件的最大对齐限制
          </div>
        </Fade>
      </div>

      <div style={{ position: "absolute", left: 1210, top: 396 }}>
        <Fade delay={at(7)}>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 20,
              color: T.faint,
              lineHeight: 2,
              borderLeft: `2px solid ${T.line}`,
              paddingLeft: 20,
            }}
          >
            <div>_Alignof(char) = 1</div>
            <div>_Alignof(short) = 2</div>
            <div>_Alignof(int) = 4</div>
            <div>_Alignof(double) = 8</div>
            <div>_Alignof(void*) = 8</div>
          </div>
        </Fade>
      </div>

      <Subs sceneId="s02" />
    </Stage>
  );
};

// ==========================================================================
// s03 · 不对齐的代价：两次访存
// ==========================================================================
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s03");

  const N = 16;
  const CW = 62;
  const GAP = 4;
  const CH = 82;
  const X0 = (1920 - (N * CW + (N - 1) * GAP)) / 2;
  const step = CW + GAP;
  const Y1 = 348;
  const Y2 = 612;

  const empty: Cell[] = Array.from({ length: N }).map(() => ({}));

  const inlineText = (txt: string) => <span style={{ color: T.ink }}>{txt}</span>;

  return (
    <Stage label="02 / 不对齐的代价">
      <div style={{ position: "absolute", left: 128, top: 138 }}>
        <Write text="内存不会只给你那几个字节，它一次搬一整个存储字" delay={at(2)} size={30} color={T.ink2} />
      </div>

      {/* 上：跨边界 */}
      <div style={{ position: "absolute", left: X0 - 8, top: Y1 - 34 }}>
        <Write text="double 从偏移 2 开始 · 横跨两个存储字" delay={at(3)} size={22} color={T.red} />
      </div>
      <Cells x={X0} y={Y1} cells={empty} cw={CW} ch={CH} gap={GAP} delay={at(2) + 6} />
      <div
        style={{
          position: "absolute",
          left: X0 + 2 * step,
          top: Y1,
          width: 8 * step - GAP,
          height: CH,
          borderRadius: 8,
          opacity: p(f, at(3) + 6, 16),
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: 8, border: `1.5px solid ${T.red}`, background: T.redDim }} />
        {/* 竖线只画块的上、下两段，中间断开给文字让位——不穿过字也不切出暗带 */}
        <div
          style={{
            position: "absolute",
            left: 6 * step,
            top: -9,
            height: 30,
            width: 2,
            background: T.red,
            boxShadow: `0 0 18px ${T.red}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 6 * step,
            bottom: -9,
            height: 30,
            width: 2,
            background: T.red,
            boxShadow: `0 0 18px ${T.red}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 24,
          }}
        >
          {inlineText("double · 8B")}
        </div>
      </div>
      <Fade delay={at(2) + 4} style={{ position: "absolute", left: X0, top: Y1 - 68 }}>
        <span style={{ fontFamily: F.mono, fontSize: 17, color: T.faint, letterSpacing: 2 }}>存储字 0 ｜ 8 字节</span>
      </Fade>
      <Fade delay={at(2) + 4} style={{ position: "absolute", left: X0 + 8 * step, top: Y1 - 68 }}>
        <span style={{ fontFamily: F.mono, fontSize: 17, color: T.faint, letterSpacing: 2 }}>存储字 1 ｜ 8 字节</span>
      </Fade>

      <div style={{ position: "absolute", left: 1620, top: Y1 + 8, width: 200 }}>
        <Fade delay={at(4)}>
          <span style={{ fontFamily: F.mono, fontSize: 32, color: T.red }}>2 次访存</span>
          <div style={{ fontFamily: F.cn, fontSize: 18, color: T.sub, marginTop: 2 }}>再拼回两个半截</div>
        </Fade>
      </div>

      {/* 下：对齐 */}
      <div style={{ position: "absolute", left: X0 - 8, top: Y2 - 34 }}>
        <Write text="对齐之后 · 完整落在一个存储字里" delay={at(6)} size={22} color={T.green} />
      </div>
      <Cells x={X0} y={Y2} cells={empty} cw={CW} ch={CH} gap={GAP} delay={at(6) + 2} />
      <div
        style={{
          position: "absolute",
          left: X0 + 8 * step,
          top: Y2,
          width: 8 * step - GAP,
          height: CH,
          borderRadius: 8,
          border: `1.5px solid ${T.green}`,
          background: T.greenDim,
          opacity: p(f, at(7) + 4, 16),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 24,
          color: T.ink,
        }}
      >
        double · 8B
      </div>
      <div style={{ position: "absolute", left: 1620, top: Y2 + 8, width: 200 }}>
        <Fade delay={at(7) + 8}>
          <span style={{ fontFamily: F.mono, fontSize: 32, color: T.green }}>1 次访存</span>
          <div style={{ fontFamily: F.cn, fontSize: 18, color: T.sub, marginTop: 2 }}>一次搬完</div>
        </Fade>
      </div>

      <Rule w={1664} color={T.line} delay={at(7) + 14} style={{ position: "absolute", left: 128, top: 806 }} />
      <div style={{ position: "absolute", left: 128, top: 834 }}>
        <Write text="对齐，是为了让一次访存真的一次搬完" delay={at(7) + 20} size={36} color={T.ink2} />
      </div>

      <Subs sceneId="s03" />
    </Stage>
  );
};

// ==========================================================================
// s04 · 硬件为什么非要这样
// ==========================================================================
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s04");

  const BW = 34;
  const BGAP = 4;
  const BX = 200;

  return (
    <Stage label="02 / 不对齐的代价">
      <div style={{ position: "absolute", left: 128, top: 136 }}>
        <Write text="再往下一层：硬件为什么非要这样" delay={at(0)} size={30} color={T.ink2} />
      </div>

      <div style={{ position: "absolute", left: 200, top: 214 }}>
        <Write text="一次访存的地址" delay={at(1)} size={22} color={T.faint} spacing={2} />
      </div>

      <Bits
        bits="0001000000000100"
        x={BX}
        y={262}
        cw={BW}
        ch={48}
        gap={BGAP}
        delay={at(1) + 6}
        paint={{ 14: T.orange, 15: T.orange }}
      />
      {/* 高位 / 低位 色条 */}
      <div
        style={{
          position: "absolute",
          left: BX,
          top: 322,
          width: 14 * (BW + BGAP) - BGAP,
          height: 3,
          background: T.blue,
          opacity: p(f, at(1) + 12, 14),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: BX + 14 * (BW + BGAP),
          top: 322,
          width: 2 * (BW + BGAP) - BGAP,
          height: 3,
          background: T.orange,
          opacity: p(f, at(1) + 12, 14),
        }}
      />
      <Fade delay={at(1) + 14} style={{ position: "absolute", left: BX, top: 340, width: 14 * (BW + BGAP) }}>
        <span style={{ fontFamily: F.cn, fontSize: 21, color: T.blue }}>高位 → 选中哪一行</span>
      </Fade>
      <Fade delay={at(1) + 16} style={{ position: "absolute", left: BX + 14 * (BW + BGAP) - 96, top: 380 }}>
        <span style={{ fontFamily: F.cn, fontSize: 21, color: T.orange, whiteSpace: "nowrap" }}>低位 → 块内偏移</span>
      </Fade>

      {/* 右：行阵列 */}
      <div style={{ position: "absolute", left: 900, top: 200 }}>
        <Fade delay={at(2) + 4}>
          <div style={{ fontFamily: F.mono, fontSize: 18, color: T.faint, letterSpacing: 2 }}>ADDRESS DECODING</div>
        </Fade>
      </div>

      {[0, 1, 2, 3].map((i) => {
        const on = i === 2;
        const v = p(f, at(2) + 10 + i * 6, 14);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 900,
              top: 250 + i * 92,
              width: 760,
              height: 66,
              borderRadius: 8,
              border: `1.5px solid ${on ? T.blue : T.line}`,
              background: on ? T.blueDim : "transparent",
              opacity: v * (on ? 1 : 0.5),
              display: "flex",
              alignItems: "center",
              paddingLeft: 20,
              fontFamily: F.mono,
              fontSize: 20,
              color: on ? T.blue : T.faint,
              letterSpacing: 1,
            }}
          >
            <span>ROW {i}</span>
            <span style={{ marginLeft: 40, opacity: 0.7 }}>8 bytes</span>
            {on ? <span style={{ marginLeft: "auto", marginRight: 20, color: T.orange, fontSize: 18 }}>← 整行取回</span> : null}
          </div>
        );
      })}

      <Arrow from={[BX + 6 * (BW + BGAP), 366]} to={[880, 392]} color={T.blue} delay={at(2) + 4} dashed curve={0.08} />

      <Rule w={1664} color={T.line} delay={at(4) + 10} style={{ position: "absolute", left: 128, top: 700 }} />
      <div style={{ position: "absolute", left: 128, top: 730, width: 1600 }}>
        <Write text="一次访问的起点只能是块大小的整数倍" delay={at(4) + 16} size={34} color={T.ink2} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 796, width: 1600 }}>
        <Write text="对齐是这种读取方式的必然结果，不是后来加的约束" delay={at(5) + 6} size={30} color={T.sub} />
      </div>

      <Subs sceneId="s04" />
    </Stage>
  );
};

// ==========================================================================
// s05 · 结构体登场：5 字节的直觉，8 字节的答案
// ==========================================================================
const CODE = [
  { t: "struct {", c: T.sub },
  { t: "    char  a;", c: T.green },
  { t: "    int   b;", c: T.blue },
  { t: "};", c: T.sub },
];

export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s05");

  const wrong = p(f, at(4), 18);

  return (
    <Stage label="第 2 幕 · 结构体与填充">
      <div style={{ position: "absolute", left: 128, top: 140 }}>
        <Write text="单个变量好办，真正考人的是结构体" delay={at(0)} size={30} color={T.ink2} />
      </div>

      <Frame x={128} y={230} w={620} h={300} color={T.line} delay={at(1)} r={14} />
      {CODE.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 168,
            top: 262 + i * 56,
            fontFamily: F.mono,
            fontSize: 30,
            color: l.c,
            opacity: p(f, at(1) + 6 + i * 6, 14),
          }}
        >
          {l.t}
        </div>
      ))}

      {/* 直觉 5 */}
      <div style={{ position: "absolute", left: 880, top: 236 }}>
        <Write text="按直觉" delay={at(2)} size={22} color={T.faint} spacing={2} />
      </div>
      <div style={{ position: "absolute", left: 880, top: 274, display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ fontFamily: F.mono, fontSize: 50, color: T.ink2, opacity: p(f, at(2) + 6, 16) }}>1 + 4</span>
        <span style={{ fontFamily: F.mono, fontSize: 50, color: T.sub, opacity: p(f, at(2) + 6, 16) }}>=</span>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 50,
            color: T.ink2,
            textDecoration: wrong > 0.5 ? "line-through" : "none",
            textDecorationColor: T.red,
            textDecorationThickness: 3,
            opacity: (wrong > 0.5 ? 0.4 : 1) * p(f, at(2) + 6, 16),
          }}
        >
          5
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 34, color: T.red, opacity: wrong }}>✗</span>
      </div>

      {/* sizeof = 8 */}
      <div style={{ position: "absolute", left: 880, top: 372 }}>
        <Write text="sizeof 打印出来" delay={at(3)} size={22} color={T.faint} spacing={2} />
      </div>
      <div style={{ position: "absolute", left: 880, top: 440, display: "flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontFamily: F.mono, fontSize: 28, color: T.sub, opacity: p(f, at(3) + 6, 14) }}>=</span>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 110,
            lineHeight: 1,
            color: T.yellow,
            opacity: p(f, at(3) + 10, 18),
            textShadow: `0 0 60px ${T.yellow}44`,
          }}
        >
          8
        </span>
      </div>
      <div style={{ position: "absolute", left: 1010, top: 470, width: 420 }}>
        <Fade delay={at(4) + 4}>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: T.sub }}>= 1 + 3 + 4</div>
          <div style={{ fontFamily: F.cn, fontSize: 20, color: T.orange, marginTop: 4 }}>中间 3 个字节是填充</div>
        </Fade>
      </div>

      <Rule w={1664} color={T.line} delay={at(5)} style={{ position: "absolute", left: 128, top: 660 }} />

      <div style={{ position: "absolute", left: 128, top: 696 }}>
        <Write text="多出来的字节叫填充（padding）" delay={at(5) + 8} size={34} color={T.ink} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 762 }}>
        <Write text="它不存数据，只为了让后面的成员站对位置" delay={at(5) + 20} size={30} color={T.sub} />
      </div>

      <Subs sceneId="s05" />
    </Stage>
  );
};
