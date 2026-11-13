import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Cells, Chip, Fade, Rule, Stage, Subs, Write, p, useCues } from "../shared/b3b/ui";
import type { Cell } from "../shared/b3b/ui";

const PAD = (key: string, color: string = T.faint): Cell => ({ hatch: color, dim: true, sub: key });

// ==========================================================================
// s06 · 八格摊开：a 在 0，b 在 4，中间三格是填充
// ==========================================================================
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s06");

  const CW = 116;
  const GAP = 8;
  const CH = 112;
  const N = 8;
  const X0 = (1920 - (N * CW + (N - 1) * GAP)) / 2;
  const Y = 440;

  const cells: Cell[] = [
    { label: "a", color: T.green, fill: true },
    PAD(""),
    PAD(""),
    PAD(""),
    { label: "b", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
  ];

  const ticks = ["0", "1", "2", "3", "4", "5", "6", "7"];
  const addr = Array.from({ length: N }).map((_, i) => `0x100${i}`);

  return (
    <Stage label="02 / 结构体与填充">
      <div style={{ position: "absolute", left: 128, top: 140 }}>
        <Write text="把内存摊开，一格一字节" delay={at(0)} size={28} color={T.ink2} />
      </div>

      <Cells
        x={X0}
        y={Y}
        cells={cells}
        cw={CW}
        ch={CH}
        gap={GAP}
        ticks={ticks}
        delay={at(1)}
        stagger={5}
        size={34}
        tickSize={20}
      />

      {/* 地址行 */}
      <div
        style={{
          position: "absolute",
          left: X0,
          top: Y + CH + 40,
          display: "flex",
          gap: GAP,
          opacity: p(f, at(4), 16) * 0.9,
        }}
      >
        {addr.map((a, i) => (
          <div
            key={i}
            style={{
              width: CW,
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: 17,
              color: i === 4 ? T.green : T.faint,
            }}
          >
            {a}
          </div>
        ))}
      </div>

      {/* a 的说明 */}
      <Fade delay={at(1) + 10} style={{ position: "absolute", left: X0, top: Y - 66 }}>
        <span style={{ fontFamily: F.cn, fontSize: 21, color: T.green }}>char a · 因子 1</span>
      </Fade>

      {/* b 的说明 + 对齐判定 */}
      <Fade delay={at(2) + 4} style={{ position: "absolute", left: X0 + 4 * (CW + GAP), top: Y - 66 }}>
        <span style={{ fontFamily: F.cn, fontSize: 21, color: T.blue }}>int b · 因子 4，地址须为 4 的倍数</span>
      </Fade>

      {/* 三格填充高亮 */}
      <div
        style={{
          position: "absolute",
          left: X0 + (CW + GAP) - 7,
          top: Y - 12,
          width: 3 * (CW + GAP) - GAP + 14,
          height: CH + 24,
          borderRadius: 12,
          border: `1.5px dashed ${T.orange}`,
          opacity: p(f, at(3), 16),
        }}
      />
      <Fade delay={at(3) + 10} style={{ position: "absolute", left: X0 + (CW + GAP) - 7, top: Y + CH + 72 }}>
        <span style={{ fontFamily: F.mono, fontSize: 20, color: T.orange }}>padding · 3 bytes</span>
      </Fade>

      {/* 结论 */}
      <Rule w={1664} color={T.line} delay={at(5) + 6} style={{ position: "absolute", left: 128, top: 690 }} />
      <div style={{ position: "absolute", left: 128, top: 722 }}>
        <Write text="0x1004 % 4 = 0" delay={at(5) + 10} size={34} color={T.green} mono />
        <Write text="b 的地址能被 4 整除，这才是三格的价值" delay={at(6)} size={28} color={T.sub} style={{ marginTop: 14 }} />
      </div>
      <div style={{ position: "absolute", left: 1180, top: 736, textAlign: "right", width: 612 }}>
        <Fade delay={at(5) + 14}>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: T.faint, lineHeight: 1.9 }}>
            <div>1 + 3 + 4 = 8</div>
            <div style={{ color: T.green }}>8 % 4 = 0 → 末尾无需再补</div>
          </div>
        </Fade>
      </div>

      <Subs sceneId="s06" />
    </Stage>
  );
};

// ==========================================================================
// s07 · 为什么编译器不把成员挪紧凑
// ==========================================================================
const DECL = [
  { name: "a", type: "char", color: T.green },
  { name: "b", type: "int", color: T.blue },
  { name: "c", type: "char", color: T.purple },
];

export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s07");

  const CW = 88;
  const GAP = 6;
  const CH = 88;

  return (
    <Stage label="02 / 结构体与填充">
      <div style={{ position: "absolute", left: 128, top: 138, width: 1500 }}>
        <Write text="编译器明知道有空隙，为什么不把成员挪紧凑？" delay={at(0)} size={40} weight={500} />
      </div>

      {/* 声明顺序 */}
      <div style={{ position: "absolute", left: 128, top: 268, fontFamily: F.mono, fontSize: 18, color: T.faint, letterSpacing: 2 }}>
        DECLARATION ORDER
      </div>
      {DECL.map((d, i) => {
        const v = p(f, at(1) + i * 7, 14);
        return (
          <div
            key={d.name}
            style={{
              position: "absolute",
              left: 128,
              top: 300 + i * 92,
              width: 340,
              height: 74,
              borderRadius: 9,
              border: `1.5px solid ${d.color}`,
              background: `${d.color}18`,
              opacity: v,
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingLeft: 20,
              fontFamily: F.mono,
              fontSize: 26,
              color: d.color,
            }}
          >
            <span style={{ fontSize: 19, color: T.faint }}>0{i + 1}</span>
            {d.type}
            <span style={{ color: T.ink }}>{d.name}</span>
          </div>
        );
      })}

      <Arrow from={[480, 340]} to={[700, 340]} color={T.sub} delay={at(1) + 20} dashed curve={0.05} />
      <Fade delay={at(1) + 26} style={{ position: "absolute", left: 470, top: 372 }}>
        <span style={{ fontFamily: F.cn, fontSize: 20, color: T.sub }}>顺序固定</span>
      </Fade>

      {/* 内存：顺序不可变，只能填空隙 */}
      <div style={{ position: "absolute", left: 720, top: 268, fontFamily: F.mono, fontSize: 18, color: T.faint, letterSpacing: 2 }}>
        MEMORY LAYOUT
      </div>

      <Cells
        x={720}
        y={300}
        cells={[
          { label: "a", color: T.green, fill: true },
          PAD(""),
          PAD(""),
          PAD(""),
          { label: "b", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
          { label: "c", color: T.purple, fill: true },
          PAD(""),
          PAD(""),
          PAD(""),
        ]}
        cw={CW}
        ch={CH}
        gap={GAP}
        delay={at(2)}
        stagger={4}
        size={30}
      />

      <div style={{ position: "absolute", left: 720, top: 300 + CH + 24, display: "flex", gap: GAP }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: CW,
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: 16,
              color: T.faint,
              opacity: p(f, at(2) + 20, 14),
            }}
          >
            {i}
          </div>
        ))}
      </div>

      <Fade delay={at(3)} style={{ position: "absolute", left: 720, top: 496 }}>
        <span style={{ fontFamily: F.cn, fontSize: 22, color: T.orange }}>
          空隙只能填，不能让 b 挪到 a 后面
        </span>
      </Fade>

      <Rule w={1664} color={T.line} delay={at(3) + 16} style={{ position: "absolute", left: 128, top: 700 }} />
      <div style={{ position: "absolute", left: 128, top: 732 }}>
        <Write text="顺序一变，初始化列表、指针运算、内存映射全都对不上" delay={at(3) + 20} size={32} color={T.ink2} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 800 }}>
        <Write text="编译器只填空隙，不搬家。省空间的活，留给写代码的人。" delay={at(4)} size={30} color={T.sub} />
      </div>

      <Subs sceneId="s07" />
    </Stage>
  );
};

// ==========================================================================
// s08 · char / short / char：直觉 3，实际 6
// ==========================================================================
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s08");

  const CW = 132;
  const GAP = 8;
  const CH = 112;
  const N = 6;
  const X0 = (1920 - (N * CW + (N - 1) * GAP)) / 2;
  const Y = 300;

  const aw = 72;
  const ag = 4;
  const ax = (1920 - (12 * aw + 11 * ag)) / 2;
  const ay = 580;

  return (
    <Stage label="02 / 结构体与填充">
      <div style={{ position: "absolute", left: 128, top: 132 }}>
        <Write text="struct { char a; short b; char c; }" delay={at(0)} size={30} color={T.ink2} mono />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 196, display: "flex", justifyContent: "center", gap: 26 }}>
        <Fade delay={at(1)}>
          <span style={{ fontFamily: F.mono, fontSize: 26, color: T.sub }}>
            直觉 <span style={{ textDecoration: "line-through", opacity: 0.6 }}>3</span>
          </span>
        </Fade>
        <Fade delay={at(1) + 8}>
          <span style={{ fontFamily: F.mono, fontSize: 34, color: T.yellow }}>实际 6</span>
        </Fade>
      </div>

      <Cells
        x={X0}
        y={Y}
        cells={[
          { label: "a", color: T.green, fill: true },
          PAD(""),
          { label: "b", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
          { label: "c", color: T.purple, fill: true },
          PAD("", T.orange),
        ]}
        cw={CW}
        ch={CH}
        gap={GAP}
        ticks={["0", "1", "2", "3", "4", "5"]}
        delay={at(2)}
        stagger={8}
        size={34}
        tickSize={22}
      />

      {/* 成员标注 */}
      <Fade delay={at(2) + 8} style={{ position: "absolute", left: X0, top: Y - 40 }}>
        <span style={{ fontFamily: F.cn, fontSize: 20, color: T.green }}>a @ 0</span>
      </Fade>
      <Fade delay={at(2) + 26} style={{ position: "absolute", left: X0 + 2 * (CW + GAP), top: Y - 40 }}>
        <span style={{ fontFamily: F.cn, fontSize: 20, color: T.blue }}>b @ 2 · 2 的倍数</span>
      </Fade>
      <Fade delay={at(3)} style={{ position: "absolute", left: X0 + 4 * (CW + GAP), top: Y - 40 }}>
        <span style={{ fontFamily: F.cn, fontSize: 20, color: T.purple }}>c @ 4</span>
      </Fade>

      {/* 末尾补齐说明 */}
      <Arrow
        from={[X0 + 5 * (CW + GAP) + CW / 2, 504]}
        to={[X0 + 5 * (CW + GAP) + CW / 2, 458]}
        color={T.orange}
        delay={at(6)}
      />
      <Fade delay={at(6) + 8} style={{ position: "absolute", left: X0 + 5 * (CW + GAP) + CW + 22, top: 470 }}>
        <span style={{ fontFamily: F.cn, fontSize: 20, color: T.orange, whiteSpace: "nowrap" }}>
          5 → 6，凑成 2 的倍数
        </span>
      </Fade>

      {/* 数组验证 */}
      <div style={{ position: "absolute", left: 128, top: 522 }}>
        <Write text="末尾这一格是给数组留的" delay={at(7)} size={24} color={T.faint} spacing={1} />
      </div>
      <Cells
        x={ax}
        y={ay}
        cells={[
          { label: "a", color: T.green, fill: true },
          PAD(""),
          { label: "b", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
          { label: "c", color: T.purple, fill: true },
          PAD("", T.orange),
          { label: "a", color: T.green, fill: true },
          PAD(""),
          { label: "b", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
          { label: "c", color: T.purple, fill: true },
          PAD("", T.orange),
        ]}
        cw={aw}
        ch={62}
        gap={ag}
        delay={at(8)}
        stagger={2}
        size={20}
        radius={5}
      />
      <div
        style={{
          position: "absolute",
          left: ax + 6 * (aw + ag) - 2,
          top: ay - 10,
          width: 2,
          height: 82,
          background: T.yellow,
          opacity: p(f, at(8) + 14, 14),
        }}
      />
      <div style={{ position: "absolute", left: ax, top: ay + 78, display: "flex", gap: ag, opacity: p(f, at(8) + 16, 14) }}>
        <div style={{ width: 6 * (aw + ag) - ag, textAlign: "center", fontFamily: F.mono, fontSize: 16, color: T.sub }}>
          element[0]
        </div>
        <div style={{ width: 6 * (aw + ag) - ag, textAlign: "center", fontFamily: F.mono, fontSize: 16, color: T.yellow }}>
          element[1] · b 仍在 2 的倍数上 ✓
        </div>
      </div>

      <Subs sceneId="s08" />
    </Stage>
  );
};

// ==========================================================================
// s09 · 两条规则 + 一条结论
// ==========================================================================
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s09");

  return (
    <Stage label="第 3 幕 · 两条规则">
      <div style={{ position: "absolute", left: 128, top: 132 }}>
        <Write text="struct size · 只靠两条规则" delay={at(0)} size={26} color={T.faint} mono spacing={2} />
      </div>

      {/* 规则一 */}
      <div style={{ position: "absolute", left: 128, top: 206 }}>
        <Fade delay={at(1)}>
          <span style={{ fontFamily: F.mono, fontSize: 20, color: T.green, letterSpacing: 3 }}>RULE 1</span>
        </Fade>
      </div>
      <div style={{ position: "absolute", left: 128, top: 240, width: 1660 }}>
        <Write text="每个成员按自己的对齐因子找位置，放不下就补空隙" delay={at(1) + 6} size={38} />
      </div>

      {/* 规则二 */}
      <div style={{ position: "absolute", left: 128, top: 340 }}>
        <Fade delay={at(2)}>
          <span style={{ fontFamily: F.mono, fontSize: 20, color: T.blue, letterSpacing: 3 }}>RULE 2</span>
        </Fade>
      </div>
      <div style={{ position: "absolute", left: 128, top: 374, width: 1660 }}>
        <Write text="整体大小向上取整到最大对齐因子的倍数" delay={at(2) + 6} size={38} />
      </div>

      {/* 公式 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 458,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 14,
          opacity: p(f, at(2) + 26, 20),
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 38, color: T.yellow }}>size</span>
        <span style={{ fontFamily: F.mono, fontSize: 38, color: T.sub }}>=</span>
        <span style={{ fontFamily: F.mono, fontSize: 38, color: T.ink }}>( used + maxA − 1 ) / maxA</span>
        <span style={{ fontFamily: F.mono, fontSize: 38, color: T.sub }}>×</span>
        <span style={{ fontFamily: F.mono, fontSize: 38, color: T.blue }}>maxA</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 526, display: "flex", justifyContent: "center" }}>
        <span style={{ fontFamily: F.cn, fontSize: 21, color: T.faint, opacity: p(f, at(2) + 34, 16) }}>
          整数除法，等价于向上取整
        </span>
      </div>

      <div style={{ position: "absolute", left: 128, top: 640 }}>
        <Fade delay={at(3)}>
          <span style={{ fontFamily: F.mono, fontSize: 20, color: T.orange, letterSpacing: 3 }}>结论</span>
        </Fade>
      </div>
      <div style={{ position: "absolute", left: 128, top: 676, width: 1660 }}>
        <Write text="结构体自己的对齐因子，等于成员里最大的那个" delay={at(3) + 6} size={34} color={T.ink2} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 740, width: 1660 }}>
        <Write text="所以结构体套结构体，还是同一套算法" delay={at(4)} size={30} color={T.sub} />
      </div>

      <Rule w={1664} color={T.line} delay={at(4) + 16} style={{ position: "absolute", left: 128, top: 828 }} />

      <Subs sceneId="s09" />
    </Stage>
  );
};

// ==========================================================================
// s10 · 按因子从大到小排：12 → 8
// ==========================================================================
export const S10: React.FC = () => {
  const { at } = useCues("s10");

  const CW = 90;
  const GAP = 6;
  const CH = 80;
  const X0 = 200;

  const before: Cell[] = [
    { label: "a", color: T.green, fill: true },
    PAD(""), PAD(""), PAD(""),
    { label: "b", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
    { label: "c", color: T.green, fill: true },
    PAD(""), PAD(""), PAD(""),
  ];
  const after: Cell[] = [
    { label: "b", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
    { label: "", color: T.blue, fill: true },
    { label: "a", color: T.green, fill: true },
    { label: "c", color: T.green, fill: true },
    PAD(""), PAD(""),
  ];

  return (
    <Stage label="03 / 两条规则">
      <div style={{ position: "absolute", left: 128, top: 130, width: 1500 }}>
        <Write text="填充既然是空转，能不能少填一点？" delay={at(0)} size={38} weight={500} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 196 }}>
        <Write text="按对齐因子从大到小排列成员" delay={at(1)} size={28} color={T.yellow} />
      </div>

      {/* 改前 */}
      <div style={{ position: "absolute", left: 128, top: 268 }}>
        <Fade delay={at(2)}>
          <span style={{ fontFamily: F.mono, fontSize: 21, color: T.sub }}>char a · int b · char c</span>
        </Fade>
      </div>
      <Cells x={X0} y={300} cells={before} cw={CW} ch={CH} gap={GAP} delay={at(2) + 6} stagger={3} size={22} radius={6} />
      <Fade delay={at(2) + 30} style={{ position: "absolute", left: 1400, top: 314 }}>
        <span style={{ fontFamily: F.mono, fontSize: 42, color: T.red }}>12 B</span>
      </Fade>
      <Fade delay={at(2) + 34} style={{ position: "absolute", left: X0 + (CW + GAP), top: 386 }}>
        <span style={{ fontFamily: F.mono, fontSize: 17, color: T.orange }}>+3</span>
      </Fade>
      <Fade delay={at(2) + 38} style={{ position: "absolute", left: X0 + 9 * (CW + GAP), top: 386 }}>
        <span style={{ fontFamily: F.mono, fontSize: 17, color: T.orange }}>+3</span>
      </Fade>

      {/* 改后 */}
      <div style={{ position: "absolute", left: 128, top: 470 }}>
        <Fade delay={at(3)}>
          <span style={{ fontFamily: F.mono, fontSize: 21, color: T.yellow }}>int b · char a · char c</span>
        </Fade>
      </div>
      <Cells x={X0} y={502} cells={after} cw={CW} ch={CH} gap={GAP} delay={at(3) + 6} stagger={3} size={22} radius={6} />
      <Fade delay={at(3) + 26} style={{ position: "absolute", left: 1022, top: 516 }}>
        <span style={{ fontFamily: F.mono, fontSize: 42, color: T.green }}>8 B</span>
      </Fade>
      <Fade delay={at(3) + 30} style={{ position: "absolute", left: X0 + 6 * (CW + GAP), top: 588 }}>
        <span style={{ fontFamily: F.mono, fontSize: 17, color: T.orange }}>+2</span>
      </Fade>

      <Arrow from={[1000, 400]} to={[1000, 490]} color={T.yellow} delay={at(3) + 34} dashed />

      <Rule w={1664} color={T.line} delay={at(4)} style={{ position: "absolute", left: 128, top: 660 }} />
      <div style={{ position: "absolute", left: 128, top: 690 }}>
        <Write text="信息一点没少，省下三分之一" delay={at(4) + 6} size={34} color={T.ink2} />
      </div>
      <div style={{ position: "absolute", left: 128, top: 752 }}>
        <Write text="所以好头文件里，大类型总写在前面" delay={at(5)} size={28} color={T.sub} />
      </div>
      <Chip x={1300} y={744} text="pack(1) = 拿速度换空间" color={T.faint} delay={at(6)} size={17} />

      <Subs sceneId="s10" />
    </Stage>
  );
};

// ==========================================================================
// s11 · 收口
// ==========================================================================
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s11");

  const lines = [
    { k: "对齐", v: "addr % K = 0", c: T.green },
    { k: "填充", v: "让每个成员站到自己的边界上", c: T.orange },
    { k: "大小", v: "先按成员铺一遍，再整体取整", c: T.blue },
  ];

  return (
    <Stage label="第 3 幕 · 收口">
      <div style={{ position: "absolute", left: 128, top: 160 }}>
        <Write text="回到最开始那个问题" delay={at(0)} size={30} color={T.faint} spacing={2} />
      </div>

      {lines.map((l, i) => {
        const d = at(i + 1);
        const v = p(f, d, 18);
        return (
          <div key={l.k} style={{ position: "absolute", left: 128, top: 240 + i * 148, width: 1660, opacity: v }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 4,
                height: 96,
                background: l.c,
                opacity: 0.8,
                transform: `scaleY(${v})`,
                transformOrigin: "top",
              }}
            />
            <div style={{ position: "absolute", left: 32, top: -8, fontFamily: F.cn, fontSize: 26, color: l.c, letterSpacing: 2 }}>
              {l.k}
            </div>
            <div style={{ position: "absolute", left: 32, top: 34, fontFamily: F.mono, fontSize: 36, color: T.ink }}>
              {l.v}
            </div>
          </div>
        );
      })}

      <Rule w={1664} color={T.line} delay={at(3) + 20} style={{ position: "absolute", left: 128, top: 730 }} />

      {/* 右侧回扣：这一期讲的那个结构体 */}
      <Fade delay={at(1) + 10} style={{ position: "absolute", left: 1000, top: 242 }}>
        <span style={{ fontFamily: F.mono, fontSize: 19, color: T.faint, letterSpacing: 1 }}>struct {"{ char a; int b; }"}</span>
      </Fade>
      <Cells
        x={1000}
        y={292}
        cells={[
          { label: "a", color: T.green, fill: true },
          PAD(""),
          PAD(""),
          PAD(""),
          { label: "b", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
          { label: "", color: T.blue, fill: true },
        ]}
        cw={90}
        ch={82}
        gap={6}
        delay={at(1) + 14}
        stagger={3}
        size={26}
        radius={7}
      />
      <Fade delay={at(1) + 34} style={{ position: "absolute", left: 1000, top: 392 }}>
        <span style={{ fontFamily: F.mono, fontSize: 21, color: T.sub }}>1 + 3 + 4 = 8</span>
      </Fade>
      <Fade delay={at(2) + 10} style={{ position: "absolute", left: 1000, top: 442 }}>
        <span style={{ fontFamily: F.cn, fontSize: 21, color: T.faint }}>这就是全部答案的形状</span>
      </Fade>

      <div style={{ position: "absolute", left: 128, top: 766 }}>
        <Write text="这两步练熟，这类题就不会再错" delay={at(4)} size={34} color={T.ink2} />
      </div>

      <Fade delay={at(4) + 30} style={{ position: "absolute", left: 128, top: 850 }}>
        <span style={{ fontFamily: F.mono, fontSize: 18, color: T.faint, letterSpacing: 4 }}>
          408 · 计算机组成原理 · 数据的表示与存储
        </span>
      </Fade>

      <Subs sceneId="s11" />
    </Stage>
  );
};
