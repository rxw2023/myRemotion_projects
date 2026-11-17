import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Chip, Rule, Stage, Subs, Table, Write, p, useCues } from "../shared/b3b/ui";
import { Code, Head, Stack, Tok } from "./parts";

// ==========================================================================
// s06 · 选择结构：判断 → 跳转 → 执行 → 合流
// ==========================================================================
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s06");
  const flow = [
    { zh: "判断", en: "cmp eax, ebx", c: T.blue },
    { zh: "跳转", en: "jle else_label", c: T.yellow },
    { zh: "执行", en: "mov max, eax", c: T.green },
    { zh: "合流", en: "jmp endif_label", c: T.purple },
  ];

  return (
    <Stage label="第二幕 · 选择结构">
      <Head x={140} y={136} text="IF / ELSE · 两行 C，八行汇编" color={T.blue} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 168 }}>
        <Write text="if 落到汇编，是四步" delay={at(0) + 4} size={40} weight={500} />
      </div>

      <Code
        x={140}
        y={288}
        w={400}
        title="C"
        delay={at(1) - 10}
        size={21}
        lines={[
          { t: "if (a > b)", c: T.ink },
          { t: "  max = a;", c: T.ink },
          { t: "else", c: T.ink },
          { t: "  max = b;", c: T.ink },
        ]}
      />

      <Code
        x={590}
        y={256}
        w={760}
        title="x86 · eax = a, ebx = b"
        delay={at(1)}
        size={22}
        stagger={10}
        lines={[
          { t: "cmp  eax, ebx", c: T.blue, hl: T.blue, note: "只改标志位" },
          { t: "jle  else_label", c: T.yellow, hl: T.yellow, note: "a ≤ b 就跳走" },
          { t: "mov  max, eax", c: T.ink2, note: "a 更大" },
          { t: "jmp  endif_label", c: T.purple, hl: T.purple, note: "不跳就串了" },
          { t: "else_label:", c: T.faint },
          { t: "mov  max, ebx", c: T.ink2, note: "b 更大" },
          { t: "endif_label:", c: T.faint, hl: T.green, note: "合流点" },
        ]}
      />

      {/* 右侧：控制流四步 */}
      <Head x={1420} y={256} text="控制流" color={T.faint} delay={at(7) - 8} />
      {flow.map((s, i) => (
        <React.Fragment key={s.zh}>
          <div
            style={{
              position: "absolute",
              left: 1420,
              top: 292 + i * 104,
              width: 340,
              height: 76,
              borderRadius: 9,
              border: `1.5px solid ${s.c}55`,
              background: `${s.c}0E`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingLeft: 18,
              boxSizing: "border-box",
              opacity: p(f, at(7) - 6 + i * 6, 16),
            }}
          >
            <span style={{ position: "absolute", left: 18, fontFamily: F.mono, fontSize: 15, color: s.c }}>0{i + 1}</span>
            <span style={{ position: "absolute", left: 54, fontFamily: F.cn, fontSize: 22, color: T.ink }}>{s.zh}</span>
            <span style={{ position: "absolute", right: 18, fontFamily: F.mono, fontSize: 15, color: T.faint }}>
              {s.en.split(" ")[0]}
            </span>
          </div>
          {i < flow.length - 1 ? (
            <Arrow from={[1590, 370 + i * 104]} to={[1590, 390 + i * 104]} color={T.faint} delay={at(7) - 2 + i * 6} dur={8} />
          ) : null}
        </React.Fragment>
      ))}

      <div style={{ position: "absolute", left: 140, top: 692, width: 1230, opacity: p(f, at(5) - 6, 18) }}>
        <div style={{ fontFamily: F.cn, fontSize: 20, color: T.sub, lineHeight: 1.7 }}>
          少了那条 <span style={{ fontFamily: F.mono, color: T.purple }}>jmp</span>，CPU 会顺着往下把 else 也执行一遍 ——
          分支的边界不是括号，是跳转。
        </div>
      </div>

      <Rule w={1580} color={T.line} delay={at(8) - 8} dur={26} style={{ position: "absolute", left: 140, top: 772 }} />
      <div style={{ position: "absolute", left: 140, top: 804, width: 1580 }}>
        <Write
          text="跳转的代价，是已经取进来的指令要作废。"
          delay={at(8)}
          size={27}
          color={T.ink2}
        />
      </div>

      <Chip x={1466} y={196} text="分支 = 跳转" color={T.yellow} size={16} delay={at(2) + 8} />
      <Subs sceneId="s06" />
    </Stage>
  );
};

// ==========================================================================
// s07 · 循环：三种写法，判断的位置不一样
// ==========================================================================
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s07");
  const cols = [
    {
      name: "while",
      c: T.blue,
      cLines: ["while (count < 10)", "  count++;"],
      asm: ["start:", "  cmp ecx, 10", "  jge end", "  inc ecx", "  jmp start", "end:"],
      note: "先判断 · 可能 0 次",
      order: "判断 → 执行 → 回跳",
      d: 1,
    },
    {
      name: "do-while",
      c: T.teal,
      cLines: ["do {", "  count++;", "} while (count < 10);"],
      asm: ["start:", "  inc ecx", "  cmp ecx, 10", "  jl start", "end:"],
      note: "先执行 · 至少 1 次",
      order: "执行 → 判断 → 回跳",
      d: 3,
    },
    {
      name: "for",
      c: T.orange,
      cLines: ["for (int i=0; i<10; i++)", "  sum += i;"],
      asm: ["  mov ecx, 0", "loop:", "  cmp ecx, 10", "  jge done", "  add eax, ecx", "  inc ecx", "  jmp loop", "done:"],
      note: "三段拆开 · 本质是 while",
      order: "初始化 → 判断 → 执行 → 更新 → 回跳",
      d: 5,
    },
  ];

  return (
    <Stage label="第二幕 · 循环结构">
      <Head x={140} y={136} text="WHILE / DO-WHILE / FOR" color={T.teal} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 168 }}>
        <Write text="三种写法，两个方向" delay={at(0) + 4} size={40} weight={500} />
      </div>

      {cols.map((c, i) => (
        <React.Fragment key={c.name}>
          <div
            style={{
              position: "absolute",
              left: 140 + i * 560,
              top: 268,
              width: 500,
              opacity: p(f, at(c.d) - 4, 18),
              transform: `translateY(${(1 - p(f, at(c.d) - 4, 18)) * 10}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: F.mono, fontSize: 30, color: c.c, letterSpacing: 1 }}>{c.name}</span>
              <span style={{ fontFamily: F.cn, fontSize: 16, color: T.faint }}>{c.note}</span>
            </div>
            <Rule w={460} color={`${c.c}55`} delay={at(c.d) - 2} dur={20} style={{ marginTop: 12 }} />
            {c.cLines.map((l, j) => (
              <div
                key={l}
                style={{
                  fontFamily: F.mono,
                  fontSize: 18,
                  color: T.sub,
                  lineHeight: 1.9,
                  marginTop: j === 0 ? 12 : 0,
                  whiteSpace: "pre",
                  opacity: p(f, at(c.d) + 2 + j * 3, 12),
                }}
              >
                {l}
              </div>
            ))}
          </div>

          <Code x={140 + i * 560} y={445} w={460} delay={at(c.d) + 8} size={18} stagger={7} lh={1.75}
            lines={c.asm.map((t) => ({
              t,
              c: t.startsWith("j") ? T.yellow : t.startsWith("cmp") ? T.blue : t.endsWith(":") ? T.faint : T.ink2,
            }))}
          />

          <div
            style={{
              position: "absolute",
              left: 140 + i * 560,
              top: 806,
              width: 460,
              fontFamily: F.mono,
              fontSize: 17,
              color: c.c,
              letterSpacing: 0.5,
              opacity: p(f, at(7) - 6 + i * 4, 16) * 0.85,
            }}
          >
            {c.order}
          </div>
        </React.Fragment>
      ))}

      <Rule w={1580} color={T.line} delay={at(7) - 8} dur={24} style={{ position: "absolute", left: 140, top: 866 }} />
      <div style={{ position: "absolute", left: 140, top: 896 }}>
        <Write text="差别只有一个：判断放在循环体的前面，还是后面。" delay={at(7)} size={28} color={T.ink2} />
      </div>

      <Subs sceneId="s07" />
    </Stage>
  );
};

// ==========================================================================
// s08 · 栈帧：ebp 上下的分界线
// ==========================================================================
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s08");
  const needs = ["传参", "存局部变量", "返回结果", "回到原处"];

  return (
    <Stage label="第二幕 · 函数调用">
      <Head x={140} y={136} text="FUNCTION CALL · 唯一需要栈的地方" color={T.orange} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 168 }}>
        <Write text="每次调用，都在栈上划一块地" delay={at(2)} size={40} weight={500} />
      </div>

      <Head x={140} y={286} text="要解决四件事" color={T.faint} delay={at(1)} />
      {needs.map((n, i) => (
        <div
          key={n}
          style={{
            position: "absolute",
            left: 140,
            top: 330 + i * 66,
            fontFamily: F.cn,
            fontSize: 24,
            color: T.ink2,
            opacity: p(f, at(1) + i * 5, 16),
            transform: `translateX(${(1 - p(f, at(1) + i * 5, 16)) * 10}px)`,
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 16, color: T.orange, marginRight: 14 }}>0{i + 1}</span>
          {n}
        </div>
      ))}

      <Head x={640} y={252} text="栈帧 STACK FRAME" color={T.sub} delay={at(3) - 6} />

      <Stack
        x={700}
        y={292}
        w={460}
        gap={6}
        delay={at(3)}
        stagger={6}
        ebpAt={4}
        cells={[
          { label: "caller 的参数", note: "", dim: true, dashed: true, h: 48 },
          { label: "参数 2", note: "[ebp+12]", color: T.blue, h: 66 },
          { label: "参数 1", note: "[ebp+8]", color: T.blue, h: 66 },
          { label: "返回地址", note: "[ebp+4]", color: T.yellow, h: 66 },
          { label: "旧的 ebp", note: "[ebp]", color: T.orange, h: 66, dim: true },
          { label: "局部变量 1", note: "[ebp-4]", color: T.green, h: 66 },
          { label: "局部变量 2", note: "[ebp-8]", color: T.green, h: 66 },
        ]}
      />

      <div
        style={{
          position: "absolute",
          left: 1190,
          top: 300,
          fontFamily: F.mono,
          fontSize: 16,
          color: T.faint,
          letterSpacing: 1,
          opacity: p(f, at(3) + 10, 14),
        }}
      >
        高地址
      </div>
      <div
        style={{
          position: "absolute",
          left: 1190,
          top: 800,
          fontFamily: F.mono,
          fontSize: 16,
          color: T.faint,
          letterSpacing: 1,
          opacity: p(f, at(3) + 10, 14),
        }}
      >
        低地址
      </div>
      <Arrow from={[1216, 340]} to={[1216, 780]} color={`${T.faint}99`} delay={at(4)} dur={26} dashed />
      <div
        style={{
          position: "absolute",
          left: 1242,
          top: 468,
          fontFamily: F.cn,
          fontSize: 17,
          color: T.sub,
          letterSpacing: 1,
          opacity: p(f, at(4) + 6, 16),
        }}
      >
        生长方向
      </div>

      <div style={{ position: "absolute", left: 1420, top: 380, width: 380, opacity: p(f, at(8) - 10, 18) }}>
        <div style={{ fontFamily: F.cn, fontSize: 20, color: T.blue, lineHeight: 1.8 }}>ebp 以上：参数</div>
        <div style={{ fontFamily: F.cn, fontSize: 20, color: T.green, lineHeight: 1.8, marginTop: 8 }}>ebp 以下：局部变量</div>
        <div style={{ fontFamily: F.cn, fontSize: 18, color: T.faint, lineHeight: 1.8, marginTop: 8 }}>
          ebp 本身存着 caller 的 ebp
        </div>
      </div>

      <div style={{ position: "absolute", left: 140, top: 866 }}>
        <Write text="esp 指向栈顶，ebp 锚住栈底 —— 两个指针圈出一块地。" delay={at(3) + 10} size={26} color={T.sub} />
      </div>

      <Subs sceneId="s08" />
    </Stage>
  );
};

// ==========================================================================
// s09 · add 函数：教科书式的最短回路
// ==========================================================================
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s09");

  return (
    <Stage label="第二幕 · 函数定义">
      <Head x={140} y={136} text="A REAL FUNCTION · int add(int x, int y)" color={T.teal} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 168 }}>
        <Write text="一个函数，七条指令" delay={at(0) + 4} size={40} weight={500} />
      </div>

      <Code
        x={140}
        y={286}
        w={400}
        title="C"
        delay={at(0) + 6}
        size={21}
        lines={[
          { t: "int add(int x, int y) {", c: T.ink },
          { t: "  return x + y;", c: T.ink },
          { t: "}", c: T.ink },
        ]}
      />

      <Code
        x={580}
        y={252}
        w={680}
        title="x86 · cdecl"
        delay={at(1)}
        size={22}
        stagger={9}
        lines={[
          { t: "add:", c: T.faint },
          { t: "push ebp", c: T.orange, hl: T.orange, note: "保住 caller 栈底" },
          { t: "mov  ebp, esp", c: T.orange, hl: T.orange, note: "建立自己的栈帧" },
          { t: "mov  eax, [ebp+8]", c: T.blue, hl: T.blue, note: "x" },
          { t: "add  eax, [ebp+12]", c: T.blue, hl: T.blue, note: "y" },
          { t: "mov  esp, ebp", c: T.green, note: "丢弃局部变量" },
          { t: "pop  ebp", c: T.green, note: "恢复 caller 栈底" },
          { t: "ret", c: T.yellow, hl: T.yellow, note: "弹返回地址" },
        ]}
      />

      <Head x={1420} y={252} text="为什么是 +8 / +12" color={T.faint} delay={at(4) - 6} />
      <Stack
        x={1420}
        y={292}
        w={340}
        gap={6}
        delay={at(4)}
        stagger={7}
        ebpAt={3}
        cells={[
          { label: "y", note: "[ebp+12]", color: T.blue, h: 62 },
          { label: "x", note: "[ebp+8]", color: T.blue, h: 62 },
          { label: "返回地址", note: "[ebp+4]", color: T.yellow, h: 62 },
          { label: "旧的 ebp", note: "[ebp]", color: T.orange, h: 62 },
        ]}
      />
      <div
        style={{
          position: "absolute",
          left: 1420,
          top: 610,
          width: 360,
          fontFamily: F.cn,
          fontSize: 17,
          color: T.sub,
          lineHeight: 1.7,
          opacity: p(f, at(5), 16),
        }}
      >
        ebp 往上是旧 ebp 和返回地址，各占 4 字节 —— 所以第一个参数落在 +8。
      </div>

      <div style={{ position: "absolute", left: 140, top: 544, width: 420, opacity: p(f, at(3) - 4, 18) }}>
        <Tok x={0} y={0} text="push ebp / mov ebp, esp" color={T.orange} delay={at(3)} size={19} />
        <div style={{ marginTop: 54, fontFamily: F.cn, fontSize: 18, color: T.sub, lineHeight: 1.6 }}>
          所有函数的开场白，<br />一条都不能少
        </div>
      </div>

      <div style={{ position: "absolute", left: 140, top: 700, width: 1120 }}>
        <Write text="函数的入口是 ebp，出口是 eax。" delay={at(6)} size={28} color={T.ink2} />
      </div>

      <Subs sceneId="s09" />
    </Stage>
  );
};

// ==========================================================================
// s10 · 调用者：栈指针一路在动
// ==========================================================================
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s10");
  const steps = [
    { t: "push 5", n: "最后一个参数先入栈", c: T.blue },
    { t: "push 3", n: "第一个参数后入栈", c: T.blue },
    { t: "call _add", n: "压返回地址并跳转", c: T.yellow },
    { t: "add esp, 8", n: "调用者清理参数", c: T.green },
  ];

  return (
    <Stage label="第二幕 · 函数调用">
      <Head x={140} y={132} text="THE CALLER · func() 调 add(3, 5)" color={T.purple} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 164 }}>
        <Write text="整段没有魔法，只有 esp 在动" delay={at(0) + 4} size={38} weight={500} />
      </div>

      <Code
        x={140}
        y={272}
        w={360}
        title="C"
        delay={at(0) + 6}
        size={18}
        lines={[
          { t: "void func() {", c: T.ink },
          { t: "  int sum =", c: T.ink },
          { t: "    add(3,5);", c: T.ink },
          { t: "  int var =", c: T.ink },
          { t: "    sum*2;", c: T.ink },
          { t: "}", c: T.ink },
        ]}
      />

      <Code
        x={560}
        y={236}
        w={660}
        title="x86 · cdecl"
        delay={at(1)}
        size={20}
        stagger={7}
        lh={1.85}
        lines={[
          { t: "_func:", c: T.faint },
          { t: "push ebp", c: T.ink2 },
          { t: "mov  ebp, esp", c: T.ink2 },
          { t: "sub  esp, 8", c: T.green, hl: T.green, note: "sum, var" },
          { t: "push 5", c: T.blue, hl: T.blue, note: "参数倒序" },
          { t: "push 3", c: T.blue, hl: T.blue },
          { t: "call _add", c: T.yellow, hl: T.yellow, note: "压返回地址" },
          { t: "add  esp, 8", c: T.green, hl: T.green, note: "清参数" },
          { t: "mov  [ebp-4], eax", c: T.purple, hl: T.purple, note: "sum = 返回值" },
          { t: "mov  eax, [ebp-4]", c: T.ink2 },
          { t: "shl  eax, 1", c: T.orange, hl: T.orange, note: "× 2" },
          { t: "mov  [ebp-8], eax", c: T.ink2, note: "var" },
          { t: "mov  esp, ebp", c: T.green, note: "一次回收" },
          { t: "pop  ebp", c: T.ink2 },
          { t: "ret", c: T.ink2 },
        ]}
      />

      <Head x={1300} y={236} text="栈的四次变化" color={T.faint} delay={at(3) - 4} />
      {steps.map((s, i) => (
        <React.Fragment key={s.t}>
          <div
            style={{
              position: "absolute",
              left: 1300,
              top: 276 + i * 118,
              width: 480,
              opacity: p(f, at(3) + i * 8, 16),
              transform: `translateX(${(1 - p(f, at(3) + i * 8, 16)) * 10}px)`,
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 23, color: s.c }}>{s.t}</div>
            <div style={{ fontFamily: F.cn, fontSize: 19, color: T.sub, marginTop: 8 }}>{s.n}</div>
          </div>
          {i < steps.length - 1 ? (
            <Arrow from={[1320, 332 + i * 118]} to={[1320, 372 + i * 118]} color={T.faint} delay={at(3) + i * 8 + 4} dur={8} />
          ) : null}
        </React.Fragment>
      ))}

      <div style={{ position: "absolute", left: 1300, top: 760, width: 500, opacity: p(f, at(8) - 6, 18) }}>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: T.sub, lineHeight: 1.7 }}>
          <span style={{ fontFamily: F.mono, color: T.green }}>mov esp, ebp</span> 挪一下指针，
          两个局部变量一起回收，不用逐个 pop。
        </div>
      </div>

      <Subs sceneId="s10" />
    </Stage>
  );
};

// ==========================================================================
// s11 · 考点表 + 收口
// ==========================================================================
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s11");
  const groups = [
    { h: "链接三件事", b: ["符号解析", "重定位", "合并段"], c: T.green },
    { h: "控制结构", b: ["cmp 改标志位", "jcc 看标志位", "jmp 无条件"], c: T.yellow },
    { h: "栈帧顺序", b: ["参数 → 返回地址", "旧 ebp → 局部变量", "返回值在 eax"], c: T.blue },
  ];

  return (
    <Stage label="收口 · 考点表">
      <Head x={140} y={132} text="SUMMARY · 一张表收口" color={T.sub} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 164 }}>
        <Write text="四步流程，一条链" delay={at(0) + 4} size={38} weight={500} />
      </div>

      <Table
        x={140}
        y={252}
        delay={at(1)}
        stagger={10}
        rowH={64}
        size={23}
        cols={[
          { label: "阶段", w: 240 },
          { label: "输入", w: 460 },
          { label: "输出", w: 520 },
          { label: "角色", w: 400 },
        ]}
        rows={[
          { cells: ["预处理", "源文件 .c", "扩展代码 .i", "预处理器 · 文本替换"], color: T.blue },
          { cells: ["编译", "扩展代码 .i", "汇编代码 .s", "编译器 · 翻译语言"], color: T.yellow },
          { cells: ["汇编", "汇编代码 .s", "目标文件 .o", "汇编器 · 照表翻译"], color: T.orange },
          { cells: ["链接", "目标文件 .o", "可执行文件", "链接器 · 补齐地址"], color: T.green },
        ]}
      />

      {groups.map((g, i) => (
        <div
          key={g.h}
          style={{
            position: "absolute",
            left: 140 + i * 540,
            top: 640,
            width: 480,
            opacity: p(f, at(4) + i * 8, 18),
            transform: `translateY(${(1 - p(f, at(4) + i * 8, 18)) * 10}px)`,
          }}
        >
          <div style={{ fontFamily: F.cn, fontSize: 21, color: g.c, letterSpacing: 1 }}>{g.h}</div>
          <Rule w={440} color={`${g.c}44`} delay={at(4) + i * 8 + 4} dur={18} style={{ marginTop: 10 }} />
          {g.b.map((x, j) => (
            <div
              key={x}
              style={{
                fontFamily: F.cn,
                fontSize: 18,
                color: T.ink2,
                lineHeight: 1.95,
                marginTop: j === 0 ? 10 : 0,
                opacity: p(f, at(4) + i * 8 + 4 + j * 3, 12),
              }}
            >
              {x}
            </div>
          ))}
        </div>
      ))}

      <div style={{ position: "absolute", left: 140, top: 900 }}>
        <Write text="机器码里没有魔法，只有搬运和跳转。" delay={at(7)} size={26} color={T.sub} />
      </div>

      <Subs sceneId="s11" />
    </Stage>
  );
};
