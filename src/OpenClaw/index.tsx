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

// ==================== 通用动画组件 ====================

const FadeIn: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay, children, style,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 12], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>{children}</div>;
};

const SlideUp: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay, children, style,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 14], [40, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>{children}</div>;
};

const WhiteCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: C.bgCard, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: "24px 32px", boxShadow: C.shadow, ...style,
  }}>{children}</div>
);

// ==================== 时长配置 ====================
const DURATIONS = {
  title: 607,
  abilities: 574,
  local: 520,
  models: 505,
  usecases: 536,
  outro: 505,
};

// ==================== 字幕文本 ====================
const SUBTITLE_TEXTS: Record<string, string> = {
  title: "AIA智能体的新时代已经到来。一个开源的本地优先AI智能体框架，前身名为爪形机器人，目前在代码托管平台星标超过三十一万。它不同于只能在网页聊天的AI助手，能真正接管键盘鼠标，自动完成各类实际操作任务。",
  abilities: "这不是普通的聊天机器人，而是真正能动手干活的智能助手。用自然语言下达指令，就能在电脑上自动执行文件操作、网页抓取、数据处理。一句话部署容器、抓取竞品价格生成报表，都是它的拿手好戏。",
  local: "框架采用本地优先设计理念。所有数据不出本地，完全离线运行。运行在终端中，通过系统接口直接调用计算机的底层能力。无需云服务，你的数据始终在你的掌控之中。",
  models: "中国社区版原生支持多款国产大模型，大幅降低使用成本。同时支持二十多种通讯平台集成，包括飞书和企业微信等国内主流办公工具。通过技能系统，功能可以无限扩展。",
  usecases: "自动化运维方面，一句话部署容器、查询系统负载。信息搜集方面，自动打开浏览器，抓取竞品信息生成数据报表。办公提效方面，整理桌面杂乱文件，按日期重命名归档，样样精通。",
  outro: "框架基于开源协议发布，全球开发者共同建设。安装简便，文档齐全，社区活跃。无论是个人效率提升，还是企业自动化方案，它都是得力助手。感谢观看，下期再见。",
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
    [startFrame, startFrame + 8, endFrame - 5, endFrame - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div style={{
      position: "absolute", bottom: 56, left: 0, right: 0,
      display: "flex", justifyContent: "center", zIndex: 100, opacity,
    }}>
      <div style={{
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
        borderRadius: 14, padding: "14px 36px", maxWidth: "88%",
        textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      }}>
        <span style={{
          color: "#FFFFFF", fontSize: 26, fontWeight: 500,
          letterSpacing: 1.2, lineHeight: 1.6,
        }}>{text}</span>
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
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const lineOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, #EFF6FF 50%, #EEF2FF 100%)`,
      display: "flex", flexDirection: "column", justifyContent: "center",
      alignItems: "center", padding: "60px",
    }}>
      <Audio src={staticFile("openclaw/openclaw_title.mp3")} />
      <SubtitleBar sceneKey="title" startFrame={0} endFrame={DURATIONS.title} />

      {/* 装饰粒子 */}
      {Array.from({ length: 25 }, (_, i) => {
        const x = (i * 157 + 50) % 100;
        const y = (i * 89 + 30) % 100;
        const px = interpolate(frame, [0, 90], [x, x + (i % 7 - 3)]);
        const py = interpolate(frame, [0, 90], [y, y - 5 - (i % 5)]);
        return (
          <div key={i} style={{
            position: "absolute", left: `${px}%`, top: `${py}%`,
            width: 3 + (i % 4), height: 3 + (i % 4),
            borderRadius: "50%",
            backgroundColor: i % 3 === 0 ? C.accent : C.accent5,
            opacity: 0.12 + (i % 5) * 0.05,
          }} />
        );
      })}

      <FadeIn delay={5}>
        <div style={{
          padding: "10px 32px", borderRadius: 24,
          border: `1.5px solid ${C.accent}40`,
          backgroundColor: `${C.accent}08`, marginBottom: 36,
        }}>
          <span style={{ color: C.accent, fontSize: 24, fontWeight: 500, letterSpacing: 4 }}>
            AI 智能体框架
          </span>
        </div>
      </FadeIn>

      <div style={{
        fontSize: 68, fontWeight: "bold", color: C.accent,
        transform: `scale(${titleScale})`,
        fontFamily: "system-ui, sans-serif",
        letterSpacing: 6, textAlign: "center", lineHeight: 1.2,
      }}>
        OpenClaw
      </div>

      <div style={{
        fontSize: 28, color: C.textMid, marginTop: 28,
        opacity: subtitleOpacity, letterSpacing: 4, textAlign: "center", lineHeight: 1.6,
      }}>
        开源 · 本地优先 · 真正能干活的 AI 智能体
      </div>

      <div style={{
        width: 100, height: 3, backgroundColor: C.accent,
        marginTop: 24, opacity: lineOpacity, borderRadius: 2,
      }} />
    </AbsoluteFill>
  );
};

// ==================== 场景2：核心能力 ====================
const AbilitiesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const abilities = [
    { icon: "文件", label: "文件操作", desc: "批量整理 · 自动归档 · 格式转换", color: C.accent, accent: "#3B82F6", frameDelay: 8 },
    { icon: "网页", label: "网页抓取", desc: "信息采集 · 数据提取 · 竞品分析", color: C.accent2, accent: "#10B981", frameDelay: 18 },
    { icon: "数据", label: "数据处理", desc: "清洗转换 · 报表生成 · 智能分析", color: C.accent3, accent: "#F59E0B", frameDelay: 28 },
    { icon: "终端", label: "系统运维", desc: "容器部署 · 负载监控 · 日志分析", color: C.accent5, accent: "#8B5CF6", frameDelay: 38 },
    { icon: "对话", label: "自然语言", desc: "一句指令 · 自动执行 · 无需编码", color: C.accent4, accent: "#EF4444", frameDelay: 48 },
  ];

  return (
    <AbsoluteFill style={{
      background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "50px 40px",
    }}>
      <Audio src={staticFile("openclaw/openclaw_abilities.mp3")} />
      <SubtitleBar sceneKey="abilities" startFrame={0} endFrame={DURATIONS.abilities} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          超越对话
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 24, letterSpacing: 2, textAlign: "center" }}>
          自然语言驱动 · 五大核心能力
        </p>
      </SlideUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 720 }}>
        {abilities.map((item) => {
          const progress = spring({ frame: frame - item.frameDelay, fps, config: { damping: 20, stiffness: 150 } });
          const opacity = interpolate(frame, [item.frameDelay, item.frameDelay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={item.label} style={{
              opacity, transform: `scaleX(${progress})`,
              display: "flex", alignItems: "center", gap: 18,
              background: C.bgCard, borderRadius: 14, padding: "16px 24px",
              border: `1.5px solid ${item.accent}30`, boxShadow: C.shadow,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${item.color}12`, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700, color: item.color, flexShrink: 0,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, letterSpacing: 1 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 16, color: C.textMid, marginTop: 2 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景3：本地优先 ====================
const LocalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { label: "本地运行", desc: "无需云服务", icon: "💻", color: C.accent, frameDelay: 10 },
    { label: "数据安全", desc: "不出本地", icon: "🔒", color: C.accent2, frameDelay: 22 },
    { label: "离线可用", desc: "无需联网", icon: "📡", color: C.accent3, frameDelay: 34 },
    { label: "完全可控", desc: "开源透明", icon: "⚙️", color: C.accent5, frameDelay: 46 },
  ];

  const centerProgress = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 160 } });

  return (
    <AbsoluteFill style={{
      background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "50px 40px",
    }}>
      <Audio src={staticFile("openclaw/openclaw_local.mp3")} />
      <SubtitleBar sceneKey="local" startFrame={0} endFrame={DURATIONS.local} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          本地优先
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 28, letterSpacing: 2, textAlign: "center" }}>
          你的数据 · 你的电脑 · 你的掌控
        </p>
      </SlideUp>

      {/* 中央核心 */}
      <div style={{
        width: 180, height: 180, borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.accent}, #60A5FA)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 40px rgba(37,99,235,0.3)",
        transform: `scale(${centerProgress})`,
        color: "#FFF", fontSize: 48, fontWeight: 700,
        marginBottom: 28,
      }}>
        <span style={{ fontSize: 48 }}>🏠</span>
        <span style={{ fontSize: 18, marginTop: 4, opacity: 0.9, letterSpacing: 2 }}>本地</span>
      </div>

      {/* 四角特性 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 680 }}>
        {features.map((f) => {
          const itemDelay = f.frameDelay;
          const progress = spring({ frame: frame - itemDelay, fps, config: { damping: 20, stiffness: 140 } });
          const opacity = interpolate(frame, [itemDelay, itemDelay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={f.label} style={{
              opacity, transform: `scale(${progress})`,
              width: 150, textAlign: "center",
              background: C.bgCard, borderRadius: 14,
              padding: "20px 12px", boxShadow: C.shadow,
              border: `1.5px solid ${f.color}30`,
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: f.color, letterSpacing: 1 }}>{f.label}</div>
              <div style={{ fontSize: 15, color: C.textMid, marginTop: 4 }}>{f.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景4：模型与平台生态 ====================
const ModelsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const modelsRow = [
    { name: "DeepSeek", color: C.accent, desc: "深度搜索" },
    { name: "Qwen", color: C.accent2, desc: "通义千问" },
    { name: "GLM", color: C.accent3, desc: "智谱" },
    { name: "更多", color: C.accent5, desc: "25+ 模型" },
  ];

  const platformsRow = [
    { name: "飞书", color: C.accent, desc: "企业协作" },
    { name: "企业微信", color: C.accent2, desc: "办公通讯" },
    { name: "Discord", color: C.accent3, desc: "社区平台" },
    { name: "更多", color: C.accent5, desc: "20+ 平台" },
  ];

  const leftProgress = spring({ frame: frame - 8, fps, config: { damping: 20 } });
  const rightProgress = spring({ frame: frame - 16, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{
      background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "50px 40px",
    }}>
      <Audio src={staticFile("openclaw/openclaw_models.mp3")} />
      <SubtitleBar sceneKey="models" startFrame={0} endFrame={DURATIONS.models} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          开放生态
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 24, letterSpacing: 2, textAlign: "center" }}>
          多模型 · 多平台 · 无限扩展
        </p>
      </SlideUp>

      <div style={{ display: "flex", gap: 28, justifyContent: "center", maxWidth: 780 }}>
        {/* 模型支持 */}
        <div style={{ flex: 1, maxWidth: 340, transform: `scale(${leftProgress})` }}>
          <WhiteCard style={{ borderTop: `4px solid ${C.accent}`, padding: "18px 22px" }}>
            <h2 style={{ color: C.accent, fontSize: 28, fontWeight: "bold", margin: "0 0 16px 0", letterSpacing: 2, textAlign: "center" }}>
              模型支持
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {modelsRow.map((m, i) => {
                const op = interpolate(frame, [12 + i * 10, 18 + i * 10], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                return (
                  <div key={m.name} style={{
                    opacity: op, display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 18px", background: `${m.color}06`,
                    borderRadius: 12, border: `1px solid ${m.color}20`,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      backgroundColor: m.color, flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ color: C.text, fontSize: 20, fontWeight: 600 }}>{m.name}</div>
                      <div style={{ color: C.textDim, fontSize: 15 }}>{m.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </WhiteCard>
        </div>

        {/* 平台集成 */}
        <div style={{ flex: 1, maxWidth: 340, transform: `scale(${rightProgress})` }}>
          <WhiteCard style={{ borderTop: `4px solid ${C.accent2}`, padding: "18px 22px" }}>
            <h2 style={{ color: C.accent2, fontSize: 28, fontWeight: "bold", margin: "0 0 16px 0", letterSpacing: 2, textAlign: "center" }}>
              平台集成
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {platformsRow.map((p, i) => {
                const op = interpolate(frame, [20 + i * 10, 26 + i * 10], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                return (
                  <div key={p.name} style={{
                    opacity: op, display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 18px", background: `${p.color}06`,
                    borderRadius: 12, border: `1px solid ${p.color}20`,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      backgroundColor: p.color, flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ color: C.text, fontSize: 20, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: C.textDim, fontSize: 15 }}>{p.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </WhiteCard>
        </div>
      </div>

      {/* Skills 系统 */}
      <FadeIn delay={60}>
        <WhiteCard style={{ marginTop: 20, maxWidth: 720, textAlign: "center" }}>
          <span style={{ color: C.text, fontSize: 19, lineHeight: 1.6 }}>
            <span style={{ color: C.accent5, fontWeight: "bold" }}>技能系统</span>
            <span style={{ color: C.textMid }}> — 模块化扩展，社区共建，</span>
            <span style={{ color: C.accent2, fontWeight: "bold" }}>功能无限延伸</span>
          </span>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景5：使用场景 ====================
const UsecasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cases = [
    {
      icon: "🖥️", title: "自动化运维", color: C.accent, bg: "#EFF6FF",
      items: ["部署 Docker 容器", "查询系统负载", "监控日志告警"],
      frameDelay: 8,
    },
    {
      icon: "🔍", title: "信息搜集", color: C.accent2, bg: "#ECFDF5",
      items: ["竞品价格抓取", "网页数据提取", "生成分析报表"],
      frameDelay: 22,
    },
    {
      icon: "📋", title: "办公提效", color: C.accent3, bg: "#FFFBEB",
      items: ["整理桌面文件", "按日期归档", "发票批量处理"],
      frameDelay: 36,
    },
  ];

  return (
    <AbsoluteFill style={{
      background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "50px 40px",
    }}>
      <Audio src={staticFile("openclaw/openclaw_usecases.mp3")} />
      <SubtitleBar sceneKey="usecases" startFrame={0} endFrame={DURATIONS.usecases} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          全场景覆盖
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 24, letterSpacing: 2, textAlign: "center" }}>
          运维 · 采集 · 办公 · 无所不能
        </p>
      </SlideUp>

      <div style={{ display: "flex", gap: 18, justifyContent: "center", maxWidth: 900, flexWrap: "wrap" }}>
        {cases.map((c) => {
          const progress = spring({ frame: frame - c.frameDelay, fps, config: { damping: 20, stiffness: 140 } });
          const opacity = interpolate(frame, [c.frameDelay, c.frameDelay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={c.title} style={{
              opacity, transform: `scale(${progress})`,
              flex: "1 1 260px", maxWidth: 300,
              background: c.bg, borderRadius: 18,
              padding: "22px 20px", border: `2px solid ${c.color}20`,
              boxShadow: C.shadow,
            }}>
              <div style={{ fontSize: 40, textAlign: "center", marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: c.color, textAlign: "center", marginBottom: 14, letterSpacing: 2 }}>
                {c.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {c.items.map((item) => (
                  <div key={item} style={{
                    fontSize: 17, color: C.text, padding: "10px 16px",
                    background: C.bgCard, borderRadius: 10,
                    textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    letterSpacing: 1,
                  }}>{item}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景6：结尾 ====================
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, #EFF6FF 50%, #EEF2FF 100%)`,
      display: "flex", flexDirection: "column", justifyContent: "center",
      alignItems: "center", padding: "60px",
    }}>
      <Audio src={staticFile("openclaw/openclaw_outro.mp3")} />
      <SubtitleBar sceneKey="outro" startFrame={0} endFrame={DURATIONS.outro} />

      <div style={{
        fontSize: 64, fontWeight: "bold", color: C.accent,
        transform: `scale(${scale})`, letterSpacing: 6, textAlign: "center",
      }}>
        开始旅程
      </div>

      <FadeIn delay={20}>
        <div style={{ marginTop: 28, fontSize: 28, color: C.textMid, letterSpacing: 3, textAlign: "center" }}>
          openclaw.ai
        </div>
      </FadeIn>

      <FadeIn delay={35}>
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {["开源", "本地优先", "自然语言", "文件操作", "网页抓取", "数据处理", "国产模型", "飞书集成"].map((tag) => (
            <span key={tag} style={{
              color: C.accent, fontSize: 18, padding: "8px 20px",
              borderRadius: 22, border: `1.5px solid ${C.accent}40`,
              backgroundColor: `${C.accent}08`,
            }}>{tag}</span>
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
export const OpenClaw: React.FC = () => {
  return (
    <>
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.24} loop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.abilities}>
          <AbilitiesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.local}>
          <LocalScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.models}>
          <ModelsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.usecases}>
          <UsecasesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
