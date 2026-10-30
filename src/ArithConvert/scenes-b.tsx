import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { T, W, clamp } from "./tokens";
import {
  Arrow,
  BitStrip,
  Callout,
  Chip,
  CN,
  Code,
  FadeUp,
  Mono,
  Panel,
  Scene,
  cueAt,
  paint,
} from "./components";

// ==================== 零件 ====================

const ReadCard: React.FC<{
  tag: string;
  tagColor: string;
  tagBg: string;
  value: string;
  note: string;
  delay: number;
  width?: number;
}> = ({ tag, tagColor, tagBg, value, note, delay, width = 448 }) => (
  <FadeUp delay={delay} style={{ width }}>
    <Panel pad={20} accent={`${tagColor}44`} style={{ height: 190 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Chip color={tagColor} bg={tagBg} size={19}>
          {tag}
        </Chip>
        <CN size={19} color={T.faint}>
          {note}
        </CN>
      </div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 46,
          fontWeight: 800,
          color: tagColor,
          marginTop: 14,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </Panel>
  </FadeUp>
);

// ==================== S08 · 除法 ====================

const DivVertical: React.FC<{ t: (i: number) => number }> = ({ t }) => {
  const frame = useCurrentFrame();
  const lines = [
    "          00111",
    "        --------",
    "  0010 ) 00001111",
    "         0010",
    "         ----",
    "          0011",
    "          0010",
    "          ----",
    "           0011",
    "           0010",
    "           ----",
    "           0001",
  ];
  return (
    <div style={{ fontFamily: T.mono, fontSize: 29, lineHeight: 1.75, letterSpacing: 1 }}>
      {lines.map((l, i) => {
        const op = interpolate(frame, [t(1) + i * 3, t(1) + i * 3 + 8], [0, 1], clamp);
        const isQuot = i === 0;
        const isRem = i === lines.length - 1;
        return (
          <div
            key={i}
            style={{
              opacity: op,
              whiteSpace: "pre",
              color: isQuot ? T.green : isRem ? T.red : T.ink2,
              fontWeight: isQuot || isRem ? 800 : 600,
            }}
          >
            {l}
            {isQuot && (
              <span style={{ fontFamily: T.cn, fontSize: 18, color: T.green }}>  商</span>
            )}
            {isRem && (
              <span style={{ fontFamily: T.cn, fontSize: 18, color: T.red }}>  余数</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const S08: React.FC = () => {
  const t = (i: number) => cueAt("s08", i);
  return (
    <Scene id="s08" no="08" title="除法：移位试减" en="DIVIDE = SHIFT + TRY SUBTRACT">
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <Panel pad={22} style={{ width: 500 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Chip color={T.blue} bg={T.blueSoft} size={18}>
              15 ÷ 2 = 7 … 1
            </Chip>
          </div>
          <DivVertical t={t} />
        </Panel>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <FadeUp delay={t(2)}>
            <Panel pad={16} accent={T.line}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 20,
                    fontWeight: 800,
                    color: T.blue,
                    background: T.blueSoft,
                    borderRadius: 8,
                    padding: "4px 10px",
                  }}
                >
                  1
                </div>
                <CN size={22} color={T.ink2}>
                  余数左移一位
                </CN>
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(3)}>
            <Panel pad={16} accent={T.line}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 20,
                    fontWeight: 800,
                    color: T.blue,
                    background: T.blueSoft,
                    borderRadius: 8,
                    padding: "4px 10px",
                  }}
                >
                  2
                </div>
                <CN size={22} color={T.ink2}>
                  移入被除数的下一位
                </CN>
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(3) + 8}>
            <Panel pad={16} accent={T.line}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 20,
                    fontWeight: 800,
                    color: T.blue,
                    background: T.blueSoft,
                    borderRadius: 8,
                    padding: "4px 10px",
                  }}
                >
                  3
                </div>
                <CN size={22} color={T.ink2}>
                  减除数，看差的符号定商位
                </CN>
              </div>
            </Panel>
          </FadeUp>

          <FadeUp delay={t(4)}>
            <Callout color={T.red} delay={t(4)} style={{ padding: "14px 18px" }}>
              <span style={{ fontSize: 23 }}>商位由「够不够减」决定，不是估算</span>
            </Callout>
          </FadeUp>

          <FadeUp delay={t(5)}>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                background: T.panel,
                border: `2px solid ${T.amber}44`,
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <Mono size={22} color={T.amber}>
                早期 CPU
              </Mono>
              <CN size={20} color={T.ink2}>
                除法 20–40 周期，加法只要 1 个
              </CN>
            </div>
          </FadeUp>
        </div>
      </div>
    </Scene>
  );
};

// ==================== S09 · 位模式不变 ====================

export const S09: React.FC = () => {
  const t = (i: number) => cueAt("s09", i);

  return (
    <Scene id="s09" no="09" title="转类型：位不动" en="CAST = REINTERPRET">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <BitStrip
            bits="11111111"
            cell={62}
            gap={7}
            delay={t(0)}
            hl={paint(8, T.ink)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Mono size={20} color={T.faint}>
              8 bit
            </Mono>
            <CN size={20} color={T.sub}>
              内存里就这一串
            </CN>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Arrow dir="down" delay={t(2)} color={T.blue} label="按补码读" />
            <ReadCard
              tag="signed int"
              tagColor={T.blue}
              tagBg={T.blueSoft}
              value="−1"
              note="补码解释"
              delay={t(3)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Arrow dir="down" delay={t(2) + 6} color={T.purple} label="按纯二进制读" />
            <ReadCard
              tag="unsigned"
              tagColor={T.purple}
              tagBg={T.purpleSoft}
              value="255"
              note="纯二进制解释"
              delay={t(3) + 6}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
          <FadeUp delay={t(4)}>
            <Panel pad={18} accent={`${T.amber}44`} style={{ background: T.amberSoft, width: 452 }}>
              <div style={{ fontFamily: T.cn, fontSize: 20, color: T.ink2 }}>负数转无符号</div>
              <div style={{ fontFamily: T.mono, fontSize: 27, fontWeight: 800, color: T.ink, marginTop: 6 }}>
                −1 → 255
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(4) + 8}>
            <Panel pad={18} accent={`${T.green}44`} style={{ background: T.greenSoft, width: 452 }}>
              <div style={{ fontFamily: T.cn, fontSize: 20, color: T.ink2 }}>换算公式</div>
              <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 800, color: T.green, marginTop: 6 }}>
                unsigned = int + 2⁸
              </div>
            </Panel>
          </FadeUp>
        </div>

        <FadeUp delay={t(5)}>
          <Callout color={T.blue} delay={t(5)} style={{ width: W }}>
            <span style={{ fontSize: 26 }}>
              位模式不变，<span style={{ color: T.blue }}>值 = 换一套解释规则重算</span>
            </span>
          </Callout>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S10 · 两种命运 ====================

export const S10: React.FC = () => {
  const t = (i: number) => cueAt("s10", i);
  const frame = useCurrentFrame();
  const jump = interpolate(frame, [t(4), t(4) + 24], [0, 1], clamp);

  return (
    <Scene id="s10" no="10" title="改解释，还是改位" en="REINTERPRET OR REWRITE">
      <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 18 }}>
          <FadeUp delay={t(0)} style={{ width: 462 }}>
            <Panel pad={20} accent={T.blue} style={{ height: 230 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Chip color={T.blue} bg={T.blueSoft} size={18}>
                  情况一
                </Chip>
                <CN size={22} color={T.ink}>
                  改解释
                </CN>
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 20, color: T.sub, marginTop: 12, lineHeight: 1.5 }}>
                同宽度互转：int ↔ unsigned
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 800, color: T.blue, marginTop: 8 }}>
                位不动，值变
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 8 }}>
                编译器只换读取方式
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(1)} style={{ width: 462 }}>
            <Panel pad={20} accent={T.amber} style={{ height: 230 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Chip color={T.amber} bg={T.amberSoft} size={18}>
                  情况二
                </Chip>
                <CN size={22} color={T.ink}>
                  改位
                </CN>
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 20, color: T.sub, marginTop: 12, lineHeight: 1.5 }}>
                变长度 / 跨类型：short ↔ int
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 800, color: T.amber, marginTop: 8 }}>
                位要扩或截
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 8 }}>
                符号扩展 / 零扩展 / 截断
              </div>
            </Panel>
          </FadeUp>
        </div>

        {/* 数轴：-1 跳到 255 */}
        <Panel pad={22} style={{ width: W }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <CN size={20} color={T.sub}>
              同一串位 1111 1111 的两种位置
            </CN>
            <Mono size={20} color={T.faint}>
              8 bit
            </Mono>
          </div>
          <div
            style={{
              position: "relative",
              height: 76,
              background: T.panel,
              border: `2px solid ${T.ink}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "50%",
                background: T.blueSoft,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: "50%",
                background: T.purpleSoft,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 2,
                background: T.ink,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 20,
                fontFamily: T.mono,
                fontSize: 24,
                fontWeight: 800,
                color: T.blue,
              }}
            >
              −1
            </div>
            <div
              style={{
                position: "absolute",
                right: 16,
                top: 20,
                fontFamily: T.mono,
                fontSize: 24,
                fontWeight: 800,
                color: T.purple,
              }}
            >
              255
            </div>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 10,
                bottom: 10,
                width: 2,
                background: T.amber,
                opacity: jump,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <CN size={18} color={T.blue}>
              有符号：−128 … 127
            </CN>
            <CN size={18} color={T.purple}>
              无符号：0 … 255
            </CN>
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
          <FadeUp delay={t(5)}>
            <Code
              title="loop.c"
              width={452}
              size={21}
              delay={t(5)}
              lines={[
                { text: "unsigned i = 10;" },
                { text: "while (i >= 0) {" },
                { text: "  i--;  // 永远不会 < 0", hl: true },
                { text: "}" },
              ]}
            />
          </FadeUp>
          <FadeUp delay={t(5) + 10} style={{ width: 480 }}>
            <Callout color={T.red} delay={t(5) + 10} style={{ height: 168 }}>
              <span style={{ fontSize: 25, lineHeight: 1.5 }}>
                无符号数没有负数
                <br />
                减到 0 再减，就回绕成最大值
              </span>
            </Callout>
          </FadeUp>
        </div>
      </div>
    </Scene>
  );
};

// ==================== S11 · 整型 ↔ 浮点 ====================

export const S11: React.FC = () => {
  const t = (i: number) => cueAt("s11", i);
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [t(2), t(3)], [0, 1], clamp);

  return (
    <Scene id="s11" no="11" title="整型 ↔ 浮点" en="INT ↔ FLOAT">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
        <Panel pad={22} style={{ width: W }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <CN size={21} color={T.sub}>
              float 的有效位
            </CN>
            <Mono size={22} color={T.ink}>
              1 + 23 = 24 bit
            </Mono>
          </div>
          <div style={{ display: "flex", marginTop: 12, gap: 4 }}>
            <div
              style={{
                width: 46,
                height: 54,
                borderRadius: 8,
                background: T.amberSoft,
                border: `2px solid ${T.amber}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: 20,
                fontWeight: 800,
                color: T.ink,
              }}
            >
              1
            </div>
            <div style={{ flex: 1, display: "flex", gap: 3 }}>
              {Array.from({ length: 23 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 54,
                    borderRadius: 5,
                    background: T.blueSoft,
                    border: `1.5px solid ${T.blue}55`,
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            <CN size={18} color={T.amber}>
              隐含的 1
            </CN>
            <CN size={18} color={T.blue}>
              23 位尾数
            </CN>
          </div>
        </Panel>

        {/* 精确区 / 丢精度区 */}
        <Panel pad={20} style={{ width: W }}>
          <div
            style={{
              position: "relative",
              height: 64,
              borderRadius: 10,
              background: T.greenSoft,
              border: `2px solid ${T.green}66`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "42%",
                top: 0,
                bottom: 0,
                right: 0,
                background: T.redSoft,
                borderLeft: `2px solid ${T.red}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 14,
                top: 18,
                fontFamily: T.cn,
                fontSize: 20,
                fontWeight: 800,
                color: T.green,
              }}
            >
              精确区
            </div>
            <div
              style={{
                position: "absolute",
                left: "44%",
                top: 18,
                fontFamily: T.cn,
                fontSize: 20,
                fontWeight: 800,
                color: T.red,
              }}
            >
              超出 2²⁴ → 低位被挤掉
            </div>
            <div
              style={{
                position: "absolute",
                left: `${42 * sweep}%`,
                top: 0,
                bottom: 0,
                width: 3,
                background: T.amber,
                opacity: sweep > 0.02 ? 1 : 0,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <Mono size={20} color={T.ink2}>
              0
            </Mono>
            <Mono size={20} color={T.amber}>
              2²⁴ = 16 777 216
            </Mono>
            <Mono size={20} color={T.faint}>
              2³¹
            </Mono>
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 18 }}>
          <FadeUp delay={t(4)}>
            <Code
              title="cast.c"
              width={462}
              size={21}
              delay={t(4)}
              lines={[
                { text: "float f = 3.99f;" },
                { text: "int y = (int)f;   // 3，不是 4", hl: true },
                { text: "// 截断，不是四舍五入" },
              ]}
            />
          </FadeUp>
          <FadeUp delay={t(5)} style={{ width: 470 }}>
            <Callout color={T.red} delay={t(5)} style={{ height: 168 }}>
              <span style={{ fontSize: 24, lineHeight: 1.6 }}>
                浮点转整型
                <br />
                小数截断，超出范围 → 未定义行为
              </span>
            </Callout>
          </FadeUp>
        </div>
      </div>
    </Scene>
  );
};

// ==================== S12 · 长度转换 ====================

export const S12: React.FC = () => {
  const t = (i: number) => cueAt("s12", i);

  return (
    <Scene id="s12" no="12" title="变长度：扩或截" en="WIDEN OR NARROW">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <Panel pad={22} style={{ width: W }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Chip color={T.green} bg={T.greenSoft} size={18}>
              短 → 长
            </Chip>
            <CN size={22} color={T.ink}>
              符号扩展
            </CN>
            <div style={{ flex: 1 }} />
            <Mono size={20} color={T.faint}>
              short → int
            </Mono>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <Mono size={22} color={T.ink2}>
                0xFF80
              </Mono>
              <div style={{ fontFamily: T.cn, fontSize: 18, color: T.faint }}>= −128</div>
            </div>
            <Arrow delay={t(1)} w={60} color={T.green} />
            <BitStrip
              bits="1111111110000000"
              cell={33}
              gap={3}
              delay={t(1) + 6}
              segs={[
                { text: "补 8 个 1（符号位）", from: 0, to: 7, color: T.green, bg: T.greenSoft },
                { text: "原 8 位", from: 8, to: 15, color: T.ink2, bg: "#F1F4F8" },
              ]}
              mono={17}
            />
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 21, color: T.green, marginTop: 10 }}>
            −128 还是 −128，值不变
          </div>
        </Panel>

        <Panel pad={22} style={{ width: W }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Chip color={T.amber} bg={T.amberSoft} size={18}>
              长 → 短
            </Chip>
            <CN size={22} color={T.ink}>
              高位截断
            </CN>
            <div style={{ flex: 1 }} />
            <Mono size={20} color={T.faint}>
              int → short
            </Mono>
          </div>
          <div style={{ marginTop: 16 }}>
            <BitStrip
              bits="00010010001101000101011001111000"
              cell={24}
              gap={2}
              delay={t(2) + 6}
              segs={[
                { text: "高 16 位：丢弃", from: 0, to: 15, color: T.red, bg: T.redSoft },
                { text: "低 16 位：保留", from: 16, to: 31, color: T.amber, bg: T.amberSoft },
              ]}
              mono={13}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <Mono size={21} color={T.ink2}>
              0x12345678
            </Mono>
            <Arrow delay={t(2)} w={50} color={T.amber} />
            <Mono size={23} color={T.amber}>
              0x5678
            </Mono>
            <CN size={19} color={T.faint}>
              值被悄悄改写
            </CN>
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 18, width: W }}>
          <FadeUp delay={t(4)} style={{ flex: 1 }}>
            <Panel pad={18} accent={`${T.blue}44`} style={{ background: T.blueSoft }}>
              <Mono size={22} color={T.blue}>
                float → double
              </Mono>
              <div style={{ fontFamily: T.cn, fontSize: 20, color: T.ink2, marginTop: 6 }}>
                精确，尾数更宽
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(5)} style={{ flex: 1 }}>
            <Panel pad={18} accent={`${T.red}44`} style={{ background: T.redSoft }}>
              <Mono size={22} color={T.red}>
                double → float
              </Mono>
              <div style={{ fontFamily: T.cn, fontSize: 20, color: T.ink2, marginTop: 6 }}>
                可能要舍入
              </div>
            </Panel>
          </FadeUp>
        </div>

        <FadeUp delay={t(3)}>
          <Callout color={T.purple} delay={t(3)} style={{ width: W, padding: "12px 20px" }}>
            <span style={{ fontSize: 23 }}>
              有符号补符号位，无符号补零 —— 截断只需砍高位
            </span>
          </Callout>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S13 · 隐式与显式 ====================

export const S13: React.FC = () => {
  const t = (i: number) => cueAt("s13", i);

  return (
    <Scene id="s13" no="13" title="隐式与显式" en="IMPLICIT & EXPLICIT">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 18 }}>
          <FadeUp delay={t(1)}>
            <Code
              title="implicit.c"
              width={462}
              size={20}
              delay={t(1)}
              lines={[
                { text: "int i = 5;" },
                { text: "float f = 2.5f;" },
                { text: "float r = i + f;", hl: true },
                { text: "// i 先变成 5.0f" },
              ]}
            />
          </FadeUp>
          <FadeUp delay={t(4)}>
            <Code
              title="explicit.c"
              width={462}
              size={20}
              delay={t(4)}
              lines={[
                { text: "int i = 5;" },
                { text: "float f = 3.2f;" },
                { text: "int r = (int)f + i;", hl: true },
                { text: "// 3 + 5，风险你担" },
              ]}
            />
          </FadeUp>
        </div>

        <div style={{ display: "flex", gap: 18, width: W }}>
          <FadeUp delay={t(2)} style={{ flex: 1 }}>
            <Panel pad={18} accent={`${T.blue}33`} style={{ background: T.blueSoft, height: 150 }}>
              <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 800, color: T.blue }}>
                隐式转换
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 8, lineHeight: 1.5 }}>
                混合运算 / 赋值 / 比较时自动发生
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(3)} style={{ flex: 1 }}>
            <Panel pad={18} accent={`${T.purple}33`} style={{ background: T.purpleSoft, height: 150 }}>
              <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 800, color: T.purple }}>
                显式转换
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 8, lineHeight: 1.5 }}>
                用 (type) 指定目标，编译器不拦风险
              </div>
            </Panel>
          </FadeUp>
        </div>

        <FadeUp delay={t(3) + 6}>
          <div
            style={{
              width: W,
              background: "#151A21",
              borderRadius: 14,
              padding: "16px 24px",
              boxShadow: "0 14px 30px rgba(20,26,34,0.18)",
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: 25, color: "#D7DEE8" }}>
              <span style={{ color: "#FFD479" }}>if</span> (-1 &lt; 0u){" "}
              <span style={{ color: "#6E7B8B" }}>// false ！</span>
            </div>
            <div style={{ fontFamily: T.cn, fontSize: 21, color: "#FF8A80", marginTop: 8 }}>
              −1 被转成无符号 → 4294967295，比任何正数都大
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={t(5)}>
          <Callout color={T.red} delay={t(5)} style={{ width: W, padding: "12px 20px" }}>
            <span style={{ fontSize: 23 }}>
              隐式规则不是「往精度高转」，有符号遇无符号也要让位
            </span>
          </Callout>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S14 · 收尾 ====================

const SummaryCol: React.FC<{
  no: string;
  title: string;
  color: string;
  bg: string;
  items: string[];
  delay: number;
}> = ({ no, title, color, bg, items, delay }) => (
  <FadeUp delay={delay} style={{ flex: 1 }}>
    <Panel pad={22} accent={`${color}44`} style={{ height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: bg,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: T.mono,
            fontSize: 19,
            fontWeight: 800,
          }}
        >
          {no}
        </div>
        <div style={{ fontFamily: T.cn, fontSize: 27, fontWeight: 800, color: T.ink }}>{title}</div>
      </div>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 10,
            fontFamily: T.cn,
            fontSize: 20,
            color: T.ink2,
            lineHeight: 1.45,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: 3, background: color, marginTop: 10, flexShrink: 0 }} />
          <div>{it}</div>
        </div>
      ))}
    </Panel>
  </FadeUp>
);

export const S14: React.FC = () => {
  const t = (i: number) => cueAt("s14", i);

  return (
    <Scene id="s14" no="14" title="这一期的抓手" en="TAKEAWAYS">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 18, width: W }}>
          <SummaryCol
            no="01"
            title="运算电路"
            color={T.blue}
            bg={T.blueSoft}
            delay={t(1)}
            items={[
              "半加器 = XOR + AND，两输入",
              "全加器 = 三输入多数门，带 Cin",
              "n 位 = n 个 FA 串联，行波进位",
              "减法 = 取反加一（B ⊕ Sub，Cin = Sub）",
              "乘法 = 移位相加；除法 = 移位试减",
            ]}
          />
          <SummaryCol
            no="02"
            title="类型转换"
            color={T.green}
            bg={T.greenSoft}
            delay={t(4)}
            items={[
              "同宽度互转：位不动，只换解释",
              "负数转无符号 = 加 2ⁿ，值会突变",
              "短转长符号扩展，长转短高位截断",
              "整型超 2²⁴ 转 float 会丢低位",
              "无符号参与比较，最容易被坑",
            ]}
          />
        </div>

        <FadeUp delay={t(3)} style={{ width: W }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: T.ink,
              borderRadius: 16,
              padding: "22px 28px",
              width: W,
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: "#7FB2FF" }}>
              OF
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: "#FFF" }}>
              = Cout ⊕ C(n−1)
            </div>
            <div style={{ width: 2, height: 36, background: "#39424F" }} />
            <div style={{ fontFamily: T.cn, fontSize: 22, color: "#C9D3E0" }}>
              最高位进位异或次高位进位
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={t(6)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <Chip color={T.blue} bg={T.blueSoft} size={22}>
              408 · 计算机组成原理
            </Chip>
            <CN size={22} color={T.faint}>
              数据的表示 · 运算与转换
            </CN>
          </div>
        </FadeUp>
      </div>
    </Scene>
  );
};
