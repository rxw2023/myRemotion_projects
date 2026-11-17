import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Chip, Fade, Rule, Stage, Subs, Write, p, useCues } from "../shared/b3b/ui";
import { Code, Head, Item, PhaseCard, Tok } from "./parts";

// ==========================================================================
// s00 · 主题页：这是哪一期、讲哪三件事、主线是什么
// 之前的几期都是从第一个问题直接切入，这一期按需求先给一张"门牌"。
// ==========================================================================
export const S00: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s00");
  const toc = [
    { n: 1, zh: "编译四步", note: "preprocess · compile · assemble · link" },
    { n: 2, zh: "控制结构的汇编", note: "if / while / for" },
    { n: 3, zh: "函数调用与栈帧", note: "push · call · ebp · ret" },
  ];
  const thread = ["比较  cmp", "跳转  jcc / jmp", "压栈  push", "弹栈  pop"];

  return (
    <Stage label="408 · 计算机组成原理 · 指令系统">
      <div style={{ position: "absolute", left: 140, top: 148 }}>

        <div
          style={{
            fontFamily: F.mono,
            fontSize: 18,
            letterSpacing: 3,
            color: T.faint,
            opacity: p(f, at(0), 16),
          }}
        >
          HIGH-LEVEL LANGUAGE → MACHINE CODE
        </div>

        <Write
          text="高级语言与机器码"
          delay={at(0) + 6}
          dur={30}
          size={92}
          weight={600}
          spacing={4}
          style={{ marginTop: 16, textShadow: `0 0 90px ${T.blue}22` }}
        />

        <Rule w={760} color={`${T.yellow}88`} h={2} delay={at(0) + 20} dur={34} style={{ marginTop: 22 }} />
      </div>

      <div style={{ position: "absolute", left: 140, top: 372 }}>
        {toc.map((t, i) => (
          <Item
            key={t.n}
            x={0}
            y={i * 96}
            i={t.n}
            title={t.zh}
            note={t.note}
            w={880}
            size={30}
            color={T.teal}
            delay={at(1 + i)}
          />
        ))}
      </div>

      {/* 右侧：全片主线 */}
      <div
        style={{
          position: "absolute",
          left: 1130,
          top: 372,
          width: 620,
          height: 330,
          borderRadius: 14,
          border: `1px solid ${T.line}`,
          background: "rgba(255,255,255,0.02)",
          opacity: p(f, at(4), 22),
        }}
      />
      <Head x={1170} y={400} text="全片一条主线" color={T.yellow} delay={at(4) + 6} />
      {thread.map((t, i) => (
        <Tok
          key={t}
          x={1170}
          y={452 + i * 60}
          text={t}
          color={[T.blue, T.yellow, T.orange, T.green][i]}
          delay={at(4) + 12 + i * 5}
          size={23}
        />
      ))}

      {/* 底部：定位说明 */}
      <div style={{ position: "absolute", left: 140, top: 800 }}>
        <Write text="四道工序 · 三类语句 · 一组动作" delay={at(5)} size={40} weight={500} color={T.ink} />
        <Fade delay={at(5) + 24} y={10}>
          <div style={{ fontFamily: F.cn, fontSize: 21, color: T.sub, marginTop: 14, letterSpacing: 0.6 }}>
            优先级不高，但它是理解"程序怎么跑起来"的唯一入口 —— 大题里的汇编片段，全靠这一期打底。
          </div>
        </Fade>
      </div>

      <Chip x={1560} y={150} text="本节 · 低优先级" color={T.red} size={17} delay={at(0) + 10} />
      <Subs sceneId="s00" />
    </Stage>
  );
};

// ==========================================================================
// s01 · 编译四步：一条链，四个换手的人
// ==========================================================================
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s01");
  const steps = [
    { n: 1, zh: "预处理", en: "PREPROCESS", role: "预处理器只做文本替换，不看语法", out: ".i 扩展代码", c: T.blue },
    { n: 2, zh: "编译", en: "COMPILE", role: "编译器翻译语言，最耗脑子的一步", out: ".s 汇编代码", c: T.yellow },
    { n: 3, zh: "汇编", en: "ASSEMBLE", role: "汇编器照表翻译，一条对一条", out: ".o 目标文件", c: T.orange },
    { n: 4, zh: "链接", en: "LINK", role: "链接器把多个目标文件拼成一个程序", out: "可执行文件", c: T.green },
  ];
  const arts = [
    { t: "main.c", c: T.blue },
    { t: "main.i", c: T.blue },
    { t: "main.s", c: T.yellow },
    { t: "main.o", c: T.orange },
    { t: "a.out", c: T.green },
  ];

  return (
    <Stage label="第一幕 · 四道工序">
      <Head x={140} y={142} text="一份源文件，到能跑的程序" color={T.sub} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 176 }}>
        <Write text="中间要换四次手" delay={at(1) - 10} size={44} weight={500} />
      </div>

      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <PhaseCard
            x={140 + i * 412}
            y={272}
            w={350}
            n={s.n}
            zh={s.zh}
            en={s.en}
            role={s.role}
            out={s.out}
            color={s.c}
            delay={at(i)}
          />
          {i < 3 ? (
            <Arrow from={[140 + i * 412 + 360, 400]} to={[140 + i * 412 + 404, 400]} color={T.faint} delay={at(i) + 12} dur={10} />
          ) : null}
        </React.Fragment>
      ))}

      {/* 产物链 */}
      <Head x={140} y={578} text="产物形态 · 每一环的出口就是下一环的入口" color={T.faint} delay={at(4) - 8} />
      <div style={{ position: "absolute", left: 140, top: 614, display: "flex", alignItems: "center", gap: 18 }}>
        {arts.map((a, i) => (
          <React.Fragment key={a.t}>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 28,
                color: a.c,
                opacity: p(f, at(4) + i * 8, 14),
                letterSpacing: 1,
              }}
            >
              {a.t}
            </span>
            {i < arts.length - 1 ? (
              <span style={{ fontFamily: F.mono, fontSize: 22, color: T.faint, opacity: p(f, at(4) + i * 8 + 4, 12) }}>→</span>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      <Rule w={1560} color={T.line} delay={at(5) - 6} dur={26} style={{ position: "absolute", left: 140, top: 700 }} />
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 738,
          fontFamily: F.mono,
          fontSize: 18,
          color: T.faint,
          letterSpacing: 2,
          opacity: p(f, at(5), 14),
        }}
      >
        文本
      </div>
      <Arrow from={[200, 750]} to={[1560, 750]} color={`${T.faint}CC`} delay={at(5) + 4} dur={34} dashed />
      <div
        style={{
          position: "absolute",
          left: 1580,
          top: 738,
          fontFamily: F.mono,
          fontSize: 18,
          color: T.faint,
          letterSpacing: 2,
          opacity: p(f, at(5) + 16, 14),
        }}
      >
        二进制
      </div>

      <div style={{ position: "absolute", left: 140, top: 806 }}>
        <Write text="越往后，离人越远，离机器越近。" delay={at(6)} size={36} color={T.ink2} />
      </div>

      <Subs sceneId="s01" />
    </Stage>
  );
};

// ==========================================================================
// s02 · 预处理：只做文本替换
// ==========================================================================
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s02");
  const jobs = [
    { t: "头文件包含", n: "#include → 展开", c: T.blue },
    { t: "宏替换", n: "#define → 换成值", c: T.yellow },
    { t: "删除注释", n: "/* */ // → 清空", c: T.orange },
  ];

  return (
    <Stage label="第一幕 · 预处理">
      <Head x={140} y={140} text="STEP 1 · PREPROCESS" color={T.blue} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 172 }}>
        <Write text="它不懂语法，只做文本替换" delay={at(0) + 4} size={42} weight={500} />
      </div>

      <Code
        x={140}
        y={268}
        w={620}
        title="main.c · 源文件"
        delay={at(2) - 6}
        size={23}
        lines={[
          { t: "#include <stdio.h>", c: T.blue, note: "头文件" },
          { t: "#define MAX 100", c: T.yellow, note: "宏" },
          { t: "" },
          { t: "int main() {" },
          { t: "  int a = MAX;", c: T.yellow, note: "用了宏" },
          { t: "  /* 求和 */", c: T.orange, note: "注释" },
          { t: '  printf("%d", a);' },
          { t: "}" },
        ]}
      />

      <Arrow from={[790, 470]} to={[1080, 470]} color={T.faint} delay={at(1) + 4} dur={22} />
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 418,
          width: 280,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 19,
          color: T.sub,
          opacity: p(f, at(1) + 10, 14),
        }}
      >
        只换字，不解释
      </div>

      <Code
        x={1110}
        y={268}
        w={670}
        title="main.i · 扩展代码"
        delay={at(1) + 10}
        size={23}
        lines={[
          { t: "int printf(const char*, ...);", c: T.blue, dim: true, note: "stdio.h 的内容" },
          { t: "..." , c: T.faint, dim: true },
          { t: "int main() {" },
          { t: "  int a = 100;", c: T.yellow, note: "MAX → 100" },
          { t: "" },
          { t: '  printf("%d", a);', note: "注释没了" },
          { t: "}" },
        ]}
      />

      {jobs.map((j, i) => (
        <React.Fragment key={j.t}>
          <div
            style={{
              position: "absolute",
              left: 140 + i * 566,
              top: 780,
              width: 500,
              opacity: p(f, at(i + 2) - 4, 18),
              transform: `translateY(${(1 - p(f, at(i + 2) - 4, 18)) * 10}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: F.mono, fontSize: 16, color: j.c }}>0{i + 1}</span>
              <span style={{ fontFamily: F.cn, fontSize: 27, color: T.ink }}>{j.t}</span>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 17, color: T.faint, marginTop: 8, marginLeft: 32 }}>{j.n}</div>
          </div>
        </React.Fragment>
      ))}

      <div style={{ position: "absolute", left: 140, top: 900 }}>
        <Write text="它连变量名和变量值都分不清 —— 只是换字。" delay={at(6)} size={26} color={T.yellow} />
      </div>

      <Subs sceneId="s02" />
    </Stage>
  );
};

// ==========================================================================
// s03 · 编译：五个子过程，和"编译 ≠ 汇编"这个坑
// ==========================================================================
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s03");
  const subs = [
    { t: "词法分析", n: "字符 → 记号", d: 2 },
    { t: "语法分析", n: "记号 → 语法树", d: 2 },
    { t: "语义分析", n: "类型是否匹配", d: 3 },
    { t: "中间代码", n: "与机器无关", d: 3 },
    { t: "目标代码生成", n: "写成汇编", d: 4 },
  ];

  return (
    <Stage label="第一幕 · 编译">
      <Head x={140} y={140} text="STEP 2 · COMPILE" color={T.yellow} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 172 }}>
        <Write text="唯一真正读懂语法的一步" delay={at(0) + 4} size={42} weight={500} />
      </div>

      <Tok x={140} y={282} text="扩展代码 .i" color={T.blue} delay={at(1)} size={21} />
      <Arrow from={[292, 300]} to={[318, 300]} color={T.faint} delay={at(1) + 6} dur={10} />

      {subs.map((s, i) => (
        <React.Fragment key={s.t}>
          <div
            style={{
              position: "absolute",
              left: 330 + i * 256,
              top: 252,
              width: 236,
              height: 96,
              borderRadius: 9,
              border: `1.5px solid ${T.yellow}44`,
              background: `${T.yellow}0A`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: p(f, at(s.d) - 8, 16),
              transform: `translateY(${(1 - p(f, at(s.d) - 8, 16)) * 8}px)`,
            }}
          >
            <span style={{ fontFamily: F.cn, fontSize: 22, color: T.ink }}>{s.t}</span>
            <span style={{ fontFamily: F.mono, fontSize: 15, color: T.sub }}>{s.n}</span>
          </div>
          {i < subs.length - 1 ? (
            <Arrow from={[330 + i * 256 + 238, 300]} to={[330 + i * 256 + 254, 300]} color={T.faint} delay={at(s.d) - 4} dur={8} />
          ) : null}
        </React.Fragment>
      ))}

      <Arrow from={[1618, 300]} to={[1642, 300]} color={T.faint} delay={at(4) + 4} dur={10} />
      <Tok x={1650} y={282} text=".s" color={T.green} delay={at(4) + 8} size={21} />

      {/* 辨析：编译 vs 汇编 */}
      <Head x={140} y={456} text="一个必须分清的词 · compilation ≠ assembly" color={T.red} delay={at(5) - 10} />

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 500,
          width: 780,
          height: 240,
          borderRadius: 12,
          border: `1.5px solid ${T.yellow}44`,
          background: `${T.yellow}08`,
          opacity: p(f, at(5), 18),
        }}
      />
      <div style={{ position: "absolute", left: 176, top: 528, fontFamily: F.cn, fontSize: 24, color: T.yellow, opacity: p(f, at(5) + 4, 14) }}>
        流程里的「编译」
      </div>
      <div style={{ position: "absolute", left: 176, top: 588, display: "flex", alignItems: "center", gap: 16, opacity: p(f, at(6) - 4, 16) }}>
        <span style={{ fontFamily: F.mono, fontSize: 22, color: T.blue }}>扩展代码</span>
        <span style={{ fontFamily: F.mono, fontSize: 20, color: T.faint }}>→</span>
        <span style={{ fontFamily: F.mono, fontSize: 22, color: T.green }}>汇编代码</span>
      </div>
      <div style={{ position: "absolute", left: 176, top: 648, fontFamily: F.cn, fontSize: 18, color: T.sub, opacity: p(f, at(5) + 10, 14) }}>
        到此为止，机器码不归它管
      </div>

      <div
        style={{
          position: "absolute",
          left: 960,
          top: 500,
          width: 780,
          height: 240,
          borderRadius: 12,
          border: `1.5px solid ${T.line}`,
          background: "rgba(255,255,255,0.015)",
          opacity: p(f, at(5) + 6, 18),
        }}
      />
      <div style={{ position: "absolute", left: 996, top: 528, fontFamily: F.cn, fontSize: 24, color: T.ink2, opacity: p(f, at(5) + 10, 14) }}>
        日常说的「编译」
      </div>
      <div style={{ position: "absolute", left: 996, top: 588, display: "flex", alignItems: "center", gap: 16, opacity: p(f, at(5) + 14, 16) }}>
        <span style={{ fontFamily: F.mono, fontSize: 22, color: T.blue }}>源程序</span>
        <span style={{ fontFamily: F.mono, fontSize: 20, color: T.faint }}>→</span>
        <span style={{ fontFamily: F.mono, fontSize: 22, color: T.green }}>可执行程序</span>
      </div>
      <div style={{ position: "absolute", left: 996, top: 648, fontFamily: F.cn, fontSize: 18, color: T.sub, opacity: p(f, at(5) + 18, 14) }}>
        指整条链，四个阶段一起
      </div>

      <div style={{ position: "absolute", left: 140, top: 800 }}>
        <Write text="分界线在这里：汇编代码归编译，目标文件归汇编。" delay={at(7)} size={32} color={T.ink2} />
      </div>

      <Chip x={1500} y={424} text="高频错点" color={T.red} size={16} delay={at(7) + 10} />
      <Subs sceneId="s03" />
    </Stage>
  );
};

// ==========================================================================
// s04 · 汇编 + 链接：照表翻译，然后补齐地址
// ==========================================================================
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s04");
  const pairs = [
    { asm: "mov eax,[ebp+8]", hex: "8B 45 08" },
    { asm: "add eax,[ebp+12]", hex: "03 45 0C" },
    { asm: "ret", hex: "C3" },
  ];
  const link = [
    { t: "符号解析", n: "把引用和定义对上", c: T.blue },
    { t: "重定位", n: "定地址", c: T.yellow },
    { t: "合并段", n: "拼成一体", c: T.green },
  ];
  const objs = ["a.o", "b.o", "libc.a"];

  return (
    <Stage label="第一幕 · 汇编与链接">
      <Head x={140} y={138} text="STEP 3 · ASSEMBLE" color={T.orange} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 170 }}>
        <Write text="照表翻译" delay={at(0) + 2} size={38} weight={500} />
      </div>

      {pairs.map((p2, i) => (
        <React.Fragment key={p2.asm}>
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 268 + i * 58,
              fontFamily: F.mono,
              fontSize: 22,
              color: T.ink2,
              opacity: p(f, at(1) + i * 8, 14),
            }}
          >
            {p2.asm}
          </div>
          <Arrow from={[400, 280 + i * 58]} to={[466, 280 + i * 58]} color={T.faint} delay={at(1) + i * 8 + 4} dur={10} />
          <div
            style={{
              position: "absolute",
              left: 480,
              top: 268 + i * 58,
              fontFamily: F.mono,
              fontSize: 22,
              color: T.orange,
              letterSpacing: 2,
              opacity: p(f, at(1) + i * 8 + 6, 14),
            }}
          >
            {p2.hex}
          </div>
        </React.Fragment>
      ))}

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 456,
          width: 600,
          padding: "18px 22px",
          borderRadius: 10,
          border: `1.5px solid ${T.orange}44`,
          background: `${T.orange}0A`,
          boxSizing: "border-box",
          opacity: p(f, at(2), 18),
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontFamily: F.cn, fontSize: 22, color: T.orange }}>目标文件 .o</span>
          <span style={{ fontFamily: F.mono, fontSize: 15, color: T.red }}>地址 = 0</span>
        </div>
        <div style={{ fontFamily: F.cn, fontSize: 17, color: T.sub, marginTop: 10, lineHeight: 1.6 }}>
          已经是二进制，但还不能运行 —— 函数和全局变量还没有地址。
        </div>
      </div>

      <Head x={940} y={138} text="STEP 4 · LINK" color={T.green} delay={at(4)} />
      <div style={{ position: "absolute", left: 940, top: 170 }}>
        <Write text="链接器干三件事" delay={at(4) + 2} size={38} weight={500} />
      </div>
      {link.map((l, i) => (
        <Item key={l.t} x={940} y={268 + i * 66} i={i + 1} title={l.t} note={l.n} w={700} color={l.c} size={24} delay={at(4) + 6 + i * 4} />
      ))}

      {/* 静态 / 动态 */}
      <Rule w={1580} color={T.line} delay={at(8) - 10} dur={24} style={{ position: "absolute", left: 140, top: 604 }} />
      <div style={{ position: "absolute", left: 140, top: 638, width: 600, opacity: p(f, at(8), 18) }}>
        <div style={{ fontFamily: F.mono, fontSize: 18, color: T.blue, letterSpacing: 2 }}>静态链接 STATIC</div>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: T.ink2, marginTop: 10, lineHeight: 1.6 }}>
          编译时把库代码拷进来 · 独立，但体积大
        </div>
      </div>
      <div style={{ position: "absolute", left: 940, top: 638, width: 760, opacity: p(f, at(9), 18) }}>
        <div style={{ fontFamily: F.mono, fontSize: 18, color: T.green, letterSpacing: 2 }}>动态链接 DYNAMIC</div>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: T.ink2, marginTop: 10, lineHeight: 1.6 }}>
          只留引用，运行时加载 .so / .dll · 省空间，但依赖环境
        </div>
      </div>

      {/* 右下：多个 .o 合成一个可执行文件 */}
      <Head x={940} y={752} text="合并段 · 多个目标文件拼成一个" color={T.faint} delay={at(7) - 8} />
      {objs.map((o, i) => (
        <div
          key={o}
          style={{
            position: "absolute",
            left: 940 + i * 140,
            top: 792,
            width: 120,
            height: 54,
            borderRadius: 7,
            border: `1px solid ${T.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 18,
            color: T.ink2,
            opacity: p(f, at(7) + i * 5, 14) * 0.9,
          }}
        >
          {o}
        </div>
      ))}
      <Arrow from={[1370, 819]} to={[1442, 819]} color={T.faint} delay={at(7) + 12} dur={16} />
      <div
        style={{
          position: "absolute",
          left: 1456,
          top: 780,
          width: 240,
          height: 78,
          borderRadius: 8,
          border: `1.5px solid ${T.green}66`,
          background: `${T.green}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 20,
          color: T.green,
          opacity: p(f, at(7) + 16, 16),
        }}
      >
        a.out
      </div>

      <Subs sceneId="s04" />
    </Stage>
  );
};

// ==========================================================================
// s05 · 三类语句，三条指令：全片的下半场总纲
// ==========================================================================
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s05");
  const kinds = [
    { zh: "选择", eg: "if / else", c: T.blue },
    { zh: "循环", eg: "while / for", c: T.teal },
    { zh: "调用", eg: "call / ret", c: T.orange },
  ];
  const instr = [
    { t: "cmp", d: "只做减法，只改标志位", c: T.yellow },
    { t: "jcc", d: "看标志位，决定跳不跳", c: T.green },
    { t: "jmp", d: "无条件跳，只改 PC", c: T.purple },
  ];

  return (
    <Stage label="第二幕 · 三类语句">
      <Head x={140} y={140} text="往下半场 · 代码怎么变成指令" color={T.sub} delay={at(0)} />
      <div style={{ position: "absolute", left: 140, top: 174 }}>
        <Write text="无数种写法，只剩三类语句" delay={at(1)} size={42} weight={500} />
      </div>

      {kinds.map((k, i) => (
        <React.Fragment key={k.zh}>
          <div
            style={{
              position: "absolute",
              left: 220 + i * 520,
              top: 280,
              width: 420,
              height: 128,
              borderRadius: 12,
              border: `1.5px solid ${k.c}55`,
              background: `${k.c}0D`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: p(f, at(2) + i * 6, 18),
              transform: `translateY(${(1 - p(f, at(2) + i * 6, 18)) * 10}px)`,
            }}
          >
            <span style={{ fontFamily: F.cn, fontSize: 34, color: T.ink, letterSpacing: 2 }}>{k.zh}</span>
            <span style={{ fontFamily: F.mono, fontSize: 19, color: k.c }}>{k.eg}</span>
          </div>
          <Arrow
            from={[430 + i * 520, 420]}
            to={[430 + i * 520, 512]}
            color={`${k.c}88`}
            delay={at(3) - 6 + i * 4}
            dur={16}
            curve={0}
          />
        </React.Fragment>
      ))}

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 520,
          width: 1600,
          height: 160,
          borderRadius: 14,
          border: `1.5px solid ${T.yellow}44`,
          background: `${T.yellow}08`,
          opacity: p(f, at(3), 20),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 540,
          width: 1600,
          textAlign: "center",
          fontFamily: F.cn,
          fontSize: 22,
          color: T.yellow,
          letterSpacing: 3,
          opacity: p(f, at(3) + 6, 14),
        }}
      >
        骨架只有三条指令
      </div>

      {instr.map((x, i) => (
        <React.Fragment key={x.t}>
          <div
            style={{
              position: "absolute",
              left: 300 + i * 460,
              top: 588,
              width: 420,
              opacity: p(f, at(4 + Math.min(i, 2)) - 4, 18),
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 34, color: x.c, letterSpacing: 2 }}>{x.t}</span>
            <span style={{ fontFamily: F.cn, fontSize: 18, color: T.sub, marginLeft: 14 }}>{x.d}</span>
          </div>
        </React.Fragment>
      ))}

      <div style={{ position: "absolute", left: 140, top: 760 }}>
        <Write text="if 是人的说法，跳转是机器的说法。" delay={at(6)} size={38} weight={500} color={T.ink} />
        <Fade delay={at(7) - 6} y={8}>
          <div style={{ fontFamily: F.cn, fontSize: 20, color: T.sub, marginTop: 16, opacity: 0.9 }}>
            接下来三节：选择、循环、函数调用 —— 一条一条翻译给你看。
          </div>
        </Fade>
      </div>

      <Subs sceneId="s05" />
    </Stage>
  );
};
