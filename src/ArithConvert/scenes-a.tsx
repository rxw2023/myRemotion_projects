import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { T, W, clamp } from "./tokens";
import {
  Arrow,
  BitRow,
  Callout,
  Chip,
  CN,
  FadeUp,
  Gate,
  Mono,
  Panel,
  Scene,
  TruthTable,
  cueAt,
  paint,
} from "./components";

// ==================== 小零件 ====================

const Bit: React.FC<{ v: string; size?: number; color?: string }> = ({ v, size = 68, color }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 10,
      background: v === "1" ? (color ?? T.ink) : T.panel,
      border: `2px solid ${v === "1" ? (color ?? T.ink) : "#D8DFE8"}`,
      color: v === "1" ? "#FFF" : "#AEB8C4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: T.mono,
      fontSize: size * 0.5,
      fontWeight: 800,
    }}
  >
    {v}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({
  children,
  color = T.sub,
  size = 20,
}) => (
  <div style={{ fontFamily: T.cn, fontSize: size, fontWeight: 700, color, letterSpacing: 0.5 }}>
    {children}
  </div>
);

// ==================== S00 · 只有一个加法器 ====================

export const S00: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + 0.02 * Math.sin(frame / 12);
  const glow = interpolate(frame, [10, 30], [0, 1], clamp);

  return (
    <Scene id="s00" no="00" title="只有一个加法器" en="ONE ADDER TO RULE THEM ALL">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <FadeUp delay={cueAt("s00", 1)}>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { t: "减法", c: T.purple, bg: T.purpleSoft },
              { t: "乘法", c: T.amber, bg: T.amberSoft },
              { t: "除法", c: T.cyan, bg: T.cyanSoft },
            ].map((x) => (
              <Chip key={x.t} color={x.c} bg={x.bg} size={26} style={{ padding: "10px 24px" }}>
                {x.t}
              </Chip>
            ))}
          </div>
        </FadeUp>

        <Arrow dir="down" delay={cueAt("s00", 1) + 12} label="都拆成" color={T.faint} />

        <div
          style={{
            width: 210,
            height: 210,
            borderRadius: 34,
            background: T.blue,
            color: "#FFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: T.mono,
            fontSize: 130,
            fontWeight: 800,
            lineHeight: 1,
            transform: `scale(${pulse})`,
            boxShadow: `0 0 0 ${10 * glow}px rgba(47,98,245,0.10), 0 24px 50px rgba(47,98,245,0.30)`,
          }}
        >
          +
        </div>

        <FadeUp delay={cueAt("s00", 2)}>
          <Callout color={T.blue} delay={cueAt("s00", 2)} style={{ width: W - 60 }}>
            硬件里<span style={{ color: T.blue }}>只有加法</span>，其余三种运算都是加法的变形
          </Callout>
        </FadeUp>

        <FadeUp delay={cueAt("s00", 3)}>
          <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
            <Panel pad={20} style={{ width: 430 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 22,
                    fontWeight: 800,
                    color: T.blue,
                  }}
                >
                  01
                </div>
                <div>
                  <div style={{ fontFamily: T.cn, fontSize: 28, fontWeight: 800, color: T.ink }}>
                    运算电路
                  </div>
                  <div style={{ fontFamily: T.cn, fontSize: 19, color: T.sub, marginTop: 2 }}>
                    硬件怎么算出来
                  </div>
                </div>
              </div>
            </Panel>
            <Panel pad={20} style={{ width: 430 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: T.green }}>
                  02
                </div>
                <div>
                  <div style={{ fontFamily: T.cn, fontSize: 28, fontWeight: 800, color: T.ink }}>
                    类型转换
                  </div>
                  <div style={{ fontFamily: T.cn, fontSize: 19, color: T.sub, marginTop: 2 }}>
                    同一串位怎么换读法
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S01 · 半加器 ====================

export const S01: React.FC = () => {
  const t = (i: number) => cueAt("s01", i);

  return (
    <Scene id="s01" no="01" title="半加器：两个门" en="HALF ADDER">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <Panel pad={34} style={{ width: W }} accent={"#E2E7EE"}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* 输入 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Label>A</Label>
                <Bit v="1" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Label>B</Label>
                <Bit v="0" />
              </div>
            </div>

            <Arrow delay={t(1)} w={64} />

            {/* 门 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Gate kind="xor" color={T.blue} delay={t(2)} w={132} h={70} />
                <Mono size={25} color={T.blue}>
                  A ⊕ B
                </Mono>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Gate kind="and" color={T.amber} delay={t(3)} w={132} h={70} />
                <Mono size={25} color={T.amber}>
                  A · B
                </Mono>
              </div>
            </div>

            <Arrow delay={t(2) + 8} w={64} />

            {/* 输出 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Label color={T.blue}>S 和</Label>
                <Bit v="1" color={T.blue} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Label color={T.amber}>C 进位</Label>
                <Bit v="0" color={T.amber} />
              </div>
            </div>
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
          <FadeUp delay={t(3)}>
            <TruthTable
              head={["A", "B", "S", "C"]}
              rows={[
                ["0", "0", "0", "0"],
                ["0", "1", "1", "0"],
                ["1", "0", "1", "0"],
                ["1", "1", "0", "1"],
              ]}
              delay={t(3) + 10}
              cellW={108}
              rowGap={54}
              size={29}
              colColor={[T.sub, T.sub, T.blue, T.amber]}
            />
          </FadeUp>
          <div style={{ width: 470, display: "flex", flexDirection: "column", gap: 16 }}>
            <FadeUp delay={t(4)}>
              <Callout color={T.green} delay={t(4)}>
                和 = <Mono size={26} color={T.blue}>A ⊕ B</Mono>，进位 = <Mono size={26} color={T.amber}>A · B</Mono>
              </Callout>
            </FadeUp>
            <FadeUp delay={t(5)}>
              <Callout color={T.red} delay={t(5)}>
                缺陷：听不到低位的进位
              </Callout>
            </FadeUp>
          </div>
        </div>
      </div>
    </Scene>
  );
};

// ==================== S02 · 全加器 ====================

export const S02: React.FC = () => {
  const t = (i: number) => cueAt("s02", i);
  const rows = [
    ["0", "0", "0", "0", "0"],
    ["0", "0", "1", "1", "0"],
    ["0", "1", "0", "1", "0"],
    ["0", "1", "1", "0", "1"],
    ["1", "0", "0", "1", "0"],
    ["1", "0", "1", "0", "1"],
    ["1", "1", "0", "0", "1"],
    ["1", "1", "1", "1", "1"],
  ];

  return (
    <Scene id="s02" no="02" title="全加器：补上进位" en="FULL ADDER">
      <div style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
        <FadeUp delay={t(3)}>
          <Panel pad={22}>
            <TruthTable
              head={["A", "B", "Cin", "S", "Cout"]}
              rows={rows}
              delay={t(3) + 8}
              cellW={86}
              rowGap={48}
              size={27}
              colColor={[T.sub, T.sub, T.sub, T.blue, T.amber]}
            />
          </Panel>
        </FadeUp>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <FadeUp delay={t(0)}>
            <Panel pad={20} accent={T.blue}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Gate kind="fa" color={T.blue} delay={t(0)} w={92} h={64} sub="三输入" />
                <div>
                  <div style={{ fontFamily: T.cn, fontSize: 20, color: T.sub }}>和</div>
                  <Mono size={27} color={T.blue}>
                    S = A ⊕ B ⊕ Cin
                  </Mono>
                </div>
              </div>
            </Panel>
          </FadeUp>

          <FadeUp delay={t(2)}>
            <Panel pad={20} accent={T.amber}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Gate kind="fa" color={T.amber} delay={t(2)} w={92} h={64} sub="进位" />
                <div>
                  <div style={{ fontFamily: T.cn, fontSize: 20, color: T.sub }}>进位</div>
                  <Mono size={24} color={T.amber}>
                    Cout = AB + (A⊕B)Cin
                  </Mono>
                </div>
              </div>
            </Panel>
          </FadeUp>

          <FadeUp delay={t(4)}>
            <Panel
              pad={20}
              accent={T.green}
              style={{ background: T.greenSoft }}
            >
              <div style={{ fontFamily: T.cn, fontSize: 21, color: T.sub, marginBottom: 6 }}>
                只看 Cout 那一列
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 28, fontWeight: 800, color: T.ink }}>
                三个输入里有两个以上是 1
                <span style={{ color: T.green }}> → 进位</span>
              </div>
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: `2px dashed ${T.green}55`,
                  fontFamily: T.cn,
                  fontSize: 23,
                  fontWeight: 700,
                  color: T.green,
                }}
              >
                全加器 = 三输入的多数表决门
              </div>
            </Panel>
          </FadeUp>

          <FadeUp delay={t(5)}>
            <Callout color={T.purple} delay={t(5)} style={{ padding: "12px 20px" }}>
              <span style={{ fontSize: 24 }}>
                Cin 是「低位的进位」，不是第三个数
              </span>
            </Callout>
          </FadeUp>
        </div>
      </div>
    </Scene>
  );
};

// ==================== S03 · 行波进位 ====================

const RippleAdder: React.FC<{ t: (i: number) => number }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const faW = 152;
  const faH = 126;
  const gap = 70;
  const total = 4 * faW + 3 * gap;
  const x0 = (952 - total) / 2;
  const xOf = (i: number) => x0 + (3 - i) * (faW + gap);
  const yFA = 230;

  return (
    <svg width={952} height={610} viewBox="0 0 952 610" style={{ overflow: "visible" }}>
      {[0, 1, 2, 3].map((i) => {
        const x = xOf(i);
        const appear = spring({
          frame: frame - t(0) - (3 - i) * 5,
          fps,
          config: { damping: 200 },
          durationInFrames: 12,
        });
        const carryOn = interpolate(frame, [t(2) + (3 - i) * 16, t(2) + (3 - i) * 16 + 12], [0, 1], clamp);
        return (
          <g key={i} opacity={appear}>
            {/* A / B 输入 */}
            <text
              x={x + faW / 2 - 36}
              y={yFA - 62}
              textAnchor="middle"
              fontFamily={T.mono}
              fontSize="33"
              fontWeight="800"
              fill={T.blue}
            >
              A{i}
            </text>
            <text
              x={x + faW / 2 - 36}
              y={yFA + faH + 74}
              textAnchor="middle"
              fontFamily={T.mono}
              fontSize="33"
              fontWeight="800"
              fill={T.purple}
            >
              B{i}
            </text>
            <line x1={x + faW / 2 - 36} y1={yFA - 52} x2={x + faW / 2 - 36} y2={yFA} stroke={T.blue} strokeWidth="2.5" />
            <line x1={x + faW / 2 - 36} y1={yFA + faH} x2={x + faW / 2 - 36} y2={yFA + faH + 64} stroke={T.purple} strokeWidth="2.5" />

            {/* FA 方块 */}
            <rect
              x={x}
              y={yFA}
              width={faW}
              height={faH}
              rx="12"
              fill={T.panel}
              stroke={T.ink}
              strokeWidth="2.5"
            />
            <text
              x={x + faW / 2}
              y={yFA + 54}
              textAnchor="middle"
              fontFamily={T.mono}
              fontSize="29"
              fontWeight="800"
              fill={T.ink}
            >
              FA{i}
            </text>
            <text
              x={x + faW / 2}
              y={yFA + 90}
              textAnchor="middle"
              fontFamily={T.cn}
              fontSize="18"
              fill={T.faint}
            >
              全加器
            </text>

            {/* 和输出 */}
            <line
              x1={x + faW / 2 + 40}
              y1={yFA + faH}
              x2={x + faW / 2 + 40}
              y2={yFA + faH + 64}
              stroke={T.green}
              strokeWidth="2.5"
            />
            <text
              x={x + faW / 2 + 40}
              y={yFA + faH + 74}
              textAnchor="middle"
              fontFamily={T.mono}
              fontSize="33"
              fontWeight="800"
              fill={T.green}
            >
              S{i}
            </text>

            {/* 进位：从本位左侧，流向高位（左边） */}
            {i < 3 && (
              <>
                <line
                  x1={x - 6}
                  y1={yFA + faH / 2}
                  x2={x - gap + 6}
                  y2={yFA + faH / 2}
                  stroke={T.amber}
                  strokeWidth={3}
                  strokeDasharray={gap}
                  strokeDashoffset={gap * (1 - carryOn)}
                />
                <circle
                  cx={x - gap * carryOn}
                  cy={yFA + faH / 2}
                  r="6"
                  fill={T.amber}
                  opacity={carryOn > 0.02 && carryOn < 0.98 ? 1 : 0}
                />
              </>
            )}
            {i === 3 && (
              <>
                <line
                  x1={x - 6}
                  y1={yFA + faH / 2}
                  x2={x - 62}
                  y2={yFA + faH / 2}
                  stroke={T.amber}
                  strokeWidth={3}
                />
                <text
                  x={x - 34}
                  y={yFA + faH / 2 - 12}
                  textAnchor="middle"
                  fontFamily={T.mono}
                  fontSize="23"
                  fontWeight="800"
                  fill={T.amber}
                >
                  Cout
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* 进位输入 */}
      <line x1={xOf(0) + faW + 70} y1={yFA + faH / 2} x2={xOf(0) + faW + 6} y2={yFA + faH / 2} stroke={T.faint} strokeWidth="2.5" />
      <text
        x={xOf(0) + faW + 34}
        y={yFA + faH / 2 - 12}
        textAnchor="middle"
        fontFamily={T.mono}
        fontSize="23"
        fill={T.faint}
      >
        Cin
      </text>

      {/* 底部说明 */}
      <text x={476} y={585} textAnchor="middle" fontFamily={T.cn} fontSize="23" fill={T.faint}>
        ← 进位方向：从最低位（右）向最高位（左）逐级传递
      </text>
    </svg>
  );
};

export const S03: React.FC = () => {
  const t = (i: number) => cueAt("s03", i);
  return (
    <Scene id="s03" no="03" title="串起来：行波进位" en="RIPPLE CARRY ADDER">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, marginTop: -20 }}>
        <FadeUp delay={t(0)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Chip color={T.blue} bg={T.blueSoft} size={22}>
              n 位 = n 个全加器
            </Chip>
            <Chip color={T.amber} bg={T.amberSoft} size={22}>
              进位逐级传递
            </Chip>
          </div>
        </FadeUp>

        <RippleAdder t={t} />

        <FadeUp delay={t(3)} style={{ width: W }}>
          <Callout color={T.red} delay={t(3)} style={{ width: W }}>
            延迟 ∝ 位数：第 n 位的进位，要等前面 n−1 位全部算完
          </Callout>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S04 · 同一电路，两种解释 ====================

export const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (i: number) => cueAt("s04", i);
  const vs = interpolate(frame, [t(4), t(4) + 14], [0, 1], clamp);

  return (
    <Scene id="s04" no="04" title="一个电路，两种数" en="SAME BITS, TWO READINGS">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <Panel pad={28} style={{ width: W }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <BitRow bits="10000000" cell={64} gap={7} reveal={t(1)} stagger={2} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: interpolate(frame, [t(1) + 26, t(1) + 36], [0, 1], clamp) }}>
              <Mono size={34} color={T.faint}>
                +
              </Mono>
              <BitRow bits="00000001" cell={64} gap={7} reveal={t(1) + 30} stagger={2} />
            </div>
            <div style={{ width: 620, height: 2, background: T.ink, margin: "4px 0" }} />
            <BitRow bits="10000001" cell={64} gap={7} reveal={t(1) + 58} stagger={2} hl={{ 0: T.blue }} />
            <Chip color={T.faint} bg="#F1F4F8" size={19} style={{ marginTop: 8 }}>
              进位 Cout = 0
            </Chip>
          </div>
        </Panel>

        <div style={{ display: "flex", alignItems: "stretch", gap: 0, width: W }}>
          <FadeUp delay={t(2)} style={{ flex: 1 }}>
            <Panel pad={22} accent={T.purple} style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Chip color={T.purple} bg={T.purpleSoft} size={19}>
                  无符号
                </Chip>
                <CN size={20} color={T.sub}>
                  当纯二进制读
                </CN>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 40, fontWeight: 800, color: T.ink }}>
                128 + 1 = <span style={{ color: T.purple }}>129</span>
              </div>
            </Panel>
          </FadeUp>

          <div
            style={{
              width: 110,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: vs,
            }}
          >
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 26,
                fontWeight: 800,
                color: T.faint,
                border: `2px solid ${T.line}`,
                borderRadius: 999,
                padding: "6px 16px",
                background: T.panel,
              }}
            >
              VS
            </div>
          </div>

          <FadeUp delay={t(3)} style={{ flex: 1 }}>
            <Panel pad={22} accent={T.blue} style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Chip color={T.blue} bg={T.blueSoft} size={19}>
                  补码
                </Chip>
                <CN size={20} color={T.sub}>
                  当有符号读
                </CN>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 40, fontWeight: 800, color: T.ink }}>
                −128 + 1 = <span style={{ color: T.blue }}>−127</span>
              </div>
            </Panel>
          </FadeUp>
        </div>

        <FadeUp delay={t(5)}>
          <Callout color={T.amber} delay={t(5)} style={{ width: W }}>
            同一组位、同一个加法器，
            <span style={{ color: T.amber }}>结果不同只是因为读法不同</span>
          </Callout>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S05 · 四个标志位 ====================

const FlagCard: React.FC<{
  code: string;
  name: string;
  formula: string;
  note: string;
  color: string;
  bg: string;
  delay: number;
}> = ({ code, name, formula, note, color, bg, delay }) => (
  <FadeUp delay={delay} style={{ width: 452 }}>
    <Panel pad={24} accent={`${color}66`} style={{ background: bg, height: 240 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontFamily: T.mono, fontSize: 48, fontWeight: 800, color }}>{code}</div>
        <div style={{ fontFamily: T.cn, fontSize: 24, fontWeight: 700, color: T.ink2 }}>{name}</div>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 27, fontWeight: 700, color: T.ink, marginTop: 16 }}>
        {formula}
      </div>
      <div style={{ fontFamily: T.cn, fontSize: 22, color: T.ink2, marginTop: 12, lineHeight: 1.45 }}>
        {note}
      </div>
    </Panel>
  </FadeUp>
);

export const S05: React.FC = () => {
  const t = (i: number) => cueAt("s05", i);
  return (
    <Scene id="s05" no="05" title="四个标志位" en="CONDITION FLAGS">
      <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <FlagCard
            code="ZF"
            name="零标志"
            formula="ZF = 1 ⟺ 结果全 0"
            note="判断相等、循环结束，都看它"
            color={T.green}
            bg={T.greenSoft}
            delay={t(1)}
          />
          <FlagCard
            code="SF"
            name="符号标志"
            formula="SF = 结果的最高位"
            note="有符号数的正负，就是最高位"
            color={T.blue}
            bg={T.blueSoft}
            delay={t(2)}
          />
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <FlagCard
            code="CF"
            name="进位 / 借位"
            formula="加法取 Cout，减法取借位"
            note="无符号溢出看它，减法下含义反转"
            color={T.amber}
            bg={T.amberSoft}
            delay={t(3)}
          />
          <FlagCard
            code="OF"
            name="溢出标志"
            formula="OF = Cout ⊕ C(n−1)"
            note="最高位进位 ≠ 次高位进位，就是溢出"
            color={T.red}
            bg={T.redSoft}
            delay={t(4)}
          />
        </div>

        <FadeUp delay={t(5)} style={{ width: W }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              background: T.panel,
              border: `2px solid ${T.red}44`,
              borderRadius: 14,
              padding: "16px 24px",
              width: W,
              boxSizing: "border-box",
            }}
          >
            <Mono size={26} color={T.red}>
              OF = 1
            </Mono>
            <div style={{ width: 2, height: 40, background: T.line }} />
            <CN size={24} color={T.ink2}>
              正 + 正 = 负，负 + 负 = 正
            </CN>
            <div style={{ flex: 1 }} />
            <CN size={22} color={T.faint}>
              符号被顶翻
            </CN>
          </div>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S06 · 减法电路 ====================

export const S06: React.FC = () => {
  const t = (i: number) => cueAt("s06", i);

  return (
    <Scene id="s06" no="06" title="减法：取反加一" en="SUBTRACT VIA ADD">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <Panel pad={26} style={{ width: W }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Mono size={25} color={T.blue}>
                  A
                </Mono>
                <BitRow bits="0110" cell={46} gap={5} reveal={t(0)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Mono size={25} color={T.purple}>
                  B
                </Mono>
                <BitRow bits="0011" cell={46} gap={5} reveal={t(0) + 8} />
              </div>
            </div>

            <Arrow delay={t(2)} w={36} />

            <Panel pad={12} accent={T.purple} style={{ background: T.purpleSoft }}>
              <Gate kind="xor" color={T.purple} delay={t(2)} w={100} h={60} />
              <div style={{ textAlign: "center", fontFamily: T.mono, fontSize: 17, color: T.purple, marginTop: 4 }}>
                ×4 异或阵列
              </div>
            </Panel>

            <Arrow delay={t(3)} w={36} label="Sub" color={T.purple} />

            <Panel pad={14} accent={T.ink}>
              <div style={{ fontFamily: T.mono, fontSize: 29, fontWeight: 800, color: T.ink, textAlign: "center" }}>
                ADDER
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 17, color: T.faint, textAlign: "center", marginTop: 2 }}>
                四位加法器
              </div>
            </Panel>

            <Arrow delay={t(5)} w={36} />

            <div>
              <BitRow
                bits="0011"
                cell={46}
                gap={5}
                reveal={t(5)}
                hl={paint(4, T.green)}
              />
              <div style={{ fontFamily: T.cn, fontSize: 19, color: T.green, textAlign: "center", marginTop: 6 }}>
                6 − 3 = 3
              </div>
            </div>
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 16, width: W }}>
          <FadeUp delay={t(3)} style={{ flex: 1 }}>
            <Panel pad={20} accent={`${T.blue}55`} style={{ background: T.blueSoft, height: 168 }}>
              <Mono size={30} color={T.blue}>
                Sub = 0
              </Mono>
              <div style={{ fontFamily: T.mono, fontSize: 23, color: T.ink, marginTop: 10 }}>
                B ⊕ 0 = B
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 6 }}>
                原样通过，算 A + B
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(4)} style={{ flex: 1 }}>
            <Panel pad={20} accent={`${T.purple}55`} style={{ background: T.purpleSoft, height: 168 }}>
              <Mono size={30} color={T.purple}>
                Sub = 1
              </Mono>
              <div style={{ fontFamily: T.mono, fontSize: 23, color: T.ink, marginTop: 10 }}>
                B ⊕ 1 = B̄，Cin = 1
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 6 }}>
                A + B̄ + 1 = A − B
              </div>
            </Panel>
          </FadeUp>
        </div>

        <FadeUp delay={t(5)}>
          <Callout color={T.amber} delay={t(5)} style={{ width: W }}>
            减法下的 CF 是<span style={{ color: T.amber }}>借位</span>，不是进位——同一个引脚，两种含义
          </Callout>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S07 · 乘法 ====================

const MultVertical: React.FC<{ t: (i: number) => number }> = ({ t }) => {
  const frame = useCurrentFrame();
  const lines: { text: string; kind: "in" | "pp" | "sum" | "out"; delay: number }[] = [
    { text: "        1011", kind: "in", delay: t(1) },
    { text: "      × 1110", kind: "in", delay: t(1) + 4 },
    { text: "      --------", kind: "in", delay: t(1) + 8 },
    { text: "        0000   ← 1011 × 0", kind: "pp", delay: t(1) + 14 },
    { text: "       1011    ← 左移 1 位", kind: "pp", delay: t(1) + 20 },
    { text: "      1011     ← 左移 2 位", kind: "pp", delay: t(1) + 26 },
    { text: "     1011      ← 左移 3 位", kind: "pp", delay: t(1) + 32 },
    { text: "    ---------", kind: "sum", delay: t(1) + 38 },
    { text: "     10011010", kind: "out", delay: t(1) + 44 },
  ];
  return (
    <div style={{ fontFamily: T.mono, fontSize: 30, lineHeight: 1.7, letterSpacing: 1 }}>
      {lines.map((l, i) => {
        const op = interpolate(frame, [l.delay, l.delay + 8], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              opacity: op,
              whiteSpace: "pre",
              color:
                l.kind === "out"
                  ? T.green
                  : l.kind === "pp"
                    ? T.blue
                    : l.kind === "sum"
                      ? T.faint
                      : T.ink,
              fontWeight: l.kind === "out" ? 800 : 600,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
};

export const S07: React.FC = () => {
  const t = (i: number) => cueAt("s07", i);
  return (
    <Scene id="s07" no="07" title="乘法：移位相加" en="MULTIPLY = SHIFT + ADD">
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <Panel pad={24} style={{ width: 520, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Chip color={T.blue} bg={T.blueSoft} size={19}>
              11 × 14 = 154
            </Chip>
            <CN size={19} color={T.faint}>
              四次部分积
            </CN>
          </div>
          <MultVertical t={t} />
        </Panel>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <FadeUp delay={t(2)}>
            <Panel pad={16} accent={T.ink}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: T.mono, fontSize: 21, fontWeight: 800, color: T.ink2, width: 56, flexShrink: 0 }}>
                  软件
                </div>
                <div style={{ fontFamily: T.cn, fontSize: 21, color: T.ink2, lineHeight: 1.35 }}>
                  循环：看最低位 → 加 → 右移
                </div>
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(3)}>
            <Panel pad={16} accent={T.amber}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: T.mono, fontSize: 21, fontWeight: 800, color: T.amber, width: 56, flexShrink: 0 }}>
                  顺序
                </div>
                <div style={{ fontFamily: T.cn, fontSize: 21, color: T.ink2, lineHeight: 1.35 }}>
                  一个周期出一位，慢但省面积
                </div>
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(4)}>
            <Panel pad={16} accent={T.green}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: T.mono, fontSize: 21, fontWeight: 800, color: T.green, width: 56, flexShrink: 0 }}>
                  阵列
                </div>
                <div style={{ fontFamily: T.cn, fontSize: 21, color: T.ink2, lineHeight: 1.35 }}>
                  全加器铺成网格，部分积并行
                </div>
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(5)}>
            <Callout color={T.purple} delay={t(5)} style={{ padding: "14px 18px" }}>
              <span style={{ fontSize: 24 }}>面积换时间</span>
            </Callout>
          </FadeUp>
        </div>
      </div>
    </Scene>
  );
};
