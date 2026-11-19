import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Fade, Rule, Stage, Subs, Write, p, useCues } from "../shared/b3b/ui";
import { Beats, Bus, C, ClkIcon, Decode, Elem, Head, Kv, Mux, Note, TriGate } from "./parts";

// ==========================================================================
// s00 · 主题页：三段目录 + 主线
// ==========================================================================
export const S00: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s00");

  const toc = [
    { n: 1, zh: "两分法", note: "datapath + control unit" },
    { n: 2, zh: "两种元件", note: "combinational · sequential" },
    { n: 3, zh: "八零八六", note: "registers · pins" },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <div style={{ position: "absolute", left: 140, top: 148 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 18,
            letterSpacing: 3.4,
            color: T.faint,
            opacity: p(f, at(0), 16),
          }}
        >
          CENTRAL PROCESSING UNIT
        </div>

        <Write
          text="CPU 的结构"
          delay={at(1) + 6}
          dur={30}
          size={94}
          weight={600}
          spacing={6}
          style={{ marginTop: 16, textShadow: `0 0 90px ${T.blue}22` }}
        />

        <Rule w={680} color={`${T.blue}88`} h={2} delay={at(1) + 24} dur={34} style={{ marginTop: 22 }} />
      </div>

      {/* 三段目录 */}
      <div style={{ position: "absolute", left: 140, top: 430 }}>
        {toc.map((t, i) => {
          const d = at(3) + i * 42;
          const v = p(f, d, 16);
          return (
            <div key={t.n} style={{ position: "absolute", left: 0, top: i * 94, opacity: v, whiteSpace: "nowrap" }}>
              <Rule w={820} color={T.line} delay={d} dur={22} style={{ position: "absolute", left: 0, top: 56 }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 18, transform: `translateX(${(1 - v) * 12}px)` }}>
                <span style={{ fontFamily: F.mono, fontSize: 17, color: T.teal, letterSpacing: 1.2 }}>0{t.n}</span>
                <span style={{ fontFamily: F.cn, fontSize: 31, color: T.ink, width: 190, letterSpacing: 1 }}>{t.zh}</span>
                <span style={{ fontFamily: F.mono, fontSize: 15, color: T.faint, letterSpacing: 0.6 }}>{t.note}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 右边：一条总线，上面挂着三个部件 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
        <div
          style={{
            position: "absolute",
            left: 1120,
            top: 396,
            width: 660,
            height: 330,
            borderRadius: 14,
            border: `1px solid ${T.line}`,
            background: "rgba(255,255,255,0.018)",
            opacity: p(f, at(2), 20),
          }}
        />
        {[
          { t: "ALU", x: 60, c: C.comb },
          { t: "REG", x: 265, c: C.reg },
          { t: "CTRL", x: 470, c: C.ctrl },
        ].map((b, i) => (
          <Elem
            key={b.t}
            x={1120 + b.x}
            y={396 + 74}
            w={130}
            h={86}
            title={b.t}
            color={b.c}
            delay={at(2) + 12 + i * 8}
            clk={b.t !== "CTRL"}
          />
        ))}
        <Bus x={1140} y={396 + 244} w={620} delay={at(2) + 30} drops={[0.14, 0.29, 0.5, 0.72, 0.86]} dir={-1} dropLen={84} />
        <div
          style={{
            position: "absolute",
            left: 1140,
            top: 396 + 268,
            fontFamily: F.mono,
            fontSize: 15,
            letterSpacing: 2.6,
            color: T.faint,
            opacity: p(f, at(2) + 40, 16),
          }}
        >
          INTERNAL BUS
        </div>
        <ClkIcon x={1660} y={396 + 268} delay={at(5) + 10} color={T.yellow} scale={1.4} />
      </div>

      {/* 底部：主线（措辞不能与任何一句字幕重复） */}
      <div style={{ position: "absolute", left: 140, top: 800 }}>
        <Write text="总线定连法 · 时钟定记忆" delay={at(6)} dur={28} size={44} weight={500} color={T.ink} />
        <Fade delay={at(6) + 26} y={10}>
          <div style={{ fontFamily: F.cn, fontSize: 20, color: T.sub, marginTop: 14, letterSpacing: 0.6 }}>
            先拆结构，再看元件，最后落到一颗真芯片。
          </div>
        </Fade>
      </div>

      <Subs sceneId="s00" />
    </Stage>
  );
};

// ==========================================================================
// s01 · 五大部件 → 两分法：旧分法漏掉了内总线
// ==========================================================================
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s01");

  const five = [
    { zh: "运算器", en: "ALU", inCpu: true },
    { zh: "控制器", en: "CU", inCpu: true },
    { zh: "存储器", en: "MEM", inCpu: false },
    { zh: "输入设备", en: "IN", inCpu: false },
    { zh: "输出设备", en: "OUT", inCpu: false },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={168} text="从五大部件到两分法" color={T.ink2} delay={at(0)} size={19} />

      {/* 左：五大部件 */}
      {five.map((b, i) => (
        <Elem
          key={b.zh}
          x={150}
          y={238 + i * 104}
          w={300}
          h={84}
          title={b.zh}
          sub={b.en}
          color={b.inCpu ? C.comb : T.faint}
          delay={at(0) + 8 + i * 8}
          size={24}
        />
      ))}

      {/* CPU 的范围：把前两个框起来 */}
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 218,
          width: 344,
          height: 212,
          borderRadius: 14,
          border: `1.5px dashed ${C.ctrl}`,
          background: `${C.ctrl}0E`,
          opacity: p(f, at(1), 22),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 490,
          top: 250,
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: 3,
          color: C.ctrl,
          opacity: p(f, at(1) + 8, 16),
        }}
      >
        CPU
      </div>

      {/* 右：旧分法 */}
      <div style={{ opacity: p(f, at(2), 18) }}>
        <Head x={760} y={216} text="旧分法 · 运算部件 + 控制部件" color={T.sub} delay={at(2)} size={16} />
      </div>
      <Elem x={780} y={262} w={300} h={90} title="运算部件" sub="ALU" color={C.comb} delay={at(2) + 6} />
      <Elem x={780} y={452} w={300} h={90} title="控制部件" sub="CU" color={C.ctrl} delay={at(2) + 14} />
      {/* 漏掉的总线 */}
      <Bus x={740} y={392} w={700} delay={at(3) + 8} drops={[]} thick={4} color={C.bus} />
      <div
        style={{
          position: "absolute",
          left: 1130,
          top: 404,
          fontFamily: F.mono,
          fontSize: 18,
          letterSpacing: 2,
          color: C.key,
          opacity: p(f, at(3) + 18, 16),
        }}
      >
        内总线 — 旧分法没给它位置
      </div>
      <Arrow from={[906, 402]} to={[906, 452]} color={`${C.bus}88`} delay={at(4) + 4} />
      <Arrow from={[1000, 452]} to={[1000, 402]} color={`${C.bus}88`} delay={at(4) + 10} />
      <div
        style={{
          position: "absolute",
          left: 1500,
          top: 330,
          fontFamily: F.cn,
          fontSize: 16,
          color: T.faint,
          opacity: p(f, at(4), 16),
        }}
      >
        数据在两个部件之间来回
      </div>

      {/* 新分法 */}
      <div style={{ opacity: p(f, at(6) - 8, 18) }}>
        <Head x={760} y={610} text="更完善 · 数据通路 + 控制器" color={C.comb} delay={at(6) - 8} size={16} />
      </div>
      <Elem
        x={780}
        y={656}
        w={420}
        h={100}
        title="数据通路"
        sub="datapath · 含内总线"
        color={C.comb}
        delay={at(6)}
        fill
      />
      <Elem
        x={1240}
        y={656}
        w={300}
        h={100}
        title="控制器"
        sub="control unit"
        color={C.ctrl}
        delay={at(6) + 10}
        fill
      />
      <Note x={1520} y={470} w={260} text="暂存器、多路选择器为什么存在" color={T.faint} delay={at(5)} size={15} />

      <Subs sceneId="s01" />
    </Stage>
  );
};

// ==========================================================================
// s02 · 数据通路：一条路，三个问题
// ==========================================================================
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s02");

  const nodes = [
    { t: "MEM", s: "存储器", x: 200, c: C.mem },
    { t: "MUX", s: "多路选择", x: 690, c: C.comb },
    { t: "ALU", s: "运算", x: 1010, c: C.comb },
    { t: "REG", s: "寄存器组", x: 1340, c: C.reg },
  ];

  const qs = [
    { t: "从哪来", x: 250 },
    { t: "经过谁", x: 880 },
    { t: "到哪去", x: 1400 },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={168} text="数据通路 · datapath" color={C.comb} delay={at(0)} size={19} />

      {/* 三个问题 */}
      {qs.map((q, i) => {
        const d = at(1) + i * 26;
        return (
          <div key={q.t} style={{ position: "absolute", left: q.x, top: 222, width: 240, textAlign: "center", opacity: p(f, d, 16) }}>
            <div style={{ fontFamily: F.cn, fontSize: 22, color: T.ink2, letterSpacing: 1.4 }}>{q.t}</div>
          </div>
        );
      })}

      {/* 总线 + 挂件 */}
      <Bus x={190} y={640} w={1500} delay={at(0) + 10} drops={[0.09, 0.42, 0.63, 0.85]} dir={-1} dropLen={78} label="内总线" />
      {nodes.map((n, i) => (
        <Elem
          key={n.t}
          x={n.x}
          y={468}
          w={190}
          h={96}
          title={n.t}
          sub={n.s}
          color={n.c}
          delay={at(0) + 14 + i * 8}
          clk={n.t === "REG"}
        />
      ))}

      {/* 流动感：总线上跑的点 */}
      <div
        style={{
          position: "absolute",
          left: 200 + ((f * 5) % 1480),
          top: 636,
          width: 12,
          height: 12,
          borderRadius: 12,
          background: C.bus,
          boxShadow: `0 0 18px ${C.bus}`,
          opacity: p(f, at(2) + 20, 20) * 0.85,
        }}
      />

      {/* 三个部件被点名 */}
      {[
        { t: "ALU 在路径上", x: 1010, d: at(2) },
        { t: "寄存器组在路径上", x: 1340, d: at(2) + 30 },
        { t: "MUX 也在路径上", x: 690, d: at(2) + 60 },
      ].map((c) => (
        <div
          key={c.t}
          style={{
            position: "absolute",
            left: c.x,
            top: 432,
            width: 190,
            textAlign: "center",
            fontFamily: F.cn,
            fontSize: 15,
            color: C.comb,
            opacity: p(f, c.d, 14),
          }}
        >
          {c.t}
        </div>
      ))}

      {/* 不只是运算器 */}
      <div
        style={{
          position: "absolute",
          left: 190,
          top: 700,
          width: 1500,
          height: 120,
          borderRadius: 10,
          border: `1.5px dashed ${C.comb}66`,
          opacity: p(f, at(3) + 4, 20),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 748,
          fontFamily: F.cn,
          fontSize: 19,
          color: T.sub,
          letterSpacing: 0.8,
          opacity: p(f, at(3) + 16, 16),
        }}
      >
        整条路都算 —— 总线、门、选择器，一个都不少
      </div>

      {/* 控制器：控制信号 */}
      <Elem x={700} y={862} w={300} h={70} title="控制器" sub="control unit" color={C.ctrl} delay={at(6)} dashed />
      <Arrow from={[860, 858]} to={[860, 824]} color={`${C.ctrl}CC`} delay={at(6) + 10} />
      <div
        style={{
          position: "absolute",
          left: 884,
          top: 826,
          fontFamily: F.mono,
          fontSize: 15,
          letterSpacing: 1.6,
          color: C.ctrl,
          opacity: p(f, at(6) + 16, 14),
        }}
      >
        control signals
      </div>
      <Note
        x={1200}
        y={872}
        w={420}
        text="自己不知道什么时候动 —— 得有人喊开始"
        color={T.faint}
        delay={at(5)}
        size={16}
      />

      <Subs sceneId="s02" />
    </Stage>
  );
};

// ==========================================================================
// s03 · 组合逻辑元件：从不记得上一秒
// ==========================================================================
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s03");

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={164} text="组合逻辑元件 · combinational" color={C.comb} delay={at(0)} size={19} />

      {/* 定义 */}
      <div style={{ position: "absolute", left: 140, top: 208 }}>
        <Write text="输出只取决于此刻的输入" delay={at(1) + 4} dur={24} size={36} weight={500} color={T.ink} />
        <Fade delay={at(2)} y={8}>
          <div style={{ fontFamily: F.cn, fontSize: 19, color: T.sub, marginTop: 12, letterSpacing: 0.6 }}>
            无记忆 · 无反馈 · 信号单向 —— 时间对它不存在
          </div>
        </Fade>
      </div>

      {/* 左上 ALU */}
      <Elem x={230} y={368} w={250} h={110} title="ALU" sub="两个操作数 + 操作码" color={C.comb} delay={at(3)} />
      <div
        style={{
          position: "absolute",
          left: 510,
          top: 400,
          fontFamily: F.cn,
          fontSize: 15,
          color: T.sub,
          width: 300,
          lineHeight: 1.6,
          opacity: p(f, at(3) + 14, 16),
        }}
      >
        给它输入，它立刻给结果
        <br />
        中间没有等待，也没有记忆
      </div>

      {/* 右上 译码器 */}
      <Decode x={1090} y={306} bits={2} active={1} delay={at(4)} />
      <div
        style={{
          position: "absolute",
          left: 1430,
          top: 300,
          fontFamily: F.cn,
          fontSize: 15,
          color: T.sub,
          width: 380,
          lineHeight: 1.7,
          opacity: p(f, at(4) + 12, 16),
        }}
      >
        译码器：n 位输入，2 的 n 次方根输出
        <br />
        每次只拉高一根 —— 相当于"选中"
      </div>

      {/* 左下 MUX */}
      <Mux x={300} y={580} h={140} ins={2} active={0} delay={at(5)} labels={["输入 A", "输入 B"]} />
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 610,
          fontFamily: F.cn,
          fontSize: 15,
          color: T.sub,
          width: 300,
          lineHeight: 1.7,
          opacity: p(f, at(5) + 12, 16),
        }}
      >
        多路选择器：几路进，一路出
        <br />
        由 SEL 决定这次放谁过去
      </div>

      {/* 右下 三态门 */}
      <TriGate x={1130} y={650} open delay={at(6)} />
      <div
        style={{
          position: "absolute",
          left: 1430,
          top: 656,
          fontFamily: F.cn,
          fontSize: 15,
          color: T.sub,
          width: 380,
          lineHeight: 1.7,
          opacity: p(f, at(6) + 12, 16),
        }}
      >
        三态门：EN 为一就通
        <br />
        为零变成高阻，等于把这根线从总线上摘掉
      </div>

      {/* 收口（不能复读末句） */}
      <div style={{ position: "absolute", left: 140, top: 812 }}>
        <Write text="没有状态，只有此刻" delay={at(7)} dur={24} size={38} weight={500} color={T.ink2} />
      </div>

      <Subs sceneId="s03" />
    </Stage>
  );
};

// ==========================================================================
// s04 · 时序逻辑元件：必须按时钟走
// ==========================================================================
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s04");

  const list = [
    { k: "通用寄存器组", v: "AX BX CX DX", c: C.reg },
    { k: "程序计数器", v: "PC / CS:IP", c: C.pc },
    { k: "状态寄存器", v: "FLAGS", c: C.flag },
    { k: "暂存器 / 锁存器", v: "T / MAR / MDR", c: T.ink2 },
    { k: "存储器", v: "主存 · Cache", c: C.mem },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={164} text="时序逻辑元件 · sequential" color={C.flag} delay={at(0)} size={19} />

      <div style={{ position: "absolute", left: 140, top: 214 }}>
        <Write text="还记得上一次的输入" delay={at(1) + 4} dur={24} size={38} weight={500} color={T.ink} />
        <Fade delay={at(2)} y={8}>
          <div style={{ fontFamily: F.cn, fontSize: 20, color: T.sub, marginTop: 12, letterSpacing: 0.6 }}>
            有状态存储 —— 这是它能"记住"的唯一原因
          </div>
        </Fade>
      </div>

      {/* 时钟 */}
      <div style={{ position: "absolute", left: 150, top: 400, width: 620, height: 170 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 620,
            height: 170,
            borderRadius: 12,
            border: `1px solid ${T.line}`,
            opacity: p(f, at(3), 18),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 18,
            fontFamily: F.mono,
            fontSize: 15,
            letterSpacing: 2,
            color: T.faint,
            opacity: p(f, at(3), 16),
          }}
        >
          CLOCK
        </div>
        <ClkIcon x={150} y={40} delay={at(3) + 6} color={C.flag} scale={5} />
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 138,
            fontFamily: F.cn,
            fontSize: 16,
            color: T.sub,
            opacity: p(f, at(3) + 14, 16),
          }}
        >
          什么时候更新，由这条方波说了算
        </div>
      </div>

      {/* 列表 */}
      <div style={{ position: "absolute", left: 880, top: 300 }}>
        {list.map((r, i) => (
          <div key={r.k} style={{ position: "absolute", left: 0, top: i * 76, whiteSpace: "nowrap" }}>
            <Kv x={0} y={0} k={r.k} v={r.v} color={r.c} delay={at(4) + i * 12} kw={210} size={20} />
            <div
              style={{
                position: "absolute",
                left: -22,
                top: 9,
                width: 8,
                height: 8,
                borderRadius: 8,
                background: r.c,
                opacity: p(f, at(4) + i * 12, 14) * 0.85,
              }}
            />
          </div>
        ))}
      </div>

      {/* 路口 vs 驿站（末句是比喻，画面只给关键词） */}
      <div style={{ position: "absolute", left: 150, top: 640, opacity: p(f, at(5) + 10, 20) }}>
        <div
          style={{
            display: "flex",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          <div style={{ width: 300 }}>
            <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 2, color: C.comb, marginBottom: 10 }}>COMB</div>
            <div style={{ fontFamily: F.cn, fontSize: 26, color: C.comb, letterSpacing: 1 }}>路口</div>
            <div style={{ fontFamily: F.cn, fontSize: 16, color: T.faint, marginTop: 6 }}>只看此刻谁到</div>
          </div>
          <div style={{ width: 300, borderLeft: `1px solid ${T.line}`, paddingLeft: 40 }}>
            <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 2, color: C.flag, marginBottom: 10 }}>SEQ</div>
            <div style={{ fontFamily: F.cn, fontSize: 26, color: C.flag, letterSpacing: 1 }}>驿站</div>
            <div style={{ fontFamily: F.cn, fontSize: 16, color: T.faint, marginTop: 6 }}>记得谁来过</div>
          </div>
        </div>
      </div>

      <Subs sceneId="s04" />
    </Stage>
  );
};

// ==========================================================================
// s05 · 一条总线 → 暂存器 T 是被逼出来的
// ==========================================================================
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s05");

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={164} text="单总线的代价" color={C.bus} delay={at(0)} size={19} />

      <div style={{ position: "absolute", left: 140, top: 208 }}>
        <Write text="同一时刻，只能传一个数" delay={at(1) + 4} dur={24} size={38} weight={500} color={T.ink} />
      </div>

      {/* 图：总线 + 部件 */}
      <Bus x={200} y={470} w={1500} delay={at(0) + 12} drops={[0.08, 0.34, 0.62, 0.88]} dir={-1} dropLen={78} label="内部总线" />
      <Elem x={230} y={300} w={170} h={92} title="REG" sub="寄存器" color={C.reg} delay={at(0) + 16} clk />
      <Elem x={620} y={300} w={170} h={92} title="T" sub="暂存器" color={C.flag} delay={at(3) + 10} clk dashed />
      <Elem x={1010} y={300} w={170} h={92} title="ALU" sub="运算" color={C.comb} delay={at(0) + 24} />
      <Elem x={1400} y={300} w={170} h={92} title="MEM" sub="存储器" color={C.mem} delay={at(0) + 30} />

      {/* 两个操作数抢一条总线 */}
      <Arrow from={[265, 470]} to={[265, 392]} color={`${C.reg}88`} delay={at(2) + 6} />
      <Arrow from={[340, 392]} to={[340, 470]} color={`${C.reg}88`} delay={at(2) + 14} />
      <div
        style={{
          position: "absolute",
          left: 424,
          top: 380,
          fontFamily: F.cn,
          fontSize: 16,
          color: C.key,
          opacity: p(f, at(2) + 18, 16),
        }}
      >
        两个操作数都要走这条线
      </div>

      {/* T 的两条腿 */}
      <Arrow from={[705, 470]} to={[705, 392]} color={C.flag} delay={at(3) + 20} />
      <Arrow from={[705, 392]} to={[705, 470]} color={C.flag} delay={at(3) + 26} dashed />
      <Arrow from={[1010, 392]} to={[795, 392]} color={`${C.flag}AA`} delay={at(4) + 6} />
      <div
        style={{
          position: "absolute",
          left: 830,
          top: 366,
          fontFamily: F.mono,
          fontSize: 14,
          color: C.flag,
          opacity: p(f, at(4) + 14, 14),
        }}
      >
        T → ALU
      </div>

      {/* 三拍时序 */}
      <div style={{ position: "absolute", left: 210, top: 560 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 15,
            letterSpacing: 2.4,
            color: T.faint,
            opacity: p(f, at(3) + 4, 14),
          }}
        >
          一个加法，拆成三拍
        </div>
      </div>
      <Beats x={210} y={600} w={470} h={148} delay={at(3) + 24} />

      {/* 收口 */}
      <div style={{ position: "absolute", left: 210, top: 800 }}>
        <Write text="补丁，不是花样" delay={at(6)} dur={24} size={36} weight={500} color={T.ink2} />
      </div>

      <Subs sceneId="s05" />
    </Stage>
  );
};

// ==========================================================================
// s06 · 控制器四步
// ==========================================================================
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s06");

  const steps = [
    { n: "01", zh: "取指", en: "FETCH", body: "PC 送地址，存储器回指令，进 IR", c: C.pc },
    { n: "02", zh: "分析", en: "DECODE", body: "译码器拆操作码与寻址方式", c: C.comb },
    { n: "03", zh: "执行", en: "EXECUTE", body: "发控制信号：开路、选功能、写回", c: C.ctrl },
    { n: "04", zh: "转向", en: "NEXT", body: "更新 PC，准备取下一条", c: C.reg },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · CPU">
      <Head x={140} y={164} text="控制器的四步" color={C.ctrl} delay={at(0)} size={19} />

      {/* 上：控制器 → 数据通路 */}
      <Elem x={150} y={222} w={300} h={100} title="控制器" sub="control unit" color={C.ctrl} delay={at(0) + 8} fill />
      <Arrow from={[460, 272]} to={[1620, 272]} color={`${C.ctrl}CC`} delay={at(0) + 18} sw={2} />
      <div
        style={{
          position: "absolute",
          left: 700,
          top: 232,
          fontFamily: F.mono,
          fontSize: 15,
          letterSpacing: 2,
          color: C.ctrl,
          opacity: p(f, at(0) + 26, 14),
        }}
      >
        CONTROL SIGNALS
      </div>
      <Elem x={1640} y={222} w={180} h={100} title="数据通路" sub="datapath" color={C.comb} delay={at(0) + 14} dashed />

      {/* 四步 */}
      {steps.map((s, i) => {
        const d = at(i + 1) + 6;
        const v = p(f, d, 18);
        const active = f >= at(i + 1);
        return (
          <div key={s.n} style={{ position: "absolute", left: 150 + i * 420, top: 400, opacity: v, transform: `translateY(${(1 - v) * 16}px)` }}>
            <div
              style={{
                width: 380,
                height: 250,
                borderRadius: 12,
                border: `1.5px solid ${active ? `${s.c}CC` : T.line}`,
                background: active ? `${s.c}12` : "rgba(255,255,255,0.012)",
                padding: "22px 24px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span style={{ fontFamily: F.mono, fontSize: 16, color: `${s.c}99`, letterSpacing: 1.4 }}>{s.n}</span>
                <span style={{ fontFamily: F.cn, fontSize: 30, color: s.c, letterSpacing: 2 }}>{s.zh}</span>
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 13, letterSpacing: 2.4, color: T.faint, marginTop: 6 }}>{s.en}</div>
              <div style={{ fontFamily: F.cn, fontSize: 16, color: T.sub, marginTop: 18, lineHeight: 1.7, width: 320 }}>{s.body}</div>
            </div>
          </div>
        );
      })}

      {/* 循环箭头 */}
      <Arrow from={[1700, 656]} to={[1700, 712]} color={`${T.faint}88`} delay={at(6) + 6} dashed />
      <div
        style={{
          position: "absolute",
          left: 1210,
          top: 686,
          fontFamily: F.cn,
          fontSize: 16,
          color: T.faint,
          opacity: p(f, at(6) + 14, 16),
        }}
      >
        四步一轮，然后重来
      </div>

      {/* 收口 */}
      <div style={{ position: "absolute", left: 150, top: 740 }}>
        <Write text="控制器不碰数据" delay={at(7)} dur={26} size={40} weight={500} color={T.ink} />
        <Fade delay={at(7) + 22} y={8}>
          <div style={{ fontFamily: F.cn, fontSize: 19, color: T.sub, marginTop: 12, letterSpacing: 0.6 }}>
            它只决定：哪条路开、哪个功能算、要不要写回
          </div>
        </Fade>
      </div>

      <Subs sceneId="s06" />
    </Stage>
  );
};
