import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "./tokens";
import { Arrow, Bits, Chip, Fade, Field, Rule, Stage, Subs, Table, Write, p, useCues } from "./ui";

// ==========================================================================
// s10 · 寻址方式：针对的是每一个操作数
// ==========================================================================
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s10");

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 176 }}>
        <Write text="寻址方式" delay={at(0)} size={56} color={T.ink} weight={500} />
        <div style={{ marginTop: 8 }}>
          <Write text="ADDRESSING MODE" delay={at(0) + 10} size={17} color={T.faint} mono spacing={4} />
        </div>
      </div>
      <Rule w={520} color={T.line} delay={at(0) + 24} style={{ position: "absolute", left: 128, top: 272 }} />

      <div style={{ position: "absolute", left: 128, top: 300 }}>
        <Write text="操作数，到底在哪里？" delay={at(1)} size={32} color={T.ink2} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 372, opacity: p(f, at(3), 16) }}>
        <span
          style={{
            fontFamily: F.cn,
            fontSize: 26,
            color: T.red,
            textDecoration: "line-through",
            opacity: 0.55,
          }}
        >
          整条指令采用某种寻址
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 24, color: T.faint, margin: "0 16px" }}>→</span>
        <span style={{ fontFamily: F.cn, fontSize: 26, color: T.green }}>针对每一个操作数</span>
      </div>

      <div style={{ position: "absolute", left: 620, top: 470, opacity: p(f, at(4), 14) }}>
        <span style={{ fontFamily: F.mono, fontSize: 46, color: T.ink, letterSpacing: 2 }}>MOV</span>
      </div>
      <Field x={790} y={452} w={170} h={96} label="AX" sub="寄存器" color={T.teal} delay={at(4) + 8} fill />
      <Field x={972} y={452} w={300} h={96} label="1234H" sub="立即数" color={T.purple} delay={at(4) + 18} fill />

      <div style={{ position: "absolute", left: 790, top: 570, width: 170, display: "flex", justifyContent: "center" }}>
        <Write text="寄存器寻址" delay={at(5)} size={24} color={T.teal} />
      </div>
      <div style={{ position: "absolute", left: 972, top: 570, width: 300, display: "flex", justifyContent: "center" }}>
        <Write text="立即寻址" delay={at(5) + 12} size={24} color={T.purple} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 680 }}>
        <Write
          text="考试说「该指令采用立即寻址」→ 指的是源操作数，按这个习惯读"
          delay={at(6)}
          size={22}
          color={T.sub}
        />
      </div>

      <Subs sceneId="s10" />
    </Stage>
  );
};

// ==========================================================================
// s11 · ① 立即寻址
// ==========================================================================
export const S11: React.FC = () => {
  const { at } = useCues("s11");

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 176 }}>
        <Write text="① 立即寻址" delay={at(0)} size={40} color={T.ink} />
        <div style={{ marginTop: 6 }}>
          <Write text="IMMEDIATE" delay={at(0) + 10} size={16} color={T.purple} mono spacing={4} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 330 }}>
        <span style={{ fontFamily: F.mono, fontSize: 36, color: T.ink2 }}>MOV</span>
      </div>
      <Field x={260} y={320} w={130} h={80} label="R1" color={T.blue} delay={at(0) + 8} />
      <Field x={398} y={320} w={160} h={80} label="#5" sub="imm" color={T.purple} delay={at(0) + 16} fill />

      <Arrow from={[572, 360]} to={[980, 360]} color={T.purple} delay={at(1)} sw={2} />
      <Field x={990} y={320} w={200} h={80} label="5" sub="R1" color={T.blue} delay={at(1) + 8} fill />

      <Chip x={128} y={470} text="访存 0 次" color={T.green} delay={at(1) + 16} />
      <div style={{ position: "absolute", left: 330, top: 466 }}>
        <Write text="操作数就在指令里，取它不用碰内存" delay={at(1) + 22} size={22} color={T.sub} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 570 }}>
        <Write text="适合：加载常量、和固定值比较" delay={at(2)} size={24} color={T.ink2} />
        <Write text="MOV AX, 5　　CMP AL, 0" delay={at(2) + 12} size={21} color={T.sub} mono style={{ marginTop: 10 }} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 700 }}>
        <Write text="− 它是常数：不能改，也不能当左值" delay={at(3)} size={24} color={T.red} />
      </div>

      <Subs sceneId="s11" />
    </Stage>
  );
};

// ==========================================================================
// s12 · ② 寄存器寻址
// ==========================================================================
export const S12: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s12");
  const regs = ["AX", "BX", "CX", "DX", "SI", "DI", "SP", "BP"];
  const axVal = f >= at(2) + 34 ? "5" : "0";
  const vals = [axVal, "5", "·", "·", "·", "·", "·", "·"];
  const CW = 200;
  const GAP = 12;
  const RH = 86;
  const x0 = 128;
  const y0 = 400;

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 168 }}>
        <Write text="② 寄存器寻址" delay={at(0)} size={40} color={T.ink} />
        <div style={{ marginTop: 4 }}>
          <Write text="REGISTER" delay={at(0) + 10} size={16} color={T.teal} mono spacing={4} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 268 }}>
        <span style={{ fontFamily: F.mono, fontSize: 34, color: T.ink2 }}>MOV</span>
      </div>
      <Field x={250} y={258} w={130} h={76} label="AX" color={T.teal} delay={at(2)} fill />
      <Field x={396} y={258} w={130} h={76} label="BX" color={T.teal} delay={at(2) + 8} fill />

      {regs.map((r, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const hot = r === "AX" || r === "BX";
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              left: x0 + col * (CW + GAP),
              top: y0 + row * (RH + 12),
              width: CW,
              height: RH,
              borderRadius: 8,
              border: `1.5px solid ${hot ? T.teal : T.line}`,
              background: hot ? `${T.teal}14` : "transparent",
              opacity: p(f, at(0) + 12 + i * 2.5, 12),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 22px",
              fontFamily: F.mono,
              fontSize: 26,
              color: hot ? T.teal : T.ink2,
            }}
          >
            <span>{r}</span>
            <span style={{ color: hot ? T.ink : T.faint, fontSize: 24 }}>{vals[i]}</span>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: x0,
          top: y0 + 2 * (RH + 12) + 18,
          fontFamily: F.cn,
          fontSize: 20,
          color: T.teal,
          opacity: p(f, at(2) + 30, 12),
        }}
      >
        5 从 BX 拷进 AX —— 两个寄存器之间，不碰内存
      </div>

      <Chip x={128} y={700} text="访存 0 次" color={T.green} delay={at(1) + 10} />
      <div style={{ position: "absolute", left: 300, top: 696 }}>
        <Write text="指令里写的是编号，不是地址" delay={at(1) + 16} size={22} color={T.sub} />
      </div>

      <div style={{ position: "absolute", left: 1120, top: 400, opacity: p(f, at(3), 14) }}>
        <span style={{ fontFamily: F.mono, fontSize: 18, color: T.faint, letterSpacing: 2 }}>reg 字段</span>
      </div>
      <Bits
        bits="001"
        x={1120}
        y={440}
        cw={44}
        ch={56}
        gap={5}
        delay={at(3) + 8}
        color={T.teal}
        paint={{ 0: T.teal, 1: T.teal, 2: T.teal }}
      />
      <div style={{ position: "absolute", left: 1290, top: 452 }}>
        <Write text="→ 选中 BX" delay={at(3) + 18} size={24} color={T.teal} />
      </div>
      <div style={{ position: "absolute", left: 1120, top: 540 }}>
        <Write text="3 位能编 8 个寄存器" delay={at(3) + 26} size={20} color={T.sub} />
        <Write text="寄存器数量有限 → 字段很短" delay={at(3) + 34} size={20} color={T.sub} style={{ marginTop: 8 }} />
      </div>

      <Subs sceneId="s12" />
    </Stage>
  );
};

// ==========================================================================
// s13 · ③ 直接寻址
// ==========================================================================
export const S13: React.FC = () => {
  const { at } = useCues("s13");
  const mem = [
    { a: "0FFC", v: "31" },
    { a: "0FFE", v: "08" },
    { a: "1000", v: "7" },
    { a: "1002", v: "42" },
    { a: "1004", v: "19" },
  ];

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 176 }}>
        <Write text="③ 直接寻址" delay={at(0)} size={40} color={T.ink} />
        <div style={{ marginTop: 6 }}>
          <Write text="DIRECT" delay={at(0) + 10} size={16} color={T.blue} mono spacing={4} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 280 }}>
        <span style={{ fontFamily: F.mono, fontSize: 36, color: T.ink2 }}>MOV</span>
      </div>
      <Field x={252} y={270} w={120} h={78} label="R1" color={T.blue} delay={at(0) + 8} />
      <Field x={386} y={270} w={160} h={78} label="[1000]" color={T.blue} delay={at(0) + 16} fill />

      <div style={{ position: "absolute", left: 128, top: 400 }}>
        <Write text="EA = 1000" delay={at(1)} size={28} color={T.blue} mono />
      </div>
      <Chip x={128} y={470} text="访存 1 次" color={T.orange} delay={at(1) + 14} />

      <div style={{ position: "absolute", left: 780, top: 232 }}>
        <Write text="内存" delay={at(1) + 8} size={18} color={T.faint} mono spacing={2} />
      </div>
      {mem.map((m, i) => {
        const isHit = m.a === "1000";
        return (
          <React.Fragment key={m.a}>
            <div
              style={{
                position: "absolute",
                left: 780,
                top: 300 + i * 66,
                width: 180,
                height: 56,
                borderRadius: 6,
                border: `1px solid ${isHit ? T.blue : T.line}`,
                background: isHit ? `${T.blue}22` : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize: 21,
                color: isHit ? T.blue : T.faint,
              }}
            >
              {m.a}
            </div>
            <div
              style={{
                position: "absolute",
                left: 968,
                top: 300 + i * 66,
                width: 120,
                height: 56,
                borderRadius: 6,
                border: `1px solid ${isHit ? T.blue : T.line}`,
                background: isHit ? `${T.blue}22` : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize: 24,
                color: isHit ? T.ink : T.faint,
              }}
            >
              {m.v}
            </div>
          </React.Fragment>
        );
      })}

      <Field x={1230} y={390} w={200} h={80} label="7" sub="R1" color={T.blue} delay={at(2) + 26} fill />

      <Arrow from={[560, 308]} to={[770, 452]} color={T.blue} delay={at(2)} dashed curve={-0.12} />
      <Arrow from={[1096, 432]} to={[1222, 432]} color={T.blue} delay={at(2) + 22} />

      <Rule w={1660} color={T.line} delay={at(3)} style={{ position: "absolute", left: 128, top: 700 }} />
      <div style={{ position: "absolute", left: 128, top: 726 }}>
        <Write text="EA = A　地址就明写在指令里" delay={at(3) + 8} size={26} color={T.ink2} />
        <Write
          text="现代机器上这是虚拟地址 → 访存前还要过一遍地址翻译"
          delay={at(3) + 20}
          size={21}
          color={T.sub}
          style={{ marginTop: 12 }}
        />
      </div>

      <Subs sceneId="s13" />
    </Stage>
  );
};

// ==========================================================================
// s14 · ④ 间接寻址
// ==========================================================================
export const S14: React.FC = () => {
  const { at } = useCues("s14");

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 168 }}>
        <Write text="④ 间接寻址" delay={at(0)} size={38} color={T.ink} />
        <div style={{ marginTop: 4 }}>
          <Write text="INDIRECT" delay={at(0) + 10} size={16} color={T.purple} mono spacing={4} />
        </div>
      </div>

      {/* 路径 A：内存间接，两次访存 */}
      <div style={{ position: "absolute", left: 128, top: 260 }}>
        <Write text="内存间接" delay={at(1)} size={20} color={T.faint} mono spacing={2} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 300 }}>
        <span style={{ fontFamily: F.mono, fontSize: 28, color: T.ink2 }}>MOV R1, [[1000]]</span>
      </div>
      <Field x={620} y={296} w={190} h={68} label="1000" sub="地址" color={T.purple} delay={at(1) + 8} />
      <Field x={850} y={296} w={190} h={68} label="2000" sub="里面的值" color={T.purple} delay={at(1) + 16} fill />
      <Field x={1080} y={296} w={190} h={68} label="7" sub="数据" color={T.blue} delay={at(1) + 24} fill />

      <Arrow from={[596, 330]} to={[614, 330]} color={T.purple} delay={at(1) + 6} />
      <Arrow from={[812, 330]} to={[846, 330]} color={T.purple} delay={at(1) + 14} />
      <Arrow from={[1042, 330]} to={[1076, 330]} color={T.purple} delay={at(1) + 22} />
      <Chip x={1320} y={314} text="访存 2 次" color={T.orange} delay={at(1) + 30} />

      {/* 路径 B：寄存器间接，一次访存 */}
      <div style={{ position: "absolute", left: 128, top: 470 }}>
        <Write text="寄存器间接（最常见）" delay={at(2)} size={20} color={T.teal} mono spacing={2} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 510 }}>
        <span style={{ fontFamily: F.mono, fontSize: 28, color: T.ink2 }}>MOV R1, [R2]</span>
      </div>
      <Field x={620} y={506} w={190} h={68} label="R2" sub="= 2000" color={T.teal} delay={at(2) + 8} />
      <Field x={850} y={506} w={190} h={68} label="2000" sub="地址" color={T.teal} delay={at(2) + 16} />
      <Field x={1080} y={506} w={190} h={68} label="7" sub="数据" color={T.blue} delay={at(2) + 24} fill />

      <Arrow from={[812, 540]} to={[846, 540]} color={T.teal} delay={at(3)} />
      <Arrow from={[1042, 540]} to={[1076, 540]} color={T.teal} delay={at(3) + 8} />
      <Chip x={1320} y={524} text="访存 1 次" color={T.green} delay={at(3) + 16} />

      <div style={{ position: "absolute", left: 128, top: 660 }}>
        <Write text="指针、链表、函数指针 —— 能跑起来靠的就是它" delay={at(4)} size={24} color={T.ink2} />
      </div>

      <Subs sceneId="s14" />
    </Stage>
  );
};

// ==========================================================================
// s15 · ⑤ 基址寻址（栈帧）
// ==========================================================================
const FRAME_ROWS = [
  { off: "BP+6", name: "参数 2" },
  { off: "BP+4", name: "参数 1" },
  { off: "BP+2", name: "返回地址" },
  { off: "BP", name: "旧 BP" },
  { off: "BP−2", name: "局部变量 1" },
  { off: "BP−4", name: "局部变量 2" },
];

export const S15: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s15");

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 168 }}>
        <Write text="⑤ 基址寻址" delay={at(0)} size={38} color={T.ink} />
        <div style={{ marginTop: 4 }}>
          <Write text="BASE" delay={at(0) + 10} size={16} color={T.green} mono spacing={4} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 262 }}>
        <Write text="EA = (Base) + A" delay={at(0) + 14} size={34} color={T.green} mono />
        <Write text="基址不变，偏移量在变" delay={at(1)} size={21} color={T.sub} style={{ marginTop: 12 }} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 400, width: 380 }}>
        <Write text="BX → 数组 / 结构体的起点" delay={at(2)} size={20} color={T.sub} />
        <Write text="BP → 函数栈帧的栈底" delay={at(2) + 12} size={20} color={T.ink2} style={{ marginTop: 12 }} />
      </div>

      {FRAME_ROWS.map((r, i) => {
        const isParam = r.name === "参数 1";
        const isLocal = r.name === "局部变量 1";
        const isBP = r.name === "旧 BP";
        const hi = isParam ? T.yellow : isLocal ? T.blue : isBP ? T.green : T.line;
        return (
          <React.Fragment key={r.off}>
            <div
              style={{
                position: "absolute",
                left: 760,
                top: 260 + i * 80,
                width: 90,
                fontFamily: F.mono,
                fontSize: 19,
                color: hi === T.line ? T.faint : hi,
                opacity: p(f, at(2) + 16 + i * 5, 12),
                textAlign: "right",
              }}
            >
              {r.off}
            </div>
            <div
              style={{
                position: "absolute",
                left: 870,
                top: 260 + i * 80,
                width: 420,
                height: 64,
                borderRadius: 6,
                border: `1.5px solid ${hi}`,
                background: hi === T.line ? "transparent" : `${hi}1A`,
                opacity: p(f, at(2) + 16 + i * 5, 12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.cn,
                fontSize: 23,
                color: hi === T.line ? T.sub : hi,
              }}
            >
              {r.name}
            </div>
          </React.Fragment>
        );
      })}

      <Arrow from={[690, 520]} to={[742, 520]} color={T.green} delay={at(2) + 44} />

      <div style={{ position: "absolute", left: 1330, top: 400 }}>
        <Write text="高地址" delay={at(2) + 20} size={17} color={T.faint} mono />
        <div style={{ marginTop: 300 }}>
          <Write text="低地址" delay={at(2) + 20} size={17} color={T.faint} mono />
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 700 }}>
        <Write text="所以局部变量的地址，都是 BP 减一个常数" delay={at(5)} size={24} color={T.yellow} />
      </div>

      <Rule w={1660} color={T.line} delay={at(5) + 20} style={{ position: "absolute", left: 128, top: 770 }} />
      <div style={{ position: "absolute", left: 128, top: 796 }}>
        <Write text="MOV AX, [BP+4]" delay={at(5) + 28} size={24} color={T.yellow} mono />
        <Write text="→ 取到参数 1" delay={at(5) + 40} size={21} color={T.sub} style={{ marginTop: 8 }} />
      </div>

      <Subs sceneId="s15" />
    </Stage>
  );
};

// ==========================================================================
// s16 · ⑥ 变址寻址（数组）
// ==========================================================================
export const S16: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s16");
  const arr = ["10", "20", "30", "40", "50", "60"];
  const idxStart = at(3);
  const step = Math.max(18, Math.round((at(4) - at(3)) / 2));
  const active = Math.min(2, Math.max(0, Math.floor((f - idxStart) / step)));
  const CW = 140;
  const GAP = 12;
  const x0 = 560;
  const ay = 470;

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 168 }}>
        <Write text="⑥ 变址寻址" delay={at(0)} size={38} color={T.ink} />
        <div style={{ marginTop: 4 }}>
          <Write text="INDEXED" delay={at(0) + 10} size={16} color={T.orange} mono spacing={4} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 258 }}>
        <Write text="EA = (Index) + A" delay={at(0) + 14} size={34} color={T.orange} mono />
      </div>

      <div style={{ position: "absolute", left: 128, top: 370 }}>
        <Write text="BX 指起点不动" delay={at(2)} size={21} color={T.green} />
        <Write text="SI 一个个往后挪" delay={at(2) + 12} size={21} color={T.orange} style={{ marginTop: 10 }} />
      </div>

      <div style={{ position: "absolute", left: x0, top: 424, fontFamily: F.mono, fontSize: 18, color: T.green }}>
        BX
      </div>

      {arr.map((v, i) => {
        const lit = i <= active && f >= idxStart;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x0 + i * (CW + GAP),
                top: ay,
                width: CW,
                height: 92,
                borderRadius: 6,
                border: `1.5px solid ${lit ? T.orange : T.line}`,
                background: lit ? `${T.orange}1A` : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize: 30,
                color: lit ? T.orange : T.faint,
              }}
            >
              {v}
            </div>
            <div
              style={{
                position: "absolute",
                left: x0 + i * (CW + GAP),
                top: ay + 104,
                width: CW,
                textAlign: "center",
                fontFamily: F.mono,
                fontSize: 16,
                color: T.faint,
              }}
            >
              BX + {i * 2}
            </div>
          </React.Fragment>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: x0 + active * (CW + GAP),
          top: 424,
          width: CW,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 18,
          color: T.orange,
          opacity: p(f, idxStart - 10, 12),
        }}
      >
        SI = {[0, 2, 4][active]}
      </div>

      <Rule w={1660} color={T.line} delay={at(4)} style={{ position: "absolute", left: 128, top: 690 }} />

      <div style={{ position: "absolute", left: 128, top: 716 }}>
        <Write text="基址" delay={at(4) + 10} size={22} color={T.green} />
      </div>
      <div style={{ position: "absolute", left: 210, top: 714 }}>
        <Write text="EA = 基址 + 立即数偏移　→ 结构体、栈帧" delay={at(4) + 14} size={22} color={T.sub} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 762 }}>
        <Write text="变址" delay={at(4) + 22} size={22} color={T.orange} />
      </div>
      <div style={{ position: "absolute", left: 210, top: 760 }}>
        <Write text="EA = 变址 + 索引寄存器　→ 数组、循环" delay={at(4) + 26} size={22} color={T.sub} />
      </div>

      <Subs sceneId="s16" />
    </Stage>
  );
};

// ==========================================================================
// s17 · ⑦ 相对寻址（PC + offset）
// ==========================================================================
export const S17: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s17");

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 168 }}>
        <Write text="⑦ 相对寻址" delay={at(0)} size={38} color={T.ink} />
        <div style={{ marginTop: 4 }}>
          <Write text="PC-RELATIVE" delay={at(0) + 10} size={16} color={T.yellow} mono spacing={4} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 258 }}>
        <Write text="EA = (PC) + A" delay={at(0) + 14} size={34} color={T.yellow} mono />
        <Write text="PC 指的是「下一条指令」的地址" delay={at(1)} size={22} color={T.red} style={{ marginTop: 10 }} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 128,
          top: 420,
          width: 260,
          height: 86,
          borderRadius: 6,
          border: `1.5px solid ${T.yellow}`,
          background: `${T.yellow}16`,
          opacity: p(f, at(2), 14),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 20,
          color: T.yellow,
          gap: 2,
        }}
      >
        <span>0x1000</span>
        <span style={{ fontSize: 16, color: T.sub }}>je +0x18  (2 B)</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 404,
          top: 420,
          width: 220,
          height: 86,
          borderRadius: 6,
          border: `1.5px solid ${T.line}`,
          opacity: p(f, at(3), 14),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 20,
          color: T.sub,
        }}
      >
        0x1002
      </div>

      <div
        style={{
          position: "absolute",
          left: 1080,
          top: 420,
          width: 300,
          height: 86,
          borderRadius: 6,
          border: `1.5px solid ${T.green}`,
          background: `${T.green}14`,
          opacity: p(f, at(5), 14),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 20,
          color: T.green,
        }}
      >
        0x101A  call foo
      </div>

      <Arrow from={[392, 464]} to={[1070, 464]} color={T.yellow} delay={at(5) - 8} curve={-0.22} dashed />
      <div
        style={{
          position: "absolute",
          left: 392,
          top: 366,
          fontFamily: F.mono,
          fontSize: 17,
          color: T.yellow,
          opacity: p(f, at(5) - 10, 12),
        }}
      >
        +0x18
      </div>

      <Arrow from={[510, 520]} to={[510, 512]} color={T.red} delay={at(3) + 8} />
      <div
        style={{
          position: "absolute",
          left: 404,
          top: 528,
          width: 220,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 17,
          color: T.red,
          opacity: p(f, at(3) + 8, 12),
        }}
      >
        ↑ PC 停在这里
      </div>

      <div style={{ position: "absolute", left: 128, top: 610 }}>
        <div style={{ fontFamily: F.mono, fontSize: 30, color: T.ink2, opacity: p(f, at(4), 14) }}>
          <span style={{ color: T.red }}>0x1002</span>
          <span style={{ color: T.faint }}> + </span>
          <span style={{ color: T.yellow, opacity: p(f, at(4) + 14, 12) }}>0x18</span>
          <span style={{ color: T.faint }}> = </span>
          <span style={{ color: T.green, opacity: p(f, at(4) + 28, 12) }}>0x101A</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 700 }}>
        <Write text="程序装到哪都能跑 —— 指令相对距离不变，机器码不用改" delay={at(6)} size={23} color={T.ink2} />
        <Write text="这就是位置无关代码 PIC / 重定位" delay={at(6) + 18} size={21} color={T.sub} style={{ marginTop: 8 }} />
      </div>

      <Subs sceneId="s17" />
    </Stage>
  );
};

// ==========================================================================
// s18 · ⑧ 堆栈寻址
// ==========================================================================
export const S18: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s18");
  const slots = [
    { v: "返回地址", addr: "0x7FF8", push: false },
    { v: "参数 1", addr: "0x7FF4", push: false },
    { v: "5  ← AX", addr: "0x7FF0", push: true },
    { v: "旧 BP", addr: "0x7FEC", push: false },
  ];
  const SP_ROW = 2;

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 168 }}>
        <Write text="⑧ 堆栈寻址" delay={at(0)} size={38} color={T.ink} />
        <div style={{ marginTop: 4 }}>
          <Write text="STACK" delay={at(0) + 10} size={16} color={T.pink} mono spacing={4} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 280 }}>
        <Write text="SP 指向栈顶" delay={at(0) + 12} size={26} color={T.pink} mono />
        <Write text="EA = (SP)" delay={at(0) + 20} size={22} color={T.sub} mono style={{ marginTop: 12 }} />
      </div>

      {slots.map((s, i) => {
        const v = s.push ? p(f, at(1) + 10, 18) : 1;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: 720,
                top: 300 + i * 92,
                width: 100,
                textAlign: "right",
                fontFamily: F.mono,
                fontSize: 17,
                lineHeight: "76px",
                color: T.faint,
                opacity: s.push ? v : 0.8,
              }}
            >
              {s.addr}
            </div>
            <div
              style={{
                position: "absolute",
                left: 840,
                top: 300 + i * 92,
                width: 440,
                height: 76,
                borderRadius: 6,
                border: `1.5px solid ${s.push ? T.pink : T.line}`,
                background: s.push ? `${T.pink}1C` : "transparent",
                opacity: s.push ? v : 0.9,
                transform: `translateY(${s.push ? (1 - v) * -44 : 0}px)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.cn,
                fontSize: 24,
                color: s.push ? T.pink : T.sub,
              }}
            >
              {s.v}
            </div>
          </React.Fragment>
        );
      })}

      <Arrow from={[690, 300 + SP_ROW * 92 + 38]} to={[832, 300 + SP_ROW * 92 + 38]} color={T.pink} delay={at(0) + 24} />
      <div
        style={{
          position: "absolute",
          left: 610,
          top: 300 + SP_ROW * 92 + 20,
          fontFamily: F.mono,
          fontSize: 20,
          color: T.pink,
        }}
      >
        SP
      </div>

      <div style={{ position: "absolute", left: 1400, top: 320 }}>
        <Write text="PUSH：栈顶下移，数据压入" delay={at(1)} size={21} color={T.ink2} />
        <Write text="POP：数据弹出，栈顶上移" delay={at(1) + 20} size={21} color={T.ink2} style={{ marginTop: 14 }} />
      </div>

      <Rule w={1660} color={T.line} delay={at(2)} style={{ position: "absolute", left: 128, top: 730 }} />
      <div style={{ position: "absolute", left: 128, top: 758 }}>
        <Write text="后进先出 → 函数调用、现场保护，全靠这一套" delay={at(2) + 10} size={27} color={T.yellow} />
      </div>

      <Subs sceneId="s18" />
    </Stage>
  );
};

// ==========================================================================
// s19 · 八种寻址一张表
// ==========================================================================
export const S19: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s19");

  return (
    <Stage label="第 2 幕 · 寻址方式">
      <div style={{ position: "absolute", left: 128, top: 138 }}>
        <Write text="八种寻址 · 一张表" delay={at(0)} size={32} color={T.ink} />
      </div>

      <Table
        x={128}
        y={200}
        delay={at(0) + 12}
        stagger={9}
        rowH={58}
        size={22}
        cols={[
          { label: "寻址方式", w: 300 },
          { label: "有效地址 / 操作数", w: 460 },
          { label: "访存", w: 110, align: "center" },
          { label: "典型用途", w: 520 },
        ]}
        rows={[
          { cells: ["立即寻址", "操作数就在指令里", "0", "常量、初始化"], color: T.purple },
          { cells: ["寄存器寻址", "操作数在寄存器里", "0", "变量、中间结果"], color: T.teal },
          { cells: ["直接寻址", "EA = A", "1", "固定内存单元、外设端口"], color: T.blue },
          { cells: ["间接寻址", "EA = (A)", "2", "指针、链表（寄存器间接为 1）"], color: T.purple },
          { cells: ["基址寻址", "EA = (Base) + A", "1", "栈帧、结构体"], color: T.green },
          { cells: ["变址寻址", "EA = (Index) + A", "1", "数组、循环遍历"], color: T.orange },
          { cells: ["相对寻址", "EA = (PC) + A", "1", "分支、跳转、PIC"], color: T.yellow },
          { cells: ["堆栈寻址", "EA = (SP)", "1", "PUSH / POP / 调用返回"], color: T.pink },
        ]}
      />

      <Rule w={1660} color={T.line} delay={at(4)} style={{ position: "absolute", left: 128, top: 790 }} />

      <div style={{ position: "absolute", left: 128, top: 820 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 26, opacity: 1 }}>
          <Write text="格式" delay={at(5)} size={30} color={T.blue} />
          <span style={{ fontFamily: F.cn, fontSize: 24, color: T.sub, opacity: p(f, at(5) + 6, 14) }}>
            决定这条指令怎么读
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 22, color: T.faint, opacity: p(f, at(5) + 12, 14) }}>
            /
          </span>
          <Write text="寻址" delay={at(5) + 16} size={30} color={T.orange} />
          <span style={{ fontFamily: F.cn, fontSize: 24, color: T.sub, opacity: p(f, at(5) + 22, 14) }}>
            决定数据去哪里取
          </span>
        </div>
      </div>

      <Fade delay={at(6)} y={8} style={{ position: "absolute", left: 128, top: 892 }}>
        <span style={{ fontFamily: F.cn, fontSize: 26, color: T.sub }}>
          把这两件事分清楚，指令系统这一章就立住了。
        </span>
      </Fade>

      <Subs sceneId="s19" />
    </Stage>
  );
};
