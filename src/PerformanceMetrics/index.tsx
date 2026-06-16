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

// ==================== 配色 ====================
const C = {
  bg: "#F8F9FC",
  bgCard: "#FFFFFF",
  bgCard2: "#F0F2F8",
  bgCard3: "#EEF2FF",
  accent: "#2563EB",
  accent2: "#059669",
  accent3: "#D97706",
  accent4: "#DC2626",
  accent5: "#7C3AED",
  text: "#1F2937",
  textDim: "#9CA3AF",
  textMid: "#6B7280",
  border: "#E5E7EB",
  shadow: "0 2px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 4px 24px rgba(0,0,0,0.08)",
};

// ==================== 时长配置（TTS 实际帧数 + 30f 缓冲） ====================
const DURATIONS = {
  title: 322,     // 9.74s → 292f + 30f
  scene1: 751,    // 24.05s → 721f + 30f
  scene2: 788,    // 25.30s → 758f + 30f
  scene3: 647,    // 20.59s → 617f + 30f
  scene4: 896,    // 28.90s → 866f + 30f
  scene5: 566,    // 17.88s → 536f + 30f
};

// 转场帧数：fade(6) + slide(8) + fade(6) + slide(8) + fade(6) = 34
// 总帧数 = sum(DURATIONS) - 每个转场都会减少overlap
// 实际 Remotion 计算：scene1 + transition + scene2 = scene1 + scene2 - transitionFrames
const TRANSITION_FADE = 6;
const TRANSITION_SLIDE = 8;
// TOTAL = D.title + D.s1 + D.s2 + D.s3 + D.s4 + D.s5 - (5个转场帧数之和)
// = 322+751+788+647+896+566 - (6+8+6+8+6) = 3970 - 34 = 3936
export const TOTAL_FRAMES = 3936;

// ==================== 字幕文本（与 TTS 完全一致） ====================
const SUBTITLE_TEXTS: Record<string, string> = {
  title: "本节课我们来学习计算机性能指标。性能是衡量计算机好坏的核心标准，理解这些指标，才能真正读懂芯片参数。",
  scene1: "首先是时钟周期，它是中央处理器执行指令的最基本时间单位。计算机内部的晶体振荡器利用压电效应产生规律的脉冲信号，连续两个脉冲之间的间隔就是时钟周期。主频与时钟周期互为倒数——主频越高，时钟周期越短，处理器速度越快。三吉赫的处理器每秒完成三十亿个时钟周期。",
  scene2: "了解主频之后，我们再看四个执行效率指标。每周期时钟数，也叫西皮爱，表示执行一条指令平均需要多少个时钟周期；它的倒数叫每周期指令数。每秒指令数等于主频除以每周期时钟数，反映处理器每秒能跑多少条指令。当这个数值达到百万级别，就用每秒百万指令数来衡量，也就是常说的米普斯。",
  scene3: "对于图形处理器和人工智能芯片，我们用每秒浮点运算次数来衡量性能，简称弗洛普斯。从百万级到十亿级、万亿级，每升一级就是一千倍的提升。现代超算已经突破千万亿次每秒量级，而最新的人工智能加速器正在向百亿亿次每秒冲击。",
  scene4: "字长是处理器一次操作能处理的二进制位数，常见的有三十二位和六十四位。数据通路带宽决定处理器与内存之间每个时钟周期能传多少位数据。主存容量则和地址寄存器的位数直接相关，地址空间越大，需要的地址寄存器位数越多。以一百二十八千字节、按字寻址为例，可寻址范围是六万五千五百三十六，对应的地址寄存器位数就是十六位。",
  scene5: "最后来记住几个核心公式。主频等于一除以时钟周期；每周期指令数等于一除以每周期时钟数；每秒指令数等于主频除以每周期时钟数。这三个公式贯穿整章，考研选择题和解答题都会用到，一定要熟记。",
};

// ==================== 可复用组件 ====================

const FadeIn: React.FC<{
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 12], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>
      {children}
    </div>
  );
};

const SlideUp: React.FC<{
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 14], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>
      {children}
    </div>
  );
};

const WhiteCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "24px 32px",
      boxShadow: C.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

const SubtitleBar: React.FC<{
  sceneKey: string;
  endFrame?: number;
}> = ({ sceneKey, endFrame = 9999 }) => {
  const frame = useCurrentFrame();
  const text = SUBTITLE_TEXTS[sceneKey] || "";
  const opacity = interpolate(
    frame,
    [0, 10, endFrame - 5, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div
      style={{
        position: "absolute",
        bottom: 56,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
        opacity,
        padding: "0 24px",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          borderRadius: 14,
          padding: "14px 36px",
          maxWidth: "90%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: 1.2,
            lineHeight: 1.6,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// 标签徽章
const Badge: React.FC<{
  text: string;
  color?: string;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ text, color = C.accent, bg = C.bgCard3, style }) => (
  <span
    style={{
      display: "inline-block",
      background: bg,
      color,
      border: `1.5px solid ${color}`,
      borderRadius: 8,
      padding: "4px 14px",
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: 1,
      ...style,
    }}
  >
    {text}
  </span>
);

// 公式块
const FormulaBlock: React.FC<{
  left: string;
  right: string;
  color?: string;
  style?: React.CSSProperties;
}> = ({ left, right, color = C.accent, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      background: C.bgCard3,
      borderRadius: 12,
      padding: "16px 28px",
      border: `1.5px solid ${color}`,
      ...style,
    }}
  >
    <span style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{left}</span>
    <span style={{ fontSize: 22, color: C.textMid }}>=</span>
    <span style={{ fontSize: 26, fontWeight: 700, color }}>{right}</span>
  </div>
);

// ==================== 场景1：标题 ====================
const TitleScene: React.FC = () => {
  
  
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 180 },
  });
  const subtitleOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagOpacity = interpolate(frame, [40, 55], [0, 1], {
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
        padding: "60px 48px",
      }}
    >
      <Audio src={staticFile("performance-metrics/perf_title.mp3")} />
      <SubtitleBar sceneKey="title" endFrame={DURATIONS.title - 5} />

      {/* 顶部装饰线 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${C.accent}, ${C.accent5})`,
        }}
      />

      {/* 章节标签 */}
      <div style={{ opacity: tagOpacity, marginBottom: 32 }}>
        <span
          style={{
            background: C.bgCard3,
            color: C.accent,
            border: `1.5px solid ${C.accent}`,
            borderRadius: 20,
            padding: "8px 28px",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          计算机组成原理 · 第一章
        </span>
      </div>

      {/* 主标题 */}
      <div style={{ transform: `scale(${titleScale})`, textAlign: "center", marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: C.text,
            margin: 0,
            letterSpacing: 4,
            lineHeight: 1.2,
          }}
        >
          计算机
          <br />
          <span style={{ color: C.accent }}>性能指标</span>
        </h1>
      </div>

      {/* 副标题 */}
      <div style={{ opacity: subtitleOpacity, textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontSize: 30, color: C.textMid, margin: 0, letterSpacing: 2 }}>
          Performance Metrics
        </p>
      </div>

      {/* 知识点预览 */}
      <FadeIn delay={50} style={{ width: "100%" }}>
        <WhiteCard style={{ padding: "28px 36px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "时钟周期 & 主频",
              "CPI / IPC / IPS / MIPS",
              "FLOPS 浮点运算性能",
              "字长 & 主存容量 & MAR",
              "核心公式汇总",
            ].map((item, i) => (
              <FadeIn key={i} delay={55 + i * 8}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: C.accent,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 28, color: C.text, fontWeight: 500 }}>{item}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 底部提示 */}
      <FadeIn delay={90} style={{ marginTop: 32, textAlign: "center" }}>
        <p style={{ fontSize: 22, color: C.textDim, letterSpacing: 1 }}>
          408 考研高频考点 · 重点掌握
        </p>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景2：时钟周期 & 主频 ====================
const ClockScene: React.FC = () => {
  
  

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 48px",
        gap: 28,
      }}
    >
      <Audio src={staticFile("performance-metrics/perf_scene1.mp3")} />
      <SubtitleBar sceneKey="scene1" endFrame={DURATIONS.scene1 - 5} />

      {/* 顶部装饰 */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${C.accent}, ${C.accent5})` }} />

      {/* 场景标题 */}
      <SlideUp delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 6, height: 52, background: C.accent, borderRadius: 3 }} />
          <h2 style={{ fontSize: 52, fontWeight: 900, color: C.text, margin: 0 }}>
            时钟周期 & 主频
          </h2>
        </div>
      </SlideUp>

      {/* 时钟周期卡片 */}
      <FadeIn delay={20} style={{ width: "100%" }}>
        <WhiteCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Badge text="时钟周期" color={C.accent} />
              <span style={{ fontSize: 22, color: C.textMid }}>Clock Cycle</span>
            </div>
            <p style={{ fontSize: 26, color: C.text, margin: 0, lineHeight: 1.6 }}>
              CPU 执行指令的<strong style={{ color: C.accent }}>最基本时间单位</strong>
            </p>
            <div style={{
              background: C.bgCard2,
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 22,
              color: C.textMid,
              lineHeight: 1.6,
            }}>
              晶体振荡器 → 压电效应 → 脉冲信号 → 连续两脉冲间隔 = 时钟周期
            </div>
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 主频卡片 */}
      <FadeIn delay={40} style={{ width: "100%" }}>
        <WhiteCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Badge text="主频" color={C.accent2} bg="#ECFDF5" />
              <span style={{ fontSize: 22, color: C.textMid }}>CPU Frequency</span>
            </div>
            <p style={{ fontSize: 26, color: C.text, margin: 0 }}>
              CPU 每秒执行的时钟周期数
            </p>
            {/* 互为倒数关系 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              background: C.bgCard3,
              borderRadius: 12,
              padding: "16px 24px",
              border: `1.5px solid ${C.accent}`,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, color: C.textMid, marginBottom: 4 }}>主频</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.accent }}>f</div>
              </div>
              <div style={{ fontSize: 36, color: C.textDim }}>⇌</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, color: C.textMid, marginBottom: 4 }}>时钟周期</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.accent5 }}>T</div>
              </div>
              <div style={{ fontSize: 22, color: C.textMid }}>互为倒数</div>
            </div>
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 单位对照表 */}
      <FadeIn delay={65} style={{ width: "100%" }}>
        <WhiteCard style={{ padding: "20px 32px" }}>
          <p style={{ fontSize: 22, color: C.textMid, margin: "0 0 12px 0", fontWeight: 600 }}>频率单位</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { unit: "MHz", def: "10⁶ 次/秒", note: "兆赫" },
              { unit: "GHz", def: "10⁹ 次/秒", note: "吉赫" },
              { unit: "3 GHz", def: "30亿周期/秒", note: "典型处理器" },
            ].map((row, i) => (
              <FadeIn key={i} delay={70 + i * 8}>
                <div style={{
                  background: C.bgCard2,
                  borderRadius: 10,
                  padding: "12px 16px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, marginBottom: 4 }}>{row.unit}</div>
                  <div style={{ fontSize: 20, color: C.text }}>{row.def}</div>
                  <div style={{ fontSize: 18, color: C.textMid }}>{row.note}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 公式 */}
      <FadeIn delay={90} style={{ width: "100%" }}>
        <FormulaBlock left="f（主频）" right="1 ÷ T（时钟周期）" />
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景3：CPI / IPC / IPS / MIPS ====================
const ExecutionScene: React.FC = () => {
  

  const metrics = [
    {
      abbr: "CPI",
      name: "每周期时钟数",
      en: "Cycles Per Instruction",
      desc: "执行一条指令所需平均时钟周期数",
      formula: "层级：时钟周期 < 机器周期 < 指令周期",
      color: C.accent,
    },
    {
      abbr: "IPC",
      name: "每周期指令数",
      en: "Instructions Per Cycle",
      desc: "CPI 的倒数，每周期能完成多少条指令",
      formula: "IPC = 1 ÷ CPI",
      color: C.accent2,
    },
    {
      abbr: "IPS",
      name: "每秒指令数",
      en: "Instructions Per Second",
      desc: "处理器每秒能执行的指令总数",
      formula: "IPS = 主频 ÷ CPI",
      color: C.accent3,
    },
    {
      abbr: "MIPS",
      name: "每秒百万指令数",
      en: "Million IPS",
      desc: "IPS 达到百万级时使用的单位",
      formula: "1 MIPS = 10⁶ IPS",
      color: C.accent4,
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
        padding: "60px 48px",
        gap: 24,
      }}
    >
      <Audio src={staticFile("performance-metrics/perf_scene2.mp3")} />
      <SubtitleBar sceneKey="scene2" endFrame={DURATIONS.scene2 - 5} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${C.accent}, ${C.accent5})` }} />

      <SlideUp delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 6, height: 52, background: C.accent2, borderRadius: 3 }} />
          <h2 style={{ fontSize: 48, fontWeight: 900, color: C.text, margin: 0 }}>
            四个执行效率指标
          </h2>
        </div>
      </SlideUp>

      {/* 四格指标卡片 */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        {metrics.map((m, i) => (
          <FadeIn key={i} delay={20 + i * 18}>
            <WhiteCard style={{ padding: "20px 28px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                {/* 缩写标签 */}
                <div style={{
                  background: `${m.color}18`,
                  border: `2px solid ${m.color}`,
                  borderRadius: 10,
                  padding: "8px 16px",
                  flexShrink: 0,
                  textAlign: "center",
                  minWidth: 88,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: m.color }}>{m.abbr}</div>
                  <div style={{ fontSize: 17, color: C.textMid }}>{m.name}</div>
                </div>
                {/* 内容 */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 22, color: C.textMid, margin: "0 0 4px 0" }}>{m.en}</p>
                  <p style={{ fontSize: 24, color: C.text, margin: "0 0 6px 0", fontWeight: 500 }}>{m.desc}</p>
                  <div style={{
                    background: C.bgCard2,
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 22,
                    color: m.color,
                    fontWeight: 600,
                  }}>
                    {m.formula}
                  </div>
                </div>
              </div>
            </WhiteCard>
          </FadeIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景4：FLOPS ====================
const FlopsScene: React.FC = () => {
  

  const levels = [
    { abbr: "MFLOPS", full: "Million FLOPS", val: "10⁶", color: C.accent },
    { abbr: "GFLOPS", full: "Giga FLOPS", val: "10⁹", color: C.accent2 },
    { abbr: "TFLOPS", full: "Tera FLOPS", val: "10¹²", color: C.accent3 },
    { abbr: "PFLOPS", full: "Peta FLOPS", val: "10¹⁵", color: C.accent4 },
    { abbr: "EFLOPS", full: "Exa FLOPS", val: "10¹⁸", color: C.accent5 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 48px",
        gap: 24,
      }}
    >
      <Audio src={staticFile("performance-metrics/perf_scene3.mp3")} />
      <SubtitleBar sceneKey="scene3" endFrame={DURATIONS.scene3 - 5} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${C.accent3}, ${C.accent4})` }} />

      <SlideUp delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 6, height: 52, background: C.accent3, borderRadius: 3 }} />
          <h2 style={{ fontSize: 48, fontWeight: 900, color: C.text, margin: 0 }}>
            FLOPS 浮点运算性能
          </h2>
        </div>
      </SlideUp>

      {/* 定义卡片 */}
      <FadeIn delay={15} style={{ width: "100%" }}>
        <WhiteCard>
          <p style={{ fontSize: 26, color: C.text, margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: C.accent3 }}>FLOPS</strong>：每秒浮点运算次数
            <br />
            <span style={{ color: C.textMid, fontSize: 22 }}>主要用于评估 GPU / AI 芯片 的计算能力</span>
          </p>
        </WhiteCard>
      </FadeIn>

      {/* 量级阶梯 */}
      <FadeIn delay={30} style={{ width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
          {/* 左侧垂直连接线 */}
          <div style={{
            position: "absolute",
            left: 40,
            top: 28,
            bottom: 28,
            width: 3,
            background: `linear-gradient(to bottom, ${C.accent}, ${C.accent5})`,
            borderRadius: 2,
          }} />

          {levels.map((lv, i) => (
            <FadeIn key={i} delay={35 + i * 12}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: i % 2 === 0 ? C.bgCard : C.bgCard2,
                borderRadius: 12,
                padding: "16px 24px",
                border: `1px solid ${C.border}`,
                marginBottom: 4,
              }}>
                {/* 节点圆圈 */}
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: lv.color,
                  flexShrink: 0,
                  marginLeft: 32,
                  boxShadow: `0 0 8px ${lv.color}66`,
                }} />
                {/* 缩写 */}
                <span style={{ fontSize: 26, fontWeight: 800, color: lv.color, minWidth: 100 }}>{lv.abbr}</span>
                {/* 全称 */}
                <span style={{ fontSize: 22, color: C.textMid, flex: 1 }}>{lv.full}</span>
                {/* 量级 */}
                <span style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: lv.color,
                  background: `${lv.color}12`,
                  borderRadius: 8,
                  padding: "4px 14px",
                }}>{lv.val}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </FadeIn>

      {/* 规律提示 */}
      <FadeIn delay={100} style={{ width: "100%" }}>
        <div style={{
          background: C.bgCard3,
          border: `1.5px solid ${C.accent}`,
          borderRadius: 12,
          padding: "16px 28px",
          textAlign: "center",
        }}>
          <span style={{ fontSize: 26, color: C.accent, fontWeight: 700 }}>
            规律：每升一级 = 1000 倍提升
          </span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景5：字长 & 主存容量 ====================
const WordLengthScene: React.FC = () => {
  

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 48px",
        gap: 24,
      }}
    >
      <Audio src={staticFile("performance-metrics/perf_scene4.mp3")} />
      <SubtitleBar sceneKey="scene4" endFrame={DURATIONS.scene4 - 5} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${C.accent2}, ${C.accent3})` }} />

      <SlideUp delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 6, height: 52, background: C.accent2, borderRadius: 3 }} />
          <h2 style={{ fontSize: 48, fontWeight: 900, color: C.text, margin: 0 }}>
            字长 & 主存容量
          </h2>
        </div>
      </SlideUp>

      {/* 字长 */}
      <FadeIn delay={18} style={{ width: "100%" }}>
        <WhiteCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Badge text="字长" color={C.accent2} bg="#ECFDF5" />
              <span style={{ fontSize: 22, color: C.textMid }}>Word Length</span>
            </div>
            <p style={{ fontSize: 26, color: C.text, margin: 0, lineHeight: 1.6 }}>
              CPU 一次操作处理的<strong style={{ color: C.accent2 }}>二进制位数</strong>
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              {["32 位 CPU", "64 位 CPU"].map((t, i) => (
                <div key={i} style={{
                  flex: 1,
                  background: C.bgCard2,
                  borderRadius: 10,
                  padding: "12px 16px",
                  textAlign: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.accent2,
                }}>{t}</div>
              ))}
            </div>
            <div style={{ fontSize: 22, color: C.textMid, background: C.bgCard2, borderRadius: 8, padding: "10px 16px" }}>
              数据通路带宽：64 位总线 → 每周期传 64 位数据
            </div>
          </div>
        </WhiteCard>
      </FadeIn>

      {/* MAR 卡片 */}
      <FadeIn delay={40} style={{ width: "100%" }}>
        <WhiteCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Badge text="MAR" color={C.accent3} bg="#FFFBEB" />
              <span style={{ fontSize: 22, color: C.textMid }}>存储器地址寄存器</span>
            </div>
            <p style={{ fontSize: 24, color: C.text, margin: 0, lineHeight: 1.6 }}>
              MAR 位数反映<strong style={{ color: C.accent3 }}>可寻址范围</strong>，与地址总线位数一致
            </p>
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 例题 */}
      <FadeIn delay={60} style={{ width: "100%" }}>
        <WhiteCard style={{ background: "#FFFBEB", borderColor: C.accent3 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.accent3 }}>典型例题</div>
            <div style={{ fontSize: 23, color: C.text, lineHeight: 1.7 }}>
              主存地址空间 128KB，字长 16位，<strong>按字寻址</strong>
            </div>
            <div style={{
              background: C.bgCard,
              borderRadius: 8,
              padding: "12px 20px",
              borderLeft: `4px solid ${C.accent3}`,
            }}>
              <p style={{ fontSize: 22, color: C.text, margin: "0 0 6px 0" }}>
                可寻址范围 = 128KB ÷ 2B = 2¹⁷ ÷ 2¹ = <strong style={{ color: C.accent3 }}>2¹⁶ = 65536</strong>
              </p>
              <p style={{ fontSize: 24, color: C.accent3, margin: 0, fontWeight: 700 }}>
                → MAR 位数 = 16 位
              </p>
            </div>
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 公式 */}
      <FadeIn delay={85} style={{ width: "100%" }}>
        <FormulaBlock
          left="可寻址范围"
          right="内存空间 ÷ 寻址单位"
          color={C.accent3}
        />
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景6：核心公式汇总 ====================
const FormulaScene: React.FC = () => {
  
  

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formulas = [
    {
      label: "主频",
      formula: "f = 1 ÷ T",
      desc: "主频与时钟周期互为倒数",
      color: C.accent,
    },
    {
      label: "IPC",
      formula: "IPC = 1 ÷ CPI",
      desc: "每周期指令数是 CPI 的倒数",
      color: C.accent2,
    },
    {
      label: "IPS",
      formula: "IPS = 主频 ÷ CPI",
      desc: "每秒指令数 = 主频 / CPI",
      color: C.accent3,
    },
    {
      label: "MIPS",
      formula: "1 MIPS = 10⁶ IPS",
      desc: "百万级指令换算",
      color: C.accent4,
    },
    {
      label: "MAR",
      formula: "MAR位数 = log₂(空间÷单位)",
      desc: "地址寄存器位数计算",
      color: C.accent5,
    },
  ];

  const breathScale =
    1 + 0.02 * Math.sin((frame / fps) * 2 * Math.PI * 0.5);

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 48px",
        gap: 20,
      }}
    >
      <Audio src={staticFile("performance-metrics/perf_scene5.mp3")} />
      <SubtitleBar sceneKey="scene5" endFrame={DURATIONS.scene5 - 5} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${C.accent}, ${C.accent5})` }} />

      <SlideUp delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 6, height: 52, background: C.accent5, borderRadius: 3 }} />
          <h2 style={{ fontSize: 52, fontWeight: 900, color: C.text, margin: 0 }}>
            核心公式汇总
          </h2>
        </div>
      </SlideUp>

      {/* 公式列表 */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
        {formulas.map((f, i) => (
          <FadeIn key={i} delay={15 + i * 14}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: C.bgCard,
              borderRadius: 14,
              padding: "18px 28px",
              border: `1.5px solid ${f.color}`,
              boxShadow: C.shadow,
            }}>
              {/* 标签 */}
              <span style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#fff",
                background: f.color,
                borderRadius: 8,
                padding: "4px 16px",
                minWidth: 80,
                textAlign: "center",
                flexShrink: 0,
              }}>{f.label}</span>
              {/* 公式 */}
              <span style={{
                fontSize: 28,
                fontWeight: 700,
                color: f.color,
                fontFamily: "monospace",
                flex: 1,
              }}>{f.formula}</span>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* 考研提示 + 呼吸动画 */}
      <FadeIn delay={90}>
        <div style={{
          background: C.bgCard3,
          border: `2px solid ${C.accent}`,
          borderRadius: 16,
          padding: "20px 40px",
          textAlign: "center",
          transform: `scale(${breathScale})`,
        }}>
          <p style={{ fontSize: 28, color: C.accent, fontWeight: 700, margin: 0, letterSpacing: 2 }}>
            408 考研必考 · 熟记公式
          </p>
        </div>
      </FadeIn>

      {/* 底部签名 */}
      <FadeIn delay={110}>
        <p style={{ fontSize: 22, color: C.textDim, textAlign: "center", letterSpacing: 1, margin: 0 }}>
          感谢观看 · 关注获取更多考研干货
        </p>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 主组件 ====================
export const PerformanceMetrics: React.FC = () => {
  return (
    <>
      {/* BGM */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.24} loop />

      <TransitionSeries>
        {/* 片头 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FADE })}
        />

        {/* 时钟周期 & 主频 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.scene1}>
          <ClockScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_SLIDE })}
        />

        {/* CPI / IPC / IPS / MIPS */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.scene2}>
          <ExecutionScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FADE })}
        />

        {/* FLOPS */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.scene3}>
          <FlopsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_SLIDE })}
        />

        {/* 字长 & 主存容量 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.scene4}>
          <WordLengthScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FADE })}
        />

        {/* 核心公式汇总 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.scene5}>
          <FormulaScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
