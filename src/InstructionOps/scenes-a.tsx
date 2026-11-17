import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Bits, Chip, Fade, Rule, Stage, Subs, Write, p, useCues } from "../shared/b3b/ui";
import { Board, CatRow, Code, Head, RegPair, Shift, StackMini, Tok } from "./parts";

// ==========================================================================
// s00 · 主题页：这一期讲什么、主线是什么
// ==========================================================================
export const S00: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s00");

  const toc = [
    { n: 1, zh: "五份状态", note: "reg · mem · flags · pc · port" },
    { n: 2, zh: "六类指令", note: "move · alu · jump · trap · irq · io" },
    { n: 3, zh: "一张收口表", note: "who touched what" },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <div style={{ position: "absolute", left: 140, top: 150 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 18,
            letterSpacing: 3.4,
            color: T.faint,
            opacity: p(f, at(0), 16),
          }}
        >
          INSTRUCTION OPCODE
        </div>

        <Write
          text="指令操作码"
          delay={at(1) + 4}
          dur={30}
          size={94}
          weight={600}
          spacing={4}
          style={{ marginTop: 14, textShadow: `0 0 90px ${T.blue}22` }}
        />

        <Rule w={640} color={`${T.yellow}88`} h={2} delay={at(1) + 20} dur={34} style={{ marginTop: 20 }} />
      </div>

      {/* 左边：三条目录 */}
      <div style={{ position: "absolute", left: 140, top: 400 }}>
        {toc.map((t, i) => {
          const d = at(3) + i * 5;
          const v = p(f, d, 16);
          return (
            <div key={t.n} style={{ position: "absolute", left: 0, top: i * 92, opacity: v, whiteSpace: "nowrap" }}>
              <Rule w={860} color={T.line} delay={d} dur={22} style={{ position: "absolute", left: 0, top: 54 }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 18, transform: `translateX(${(1 - v) * 12}px)` }}>
                <span style={{ fontFamily: F.mono, fontSize: 17, color: T.teal, letterSpacing: 1.2 }}>0{t.n}</span>
                <span style={{ fontFamily: F.cn, fontSize: 30, color: T.ink, width: 210, letterSpacing: 0.5 }}>{t.zh}</span>
                <span style={{ fontFamily: F.mono, fontSize: 16, color: T.faint, letterSpacing: 0.6 }}>{t.note}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 右边：主线 —— 五格状态板先亮一次 */}
      <div
        style={{
          position: "absolute",
          left: 1128,
          top: 384,
          width: 660,
          height: 300,
          borderRadius: 14,
          border: `1px solid ${T.line}`,
          background: "rgba(255,255,255,0.02)",
          opacity: p(f, at(4), 22),
        }}
      />
      <Head x={1168} y={414} text="全片一条主线" color={T.yellow} delay={at(4) + 8} />
      <Board
        x={1168}
        y={470}
        w={580}
        h={84}
        delay={at(5)}
        reveal={5}
        active={["reg", "mem", "flag", "pc", "port"]}
      />
      <div
        style={{
          position: "absolute",
          left: 1168,
          top: 590,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.sub,
          letterSpacing: 0.4,
          opacity: p(f, at(5) + 20, 18),
        }}
      >
        能改的只有这五份，指令只是不同的改法。
      </div>

      {/* 底部：收口 —— 措辞要和最后一句字幕不同，否则叠成复读 */}
      <div style={{ position: "absolute", left: 140, top: 780 }}>
        <Write text="先拆机器，再贴标签" delay={at(6)} dur={26} size={46} weight={500} color={T.ink} />
        <Fade delay={at(6) + 26} y={10}>
          <div style={{ fontFamily: F.cn, fontSize: 21, color: T.sub, marginTop: 14, letterSpacing: 0.6 }}>
            这一节要和 CPU 的控制器放在一起理解 —— 操作码就是控制器收到的命令。
          </div>
        </Fade>
      </div>

      <Chip x={1580} y={150} text="本节 · 高优先级" color={T.red} size={17} delay={at(2) + 6} />
      <Subs sceneId="s00" />
    </Stage>
  );
};

// ==========================================================================
// s01 · 五份状态 + 六类指令：先把机器拆开，再贴分类标签
// ==========================================================================
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s01");

  const cats = [
    { zh: "数据传送", ops: "MOV  PUSH  POP", st: ["reg", "mem"] as const },
    { zh: "算术逻辑", ops: "ADD SUB MUL DIV AND OR XOR NOT CMP SHL SHR SAR", st: ["reg", "mem", "flag"] as const },
    { zh: "控制转移", ops: "JMP  JCC  CALL  RET", st: ["pc", "mem"] as const },
    { zh: "陷阱", ops: "INT", st: ["pc", "mem", "flag"] as const },
    { zh: "中断控制", ops: "CLI  STI", st: ["flag"] as const },
    { zh: "输入输出", ops: "IN  OUT", st: ["reg", "port"] as const },
    { zh: "字符串", ops: "MOVS  LODS  STOS  CMPS", st: ["reg", "mem"] as const },
  ];

  const notes = [
    { x: 170, text: "最快的一层" },
    { x: 500, text: "变量和栈" },
    { x: 830, text: "四类标志" },
    { x: 1160, text: "指向下一条" },
    { x: 1490, text: "跟外设说话" },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={168} text="先拆机器 · 能被指令改动的只有五份状态" color={T.ink2} delay={at(0)} size={19} />

      <Board x={150} y={224} w={1560} h={132} delay={at(1)} active={["reg", "mem", "flag", "pc", "port"]} reveal={5} />

      {notes.map((n, i) => (
        <div
          key={n.text}
          style={{
            position: "absolute",
            left: n.x,
            top: 372,
            width: 290,
            textAlign: "center",
            fontFamily: F.cn,
            fontSize: 17,
            color: T.sub,
            letterSpacing: 0.4,
            opacity: p(f, at(1) + 14 + i * 6, 16) * 0.9,
          }}
        >
          {n.text}
        </div>
      ))}

      <div style={{ position: "absolute", left: 140, top: 452 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 17,
            letterSpacing: 2.2,
            color: T.faint,
            opacity: p(f, at(6), 16),
          }}
        >
          六类 + 一条附注
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 1290,
          top: 454,
          fontFamily: F.cn,
          fontSize: 16,
          color: T.faint,
          letterSpacing: 0.4,
          opacity: p(f, at(6) + 30, 18),
        }}
      >
        行末圆点 = 这类指令动到哪几份状态
      </div>

      {cats.map((c, i) => (
        <CatRow
          key={c.zh}
          x={140}
          y={500 + i * 62}
          w={1560}
          n={i + 1}
          zh={c.zh}
          ops={c.ops}
          state={[...c.st]}
          delay={at(6) + 6 + i * 5}
          size={24}
        />
      ))}

      <Subs sceneId="s01" />
    </Stage>
  );
};

// ==========================================================================
// s02 · MOV：只有复制，没有剪切
// ==========================================================================
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s02");

  const box = (x: number, y: number, name: string, val: string, c: string, d: number, dimNote?: string) => {
    const v = p(f, d, 16);
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 176,
          height: 104,
          borderRadius: 9,
          border: `1.5px solid ${c}${dimNote ? "55" : "99"}`,
          background: `${c}12`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          opacity: v,
          transform: `scale(${0.94 + 0.06 * v})`,
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 19, color: T.sub, letterSpacing: 1.4 }}>{name}</span>
        <span style={{ fontFamily: F.mono, fontSize: 30, color: c }}>{val}</span>
        {dimNote ? <span style={{ fontFamily: F.cn, fontSize: 13, color: T.faint }}>{dimNote}</span> : null}
      </div>
    );
  };

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={170} text="数据传送 · 数据传送指令" color={T.blue} delay={at(0)} size={19} />

      <Write text="mov" delay={at(0) + 6} dur={20} size={62} weight={600} color={T.blue} style={{ position: "absolute", left: 144, top: 200 }} />

      <Code
        x={140}
        y={300}
        w={740}
        title="5 种操作数组合"
        delay={at(2)}
        size={25}
        lh={2}
        lines={[
          { t: "mov  <reg>, <reg>", note: "寄存器 ← 寄存器", c: T.ink2 },
          { t: "mov  <reg>, <mem>", note: "寄存器 ← 内存", c: T.ink2 },
          { t: "mov  <mem>, <reg>", note: "内存 ← 寄存器", c: T.ink2 },
          { t: "mov  <reg>, <con>", note: "寄存器 ← 立即数", c: T.ink2 },
          { t: "mov  <mem>, <con>", note: "内存 ← 立即数", c: T.ink2 },
        ]}
      />

      <div
        style={{
          position: "absolute",
          left: 148,
          top: 668,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.red,
          letterSpacing: 0.4,
          opacity: p(f, at(4), 18),
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 20 }}>mov [a], [b]</span>
        <span style={{ marginLeft: 14 }}>× 内存到内存不能直搬，必须过一次寄存器</span>
      </div>

      {/* 右侧：复制 ≠ 剪切 */}
      <Board x={1000} y={72} w={690} h={78} active={["reg", "mem"]} delay={at(1)} />

      <Head x={1000} y={210} text="复制，不是剪切" color={T.ink2} delay={at(6)} size={19} />

      {box(1000, 262, "EBX", "42", T.blue, at(1) + 8)}
      <Arrow from={[1200, 314]} to={[1372, 314]} color={T.blue} delay={at(1) + 18} sw={2.4} head={12} />
      <div
        style={{
          position: "absolute",
          left: 1218,
          top: 280,
          fontFamily: F.mono,
          fontSize: 16,
          color: T.blue,
          opacity: p(f, at(1) + 22, 14),
        }}
      >
        eax ← ebx
      </div>
      {box(1400, 262, "EAX", "42", T.green, at(1) + 26)}
      {box(1000, 402, "EBX", "42", T.blue, at(6) + 6, "源操作数原封不动")}

      <Fade delay={at(5) + 6} y={10}>
        <div
          style={{
            position: "absolute",
            left: 1000,
            top: 590,
            width: 660,
            fontFamily: F.cn,
            fontSize: 20,
            lineHeight: 1.9,
            color: T.sub,
          }}
        >
          <div>· 不运算，只挪位置</div>
          <div>· 不改任何标志位</div>
          <div>· 一条指令，最多动两份状态</div>
        </div>
      </Fade>

      <Subs sceneId="s02" />
    </Stage>
  );
};

// ==========================================================================
// s03 · PUSH / POP：一条指令同时改内存和栈指针
// ==========================================================================
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s03");

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={170} text="数据传送 · 栈操作" color={T.blue} delay={at(0)} size={19} />
      <Write text="push / pop" delay={at(1)} dur={22} size={52} weight={600} color={T.blue} style={{ position: "absolute", left: 144, top: 202 }} />

      {/* 左：栈，从高地址往下长 */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 300,
          fontFamily: F.mono,
          fontSize: 15,
          color: T.faint,
          letterSpacing: 1.6,
          opacity: p(f, at(0) + 8, 14),
        }}
      >
        高地址
      </div>
      <StackMini
        x={150}
        y={328}
        w={300}
        delay={at(0) + 10}
        espAt={2}
        slots={[
          { text: "0x0000", note: "栈底", color: T.faint },
          { text: "…", note: "已占用", color: T.orange },
          { text: "eax = 42", note: "栈顶", color: T.orange },
          { text: "", note: "空", color: T.line, empty: true, dashed: true },
        ]}
      />
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 566,
          fontFamily: F.mono,
          fontSize: 15,
          color: T.faint,
          letterSpacing: 1.6,
          opacity: p(f, at(0) + 10, 14),
        }}
      >
        低地址 ↓ 生长方向
      </div>

      {/* 中：等价序列 */}
      <Code
        x={560}
        y={300}
        w={420}
        title="push eax 等价于"
        delay={at(2)}
        lines={[
          { t: "sub  esp, 4", note: "先挪指针", hl: T.green },
          { t: "mov  [esp], eax", note: "再写值", hl: T.orange },
        ]}
      />
      <Code
        x={560}
        y={500}
        w={420}
        title="pop ebx 等价于"
        delay={at(3)}
        lines={[
          { t: "mov  ebx, [esp]", note: "先读值", hl: T.orange },
          { t: "add  esp, 4", note: "再挪指针", hl: T.green },
        ]}
      />

      <div
        style={{
          position: "absolute",
          left: 566,
          top: 754,
          fontFamily: F.cn,
          fontSize: 20,
          color: T.sub,
          lineHeight: 1.8,
          opacity: p(f, at(5), 16),
        }}
      >
        操作数藏在栈顶 —— 指令里不写地址，这叫零地址
      </div>

      {/* 右：状态板 */}
      <Board x={1000} y={72} w={690} h={78} active={["mem", "reg"]} delay={at(4)} />
      <div
        style={{
          position: "absolute",
          left: 1004,
          top: 200,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.ink2,
          letterSpacing: 0.4,
          opacity: p(f, at(4) + 14, 18),
        }}
      >
        一条 push 动两份：
      </div>
      <div style={{ position: "absolute", left: 1004, top: 246, display: "flex", gap: 12, opacity: p(f, at(4) + 18, 16) }}>
        <Tok x={0} y={0} text="MEM 写入" color={T.orange} delay={at(4) + 18} size={19} />
        <Tok x={130} y={0} text="REG(esp) −4" color={T.blue} delay={at(4) + 24} size={19} />
      </div>

      <Head x={1004} y={340} text="交换两个寄存器" color={T.ink2} delay={at(6)} size={19} />
      <Code
        x={1000}
        y={390}
        w={620}
        delay={at(6) + 6}
        size={22}
        lines={[
          { t: "push  eax", note: "存起来", hl: T.orange },
          { t: "push  ebx", note: "再存一个", hl: T.orange },
          { t: "pop   eax", note: "后进先出", hl: T.green },
          { t: "pop   ebx", note: "顺序反过来", hl: T.green },
        ]}
      />

      <Subs sceneId="s03" />
    </Stage>
  );
};

// ==========================================================================
// s04 · 加减乘除：乘法的固定寄存器对是这一场的重心
// ==========================================================================
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s04");

  const flags = [
    { k: "ZF", d: "结果为零", c: T.yellow },
    { k: "SF", d: "结果为负", c: T.blue },
    { k: "CF", d: "无符号进位", c: T.orange },
    { k: "OF", d: "有符号溢出", c: T.red },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={170} text="算术逻辑 · 加减与乘除" color={T.yellow} delay={at(0)} size={19} />
      <Write text="add / sub" delay={at(0) + 6} dur={20} size={48} weight={600} color={T.yellow} style={{ position: "absolute", left: 144, top: 200 }} />

      <Code
        x={140}
        y={280}
        w={640}
        delay={at(0) + 10}
        size={22}
        lines={[
          { t: "add  eax, ebx", note: "eax ← eax + ebx", hl: T.yellow },
          { t: "sub  eax, 10", note: "eax ← eax − 10", hl: T.yellow },
          { t: "add  [var], cl", note: "目的地也可以是内存", hl: T.orange },
        ]}
      />

      {/* 标志位：四个小格 */}
      <Head x={140} y={504} text="顺手更新四个标志" color={T.ink2} delay={at(1)} size={18} />
      {flags.map((fl, i) => {
        const d = at(1) + 8 + i * 6;
        const v = p(f, d, 16);
        return (
          <div
            key={fl.k}
            style={{
              position: "absolute",
              left: 140 + i * 168,
              top: 550,
              width: 152,
              height: 96,
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
            <span style={{ fontFamily: F.mono, fontSize: 24, color: fl.c, letterSpacing: 1 }}>{fl.k}</span>
            <span style={{ fontFamily: F.cn, fontSize: 14, color: T.sub }}>{fl.d}</span>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 712,
          width: 640,
          fontFamily: F.cn,
          fontSize: 19,
          lineHeight: 1.75,
          color: T.faint,
          opacity: p(f, at(1) + 34, 18),
        }}
      >
        运算的副产品
        <div style={{ color: T.sub }}>也是编译器判断分支的唯一依据</div>
      </div>

      {/* 右侧：寄存器对 */}
      <Board x={1000} y={72} w={690} h={78} active={["reg", "flag"]} delay={at(1) + 10} />

      <Head x={1000} y={212} text="乘除被绑在这个寄存器对上" color={T.ink2} delay={at(3)} size={19} />
      <RegPair
        x={1000}
        y={262}
        w={560}
        h={92}
        delay={at(3) + 8}
        note="乘：64 位乘积倒进来 ／ 除：64 位被除数从这里取"
        highlight={null}
      />

      <Code
        x={1000}
        y={430}
        w={690}
        delay={at(4) + 6}
        size={21}
        lines={[
          { t: "mov  eax, 6", dim: true },
          { t: "mov  ebx, 4", dim: true },
          { t: "mul  ebx", note: "乘积 → EDX:EAX", hl: T.purple },
          { t: "div  ecx", note: "商 → EAX，余 → EDX", hl: T.blue },
        ]}
      />

      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 694,
          width: 690,
          fontFamily: F.cn,
          fontSize: 19,
          lineHeight: 1.9,
          color: T.sub,
          opacity: p(f, at(5), 16),
        }}
      >
        <div>
          <span style={{ fontFamily: F.mono, color: T.red }}>xor edx, edx</span> 无符号除法前清零高位
        </div>
        <div>
          <span style={{ fontFamily: F.mono, color: T.red }}>cdq</span> 有符号除法前做符号扩展
        </div>
        <div style={{ color: T.red, marginTop: 4 }}>除零 → 硬件直接触发异常</div>
      </div>

      <Subs sceneId="s04" />
    </Stage>
  );
};

// ==========================================================================
// s05 · 位操作与移位：补什么，决定它是哪一种移位
// ==========================================================================
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s05");

  const ops = [
    { k: "AND", d: "清零指定位", c: T.blue },
    { k: "OR", d: "置一指定位", c: T.green },
    { k: "XOR", d: "翻转指定位", c: T.yellow },
    { k: "NOT", d: "全部位取反", c: T.purple },
  ];

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <Head x={140} y={168} text="算术逻辑 · 位操作与移位" color={T.yellow} delay={at(0)} size={19} />

      {ops.map((o, i) => {
        const d = at(0) + 8 + i * 6;
        const v = p(f, d, 16);
        return (
          <div
            key={o.k}
            style={{
              position: "absolute",
              left: 140 + i * 250,
              top: 208,
              width: 232,
              height: 86,
              borderRadius: 8,
              border: `1px solid ${o.c}88`,
              background: `${o.c}1A`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              opacity: v,
              transform: `translateY(${(1 - v) * 8}px)`,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 22, color: o.c, letterSpacing: 1.4 }}>{o.k}</span>
            <span style={{ fontFamily: F.cn, fontSize: 14, color: T.sub }}>{o.d}</span>
          </div>
        );
      })}

      {/* xor eax, eax 清零示意 */}
      <Head x={140} y={330} text="自己异或自己，结果必定为零" color={T.ink2} delay={at(2)} size={17} />
      <Bits bits="10110110" x={148} y={368} cw={30} ch={38} gap={3} delay={at(2) + 6} color={T.ink2} size={19} />
      <div
        style={{
          position: "absolute",
          left: 157,
          top: 412,
          fontFamily: F.mono,
          fontSize: 22,
          color: T.yellow,
          opacity: p(f, at(2) + 14, 14),
        }}
      >
        ^
      </div>
      <Bits bits="10110110" x={148} y={444} cw={30} ch={38} gap={3} delay={at(2) + 12} color={T.ink2} size={19} />
      <div
        style={{
          position: "absolute",
          left: 442,
          top: 420,
          fontFamily: F.mono,
          fontSize: 20,
          color: T.faint,
          opacity: p(f, at(2) + 18, 14),
        }}
      >
        =
      </div>
      <Bits
        bits="00000000"
        x={494}
        y={406}
        cw={30}
        ch={38}
        gap={3}
        delay={at(2) + 20}
        color={T.green}
        size={19}
        paint={{ 0: T.green, 1: T.green, 2: T.green, 3: T.green, 4: T.green, 5: T.green, 6: T.green, 7: T.green }}
      />

      {/* 三种移位 */}
      <Head x={140} y={540} text="三种移位 · 区别只在空出来的位补什么" color={T.ink2} delay={at(3)} size={18} />

      <Shift
        x={148}
        y={586}
        tag="SHL  al, 1   逻辑左移"
        tagColor={T.blue}
        from="10000000"
        to="00000000"
        fill={[7]}
        fillColor={T.blue}
        carry="1"
        delay={at(4)}
        cw={32}
        ch={40}
      />
      <Shift
        x={548}
        y={586}
        tag="SAR  al, 1   算术右移"
        tagColor={T.yellow}
        from="11110000"
        to="11111000"
        fill={[0]}
        fillColor={T.yellow}
        carry="0"
        delay={at(5)}
        cw={32}
        ch={40}
      />
      <Shift
        x={948}
        y={586}
        tag="ROR  al, 1   循环右移"
        tagColor={T.teal}
        from="10000001"
        to="11000000"
        fill={[0]}
        fillColor={T.teal}
        carry="1"
        delay={at(6)}
        cw={32}
        ch={40}
      />

      <div
        style={{
          position: "absolute",
          left: 148,
          top: 806,
          fontFamily: F.cn,
          fontSize: 19,
          color: T.sub,
          letterSpacing: 0.4,
          opacity: p(f, at(6) + 12, 16),
        }}
      >
        补 0 → 无符号 ／ 补符号位 → 有符号 ／ 补回来 → 一个比特都不丢
      </div>

      <Fade delay={at(7)} y={8}>
        <div
          style={{
            position: "absolute",
            left: 1140,
            top: 806,
            fontFamily: F.mono,
            fontSize: 20,
            color: T.orange,
            letterSpacing: 0.6,
          }}
        >
          shl eax, 1  ≡  ×2
        </div>
      </Fade>

      <Board x={1000} y={72} w={690} h={78} active={["reg", "flag"]} delay={at(0) + 12} />

      <Subs sceneId="s05" />
    </Stage>
  );
};
