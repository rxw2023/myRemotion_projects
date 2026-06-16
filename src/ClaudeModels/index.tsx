import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { Gif } from "@remotion/gif";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { C, SUBTITLE_TEXTS, DURATIONS } from "./constants";

// ==================== 通用动画 ====================

const FadeIn: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 4], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>
      {children}
    </div>
  );
};

const GlowCard: React.FC<{
  children: React.ReactNode;
  accentColor?: string;
  style?: React.CSSProperties;
}> = ({ children, accentColor = C.accent, style }) => (
  <div
    style={{
      background: "rgba(15,15,26,0.92)",
      backdropFilter: "blur(8px)",
      border: `1px solid ${accentColor}30`,
      borderRadius: 14,
      padding: "24px 32px",
      boxShadow: `0 0 24px ${accentColor}10`,
      ...style,
    }}
  >
    {children}
  </div>
);

// ==================== 字幕条 ====================

const SubtitleBar: React.FC<{
  sceneKey: string;
  startFrame?: number;
  endFrame?: number;
}> = ({ sceneKey, startFrame = 0, endFrame = 9999 }) => {
  const frame = useCurrentFrame();
  const text = SUBTITLE_TEXTS[sceneKey] || "";
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 2, endFrame - 2, endFrame],
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
        padding: "0 80px",
      }}
    >
      <div
        style={{
          background: "rgba(6,6,14,0.88)",
          backdropFilter: "blur(10px)",
          borderRadius: 10,
          padding: "14px 36px",
          maxWidth: "88%",
          textAlign: "center",
          border: `1px solid ${C.accent}20`,
        }}
      >
        <span
          style={{
            color: "#f0f0f8",
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: 1.5,
            lineHeight: 1.7,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ==================== 粒子背景 ====================

const ParticleBg: React.FC<{ count?: number }> = ({ count = 25 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.25 }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i * 137 + 50) % 100;
        const y = (i * 89 + 30) % 100;
        const px = interpolate(frame, [0, 120], [x, x + (i % 7 - 3.5)]);
        const py = interpolate(frame, [0, 120], [y, y - 3 - (i % 6)]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${px}%`,
              top: `${py}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              borderRadius: "50%",
              backgroundColor: i % 3 === 0 ? C.accent : i % 3 === 1 ? C.accent2 : C.accent3,
              opacity: 0.08 + (i % 5) * 0.05,
            }}
          />
        );
      })}
    </div>
  );
};

// ==================== 场景1：标题开场 ====================

const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({ frame, fps, config: { damping: 8, stiffness: 250 } });
  const tagOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #0f0f1a 0%, #06060e 70%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ParticleBg count={40} />

      <FadeIn delay={3}>
        <div
          style={{
            padding: "6px 24px",
            borderRadius: 18,
            border: `1.5px solid ${C.accent}50`,
            backgroundColor: `${C.accent}10`,
            marginBottom: 36,
          }}
        >
          <span style={{ color: C.accent, fontSize: 20, fontWeight: 600, letterSpacing: 5 }}>
            ANTHROPIC · 2026.6
          </span>
        </div>
      </FadeIn>

      <div
        style={{
          fontSize: 100,
          fontWeight: 900,
          color: C.text,
          transform: `scale(${titleScale})`,
          letterSpacing: 8,
          textAlign: "center",
          lineHeight: 1.12,
          textShadow: `0 0 80px ${C.accent}25`,
        }}
      >
        Claude
        <br />
        <span style={{ color: C.accent }}>Fable 5</span>
      </div>

      <div
        style={{
          fontSize: 30,
          color: C.textMid,
          marginTop: 28,
          opacity: tagOpacity,
          letterSpacing: 6,
        }}
      >
        神话降临
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景2：什么是 Fable 5 ====================

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const specs = [
    { label: "上下文窗口", value: "1,000,000 tokens", color: C.accent },
    { label: "最大输出", value: "128,000 tokens", color: C.accent2 },
    { label: "架构", value: "Mythos 级 · 自适应思考常驻", color: C.accent3 },
    { label: "模态", value: "文本 + 图像输入", color: C.accent4 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px 80px",
      }}
    >
      <ParticleBg />

      <FadeIn delay={0}>
        <h1 style={{ fontSize: 54, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: 3, textAlign: "center" }}>
          Mythos 级模型<span style={{ color: C.accent }}>首次公开</span>
        </h1>
      </FadeIn>

      <FadeIn delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 28, textAlign: "center", letterSpacing: 2 }}>
          与机密 Mythos 5 共享权重，安全分类器护航，向所有人开放
        </p>
      </FadeIn>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 880 }}>
        {specs.map((s, i) => {
          const op = interpolate(frame, [8 + i * 6, 16 + i * 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={s.label}
              style={{
                opacity: op,
                background: C.bgCard,
                borderRadius: 14,
                padding: "20px 28px",
                border: `1px solid ${s.color}25`,
              }}
            >
              <div style={{ fontSize: 15, color: C.textDim, marginBottom: 6, letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <FadeIn delay={35}>
        <GlowCard accentColor={C.accent3} style={{ marginTop: 24, maxWidth: 880 }}>
          <p style={{ color: C.textMid, fontSize: 19, lineHeight: 1.7, margin: 0, textAlign: "center" }}>
            三个安全分类器：<span style={{ color: C.accent3, fontWeight: 600 }}>网络安全</span> ·{" "}
            <span style={{ color: C.accent2, fontWeight: 600 }}>生物化学</span> ·{" "}
            <span style={{ color: C.accent, fontWeight: 600 }}>模型蒸馏</span>
            {" — 不足 5% 会话触发"}
          </p>
        </GlowCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景3：屠榜基准测试（带实图） ====================

const BenchmarksScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgScale = spring({ frame: frame - 5, fps, config: { damping: 8, stiffness: 220 } });

  const benchmarks = [
    { name: "SWE-bench Pro", score: "80.3%", vs: "Opus 4.8: 69.2%", color: C.accent },
    { name: "HLE (无工具)", score: "53%", vs: "Opus 4.8: 49.8%", color: C.accent2 },
    { name: "AI 智商指数", score: "#1 全球", vs: "GPT-5.5: #2", color: C.accent3 },
    { name: "FrontierCode", score: "钻石级领先", vs: "Opus 4.8: 13.4%", color: C.accent4 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "25px 70px",
      }}
    >
      <ParticleBg />

      <FadeIn delay={0}>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          屠榜<span style={{ color: C.accent }}>所有</span>基准测试
        </h1>
      </FadeIn>

      <FadeIn delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 20, textAlign: "center" }}>每一项都是第一</p>
      </FadeIn>

      {/* 实图：benchmark chart */}
      <div
        style={{
          transform: `scale(${imgScale})`,
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${C.border}`,
          marginBottom: 16,
          maxWidth: 920,
          boxShadow: C.shadowLg,
        }}
      >
        <Img
          src={staticFile("claude-models/img/benchmark.jpg")}
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      {/* 关键数据卡片 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, width: "100%", maxWidth: 960 }}>
        {benchmarks.map((b, i) => {
          const delay = 10 + i * 6;
          const opacity = interpolate(frame, [delay, delay + 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={b.name}
              style={{
                opacity,
                background: C.bgCard,
                borderRadius: 12,
                padding: "16px 14px",
                border: `1px solid ${b.color}20`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 14, color: C.textDim, marginBottom: 6 }}>{b.name}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: b.color }}>{b.score}</div>
              <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>{b.vs}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景4：Stripe 案例（带实图） ====================

const StripeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgScale = spring({ frame: frame - 8, fps, config: { damping: 10, stiffness: 220 } });
  const leftScale = spring({ frame: frame - 5, fps, config: { damping: 8, stiffness: 220 } });
  const rightScale = spring({ frame: frame - 12, fps, config: { damping: 8, stiffness: 220 } });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "25px 70px",
      }}
    >
      <ParticleBg />

      <FadeIn delay={0}>
        <div style={{
          padding: "4px 16px", borderRadius: 12, border: `1.5px solid ${C.accent3}40`,
          backgroundColor: `${C.accent3}10`, marginBottom: 10,
        }}>
          <span style={{ color: C.accent3, fontSize: 14, fontWeight: 600, letterSpacing: 3 }}>CASE STUDY</span>
        </div>
      </FadeIn>

      <FadeIn delay={2}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 10, letterSpacing: 2, textAlign: "center" }}>
          Stripe · <span style={{ color: C.accent }}>1 天 = 团队 2 个月</span>
        </h1>
      </FadeIn>

      {/* 实图：Stripe infographic — 上移 */}
      <div style={{
        transform: `scale(${imgScale})`,
        borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`,
        maxWidth: 900, marginBottom: 14, boxShadow: C.shadowLg,
      }}>
        <Img src={staticFile("claude-models/img/stripe.jpg")} style={{ width: "100%", height: "auto" }} />
      </div>

      <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 920, alignItems: "center" }}>
        <div style={{ flex: 1, transform: `scale(${leftScale})` }}>
          <GlowCard accentColor={C.accent}>
            <div style={{ fontSize: 96, fontWeight: 900, color: C.accent, textAlign: "center", lineHeight: 1 }}>5000<span style={{ fontSize: 32 }}> 万行</span></div>
            <div style={{ fontSize: 20, color: C.textMid, textAlign: "center", marginTop: 6 }}>Ruby 代码完整迁移</div>
          </GlowCard>
        </div>
        <div style={{ flex: 1, transform: `scale(${rightScale})` }}>
          <GlowCard accentColor={C.accent2}>
            <div style={{ fontSize: 72, fontWeight: 900, color: C.accent2, textAlign: "center", lineHeight: 1 }}>1 天</div>
            <div style={{ fontSize: 20, color: C.textMid, textAlign: "center", marginTop: 6 }}>Fable 5 独立完成</div>
            <div style={{ marginTop: 14, padding: "10px 16px", background: C.bg, borderRadius: 10, textAlign: "center" }}>
              <span style={{ fontSize: 16, color: C.textDim }}>原估算：工程师团队 <span style={{ color: C.accent3, fontWeight: 700 }}>2+ 个月</span></span>
            </div>
          </GlowCard>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景5：Pokémon 案例（带 GIF） ====================

const PokemonScene: React.FC = () => {
  const frame = useCurrentFrame();

  const steps = [
    "仅靠游戏截图 · 零辅助工具",
    "自动理解 UI 和地图导航",
    "自主制定策略并执行操作",
    "前代模型需要复杂外部工具链",
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px 70px",
      }}
    >
      <ParticleBg />

      <FadeIn delay={0}>
        <div style={{
          padding: "5px 20px", borderRadius: 14, border: `1.5px solid ${C.accent2}40`,
          backgroundColor: `${C.accent2}10`, marginBottom: 16,
        }}>
          <span style={{ color: C.accent2, fontSize: 16, fontWeight: 600, letterSpacing: 3 }}>CASE STUDY</span>
        </div>
      </FadeIn>

      <FadeIn delay={3}>
        <h1 style={{ fontSize: 44, fontWeight: 800, color: C.text, marginBottom: 4, letterSpacing: 2, textAlign: "center" }}>
          Pokémon FireRed · <span style={{ color: C.accent }}>纯截图通关</span>
        </h1>
      </FadeIn>

      <FadeIn delay={3}>
        <p style={{ color: C.textMid, fontSize: 18, marginBottom: 14, textAlign: "center" }}>Ethan Mollick 教授 · 沃顿商学院</p>
      </FadeIn>

      {/* GIF 右 + 要点左，同样高度居中 */}
      <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 1100, alignItems: "stretch" }}>
        {/* 左侧：要点 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
          {steps.map((s, i) => {
            const delay = 6 + i * 7;
            const opacity = interpolate(frame, [delay, delay + 3], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const colors = [C.accent, C.accent2, C.accent3, C.accent4];
            return (
              <div
                key={i}
                style={{
                  opacity,
                  display: "flex", alignItems: "center", gap: 12,
                  background: C.bgCard, borderRadius: 10, padding: "14px 22px",
                  border: `1px solid ${colors[i]}18`,
                }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: "50%", backgroundColor: colors[i],
                flexShrink: 0, boxShadow: `0 0 6px ${colors[i]}50`,
              }} />
              <span style={{ fontSize: 22, color: C.text, letterSpacing: 1 }}>{s}</span>
            </div>
          );
        })}
        </div>

        {/* 右侧：GIF，与左侧文段同高 */}
        <div style={{
          flex: 1, opacity: interpolate(frame, [6, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`,
          boxShadow: C.shadowLg, display: "flex", alignItems: "center",
        }}>
          <Gif
            src={staticFile("claude-models/img/pokemon.gif")}
            width={640}
            height={360}
            fit="fill"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景6：科研 & 创作（带实图） ====================

const ResearchScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgLeft = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 220 } });
  const imgRight = spring({ frame: frame - 14, fps, config: { damping: 10, stiffness: 220 } });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px 60px",
      }}
    >
      <ParticleBg />

      <FadeIn delay={0}>
        <h1 style={{ fontSize: 46, fontWeight: 800, color: C.text, marginBottom: 20, letterSpacing: 2, textAlign: "center" }}>
          科研 · 创作 · <span style={{ color: C.accent }}>无所不能</span>
        </h1>
      </FadeIn>

      {/* 实图：双图并排 */}
      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 980, marginBottom: 16 }}>
        <div style={{
          flex: 1, transform: `scale(${imgLeft})`, borderRadius: 14, overflow: "hidden",
          border: `1px solid ${C.border}`, boxShadow: C.shadowLg,
        }}>
          <Img src={staticFile("claude-models/img/protein.jpg")} style={{ width: "100%", height: "auto" }} />
        </div>
        <div style={{
          flex: 1, transform: `scale(${imgRight})`, borderRadius: 14, overflow: "hidden",
          border: `1px solid ${C.border}`, boxShadow: C.shadowLg,
        }}>
          <Img src={staticFile("claude-models/img/isochrone.jpg")} style={{ width: "100%", height: "auto" }} />
        </div>
      </div>

      {/* 标签 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 900 }}>
        {[
          { title: "蛋白质设计", desc: "药物开发 10× · 14 靶点 9 个成功", color: C.accent, delay: 5 },
          { title: "基因组学", desc: "138 物种数据 · 超越 Science 论文", color: C.accent2, delay: 12 },
          { title: "游戏生成", desc: "一句话生成 Snake·3D 世界·文学游戏", color: C.accent3, delay: 19 },
          { title: "应用构建", desc: "Photoshop 克隆·无限图书馆·交互地图", color: C.accent4, delay: 26 },
        ].map((c) => {
          const opacity = interpolate(frame, [c.delay, c.delay + 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={c.title}
              style={{
                opacity,
                background: C.bgCard,
                borderRadius: 12,
                padding: "16px 24px",
                border: `1px solid ${c.color}20`,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 18, color: C.textMid }}>{c.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景7：代价与争议（带实图） ====================

const PricingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgScale = spring({ frame: frame - 8, fps, config: { damping: 8, stiffness: 220 } });
  const karpathyScale = spring({ frame: frame - 20, fps, config: { damping: 8, stiffness: 220 } });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px 70px",
      }}
    >
      <ParticleBg />

      <FadeIn delay={0}>
        <h1 style={{ fontSize: 46, fontWeight: 800, color: C.text, marginBottom: 16, letterSpacing: 2, textAlign: "center" }}>
          强大<span style={{ color: C.accent3 }}>有代价</span>
        </h1>
      </FadeIn>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 980, marginBottom: 14 }}>
        {/* 实图：Pricing chart */}
        <div style={{
          flex: 1, transform: `scale(${imgScale})`, borderRadius: 14, overflow: "hidden",
          border: `1px solid ${C.border}`, boxShadow: C.shadowLg,
        }}>
          <Img src={staticFile("claude-models/img/pricing.jpg")} style={{ width: "100%", height: "auto" }} />
        </div>

        {/* 实图：Karpathy quote */}
        <div style={{
          flex: 1, transform: `scale(${karpathyScale})`, borderRadius: 14, overflow: "hidden",
          border: `1px solid ${C.border}`, boxShadow: C.shadowLg,
        }}>
          <Img src={staticFile("claude-models/img/karpathy.jpg")} style={{ width: "100%", height: "auto" }} />
        </div>
      </div>

      {/* 要点 */}
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 920, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { label: "定价", detail: "输入 $10/M · 输出 $50/M", color: C.accent },
          { label: "消耗", detail: "Pro 用户 30 分钟用完月配额", color: C.accent3 },
          { label: "分类器", detail: "安全护栏 &lt;5% 误触发", color: C.accent2 },
        ].map((item, i) => {
          const delay = 8 + i * 5;
          const opacity = interpolate(frame, [delay, delay + 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={item.label}
              style={{
                opacity,
                background: C.bgCard,
                borderRadius: 12,
                padding: "16px 24px",
                border: `1px solid ${item.color}20`,
                borderLeft: `3px solid ${item.color}`,
                flex: "1 1 auto",
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 17, color: C.textMid }}>{item.detail}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景8：结尾 ====================

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 8, stiffness: 250 } });
  const frontierScale = spring({ frame: frame - 8, fps, config: { damping: 10, stiffness: 220 } });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #0f0f1a 0%, #06060e 70%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px 60px",
      }}
    >
      <ParticleBg count={35} />

      <div
        style={{
          fontSize: 60,
          fontWeight: 900,
          color: C.accent,
          transform: `scale(${scale})`,
          letterSpacing: 8,
          textAlign: "center",
          textShadow: `0 0 40px ${C.accent}30`,
        }}
      >
        Fable 5
      </div>

      <FadeIn delay={10}>
        <div style={{ marginTop: 18, fontSize: 28, color: C.textMid, letterSpacing: 4, textAlign: "center", lineHeight: 1.6 }}>
          代际跨越 · 史上最强
        </div>
      </FadeIn>

      {/* 实图：FrontierCode benchmark */}
      <div style={{
        marginTop: 20, transform: `scale(${frontierScale})`, borderRadius: 14, overflow: "hidden",
        border: `1px solid ${C.border}`, maxWidth: 780, boxShadow: C.shadowLg,
      }}>
        <Img src={staticFile("claude-models/img/frontier-code.jpg")} style={{ width: "100%", height: "auto" }} />
      </div>

      <FadeIn delay={22}>
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {["SWE-bench #1", "HLE #1", "AI IQ #1", "Stripe 5000万行", "Pokémon 通关", "蛋白质 10x"].map((tag) => (
            <span
              key={tag}
              style={{
                color: C.accent, fontSize: 17, padding: "8px 20px", borderRadius: 20,
                border: `1.5px solid ${C.accent}30`, backgroundColor: `${C.accent}08`, letterSpacing: 1,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={35}>
        <div style={{ marginTop: 24, color: C.textDim, fontSize: 22, letterSpacing: 3 }}>点赞 · 收藏 · 关注</div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 主组件 ====================

export const ClaudeModels: React.FC = () => {
  return (
    <>
      <Audio src={staticFile("shared/bgm.mp3")} volume={0.10} loop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <Audio src={staticFile("claude-models/s01_title.mp3")} />
          <TitleScene />
          <SubtitleBar sceneKey="title" startFrame={0} endFrame={DURATIONS.title} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 2 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.intro}>
          <Audio src={staticFile("claude-models/s02_intro.mp3")} />
          <IntroScene />
          <SubtitleBar sceneKey="intro" startFrame={0} endFrame={DURATIONS.intro} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 3 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.benchmarks}>
          <Audio src={staticFile("claude-models/s03_benchmarks.mp3")} />
          <BenchmarksScene />
          <SubtitleBar sceneKey="benchmarks" startFrame={0} endFrame={DURATIONS.benchmarks} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 2 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.stripe}>
          <Audio src={staticFile("claude-models/s04_stripe.mp3")} />
          <StripeScene />
          <SubtitleBar sceneKey="stripe" startFrame={0} endFrame={DURATIONS.stripe} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 3 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.pokemon}>
          <Audio src={staticFile("claude-models/s05_pokemon.mp3")} />
          <PokemonScene />
          <SubtitleBar sceneKey="pokemon" startFrame={0} endFrame={DURATIONS.pokemon} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 2 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.research}>
          <Audio src={staticFile("claude-models/s06_research.mp3")} />
          <ResearchScene />
          <SubtitleBar sceneKey="research" startFrame={0} endFrame={DURATIONS.research} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 3 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.pricing}>
          <Audio src={staticFile("claude-models/s07_pricing.mp3")} />
          <PricingScene />
          <SubtitleBar sceneKey="pricing" startFrame={0} endFrame={DURATIONS.pricing} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 2 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <Audio src={staticFile("claude-models/s08_outro.mp3")} />
          <OutroScene />
          <SubtitleBar sceneKey="outro" startFrame={0} endFrame={DURATIONS.outro} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
