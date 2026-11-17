import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Bits, Fade, Rule, Stage, Subs, Write, p, useCues } from "../shared/b3b/ui";
import { AddrAxis, Board, Code, Head, StackMini, Tok, stateColor } from "./parts";

// ==========================================================================
// s06 · CMP：唯一一条只改标志位的"运算"
// ==========================================================================
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s06");

  const flags = [
    { k: "ZF", d: "结果为零", c: T.yellow },
    { k: "SF", d: "结果为负", c: T.blue },
    { k: "CF", d: "无符号借位", c: T.orange },
    { k: "OF", d: "有符号溢出", c: T.red },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={168} text="算术逻辑 · 比较" color={T.yellow} delay={at(0)} size={19} />
      <Write text="cmp" delay={at(0) + 6} dur={20} size={62} weight={600} color={T.yellow} style={{ position: "absolute", left: 144, top: 198 }} />

      {/* 两条路径的对比 */}
      <Head x={140} y={300} text="同样做减法，结果去向不同" color={T.ink2} delay={at(1)} size={18} />

      <Code
        x={140}
        y={344}
        w={430}
        title="sub eax, ebx"
        delay={at(1) + 8}
        size={22}
        lines={[
          { t: "eax ← eax − ebx", hl: T.blue, note: "结果留在 eax" },
          { t: "FLAGS ← 修改", hl: T.yellow, note: "顺带更新" },
        ]}
      />

      <Code
        x={606}
        y={344}
        w={430}
        title="cmp eax, ebx"
        delay={at(1) + 16}
        size={22}
        lines={[
          { t: "结果丢弃", hl: T.red, note: "eax 原封不动" },
          { t: "FLAGS ← 修改", hl: T.yellow, note: "只留结论" },
        ]}
      />

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 556,
          fontFamily: F.mono,
          fontSize: 19,
          color: T.sub,
          letterSpacing: 0.4,
          opacity: p(f, at(2), 16),
        }}
      >
        cmp a, b  ≡  sub a, b  −  写回
      </div>

      {/* 四个标志 */}
      <Head x={140} y={640} text="四个标志各管一件事" color={T.ink2} delay={at(3)} size={18} />
      {flags.map((fl, i) => {
        const d = at(3) + 8 + i * 6;
        const v = p(f, d, 16);
        return (
          <div
            key={fl.k}
            style={{
              position: "absolute",
              left: 140 + i * 172,
              top: 698,
              width: 156,
              height: 104,
              borderRadius: 8,
              border: `1px solid ${fl.c}55`,
              background: `${fl.c}0F`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              opacity: v,
              transform: `translateY(${(1 - v) * 10}px)`,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 23, color: fl.c, letterSpacing: 1 }}>{fl.k}</span>
            <span style={{ fontFamily: F.cn, fontSize: 14, color: T.sub }}>{fl.d}</span>
          </div>
        );
      })}

      {/* 右侧 */}
      <Board x={1090} y={72} w={640} h={78} active={["flag"]} delay={at(1) + 24} />

      <div
        style={{
          position: "absolute",
          left: 1094,
          top: 200,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.ink2,
          letterSpacing: 0.4,
          opacity: p(f, at(4), 16),
        }}
      >
        只亮一格 —— 这是 cmp 的签名
      </div>

      <Head x={1094} y={286} text="比较 → 跳转，永远成对" color={T.ink2} delay={at(5)} size={18} />
      <Code
        x={1090}
        y={330}
        w={640}
        delay={at(5) + 8}
        size={22}
        lines={[
          { t: "cmp  eax, ebx", note: "写结论", hl: T.yellow },
          { t: "je   equal", note: "读结论", hl: T.green },
        ]}
      />

      <Fade delay={at(6) + 6} y={10}>
        <div
          style={{
            position: "absolute",
            left: 1094,
            top: 520,
            width: 630,
            padding: "18px 22px",
            boxSizing: "border-box",
            borderRadius: 10,
            border: `1px solid ${T.red}44`,
            background: `${T.red}0D`,
            fontFamily: F.cn,
            fontSize: 19,
            lineHeight: 1.8,
            color: T.sub,
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 17, color: T.red, letterSpacing: 0.6, marginBottom: 6 }}>
            "哪条指令不改变程序流程？"
          </div>
          cmp 只改标志位，程序照样往下走 —— 答案是它
        </div>
      </Fade>

      <Subs sceneId="s06" />
    </Stage>
  );
};

// ==========================================================================
// s07 · JMP / JCC：改的是 PC，不是数据
// ==========================================================================
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s07");

  const signed = [
    ["JE / JZ", "ZF = 1"],
    ["JNE / JNZ", "ZF = 0"],
    ["JG", "ZF=0 且 SF=OF"],
    ["JL", "SF ≠ OF"],
    ["JGE", "SF = OF"],
    ["JLE", "ZF=1 或 SF≠OF"],
  ];
  const unsigned = [
    ["JA", "CF = 0 且 ZF = 0"],
    ["JAE", "CF = 0"],
    ["JB", "CF = 1"],
    ["JBE", "CF = 1 或 ZF = 1"],
  ];

  const table = (
    x: number,
    y: number,
    title: string,
    color: string,
    rows: string[][],
    delay: number,
  ) => (
    <>
      <Head x={x} y={y} text={title} color={color} delay={delay} size={17} />
      {rows.map((r, i) => {
        const d = delay + 8 + i * 5;
        const v = p(f, d, 14);
        return (
          <div
            key={r[0]}
            style={{
              position: "absolute",
              left: x,
              top: y + 38 + i * 44,
              width: 400,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              opacity: v,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 20, color, width: 132, letterSpacing: 0.6 }}>{r[0]}</span>
            <span style={{ fontFamily: F.mono, fontSize: 17, color: T.sub }}>{r[1]}</span>
          </div>
        );
      })}
    </>
  );

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={168} text="控制转移 · 无条件跳转与条件跳转" color={T.green} delay={at(0)} size={19} />
      <Write text="jmp / jcc" delay={at(1)} dur={22} size={50} weight={600} color={T.green} style={{ position: "absolute", left: 144, top: 198 }} />

      <Head x={140} y={286} text="相对寻址：指令里存的是偏移量" color={T.ink2} delay={at(2)} size={17} />
      <AddrAxis
        x={148}
        y={336}
        w={640}
        delay={at(2) + 8}
        items={[
          { addr: "0x1000", text: "mov  eax, 1" },
          { addr: "0x1005", text: "jmp  L", color: T.green, current: true },
          { addr: "0x100a", text: "add  ebx, 1", color: T.faint },
          { addr: "0x1040", text: "L:", color: T.yellow, target: true },
        ]}
        span={{ from: 1, to: 3, label: "0x1040 − 0x100a = 0x36" }}
      />

      <div
        style={{
          position: "absolute",
          left: 148,
          top: 618,
          fontFamily: F.mono,
          fontSize: 18,
          color: T.sub,
          letterSpacing: 0.4,
          opacity: p(f, at(4), 16),
        }}
      >
        偏移量 = 目标地址 − (PC + 指令长度)
      </div>
      <div
        style={{
          position: "absolute",
          left: 148,
          top: 662,
          fontFamily: F.cn,
          fontSize: 18,
          color: T.faint,
          letterSpacing: 0.4,
          opacity: p(f, at(4) + 10, 16),
        }}
      >
        取指之后 PC 已指向下一条，所以基准是"下一条"，不是"这一条"
      </div>

      {/* 右侧两套表 */}
      {table(1000, 190, "有符号 · signed", T.blue, signed, at(6))}
      {table(1000, 498, "无符号 · unsigned", T.orange, unsigned, at(6) + 30)}

      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 712,
          width: 660,
          padding: "16px 20px",
          boxSizing: "border-box",
          borderRadius: 10,
          border: `1px solid ${T.yellow}44`,
          background: `${T.yellow}0C`,
          fontFamily: F.cn,
          fontSize: 18,
          lineHeight: 1.75,
          color: T.sub,
          opacity: p(f, at(8), 18),
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 16, color: T.yellow }}>同一组标志位，两套问法</span>
        <div style={{ marginTop: 6 }}>CPU 不知道你比的是 int 还是 unsigned，是编译器替它选。</div>
      </div>

      <Board x={1000} y={72} w={690} h={78} active={["pc", "flag"]} delay={at(5) + 10} />

      <Subs sceneId="s07" />
    </Stage>
  );
};

// ==========================================================================
// s08 · CALL / RET：返回地址是唯一凭证
// ==========================================================================
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s08");

  const steps = [
    { n: 1, t: "下一条地址压栈", c: T.orange, d: at(2) + 8 },
    { n: 2, t: "跳到子程序入口", c: T.green, d: at(2) + 22 },
    { n: 3, t: "ret 弹出返回地址", c: T.orange, d: at(3) + 6 },
    { n: 4, t: "写回 PC，继续往下", c: T.green, d: at(4) + 6 },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={168} text="控制转移 · 子程序调用" color={T.green} delay={at(0)} size={19} />
      <Write text="call / ret" delay={at(1)} dur={22} size={48} weight={600} color={T.green} style={{ position: "absolute", left: 144, top: 198 }} />

      <Code
        x={140}
        y={296}
        w={560}
        title="主程序"
        delay={at(1) + 10}
        size={21}
        lines={[
          { t: "0x1000  mov  eax, 3", dim: true },
          { t: "0x1005  call func", note: "压 0x100a，跳", hl: T.green },
          { t: "0x100a  mov  ebx, eax", note: "返回到这里", hl: T.orange },
          { t: "func:", dim: true },
          { t: "        ret", note: "弹 0x100a", hl: T.orange },
        ]}
      />

      {/* 栈 */}
      <Head x={760} y={296} text="栈的变化" color={T.ink2} delay={at(2)} size={17} />
      <StackMini
        x={760}
        y={344}
        w={310}
        delay={at(2) + 6}
        espAt={2}
        slots={[
          { text: "参数", note: "调用者压", color: T.purple },
          { text: "0x100a", note: "返回地址", color: T.orange },
          { text: "旧 ebp", note: "被调者保存", color: T.blue },
          { text: "", note: "局部变量", empty: true, dashed: true },
        ]}
      />

      {/* 四步：横排压在底部，把左中右三块收在一起 */}
      {steps.map((s, i) => {
        const v = p(f, s.d, 16);
        return (
          <div
            key={s.n}
            style={{
              position: "absolute",
              left: 140 + i * 400,
              top: 632,
              width: 376,
              height: 104,
              borderRadius: 10,
              border: `1px solid ${s.c}55`,
              background: `${s.c}12`,
              padding: "16px 20px",
              boxSizing: "border-box",
              opacity: v,
              transform: `translateY(${(1 - v) * 10}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 14,
                  color: s.c,
                  width: 20,
                  height: 20,
                  lineHeight: "20px",
                  textAlign: "center",
                  borderRadius: 999,
                  border: `1px solid ${s.c}88`,
                }}
              >
                {s.n}
              </span>
              <span style={{ fontFamily: F.mono, fontSize: 17, color: `${s.c}CC`, letterSpacing: 0.6 }}>
                {s.n <= 2 ? "CALL" : "RET"}
              </span>
            </div>
            <div style={{ fontFamily: F.cn, fontSize: 17, color: T.ink2, marginTop: 10, letterSpacing: 0.4 }}>{s.t}</div>
          </div>
        );
      })}

      {/* 右侧 */}
      <Board x={1000} y={72} w={690} h={78} active={["pc", "mem", "reg"]} delay={at(5) + 8} />

      <div
        style={{
          position: "absolute",
          left: 1136,
          top: 240,
          width: 560,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.ink2,
          letterSpacing: 0.4,
          opacity: p(f, at(5) + 16, 18),
        }}
      >
        三份状态一起动 —— 全场最多的一条
      </div>

      <div style={{ position: "absolute", left: 1136, top: 290, display: "flex", gap: 10, opacity: p(f, at(5) + 22, 16) }}>
        <Tok x={0} y={0} text="PC" color={stateColor("pc")} delay={at(5) + 22} size={18} />
        <Tok x={52} y={0} text="MEM" color={stateColor("mem")} delay={at(5) + 26} size={18} />
        <Tok x={126} y={0} text="REG(esp)" color={stateColor("reg")} delay={at(5) + 30} size={18} />
      </div>

      <Fade delay={at(6)} y={10}>
        <div
          style={{
            position: "absolute",
            left: 1136,
            top: 470,
            width: 570,
            padding: "18px 22px",
            boxSizing: "border-box",
            borderRadius: 10,
            border: `1px solid ${T.line}`,
            background: "rgba(255,255,255,0.02)",
            fontFamily: F.cn,
            fontSize: 19,
            lineHeight: 1.8,
            color: T.sub,
          }}
        >
          上一期栈帧为什么把返回地址夹在参数和旧栈底中间 ——
          <div style={{ marginTop: 6, color: T.ink2 }}>因为它是 call 亲手压进去的。</div>
        </div>
      </Fade>

      <Subs sceneId="s08" />
    </Stage>
  );
};

// ==========================================================================
// s09 · INT：程序主动敲开内核的门
// ==========================================================================
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s09");

  const ivt = [
    { n: "0x00", t: "除零", c: T.red },
    { n: "0x01", t: "单步调试", c: T.yellow },
    { n: "0x03", t: "断点", c: T.blue },
    { n: "0x80", t: "系统调用", c: T.green },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={168} text="陷阱指令 · 软件中断" color={T.purple} delay={at(0)} size={19} />
      <Write text="int n" delay={at(1)} dur={20} size={54} weight={600} color={T.purple} style={{ position: "absolute", left: 144, top: 198 }} />

      <Code
        x={140}
        y={300}
        w={560}
        title="系统调用：进入内核要做的三件事"
        delay={at(4)}
        size={21}
        lines={[
          { t: "mov  eax, 1", note: "功能号 = exit", hl: T.blue },
          { t: "mov  ebx, 0", note: "参数 = 退出码", hl: T.blue },
          { t: "int  0x80", note: "触发陷阱", hl: T.purple },
        ]}
      />

      {/* 向量表 */}
      <Head x={760} y={300} text="中断向量表 IVT" color={T.ink2} delay={at(1) + 10} size={17} />
      <div
        style={{
          position: "absolute",
          left: 760,
          top: 340,
          width: 330,
          borderRadius: 8,
          border: `1px solid ${T.line}`,
          opacity: p(f, at(1) + 12, 16),
        }}
      >
        {ivt.map((r, i) => {
          const d = at(1) + 18 + i * 6;
          const v = p(f, d, 14);
          return (
            <div
              key={r.n}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 16px",
                borderBottom: i < ivt.length - 1 ? `1px solid ${T.line}` : "none",
                opacity: v,
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 18, color: r.c }}>{r.n}</span>
              <span style={{ fontFamily: F.cn, fontSize: 17, color: T.sub }}>{r.t}</span>
            </div>
          );
        })}
      </div>

      {/* 特权级切换 */}
      <Head x={1136} y={300} text="同时切特权级" color={T.ink2} delay={at(3)} size={17} />
      <div
        style={{
          position: "absolute",
          left: 1136,
          top: 344,
          width: 540,
          opacity: p(f, at(3) + 8, 18),
        }}
      >
        <div
          style={{
            height: 62,
            borderRadius: 8,
            border: `1.5px solid ${T.blue}88`,
            background: `${T.blue}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.cn,
            fontSize: 21,
            color: T.blue,
          }}
        >
          用户态 · 只能跑自己的代码
        </div>
        <div style={{ height: 34, position: "relative" }}>
          <Arrow from={[270, 4]} to={[270, 30]} color={T.purple} delay={at(3) + 18} sw={2} head={10} />
        </div>
        <div
          style={{
            height: 62,
            borderRadius: 8,
            border: `1.5px solid ${T.purple}88`,
            background: `${T.purple}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.cn,
            fontSize: 21,
            color: T.purple,
          }}
        >
          内核态 · 可以碰硬件
        </div>
      </div>

      {/* 四步走完一次陷阱：横条压在底部，把上面三栏收在一起 */}
      {[
        { n: "01", t: "压栈", d: "标志位 + 返回地址（CS:EIP）", c: T.yellow },
        { n: "02", t: "查表", d: "按向量号去 IVT 取入口", c: T.blue },
        { n: "03", t: "执行", d: "内核态跑服务例程", c: T.purple },
        { n: "04", t: "iret", d: "恢复现场，回用户态", c: T.green },
      ].map((st, i) => {
        const v = p(f, at(2) + 12 + i * 8, 16);
        return (
          <div
            key={st.n}
            style={{
              position: "absolute",
              left: 140 + i * 392,
              top: 742,
              width: 372,
              height: 116,
              borderRadius: 10,
              border: `1px solid ${st.c}88`,
              background: `${st.c}1E`,
              padding: "16px 20px",
              boxSizing: "border-box",
              opacity: v,
              transform: `translateY(${(1 - v) * 10}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: F.mono, fontSize: 14, color: `${st.c}AA`, letterSpacing: 1 }}>{st.n}</span>
              <span style={{ fontFamily: F.mono, fontSize: 20, color: st.c }}>{st.t}</span>
            </div>
            <div style={{ fontFamily: F.cn, fontSize: 16, color: T.sub, lineHeight: 1.6, marginTop: 8 }}>{st.d}</div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 760,
          top: 560,
          width: 380,
          padding: "16px 20px",
          boxSizing: "border-box",
          borderRadius: 10,
          border: `1px solid ${T.red}44`,
          background: `${T.red}0C`,
          fontFamily: F.cn,
          fontSize: 17,
          lineHeight: 1.75,
          color: T.sub,
          opacity: p(f, at(6), 18),
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 15, color: T.red, letterSpacing: 0.4 }}>别和单步标志混了</div>
        int 由程序写；TF 是每条指令后自动触发
      </div>

      <Board x={1000} y={72} w={690} h={78} active={["pc", "mem", "flag"]} delay={at(2) + 16} />

      <Subs sceneId="s09" />
    </Stage>
  );
};

// ==========================================================================
// s10 · CLI/STI 与 IN/OUT：跟外部世界打交道的两条路
// ==========================================================================
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s10");

  const PW = 500;
  const panel = (x: number, delay: number) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 226,
        width: PW,
        height: 396,
        borderRadius: 12,
        border: `1px solid ${T.line}`,
        background: "rgba(255,255,255,0.018)",
        opacity: p(f, delay, 18),
      }}
    />
  );

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={168} text="中断控制 · 输入输出 · 字符串" color={T.purple} delay={at(0)} size={19} />

      {/* 栏 1 · CLI / STI */}
      {panel(140, at(1))}
      <Head x={174} y={256} text="cli / sti · 只拨一个比特" color={T.yellow} delay={at(1) + 6} size={17} />
      <Bits
        bits="1"
        x={176}
        y={302}
        cw={66}
        ch={66}
        delay={at(1) + 12}
        color={T.yellow}
        paint={{ 0: T.yellow }}
        size={34}
      />
      <div
        style={{
          position: "absolute",
          left: 176,
          top: 378,
          fontFamily: F.mono,
          fontSize: 15,
          color: T.faint,
          letterSpacing: 1.4,
          opacity: p(f, at(1) + 16, 14),
        }}
      >
        IF 位
      </div>
      <div
        style={{
          position: "absolute",
          left: 276,
          top: 296,
          fontFamily: F.cn,
          fontSize: 18,
          lineHeight: 2,
          color: T.sub,
          opacity: p(f, at(2), 16),
        }}
      >
        <div>
          <span style={{ fontFamily: F.mono, color: T.red }}>cli</span> 清 IF → 关中断
        </div>
        <div>
          <span style={{ fontFamily: F.mono, color: T.green }}>sti</span> 置 IF → 开中断
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 176,
          top: 448,
          width: 428,
          fontFamily: F.cn,
          fontSize: 17,
          lineHeight: 1.75,
          color: T.faint,
          opacity: p(f, at(3), 16),
        }}
      >
        只挡可屏蔽中断（IRQ）
        <div style={{ color: T.ink2 }}>不可屏蔽中断（NMI）照样进来</div>
      </div>

      {/* 栏 2 · IN / OUT */}
      {panel(680, at(4))}
      <Head x={714} y={256} text="in / out · 只有独立编址才用" color={T.purple} delay={at(4) + 6} size={17} />
      <Code
        x={712}
        y={302}
        w={436}
        delay={at(4) + 12}
        size={19}
        lines={[
          { t: "in   al, 0x60", note: "端口 → 寄存器", hl: T.purple },
          { t: "out  0x60, al", note: "寄存器 → 端口", hl: T.purple },
        ]}
      />
      <div
        style={{
          position: "absolute",
          left: 714,
          top: 470,
          width: 436,
          fontFamily: F.cn,
          fontSize: 17,
          lineHeight: 1.8,
          color: T.sub,
          opacity: p(f, at(5), 16),
        }}
      >
        <div>独立编址：端口单独一片地址</div>
        <div>统一编址：端口就是内存</div>
        <div style={{ color: T.yellow, marginTop: 4 }}>统一编址用 mov 就够了</div>
      </div>

      {/* 栏 3 · 字符串 */}
      {panel(1220, at(6) + 20)}
      <Head x={1254} y={256} text="字符串 · 基本不考" color={T.faint} delay={at(6) + 26} size={17} />
      {[
        { k: "MOVS", d: "ES:EDI ← DS:ESI" },
        { k: "LODS", d: "AL/AX/EAX ← DS:ESI" },
        { k: "STOS", d: "ES:EDI ← AL/AX/EAX" },
      ].map((r, i) => {
        const v = p(f, at(6) + 32 + i * 5, 14);
        return (
          <div
            key={r.k}
            style={{
              position: "absolute",
              left: 1254,
              top: 306 + i * 44,
              width: 432,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              opacity: v,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 20, color: T.teal }}>{r.k}</span>
            <span style={{ fontFamily: F.mono, fontSize: 16, color: T.sub }}>{r.d}</span>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 1254,
          top: 470,
          width: 432,
          fontFamily: F.cn,
          fontSize: 17,
          lineHeight: 1.8,
          color: T.faint,
          opacity: p(f, at(6) + 48, 16),
        }}
      >
        靠 ESI / EDI 隐含寻址
        <div style={{ color: T.sub }}>一次搬一批，不写操作数</div>
      </div>

      {/* 底部横条：三栏的共同点 */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 690,
          width: 1600,
          height: 1,
          background: T.line,
          opacity: p(f, at(6), 18),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 726,
          fontFamily: F.cn,
          fontSize: 22,
          color: T.ink2,
          letterSpacing: 0.5,
          opacity: p(f, at(6) + 8, 18),
        }}
      >
        三类都不做运算 —— 它们只管 CPU 与外部世界的边界
      </div>

      <Board x={1000} y={72} w={640} h={78} active={["flag", "port"]} delay={at(1) + 22} />

      <Subs sceneId="s10" />
    </Stage>
  );
};

// ==========================================================================
// s11 · 收口表：谁动了谁
// ==========================================================================
interface Row {
  op: string;
  note: string;
  cells: (0 | 1 | 2)[]; // 0 无  1 写  2 读
}

const ROWS: Row[] = [
  { op: "MOV", note: "搬运，不运算", cells: [1, 1, 0, 0, 0] },
  { op: "PUSH POP", note: "含栈指针", cells: [1, 1, 0, 0, 0] },
  { op: "ADD SUB", note: "顺带更新标志", cells: [1, 1, 1, 0, 0] },
  { op: "MUL DIV", note: "固定寄存器对", cells: [1, 0, 1, 0, 0] },
  { op: "AND OR XOR", note: "按位运算", cells: [1, 1, 1, 0, 0] },
  { op: "CMP", note: "只留结论", cells: [0, 0, 1, 0, 0] },
  { op: "JMP", note: "无条件", cells: [0, 0, 0, 1, 0] },
  { op: "JCC", note: "先读标志", cells: [0, 0, 2, 1, 0] },
  { op: "CALL RET", note: "压返回地址", cells: [1, 1, 0, 1, 0] },
  { op: "INT", note: "保存现场", cells: [0, 1, 1, 1, 0] },
  { op: "CLI STI", note: "只拨 IF", cells: [0, 0, 1, 0, 0] },
  { op: "IN OUT", note: "走端口", cells: [1, 0, 0, 0, 1] },
];

const COLS: { k: string; c: string; w: number }[] = [
  { k: "REG", c: stateColor("reg"), w: 190 },
  { k: "MEM", c: stateColor("mem"), w: 190 },
  { k: "FLAGS", c: stateColor("flag"), w: 190 },
  { k: "PC", c: stateColor("pc"), w: 190 },
  { k: "PORT", c: stateColor("port"), w: 190 },
];

export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s11");
  const x0 = 336;
  const colX = COLS.reduce<number[]>((acc, c, i) => {
    acc.push(i === 0 ? 400 : acc[i - 1] + COLS[i - 1].w);
    return acc;
  }, []);
  const rowH = 40;
  const top = 272;

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={168} text="收口 · 十三类指令，五份状态" color={T.ink2} delay={at(0)} size={19} />

      {/* 表头 */}
      <div
        style={{
          position: "absolute",
          left: x0,
          top: top - 46,
          fontFamily: F.mono,
          fontSize: 16,
          letterSpacing: 1.6,
          color: T.faint,
          opacity: p(f, at(1), 16),
        }}
      >
        指令
      </div>
      {COLS.map((c, i) => (
        <div
          key={c.k}
          style={{
            position: "absolute",
            left: x0 + colX[i],
            top: top - 46,
            width: c.w,
            textAlign: "center",
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: 1.6,
            color: c.c,
            opacity: p(f, at(1) + 4 + i * 3, 16),
          }}
        >
          {c.k}
        </div>
      ))}
      <Rule w={x0 + 400 + 190 * 5 - x0} color={T.line} delay={at(1) + 6} dur={26} style={{ position: "absolute", left: x0, top: top - 20 }} />

      {ROWS.map((r, ri) => {
        const d = at(2) + ri * 5;
        const v = p(f, d, 14);
        return (
          <React.Fragment key={r.op}>
            <div
              style={{
                position: "absolute",
                left: x0,
                top: top + ri * rowH,
                height: rowH,
                width: 390,
                display: "flex",
                alignItems: "center",
                gap: 14,
                opacity: v,
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 19, color: T.ink, minWidth: 132 }}>{r.op}</span>
              <span style={{ fontFamily: F.cn, fontSize: 15, color: T.faint }}>{r.note}</span>
            </div>
            {r.cells.map((cell, ci) => {
              const c = COLS[ci];
              return (
                <div
                  key={ci}
                  style={{
                    position: "absolute",
                    left: x0 + colX[ci],
                    top: top + ri * rowH,
                    width: c.w,
                    height: rowH,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: v,
                  }}
                >
                  {cell === 1 ? (
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 999,
                        background: c.c,
                        display: "inline-block",
                        boxShadow: `0 0 14px ${c.c}66`,
                      }}
                    />
                  ) : cell === 2 ? (
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 999,
                        border: `1.5px solid ${c.c}`,
                        display: "inline-block",
                        opacity: 0.85,
                      }}
                    />
                  ) : (
                    <span style={{ width: 1, height: 1, background: T.line, display: "inline-block" }} />
                  )}
                </div>
              );
            })}
            <div
              style={{
                position: "absolute",
                left: x0,
                top: top + (ri + 1) * rowH,
                width: 400 + 190 * 5,
                height: 1,
                background: T.line,
                opacity: 0.45 * v,
              }}
            />
          </React.Fragment>
        );
      })}

      {/* 图例 */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 812,
          display: "flex",
          alignItems: "center",
          gap: 26,
          fontFamily: F.cn,
          fontSize: 16,
          color: T.faint,
          opacity: p(f, at(3), 18),
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: T.sub, display: "inline-block" }} /> 写入／改变
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{ width: 10, height: 10, borderRadius: 999, border: `1.5px solid ${T.sub}`, display: "inline-block" }}
          />{" "}
          读取／依赖
        </span>
      </div>

      <div style={{ position: "absolute", left: 1180, top: 800 }}>
        <Write text="看列，不看行" delay={at(6)} dur={22} size={42} weight={500} color={T.ink} spacing={2} />
      </div>

      <Subs sceneId="s11" />
    </Stage>
  );
};
