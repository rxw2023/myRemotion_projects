import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import {
  FadeIn,
  SlideUp,
  WhiteCard,
  SubtitleBar,
  SHARED_COLORS,
} from "../shared/components";

const C = SHARED_COLORS;

// ==================== 字幕文本 ====================
const SUBTITLES: Record<string, string> = {
  title:
    "主存工作原理。从DRAM芯片的1T1C结构，到多体交叉存储的流水线并行，让我们一起揭开计算机内存的奥秘。",
  dram:
    "DRAM动态随机存取存储器，采用1T1C结构，一个晶体管加一个电容存储一位数据。电容会漏电，所以需要定期刷新。三种刷新方式：集中刷新暂停访问集中完成，分散刷新穿插在存取周期中，异步刷新由外部控制器按需触发。",
  interleave:
    "多体交叉存储，将主存分成多个独立的存储体。高位交叉编址，高位选体、低位选体内地址，连续地址在同一体内，只能串行工作。低位交叉编址，低位选体、高位选体内地址，连续地址分布在不同体中，可以并行工作，大幅提升带宽。",
  pipeline:
    "低位交叉存储的流水线工作方式。假设存储周期为T，有n个存储体，则最小连续访问间隔为T除以n。读取操作分为三个阶段：发送地址、存储体读取数据、传输数据到总线。前一体的读取阶段与后一体的地址发送阶段重叠执行，实现流水线并行。",
  expand:
    "主存容量扩展有三种方式。位扩展扩展字长，多片芯片并联共享地址线。字扩展扩展字数，高位地址线经译码器选片。字位同时扩展，结合两种方法。位扩展对应低位交叉编址，字扩展对应高位交叉编址。",
  outro:
    "感谢观看。DRAM存储原理、多体交叉存储、容量扩展技术，内存工作原理的核心知识点。点赞收藏关注，我们下期再见。",
};

// ==================== 场景时长（TTS + buffer） ====================
const DURATIONS = {
  title: 335,    // TTS 291f + 44f
  dram: 650,     // TTS 608f + 42f
  interleave: 640,  // TTS 595f + 45f
  pipeline: 730, // TTS 690f + 40f
  expand: 640,   // TTS 594f + 46f
  outro: 370,    // TTS 329f + 41f
};

// ==================== 场景1：标题开场 ====================
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });
  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
      }}
    >
      <Audio src={staticFile("memory-organization/scene1_title.mp3")} />
      <SubtitleBar text={SUBTITLES.title} startFrame={0} endFrame={DURATIONS.title} />

      {/* 装饰圆点 */}
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.4 }}>
        {Array.from({ length: 30 }, (_, i) => {
          const x = (i * 137 + 50) % 100;
          const y = (i * 89 + 30) % 100;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: 3 + (i % 4),
                height: 3 + (i % 4),
                borderRadius: "50%",
                backgroundColor: i % 3 === 0 ? C.accent : C.accent2,
                opacity: 0.15 + (i % 5) * 0.06,
              }}
            />
          );
        })}
      </div>

      <FadeIn delay={5}>
        <div
          style={{
            padding: "10px 32px",
            borderRadius: 24,
            border: `1.5px solid ${C.accent}40`,
            backgroundColor: `${C.accent}08`,
            marginBottom: 36,
          }}
        >
          <span style={{ color: C.accent, fontSize: 24, fontWeight: 500, letterSpacing: 4 }}>
            计算机体系结构
          </span>
        </div>
      </FadeIn>

      <div
        style={{
          fontSize: 76,
          fontWeight: "bold",
          color: C.accent,
          transform: `scale(${titleScale})`,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: 6,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        主存工作<br />原理
      </div>

      <div
        style={{
          fontSize: 28,
          color: C.textMid,
          marginTop: 28,
          opacity: subtitleOpacity,
          letterSpacing: 3,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        DRAM芯片 · 多体交叉存储 · 容量扩展
      </div>

      <div
        style={{
          width: 100,
          height: 3,
          backgroundColor: C.accent,
          marginTop: 24,
          opacity: subtitleOpacity,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

// ==================== 场景2：DRAM 存储原理 ====================
const DRAMScene: React.FC = () => {
  const frame = useCurrentFrame();

  const refreshMethods = [
    { name: "集中刷新", en: "Burst Refresh", desc: "暂停访问，集中完成所有行刷新", pros: "效率高", cons: "延迟大", color: C.accent2, delay: 12 },
    { name: "分散刷新", en: "Distributed", desc: "刷新操作均匀分散到存取周期中", pros: "延迟低", cons: "控制复杂", color: C.accent3, delay: 18 },
    { name: "异步刷新", en: "Asynchronous", desc: "外部控制器按需触发刷新", pros: "最灵活", cons: "依赖控制器", color: C.accent5, delay: 24 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 40px",
      }}
    >
      <Audio src={staticFile("memory-organization/scene2_dram.mp3")} />
      <SubtitleBar text={SUBTITLES.dram} startFrame={0} endFrame={DURATIONS.dram} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          DRAM 存储原理
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 21, marginBottom: 20, letterSpacing: 2, textAlign: "center" }}>
          Dynamic Random-Access Memory · 1T1C 结构
        </p>
      </SlideUp>

      {/* 1T1C 结构卡片 */}
      <FadeIn delay={6}>
        <WhiteCard style={{ maxWidth: 780, marginBottom: 16, borderTop: `4px solid ${C.accent}` }}>
          <h3 style={{ color: C.accent, fontSize: 22, margin: "0 0 10px 0", textAlign: "center" }}>1T1C 存储单元</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 42, fontWeight: "bold", color: C.accent4 }}>1T</div>
              <div style={{ fontSize: 16, color: C.textDim }}>晶体管（开关）</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 28, color: C.textDim }}>+</div>
            <div>
              <div style={{ fontSize: 42, fontWeight: "bold", color: C.accent2 }}>1C</div>
              <div style={{ fontSize: 16, color: C.textDim }}>电容（存储电荷）</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 28, color: C.textDim }}>→</div>
            <div>
              <div style={{ fontSize: 42, fontWeight: "bold", color: C.accent }}>1bit</div>
              <div style={{ fontSize: 16, color: C.textDim }}>每单元存储</div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: "10px 16px", background: `${C.accent3}10`, borderRadius: 10, border: `1px solid ${C.accent3}25`, textAlign: "center" }}>
            <span style={{ color: C.accent3, fontSize: 18, fontWeight: "bold" }}>⚡ 电容漏电 → 必须定期刷新 → "动态"的含义</span>
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 三种刷新方式 */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 820 }}>
        {refreshMethods.map((m) => {
          const op = interpolate(frame, [m.delay, m.delay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={m.name} style={{ opacity: op, flex: 1 }}>
              <WhiteCard style={{ padding: "14px 16px", borderTop: `3px solid ${m.color}` }}>
                <h4 style={{ color: m.color, fontSize: 20, margin: "0 0 2px 0", textAlign: "center" }}>{m.name}</h4>
                <p style={{ color: C.textDim, fontSize: 14, margin: "0 0 8px 0", textAlign: "center" }}>{m.en}</p>
                <p style={{ color: C.text, fontSize: 16, margin: "0 0 8px 0", textAlign: "center", lineHeight: 1.5 }}>{m.desc}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 14 }}>
                  <span style={{ color: C.accent2 }}>✓ {m.pros}</span>
                  <span style={{ color: C.accent4 }}>✗ {m.cons}</span>
                </div>
              </WhiteCard>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景3：多体交叉存储 ====================
const InterleaveScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 40px",
      }}
    >
      <Audio src={staticFile("memory-organization/scene3_interleave.mp3")} />
      <SubtitleBar text={SUBTITLES.interleave} startFrame={0} endFrame={DURATIONS.interleave} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          多体交叉存储
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 21, marginBottom: 20, letterSpacing: 2, textAlign: "center" }}>
          Multi-Body Interleaved Memory · 高位 vs 低位编址
        </p>
      </SlideUp>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 880, alignItems: "center" }}>
        {/* 高位交叉编址 */}
        <FadeIn delay={8} style={{ flex: 1 }}>
          <WhiteCard style={{ borderTop: `4px solid ${C.accent4}`, padding: "16px 20px" }}>
            <h3 style={{ color: C.accent4, fontSize: 24, margin: "0 0 4px 0", textAlign: "center" }}>高位交叉编址</h3>
            <p style={{ color: C.textDim, fontSize: 16, margin: "0 0 12px 0", textAlign: "center" }}>高位选体 · 低位选体内地址</p>
            {/* 地址分布示意 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { bank: "M0", addrs: "0 → n-1", color: C.accent4 },
                { bank: "M1", addrs: "n → 2n-1", color: C.accent3 },
                { bank: "M2", addrs: "2n → 3n-1", color: C.accent },
                { bank: "M3", addrs: "3n → 4n-1", color: C.accent2 },
              ].map((b, i) => {
                const progress = interpolate(frame, [10 + i * 4, 16 + i * 4], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={b.bank}
                    style={{
                      opacity: progress,
                      transform: `scaleX(${Math.min(1, progress)})`,
                      background: `${b.color}12`,
                      border: `1.5px solid ${b.color}40`,
                      borderRadius: 6,
                      padding: "6px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: b.color, fontWeight: "bold", fontSize: 16 }}>{b.bank}</span>
                    <span style={{ color: C.textMid, fontSize: 16 }}>{b.addrs}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, padding: "8px", background: `${C.accent4}10`, borderRadius: 8, textAlign: "center" }}>
              <span style={{ color: C.accent4, fontSize: 17, fontWeight: "bold" }}>串行工作 · 带宽不提升</span>
            </div>
          </WhiteCard>
        </FadeIn>

        {/* VS divider */}
        <FadeIn delay={14} style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: "bold", color: "#FFFFFF",
            }}>VS</div>
          </div>
        </FadeIn>

        {/* 低位交叉编址 */}
        <FadeIn delay={14} style={{ flex: 1 }}>
          <WhiteCard style={{ borderTop: `4px solid ${C.accent2}`, padding: "16px 20px" }}>
            <h3 style={{ color: C.accent2, fontSize: 24, margin: "0 0 4px 0", textAlign: "center" }}>低位交叉编址</h3>
            <p style={{ color: C.textDim, fontSize: 16, margin: "0 0 12px 0", textAlign: "center" }}>低位选体 · 高位选体内地址</p>
            {/* 地址分布示意 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { banks: ["M0", "M1", "M2", "M3"], colors: [C.accent2, C.accent3, C.accent, C.accent5] },
              ].map((group, gi) =>
                Array.from({ length: 4 }, (_, row) => {
                  const progress = interpolate(frame, [16 + row * 4, 22 + row * 4], [0, 1], {
                    extrapolateLeft: "clamp", extrapolateRight: "clamp",
                  });
                  const addr = row * 4;
                  return (
                    <div
                      key={row}
                      style={{
                        opacity: progress,
                        display: "flex",
                        gap: 4,
                        padding: "4px 8px",
                        background: `${C.bgCard2}`,
                        borderRadius: 6,
                        justifyContent: "space-between",
                      }}
                    >
                      {group.banks.map((bank, bi) => (
                        <span key={bank} style={{ color: group.colors[bi], fontWeight: "bold", fontSize: 16 }}>
                          {bank}:{addr + bi}
                        </span>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ marginTop: 12, padding: "8px", background: `${C.accent2}10`, borderRadius: 8, textAlign: "center" }}>
              <span style={{ color: C.accent2, fontSize: 17, fontWeight: "bold" }}>并行工作 · 带宽提升 n 倍</span>
            </div>
          </WhiteCard>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景4：流水线并行 ====================
const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formulaScale = spring({ frame: frame - 10, fps, config: { damping: 15 } });

  // Pipeline stages visualization
  const stages = [
    { id: "P1", label: "发送地址", color: C.accent4, desc: "地址→AR" },
    { id: "P2", label: "存储体读取", color: C.accent3, desc: "存储周期 T" },
    { id: "P3", label: "传输数据", color: C.accent2, desc: "DR→总线" },
  ];

  // Show 4 banks pipeline timing
  const banks = ["M0", "M1", "M2", "M3"];
  const bankColors = [C.accent, C.accent2, C.accent3, C.accent5];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 36px",
      }}
    >
      <Audio src={staticFile("memory-organization/scene4_pipeline.mp3")} />
      <SubtitleBar text={SUBTITLES.pipeline} startFrame={0} endFrame={DURATIONS.pipeline} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 42, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          流水线并行访问
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 16, letterSpacing: 2, textAlign: "center" }}>
          Pipeline — 访问阶段重叠执行
        </p>
      </SlideUp>

      {/* T/n 公式 */}
      <FadeIn delay={8}>
        <WhiteCard style={{ maxWidth: 780, marginBottom: 16, padding: "16px 32px", textAlign: "center" }}>
          <div style={{
            fontSize: 28,
            fontWeight: "bold",
            color: C.accent,
            transform: `scale(${formulaScale})`,
            fontFamily: "monospace",
            letterSpacing: 2,
          }}>
            最小连续访问间隔 = T / n
          </div>
          <div style={{ color: C.textMid, fontSize: 17, marginTop: 6 }}>
            T = 存储周期 &nbsp;|&nbsp; n = 存储体数 &nbsp;|&nbsp; 例：8体交叉 → T/8
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 流水线阶段说明 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {stages.map((s, i) => {
          const op = interpolate(frame, [12 + i * 5, 18 + i * 5], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={s.id} style={{ opacity: op, textAlign: "center" }}>
              <div style={{
                width: 100, height: 52,
                background: `${s.color}12`,
                border: `2px solid ${s.color}40`,
                borderRadius: 10,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: s.color, fontSize: 20, fontWeight: "bold" }}>{s.id}</span>
                <span style={{ color: C.textDim, fontSize: 13 }}>{s.desc}</span>
              </div>
              {i < stages.length - 1 && (
                <span style={{ color: C.textDim, fontSize: 20, margin: "0 4px" }}>→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 流水线时序图 - 4 banks */}
      <FadeIn delay={20}>
        <WhiteCard style={{ maxWidth: 820, padding: "14px 20px" }}>
          <h4 style={{ color: C.text, fontSize: 17, margin: "0 0 10px 0", textAlign: "center" }}>
            4体低位交叉 — 访问阶段重叠示意
          </h4>
          {/* Timeline header */}
          <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
            <div style={{ width: 48 }} />
            {Array.from({ length: 13 }, (_, t) => (
              <div key={t} style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.textDim }}>
                {t}t
              </div>
            ))}
          </div>
          {/* Each bank row */}
          {banks.map((bank, bi) => {
            const rowStart = 22 + bi * 5;
            const rowOp = interpolate(frame, [rowStart, rowStart + 6], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            // For each bank, show P1 at t=bi, P2 at t=bi+1 to bi+4, P3 at t=bi+5
            const p1Start = bi;
            return (
              <div key={bank} style={{ display: "flex", gap: 2, marginBottom: 3, opacity: rowOp, alignItems: "center" }}>
                <span style={{ width: 48, fontSize: 14, fontWeight: "bold", color: bankColors[bi] }}>{bank}</span>
                {/* P1 block */}
                <div style={{
                  marginLeft: p1Start * (100 / 13) + "%",
                  width: (100 / 13) + "%",
                  height: 22, borderRadius: 4,
                  background: `${C.accent4}A0`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>P1</span>
                </div>
                {/* P2 block (4t wide) */}
                <div style={{
                  width: (400 / 13) + "%",
                  height: 22, borderRadius: 4,
                  background: `${C.accent3}90`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>P2 (T=4t)</span>
                </div>
                {/* P3 block */}
                <div style={{
                  width: (100 / 13) + "%",
                  height: 22, borderRadius: 4,
                  background: `${C.accent2}A0`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>P3</span>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 8, textAlign: "center", color: C.accent, fontSize: 16, fontWeight: "bold" }}>
            前一体的 P2 与后一体的 P1 重叠执行 → 吞吐量提升
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景5：主存容量扩展 ====================
const ExpandScene: React.FC = () => {
  const frame = useCurrentFrame();

  const methods = [
    {
      name: "位扩展", en: "Bit Expansion",
      example: "4×16K×8 → 16K×32",
      desc: "扩展字长，多片芯片并联，共享地址线",
      chips: "芯片数 = (16K×32)/(16K×8) = 4",
      note: "A0-A1 闲置，用于字长扩展",
      relation: "对应 低位交叉编址",
      color: C.accent2, delay: 8,
    },
    {
      name: "字扩展", en: "Word Expansion",
      example: "4×16K×8 → 64K×8",
      desc: "扩展字数，高位地址线译码选片",
      chips: "芯片数 = (64K×8)/(16K×8) = 4",
      note: "A14-A15 → 2-4译码器 → 片选",
      relation: "对应 高位交叉编址",
      color: C.accent3, delay: 14,
    },
    {
      name: "字位扩展", en: "Bit-Word",
      example: "4×16K×8 → 32K×16",
      desc: "同时扩展字长和字数",
      chips: "芯片数 = (32K×16)/(16K×8) = 4",
      note: "A0 位扩展 · A15 片选",
      relation: "结合 高低位编址",
      color: C.accent5, delay: 20,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 36px",
      }}
    >
      <Audio src={staticFile("memory-organization/scene5_expand.mp3")} />
      <SubtitleBar text={SUBTITLES.expand} startFrame={0} endFrame={DURATIONS.expand} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 42, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          主存容量扩展
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 18, letterSpacing: 2, textAlign: "center" }}>
          位扩展 · 字扩展 · 字位同时扩展
        </p>
      </SlideUp>

      {/* Three method cards */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 900 }}>
        {methods.map((m) => {
          const op = interpolate(frame, [m.delay, m.delay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={m.name} style={{ opacity: op, flex: 1 }}>
              <WhiteCard style={{ padding: "14px 16px", borderTop: `4px solid ${m.color}` }}>
                <h3 style={{ color: m.color, fontSize: 22, margin: "0 0 2px 0", textAlign: "center" }}>{m.name}</h3>
                <p style={{ color: C.textDim, fontSize: 14, margin: "0 0 8px 0", textAlign: "center" }}>{m.en}</p>
                <div style={{ background: `${m.color}08`, borderRadius: 8, padding: "8px", marginBottom: 8, textAlign: "center" }}>
                  <span style={{ color: m.color, fontSize: 17, fontWeight: "bold", fontFamily: "monospace" }}>{m.example}</span>
                </div>
                <p style={{ color: C.text, fontSize: 16, margin: "0 0 6px 0", lineHeight: 1.5, textAlign: "center" }}>{m.desc}</p>
                <div style={{ fontSize: 15, color: C.textMid, marginBottom: 4, textAlign: "center" }}>
                  {m.chips}
                </div>
                <div style={{ fontSize: 14, color: C.textDim, marginBottom: 4, textAlign: "center" }}>
                  {m.note}
                </div>
                <div style={{ padding: "6px", background: `${C.accent}08`, borderRadius: 6, border: `1px solid ${C.accent}20`, textAlign: "center" }}>
                  <span style={{ color: C.accent, fontSize: 15, fontWeight: "bold" }}>{m.relation}</span>
                </div>
              </WhiteCard>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <FadeIn delay={28}>
        <WhiteCard style={{ maxWidth: 820, marginTop: 14, padding: "12px 28px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", textAlign: "center" }}>
            <div>
              <span style={{ color: C.accent2, fontWeight: "bold", fontSize: 17 }}>位扩展 ↔ 低位交叉编址</span>
              <p style={{ color: C.textDim, fontSize: 15, margin: "2px 0 0" }}>不要求位数扩展</p>
            </div>
            <div style={{ width: 1, background: C.border }} />
            <div>
              <span style={{ color: C.accent3, fontWeight: "bold", fontSize: 17 }}>字扩展 ↔ 高位交叉编址</span>
              <p style={{ color: C.textDim, fontSize: 15, margin: "2px 0 0" }}>自然对应关系</p>
            </div>
            <div style={{ width: 1, background: C.border }} />
            <div>
              <span style={{ color: C.accent5, fontWeight: "bold", fontSize: 17 }}>字位扩展 ↔ 高低位结合</span>
              <p style={{ color: C.textDim, fontSize: 15, margin: "2px 0 0" }}>综合应用</p>
            </div>
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景6：结尾 ====================
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });

  const tags = ["DRAM", "1T1C", "多体交叉", "高位编址", "低位编址", "流水线", "位扩展", "字扩展"];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
      }}
    >
      <Audio src={staticFile("memory-organization/scene6_outro.mp3")} />
      <SubtitleBar text={SUBTITLES.outro} startFrame={0} endFrame={DURATIONS.outro} />

      <div
        style={{
          fontSize: 64,
          fontWeight: "bold",
          color: C.accent,
          transform: `scale(${scale})`,
          letterSpacing: 6,
          textAlign: "center",
        }}
      >
        谢谢观看
      </div>

      <FadeIn delay={20}>
        <div style={{ marginTop: 28, fontSize: 28, color: C.textMid, letterSpacing: 3, textAlign: "center" }}>
          内存工作原理 · 核心知识点梳理
        </div>
      </FadeIn>

      <FadeIn delay={35}>
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 600 }}>
          {tags.map((tag) => (
            <span key={tag} style={{ color: C.accent, fontSize: 17, padding: "7px 18px", borderRadius: 20, border: `1.5px solid ${C.accent}40`, backgroundColor: `${C.accent}08` }}>{tag}</span>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={50}>
        <div style={{ marginTop: 28, color: C.textMid, fontSize: 22, letterSpacing: 3, textAlign: "center" }}>
          点赞 · 收藏 · 关注
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 主视频组件 ====================
export const MemoryOrganization: React.FC = () => {
  return (
    <>
      {/* BGM */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.08} loop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.dram}>
          <DRAMScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.interleave}>
          <InterleaveScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.pipeline}>
          <PipelineScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.expand}>
          <ExpandScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
