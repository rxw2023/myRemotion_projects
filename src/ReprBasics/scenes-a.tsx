import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Arrow,
  BitRow,
  CN,
  Chip,
  FadeUp,
  Mono,
  Panel,
  RangeBar,
  Scene,
  cueAt,
} from "./components";
import { T, W, clamp } from "./tokens";

// ==================== 00 开场 ====================
export const S00: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueAt("s00", i);

  const titleS = spring({ frame, fps, config: { damping: 15, stiffness: 140 } });

  const readings = [
    { k: "无符号 UNSIGNED", v: "129", color: T.blue, soft: T.blueSoft, at: c(2) },
    { k: "补码 TWO'S COMP", v: "−127", color: T.amber, soft: T.amberSoft, at: c(3) },
    { k: "原码 SIGN-MAG", v: "−1", color: T.purple, soft: T.purpleSoft, at: c(4) },
    { k: "BCD", v: "81", color: T.green, soft: T.greenSoft, at: c(4) + 12 },
  ];

  return (
    <Scene id="s00" no="00" title="整数与浮点数表示" en="Data Representation">
      <div style={{ opacity: interpolate(frame, [0, 10], [0, 1], clamp), marginBottom: 24 }}>
        <Chip>计算机组成原理 · 408</Chip>
      </div>

      <div style={{ textAlign: "center", transform: `scale(${0.92 + 0.08 * titleS})` }}>
        <div
          style={{
            fontFamily: T.cn,
            fontSize: 94,
            fontWeight: 900,
            color: T.ink,
            letterSpacing: 4,
            lineHeight: 1.2,
          }}
        >
          整数 <span style={{ color: T.blue }}>与</span> 浮点数
        </div>
        <div
          style={{
            fontFamily: T.cn,
            fontSize: 30,
            fontWeight: 600,
            color: T.sub,
            marginTop: 16,
            letterSpacing: 2,
            opacity: interpolate(frame, [c(1), c(1) + 10], [0, 1], clamp),
          }}
        >
          同一串比特，能有几种含义？
        </div>
      </div>

      <div style={{ marginTop: 46 }}>
        <BitRow bits="10000001" cell={92} gap={10} reveal={c(1) + 6} stagger={4} />
      </div>

      <div
        style={{
          marginTop: 52,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          width: W - 60,
        }}
      >
        {readings.map((r) => {
          const op = interpolate(frame, [r.at, r.at + 10], [0, 1], clamp);
          const y = interpolate(frame, [r.at, r.at + 12], [26, 0], clamp);
          return (
            <div
              key={r.k}
              style={{
                opacity: op,
                transform: `translateY(${y}px)`,
                background: T.panel,
                border: `2px solid ${r.color}44`,
                borderLeft: `6px solid ${r.color}`,
                borderRadius: 14,
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 10px 26px rgba(20,26,34,0.05)",
              }}
            >
              <span style={{ fontFamily: T.mono, fontSize: 17, fontWeight: 700, color: T.sub }}>
                {r.k}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 40, fontWeight: 800, color: r.color }}>
                {r.v}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 40, opacity: interpolate(frame, [c(5), c(5) + 12], [0, 1], clamp) }}>
        <CN size={26} color={T.sub}>
          先讲清楚 <Mono size={24} color={T.blue}>怎么存</Mono>，再讲清楚{" "}
          <Mono size={24} color={T.blue}>怎么读</Mono>
        </CN>
      </div>
    </Scene>
  );
};

// ==================== 01 比特 ≠ 数值 ====================
export const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s01", i);

  const views = [
    { k: "无符号", v: "183", color: T.blue, soft: T.blueSoft, note: "纯二进制求和", at: c(4) },
    { k: "补码", v: "−73", color: T.amber, soft: T.amberSoft, note: "最高位权重为负", at: c(4) + 10 },
    { k: "原码", v: "−55", color: T.purple, soft: T.purpleSoft, note: "符号位 + 绝对值", at: c(4) + 20 },
  ];

  return (
    <Scene id="s01" no="01" title="位串只是位串" en="Bits are just bits">
      <div style={{ display: "flex", gap: 20, width: W }}>
        <div style={{ flex: 1 }}>
          <FadeUp delay={c(1) - 8} dur={12}>
            <Panel style={{ height: 260, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontFamily: T.mono, fontSize: 16, color: T.faint, letterSpacing: 2 }}>
                LITERAL / 字面值
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 86, fontWeight: 800, color: T.ink, lineHeight: 1.1 }}>
                −73
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 21, color: T.sub, marginTop: 6 }}>
                写在纸上，带正负号
              </div>
            </Panel>
          </FadeUp>
        </div>
        <div style={{ flex: 1.15 }}>
          <FadeUp delay={c(2) - 8} dur={12}>
            <Panel style={{ height: 260, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontFamily: T.mono, fontSize: 16, color: T.faint, letterSpacing: 2 }}>
                BITS / 机器里存的
              </div>
              <div style={{ marginTop: 10 }}>
                <BitRow bits="10110111" cell={44} gap={5} radius={8} reveal={c(2) + 4} stagger={3} />
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 21, color: T.sub, marginTop: 12 }}>
                只有 0 和 1，没有符号位
              </div>
            </Panel>
          </FadeUp>
        </div>
      </div>

      <div style={{ marginTop: 34, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ height: 46, width: 2, background: T.line }} />
        <Chip color={T.sub} bg={T.panel} size={17}>
          同一组位 · 三套解释规则
        </Chip>
        <div style={{ height: 30, width: 2, background: T.line }} />
      </div>

      <div style={{ display: "flex", gap: 16, width: W, marginTop: 8 }}>
        {views.map((v, i) => (
          <React.Fragment key={v.k}>
            {i > 0 && <Arrow delay={v.at - 6} w={54} />}
            <FadeUp delay={v.at} dur={12} style={{ flex: 1 }}>
              <Panel accent={v.color} pad={18} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: T.cn, fontSize: 24, fontWeight: 800, color: v.color }}>
                  {v.k}
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 52,
                    fontWeight: 800,
                    color: T.ink,
                    lineHeight: 1.2,
                  }}
                >
                  {v.v}
                </div>
                <div style={{ fontFamily: T.cn, fontSize: 17, color: T.sub }}>{v.note}</div>
              </Panel>
            </FadeUp>
          </React.Fragment>
        ))}
      </div>

      <div
        style={{
          marginTop: 44,
          opacity: interpolate(frame, [c(5) - 6, c(5) + 6], [0, 1], clamp),
          transform: `translateY(${interpolate(frame, [c(5) - 6, c(5) + 8], [16, 0], clamp)}px)`,
          background: T.blueSoft,
          borderRadius: 14,
          padding: "16px 26px",
          border: `1.5px solid ${T.blue}33`,
        }}
      >
        <CN size={25} color={T.ink}>
          真正的问题不是「这串位是什么」，而是「编译器用哪套规则读它」
        </CN>
      </div>
    </Scene>
  );
};

// ==================== 02 无符号数：权重与范围 ====================
export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s02", i);

  const sum = interpolate(frame, [c(5), c(5) + 26], [0, 129], clamp);

  return (
    <Scene id="s02" no="02" title="无符号数：纯二进制" en="Unsigned · pure binary">
      <div style={{ width: W }}>
        <FadeUp delay={c(1) - 10}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <Chip color={T.blue} bg={T.blueSoft}>
              公式
            </Chip>
            <Mono size={32}>
              X = <span style={{ color: T.blue }}>Σ</span> xᵢ · 2ⁱ
            </Mono>
            <CN size={20} color={T.sub}>
              第 i 位权重 = 2ⁱ
            </CN>
          </div>
        </FadeUp>

        <Panel pad={30} style={{ display: "flex", justifyContent: "center" }}>
          <BitRow
            bits="10000001"
            cell={86}
            gap={9}
            labels={["128", "64", "32", "16", "8", "4", "2", "1"]}
            hl={{ 0: T.blue, 7: T.blue }}
            reveal={16}
            stagger={4}
            pulse={[
              { index: 0, at: c(4) },
              { index: 7, at: c(5) },
            ]}
            labelSize={22}
          />
        </Panel>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            opacity: interpolate(frame, [c(5) - 6, c(5) + 6], [0, 1], clamp),
          }}
        >
          <Mono size={34} color={T.sub}>
            128
          </Mono>
          <Mono size={34} color={T.sub}>
            +
          </Mono>
          <Mono size={34} color={T.sub}>
            1
          </Mono>
          <Mono size={34} color={T.sub}>
            =
          </Mono>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 58,
              fontWeight: 800,
              color: T.blue,
              minWidth: 110,
              textAlign: "center",
            }}
          >
            {Math.round(sum)}
          </div>
        </div>

        <div style={{ marginTop: 40, opacity: interpolate(frame, [c(6) - 8, c(6) + 8], [0, 1], clamp) }}>
          <RangeBar
            left="0"
            right="255 = 2⁸ − 1"
            fill={1}
            color={T.blue}
            delay={c(6)}
            note="8 位无符号数：最小值 0，最大值 2ⁿ − 1"
            width={W - 40}
          />
        </div>
      </div>
    </Scene>
  );
};

// ==================== 03 除二取余 ====================
export const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s03", i);

  const rows = [
    { d: 73, q: 36, r: 1 },
    { d: 36, q: 18, r: 0 },
    { d: 18, q: 9, r: 0 },
    { d: 9, q: 4, r: 1 },
    { d: 4, q: 2, r: 0 },
    { d: 2, q: 1, r: 0 },
    { d: 1, q: 0, r: 1 },
  ];
  const rowAt = [14, 26, c(3), c(3) + 12, c(4), c(4) + 8, c(4) + 16];

  return (
    <Scene id="s03" no="03" title="十进制 → 二进制" en="Divide by 2, take remainder">
      <div style={{ display: "flex", gap: 34, width: W, alignItems: "flex-start" }}>
        <Panel pad={26} style={{ width: 470 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <Chip color={T.blue} bg={T.blueSoft} size={16}>
              除 2 取余
            </Chip>
            <Chip color={T.sub} bg="#F2F5F9" size={16}>
              73 → 01001001
            </Chip>
          </div>
          {rows.map((r, i) => {
            const op = interpolate(frame, [rowAt[i], rowAt[i] + 9], [0, 1], clamp);
            const x = interpolate(frame, [rowAt[i], rowAt[i] + 9], [-14, 0], clamp);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 52,
                  borderBottom: i < rows.length - 1 ? `1px dashed ${T.line}` : "none",
                  opacity: op,
                  transform: `translateX(${x}px)`,
                }}
              >
                <Mono size={27} color={T.ink2}>
                  {r.d} ÷ 2 = {r.q}
                </Mono>
                <Mono size={22} color={T.faint}>
                  余
                </Mono>
                <Mono size={30} color={r.r === 1 ? T.blue : T.faint} weight={800}>
                  {r.r}
                </Mono>
              </div>
            );
          })}
        </Panel>

        <div style={{ flex: 1, paddingTop: 40 }}>
          <FadeUp delay={c(2) - 10}>
            <CN size={21} color={T.sub} style={{ display: "block", marginBottom: 14 }}>
              余数从下往上读 ↑
            </CN>
          </FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows
              .slice()
              .reverse()
              .map((r, i) => {
                const at = 22 + i * 7;
                const op = interpolate(frame, [at, at + 8], [0, 1], clamp);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: op }}>
                    <Mono size={22} color={T.faint}>
                      {rows.length - 1 - i}
                    </Mono>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 10,
                        background: r.r === 1 ? T.blue : T.panel,
                        border: `2px solid ${r.r === 1 ? T.blue : "#D8DFE8"}`,
                        color: r.r === 1 ? "#fff" : "#AEB8C4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: T.mono,
                        fontSize: 28,
                        fontWeight: 800,
                      }}
                    >
                      {r.r}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 36, opacity: interpolate(frame, [c(5) + 20, c(5) + 32], [0, 1], clamp) }}>
        <BitRow bits="01001001" cell={62} gap={8} reveal={c(5) + 18} stagger={4} />
      </div>

      <div
        style={{
          marginTop: 34,
          opacity: interpolate(frame, [c(6) - 6, c(6) + 6], [0, 1], clamp),
          display: "flex",
          gap: 12,
        }}
      >
        <Chip color={T.green} bg={T.greenSoft}>
          73 = 64 + 8 + 1
        </Chip>
        <Chip color={T.sub} bg={T.panel}>
          熟练后直接凑 2 的幂
        </Chip>
      </div>
    </Scene>
  );
};

// ==================== 04 补码：最高位带负号 ====================
export const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s04", i);

  const strike = interpolate(frame, [c(1), c(1) + 8], [0, 1], clamp);
  const negIn = interpolate(frame, [c(2), c(2) + 10], [0, 1], clamp);

  return (
    <Scene id="s04" no="04" title="补码：最高位是负的" en="Two's complement">
      <div style={{ width: W }}>
        <div style={{ position: "relative" }}>
          <Panel pad={30} style={{ display: "flex", justifyContent: "center", paddingTop: 72 }}>
            <BitRow
              bits="10000000"
              cell={86}
              gap={9}
              labels={["−128", "64", "32", "16", "8", "4", "2", "1"]}
              labelColor={{ 0: T.amber }}
              hl={{ 0: T.amber }}
              outline={{ 0: T.amber }}
              reveal={c(0)}
              stagger={4}
              pulse={[{ index: 0, at: c(3) }]}
              labelSize={22}
            />
          </Panel>
          {/* 权重 +128 → −128 的切换标注 */}
          <div
            style={{
              position: "absolute",
              left: 100,
              top: 30,
              width: 86,
              textAlign: "center",
              height: 40,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                fontFamily: T.mono,
                fontSize: 26,
                fontWeight: 800,
                color: T.faint,
                opacity: 1 - strike,
                textDecoration: `line-through ${T.red}`,
                textDecorationThickness: 3 * strike,
              }}
            >
              +128
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                fontFamily: T.mono,
                fontSize: 28,
                fontWeight: 800,
                color: T.amber,
                opacity: negIn,
              }}
            >
              −128
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            gap: 22,
            opacity: interpolate(frame, [c(4) - 6, c(4) + 8], [0, 1], clamp),
          }}
        >
          <BitRow
            bits="10000001"
            cell={60}
            gap={7}
            hl={{ 0: T.amber, 7: T.blue }}
            reveal={c(4)}
            stagger={3}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mono size={28} color={T.amber}>
              −128
            </Mono>
            <Mono size={28} color={T.sub}>
              +
            </Mono>
            <Mono size={28} color={T.blue}>
              1
            </Mono>
            <Mono size={28} color={T.sub}>
              =
            </Mono>
            <Mono size={46} color={T.ink}>
              −127
            </Mono>
          </div>
        </div>

        <div style={{ marginTop: 52, opacity: interpolate(frame, [c(6) - 10, c(6) + 8], [0, 1], clamp) }}>
          <RangeBar
            left="−128"
            right="+127"
            fill={0.86}
            color={T.amber}
            delay={c(6)}
            note="8 位补码：−2ⁿ⁻¹ ~ 2ⁿ⁻¹ − 1（负数比正数多一个）"
            width={W - 40}
          />
        </div>

        <div
          style={{
            marginTop: 34,
            opacity: interpolate(frame, [c(7) - 6, c(7) + 8], [0, 1], clamp),
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <Chip color={T.amber} bg={T.amberSoft}>
            0 只有一种编码 ⇒ 省出的码给 −128
          </Chip>
        </div>
      </div>
    </Scene>
  );
};

// ==================== 05 取反加一 ====================
const CHIP_FIX: React.CSSProperties = { width: 214, justifyContent: "center" };

export const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s05", i);

  return (
    <Scene id="s05" no="05" title="负数转补码：取反 + 1" en="Invert, then add one">
      <div style={{ width: W }}>
        <Panel pad={28} style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Chip color={T.sub} bg="#F2F5F9" size={16} style={CHIP_FIX}>
              ① |−73| = 73
            </Chip>
            <BitRow bits="01001001" cell={54} gap={6} reveal={14} stagger={3} />
            <CN size={19} color={T.sub}>
              纯二进制
            </CN>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Chip color={T.purple} bg={T.purpleSoft} size={16} style={CHIP_FIX}>
              ② 按位取反
            </Chip>
            <BitRow
              bits="10110110"
              from="01001001"
              cell={54}
              gap={6}
              reveal={c(3)}
              stagger={3}
              outline={{ 0: T.purple, 1: T.purple, 2: T.purple, 3: T.purple, 4: T.purple, 5: T.purple, 6: T.purple, 7: T.purple }}
            />
            <CN size={19} color={T.sub}>
              0 ↔ 1 全翻转
            </CN>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Chip color={T.blue} bg={T.blueSoft} size={16} style={CHIP_FIX}>
              ③ 末位 + 1
            </Chip>
            <div style={{ position: "relative" }}>
              <BitRow
                bits="10110111"
                from="10110110"
                cell={54}
                gap={6}
                reveal={c(4)}
                stagger={3}
                hl={{ 7: T.blue }}
                pulse={[{ index: 7, at: c(4) + 14 }]}
              />
            </div>
            <CN size={19} color={T.sub}>
              = −73 的补码
            </CN>
          </div>
        </Panel>

        <div
          style={{
            marginTop: 44,
            opacity: interpolate(frame, [c(5) - 8, c(5) + 8], [0, 1], clamp),
          }}
        >
          <Panel style={{ background: T.purpleSoft, borderColor: "#D9D2FB" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Chip color={T.purple} bg={T.panel} size={16}>
                WHY "TWO'S"
              </Chip>
              <Mono size={28}>2⁸ − 73 = 256 − 73 = 183 = 1011 0111₂</Mono>
            </div>
            <CN size={21} color={T.sub} style={{ display: "block", marginTop: 10 }}>
              负数补码 = 2ⁿ − |x|：在模 2ⁿ 的世界里，减法被改写成加法。
            </CN>
          </Panel>
        </div>

        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 12,
            justifyContent: "center",
            opacity: interpolate(frame, [c(6) - 8, c(7) + 8], [0, 1], clamp),
          }}
        >
          <Chip color={T.blue} bg={T.blueSoft}>
            减法器 → 无需单独硬件
          </Chip>
          <Chip color={T.green} bg={T.greenSoft}>
            加减法共用一套加法器
          </Chip>
        </div>
      </div>
    </Scene>
  );
};

// ==================== 06 原码 & 移码 ====================
export const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueAt("s06", i);

  return (
    <Scene id="s06" no="06" title="原码与移码" en="Sign-magnitude · Biased">
      <div style={{ width: W }}>
        <Panel pad={26}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
            <Chip color={T.purple} bg={T.purpleSoft} size={16}>
              原码 SIGN-MAGNITUDE
            </Chip>
            <CN size={19} color={T.sub}>
              最高位符号位，其余为绝对值
            </CN>
          </div>
          {[
            { bits: "00011001", label: "+25" },
            { bits: "10011001", label: "−25" },
          ].map((r, i) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginTop: i === 0 ? 0 : 14,
                opacity: interpolate(frame, [12 + i * 10, 22 + i * 10], [0, 1], clamp),
              }}
            >
              <Mono size={30} color={T.ink} style={{ width: 64, textAlign: "right" }}>
                {r.label}
              </Mono>
              <BitRow
                bits={r.bits}
                cell={52}
                gap={6}
                reveal={12 + i * 10}
                stagger={2}
                outline={{ 0: T.amber }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Chip color={T.amber} bg={T.amberSoft} size={15}>
                  符号位
                </Chip>
              </div>
            </div>
          ))}
        </Panel>

        <div style={{ display: "flex", gap: 16, marginTop: 26 }}>
          {[
            { t: "硬伤 ①", d: "+0 与 −0 两种编码，白占一个码", c: T.red, s: T.redSoft, at: c(3) },
            { t: "硬伤 ②", d: "加减前要先比绝对值，硬件多一层判断", c: T.red, s: T.redSoft, at: c(4) },
          ].map((x) => (
            <div
              key={x.t}
              style={{
                flex: 1,
                opacity: interpolate(frame, [x.at - 4, x.at + 8], [0, 1], clamp),
                transform: `translateY(${interpolate(frame, [x.at - 4, x.at + 10], [18, 0], clamp)}px)`,
                background: x.s,
                border: `1.5px solid ${x.c}33`,
                borderRadius: 14,
                padding: "18px 22px",
              }}
            >
              <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 800, color: x.c }}>
                {x.t}
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 700, color: T.ink2, marginTop: 6 }}>
                {x.d}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 26, opacity: interpolate(frame, [c(6) - 6, c(6) + 8], [0, 1], clamp) }}>
          <Panel pad={22} accent={T.green}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Chip color={T.green} bg={T.greenSoft} size={16}>
                移码 BIASED
              </Chip>
              <CN size={19} color={T.sub}>
                补码符号位取反
              </CN>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
              <BitRow bits="10110111" cell={36} gap={4} radius={7} reveal={c(6) + 6} stagger={2} />
              <Mono size={26} color={T.faint}>
                →
              </Mono>
              <BitRow
                bits="00110111"
                from="10110111"
                cell={36}
                gap={4}
                radius={7}
                reveal={c(6) + 26}
                stagger={2}
                outline={{ 0: T.green }}
              />
              <CN size={19} color={T.sub} style={{ marginLeft: 6 }}>
                大小顺序 → 无符号比较（存阶码用）
              </CN>
            </div>
          </Panel>
        </div>
      </div>
    </Scene>
  );
};
