import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Chip, Rule, Stage, Subs, Write, p, useCues } from "../shared/b3b/ui";
import { Bytes, Head, Item } from "./parts";

// ==========================================================================
// s00 · 这道线就是 ISA
// ==========================================================================
export const S00: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s00");
  const veil = p(f, at(5), 24);
  const hw = ["取指单元", "译码器", "ALU", "Cache L1"];

  return (
    <Stage label="第 1 幕 · 契约在哪里">
      <div style={{ position: "absolute", left: 0, right: 0, top: 134, display: "flex", justifyContent: "center" }}>
        <Write text="编译器写下一条 ADD，是在跟谁说话？" delay={at(0)} size={50} weight={500} />
      </div>

      {/* ---------- 线上：软件 ---------- */}
      <Head x={300} y={244} text="软件侧 · 编译器输出" color={T.blue} delay={at(1)} />
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 282,
          width: 1320,
          height: 130,
          borderRadius: 10,
          border: `1px solid ${T.blue}2E`,
          background: "rgba(88,196,221,0.05)",
          opacity: p(f, at(1), 20),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 356,
          top: 320,
          fontFamily: F.mono,
          fontSize: 34,
          color: T.blue,
          opacity: p(f, at(1) + 6, 16),
        }}
      >
        c = a + b;
      </div>
      <Arrow from={[690, 348]} to={[820, 348]} color={T.faint} delay={at(1) + 10} dur={18} />
      <div
        style={{
          position: "absolute",
          left: 860,
          top: 320,
          fontFamily: F.mono,
          fontSize: 34,
          color: T.yellow,
          opacity: p(f, at(1) + 16, 16),
        }}
      >
        ADD R1, R2, R3
      </div>

      {/* ---------- 分界线 ---------- */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 468, textAlign: "center" }}>
        <Write
          text="ISA"
          delay={at(2)}
          size={92}
          mono
          weight={600}
          spacing={12}
          color={T.yellow}
          style={{ textShadow: `0 0 70px ${T.yellow}44`, lineHeight: 1.1 }}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 596, textAlign: "center" }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 19,
            letterSpacing: 3,
            color: T.faint,
            opacity: p(f, at(2) + 14, 18),
          }}
        >
          INSTRUCTION SET ARCHITECTURE · 指令体系结构
        </span>
      </div>
      <Rule
        w={620}
        color={`${T.yellow}99`}
        h={2}
        delay={at(4)}
        dur={30}
        style={{ position: "absolute", left: 200, top: 490, transformOrigin: "right center" }}
      />
      <Rule
        w={620}
        color={`${T.yellow}99`}
        h={2}
        delay={at(4)}
        dur={30}
        style={{ position: "absolute", left: 1100, top: 490 }}
      />

      {/* ---------- 线下：硬件 ---------- */}
      <Head x={300} y={652} text="硬件侧 · 微架构" color={T.faint} delay={at(4) + 10} />
      <Chip x={1440} y={642} text="软件不可见" color={T.red} size={17} delay={at(5) + 10} />
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 688,
          width: 1320,
          height: 132,
          borderRadius: 10,
          border: `1px dashed ${T.line}`,
          opacity: p(f, at(4), 20),
        }}
      />
      {hw.map((t, i) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: 300 + i * 340,
            top: 688,
            width: 320,
            height: 132,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRight: i < 3 ? `1px dashed ${T.line}` : undefined,
            fontFamily: F.cn,
            fontSize: 26,
            color: T.sub,
            opacity: p(f, at(4) + i * 5, 18) * (1 - veil * 0.62),
          }}
        >
          {t}
        </div>
      ))}

      {/* ---------- 定义 ---------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 860,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 25,
          letterSpacing: 1,
          color: T.ink2,
          opacity: p(f, at(3), 20) * (0.55 + veil * 0.45),
        }}
      >
        软件能观察到的处理器行为 <span style={{ color: T.faint }}>+</span> 软硬件交互必须遵守的规则
      </div>

      <Subs sceneId="s00" />
    </Stage>
  );
};

// ==========================================================================
// s01 · ISA 规定七件事
// ==========================================================================
const ISA_ITEMS: [string, string][] = [
  ["有哪些指令，执行后产生什么可观察结果", "ADD / LW / BEQ"],
  ["指令怎么编码：操作码、操作数各占几位", "opcode | rs | rt | rd"],
  ["软件可见的寄存器：有哪些、怎么访问", "R0–R31 · PC · PSW"],
  ["操作数怎么给：立即数、寄存器、内存", "imm / reg / mem"],
  ["支持哪些数据类型", "int8 · fp32 · vec"],
  ["访存行为：字节序、原子操作、一致性", "endian · atomic"],
  ["异常、中断与特权级", "#PF · ring 0 · CSR"],
];

export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s01");

  return (
    <Stage label="02 / ISA 的七项内容">
      <div style={{ position: "absolute", left: 128, top: 176 }}>
        <Write text="ISA" delay={at(0)} size={64} mono color={T.yellow} spacing={5} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 262,
          fontFamily: F.cn,
          fontSize: 34,
          color: T.ink,
          opacity: p(f, at(0) + 8, 18),
        }}
      >
        规定七件事
      </div>
      <Rule w={380} color={T.line} delay={at(0) + 14} style={{ position: "absolute", left: 128, top: 322 }} />
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 352,
          width: 420,
          fontFamily: F.cn,
          fontSize: 21,
          lineHeight: 1.9,
          color: T.sub,
          opacity: p(f, at(0) + 20, 18),
        }}
      >
        七条都在描述同一件事：
        <br />
        软件能看见什么，能依赖什么。
      </div>

      {ISA_ITEMS.map(([title, note], i) => (
        <Item key={title} x={636} y={186 + i * 100} i={i + 1} title={title} note={note} w={1140} delay={at(i + 1)} />
      ))}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 902,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 28,
          letterSpacing: 1.5,
          color: T.ink2,
          opacity: p(f, at(8), 20),
        }}
      >
        判断标准只有一条：<span style={{ color: T.yellow }}>软件看不看得见</span>
      </div>

      <Subs sceneId="s01" />
    </Stage>
  );
};

// ==========================================================================
// s02 · 规定做什么，不规定怎么做
// ==========================================================================
const ISA_SAYS = ["ADD rd, rs, rt  →  rd = rs + rt", "16 个通用寄存器 + PC", "指令 4 字节，按 4 对齐"];
const UARCH_HIDES = ["流水线 14 级", "乱序执行", "寄存器重命名", "4 个 ALU", "L1 Cache 32 KB", "TAGE 分支预测"];

/** 估算文字宽度：中文按 1em，西文按 0.58em */
const wOf = (s: string, size: number) =>
  [...s].reduce((a, ch) => a + (ch.charCodeAt(0) > 255 ? size : size * 0.58), 0);

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s02");

  return (
    <Stage label="03 / 契约与实现">
      <div style={{ position: "absolute", left: 0, right: 0, top: 140, display: "flex", justifyContent: "center" }}>
        <Write text="ISA 说做什么，微架构决定怎么做" delay={at(0)} size={48} weight={500} />
      </div>

      {/* 左：ISA 规定 */}
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 236,
          width: 764,
          height: 424,
          borderRadius: 12,
          border: `1px solid ${T.green}40`,
          background: "rgba(131,193,103,0.055)",
          opacity: p(f, at(1), 20),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 168,
          top: 262,
          fontFamily: F.mono,
          fontSize: 21,
          letterSpacing: 2,
          color: T.green,
          opacity: p(f, at(1) + 6, 16),
        }}
      >
        ISA 规定
      </div>
      {ISA_SAYS.map((t, i) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: 168,
            top: 330 + i * 96,
            fontFamily: F.mono,
            fontSize: i === 0 ? 23 : 24,
            color: T.ink,
            opacity: p(f, at(1) + 12 + i * 6, 18),
          }}
        >
          {t}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 168,
          top: 616,
          fontFamily: F.cn,
          fontSize: 19,
          color: T.faint,
          opacity: p(f, at(1) + 30, 18),
        }}
      >
        换个实现，这几条不能变
      </div>

      {/* 中缝 */}
      <div
        style={{
          position: "absolute",
          left: 956,
          top: 236,
          width: 1,
          height: 424,
          background: `repeating-linear-gradient(180deg, ${T.line} 0 6px, transparent 6px 14px)`,
          transform: `scaleY(${p(f, at(2), 26)})`,
          transformOrigin: "top center",
        }}
      />

      {/* 右：微架构自己定 */}
      <div
        style={{
          position: "absolute",
          left: 1016,
          top: 236,
          width: 764,
          height: 424,
          borderRadius: 12,
          border: `1px solid ${T.red}3A`,
          background: "rgba(252,98,85,0.05)",
          opacity: p(f, at(2), 20),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1056,
          top: 262,
          fontFamily: F.mono,
          fontSize: 21,
          letterSpacing: 2,
          color: T.red,
          opacity: p(f, at(2) + 6, 16),
        }}
      >
        微架构自己定
      </div>
      {UARCH_HIDES.map((t, i) => {
        const d = at(2) + 14 + i * 9;
        const v = p(f, d, 16);
        const sw = p(f, d + 14, 18);
        const w = wOf(t, 25);
        return (
          <React.Fragment key={t}>
            <div
              style={{
                position: "absolute",
                left: 1056,
                top: 314 + i * 50,
                fontFamily: F.cn,
                fontSize: 25,
                color: T.ink2,
                opacity: v * (0.9 - sw * 0.45),
              }}
            >
              {t}
            </div>
            <div
              style={{
                position: "absolute",
                left: 1056,
                top: 330 + i * 50,
                width: w,
                height: 1.5,
                background: `${T.red}CC`,
                transform: `scaleX(${sw})`,
                transformOrigin: "left center",
              }}
            />
          </React.Fragment>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 1056,
          top: 616,
          fontFamily: F.mono,
          fontSize: 18,
          color: T.faint,
          opacity: p(f, at(4), 18),
        }}
      >
        microarchitecture · 实现细节
      </div>

      {/* 收口两句 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center", gap: 84 }}>
        <div style={{ opacity: p(f, at(5), 20), textAlign: "center" }}>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: T.green, letterSpacing: 2 }}>ISA</div>
          <div style={{ fontFamily: F.cn, fontSize: 26, color: T.ink, marginTop: 10 }}>表现成什么样</div>
        </div>
        <div style={{ opacity: p(f, at(5) + 10, 20), textAlign: "center" }}>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: T.red, letterSpacing: 2 }}>微架构</div>
          <div style={{ fontFamily: F.cn, fontSize: 26, color: T.ink, marginTop: 10 }}>具体怎么做到</div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 828,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 20,
          color: T.faint,
          opacity: p(f, at(6), 18),
        }}
      >
        同一份 x86-64：
      </div>
      <Chip x={800} y={866} text="Intel Core" color={T.blue} size={20} delay={at(6) + 8} />
      <Chip x={990} y={866} text="AMD Ryzen" color={T.orange} size={20} delay={at(6) + 14} />
      <div
        style={{
          position: "absolute",
          left: 1150,
          top: 876,
          fontFamily: F.cn,
          fontSize: 20,
          color: T.sub,
          opacity: p(f, at(6) + 20, 18),
        }}
      >
        内部完全不同，程序照样跑
      </div>

      <Subs sceneId="s02" />
    </Stage>
  );
};

// ==========================================================================
// s03 · 一条对一串
// ==========================================================================
const MIPS_LINES = [
  ["sll", "$v1, $v1, 6"],
  ["add", "$v1, $v1, $a0"],
  ["sll", "$v1, $v1, 2"],
  ["lui", "$at, 0x0042"],
  ["ori", "$v0, $at, 0x2000"],
  ["add", "$v0, $v1, $v0"],
  ["li", "$a1, 10"],
  ["sw", "$a1, 0($v0)"],
];
const X86_BYTES = ["C7", "84", "82", "00", "20", "42", "00", "0A", "00", "00", "00"];

export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s03");

  return (
    <Stage label="04 / 两种设计哲学">
      <div style={{ position: "absolute", left: 0, right: 0, top: 132, display: "flex", justifyContent: "center" }}>
        <Write text="同一行 C，两种指令集" delay={at(0)} size={40} color={T.ink2} spacing={1} />
      </div>

      <Chip x={716} y={214} text="C" color={T.blue} size={18} delay={at(1)} />
      <div
        style={{
          position: "absolute",
          left: 764,
          top: 202,
          width: 460,
          height: 58,
          borderRadius: 8,
          border: `1px solid ${T.blue}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 27,
          color: T.blue,
          opacity: p(f, at(1) + 6, 18),
        }}
      >
        a[i][j] = 10;
      </div>

      {/* 左：x86 一条 */}
      <Head x={128} y={310} text="x86 · CISC" color={T.orange} delay={at(2)} />
      <Bytes x={128} y={356} bytes={X86_BYTES} cw={62} ch={54} gap={3} color={T.orange} delay={at(2) + 8} />
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 434,
          fontFamily: F.cn,
          fontSize: 24,
          color: T.orange,
          opacity: p(f, at(2) + 34, 18),
        }}
      >
        1 条指令 · 11 字节
      </div>
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 520,
          width: 680,
          fontFamily: F.cn,
          fontSize: 20,
          lineHeight: 1.9,
          color: T.sub,
          opacity: p(f, at(4), 20),
        }}
      >
        同样这条语句：
        <br />
        CISC <span style={{ fontFamily: F.mono, color: T.orange }}>11 B</span>，RISC{" "}
        <span style={{ fontFamily: F.mono, color: T.blue }}>32 B</span>
        <br />
        <span style={{ color: T.faint, fontSize: 18 }}>代码密度差近三倍，这是 CISC 换来的东西</span>
      </div>

      {/* 右：MIPS 一串 */}
      <Head x={1010} y={310} text="MIPS · RISC" color={T.blue} delay={at(3)} />
      {MIPS_LINES.map(([op, args], i) => {
        const d = at(3) + 10 + i * 7;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: 1010,
                top: 352 + i * 56,
                width: 96,
                height: 42,
                borderRadius: 6,
                border: `1px solid ${T.blue}66`,
                background: "rgba(88,196,221,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize: 17,
                color: T.blue,
                opacity: p(f, d, 14),
              }}
            >
              4 B
            </div>
            <div
              style={{
                position: "absolute",
                left: 1128,
                top: 358 + i * 56,
                fontFamily: F.mono,
                fontSize: 21,
                color: T.ink2,
                opacity: p(f, d + 4, 14),
              }}
            >
              <span style={{ color: T.ink }}>{op}</span> {args}
            </div>
          </React.Fragment>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 1010,
          top: 810,
          fontFamily: F.cn,
          fontSize: 24,
          color: T.blue,
          opacity: p(f, at(3) + 62, 18),
        }}
      >
        8 条指令 · 每条 4 字节
      </div>

      {/* 中间 vs */}
      <div
        style={{
          position: "absolute",
          left: 906,
          top: 372,
          fontFamily: F.mono,
          fontSize: 20,
          letterSpacing: 3,
          color: T.faint,
          opacity: p(f, at(4), 18),
        }}
      >
        vs
      </div>

      <Rule w={660} color={T.line} delay={at(5)} style={{ position: "absolute", left: 630, top: 878 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 896,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 30,
          letterSpacing: 2,
          color: T.ink,
          opacity: p(f, at(5) + 10, 20),
        }}
      >
        不是谁更先进，是<span style={{ color: T.yellow }}>两种设计哲学</span>
      </div>

      <Subs sceneId="s03" />
    </Stage>
  );
};

// ==========================================================================
// s04 · CISC 的五个特征
// ==========================================================================
const CISC_ITEMS: [string, string][] = [
  ["指令复杂：一条里既可访存，又可运算", "mem + alu"],
  ["不定长：1 B 到 15 B", "var-length"],
  ["寻址方式多，可直接访问内存", "many modes"],
  ["微程序控制", "μprogram"],
  ["硬件复杂，芯片面积大", "big die"],
];

export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s04");
  const ROM = ["μ1 取操作数", "μ2 加法运算", "μ3 写回", "μ4 更新 PC"];

  return (
    <Stage label="05 / CISC">
      <div style={{ position: "absolute", left: 128, top: 128 }}>
        <Write text="CISC" delay={at(0)} size={46} mono color={T.orange} spacing={6} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 356,
          top: 146,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.sub,
          opacity: p(f, at(0) + 8, 16),
        }}
      >
        Complex Instruction Set Computer
      </div>

      {CISC_ITEMS.map(([title, note], i) => (
        <Item key={title} x={128} y={210 + i * 100} i={i + 1} title={title} note={note} w={600} delay={at(i + 1)} size={24} />
      ))}

      <Chip x={128} y={748} text="x86 · Intel / AMD" color={T.orange} size={20} delay={at(6)} />

      {/* 右：不定长 */}
      <Head x={820} y={182} text="变长指令 · 长度不固定" color={T.faint} delay={at(2)} />
      <Bytes x={820} y={226} bytes={["8B", "55", "F8"]} cw={56} ch={46} gap={3} color={T.orange} delay={at(2) + 8} />
      <div
        style={{
          position: "absolute",
          left: 1080,
          top: 238,
          fontFamily: F.mono,
          fontSize: 19,
          color: T.sub,
          opacity: p(f, at(2) + 16, 14),
        }}
      >
        3 B
      </div>
      <Bytes x={820} y={300} bytes={["7D", "32"]} cw={56} ch={46} gap={3} color={T.orange} delay={at(2) + 20} />
      <div
        style={{
          position: "absolute",
          left: 1010,
          top: 312,
          fontFamily: F.mono,
          fontSize: 19,
          color: T.sub,
          opacity: p(f, at(2) + 26, 14),
        }}
      >
        2 B
      </div>
      <Bytes
        x={820}
        y={374}
        bytes={X86_BYTES}
        cw={56}
        ch={46}
        gap={3}
        color={T.orange}
        delay={at(2) + 32}
      />
      <div
        style={{
          position: "absolute",
          left: 1500,
          top: 386,
          fontFamily: F.mono,
          fontSize: 19,
          color: T.sub,
          opacity: p(f, at(2) + 48, 14),
        }}
      >
        11 B
      </div>

      {/* 右：微程序 */}
      <Head x={820} y={474} text="微程序控制单元" color={T.faint} delay={at(4)} />
      <div
        style={{
          position: "absolute",
          left: 820,
          top: 512,
          width: 960,
          height: 232,
          borderRadius: 10,
          border: `1px solid ${T.purple}3A`,
          background: "rgba(177,137,198,0.05)",
          opacity: p(f, at(4) + 8, 20),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 852,
          top: 534,
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: 2,
          color: T.faint,
          opacity: p(f, at(4) + 14, 16),
        }}
      >
        控制存储器 ROM
      </div>
      {ROM.map((t, i) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: 852 + (i % 2) * 460,
            top: 578 + Math.floor(i / 2) * 74,
            width: 380,
            height: 56,
            borderRadius: 8,
            border: `1px solid ${T.purple}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 22,
            color: T.ink2,
            opacity: p(f, at(5) + i * 8, 16),
          }}
        >
          {t}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 820,
          top: 764,
          fontFamily: F.cn,
          fontSize: 19,
          color: T.sub,
          opacity: p(f, at(5) + 30, 18),
        }}
      >
        一条机器指令 = 一段微程序
      </div>

      <Subs sceneId="s04" />
    </Stage>
  );
};

// ==========================================================================
// s05 · RISC 的五个特征
// ==========================================================================
const RISC_ITEMS: [string, string][] = [
  ["指令少而简单，一条只做一件事", "single op"],
  ["定长：ARM / MIPS 都是 4 B", "fixed 4B"],
  ["寻址方式少，先 load 进寄存器", "load / store"],
  ["硬布线控制", "hardwired"],
  ["硬件精简，功耗低", "small die"],
];

export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s05");
  const RISC_SAMPLE = ["sll  $v1, $v1, 6", "add  $v1, $v1, $a0", "sw   $a1, 0($v0)", "beq  $v0, $zero, L"];

  return (
    <Stage label="06 / RISC">
      <div style={{ position: "absolute", left: 128, top: 128 }}>
        <Write text="RISC" delay={at(0)} size={46} mono color={T.blue} spacing={6} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 316,
          top: 146,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.sub,
          opacity: p(f, at(0) + 8, 16),
        }}
      >
        Reduced Instruction Set Computer
      </div>

      {RISC_ITEMS.map(([title, note], i) => (
        <Item key={title} x={128} y={210 + i * 100} i={i + 1} title={title} note={note} w={600} delay={at(i + 1)} size={24} />
      ))}

      <Chip x={128} y={766} text="ARM · Apple A / M" color={T.blue} size={20} delay={at(6)} />

      {/* 右：定长 */}
      <Head x={820} y={182} text="定长 · 每条 4 字节" color={T.faint} delay={at(2)} />
      {RISC_SAMPLE.map((t, i) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: 820,
            top: 226 + i * 54,
            width: 520,
            height: 44,
            borderRadius: 6,
            border: `1px solid ${T.blue}55`,
            background: "rgba(88,196,221,0.07)",
            display: "flex",
            alignItems: "center",
            paddingLeft: 18,
            fontFamily: F.mono,
            fontSize: 21,
            color: T.ink2,
            opacity: p(f, at(2) + 10 + i * 6, 14),
          }}
        >
          {t}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 1370,
          top: 236,
          fontFamily: F.mono,
          fontSize: 18,
          color: T.sub,
          opacity: p(f, at(2) + 36, 16),
        }}
      >
        ← 每一条都对齐到 4 字节
      </div>

      {/* 右：硬布线 */}
      <Head x={820} y={470} text="硬布线 · 不查微程序表" color={T.faint} delay={at(4)} />
      {["指令字段", "组合逻辑", "控制信号"].map((t, i) => (
        <React.Fragment key={t}>
          <div
            style={{
              position: "absolute",
              left: 820 + i * 230,
              top: 510,
              width: 170,
              height: 62,
              borderRadius: 8,
              border: `1px solid ${T.teal}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.cn,
              fontSize: 22,
              color: T.ink2,
              opacity: p(f, at(4) + 8 + i * 7, 16),
            }}
          >
            {t}
          </div>
          {i < 2 ? (
            <Arrow from={[1000 + i * 230, 541]} to={[1050 + i * 230, 541]} color={T.teal} delay={at(4) + 14 + i * 7} dur={14} head={8} />
          ) : null}
        </React.Fragment>
      ))}
      <div
        style={{
          position: "absolute",
          left: 1530,
          top: 512,
          padding: "6px 14px",
          borderRadius: 999,
          border: `1px dashed ${T.faint}`,
          fontFamily: F.mono,
          fontSize: 17,
          color: T.faint,
          opacity: p(f, at(4) + 24, 16),
          textDecoration: "line-through",
        }}
      >
        微程序表
      </div>

      {/* 右：寄存器阵列 */}
      <Head x={820} y={620} text="32 × 通用寄存器" color={T.faint} delay={at(5)} />
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 820 + (i % 8) * 50,
            top: 662 + Math.floor(i / 8) * 38,
            width: 42,
            height: 30,
            borderRadius: 4,
            border: `1px solid ${T.blue}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 13,
            color: T.sub,
            opacity: p(f, at(5) + 8 + i * 1.4, 10),
          }}
        >
          R{i}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 1250,
          top: 690,
          fontFamily: F.cn,
          fontSize: 20,
          color: T.sub,
          opacity: p(f, at(5) + 40, 16),
        }}
      >
        少了，根本不够用
      </div>

      <Subs sceneId="s05" />
    </Stage>
  );
};
