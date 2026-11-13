import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Chip, Frame, Rule, Stage, Subs, Write, p, useCues } from "../shared/b3b/ui";
import { Head } from "./parts";

// ==========================================================================
// s06 · 一条 x86 指令，五个动作
// ==========================================================================
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s06");
  const OPS = [
    { x: 160, w: 290, t: "ecx", s: "基址" },
    { x: 520, w: 340, t: "edx × 4", s: "比例变址" },
    { x: 930, w: 400, t: "00422000", s: "常数偏移" },
  ];

  return (
    <Stage label="07 / 一条指令干了什么">
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 126,
          fontFamily: F.mono,
          fontSize: 25,
          color: T.ink2,
          opacity: p(f, at(0) + 8, 18),
        }}
      >
        mov dword ptr [ecx + edx*4 + 00422000h], 0Ah
      </div>
      <Head x={160} y={194} text="一条指令 · 五个动作" color={T.faint} delay={at(0) + 16} />

      {OPS.map((o, i) => (
        <div
          key={o.t}
          style={{
            position: "absolute",
            left: o.x,
            top: 240,
            width: o.w,
            height: 104,
            borderRadius: 10,
            border: `1px solid ${[T.teal, T.blue, T.orange][i]}55`,
            background: `${[T.teal, T.blue, T.orange][i]}12`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: p(f, at(1) + i * 10, 18),
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 30, color: [T.teal, T.blue, T.orange][i] }}>{o.t}</span>
          <span style={{ fontFamily: F.cn, fontSize: 18, color: T.sub }}>{o.s}</span>
        </div>
      ))}
      <Arrow from={[462, 292]} to={[512, 292]} color={T.faint} delay={at(1) + 20} dur={14} head={9} />
      <Arrow from={[872, 292]} to={[922, 292]} color={T.faint} delay={at(1) + 30} dur={14} head={9} />

      {/* 有效地址 */}
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 386,
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          opacity: p(f, at(2), 20),
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 26, color: T.sub }}>EA =</span>
        <span style={{ fontFamily: F.mono, fontSize: 34, color: T.orange }}>00422000</span>
        <span style={{ fontFamily: F.mono, fontSize: 26, color: T.sub }}>+</span>
        <span style={{ fontFamily: F.mono, fontSize: 34, color: T.teal }}>40</span>
        <span style={{ fontFamily: F.mono, fontSize: 26, color: T.sub }}>+</span>
        <span style={{ fontFamily: F.mono, fontSize: 34, color: T.blue }}>3 × 4</span>
        <span style={{ fontFamily: F.mono, fontSize: 26, color: T.sub }}>=</span>
        <span style={{ fontFamily: F.mono, fontSize: 38, color: T.yellow, textShadow: `0 0 40px ${T.yellow}44` }}>
          0042204C
        </span>
      </div>

      {/* 写回 */}
      <div
        style={{
          position: "absolute",
          left: 700,
          top: 520,
          fontFamily: F.mono,
          fontSize: 18,
          color: T.sub,
          opacity: p(f, at(3), 16),
        }}
      >
        0x0042204C
      </div>
      <Frame x={700} y={550} w={200} h={92} color={T.orange} delay={at(3) + 4} r={8} />
      <div
        style={{
          position: "absolute",
          left: 700,
          top: 550,
          width: 200,
          height: 92,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 34,
          color: T.orange,
          opacity: p(f, at(3) + 12, 16),
        }}
      >
        0A
      </div>
      <div
        style={{
          position: "absolute",
          left: 520,
          top: 580,
          fontFamily: F.cn,
          fontSize: 20,
          color: T.sub,
          opacity: p(f, at(3) + 18, 16),
        }}
      >
        写入 4 字节
      </div>

      {/* 三次动作 */}
      {["取指 ×1", "译码 ×1", "访存 ×1"].map((t, i) => (
        <Chip key={t} x={160 + i * 200} y={690} text={t} color={T.sub} size={19} delay={at(4) + i * 8} />
      ))}
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 786,
          fontFamily: F.cn,
          fontSize: 30,
          color: T.ink,
          opacity: p(f, at(5), 20),
        }}
      >
        程序短、代码密度高 —— <span style={{ color: T.orange }}>CISC 的长处</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 840,
          fontFamily: F.mono,
          fontSize: 20,
          color: T.faint,
          opacity: p(f, at(5) + 16, 18),
        }}
      >
        1 条指令 · 11 字节 · 一条顶一串
      </div>

      <Subs sceneId="s06" />
    </Stage>
  );
};

// ==========================================================================
// s07 · 同一件事，MIPS 要八条
// ==========================================================================
const MIPS_ROWS: { op: string; args: string; note: string; group: number }[] = [
  { op: "sll", args: "$v1, $v1, 6", note: "i × 64", group: 0 },
  { op: "add", args: "$v1, $v1, $a0", note: "i×64 + j", group: 0 },
  { op: "sll", args: "$v1, $v1, 2", note: "(i×64+j) × 4", group: 0 },
  { op: "lui", args: "$at, 0x0042", note: "基址高 16 位", group: 1 },
  { op: "ori", args: "$v0, $at, 0x2000", note: "补低 16 位", group: 1 },
  { op: "add", args: "$v0, $v1, $v0", note: "偏移 + 基址", group: 2 },
  { op: "li", args: "$a1, 10", note: "常数 10", group: 2 },
  { op: "sw", args: "$a1, 0($v0)", note: "写内存", group: 2 },
];

export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s07");
  const CHAIN = [
    { ex: "i = 1", res: "64", note: "sll 6 · ×64", d: 1 },
    { ex: "+ j = 3", res: "67", note: "add", d: 1 },
    { ex: "× 4", res: "0x10C", note: "sll 2", d: 1 },
    { ex: "+ 0x00422000", res: "0x0042210C", note: "lui + ori + add", d: 3 },
  ];

  return (
    <Stage label="08 / RISC 的代价">
      <Head x={128} y={128} text="MIPS · 同一个 a[i][j] = 10" color={T.blue} delay={at(0)} />

      {MIPS_ROWS.map((r, i) => {
        const d = at(r.group + 1) + (i % 3) * 8;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 128,
              top: 192 + i * 74,
              width: 760,
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              opacity: p(f, d, 16),
              transform: `translateX(${(1 - p(f, d, 16)) * 10}px)`,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 15, color: T.faint, width: 18 }}>{i + 1}</span>
            <span style={{ fontFamily: F.mono, fontSize: 24, color: T.blue, width: 52 }}>{r.op}</span>
            <span style={{ fontFamily: F.mono, fontSize: 24, color: T.ink2, flex: 1 }}>{r.args}</span>
            <span style={{ fontFamily: F.mono, fontSize: 17, color: T.faint }}>{r.note}</span>
          </div>
        );
      })}

      {/* 左侧括号：八条 */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 196,
          width: 3,
          height: 560,
          borderRadius: 2,
          background: `${T.blue}66`,
          transform: `scaleY(${p(f, at(4), 24)})`,
          transformOrigin: "top center",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 440,
          fontFamily: F.mono,
          fontSize: 40,
          color: T.blue,
          opacity: p(f, at(4) + 10, 18),
        }}
      >
        8
      </div>
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 496,
          fontFamily: F.cn,
          fontSize: 18,
          color: T.sub,
          opacity: p(f, at(4) + 14, 18),
        }}
      >
        条
      </div>

      {/* 右侧：值的推演 */}
      <Head x={1000} y={128} text="一步一步算出来" color={T.faint} delay={at(1)} />
      {CHAIN.map((c, i) => {
        const d = at(c.d) + (i % 3) * 20;
        return (
          <React.Fragment key={c.ex}>
            <div
              style={{
                position: "absolute",
                left: 1000,
                top: 190 + i * 130,
                width: 760,
                height: 84,
                borderRadius: 10,
                border: `1px solid ${T.line}`,
                background: "rgba(236,236,236,0.03)",
                opacity: p(f, d, 18),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 1030,
                top: 214 + i * 130,
                fontFamily: F.mono,
                fontSize: 25,
                color: T.sub,
                opacity: p(f, d + 6, 16),
              }}
            >
              {c.ex}
            </div>
            <div
              style={{
                position: "absolute",
                left: 1030,
                top: 244 + i * 130,
                fontFamily: F.mono,
                fontSize: 15,
                color: T.faint,
                opacity: p(f, d + 10, 16),
              }}
            >
              {c.note}
            </div>
            <div
              style={{
                position: "absolute",
                left: 1440,
                top: 216 + i * 130,
                width: 300,
                textAlign: "right",
                fontFamily: F.mono,
                fontSize: i === 3 ? 32 : 34,
                color: i === 3 ? T.yellow : T.ink,
                opacity: p(f, d + 14, 16),
                textShadow: i === 3 ? `0 0 40px ${T.yellow}44` : undefined,
              }}
            >
              {c.res}
            </div>
            {i < 3 ? (
              <Arrow from={[1380, 274 + i * 130]} to={[1380, 312 + i * 130]} color={T.faint} delay={d + 20} dur={12} head={8} />
            ) : null}
          </React.Fragment>
        );
      })}

      {/* 收口 */}
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 812,
          fontFamily: F.mono,
          fontSize: 19,
          color: T.faint,
          opacity: p(f, at(4) + 24, 16),
        }}
      >
        8 × 4 B = 32 B
      </div>
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 856,
          fontFamily: F.cn,
          fontSize: 27,
          color: T.ink2,
          opacity: p(f, at(5), 18),
        }}
      >
        每条只做一件事，译码器看一眼就知道干什么
      </div>
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 906,
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontFamily: F.cn,
          fontSize: 26,
          color: T.blue,
          opacity: p(f, at(6), 18),
        }}
      >
        简单 <span style={{ color: T.faint }}>→</span> 规整 <span style={{ color: T.faint }}>→</span> 可并行
      </div>

      <Subs sceneId="s07" />
    </Stage>
  );
};

// ==========================================================================
// s08 · 定长为什么对流水线友好
// ==========================================================================
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s08");
  const STAGES = ["IF", "ID", "EX", "MEM", "WB"];
  const FMTS: { w: number; t: string }[] = [
    { w: 220, t: "6 B" },
    { w: 140, t: "2 B" },
    { w: 300, t: "8 B" },
    { w: 180, t: "5 B" },
    { w: 240, t: "7 B" },
  ];
  let acc = 0;
  const spans = FMTS.map((m) => {
    const s = acc;
    acc += m.w;
    return { ...m, x: 160 + s };
  });

  return (
    <Stage label="09 / 定长与流水线">
      <div style={{ position: "absolute", left: 0, right: 0, top: 128, display: "flex", justifyContent: "center" }}>
        <Write text="为什么简单、规整这么重要" delay={at(0)} size={44} weight={500} />
      </div>

      {/* 流水线阶梯：放到底部右侧，撑住下半屏 */}
      <Head x={1298} y={614} text="五级流水线" color={T.faint} delay={at(1)} />
      {STAGES.map((s, i) => (
        <div
          key={s}
          style={{
            position: "absolute",
            left: 1300 + i * 80,
            top: 650,
            width: 72,
            fontFamily: F.mono,
            fontSize: 16,
            color: T.faint,
            textAlign: "center",
            opacity: p(f, at(1) + 6, 14),
          }}
        >
          {s}
        </div>
      ))}
      {Array.from({ length: 5 }).map((_, r) =>
        STAGES.map((s, c) => {
          const on = c >= r && c - r < 5;
          return (
            <div
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                left: 1300 + c * 80,
                top: 680 + r * 52,
                width: 72,
                height: 44,
                borderRadius: 5,
                border: `1px solid ${on ? `${T.blue}77` : T.line}`,
                background: on ? "rgba(88,196,221,0.14)" : "transparent",
                opacity: p(f, at(1) + 10 + (r + c) * 2, 12) * (on ? 1 : 0.28),
              }}
            />
          );
        }),
      )}
      <div
        style={{
          position: "absolute",
          left: 1300,
          top: 946,
          width: 400,
          fontFamily: F.cn,
          fontSize: 17,
          color: T.sub,
          opacity: p(f, at(1) + 40, 18),
        }}
      >
        每一拍都有一条指令进、一条出
      </div>

      {/* 定长 */}
      <Head x={160} y={196} text="定长 4 B · 边界永远对得上" color={T.blue} delay={at(2)} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 160 + i * 108,
            top: 238,
            width: 100,
            height: 56,
            borderRadius: 6,
            border: `1px solid ${T.blue}66`,
            background: "rgba(88,196,221,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 18,
            color: T.blue,
            opacity: p(f, at(2) + 8 + i * 5, 14),
          }}
        >
          4 B
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 306,
          fontFamily: F.mono,
          fontSize: 17,
          color: T.sub,
          opacity: p(f, at(2) + 44, 16),
        }}
      >
        PC + 4 → PC + 8 → PC + 12 …
      </div>

      {/* 不定长 */}
      <Head x={160} y={380} text="不定长 · 每拍的边界都可能切开一条指令" color={T.orange} delay={at(3)} />
      {spans.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: 422,
            width: s.w - 4,
            height: 56,
            borderRadius: 5,
            border: `1px solid ${T.orange}77`,
            background: "rgba(240,163,43,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 17,
            color: T.orange,
            opacity: p(f, at(3) + 8 + i * 8, 16),
          }}
        >
          {s.t}
        </div>
      ))}
      {[1, 2, 3, 4, 5].map((k) => (
        <React.Fragment key={k}>
          <div
            style={{
              position: "absolute",
              left: 160 + k * 200,
              top: 404,
              width: 1,
              height: 84,
              background: `repeating-linear-gradient(180deg, ${T.red}AA 0 5px, transparent 5px 11px)`,
              opacity: p(f, at(4) + k * 6, 14),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 146 + k * 200,
              top: 484,
              width: 30,
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: 20,
              color: T.red,
              opacity: p(f, at(4) + k * 6, 14),
            }}
          >
            ?
          </div>
        </React.Fragment>
      ))}

      <div
        style={{
          position: "absolute",
          left: 160,
          top: 542,
          fontFamily: F.cn,
          fontSize: 22,
          color: T.ink2,
          opacity: p(f, at(3) + 50, 18),
        }}
      >
        不译码完，不知道这条指令有几个字节
      </div>

      <Rule w={520} color={T.line} delay={at(5)} style={{ position: "absolute", left: 160, top: 660 }} />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 680,
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily: F.cn,
          fontSize: 30,
          color: T.ink,
          opacity: p(f, at(5) + 8, 20),
        }}
      >
        长度 <span style={{ color: T.faint, fontSize: 24 }}>→</span> 规律{" "}
        <span style={{ color: T.faint, fontSize: 24 }}>→</span> 并行
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 746,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.sub,
          opacity: p(f, at(5) + 30, 18),
        }}
      >
        RISC 不是指令更聪明，是它让硬件更好排班
      </div>

      <Subs sceneId="s08" />
    </Stage>
  );
};

// ==========================================================================
// s09 · 七行对照表
// ==========================================================================
const TABLE_ROWS: [string, string, string][] = [
  ["指令集", "复杂，指令数量多", "精简，指令数量少"],
  ["指令长度", "不定长（1–15 B）", "固定（4 B）"],
  ["寻址模式", "多，可直接访问内存", "少，先 load 进寄存器"],
  ["控制方式", "微程序控制", "硬布线控制"],
  ["硬件复杂度", "复杂，芯片面积大", "精简，功耗低"],
  ["优点", "功能强，代码密度高", "性能高，功耗低"],
  ["缺点", "执行效率相对较低", "复杂操作要靠多条指令拼"],
];

export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s09");

  return (
    <Stage label="10 / 一张表">
      <div style={{ position: "absolute", left: 200, top: 132 }}>
        <Write text="CISC 与 RISC" delay={at(0)} size={40} mono color={T.ink} spacing={4} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 148,
          fontFamily: F.cn,
          fontSize: 20,
          color: T.sub,
          opacity: p(f, at(0) + 10, 16),
        }}
      >
        选择题最常见的样子
      </div>

      <div style={{ position: "absolute", left: 200, top: 202, fontFamily: F.mono, fontSize: 17, letterSpacing: 2, color: T.faint }}>
        特性
      </div>
      <div style={{ position: "absolute", left: 560, top: 202, fontFamily: F.mono, fontSize: 20, letterSpacing: 3, color: T.orange }}>
        CISC
      </div>
      <div style={{ position: "absolute", left: 1160, top: 202, fontFamily: F.mono, fontSize: 20, letterSpacing: 3, color: T.blue }}>
        RISC
      </div>
      <Rule w={1520} color={T.line} delay={at(1)} h={1.5} style={{ position: "absolute", left: 200, top: 234 }} />

      {TABLE_ROWS.map(([k, a, b], i) => {
        const d = at(i + 1);
        const v = p(f, d, 16);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 200,
              top: 260 + i * 86,
              width: 1520,
              height: 86,
              opacity: v,
              transform: `translateY(${(1 - v) * 8}px)`,
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 4, fontFamily: F.cn, fontSize: 23, color: T.sub }}>{k}</div>
            <div
              style={{
                position: "absolute",
                left: 360,
                top: 2,
                fontFamily: F.cn,
                fontSize: 26,
                color: i >= 5 ? T.orange : T.ink,
              }}
            >
              {a}
            </div>
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 2,
                fontFamily: F.cn,
                fontSize: 26,
                color: i >= 5 ? T.blue : T.ink,
              }}
            >
              {b}
            </div>
            <div style={{ position: "absolute", left: 0, top: 70, width: 1520, height: 1, background: T.line, opacity: 0.55 }} />
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 200,
          top: 900,
          fontFamily: F.cn,
          fontSize: 22,
          color: T.sub,
          opacity: p(f, at(7) + 40, 20),
        }}
      >
        记表的时候，把左边的"特性"当提示词，两条一起背
      </div>

      <Subs sceneId="s09" />
    </Stage>
  );
};

// ==========================================================================
// s10 · 界线模糊了，但分野还在
// ==========================================================================
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s10");
  const UOPS = ["load", "add", "store"];

  return (
    <Stage label="11 / 今天的界线">
      <div style={{ position: "absolute", left: 160, top: 126 }}>
        <Write text="这条界线，今天已经模糊了" delay={at(0)} size={42} weight={500} />
      </div>

      {/* x86：CISC 外壳，RISC 内核 */}
      <Head x={160} y={208} text="x86 · CISC 外壳，RISC 内核" color={T.orange} delay={at(1)} />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 250,
          width: 380,
          height: 58,
          borderRadius: 8,
          border: `1px solid ${T.orange}66`,
          background: "rgba(240,163,43,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 19,
          color: T.orange,
          opacity: p(f, at(1) + 8, 16),
        }}
      >
        C7 84 82 … 0A
      </div>
      <div
        style={{
          position: "absolute",
          left: 550,
          top: 226,
          fontFamily: F.cn,
          fontSize: 17,
          color: T.faint,
          opacity: p(f, at(1) + 16, 16),
        }}
      >
        翻译
      </div>
      <Arrow from={[548, 279]} to={[604, 279]} color={T.faint} delay={at(1) + 12} dur={14} head={8} />
      {UOPS.map((t, i) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: 614 + i * 106,
            top: 252,
            width: 96,
            height: 54,
            borderRadius: 6,
            border: `1px solid ${T.teal}55`,
            background: "rgba(92,208,179,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            opacity: p(f, at(1) + 20 + i * 8, 14),
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.faint, letterSpacing: 0.5 }}>μop</span>
          <span style={{ fontFamily: F.mono, fontSize: 15, color: T.teal }}>{t}</span>
        </div>
      ))}
      <Arrow from={[928, 279]} to={[986, 279]} color={T.faint} delay={at(1) + 44} dur={14} head={8} />
      {["IF", "ID", "EX", "MEM", "WB"].map((s, i) => (
        <div
          key={s}
          style={{
            position: "absolute",
            left: 996 + i * 78,
            top: 252,
            width: 70,
            height: 54,
            borderRadius: 5,
            border: `1px solid ${T.blue}55`,
            background: "rgba(88,196,221,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 14,
            color: T.blue,
            opacity: p(f, at(1) + 50 + i * 5, 12),
          }}
        >
          {s}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 996,
          top: 320,
          fontFamily: F.cn,
          fontSize: 17,
          color: T.sub,
          opacity: p(f, at(1) + 76, 16),
        }}
      >
        类 RISC 流水线
      </div>

      {/* ARM：定长为主，部分变长 */}
      <Head x={160} y={400} text="ARM · 定长为主，部分变长" color={T.blue} delay={at(2)} />
      {[
        { w: 150, t: "4 B", dx: 0, c: T.blue },
        { w: 150, t: "4 B", dx: 158, c: T.blue },
        { w: 74, t: "2 B", dx: 316, c: T.purple },
        { w: 74, t: "2 B", dx: 396, c: T.purple },
        { w: 150, t: "4 B", dx: 478, c: T.blue },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 160 + b.dx,
            top: 444,
            width: b.w,
            height: 52,
            borderRadius: 5,
            border: `1px solid ${b.c}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 16,
            color: b.c,
            opacity: p(f, at(2) + 10 + i * 7, 14),
          }}
        >
          {b.t}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 452,
          fontFamily: F.cn,
          fontSize: 19,
          color: T.sub,
          opacity: p(f, at(2) + 46, 16),
        }}
      >
        A64 固定 4 B · Thumb-2 里 2 B / 4 B 混排
      </div>

      {/* 回扣开头那条线 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 596,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 21,
          color: T.faint,
          opacity: p(f, at(3), 18),
        }}
      >
        程序
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 632, textAlign: "center" }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 38,
            fontWeight: 600,
            letterSpacing: 8,
            color: T.yellow,
            opacity: p(f, at(3) + 6, 18),
            textShadow: `0 0 50px ${T.yellow}33`,
          }}
        >
          ISA
        </span>
      </div>
      <Rule
        w={620}
        color={`${T.yellow}77`}
        delay={at(3) + 4}
        dur={26}
        style={{ position: "absolute", left: 200, top: 650, transformOrigin: "right center" }}
      />
      <Rule w={620} color={`${T.yellow}77`} delay={at(3) + 4} dur={26} style={{ position: "absolute", left: 1100, top: 650 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 682,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 21,
          color: T.faint,
          opacity: p(f, at(3) + 10, 18),
        }}
      >
        微架构
      </div>

      {/* 收口 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 760,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 36,
          letterSpacing: 1.5,
          color: T.ink,
          opacity: p(f, at(4), 22),
        }}
      >
        契约规定<span style={{ color: T.yellow }}>做什么</span>，实现决定
        <span style={{ color: T.blue }}>怎么做</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 850,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 22,
          color: T.sub,
          opacity: p(f, at(5), 20),
        }}
      >
        记那张表，比记一句结论更耐用
      </div>

      <Subs sceneId="s10" />
    </Stage>
  );
};
