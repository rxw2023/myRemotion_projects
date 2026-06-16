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

// ==================== 配色（与 StorageKnowledge 保持一致） ====================
const C = {
  bg: "#F8F9FC",
  bgCard: "#FFFFFF",
  bgCard2: "#F0F2F8",
  accent: "#2563EB",
  accent2: "#059669",
  accent3: "#D97706",
  accent4: "#DC2626",
  text: "#1F2937",
  textDim: "#9CA3AF",
  textMid: "#6B7280",
  border: "#E5E7EB",
  shadow: "0 2px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 4px 24px rgba(0,0,0,0.08)",
};

// ==================== 可复用组件 ====================

const FadeIn: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay,
  children,
  style,
}) => {
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

const SlideUp: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay,
  children,
  style,
}) => {
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

// ==================== 时长配置（基于 TTS 实际时长 + 缓冲） ====================
const DURATIONS = {
  title: 304,       // TTS 274f + 30f
  vonneumann: 664,  // TTS 634f + 30f
  hwsw: 554,        // TTS 524f + 30f
  languages: 631,   // TTS 601f + 30f
  source2exe: 649,  // TTS 619f + 30f
  outro: 328,       // TTS 298f + 30f
};


// ==================== 字幕文本 ====================
const SUBTITLE_TEXTS: Record<string, string> = {
  title: "一台完整的计算机，由硬件系统和软件系统共同构成。硬件是物理设备，软件是指令和数据。",
  vonneumann: "冯诺依曼提出了存储程序思想，奠定了现代计算机的基本结构。冯诺依曼机由五大部件组成。运算器负责算术和逻辑运算。控制器读取并解码指令。存储器存放程序和数据。输入设备接收外部信息。输出设备反馈处理结果。",
  hwsw: "软件分为系统软件和应用软件。系统软件直接运行在硬件之上，为其他软件提供运行平台。应用软件解决用户的具体问题，提供交互界面。如果把硬件比作身体，那么软件就是灵魂。",
  languages: "编程语言分为三个级别。机器语言用二进制代码表示，中央处理器可以直接执行。汇编语言使用助记符替代二进制，更易编写。高级语言接近自然语言，与硬件无关，抽象度最高。三层语言，层层抽象。",
  source2exe: "从源程序到可执行程序，需要经过五个步骤。预处理进行宏替换和文件包含。编译将源代码转为汇编代码。汇编将汇编代码转为机器码。链接合并目标文件和库文件。最后由加载器将程序装入内存执行。",
  outro: "计算机系统的层次结构，从底层硬件到高层应用，层层封装，各司其职。感谢观看，我们下期再见。",
};

// ==================== 字幕组件 ====================
const SubtitleBar: React.FC<{
  sceneKey: string;
  startFrame?: number;
  endFrame?: number;
}> = ({ sceneKey, startFrame = 0, endFrame = 9999 }) => {
  const frame = useCurrentFrame();
  const text = SUBTITLE_TEXTS[sceneKey] || "";
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10, endFrame - 10, endFrame],
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
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          borderRadius: 14,
          padding: "14px 36px",
          maxWidth: "88%",
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

// ==================== 场景1：标题开场 ====================
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });
  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineOpacity = interpolate(frame, [30, 45], [0, 1], {
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
      <Audio src={staticFile("computer-structure/structure_title.mp3")} />
      <SubtitleBar sceneKey="title" startFrame={0} endFrame={DURATIONS.title} />

      {/* 装饰点 */}
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.4 }}>
        {Array.from({ length: 30 }, (_, i) => {
          const x = (i * 137 + 50) % 100;
          const y = (i * 89 + 30) % 100;
          const px = interpolate(frame, [0, 90], [x, x + (i % 7 - 3)]);
          const py = interpolate(frame, [0, 90], [y, y - 5 - (i % 5)]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${px}%`,
                top: `${py}%`,
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
          fontSize: 80,
          fontWeight: "bold",
          color: C.accent,
          transform: `scale(${titleScale})`,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: 6,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        计算机系统<br />层次结构
      </div>

      <div
        style={{
          fontSize: 30,
          color: C.textMid,
          marginTop: 28,
          opacity: subtitleOpacity,
          letterSpacing: 4,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        硬件与软件 · 层层封装
      </div>

      <div
        style={{
          width: 100,
          height: 3,
          backgroundColor: C.accent,
          marginTop: 24,
          opacity: lineOpacity,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

// ==================== 场景2：冯诺依曼结构 ====================
const VonNeumannScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const parts = [
    { label: "运算器", sub: "ALU", desc: "算术与逻辑运算", color: C.accent, accent: "#3B82F6" },
    { label: "控制器", sub: "CU", desc: "读取解码指令", color: C.accent2, accent: "#10B981" },
    { label: "存储器", sub: "Memory", desc: "存放程序与数据", color: C.accent3, accent: "#F59E0B" },
    { label: "输入设备", sub: "Input", desc: "接收外部数据", color: "#7C3AED", accent: "#8B5CF6" },
    { label: "输出设备", sub: "Output", desc: "反馈处理结果", color: C.accent4, accent: "#EF4444" },
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
      <Audio src={staticFile("computer-structure/structure_vonneumann.mp3")} />
      <SubtitleBar sceneKey="vonneumann" startFrame={0} endFrame={DURATIONS.vonneumann} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          冯诺依曼结构
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 24, letterSpacing: 2, textAlign: "center" }}>
          存储程序思想 · 五大部件
        </p>
      </SlideUp>

      {/* 环形图：CPU 居中 + 五部件环绕 */}
      <div
        style={{
          position: "relative",
          width: 560,
          height: 560,
        }}
      >
        {/* 中央 CPU */}
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 180,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent}, #60A5FA)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 40px rgba(37,99,235,0.3)",
            color: "#FFF",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          <div>CPU</div>
          <div style={{ fontSize: 16, fontWeight: 400, marginTop: 4, opacity: 0.85 }}>
            控制器 + 运算器
          </div>
        </div>

        {/* 五个外围部件 */}
        {parts.map((p, i) => {
          const angle = (i * 72 - 90) * (Math.PI / 180);
          const radius = 230;
          const cx = 280 + Math.cos(angle) * radius;
          const cy = 280 + Math.sin(angle) * radius;
          const itemDelay = 12 + i * 10;
          const progress = spring({ frame: frame - itemDelay, fps, config: { damping: 20, stiffness: 150 } });
          const opacity = interpolate(frame, [itemDelay, itemDelay + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={p.label}
              style={{
                position: "absolute",
                left: cx - 64,
                top: cy - 58,
                width: 128,
                transform: `scale(${progress})`,
                opacity,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  background: C.bgCard,
                  borderRadius: 14,
                  padding: "14px 10px",
                  boxShadow: C.shadow,
                  border: `1.5px solid ${p.accent}40`,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: p.color, letterSpacing: 1 }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 14, color: C.textMid, marginTop: 4, letterSpacing: 0.5 }}>
                  {p.sub}
                </div>
                <div style={{ fontSize: 13, color: C.textDim, marginTop: 4 }}>
                  {p.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部要点 */}
      <FadeIn delay={65}>
        <WhiteCard style={{ marginTop: 18, maxWidth: 680 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {["指令数据同等地位", "二进制表示", "运算器为中心"].map((text) => (
              <span
                key={text}
                style={{
                  color: C.accent,
                  fontSize: 18,
                  padding: "8px 20px",
                  borderRadius: 22,
                  border: `1.5px solid ${C.accent}40`,
                  backgroundColor: `${C.accent}08`,
                  whiteSpace: "nowrap",
                }}
              >
                {text}
              </span>
            ))}
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景3：硬件与软件 ====================
const HWSoftwareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hwItems = [
    { label: "运算器 ALU", desc: "算术逻辑运算" },
    { label: "控制器 CU", desc: "读取解码指令" },
    { label: "存储器", desc: "程序与数据" },
    { label: "I/O 接口", desc: "外设通信" },
  ];

  const swItems = [
    { label: "系统软件", desc: "管理硬件 · 提供平台" },
    { label: "应用软件", desc: "解决问题 · 用户交互" },
  ];

  const leftProgress = spring({ frame: frame - 5, fps, config: { damping: 20 } });
  const rightProgress = spring({ frame: frame - 12, fps, config: { damping: 20 } });

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
      <Audio src={staticFile("computer-structure/structure_hwsw.mp3")} />
      <SubtitleBar sceneKey="hwsw" startFrame={0} endFrame={DURATIONS.hwsw} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 6, letterSpacing: 3, textAlign: "center" }}>
          硬件与软件
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 24, letterSpacing: 2, textAlign: "center" }}>
          身体与灵魂
        </p>
      </SlideUp>

      {/* 双栏 */}
      <div style={{ display: "flex", gap: 24, width: "100%", maxWidth: 780, justifyContent: "center" }}>
        {/* 硬件 */}
        <div style={{ flex: 1, maxWidth: 360, transform: `scale(${leftProgress})` }}>
          <WhiteCard style={{ borderTop: `4px solid ${C.accent}`, padding: "18px 22px" }}>
            <h2 style={{ color: C.accent, fontSize: 32, fontWeight: "bold", margin: "0 0 14px 0", letterSpacing: 2, textAlign: "center" }}>
              硬件系统
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {hwItems.map((item, i) => {
                const op = interpolate(frame, [10 + i * 5, 16 + i * 5], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={item.label}
                    style={{
                      opacity: op,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      background: `${C.accent}06`,
                      borderRadius: 10,
                      border: `1px solid ${C.accent}20`,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.accent, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: C.text, fontSize: 18, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ color: C.textDim, fontSize: 15 }}>{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </WhiteCard>
        </div>

        {/* 软件 */}
        <div style={{ flex: 1, maxWidth: 360, transform: `scale(${rightProgress})` }}>
          <WhiteCard style={{ borderTop: `4px solid ${C.accent2}`, padding: "18px 22px" }}>
            <h2 style={{ color: C.accent2, fontSize: 32, fontWeight: "bold", margin: "0 0 14px 0", letterSpacing: 2, textAlign: "center" }}>
              软件系统
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {swItems.map((item, i) => {
                const op = interpolate(frame, [18 + i * 8, 24 + i * 8], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={item.label}
                    style={{
                      opacity: op,
                      background: `${C.accent2}06`,
                      borderRadius: 10,
                      padding: "12px 16px",
                      border: `1px solid ${C.accent2}20`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ color: C.accent2, fontSize: 20, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ color: C.textDim, fontSize: 16, marginTop: 4 }}>{item.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* 软件示例 */}
            <FadeIn delay={40}>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <div style={{ color: C.textDim, fontSize: 15, marginBottom: 8 }}>常见软件</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {["OS", "编译器", "数据库", "浏览器", "Office"].map((t) => (
                    <span key={t} style={{
                      fontSize: 15, color: C.text, padding: "5px 14px",
                      background: C.bgCard2, borderRadius: 14,
                      border: `1px solid ${C.border}`,
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </FadeIn>
          </WhiteCard>
        </div>
      </div>

      <FadeIn delay={50}>
        <WhiteCard style={{ marginTop: 18, maxWidth: 760 }}>
          <p style={{ color: C.text, fontSize: 20, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            <span style={{ color: C.accent, fontWeight: "bold" }}>硬件是身体</span>
            <span style={{ color: C.textMid, margin: "0 8px" }}>·</span>
            <span style={{ color: C.accent2, fontWeight: "bold" }}>软件是灵魂</span>
            <span style={{ color: C.textMid, margin: "0 8px" }}>·</span>
            两者缺一不可
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景4：三级语言 ====================
const LanguagesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const levels = [
    {
      title: "高级语言",
      color: C.accent,
      bg: "#EFF6FF",
      border: "#BFDBFE",
      code: 'print("Hello World")\nfor i in range(5):\n    print(i)',
      examples: ["Python", "Java", "C++", "JavaScript"],
      desc: "接近自然语言 · 硬件无关",
    },
    {
      title: "汇编语言",
      color: C.accent3,
      bg: "#FFFBEB",
      border: "#FDE68A",
      code: "MOV AX, 5\nADD AX, 3\nINT 21h",
      examples: ["x86", "ARM", "MIPS"],
      desc: "助记符 · 架构相关",
    },
    {
      title: "机器语言",
      color: C.accent4,
      bg: "#FEF2F2",
      border: "#FECACA",
      code: "10110000 01100001\n01001000 11000111\n11001100 00000000",
      examples: ["0/1 二进制"],
      desc: "CPU 直接执行",
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
        padding: "50px 40px",
      }}
    >
      <Audio src={staticFile("computer-structure/structure_languages.mp3")} />
      <SubtitleBar sceneKey="languages" startFrame={0} endFrame={DURATIONS.languages} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          三个级别的语言
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 22, letterSpacing: 2, textAlign: "center" }}>
          从底层到高层 · 层层抽象
        </p>
      </SlideUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 760 }}>
        {levels.map((lv, i) => {
          const cardDelay = 10 + i * 25;
          const progress = spring({ frame: frame - cardDelay, fps, config: { damping: 20, stiffness: 140 } });
          const opacity = interpolate(frame, [cardDelay, cardDelay + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={lv.title}
              style={{
                opacity,
                transform: `scaleX(${progress})`,
                background: lv.bg,
                borderRadius: 16,
                padding: "16px 22px",
                border: `2px solid ${lv.border}`,
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              {/* 左侧信息 */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: lv.color, letterSpacing: 1, marginBottom: 4 }}>
                  {lv.title}
                </div>
                <div style={{ fontSize: 15, color: C.textMid, marginBottom: 10 }}>
                  {lv.desc}
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.75)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: i === 2 ? "#FCA5A5" : "#A7F3D0",
                    fontFamily: "monospace",
                    fontSize: 13,
                    lineHeight: 1.7,
                    whiteSpace: "pre",
                  }}
                >
                  {lv.code}
                </div>
              </div>

              {/* 右侧标签 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 100 }}>
                {lv.examples.map((ex) => (
                  <div
                    key={ex}
                    style={{
                      background: C.bgCard,
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 14,
                      color: lv.color,
                      fontWeight: 600,
                      textAlign: "center",
                      boxShadow: C.shadow,
                    }}
                  >
                    {ex}
                  </div>
                ))}
                {i < levels.length - 1 && (
                  <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", marginTop: 4 }}>
                    ↓ 编译器/汇编器
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <FadeIn delay={90}>
        <WhiteCard style={{ marginTop: 16, maxWidth: 760 }}>
          <p style={{ color: C.text, fontSize: 19, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            <span style={{ color: C.accent2, fontWeight: "bold" }}>核心概念：</span>
            每层向下翻译 · 上层屏蔽下层细节 · 计算机只能执行
            <span style={{ color: C.accent, fontWeight: "bold" }}>机器语言</span>
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景5：源程序→可执行程序 ====================
const SourceToExeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { label: "预处理", icon: "#", desc: "宏替换 · 文件包含 · 条件编译", color: C.accent, bg: "#EFF6FF", ext: ".i" },
    { label: "编译", icon: "C", desc: "源代码 → 汇编代码", color: C.accent3, bg: "#FFFBEB", ext: ".s" },
    { label: "汇编", icon: "A", desc: "汇编代码 → 机器码", color: C.accent4, bg: "#FEF2F2", ext: ".o" },
    { label: "链接", icon: "L", desc: "合并目标文件与库文件", color: C.accent2, bg: "#ECFDF5", ext: "exe" },
    { label: "执行", icon: "▶", desc: "加载到内存 · CPU 运行", color: "#7C3AED", bg: "#F5F3FF", ext: "run" },
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
      <Audio src={staticFile("computer-structure/structure_source2exe.mp3")} />
      <SubtitleBar sceneKey="source2exe" startFrame={0} endFrame={DURATIONS.source2exe} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 40, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          从源代码到可执行程序
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 21, marginBottom: 22, letterSpacing: 2, textAlign: "center" }}>
          .c → .i → .s → .o → 可执行文件
        </p>
      </SlideUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 760 }}>
        {steps.map((step, i) => {
          const itemDelay = 8 + i * 22;
          const progress = spring({ frame: frame - itemDelay, fps, config: { damping: 20, stiffness: 150 } });
          const opacity = interpolate(frame, [itemDelay, itemDelay + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <React.Fragment key={step.label}>
              <div
                style={{
                  opacity,
                  transform: `scaleX(${progress})`,
                  display: "flex",
                  alignItems: "center",
                  background: step.bg,
                  borderRadius: 14,
                  padding: "14px 20px",
                  border: `2px solid ${step.color}30`,
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: C.bgCard,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    color: step.color,
                    boxShadow: C.shadow,
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: step.color, letterSpacing: 1 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 15, color: C.textMid, marginTop: 2 }}>
                    {step.desc}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    borderRadius: 8,
                    padding: "6px 14px",
                    color: "#A7F3D0",
                    fontFamily: "monospace",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {step.ext}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ textAlign: "center", fontSize: 22, color: C.textDim }}>↓</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* GCC 命令 */}
      <FadeIn delay={120}>
        <WhiteCard style={{ marginTop: 16, maxWidth: 760 }}>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 10, letterSpacing: 1, textAlign: "center" }}>
            GCC 工具链示例
          </div>
          <div
            style={{
              background: "rgba(0,0,0,0.8)",
              borderRadius: 10,
              padding: "12px 18px",
              fontFamily: "monospace",
              fontSize: 14,
              color: "#A7F3D0",
              lineHeight: 1.9,
              whiteSpace: "pre",
            }}
          >
            {"gcc -E hello.c -o hello.i\n" +
              "gcc -S hello.c -o hello.s\n" +
              "gcc -c hello.c -o hello.o\n" +
              "gcc hello.o -o hello\n" +
              "./hello"}
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
      <Audio src={staticFile("computer-structure/structure_outro.mp3")} />
      <SubtitleBar sceneKey="outro" startFrame={0} endFrame={DURATIONS.outro} />

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
          计算机系统层次结构 · 知识点梳理
        </div>
      </FadeIn>

      <FadeIn delay={35}>
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {["冯诺依曼", "五大部件", "存储程序", "机器语言", "汇编语言", "高级语言", "编译流程"].map((tag) => (
            <span
              key={tag}
              style={{
                color: C.accent,
                fontSize: 18,
                padding: "8px 20px",
                borderRadius: 22,
                border: `1.5px solid ${C.accent}40`,
                backgroundColor: `${C.accent}08`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={50}>
        <div style={{ marginTop: 32, color: C.textMid, fontSize: 21, letterSpacing: 3, textAlign: "center" }}>
          点赞 · 收藏 · 关注
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 主视频组件 ====================
export const ComputerStructure: React.FC = () => {
  return (
    <>
      {/* BGM - 24% 音量 */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.24} loop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.vonneumann}>
          <VonNeumannScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.hwsw}>
          <HWSoftwareScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.languages}>
          <LanguagesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.source2exe}>
          <SourceToExeScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
