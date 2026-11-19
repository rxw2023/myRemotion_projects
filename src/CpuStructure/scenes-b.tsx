import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Bits, Fade, Rule, Stage, Subs, Table, Write, p, useCues } from "../shared/b3b/ui";
import { Add8, Bus, C, ChipPins, Elem, Flags16, Head, SegMem, StackFrames, Title } from "./parts";

// ==========================================================================
// s07 · 8086 全景：一条横线切开，上面走数据，下面发命令
// ==========================================================================
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s07");

  const ctrls = [
    { t: "指令译码器", x: 344 },
    { t: "时序控制单元", x: 704 },
    { t: "标志控制逻辑", x: 1064 },
    { t: "微指令控制逻辑", x: 1424 },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={160} text="8086 · 数据通路与控制器" color={T.ink2} delay={at(0)} size={19} />

      <div style={{ position: "absolute", left: 140, top: 196, opacity: p(f, at(0) + 6, 18) }}>
        <div style={{ fontFamily: F.mono, fontSize: 40, color: T.ink2, letterSpacing: 6 }}>8086</div>
        <div style={{ fontFamily: F.cn, fontSize: 15, color: T.faint, marginTop: 6, lineHeight: 1.7 }}>
          Intel 首款 16 位
          <br />
          x86 的起点
        </div>
      </div>

      {/* 外框 */}
      <div
        style={{
          position: "absolute",
          left: 320,
          top: 200,
          width: 1470,
          height: 610,
          borderRadius: 14,
          border: `1px solid ${T.line}`,
          opacity: p(f, at(0) + 10, 20),
        }}
      />

      {/* 数据通路区 */}
      <div
        style={{
          position: "absolute",
          left: 344,
          top: 224,
          fontFamily: F.mono,
          fontSize: 15,
          letterSpacing: 2.6,
          color: C.comb,
          opacity: p(f, at(2), 16),
        }}
      >
        DATAPATH
      </div>

      <Elem x={360} y={264} w={300} h={100} title="指令队列" sub="instruction queue" color={C.comb} delay={at(2) + 8} clk />
      <Elem
        x={700}
        y={264}
        w={420}
        h={100}
        title="寄存器"
        sub="十六个可见寄存器"
        color={C.reg}
        delay={at(2) + 16}
        clk
        subSize={13}
      />
      <Elem x={1160} y={264} w={240} h={100} title="内总线" sub="internal bus" color={C.bus} delay={at(2) + 24} />
      <Bus x={380} y={420} w={1380} delay={at(2) + 30} drops={[0.02, 0.14, 0.34, 0.62, 0.9]} dir={-1} dropLen={40} />

      {/* 预取：总线空闲时提前取 */}
      <Arrow from={[510, 420]} to={[510, 368]} color={`${C.mem}AA`} delay={at(3) + 10} dashed />
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 376,
          fontFamily: F.cn,
          fontSize: 15,
          color: C.mem,
          opacity: p(f, at(3) + 18, 16),
        }}
      >
        总线空着就先取几条存着 —— 预取
      </div>

      {/* 分界 */}
      <div
        style={{
          position: "absolute",
          left: 320,
          top: 512,
          width: 1470 * p(f, at(5), 30),
          height: 2,
          background: T.ink2,
          opacity: 0.55,
        }}
      />

      {/* 控制器区 */}
      <div
        style={{
          position: "absolute",
          left: 344,
          top: 536,
          fontFamily: F.mono,
          fontSize: 15,
          letterSpacing: 2.6,
          color: C.ctrl,
          opacity: p(f, at(4), 16),
        }}
      >
        CONTROL UNIT
      </div>
      {ctrls.map((c, i) => (
        <Elem
          key={c.t}
          x={c.x}
          y={580}
          w={320}
          h={92}
          title={c.t}
          color={C.ctrl}
          delay={at(4) + 8 + i * 10}
          size={22}
        />
      ))}

      {/* 两根竖线的意义：控制信号向上 */}
      {[504, 864, 1224, 1584].map((x, i) => (
        <Arrow key={x} from={[x, 576]} to={[x, 524]} color={`${C.ctrl}77`} delay={at(5) + 16 + i * 4} sw={1.6} head={8} />
      ))}

      {/* 收口 */}
      <div style={{ position: "absolute", left: 320, top: 828 }}>
        <Write text="问位置，不问名字" delay={at(6)} dur={24} size={34} weight={500} color={T.ink2} />
        <Fade delay={at(6) + 20} y={8}>
          <div style={{ fontFamily: F.cn, fontSize: 17, color: T.sub, marginTop: 10 }}>
            它在数据通路里，还是在控制器里 —— 先分这一层
          </div>
        </Fade>
      </div>

      <Subs sceneId="s07" />
    </Stage>
  );
};

// ==========================================================================
// s08 · 寄存器五类 + 可见性
// ==========================================================================
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s08");

  const groups = [
    { k: "通用", v: "AX   BX   CX   DX", note: "累加 / 基址 / 计数 / 数据", c: C.reg },
    { k: "段", v: "CS   DS   SS   ES", note: "指向四个段的起点", c: C.mem },
    { k: "变址", v: "SI   DI", note: "源变址 / 目的变址", c: T.teal },
    { k: "指针", v: "SP   BP   IP", note: "栈顶 / 栈底 / 下一条指令", c: C.pc },
    { k: "标志", v: "FLAGS", note: "十六位，九位有效", c: C.flag },
  ];

  const visible = ["通用寄存器", "段寄存器", "标志寄存器", "IP"];
  const hidden = ["MAR 地址寄存器", "MDR 数据寄存器", "IR 指令寄存器", "T 暂存器"];

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={160} text="寄存器 · 按功能分五类" color={C.reg} delay={at(0)} size={19} />

      {groups.map((g, i) => {
        const d = at([1, 2, 3, 3, 4, 5][i] ?? 1) + (i === 0 ? 0 : 6);
        const v = p(f, d, 18);
        return (
          <div key={g.k} style={{ position: "absolute", left: 150, top: 210 + i * 106, opacity: v, transform: `translateX(${(1 - v) * 14}px)` }}>
            <Rule w={760} color={T.line} delay={d} dur={20} style={{ position: "absolute", left: 0, top: 84 }} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
              <span style={{ fontFamily: F.cn, fontSize: 22, color: g.c, width: 66, letterSpacing: 2 }}>{g.k}</span>
              <span style={{ fontFamily: F.mono, fontSize: 25, color: T.ink2, letterSpacing: 2.4, width: 350 }}>{g.v}</span>
              <span style={{ fontFamily: F.cn, fontSize: 15, color: T.faint }}>{g.note}</span>
            </div>
          </div>
        );
      })}

      {/* 特殊寄存器 */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 748,
          opacity: p(f, at(6), 18),
          display: "flex",
          gap: 18,
        }}
      >
        <div
          style={{
            padding: "12px 20px",
            borderRadius: 9,
            border: `1.5px dashed ${T.faint}88`,
            fontFamily: F.mono,
            fontSize: 18,
            color: T.ink2,
          }}
        >
          IR 指令寄存器
        </div>
        <div
          style={{
            padding: "12px 20px",
            borderRadius: 9,
            border: `1.5px dashed ${T.faint}88`,
            fontFamily: F.mono,
            fontSize: 18,
            color: T.ink2,
          }}
        >
          T 暂存器
        </div>
        <div style={{ fontFamily: F.cn, fontSize: 16, color: T.faint, alignSelf: "center", marginLeft: 10 }}>
          两个不属于那五类，但一直在数据通路上干活
        </div>
      </div>

      {/* 可见性面板 */}
      <div
        style={{
          position: "absolute",
          left: 1030,
          top: 210,
          width: 750,
          height: 620,
          borderRadius: 14,
          border: `1px solid ${T.line}`,
          background: "rgba(255,255,255,0.018)",
          opacity: p(f, at(7) - 10, 20),
        }}
      />
      <div style={{ position: "absolute", left: 1070, top: 240 }}>
        <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 2.4, color: T.faint, opacity: p(f, at(7), 14) }}>
          汇编里能直接写名字吗
        </div>
      </div>

      <div style={{ position: "absolute", left: 1070, top: 286, opacity: p(f, at(7) + 8, 18) }}>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: C.reg, letterSpacing: 1.4, marginBottom: 14 }}>可见</div>
        {visible.map((t, i) => (
          <div
            key={t}
            style={{
              fontFamily: F.cn,
              fontSize: 19,
              color: T.ink2,
              marginBottom: 12,
              opacity: p(f, at(7) + 10 + i * 4, 14),
            }}
          >
            <span style={{ color: C.reg, marginRight: 12 }}>·</span>
            {t}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 1470, top: 286, opacity: p(f, at(8) + 4, 18) }}>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: T.faint, letterSpacing: 1.4, marginBottom: 14 }}>不可见</div>
        {hidden.map((t, i) => (
          <div
            key={t}
            style={{
              fontFamily: F.cn,
              fontSize: 19,
              color: T.sub,
              marginBottom: 12,
              opacity: p(f, at(8) + i * 5, 14),
            }}
          >
            <span style={{ color: T.faint, marginRight: 12 }}>×</span>
            {t}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 1432,
          top: 210 + 4,
          width: 1,
          height: 560 * p(f, at(8), 24),
          background: T.line,
        }}
      />

      {/* 底部结论 */}
      <div
        style={{
          position: "absolute",
          left: 1070,
          top: 740,
          fontFamily: F.cn,
          fontSize: 17,
          color: T.faint,
          width: 660,
          lineHeight: 1.7,
          opacity: p(f, at(8) + 20, 16),
        }}
      >
        编译器只能用它们 —— 剩下的都是硬件内部的搬运工
      </div>

      <Subs sceneId="s08" />
    </Stage>
  );
};

// ==========================================================================
// s09 · CS:IP —— 程序计数器不是一个寄存器
// ==========================================================================
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s09");

  const CS = "0001000000000000";
  const IP = "0000000000100011";
  const SHIFT = "00010000000000000000";
  const IPadd = "00000000000000100011";
  const SUM = "00010000000000100011";

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={158} text="CS : IP · 十六位拼出二十位" color={C.pc} delay={at(0)} size={19} />

      <div style={{ position: "absolute", left: 150, top: 198 }}>
        <Write text="PC 在 8086 里是一对" delay={at(0) + 6} dur={26} size={36} weight={500} color={T.ink} />
      </div>

      {/* CS */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 300,
          fontFamily: F.mono,
          fontSize: 20,
          color: C.pc,
          letterSpacing: 2,
          opacity: p(f, at(1), 14),
        }}
      >
        CS
      </div>
      <Bits bits={CS} x={210} y={292} cw={34} ch={46} delay={at(1) + 6} color={`${C.pc}CC`} size={17} />
      <div
        style={{
          position: "absolute",
          left: 870,
          top: 300,
          fontFamily: F.mono,
          fontSize: 16,
          color: T.faint,
          opacity: p(f, at(1) + 20, 14),
        }}
      >
        段起点 · 0x1000
      </div>

      {/* IP */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 392,
          fontFamily: F.mono,
          fontSize: 20,
          color: C.pc,
          letterSpacing: 2,
          opacity: p(f, at(1) + 10, 14),
        }}
      >
        IP
      </div>
      <Bits bits={IP} x={210} y={384} cw={34} ch={46} delay={at(1) + 16} color={`${C.pc}CC`} size={17} />
      <div
        style={{
          position: "absolute",
          left: 870,
          top: 392,
          fontFamily: F.mono,
          fontSize: 16,
          color: T.faint,
          opacity: p(f, at(1) + 30, 14),
        }}
      >
        段内偏移 · 0x0023
      </div>

      {/* 16 → 20 */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 500,
          fontFamily: F.cn,
          fontSize: 18,
          color: T.sub,
          opacity: p(f, at(2), 16),
        }}
      >
        地址总线二十位，差四位 —— 由段寄存器补
      </div>

      {/* 左移四位 */}
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 556,
          fontFamily: F.mono,
          fontSize: 17,
          color: C.pc,
          letterSpacing: 1.4,
          opacity: p(f, at(3), 16),
        }}
      >
        CS &lt;&lt; 4
      </div>
      <Bits bits={SHIFT} x={400} y={548} cw={30} ch={40} delay={at(3) + 6} color={`${C.pc}77`} size={15} paint={{ 16: C.pc, 17: C.pc, 18: C.pc, 19: C.pc }} />
      <div
        style={{
          position: "absolute",
          left: 1100,
          top: 556,
          fontFamily: F.mono,
          fontSize: 15,
          color: T.faint,
          opacity: p(f, at(3) + 20, 14),
        }}
      >
        后面补四个零 = 乘 16
      </div>

      {/* 加 IP */}
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 624,
          fontFamily: F.mono,
          fontSize: 17,
          color: T.ink2,
          letterSpacing: 1.4,
          opacity: p(f, at(3) + 16, 16),
        }}
      >
        + IP
      </div>
      <Bits bits={IPadd} x={400} y={616} cw={30} ch={40} delay={at(3) + 22} color={`${T.ink2}88`} size={15} />
      <div style={{ position: "absolute", left: 400, top: 666, width: 680, height: 1.4, background: T.line, opacity: p(f, at(3) + 30, 12) }} />

      {/* 结果 */}
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 700,
          fontFamily: F.mono,
          fontSize: 17,
          color: C.key,
          letterSpacing: 1.4,
          opacity: p(f, at(4), 16),
        }}
      >
        PA
      </div>
      <Bits bits={SUM} x={400} y={692} cw={30} ch={40} delay={at(4) + 6} color={C.key} size={15} />
      <div
        style={{
          position: "absolute",
          left: 1100,
          top: 700,
          fontFamily: F.mono,
          fontSize: 18,
          color: C.key,
          letterSpacing: 1.6,
          opacity: p(f, at(4) + 20, 16),
        }}
      >
        = 0x10023
      </div>

      {/* IP 自增 */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 800,
          width: 760,
          opacity: p(f, at(5), 18),
        }}
      >
        <div style={{ fontFamily: F.cn, fontSize: 18, color: T.sub, lineHeight: 1.7 }}>
          取指完成，IP 自动加上这条指令的长度
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 17, color: C.pc, marginTop: 8, letterSpacing: 1.4 }}>
          IP += 指令长度 → CS:IP 指向下一条
        </div>
      </div>

      {/* 右栏：三种改法 */}
      <div style={{ position: "absolute", left: 1240, top: 300, width: 540, opacity: p(f, at(6), 18) }}>
        <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 2.4, color: T.faint, marginBottom: 18 }}>
          谁会改这一对
        </div>
        {[
          { t: "JMP", d: "改 IP，段内跳" },
          { t: "CALL / RET", d: "压栈、弹栈再改 IP" },
          { t: "INT", d: "CS 和 IP 一起换" },
        ].map((r, i) => (
          <div key={r.t} style={{ marginBottom: 22, opacity: p(f, at(6) + 10 + i * 10, 16) }}>
            <div style={{ fontFamily: F.mono, fontSize: 21, color: C.ctrl, letterSpacing: 1.4 }}>{r.t}</div>
            <div style={{ fontFamily: F.cn, fontSize: 16, color: T.sub, marginTop: 4 }}>{r.d}</div>
          </div>
        ))}
      </div>

      <Subs sceneId="s09" />
    </Stage>
  );
};

// ==========================================================================
// s10 · 段 / 栈帧 / 变址
// ==========================================================================
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s10");

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={158} text="段寄存器 · 指针 · 变址" color={C.mem} delay={at(0)} size={19} />

      {/* 左：四个段 */}
      <div style={{ position: "absolute", left: 150, top: 206 }}>
        <Title x={0} y={0} zh="四个段" en="SEGMENTS" color={C.mem} delay={at(0) + 6} size={26} />
      </div>
      <SegMem x={340} y={268} w={250} h={72} delay={at(0) + 14} active="SS" />

      {/* 中：栈帧 */}
      <div style={{ position: "absolute", left: 760, top: 206 }}>
        <Title x={0} y={0} zh="栈帧" en="STACK FRAMES" color={C.reg} delay={at(2) + 4} size={26} />
      </div>
      <StackFrames x={790} y={276} w={280} delay={at(3)} />
      <div
        style={{
          position: "absolute",
          left: 790,
          top: 512,
          fontFamily: F.cn,
          fontSize: 16,
          color: T.faint,
          opacity: p(f, at(3) + 26, 16),
        }}
      >
        调用一层，往上叠一层 —— 从高地址往低地址长
      </div>

      {/* 右：数组 + SI */}
      <div style={{ position: "absolute", left: 1300, top: 206 }}>
        <Title x={0} y={0} zh="变址" en="INDEXED" color={T.teal} delay={at(4) + 4} size={26} />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 1330 + i * 104,
            top: 300,
            width: 92,
            height: 64,
            borderRadius: 7,
            border: `1.5px solid ${i < 2 ? T.teal : `${T.teal}55`}`,
            background: i < 2 ? `${T.teal}16` : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 17,
            color: i < 2 ? T.teal : T.faint,
            opacity: p(f, at(4) + 12 + i * 6, 14),
          }}
        >
          [{i}]
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 1330,
          top: 380,
          fontFamily: F.mono,
          fontSize: 18,
          color: T.teal,
          letterSpacing: 1.6,
          opacity: p(f, at(4) + 24, 16),
        }}
      >
        SI → arr[0]
      </div>

      {/* 字符串：SI 源 / DI 目的 */}
      <div style={{ position: "absolute", left: 1300, top: 470, opacity: p(f, at(5), 18) }}>
        <div style={{ fontFamily: F.mono, fontSize: 17, color: T.faint, letterSpacing: 1.4, marginBottom: 12 }}>
          REP MOVSB
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: F.mono, fontSize: 17 }}>
          <span style={{ color: T.teal }}>DS:SI</span>
          <span style={{ color: T.faint }}>源</span>
          <span style={{ color: T.faint }}>→</span>
          <span style={{ color: C.mem }}>ES:DI</span>
          <span style={{ color: T.faint }}>目的</span>
        </div>
      </div>

      {/* 收口 */}
      <div style={{ position: "absolute", left: 150, top: 640 }}>
        <div
          style={{
            display: "flex",
            gap: 28,
            opacity: p(f, at(6), 20),
          }}
        >
          <div
            style={{
              width: 520,
              padding: "18px 22px",
              borderRadius: 10,
              border: `1px solid ${C.mem}55`,
              background: `${C.mem}0E`,
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 16, color: C.mem, letterSpacing: 1.6 }}>段寄存器</div>
            <div style={{ fontFamily: F.cn, fontSize: 19, color: T.ink2, marginTop: 8 }}>回答"在哪一段"</div>
          </div>
          <div
            style={{
              width: 520,
              padding: "18px 22px",
              borderRadius: 10,
              border: `1px solid ${C.pc}55`,
              background: `${C.pc}0E`,
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 16, color: C.pc, letterSpacing: 1.6 }}>指针 / 变址</div>
            <div style={{ fontFamily: F.cn, fontSize: 19, color: T.ink2, marginTop: 8 }}>回答"段内哪个位置"</div>
          </div>
        </div>
      </div>

      <Subs sceneId="s10" />
    </Stage>
  );
};

// ==========================================================================
// s11 · 标志寄存器：CF 与 OF 是同一组比特的两种解释
// ==========================================================================
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s11");

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={152} text="FLAGS · 十六位里只有九位有用" color={C.flag} delay={at(0)} size={19} />

      <Flags16 x={190} y={244} cw={78} ch={72} delay={at(0) + 8} focus={["OF", "DF", "IF", "TF", "SF", "ZF", "AF", "PF", "CF"]} />

      {/* 条件标志 */}
      <div style={{ position: "absolute", left: 190, top: 400, opacity: p(f, at(1), 18) }}>
        <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 2.4, color: C.flag, marginBottom: 12 }}>
          CONDITIONAL · 六位
        </div>
        <div style={{ display: "flex", gap: 22, fontFamily: F.mono, fontSize: 18, color: T.ink2 }}>
          {[
            ["OF", "溢出"],
            ["SF", "符号"],
            ["ZF", "零"],
            ["AF", "辅助进位"],
            ["PF", "奇偶"],
            ["CF", "进位"],
          ].map(([k, zh], i) => (
            <div key={k} style={{ opacity: p(f, at(1) + 10 + i * 6, 14) }}>
              <div style={{ color: C.flag, fontSize: 20 }}>{k}</div>
              <div style={{ fontFamily: F.cn, fontSize: 14, color: T.faint, marginTop: 4 }}>{zh}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 控制标志 */}
      <div style={{ position: "absolute", left: 190, top: 520, opacity: p(f, at(2), 18) }}>
        <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 2.4, color: C.ctrl, marginBottom: 12 }}>
          CONTROL · 三位
        </div>
        <div style={{ display: "flex", gap: 30, fontFamily: F.mono, fontSize: 18, color: T.ink2 }}>
          {[
            ["IF", "中断允许"],
            ["TF", "单步"],
            ["DF", "字符串方向"],
          ].map(([k, zh], i) => (
            <div key={k} style={{ opacity: p(f, at(2) + 10 + i * 6, 14) }}>
              <div style={{ color: C.ctrl, fontSize: 20 }}>{k}</div>
              <div style={{ fontFamily: F.cn, fontSize: 14, color: T.faint, marginTop: 4 }}>{zh}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: F.cn, fontSize: 15, color: T.faint, marginTop: 14 }}>
          这三个不会自动改 —— 得用专门的指令去设
        </div>
      </div>

      {/* 条件标志的用途：自动设置 → 条件跳转读走 */}
      <div style={{ position: "absolute", left: 190, top: 660, opacity: p(f, at(3), 18) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: F.mono, fontSize: 17, color: C.comb }}>ALU / CMP</div>
          <div style={{ width: 60, height: 1.4, background: `${T.faint}88` }} />
          <div style={{ fontFamily: F.mono, fontSize: 17, color: C.flag }}>FLAGS 自动置位</div>
          <div style={{ width: 60, height: 1.4, background: `${T.faint}88` }} />
          <div style={{ fontFamily: F.mono, fontSize: 17, color: C.pc }}>Jcc 读走</div>
        </div>
      </div>

      {/* 右：CF / OF */}
      <div
        style={{
          position: "absolute",
          left: 1150,
          top: 400,
          width: 640,
          opacity: p(f, at(4), 18),
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 2.4, color: T.faint, marginBottom: 16 }}>
          同一组比特 · 两种解释
        </div>
      </div>
      <Add8 x={1160} y={452} delay={at(6)} />
      <div style={{ position: "absolute", left: 1560, top: 470, width: 240, opacity: p(f, at(5), 18) }}>
        <div style={{ fontFamily: F.cn, fontSize: 16, color: C.flag, lineHeight: 1.7 }}>
          CF：最高位有没有
          <br />
          向外面进位
        </div>
        <div style={{ fontFamily: F.cn, fontSize: 16, color: C.key, lineHeight: 1.7, marginTop: 22 }}>
          OF：符号位有没有
          <br />
          被算出矛盾
        </div>
      </div>

      {/* 收口 */}
      <div style={{ position: "absolute", left: 1150, top: 780 }}>
        <Write text="硬件只记录" delay={at(8)} dur={22} size={32} weight={500} color={T.ink2} />
        <Fade delay={at(8) + 18} y={6}>
          <div style={{ fontFamily: F.cn, fontSize: 17, color: T.sub, marginTop: 8 }}>
            要说成有符号还是无符号 —— 那是程序的事
          </div>
        </Fade>
      </div>

      <Subs sceneId="s11" />
    </Stage>
  );
};

// ==========================================================================
// s12 · 引脚：CPU 跟外部世界握手
// ==========================================================================
export const S12: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s12");

  const pins = [
    { k: "AD0–AD15", v: "地址 / 数据复用（分时）", c: C.bus, d: 1 },
    { k: "A16/S3–A19/S6", v: "高位地址 / 状态复用", c: C.bus, d: 2 },
    { k: "ALE", v: "地址锁存使能 —— 把地址扣下来", c: C.ctrl, d: 2 },
    { k: "NMI / INTR", v: "不可屏蔽 / 可屏蔽中断请求", c: C.key, d: 3 },
    { k: "INTA#", v: "中断应答", c: C.key, d: 3 },
    { k: "READY", v: "外设没就绪，CPU 等一等", c: C.comb, d: 4 },
    { k: "HOLD / HLDA", v: "总线请求 / 让出总线", c: C.comb, d: 4 },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={158} text="引脚 · 与外部世界的接口" color={T.ink2} delay={at(0)} size={19} />
      <div
        style={{
          position: "absolute",
          left: 1520,
          top: 150,
          fontFamily: F.cn,
          fontSize: 15,
          color: T.faint,
          opacity: p(f, at(0) + 10, 16),
        }}
      >
        了解为主 · 试题少考
      </div>

      <ChipPins
        x={300}
        y={244}
        w={300}
        h={520}
        delay={at(1)}
        hot={[2, 3, 4, 5, 6, 7, 8, 9]}
        hotColor={C.comb}
      />
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 792,
          width: 600,
          fontFamily: F.cn,
          fontSize: 16,
          color: T.sub,
          lineHeight: 1.8,
          opacity: p(f, at(1) + 20, 16),
        }}
      >
        十六位数据、二十位地址，
        <br />
        引脚不够用 —— 只能复用时序上错开
      </div>

      {/* 右：引脚表 */}
      <div style={{ position: "absolute", left: 760, top: 240 }}>
        {pins.map((r, i) => (
          <div
            key={r.k}
            style={{
              position: "absolute",
              left: 0,
              top: i * 74,
              opacity: p(f, at(r.d) + 8 + i * 4, 16),
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 20, color: r.c, letterSpacing: 0.8 }}>{r.k}</div>
            <div style={{ fontFamily: F.cn, fontSize: 16, color: T.sub, marginTop: 5 }}>{r.v}</div>
          </div>
        ))}
      </div>

      {/* 收口 */}
      <div style={{ position: "absolute", left: 1300, top: 780, width: 500, opacity: p(f, at(5), 20) }}>
        <div style={{ fontFamily: F.cn, fontSize: 21, color: T.ink2, letterSpacing: 1 }}>
          握手，是硬件层面的礼貌
        </div>
        <div style={{ fontFamily: F.cn, fontSize: 16, color: T.faint, marginTop: 10, lineHeight: 1.7 }}>
          谁先说、谁先说完了、对方顶不顶得住 ——
          <br />
          全在这几十根线的电平里
        </div>
      </div>

      <Subs sceneId="s12" />
    </Stage>
  );
};

// ==========================================================================
// s13 · 收口表：三列问题，一张表
// ==========================================================================
export const S13: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s13");

  const rows: { n: string; clk: boolean; mem: boolean; vis: boolean; c: string }[] = [
    { n: "ALU", clk: false, mem: false, vis: false, c: C.comb },
    { n: "译码器", clk: false, mem: false, vis: false, c: C.comb },
    { n: "多路选择器", clk: false, mem: false, vis: false, c: C.comb },
    { n: "三态门", clk: false, mem: false, vis: false, c: C.comb },
    { n: "通用寄存器组", clk: true, mem: true, vis: true, c: C.reg },
    { n: "程序计数器 CS:IP", clk: true, mem: true, vis: true, c: C.pc },
    { n: "标志寄存器", clk: true, mem: true, vis: true, c: C.flag },
    { n: "IR 指令寄存器", clk: true, mem: true, vis: false, c: T.ink2 },
    { n: "T 暂存器", clk: true, mem: true, vis: false, c: T.ink2 },
    { n: "MAR / MDR", clk: true, mem: true, vis: false, c: T.ink2 },
  ];

  const mark = (v: boolean, c: string, d: number) =>
    v ? (
      <span style={{ color: c, fontSize: 26, opacity: p(f, d, 14) }}>✓</span>
    ) : (
      <span style={{ color: T.faint, fontSize: 24, opacity: p(f, d, 14) }}>—</span>
    );

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={148} text="收口 · 一张表回答三个问题" color={T.ink2} delay={at(0)} size={19} />

      <Table
        x={260}
        y={200}
        delay={at(1)}
        stagger={9}
        rowH={52}
        size={20}
        cols={[
          { label: "元件", w: 460 },
          { label: "靠时钟？", w: 300, align: "center" },
          { label: "有记忆？", w: 300, align: "center" },
          { label: "程序员可见？", w: 360, align: "center" },
        ]}
        rows={rows.map((r, i) => {
          const d = at(i < 4 ? 3 : i < 7 ? 4 : 5) + 8 + (i % 4) * 8;
          return {
            cells: [
              <span key="n" style={{ fontFamily: F.cn, fontSize: 20, color: r.c, letterSpacing: 0.6 }}>
                {r.n}
              </span>,
              <span key="c">{mark(r.clk, T.yellow, d)}</span>,
              <span key="m">{mark(r.mem, r.c, d + 4)}</span>,
              <span key="v">{mark(r.vis, T.ink2, d + 8)}</span>,
            ],
          };
        })}
      />

      {/* 右下结论 */}
      <div style={{ position: "absolute", left: 260, top: 818 }}>
        <Write text="结构是被逼出来的" delay={at(7)} dur={26} size={38} weight={500} color={T.ink} />
        <Fade delay={at(7) + 22} y={8}>
          <div style={{ fontFamily: F.cn, fontSize: 18, color: T.sub, marginTop: 12, letterSpacing: 0.5 }}>
            总线有多宽、时钟怎么走 —— 决定了下面每一行长什么样
          </div>
        </Fade>
      </div>

      <Subs sceneId="s13" />
    </Stage>
  );
};
