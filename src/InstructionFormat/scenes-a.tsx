import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "./tokens";
import { Arrow, Bits, Fade, Field, Rule, Stage, Subs, Write, p, useCues } from "./ui";

// ==========================================================================
// s00 · 一条指令 = 操作 + 数据
// ==========================================================================
export const S00: React.FC = () => {
  const { at } = useCues("s00");

  return (
    <Stage label="第 1 幕 · 指令格式">
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center" }}>
        <Write text="一条指令，说到底就一句话" delay={at(0)} size={30} color={T.sub} spacing={2} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 278, display: "flex", justifyContent: "center" }}>
        <Write text="对某些数据 · 做某种操作" delay={at(0) + 14} size={76} weight={500} spacing={2} />
      </div>

      <Field x={648} y={470} w={212} h={88} label="ADD" sub="opcode" color={T.yellow} delay={at(1)} fill />
      <Field
        x={870}
        y={470}
        w={430}
        h={88}
        label="R1, [1000]"
        sub="address"
        color={T.blue}
        delay={at(1) + 10}
        fill
        align="left"
      />

      <div style={{ position: "absolute", left: 648, top: 596, width: 212, display: "flex", justifyContent: "center" }}>
        <Write text="决定做什么" delay={at(2)} size={24} color={T.yellow} />
      </div>
      <div style={{ position: "absolute", left: 870, top: 596, width: 430, display: "flex", justifyContent: "center" }}>
        <Write text="决定对谁做" delay={at(2) + 10} size={24} color={T.blue} />
      </div>

      <Rule w={560} color={T.line} delay={at(3)} style={{ position: "absolute", left: 680, top: 760 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center" }}>
        <Write
          text="① 指令格式　　② 八种寻址方式"
          delay={at(3) + 12}
          size={30}
          color={T.ink2}
          spacing={1}
        />
      </div>
      <Fade delay={at(3) + 40} style={{ position: "absolute", left: 0, right: 0, top: 862, textAlign: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 18, color: T.faint, letterSpacing: 3 }}>
          408 · 计算机组成原理
        </span>
      </Fade>

      <Subs sceneId="s00" />
    </Stage>
  );
};

// ==========================================================================
// s01 · 操作码 & 地址的三种含义
// ==========================================================================
export const S01: React.FC = () => {
  const { at } = useCues("s01");

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 196 }}>
        <Write text="指令的两半" delay={at(0)} size={26} color={T.faint} spacing={2} />
      </div>

      <Field x={128} y={252} w={340} h={96} label="opcode" sub="操作什么" color={T.yellow} delay={at(0) + 8} fill />
      <div style={{ position: "absolute", left: 128, top: 372 }}>
        <Write text="ADD  SUB  MOV  JMP" delay={at(1)} size={27} color={T.yellow} mono spacing={2} />
      </div>

      <Arrow from={[492, 300]} to={[1032, 268]} color={T.sub} delay={at(3)} dashed curve={0.16} />
      <Arrow from={[492, 300]} to={[1032, 468]} color={T.sub} delay={at(4)} dashed />
      <Arrow from={[492, 300]} to={[1032, 668]} color={T.sub} delay={at(5)} dashed curve={-0.16} />

      <div style={{ position: "absolute", left: 1032, top: 222 }}>
        <Write text="〈addr〉" delay={at(3)} size={44} color={T.blue} mono />
      </div>
      <div style={{ position: "absolute", left: 1210, top: 232 }}>
        <Write text="内存地址" delay={at(3) + 8} size={30} color={T.ink} />
        <Write text="MOV R1, [1000]" delay={at(3) + 18} size={21} color={T.sub} mono style={{ marginTop: 6 }} />
      </div>

      <div style={{ position: "absolute", left: 1032, top: 424 }}>
        <Write text="〈reg〉" delay={at(4)} size={44} color={T.teal} mono />
      </div>
      <div style={{ position: "absolute", left: 1210, top: 434 }}>
        <Write text="寄存器编号" delay={at(4) + 8} size={30} color={T.ink} />
        <Write text="MOV R1, R2" delay={at(4) + 18} size={21} color={T.sub} mono style={{ marginTop: 6 }} />
      </div>

      <div style={{ position: "absolute", left: 1032, top: 624 }}>
        <Write text="〈imm〉" delay={at(5)} size={44} color={T.purple} mono />
      </div>
      <div style={{ position: "absolute", left: 1210, top: 634 }}>
        <Write text="立即数" delay={at(5) + 8} size={30} color={T.ink} />
        <Write text="MOV R1, #5" delay={at(5) + 18} size={21} color={T.sub} mono style={{ marginTop: 6 }} />
      </div>

      <Rule w={1664} color={T.line} delay={at(6)} style={{ position: "absolute", left: 128, top: 806 }} />
      <div style={{ position: "absolute", left: 128, top: 830 }}>
        <Write
          text="同一个字段位置，放的东西不同 → 取数方式就不同"
          delay={at(6) + 10}
          size={30}
          color={T.ink2}
        />
      </div>

      <Subs sceneId="s01" />
    </Stage>
  );
};

// ==========================================================================
// s02 · 按操作码分成的七类
// ==========================================================================
const CATS = [
  { name: "数据传输", mnem: "MOV   PUSH   POP", note: "寄存器、内存、栈之间搬数据", color: T.yellow },
  { name: "算术逻辑", mnem: "ADD  SUB  MUL  DIV  AND  OR  XOR  CMP", note: "算完再存回，CMP 只改标志位", color: T.yellow },
  { name: "控制转移", mnem: "JMP   Jxx   CALL   RET", note: "改流程：跳转、调用、返回", color: T.yellow },
  { name: "输入输出", mnem: "IN   OUT", note: "和外部设备、端口打交道", color: T.ink2 },
  { name: "字符串操作", mnem: "MOVS   LODS   STOS   CMPS", note: "按串批量搬，配合重复前缀", color: T.ink2 },
  { name: "陷阱指令", mnem: "INT", note: "主动进内核，系统调用的入口", color: T.ink2 },
  { name: "协处理器", mnem: "CLI   STI", note: "控制中断开关、浮点协处理器", color: T.ink2 },
];

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s02");
  const hot = 1 - p(f, at(6), 20); // 最后一句：后三类压暗

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 160 }}>
        <Write text="按操作码分类 · 七大类" delay={at(0)} size={26} color={T.faint} spacing={2} />
      </div>

      {CATS.map((c, i) => {
        const start = i < 4 ? at(i + 1) : i === 4 ? at(5) : at(5) + 10 + (i - 4) * 8;
        const v = p(f, start, 18);
        const dim = i >= 4 ? 0.42 + 0.58 * hot : 1;
        return (
          <div key={c.name} style={{ position: "absolute", left: 128, top: 214 + i * 96, width: 1560, opacity: v * dim }}>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 6,
                fontFamily: F.mono,
                fontSize: 19,
                color: T.faint,
                letterSpacing: 1,
              }}
            >
              0{i + 1}
            </span>
            <span style={{ position: "absolute", left: 62, top: -4, fontFamily: F.cn, fontSize: 32, color: T.ink }}>
              {c.name}
            </span>
            <span
              style={{
                position: "absolute",
                left: 380,
                top: 2,
                fontFamily: F.mono,
                fontSize: 23,
                color: c.color,
                letterSpacing: 1,
              }}
            >
              {c.mnem}
            </span>
            <span
              style={{
                position: "absolute",
                left: 940,
                top: 6,
                fontFamily: F.cn,
                fontSize: 20,
                color: T.faint,
              }}
            >
              {c.note}
            </span>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 96,
          top: 210,
          width: 2,
          height: 268,
          background: T.yellow,
          opacity: p(f, at(6), 20) * 0.65,
        }}
      />
      <Fade
        delay={at(6) + 6}
        style={{ position: "absolute", left: 52, top: 214, writingMode: "vertical-rl" }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 17, color: T.yellow, letterSpacing: 4 }}>考点九成</span>
      </Fade>

      <Subs sceneId="s02" />
    </Stage>
  );
};

// ==========================================================================
// s03 · 按地址个数分类
// ==========================================================================
const ADDR_ROWS = [
  { name: "零地址", n: 0, eq: "操作数隐含在栈顶", note: "PUSH / POP 供数" },
  { name: "一地址", n: 1, eq: "A1 ← op(A1)", note: "源和目的合一" },
  { name: "二地址", n: 2, eq: "A1 ← A1 op A2", note: "最常见" },
  { name: "三地址", n: 3, eq: "A3 ← A1 op A2", note: "不破坏源操作数" },
  { name: "四地址", n: 4, eq: "A4 = 下条指令地址", note: "现代机器不用" },
];

export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s03");
  const COL = 178;

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 152 }}>
        <Write text="按地址个数分类" delay={at(0)} size={26} color={T.faint} spacing={2} />
      </div>

      {ADDR_ROWS.map((r, i) => {
        const start = at(i + 1);
        const v = p(f, start, 18);
        const isNew = i === 4;
        return (
          <div key={r.name} style={{ position: "absolute", left: 128, top: 196 + i * 132, width: 1660, opacity: v }}>
            <span style={{ position: "absolute", left: 0, top: 26, fontFamily: F.cn, fontSize: 27, color: T.ink2 }}>
              {r.name}
            </span>

            <Field x={230} y={0} w={COL} h={74} label="op" color={T.yellow} delay={start + 4} fill={i === 0} />

            {Array.from({ length: Math.min(r.n, 4) }).map((_, k) => (
              <Field
                key={k}
                x={230 + (k + 1) * (COL + 8)}
                y={0}
                w={COL}
                h={74}
                label={`A${k + 1}`}
                color={isNew && k === 3 ? T.orange : T.blue}
                delay={start + 8 + k * 5}
                dashed={isNew && k === 3}
                fill={i === 2 && k < 2}
              />
            ))}

            <div style={{ position: "absolute", left: 1190, top: 12 }}>
              <Write text={r.eq} delay={start + 14} size={25} color={T.ink} mono />
              <Write text={r.note} delay={start + 22} size={19} color={T.sub} />
            </div>
          </div>
        );
      })}

      <Subs sceneId="s03" />
    </Stage>
  );
};

// ==========================================================================
// s04 · 定长 vs 变长
// ==========================================================================
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s04");
  const fixedW = 660;
  const fixedCells = [fixedW / 4, fixedW / 4, fixedW / 4, fixedW / 4];
  const varW = [600, 340, 700, 260];

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 150 }}>
        <Write text="指令字长：两条路" delay={at(0)} size={26} color={T.faint} spacing={2} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 206, opacity: p(f, at(0) + 6, 16) }}>
        <span style={{ fontFamily: F.cn, fontSize: 34, color: T.ink }}>定长</span>
        <span style={{ fontFamily: F.mono, fontSize: 20, color: T.green, marginLeft: 18, letterSpacing: 1 }}>
          ARM · RISC
        </span>
      </div>

      {[0, 1, 2, 3].map((i) => {
        let acc = 0;
        return (
          <div key={i} style={{ position: "absolute", left: 128, top: 300 + i * 92, width: fixedW, height: 52 }}>
            {fixedCells.map((w, k) => {
              const x = acc;
              acc += w + 4;
              const v = p(f, at(1) + i * 6 + k * 3, 14);
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: x,
                    top: 0,
                    width: w - 4,
                    height: 52,
                    borderRadius: 6,
                    border: `1.5px solid ${T.green}`,
                    background: `${T.green}18`,
                    opacity: v,
                  }}
                />
              );
            })}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 128, top: 672 }}>
        <Write text="+ 解码简单，取指一步到位" delay={at(2)} size={24} color={T.green} />
        <Write text="− 有时在浪费空间" delay={at(2) + 14} size={24} color={T.red} style={{ marginTop: 10 }} />
      </div>

      <div style={{ position: "absolute", left: 1010, top: 206, opacity: p(f, at(3), 16) }}>
        <span style={{ fontFamily: F.cn, fontSize: 34, color: T.ink }}>变长</span>
        <span style={{ fontFamily: F.mono, fontSize: 20, color: T.blue, marginLeft: 18, letterSpacing: 1 }}>
          x86 · CISC
        </span>
      </div>

      {varW.map((w, i) => {
        const v = p(f, at(3) + 12 + i * 10, 16);
        const cells = Math.max(2, Math.round(w / 130));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 1010,
              top: 300 + i * 92,
              width: w,
              height: 52,
              borderRadius: 6,
              border: `1.5px solid ${T.blue}`,
              background: `${T.blue}14`,
              opacity: v,
              display: "flex",
            }}
          >
            {Array.from({ length: cells }).map((_, k) => (
              <div
                key={k}
                style={{
                  width: `${100 / cells}%`,
                  borderRight: k < cells - 1 ? `1px solid ${T.blue}44` : "none",
                }}
              />
            ))}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 1010, top: 672 }}>
        <Write text="+ 编码紧凑，塞得下复杂操作" delay={at(4)} size={24} color={T.green} />
        <Write text="− 指令边界不好找" delay={at(4) + 16} size={24} color={T.red} style={{ marginTop: 10 }} />
      </div>

      <Rule w={1664} color={T.line} delay={at(5)} style={{ position: "absolute", left: 128, top: 792 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 822, display: "flex", justifyContent: "center" }}>
        <Write
          text="两种设计 → 两个必考的变形问题"
          delay={at(5) + 10}
          size={32}
          color={T.yellow}
          spacing={1}
        />
      </div>

      <Subs sceneId="s04" />
    </Stage>
  );
};

// ==========================================================================
// s05 · 两个问题与两个解法
// ==========================================================================
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s05");

  const fixedRow = (y: number, filled: number, delay: number) => (
    <>
      <Field x={128} y={y} w={190} h={64} label="op" color={T.yellow} delay={delay} />
      {[0, 1, 2].map((k) =>
        k < filled ? (
          <Field
            key={k}
            x={326 + k * 108}
            y={y}
            w={100}
            h={64}
            label={`A${k + 1}`}
            color={T.blue}
            delay={delay + 4 + k * 4}
          />
        ) : (
          <Field
            key={k}
            x={326 + k * 108}
            y={y}
            w={100}
            h={64}
            label="—"
            color={T.faint}
            delay={delay + 8 + k * 4}
            dashed
          />
        ),
      )}
    </>
  );

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 150 }}>
        <Write text="问题 1" delay={at(0)} size={22} color={T.yellow} mono spacing={2} />
        <div style={{ marginTop: 10 }}>
          <Write text="定长里，地址字段数不统一" delay={at(0) + 8} size={30} color={T.ink} />
        </div>
      </div>

      {fixedRow(300, 3, at(0) + 16)}
      {fixedRow(384, 2, at(0) + 30)}
      {fixedRow(468, 1, at(0) + 44)}

      <div style={{ position: "absolute", left: 128, top: 566 }}>
        <Write text="解法：无效字段填充" delay={at(1)} size={28} color={T.green} />
        <Write
          text="缺的部分用填充值占位，不参与执行"
          delay={at(1) + 14}
          size={22}
          color={T.sub}
          style={{ marginTop: 8 }}
        />
        <Write text="→ 长度齐了，解码逻辑统一" delay={at(2)} size={22} color={T.ink2} style={{ marginTop: 18 }} />
      </div>

      <div style={{ position: "absolute", left: 1010, top: 150 }}>
        <Write text="问题 2" delay={at(3)} size={22} color={T.blue} mono spacing={2} />
        <div style={{ marginTop: 10 }}>
          <Write text="变长里，怎么找到边界" delay={at(3) + 8} size={30} color={T.ink} />
        </div>
      </div>

      {[
        { w: 560, cells: 4 },
        { w: 300, cells: 2 },
        { w: 620, cells: 5 },
        { w: 380, cells: 3 },
      ].map((r, i) => {
        const start = at(3) + 20 + i * 10;
        const v = p(f, start, 14);
        return (
          <div key={i} style={{ position: "absolute", left: 1010, top: 300 + i * 62, opacity: v }}>
            <Field x={0} y={0} w={92} h={52} label="P" color={T.orange} delay={start} fill />
            <div
              style={{
                position: "absolute",
                left: 100,
                top: 0,
                width: r.w,
                height: 52,
                borderRadius: 6,
                border: `1.5px solid ${T.blue}`,
                background: `${T.blue}14`,
                display: "flex",
              }}
            >
              {Array.from({ length: r.cells }).map((_, k) => (
                <div
                  key={k}
                  style={{
                    flex: 1,
                    borderRight: k < r.cells - 1 ? `1px solid ${T.blue}44` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 1010, top: 566 }}>
        <Write text="解法：指令前缀" delay={at(4)} size={28} color={T.orange} />
        <Write text="开头放一个长度字段，先读它再读指令" delay={at(4) + 14} size={22} color={T.sub} style={{ marginTop: 8 }} />
        <Write text="或在 op 高位嵌标志位" delay={at(5)} size={22} color={T.ink2} style={{ marginTop: 18 }} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 720 }}>
        <Write text="代价：解码变复杂　得到：编码灵活、好扩展" delay={at(6)} size={24} color={T.ink2} />
      </div>

      <Subs sceneId="s05" />
    </Stage>
  );
};

// ==========================================================================
// s06 · 操作码扩展编码：前缀编码是硬规则
// ==========================================================================
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s06");

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 148 }}>
        <Write text="定长指令内，操作码可以分层次" delay={at(0)} size={28} color={T.ink} />
      </div>

      <Field x={128} y={212} w={220} h={72} label="op 4 位" sub="先读这段" color={T.yellow} delay={at(1)} fill />
      <Field x={356} y={212} w={300} h={72} label="扩展位 …" sub="是前缀就继续读" color={T.purple} delay={at(1) + 12} dashed />
      <div style={{ position: "absolute", left: 700, top: 228 }}>
        <Write text="可变长操作码 + 定长指令字" delay={at(2)} size={26} color={T.ink2} />
      </div>

      <div style={{ position: "absolute", left: 128, top: 320 }}>
        <Write text="前缀编码：短码不能是长码的前缀" delay={at(3)} size={26} color={T.ink2} />
      </div>

      {[
        { bits: "1010", y: 392, verdict: "合法：独立的一条", color: T.green },
        { bits: "101001", y: 480, verdict: "非法：1010 是它的前缀", color: T.red },
        { bits: "111101", y: 568, verdict: "合法：1111 没被占用", color: T.green },
      ].map((r, i) => {
        const start = at(i === 0 ? 4 : i === 1 ? 5 : 5) + i * 18;
        return (
          <React.Fragment key={r.bits}>
            <Bits
              bits={r.bits}
              x={128}
              y={r.y}
              cw={40}
              ch={54}
              gap={5}
              delay={start}
              stagger={2}
              color={r.color}
              paint={i === 1 ? { 0: T.red, 1: T.red, 2: T.red, 3: T.red } : undefined}
            />
            <div style={{ position: "absolute", left: 420, top: r.y + 12 }}>
              <Write text={r.verdict} delay={start + 14} size={24} color={r.color} />
            </div>
          </React.Fragment>
        );
      })}

      <div style={{ position: "absolute", left: 128, top: 690 }}>
        <Write text="否则解码器读到 1010，不知道该停，还是该继续" delay={at(6)} size={26} color={T.ink2} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 1076,
          top: 372,
          width: 640,
          opacity: p(f, at(5) + 20, 16),
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 20, color: T.faint, letterSpacing: 2 }}>编码空间</div>
        <div style={{ marginTop: 18, fontFamily: F.cn, fontSize: 23, color: T.sub, lineHeight: 1.7 }}>
          短码占一个叶子
          <br />
          长码占一个分支
          <br />
          <span style={{ color: T.ink2 }}>叶子与分支不能重叠</span>
        </div>
      </div>

      <Subs sceneId="s06" />
    </Stage>
  );
};

// ==========================================================================
// s07 · 16 位指令的扩展操作码真题（全片高潮）
// ==========================================================================
const SEG = 30;
const SEG_GAP = 5;
const BAR_X = 486;

const Seg: React.FC<{
  x: number;
  y: number;
  color: string;
  delay: number;
  size?: number;
  ring?: string;
  ringDelay?: number;
  label?: string;
}> = ({ x, y, color, delay, size = SEG, ring, ringDelay = 0, label }) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 10);
  const r = ring ? p(frame, ringDelay, 14) : 0;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size > 20 ? 4 : 2,
          border: `1px solid ${color}`,
          background: `${color}33`,
          opacity: v,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 10,
          color,
        }}
      >
        {label}
      </div>
      {ring ? (
        <div
          style={{
            position: "absolute",
            left: x - 5,
            top: y - 5,
            width: size + 10,
            height: size + 10,
            borderRadius: 6,
            border: `2px solid ${ring}`,
            boxShadow: `0 0 14px ${ring}66`,
            opacity: r,
          }}
        />
      ) : null}
    </>
  );
};

export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s07");

  const layer1 = at(2) + 8;
  const layer2 = at(5) + 8;
  const layer3 = at(8) + 8;
  const layer4 = at(10) + 8;

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 126 }}>
        <Write text="指令 16 位　op 4 位　地址码 4 位" delay={at(0)} size={23} color={T.faint} mono spacing={1} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 164 }}>
        <Write
          text="要做：三地址 15 · 二地址 12 · 一地址 63 · 零地址 16"
          delay={at(1)}
          size={23}
          color={T.ink2}
          mono
        />
      </div>

      {/* ---- 第一层：4 位 op，16 个编码 ---- */}
      <div style={{ position: "absolute", left: 128, top: 246 }}>
        <Write text="op 4 位" delay={layer1} size={21} color={T.yellow} mono />
        <Write text="三地址 · 3 个地址" delay={layer1 + 8} size={18} color={T.sub} style={{ marginTop: 6 }} />
      </div>
      {Array.from({ length: 16 }).map((_, i) => (
        <Seg
          key={`a${i}`}
          x={BAR_X + i * (SEG + SEG_GAP)}
          y={250}
          color={i < 15 ? T.yellow : T.green}
          delay={layer1 + i * 1.6}
          ring={i === 15 ? T.green : undefined}
          ringDelay={at(3)}
        />
      ))}
      <div style={{ position: "absolute", left: 1160, top: 250 }}>
        <Write text="用 15 / 16" delay={layer1 + 26} size={20} color={T.yellow} mono />
        <Write text="0000 – 1110" delay={layer1 + 34} size={18} color={T.sub} mono style={{ marginTop: 6 }} />
      </div>

      {/* ---- 第二层：+4 位，16 个编码 ---- */}
      <div style={{ position: "absolute", left: 128, top: 406 }}>
        <Write text="1111 + 4 位" delay={layer2} size={21} color={T.blue} mono />
        <Write text="二地址 · 少一个地址 → op 多 4 位" delay={layer2 + 8} size={18} color={T.sub} style={{ marginTop: 6 }} />
      </div>
      {Array.from({ length: 16 }).map((_, i) => (
        <Seg
          key={`b${i}`}
          x={BAR_X + i * (SEG + SEG_GAP)}
          y={410}
          color={i < 12 ? T.blue : T.purple}
          delay={layer2 + i * 1.6}
          ring={i >= 12 ? T.purple : undefined}
          ringDelay={at(6)}
        />
      ))}
      <div style={{ position: "absolute", left: 1160, top: 410 }}>
        <Write text="用 12 / 16" delay={layer2 + 26} size={20} color={T.blue} mono />
        <Write text="1111 0000 – 1111 1011" delay={layer2 + 34} size={17} color={T.sub} mono style={{ marginTop: 6 }} />
      </div>

      {/* ---- 第三层：4 个前缀 × 16 = 64 个编码 ---- */}
      <div style={{ position: "absolute", left: 128, top: 566 }}>
        <Write text="1111 11 + 4 位" delay={layer3} size={21} color={T.red} mono />
        <Write text="一地址 · 4 个前缀 × 16" delay={layer3 + 8} size={18} color={T.sub} style={{ marginTop: 6 }} />
      </div>
      {Array.from({ length: 64 }).map((_, idx) => {
        const row = Math.floor(idx / 32);
        const i = idx % 32;
        const last = idx === 63;
        return (
          <Seg
            key={`c${idx}`}
            x={BAR_X + i * 20}
            y={556 + row * 26}
            size={16}
            color={last ? T.orange : T.red}
            delay={layer3 + idx * 0.5}
            ring={last ? T.orange : undefined}
            ringDelay={at(9)}
          />
        );
      })}
      <div style={{ position: "absolute", left: 1160, top: 580 }}>
        <Write text="用 63 / 64" delay={layer3 + 40} size={20} color={T.red} mono />
        <Write text="只剩全 1" delay={layer3 + 50} size={18} color={T.sub} style={{ marginTop: 6 }} />
      </div>

      {/* ---- 第四层：16 个编码归零地址 ---- */}
      <div style={{ position: "absolute", left: 128, top: 726 }}>
        <Write text="全 1 + 4 位" delay={layer4} size={21} color={T.orange} mono />
        <Write text="零地址 · 16 个编码" delay={layer4 + 8} size={18} color={T.sub} style={{ marginTop: 6 }} />
      </div>
      {Array.from({ length: 16 }).map((_, i) => (
        <Seg
          key={`d${i}`}
          x={BAR_X + i * 29}
          y={730}
          size={26}
          color={T.orange}
          delay={layer4 + i * 1.8}
        />
      ))}
      <div style={{ position: "absolute", left: 1160, top: 730 }}>
        <Write text="16 / 16" delay={layer4 + 30} size={20} color={T.orange} mono />
      </div>

      {/* ---- 剩余量：一层层往下传 ---- */}
      <div style={{ position: "absolute", left: 1470, top: 226, width: 300 }}>
        <Write text="剩余可扩展" delay={at(3) - 4} size={18} color={T.faint} mono spacing={1} />
      </div>
      {[
        { v: "1", cue: 3, color: T.green, note: "个前缀" },
        { v: "4", cue: 6, color: T.purple, note: "个前缀" },
        { v: "1", cue: 9, color: T.orange, note: "个前缀" },
        { v: "0", cue: 11, color: T.faint, note: "全部用尽" },
      ].map((r, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 1470,
            top: 268 + i * 92,
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            opacity: p(f, at(r.cue) + 6, 14) > 0 ? 1 : 0,
            transform: `translateX(${(1 - p(f, at(r.cue) + 6, 14)) * 12}px)`,
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 46, color: r.color }}>{r.v}</span>
          <span style={{ fontFamily: F.cn, fontSize: 18, color: T.sub }}>{r.note}</span>
        </div>
      ))}

      <Rule w={1660} color={T.line} delay={at(11)} style={{ position: "absolute", left: 128, top: 848 }} />
      <div style={{ position: "absolute", left: 128, top: 872 }}>
        <Write
          text="65536 个编码，被前缀编码一层层切开 —— 这就是扩展操作码"
          delay={at(11) + 12}
          size={27}
          color={T.ink2}
        />
      </div>

      <Subs sceneId="s07" />
    </Stage>
  );
};

// ==========================================================================
// s08 · 通用算法：编码空间预算
// ==========================================================================
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s08");
  const budget = [
    { expr: "16 − 15", out: "1", cue: 1 },
    { expr: "1 × 16 − 12", out: "4", cue: 2 },
    { expr: "4 × 16 − 63", out: "1", cue: 3 },
    { expr: "1 × 16 − 16", out: "0", cue: 4 },
  ];

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 156 }}>
        <Write text="把真题抽成算法" delay={at(0)} size={26} color={T.faint} spacing={2} />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 224, display: "flex", justifyContent: "center" }}>
        <div style={{ fontFamily: F.mono, fontSize: 40, color: T.ink2, letterSpacing: 1 }}>
          <span style={{ color: T.green, opacity: p(f, at(1), 14) }}>剩余(下)</span>
          <span style={{ opacity: p(f, at(1) + 6, 14) }}> = </span>
          <span style={{ color: T.ink, opacity: p(f, at(1) + 10, 14) }}>剩余(上)</span>
          <span style={{ opacity: p(f, at(1) + 14, 14) }}> × </span>
          <span style={{ color: T.yellow, opacity: p(f, at(1) + 18, 14) }}>
            2<sup style={{ fontSize: 22 }}>扩展位数</sup>
          </span>
          <span style={{ color: T.red, opacity: p(f, at(2), 14) }}> − 本层用掉</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 128, top: 330 }}>
        <Write text="算出来的余量，继续往下传" delay={at(2) + 14} size={22} color={T.sub} />
      </div>

      {budget.map((b, i) => {
        const v = p(f, at(b.cue) + 4, 14);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 128,
              top: 420 + i * 74,
              display: "flex",
              alignItems: "baseline",
              gap: 24,
              opacity: v,
              transform: `translateX(${(1 - v) * 10}px)`,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 26, color: T.sub, width: 260 }}>{b.expr}</span>
            <span style={{ fontFamily: F.mono, fontSize: 22, color: T.faint }}>=</span>
            <span style={{ fontFamily: F.mono, fontSize: 32, color: b.out === "0" ? T.faint : T.green }}>{b.out}</span>
            <span style={{ fontFamily: F.cn, fontSize: 17, color: T.faint }}>个前缀</span>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 720, top: 410, width: 2, height: 320, background: T.line }} />

      <div style={{ position: "absolute", left: 800, top: 420 }}>
        <Write text="任何一步为负 → 这道题无解" delay={at(3)} size={26} color={T.red} />
      </div>

      <div style={{ position: "absolute", left: 800, top: 520 }}>
        <Write text="常见问法" delay={at(4)} size={19} color={T.faint} mono spacing={2} />
        <div style={{ marginTop: 14 }}>
          <Write text="① 给条数 → 求某类最多几条" delay={at(4) + 10} size={22} color={T.ink2} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Write text="② 给方案 → 问你设计得对不对" delay={at(4) + 22} size={22} color={T.ink2} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 800, top: 680 }}>
        <Write text="守住前缀编码 → 答案唯一" delay={at(5)} size={24} color={T.yellow} />
      </div>

      <Subs sceneId="s08" />
    </Stage>
  );
};

// ==========================================================================
// s09 · 和变长子网划分是同一棵树
// ==========================================================================
const Edge: React.FC<{ a: [number, number]; b: [number, number]; delay: number; color?: string }> = ({
  a,
  b,
  delay,
  color = T.line,
}) => {
  const frame = useCurrentFrame();
  const v = p(frame, delay, 16);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <div
      style={{
        position: "absolute",
        left: a[0],
        top: a[1],
        width: len * v,
        height: 1.5,
        background: color,
        transformOrigin: "left center",
        transform: `rotate(${ang}deg)`,
      }}
    />
  );
};

export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s09");
  const root: [number, number] = [960, 226];
  const mid: [number, number][] = [
    [800, 386],
    [1120, 386],
  ];
  const leaves: [number, number][] = [
    [720, 528],
    [880, 528],
    [1040, 528],
    [1200, 528],
  ];
  const ops = ["00", "01", "10", "11"];

  return (
    <Stage label="01 / 指令格式">
      <div style={{ position: "absolute", left: 128, top: 158 }}>
        <Write text="前缀编码 = 递归地切分编码空间" delay={at(0)} size={26} color={T.faint} spacing={1} />
      </div>

      <Edge a={root} b={mid[0]} delay={at(0) + 10} color={T.purple} />
      <Edge a={root} b={mid[1]} delay={at(0) + 10} color={T.purple} />
      <Edge a={mid[0]} b={leaves[0]} delay={at(0) + 22} color={T.blue} />
      <Edge a={mid[0]} b={leaves[1]} delay={at(0) + 22} color={T.blue} />
      <Edge a={mid[1]} b={leaves[2]} delay={at(0) + 30} color={T.blue} />
      <Edge a={mid[1]} b={leaves[3]} delay={at(0) + 30} color={T.blue} />

      {[root, ...mid].map((n, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: n[0] - 8,
            top: n[1] - 8,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: T.bg,
            border: `2px solid ${T.purple}`,
            opacity: p(f, at(0) + (i === 0 ? 4 : 14), 14),
          }}
        />
      ))}

      {mid.map((n, i) => (
        <div
          key={`m${i}`}
          style={{
            position: "absolute",
            left: n[0] + 18,
            top: n[1] - 12,
            fontFamily: F.mono,
            fontSize: 16,
            color: T.green,
            opacity: p(f, at(1) + i * 8, 14),
            whiteSpace: "nowrap",
          }}
        >
          /25 · 128 个地址
        </div>
      ))}

      {leaves.map((n, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              position: "absolute",
              left: n[0] - 8,
              top: n[1] - 8,
              width: 16,
              height: 16,
              borderRadius: 3,
              background: `${T.blue}55`,
              border: `1.5px solid ${T.blue}`,
              opacity: p(f, at(0) + 30 + i * 4, 14),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: n[0] - 70,
              top: n[1] - 42,
              width: 140,
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: 16,
              color: T.green,
              opacity: p(f, at(1) + 12 + i * 6, 14),
            }}
          >
            /26 · 64
          </div>
          <div
            style={{
              position: "absolute",
              left: n[0] - 70,
              top: n[1] + 18,
              width: 140,
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: 17,
              color: T.yellow,
              opacity: p(f, at(1) + 4 + i * 6, 14),
            }}
          >
            op {ops[i]}
          </div>
        </React.Fragment>
      ))}

      <div
        style={{
          position: "absolute",
          left: 128,
          top: 640,
          fontFamily: F.cn,
          fontSize: 23,
          color: T.sub,
          opacity: p(f, at(2), 14),
          lineHeight: 1.65,
        }}
      >
        每往下一层扩一位，空间减半
        <br />
        <span style={{ color: T.faint, fontSize: 20 }}>CPU：编码个数减半 · IP：地址数减半</span>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center" }}>
        <Write text="同一个问题，长成同一棵二叉树" delay={at(3)} size={30} color={T.ink2} />
      </div>

      <Subs sceneId="s09" />
    </Stage>
  );
};
