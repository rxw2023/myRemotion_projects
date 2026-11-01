import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BitRow, CN, Chip, FadeUp, Mono, Panel, Scene, cueAt } from "./components";
import { T, W, clamp } from "./tokens";

// ==================== 07 定点数的局限 ====================
export const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s07", i);

  const dotIn = interpolate(frame, [c(2) - 4, c(2) + 8], [0, 1], clamp);

  return (
    <Scene id="s07" no="07" title="定点数不够用" en="Fixed point → floating point">
      <div style={{ width: W }}>
        <Panel pad={28} style={{ display: "flex", justifyContent: "center", gap: 0, alignItems: "flex-start" }}>
          <BitRow
            bits="1011"
            cell={64}
            gap={8}
            labels={["8", "4", "2", "1"]}
            labelSize={20}
            reveal={12}
            stagger={4}
          />
          <div
            style={{
              width: 34,
              textAlign: "center",
              paddingTop: 14,
              opacity: dotIn,
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 7, background: T.blue, margin: "0 auto" }} />
            <div style={{ fontFamily: T.mono, fontSize: 15, color: T.blue, marginTop: 8 }}>·</div>
          </div>
          <BitRow
            bits="0110"
            cell={64}
            gap={8}
            labels={["1/2", "1/4", "1/8", "1/16"]}
            labelSize={18}
            reveal={26}
            stagger={4}
          />
        </Panel>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            gap: 12,
            justifyContent: "center",
            opacity: interpolate(frame, [c(3) - 4, c(3) + 8], [0, 1], clamp),
            alignItems: "center",
          }}
        >
          <Chip color={T.sub} bg={T.panel}>
            小数点位置固定
          </Chip>
          <Mono size={24} color={T.faint}>
            ⇒
          </Mono>
          <Chip color={T.red} bg={T.redSoft}>
            表示范围被锁死
          </Chip>
        </div>

        {/* 需要的位数被大量 0 撑满 */}
        <div
          style={{
            marginTop: 50,
            opacity: interpolate(frame, [c(5) - 8, c(5) + 10], [0, 1], clamp),
          }}
        >
          <CN size={22} color={T.sub} style={{ display: "block", marginBottom: 14 }}>
            要表示 <Mono size={22} color={T.red}>2⁻¹⁰²</Mono> 这种量级：
          </CN>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {Array.from({ length: 22 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 30,
                  height: 46,
                  borderRadius: 6,
                  background: "#EDF1F6",
                  border: `1.5px solid #DDE4EC`,
                  color: "#C2CAD4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: T.mono,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                0
              </div>
            ))}
            <Mono size={30} color={T.faint} style={{ margin: "0 6px" }}>
              …
            </Mono>
            <div
              style={{
                width: 30,
                height: 46,
                borderRadius: 6,
                background: T.red,
                border: `1.5px solid ${T.red}`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              1
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
            <Chip color={T.red} bg={T.redSoft} size={19}>
              103 位
            </Chip>
            <CN size={20} color={T.sub}>
              其中 102 位是毫无信息量的 0
            </CN>
          </div>
        </div>

        <div
          style={{
            marginTop: 46,
            opacity: interpolate(frame, [c(7) - 10, c(7) + 10], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [c(7) - 10, c(7) + 12], [20, 0], clamp)}px)`,
          }}
        >
          <Panel accent={T.blue} style={{ background: T.blueSoft }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <CN size={30} color={T.ink}>
                浮点数 = 二进制的科学计数法
              </CN>
              <Mono size={30} color={T.blue}>
                1.M × 2ᴱ
              </Mono>
            </div>
            <CN size={20} color={T.sub} style={{ display: "block", marginTop: 8 }}>
              小数点位置浮动 ⇒ 同样的位数，覆盖大到 10³⁸、小到 10⁻⁴⁵
            </CN>
          </Panel>
        </div>
      </div>
    </Scene>
  );
};

// ==================== 08 IEEE 754 三段结构 ====================
const SegBar: React.FC<{
  segs: { flex: number; name: string; sub: string; color: string; soft: string; min?: number }[];
  height?: number;
  gap: number;
  delay: number;
}> = ({ segs, height = 92, gap, delay }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap, width: W - 20 }}>
      {segs.map((s, i) => {
        const op = interpolate(frame, [delay + i * 6, delay + i * 6 + 10], [0, 1], clamp);
        const y = interpolate(frame, [delay + i * 6, delay + i * 6 + 12], [14, 0], clamp);
        return (
          <div
            key={s.name}
            style={{
              flexGrow: s.flex,
              flexBasis: 0,
              minWidth: s.min ?? 34,
              height,
              borderRadius: 12,
              background: s.soft,
              border: `2px solid ${s.color}66`,
              opacity: op,
              transform: `translateY(${y}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: 30, fontWeight: 800, color: s.color }}>
              {s.name}
            </div>
            {s.sub && (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 15,
                  fontWeight: 700,
                  color: T.sub,
                  whiteSpace: "nowrap",
                }}
              >
                {s.sub}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s08", i);
  const gap = interpolate(frame, [c(3), c(3) + 20], [0, 9], clamp);

  return (
    <Scene id="s08" no="08" title="IEEE 754：三段式" en="Sign · Exponent · Fraction">
      <div style={{ width: W }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Chip color={T.blue} bg={T.blueSoft}>
            单精度 FLOAT32
          </Chip>
          <Mono size={22} color={T.sub}>
            bias = 127
          </Mono>
        </div>
        <SegBar
          segs={[
            { flex: 1, name: "s", sub: "", color: T.amber, soft: T.amberSoft, min: 58 },
            { flex: 8, name: "exp", sub: "8 位", color: T.blue, soft: T.blueSoft },
            { flex: 23, name: "frac", sub: "23 位", color: T.green, soft: T.greenSoft },
          ]}
          gap={gap}
          delay={c(0)}
        />

        <div
          style={{
            marginTop: 40,
            opacity: interpolate(frame, [c(2) - 8, c(2) + 8], [0, 1], clamp),
          }}
        >
          <Panel accent={T.line} style={{ background: T.panel }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Mono size={38} color={T.amber}>
                (−1)ˢ
              </Mono>
              <Mono size={34} color={T.faint}>
                ×
              </Mono>
              <Mono size={38} color={T.green}>
                1.M
              </Mono>
              <Mono size={34} color={T.faint}>
                ×
              </Mono>
              <Mono size={38} color={T.blue}>
                2<sup style={{ fontSize: 24 }}>E−127</sup>
              </Mono>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 14 }}>
              <CN size={19} color={T.amber}>
                s=1 则为负
              </CN>
              <CN size={19} color={T.green}>
                隐含整数 1
              </CN>
              <CN size={19} color={T.blue}>
                阶码减偏置
              </CN>
            </div>
          </Panel>
        </div>

        <div style={{ marginTop: 40, opacity: interpolate(frame, [c(4) - 6, c(4) + 8], [0, 1], clamp) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Chip color={T.purple} bg={T.purpleSoft}>
              双精度 DOUBLE
            </Chip>
            <Mono size={22} color={T.sub}>
              bias = 1023
            </Mono>
          </div>
          <SegBar
            segs={[
              { flex: 1, name: "s", sub: "", color: T.amber, soft: T.amberSoft, min: 50 },
              { flex: 11, name: "exp", sub: "11 位", color: T.purple, soft: T.purpleSoft },
              { flex: 52, name: "frac", sub: "52 位", color: T.green, soft: T.greenSoft },
            ]}
            height={74}
            gap={9}
            delay={c(4) + 4}
          />
        </div>

        <div
          style={{
            marginTop: 42,
            display: "flex",
            gap: 14,
            opacity: interpolate(frame, [c(5) - 8, c(5) + 8], [0, 1], clamp),
          }}
        >
          <Panel pad={20} style={{ flex: 1, background: "#FBFCFE" }}>
            <Chip color={T.blue} bg={T.blueSoft} size={15}>
              为什么加偏置
            </Chip>
            <CN size={20} color={T.ink2} style={{ display: "block", marginTop: 10, lineHeight: 1.5 }}>
              阶码本身按无符号存，加 bias 后负指数被平移成正数
            </CN>
          </Panel>
          <Panel pad={20} style={{ flex: 1, background: "#FBFCFE" }}>
            <Chip color={T.green} bg={T.greenSoft} size={15}>
              白赚一位
            </Chip>
            <CN size={20} color={T.ink2} style={{ display: "block", marginTop: 10, lineHeight: 1.5 }}>
              规格化后尾数必为 1.xxx，整数位 1 不存，精度 +1 位
            </CN>
          </Panel>
        </div>
      </div>
    </Scene>
  );
};

// ==================== 09 手算 2.25 ====================
export const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueAt("s09", i);

  const hexS = spring({ frame: frame - c(6) + 6, fps, config: { damping: 12, stiffness: 180 } });

  return (
    <Scene id="s09" no="09" title="手算 2.25 的单精度" en="Worked example">
      <div style={{ width: W }}>
        <FadeUp delay={c(1) - 6}>
          <Panel pad={24} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Mono size={44} color={T.ink}>
              2.25
            </Mono>
            <Mono size={30} color={T.faint}>
              =
            </Mono>
            <Mono size={38} color={T.green}>
              1.125
            </Mono>
            <Mono size={30} color={T.faint}>
              ×
            </Mono>
            <Mono size={38} color={T.blue}>
              2¹
            </Mono>
            <div style={{ flex: 1 }} />
            <CN size={19} color={T.sub}>
              规格化：把整数部分凑成 1
            </CN>
          </Panel>
        </FadeUp>

        <div
          style={{
            marginTop: 26,
            display: "flex",
            gap: 14,
            opacity: interpolate(frame, [c(3) - 6, c(3) + 10], [0, 1], clamp),
          }}
        >
          {[
            { k: "符号", v: "0", d: "正数", color: T.amber, soft: T.amberSoft, at: c(2) },
            { k: "阶码 E", v: "1+127=128", d: "1000 0000", color: T.blue, soft: T.blueSoft, at: c(3) },
            { k: "尾数 M", v: "001", d: "补零到 23 位", color: T.green, soft: T.greenSoft, at: c(5) },
          ].map((x) => (
            <FadeUp key={x.k} delay={x.at} dur={10} style={{ flex: 1 }}>
              <div
                style={{
                  background: x.soft,
                  border: `1.5px solid ${x.color}44`,
                  borderRadius: 14,
                  padding: "16px 18px",
                }}
              >
                <div style={{ fontFamily: T.cn, fontSize: 18, fontWeight: 700, color: T.sub }}>
                  {x.k}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 30, fontWeight: 800, color: x.color }}>
                  {x.v}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 15, color: T.sub }}>{x.d}</div>
              </div>
            </FadeUp>
          ))}
        </div>

        <div style={{ marginTop: 46 }}>
          <div style={{ display: "flex", marginBottom: 10 }}>
            {[
              { w: 26, t: "s", color: T.amber },
              { w: 232, t: "E · 8 位", color: T.blue },
              { w: 667, t: "M · 23 位", color: T.green },
            ].map((s) => (
              <div
                key={s.t}
                style={{
                  width: s.w,
                  textAlign: "center",
                  fontFamily: T.mono,
                  fontSize: 16,
                  fontWeight: 700,
                  color: s.color,
                  whiteSpace: "nowrap",
                  opacity: interpolate(frame, [c(6) - 14, c(6) - 2], [0, 1], clamp),
                }}
              >
                {s.t}
              </div>
            ))}
          </div>
          <BitRow
            bits="01000000000100000000000000000000"
            cell={26}
            gap={3}
            radius={6}
            reveal={c(5) + 6}
            stagger={0.7}
            outline={{
              0: T.amber,
              1: T.blue,
              2: T.blue,
              3: T.blue,
              4: T.blue,
              5: T.blue,
              6: T.blue,
              7: T.blue,
              8: T.blue,
              9: T.green,
              10: T.green,
              11: T.green,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 44,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
            opacity: Math.min(1, hexS * 1.5),
            transform: `scale(${0.9 + 0.1 * hexS})`,
          }}
        >
          <CN size={24} color={T.sub}>
            十六进制
          </CN>
          <div
            style={{
              background: T.ink,
              color: "#fff",
              borderRadius: 12,
              padding: "12px 28px",
              fontFamily: T.mono,
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: 3,
            }}
          >
            4010 0000 H
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            textAlign: "center",
            opacity: interpolate(frame, [c(6) + 14, c(6) + 30], [0, 1], clamp),
          }}
        >
          <Mono size={21} color={T.sub} weight={600}>
            反算：s=0 · E=128−127=1 · 1.001₂ × 2¹ = 2.25 ✓
          </Mono>
        </div>
      </div>
    </Scene>
  );
};

// ==================== 10 异常值 ====================
export const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s10", i);

  const rows = [
    {
      name: "正常值 Normal",
      en: "NORMALIZED",
      exp: "非全 0 / 非全 1",
      frac: "任意",
      val: "(−1)ˢ × 1.M × 2^(E−127)",
      color: T.green,
      soft: T.greenSoft,
      at: c(1),
    },
    {
      name: "非正常值 Denormal",
      en: "SUBNORMAL",
      exp: "全 0",
      frac: "任意",
      val: "(−1)ˢ × 0.M × 2^(−126)",
      color: T.blue,
      soft: T.blueSoft,
      at: c(2),
    },
    {
      name: "无穷 ∞",
      en: "INFINITY",
      exp: "全 1",
      frac: "全 0",
      val: "±∞（如 1/0）",
      color: T.amber,
      soft: T.amberSoft,
      at: c(4),
    },
    {
      name: "非数字 NaN",
      en: "NOT A NUMBER",
      exp: "全 1",
      frac: "≠ 0",
      val: "NaN（如 0/0）",
      color: T.red,
      soft: T.redSoft,
      at: c(5),
    },
  ];

  return (
    <Scene id="s10" no="10" title="阶码决定身份" en="Normal · Subnormal · ∞ · NaN">
      <div style={{ width: W }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 26,
            opacity: interpolate(frame, [6, 20], [0, 1], clamp),
          }}
        >
          <Chip color={T.sub} bg={T.panel}>
            同一个 32 位格式，exp 的取值决定它是谁
          </Chip>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 30,
            opacity: interpolate(frame, [14, 28], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [14, 30], [18, 0], clamp)}px)`,
          }}
        >
          {["e₇", "e₆", "e₅", "e₄", "e₃", "e₂", "e₁", "e₀"].map((b, i) => {
            const isZero = frame > c(2) && frame < c(4);
            const isOne = frame >= c(4);
            const v = isOne ? "1" : "0";
            return (
              <div
                key={b}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 9,
                  background: isZero || isOne ? T.blue : T.panel,
                  border: `2px solid ${isZero || isOne ? T.blue : "#D8DFE8"}`,
                  color: isZero || isOne ? "#fff" : "#AEB8C4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: T.mono,
                  fontSize: 24,
                  fontWeight: 800,
                  transform: `scale(${interpolate(frame, [c(2) + i * 2, c(3) + i * 2], [0.92, 1], clamp)})`,
                }}
              >
                {isZero ? "0" : v}
              </div>
            );
          })}
          <div style={{ marginLeft: 14, display: "flex", alignItems: "center" }}>
            <Mono size={22} color={T.blue} weight={800}>
              {frame < c(4) ? "exp 全 0" : "exp 全 1"}
            </Mono>
          </div>
        </div>

        {rows.map((r, i) => {
          const op = interpolate(frame, [r.at - 4, r.at + 10], [0, 1], clamp);
          const x = interpolate(frame, [r.at - 4, r.at + 12], [-20, 0], clamp);
          return (
            <div
              key={r.name}
              style={{
                opacity: op,
                transform: `translateX(${x}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: i % 2 === 0 ? T.panel : "#FAFBFD",
                border: `1.5px solid ${T.line}`,
                borderLeft: `5px solid ${r.color}`,
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 12,
                boxShadow: "0 6px 18px rgba(20,26,34,0.04)",
              }}
            >
              <div style={{ width: 200 }}>
                <div style={{ fontFamily: T.cn, fontSize: 23, fontWeight: 800, color: T.ink }}>
                  {r.name}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 13, color: T.faint, letterSpacing: 1 }}>
                  {r.en}
                </div>
              </div>
              <div style={{ width: 172 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.faint }}>exp</div>
                <Mono size={18} color={r.color}>
                  {r.exp}
                </Mono>
              </div>
              <div style={{ width: 80 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.faint }}>frac</div>
                <Mono size={18} color={T.ink2}>
                  {r.frac}
                </Mono>
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <Mono size={19} color={T.ink2} weight={600}>
                  {r.val}
                </Mono>
              </div>
            </div>
          );
        })}

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 12,
            opacity: interpolate(frame, [c(6) - 6, c(6) + 8], [0, 1], clamp),
          }}
        >
          <Chip color={T.blue} bg={T.blueSoft} size={19}>
            非正常值 = 零附近的过渡带
          </Chip>
          <Chip color={T.sub} bg={T.panel} size={19}>
            最接近 0 的正数 2⁻¹⁴⁹
          </Chip>
        </div>
      </div>
    </Scene>
  );
};

// ==================== 11 精度与误差 ====================
export const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s11", i);

  const LINE = 860;
  const pts = Array.from({ length: 9 }, (_, i) => i / 8);
  // 0.3 先落空，再吸附到最近的 0.25
  const snap = interpolate(frame, [c(6), c(6) + 22], [0, 1], clamp);
  const markerX = (0.3 - (0.3 - 0.25) * snap) * LINE;

  return (
    <Scene id="s11" no="11" title="精度：为什么 0.1+0.2≠0.3" en="ULP & rounding">
      <div style={{ width: W }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <Chip color={T.red} bg={T.redSoft}>
            0.1 + 0.2 = 0.30000000000000004
          </Chip>
          <CN size={20} color={T.sub}>
            尾数只有有限位
          </CN>
        </div>

        <Panel pad={26}>
          <CN size={20} color={T.sub} style={{ display: "block", marginBottom: 10 }}>
            用 3 位二进制小数只能表示 8 个点，0.3 落在两个点之间
          </CN>
          <div style={{ position: "relative", height: 132, width: LINE }}>
            <div
              style={{
                position: "absolute",
                top: 62,
                left: 0,
                width: LINE * interpolate(frame, [10, 46], [0, 1], clamp),
                height: 2,
                background: "#C2CBD8",
              }}
            />
            {pts.map((p, i) => {
              const on = frame > 40 + i * 3;
              return (
                <React.Fragment key={i}>
                  <div
                    style={{
                      position: "absolute",
                      left: p * LINE - 8,
                      top: 54,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      background: on ? T.blue : "#DDE3EB",
                      border: `2px solid ${on ? T.blue : "#DDE3EB"}`,
                    }}
                  />
                  {i % 2 === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        left: p * LINE - 40,
                        top: 80,
                        width: 80,
                        textAlign: "center",
                        fontFamily: T.mono,
                        fontSize: 17,
                        fontWeight: 700,
                        color: T.faint,
                      }}
                    >
                      {p === 0 ? "0" : p.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {/* 标记：0.3 → 吸附 */}
            <div
              style={{
                position: "absolute",
                left: markerX - 1,
                top: 18,
                width: 3,
                height: 50,
                background: T.red,
                opacity: interpolate(frame, [c(5) + 4, c(5) + 14], [0, 1], clamp),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: markerX - 40,
                top: -8,
                width: 80,
                textAlign: "center",
                fontFamily: T.mono,
                fontSize: 20,
                fontWeight: 800,
                color: T.red,
                opacity: interpolate(frame, [c(5) + 4, c(5) + 14], [0, 1], clamp),
              }}
            >
              0.3
            </div>
            <div
              style={{
                position: "absolute",
                left: 0.25 * LINE - 46,
                top: 104,
                width: 92,
                textAlign: "center",
                fontFamily: T.mono,
                fontSize: 17,
                fontWeight: 800,
                color: T.blue,
                opacity: snap,
              }}
            >
              ↑ 最近点
            </div>
          </div>
        </Panel>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 14,
            opacity: interpolate(frame, [c(2) - 8, c(2) + 8], [0, 1], clamp),
          }}
        >
          <Panel pad={20} style={{ flex: 1 }}>
            <Chip color={T.amber} bg={T.amberSoft} size={15}>
              1.2 = 1.0011 0011 0011 …
            </Chip>
            <CN size={19} color={T.ink2} style={{ display: "block", marginTop: 10 }}>
              无限循环 ⇒ 23 位装不下
            </CN>
          </Panel>
          <Panel pad={20} style={{ flex: 1 }}>
            <Chip color={T.blue} bg={T.blueSoft} size={15}>
              ULP = 2⁻²³ ≈ 1.19×10⁻⁷
            </Chip>
            <CN size={19} color={T.ink2} style={{ display: "block", marginTop: 10 }}>
              相邻可表示数的间隔
            </CN>
          </Panel>
        </div>

        <div
          style={{
            marginTop: 26,
            opacity: interpolate(frame, [c(7) - 8, c(7) + 8], [0, 1], clamp),
            background: T.ink,
            borderRadius: 14,
            padding: "18px 26px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Mono size={22} color={T.amber} weight={800}>
            TIP
          </Mono>
          <CN size={23} color="#fff" weight={700}>
            浮点判等用 |a−b| &lt; ε，不要写 a == b
          </CN>
        </div>
      </div>
    </Scene>
  );
};

// ==================== 12 浮点加减四步 ====================
export const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s12", i);

  const steps = [
    {
      no: "01",
      t: "对阶",
      en: "ALIGN",
      d: "小阶向大阶看齐，小阶尾数右移、阶码增大",
      tag: "丢精度 · 不溢出",
      color: T.green,
      soft: T.greenSoft,
      at: c(1),
    },
    {
      no: "02",
      t: "尾数运算",
      en: "ADD / SUB",
      d: "阶码相同后直接加减尾数，可能产生进位",
      tag: "阶码不变",
      color: T.blue,
      soft: T.blueSoft,
      at: c(4),
    },
    {
      no: "03",
      t: "规格化",
      en: "NORMALIZE",
      d: "右规：尾数右移、阶码 +1；左规：尾数左移、阶码 −1",
      tag: "上溢 / 下溢",
      color: T.amber,
      soft: T.amberSoft,
      at: c(4),
    },
    {
      no: "04",
      t: "舍入",
      en: "ROUND",
      d: "就近舍入到偶数，进位后可能还要再右规一次",
      tag: "可能再上溢",
      color: T.red,
      soft: T.redSoft,
      at: c(6),
    },
  ];

  return (
    <Scene id="s12" no="12" title="浮点加减四步" en="Add / subtract pipeline">
      <div style={{ width: W }}>
        {steps.map((s) => {
          const op = interpolate(frame, [s.at - 4, s.at + 10], [0, 1], clamp);
          const x = interpolate(frame, [s.at - 4, s.at + 12], [-24, 0], clamp);
          return (
            <div
              key={s.no}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: op,
                transform: `translateX(${x}px)`,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: s.soft,
                  border: `2px solid ${s.color}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: T.mono,
                  fontSize: 26,
                  fontWeight: 800,
                  color: s.color,
                  flexShrink: 0,
                }}
              >
                {s.no}
              </div>
              <div
                style={{
                  flex: 1,
                  background: T.panel,
                  border: `1.5px solid ${T.line}`,
                  borderLeft: `5px solid ${s.color}`,
                  borderRadius: 14,
                  padding: "16px 22px",
                  boxShadow: "0 8px 20px rgba(20,26,34,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <CN size={26} color={T.ink} weight={800}>
                    {s.t}
                  </CN>
                  <Mono size={14} color={T.faint}>
                    {s.en}
                  </Mono>
                  <div style={{ flex: 1 }} />
                  <Chip color={s.color} bg={s.soft} size={15}>
                    {s.tag}
                  </Chip>
                </div>
                <CN size={19} color={T.sub} style={{ display: "block", marginTop: 6 }}>
                  {s.d}
                </CN>
              </div>
            </div>
          );
        })}

        <div
          style={{
            marginTop: 26,
            opacity: interpolate(frame, [c(7) - 8, c(7) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [c(7) - 8, c(7) + 10], [16, 0], clamp)}px)`,
            background: T.redSoft,
            border: `1.5px solid ${T.red}33`,
            borderRadius: 14,
            padding: "20px 26px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Chip color={T.red} bg={T.panel} size={17}>
            易错
          </Chip>
          <div>
            <CN size={26} color={T.ink} weight={800}>
              尾数溢出 ≠ 结果溢出
            </CN>
            <CN size={19} color={T.sub} style={{ display: "block", marginTop: 4 }}>
              只看规格化、舍入之后，最终阶码有没有越界
            </CN>
          </div>
        </div>
      </div>
    </Scene>
  );
};

// ==================== 13 总结 ====================
export const S13: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s13", i);

  const card = (
    title: string,
    en: string,
    color: string,
    soft: string,
    items: string[],
    at: number,
  ) => (
    <FadeUp delay={at} dur={12}>
      <Panel pad={24} accent={`${color}55`} style={{ background: T.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 10, height: 26, borderRadius: 4, background: color }} />
          <CN size={28} color={T.ink} weight={800}>
            {title}
          </CN>
          <Mono size={14} color={T.faint}>
            {en}
          </Mono>
        </div>
        {items.map((x) => (
          <div
            key={x}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              background: soft,
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 8,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: 3, background: color, marginTop: 10 }} />
            <CN size={20} color={T.ink2}>
              {x}
            </CN>
          </div>
        ))}
      </Panel>
    </FadeUp>
  );

  return (
    <Scene id="s13" no="13" title="一张图记住" en="Cheat sheet">
      <div style={{ width: W, display: "flex", flexDirection: "column", gap: 18 }}>
        {card("整数", "INTEGER", T.blue, T.blueSoft, [
          "无符号：纯二进制，权重 2ⁱ，范围 0 ~ 2ⁿ−1",
          "补码：最高位权重 −2ⁿ⁻¹，范围 −2ⁿ⁻¹ ~ 2ⁿ⁻¹−1",
          "负数转补码：绝对值取反加一（= 2ⁿ − |x|）",
        ], c(1) - 10)}
        {card("浮点数", "IEEE 754", T.green, T.greenSoft, [
          "三字段：s（1）· E（8/11）· M（23/52）",
          "值 = (−1)ˢ × 1.M × 2^(E−bias)，bias = 127 / 1023",
          "exp 全 0 → 非正常值 / ±0；exp 全 1 → ±∞ / NaN",
        ], c(3) - 6)}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 4 }}>
          {["−2ⁿ⁻¹", "取反 + 1", "E = e + bias", "隐含 1", "ULP = 2⁻²³"].map((x, i) => (
            <FadeUp key={x} delay={c(6) - 10 + i * 5} dur={9}>
              <Chip color={i % 2 === 0 ? T.blue : T.green} bg={i % 2 === 0 ? T.blueSoft : T.greenSoft} size={19}>
                {x}
              </Chip>
            </FadeUp>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "center",
            gap: 14,
            opacity: interpolate(frame, [c(7) - 8, c(7) + 10], [0, 1], clamp),
          }}
        >
          <div
            style={{
              background: T.ink,
              color: "#fff",
              borderRadius: 12,
              padding: "12px 26px",
              fontFamily: T.cn,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            点赞 · 收藏 · 关注
          </div>
        </div>
      </div>
    </Scene>
  );
};
