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

// ==================== 颜色配置 - 白色系 ====================
const COLORS = {
  background: "#ffffff",
  backgroundSecondary: "#f5f5f7",
  accent: "#007AFF",
  accentSecondary: "#5856D6",
  text: "#1d1d1f",
  textSecondary: "#6e6e73",
  gpt1: "#007AFF",
  gpt2: "#5856D6",
  gpt3: "#FF2D55",
};

// ==================== 短视频配置 ====================
// 竖屏模式 (9:16)
const IS_SHORT_VIDEO = true;

// ==================== 通用动画组件 ====================

// 淡入动画组件 - 短视频版更快
const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}> = ({ children, delay = 0, duration = 10 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <div style={{ opacity }}>{children}</div>;
};

// 滑入动画组件 - 短视频版更快
const SlideIn: React.FC<{
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
}> = ({ children, direction = "left", delay = 0 }) => {
  const frame = useCurrentFrame();
  const distance = IS_SHORT_VIDEO ? 60 : 80;

  const translateX =
    direction === "left"
      ? interpolate(frame, [delay, delay + 8], [-distance, 0])
      : direction === "right"
        ? interpolate(frame, [delay, delay + 8], [distance, 0])
        : 0;

  const translateY =
    direction === "up"
      ? interpolate(frame, [delay, delay + 8], [distance, 0])
      : direction === "down"
        ? interpolate(frame, [delay, delay + 8], [-distance, 0])
        : 0;

  const opacity = interpolate(frame, [delay, delay + 6], [0, 1]);

  return (
    <div
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
        opacity,
      }}
    >
      {children}
    </div>
  );
};

// 数字计数动画组件
const Counter: React.FC<{
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ from, to, duration = 45, suffix = "", style }) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame, [0, duration], [from, to], {
    extrapolateRight: "clamp",
  });

  const displayValue = Math.round(value).toLocaleString();

  return (
    <span style={style}>
      {displayValue}
      {suffix}
    </span>
  );
};

// 粒子背景组件
const ParticleBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: 10 + (i * 4.5) % 100,
    y: 10 + ((i * 7) % 80),
    size: 2 + (i % 4),
    delay: i * 3,
  }));

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", overflow: "hidden" }}>
      {particles.map((p) => {
        const opacity = interpolate(
          frame,
          [p.delay, p.delay + 20, p.delay + 60],
          [0, 0.6, 0]
        );
        const y = interpolate(frame, [0, 180], [p.y, p.y - 20]);
        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: COLORS.accent,
              opacity: Math.max(0, opacity),
              boxShadow: `0 0 ${p.size * 2}px ${COLORS.accent}`,
            }}
          />
        );
      })}
    </div>
  );
};

// ==================== 场景组件 ====================

// 开场场景 - 竖屏版 (白色系 + 大字体)
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "40px",
      }}
    >
      <ParticleBackground />
      
      {/* 顶部标签 */}
      <FadeIn delay={5}>
        <div style={{
          backgroundColor: `${COLORS.accent}15`,
          padding: "10px 24px",
          borderRadius: 24,
          border: `2px solid ${COLORS.accent}30`,
          marginBottom: 40,
        }}>
          <span style={{ color: COLORS.accent, fontSize: 18, fontWeight: 600 }}>
            🤖 GPT发展史
          </span>
        </div>
      </FadeIn>
      
      {/* 主标题 */}
      <div
        style={{
          fontSize: 96,
          fontWeight: "bold",
          color: COLORS.text,
          transform: `scale(${scale})`,
          fontFamily: "Montserrat, system-ui, sans-serif",
          letterSpacing: "4px",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        GPT<br/>进化史
      </div>

      {/* 副标题 */}
      <div
        style={{
          fontSize: 32,
          color: COLORS.textSecondary,
          marginTop: 30,
          opacity: interpolate(frame, [15, 25], [0, 1]),
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        从 GPT-1 到 GPT-3<br/>大模型革命之路
      </div>

      {/* 进化时间线 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginTop: 60,
          opacity: interpolate(frame, [25, 35], [0, 1]),
          width: "100%",
          maxWidth: 380,
        }}
      >
        {[
          { year: "2018", gen: "GPT-1", params: "1.17亿", color: COLORS.gpt1 },
          { year: "2019", gen: "GPT-2", params: "15亿", color: COLORS.gpt2 },
          { year: "2020", gen: "GPT-3", params: "1750亿", color: COLORS.gpt3 },
        ].map((item) => (
          <div
            key={item.year}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "16px 20px",
              borderRadius: 16,
              backgroundColor: `${item.color}10`,
              borderLeft: `5px solid ${item.color}`,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: "bold", color: item.color, minWidth: 55 }}>
              {item.year}
            </span>
            <span style={{ fontSize: 26, fontWeight: "bold", color: COLORS.text }}>
              {item.gen}
            </span>
            <span style={{ fontSize: 18, color: COLORS.textSecondary, marginLeft: "auto" }}>
              {item.params}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// GPT-1 场景 - 竖屏版 (白色系 + 大字体)
const GPT1Scene: React.FC = () => {

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        padding: "50px 35px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 标题区域 */}
      <SlideIn direction="left">
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, flexWrap: "wrap" }}>
          <h1 style={{ color: COLORS.gpt1, fontSize: 76, margin: 0, fontWeight: "bold" }}>
            GPT-1
          </h1>
          <span style={{ color: COLORS.textSecondary, fontSize: 28 }}>2018 · 开山鼻祖</span>
        </div>
      </SlideIn>

      {/* 核心参数展示 */}
      <FadeIn delay={8}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 25, 
          marginTop: 30,
          backgroundColor: `${COLORS.gpt1}10`,
          borderRadius: 20,
          padding: "20px 25px",
        }}>
          <div style={{ 
            width: 100, 
            height: 100, 
            borderRadius: "50%",
            background: `conic-gradient(${COLORS.gpt1} 0deg, ${COLORS.gpt1} 120deg, ${COLORS.backgroundSecondary} 120deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{ 
              width: 75, 
              height: 75, 
              borderRadius: "50%",
              backgroundColor: COLORS.background,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: "bold",
              color: COLORS.gpt1,
            }}>
              <Counter from={0} to={117} suffix="M" duration={25} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: "bold", color: COLORS.text }}>1.17亿参数</div>
            <div style={{ fontSize: 20, color: COLORS.textSecondary, marginTop: 4 }}>12层 Transformer 解码器</div>
          </div>
        </div>
      </FadeIn>

      {/* 创新点介绍 */}
      <div style={{ marginTop: 25, display: "flex", flexDirection: "column", gap: 16 }}>
        <FadeIn delay={15}>
          <div
            style={{
              backgroundColor: COLORS.backgroundSecondary,
              borderRadius: 16,
              padding: 20,
              borderLeft: `5px solid ${COLORS.accent}`,
            }}
          >
            <h3 style={{ color: COLORS.accent, fontSize: 28, margin: "0 0 8px 0" }}>🔬 预训练 + 微调</h3>
            <p style={{ color: COLORS.text, fontSize: 19, lineHeight: 1.5, margin: 0 }}>
              先在海量无标注文本上学习通用语言表示，再针对下游任务微调，大幅降低标注成本
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={25}>
          <div
            style={{
              backgroundColor: COLORS.backgroundSecondary,
              borderRadius: 16,
              padding: 20,
              borderLeft: `5px solid ${COLORS.accentSecondary}`,
            }}
          >
            <h3 style={{ color: COLORS.accentSecondary, fontSize: 28, margin: "0 0 8px 0" }}>🧠 Transformer 架构</h3>
            <p style={{ color: COLORS.text, fontSize: 19, lineHeight: 1.5, margin: 0 }}>
              12层解码器，12个注意力头，768维隐向量，开启了大模型时代
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={35}>
          <div
            style={{
              backgroundColor: COLORS.backgroundSecondary,
              borderRadius: 16,
              padding: 20,
              borderLeft: `5px solid ${COLORS.gpt1}`,
            }}
          >
            <h3 style={{ color: COLORS.gpt1, fontSize: 28, margin: "0 0 8px 0" }}>📖 BooksCorpus 训练</h3>
            <p style={{ color: COLORS.text, fontSize: 19, lineHeight: 1.5, margin: 0 }}>
              约800万本书、超过5GB文本数据，涵盖多种领域和风格
            </p>
          </div>
        </FadeIn>
      </div>

      {/* 亮点标签 */}
      <FadeIn delay={45}>
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 10, 
          marginTop: 18,
          justifyContent: "center",
        }}>
          {["自然语言推理", "问答系统", "语义相似度", "文本分类"].map((tag) => (
            <span key={tag} style={{
              backgroundColor: `${COLORS.gpt1}15`,
              color: COLORS.gpt1,
              padding: "8px 16px",
              borderRadius: 24,
              fontSize: 16,
              fontWeight: 500,
            }}>
              {tag}
            </span>
          ))}
        </div>
      </FadeIn>

      {/* 历史意义 */}
      <FadeIn delay={55}>
        <div
          style={{
            marginTop: 18,
            backgroundColor: `${COLORS.accent}10`,
            borderRadius: 16,
            padding: 18,
            border: `2px solid ${COLORS.accent}30`,
          }}
        >
          <h3 style={{ color: COLORS.accent, fontSize: 24, margin: "0 0 8px 0" }}>🏆 历史意义</h3>
          <p style={{ color: COLORS.text, fontSize: 18, lineHeight: 1.5, margin: 0 }}>
            GPT-1 证明了"预训练+微调"范式的有效性，为后续大模型发展奠定了基础，开启了NLP新纪元
          </p>
        </div>
      </FadeIn>

      {/* 性能表现 */}
      <FadeIn delay={65}>
        <div
          style={{
            marginTop: 14,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h3 style={{ color: COLORS.text, fontSize: 20, margin: "0 0 10px 0", fontWeight: 600 }}>📊 性能表现</h3>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: COLORS.gpt1 }}>SOTA</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>9/12任务</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: COLORS.gpt1 }}>72.8%</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>平均提升</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: COLORS.gpt1 }}>第1名</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>GLUE榜单</div>
            </div>
          </div>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// GPT-2 场景 - 竖屏版 (白色系 + 大字体 + 更多内容)
const GPT2Scene: React.FC = () => {
  const params = [
    { label: "参数量", from: 117, to: 1542, suffix: "M", color: COLORS.gpt2, multiplier: "13x" },
    { label: "层数", from: 12, to: 48, suffix: "", color: COLORS.gpt2, multiplier: "4x" },
    { label: "上下文", from: 512, to: 1024, suffix: " tokens", color: COLORS.gpt2, multiplier: "2x" },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        padding: "50px 35px",
      }}
    >
      {/* 标题 - 统一左侧滑入 */}
      <SlideIn direction="left">
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, flexWrap: "wrap" }}>
          <h1 style={{ color: COLORS.gpt2, fontSize: 76, margin: 0, fontWeight: "bold" }}>
            GPT-2
          </h1>
          <span style={{ color: COLORS.textSecondary, fontSize: 28 }}>2019 · 大力出奇迹</span>
        </div>
      </SlideIn>

      {/* 核心增长数据 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 25,
        }}
      >
        {params.map((param, index) => (
          <FadeIn key={param.label} delay={index * 8}>
            <div style={{ 
              display: "flex", 
              alignItems: "center",
              backgroundColor: `${COLORS.gpt2}10`,
              borderRadius: 16,
              padding: "16px 20px",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: COLORS.textSecondary, fontSize: 18, marginBottom: 4 }}>
                  {param.label}
                </div>
                <div style={{ 
                  fontSize: 36, 
                  fontWeight: "bold",
                  color: param.color,
                }}>
                  <Counter from={param.from} to={param.to} duration={20} suffix={param.suffix} />
                </div>
              </div>
              <div
                style={{
                  color: COLORS.accent,
                  fontSize: 20,
                  fontWeight: "bold",
                  backgroundColor: `${COLORS.accent}15`,
                  padding: "8px 16px",
                  borderRadius: 24,
                }}
              >
                ↑ {param.multiplier}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* WebText 数据集 */}
      <FadeIn delay={30}>
        <div
          style={{
            marginTop: 20,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h3 style={{ color: COLORS.gpt2, fontSize: 24, margin: "0 0 10px 0" }}>
            🌐 WebText 数据集
          </h3>
          <p style={{ color: COLORS.text, fontSize: 18, lineHeight: 1.5, margin: 0 }}>
            从 Reddit 外链爬取 4500万+ 网页，过滤后约 40GB 高质量文本
          </p>
        </div>
      </FadeIn>

      {/* 零样本学习 */}
      <FadeIn delay={40}>
        <div
          style={{
            marginTop: 16,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
            padding: 20,
            borderLeft: `5px solid ${COLORS.accent}`,
          }}
        >
          <h3 style={{ color: COLORS.accent, fontSize: 26, margin: "0 0 8px 0" }}>
            🚀 零样本学习
          </h3>
          <p style={{ color: COLORS.text, fontSize: 18, lineHeight: 1.5, margin: 0 }}>
            无需微调，只需给模型任务描述就能直接执行！
          </p>
        </div>
      </FadeIn>

      {/* 能力标签 */}
      <FadeIn delay={50}>
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 10, 
          marginTop: 16,
          justifyContent: "center",
        }}>
          {["机器翻译", "文本摘要", "阅读理解", "代码生成", "创意写作", "对话系统"].map((tag) => (
            <span key={tag} style={{
              backgroundColor: `${COLORS.gpt2}15`,
              color: COLORS.gpt2,
              padding: "8px 16px",
              borderRadius: 24,
              fontSize: 16,
              fontWeight: 500,
            }}>
              {tag}
            </span>
          ))}
        </div>
      </FadeIn>

      {/* 多任务通用模型 */}
      <FadeIn delay={58}>
        <div
          style={{
            marginTop: 16,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
            padding: 18,
            borderLeft: `5px solid ${COLORS.accentSecondary}`,
          }}
        >
          <h3 style={{ color: COLORS.accentSecondary, fontSize: 24, margin: "0 0 8px 0" }}>
            🎯 多任务通用模型
          </h3>
          <p style={{ color: COLORS.text, fontSize: 17, lineHeight: 1.5, margin: 0 }}>
            同一个模型处理翻译、问答、摘要、续写等多种任务，无需为每个任务单独训练
          </p>
        </div>
      </FadeIn>

      {/* 安全性考虑 */}
      <FadeIn delay={68}>
        <div
          style={{
            marginTop: 14,
            backgroundColor: `${COLORS.gpt3}10`,
            borderRadius: 16,
            padding: 18,
            border: `2px solid ${COLORS.gpt3}25`,
          }}
        >
          <h3 style={{ color: COLORS.gpt3, fontSize: 22, margin: "0 0 8px 0" }}>⚠️ 安全性考虑</h3>
          <p style={{ color: COLORS.text, fontSize: 16, lineHeight: 1.5, margin: 0 }}>
            OpenAI 最初因担心滥用风险而分阶段发布，先发布小版本，观察后再发布完整模型
          </p>
        </div>
      </FadeIn>

      {/* 技术突破 */}
      <FadeIn delay={78}>
        <div
          style={{
            marginTop: 14,
            backgroundColor: `${COLORS.accent}10`,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h3 style={{ color: COLORS.accent, fontSize: 20, margin: "0 0 10px 0" }}>💡 关键技术突破</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: COLORS.gpt2, fontSize: 20 }}>•</span>
              <span style={{ color: COLORS.text, fontSize: 16 }}>Layer Norm 前置，训练更稳定</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: COLORS.gpt2, fontSize: 20 }}>•</span>
              <span style={{ color: COLORS.text, fontSize: 16 }}>改进的词表，更好处理罕见词</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: COLORS.gpt2, fontSize: 20 }}>•</span>
              <span style={{ color: COLORS.text, fontSize: 16 }}>可学习的位置编码</span>
            </div>
          </div>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// GPT-3 场景 - 竖屏版 (白色系 + 大字体 + 更多内容)
const GPT3Scene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        padding: "45px 30px",
      }}
    >
      {/* 标题 - 统一左侧滑入 */}
      <SlideIn direction="left">
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, flexWrap: "wrap" }}>
          <h1 style={{ color: COLORS.gpt3, fontSize: 76, margin: 0, fontWeight: "bold" }}>
            GPT-3
          </h1>
          <span style={{ color: COLORS.textSecondary, fontSize: 28 }}>2020 · 质的飞跃</span>
        </div>
      </SlideIn>

      {/* 震撼数字 */}
      <FadeIn delay={8}>
        <div style={{ 
          marginTop: 20,
          backgroundColor: `${COLORS.gpt3}10`,
          borderRadius: 20,
          padding: "20px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 90,
                fontWeight: "bold",
                color: COLORS.gpt3,
                lineHeight: 1,
              }}
            >
              <Counter from={0} to={175} suffix="B" duration={30} />
            </div>
            <p style={{ color: COLORS.textSecondary, fontSize: 18, marginTop: 8 }}>
              参数量 · 比 GPT-2 大 <span style={{ color: COLORS.gpt3, fontWeight: "bold" }}>100+ 倍</span>
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 30, marginTop: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: "bold", color: COLORS.text }}>96层</div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary }}>Transformer</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: "bold", color: COLORS.text }}>12288</div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary }}>模型维度</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: "bold", color: COLORS.text }}>2048</div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary }}>上下文长度</div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Common Crawl 数据 */}
      <FadeIn delay={20}>
        <div
          style={{
            marginTop: 16,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
            padding: 18,
          }}
        >
          <h3 style={{ color: COLORS.gpt3, fontSize: 22, margin: "0 0 8px 0" }}>
            🌍 Common Crawl 数据集
          </h3>
          <p style={{ color: COLORS.text, fontSize: 17, lineHeight: 1.5, margin: 0 }}>
            过滤后的 570GB 高质量网页数据 + WebText2 + Books1/2 + Wikipedia
          </p>
        </div>
      </FadeIn>

      {/* 上下文学习 */}
      <FadeIn delay={30}>
        <div
          style={{
            marginTop: 14,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
            padding: 18,
            borderLeft: `5px solid ${COLORS.accent}`,
          }}
        >
          <h3 style={{ color: COLORS.accent, fontSize: 22, margin: "0 0 10px 0" }}>
            💡 上下文学习
          </h3>
          <div
            style={{
              fontFamily: "monospace, Consolas, monospace",
              fontSize: 17,
              lineHeight: 1.7,
              backgroundColor: COLORS.background,
              padding: 14,
              borderRadius: 10,
            }}
          >
            <div style={{ color: COLORS.textSecondary }}>中译法：</div>
            <div style={{ color: COLORS.text }}>猫 → chat</div>
            <div style={{ color: COLORS.text }}>狗 → chien</div>
            <div style={{ color: COLORS.text }}>
              鸟 → <span style={{ color: COLORS.gpt3, fontWeight: "bold" }}>oiseau ✓</span>
            </div>
          </div>
          <p style={{ color: COLORS.accent, marginTop: 10, fontSize: 15 }}>
            🔥 模型权重未更新，仅从示例学习！
          </p>
        </div>
      </FadeIn>

      {/* 涌现能力 */}
      <FadeIn delay={40}>
        <div
          style={{
            marginTop: 14,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
            padding: 18,
            borderLeft: `5px solid ${COLORS.accentSecondary}`,
          }}
        >
          <h3 style={{ color: COLORS.accentSecondary, fontSize: 22, margin: "0 0 8px 0" }}>
            ✨ 涌现能力
          </h3>
          <p style={{ color: COLORS.text, fontSize: 17, lineHeight: 1.5, margin: 0 }}>
            规模达到一定程度后，突然展现出：算术推理、代码生成、复杂指令遵循
          </p>
        </div>
      </FadeIn>

      {/* API 商业化 */}
      <FadeIn delay={50}>
        <div
          style={{
            marginTop: 14,
            backgroundColor: `${COLORS.gpt1}10`,
            borderRadius: 16,
            padding: 18,
            border: `2px solid ${COLORS.gpt1}30`,
          }}
        >
          <h3 style={{ color: COLORS.gpt1, fontSize: 22, margin: "0 0 8px 0" }}>
            🚀 API 商业化
          </h3>
          <p style={{ color: COLORS.text, fontSize: 16, lineHeight: 1.5, margin: 0 }}>
            OpenAI 首次开放 API 服务，让开发者可以调用 GPT-3 能力，开启了 AI 应用新时代
          </p>
        </div>
      </FadeIn>

      {/* 模型版本 */}
      <FadeIn delay={60}>
        <div
          style={{
            marginTop: 14,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h3 style={{ color: COLORS.text, fontSize: 20, margin: "0 0 12px 0", fontWeight: 600 }}>🎯 多版本规模</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: COLORS.textSecondary, fontSize: 16 }}>Ada (最小)</span>
              <span style={{ color: COLORS.gpt3, fontSize: 18, fontWeight: "bold" }}>2.7B</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: COLORS.textSecondary, fontSize: 16 }}>Babbage</span>
              <span style={{ color: COLORS.gpt3, fontSize: 18, fontWeight: "bold" }}>6.7B</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: COLORS.textSecondary, fontSize: 16 }}>Curie</span>
              <span style={{ color: COLORS.gpt3, fontSize: 18, fontWeight: "bold" }}>13B</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: COLORS.textSecondary, fontSize: 16 }}>Davinci (最强)</span>
              <span style={{ color: COLORS.gpt3, fontSize: 20, fontWeight: "bold" }}>175B</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 应用场景 */}
      <FadeIn delay={70}>
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 10, 
          marginTop: 16,
          justifyContent: "center",
        }}>
          {["智能客服", "内容创作", "代码辅助", "教育辅导", "数据分析", "游戏NPC"].map((tag) => (
            <span key={tag} style={{
              backgroundColor: `${COLORS.gpt3}15`,
              color: COLORS.gpt3,
              padding: "8px 16px",
              borderRadius: 24,
              fontSize: 15,
              fontWeight: 500,
            }}>
              {tag}
            </span>
          ))}
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};



// ==================== 主视频组件 ====================

// 时长配置 - 内容更丰富的竖屏版 (总时长约21秒 @30fps)
const DURATIONS = {
  intro: 90,       // 0-3秒
  gpt1: 150,       // 3-8秒 (GPT-1 5秒)
  gpt2: 150,       // 8-13秒 (GPT-2 5秒)
  gpt3: 150,       // 13-18秒 (GPT-3 5秒)
  outro: 90,       // 18-21秒 (结尾 3秒)
};

export const GPTEvolution: React.FC = () => {
  return (
    <>
      {/* 背景音乐 */}
      <Audio
        src={staticFile("shared/bgm.mp3")}
        volume={0.3}
        loop
      />

      <TransitionSeries>
        {/* 开场 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.intro}>
          <IntroScene />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 8 })}
        />

        {/* GPT-1 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.gpt1}>
          <GPT1Scene />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 8 })}
        />

        {/* GPT-2 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.gpt2}>
          <GPT2Scene />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 8 })}
        />

        {/* GPT-3 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.gpt3}>
          <GPT3Scene />
        </TransitionSeries.Sequence>
        
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 8 })}
        />

        {/* 结尾 */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};


// 结尾场景 - 简洁版
const OutroScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 40px",
      }}
    >
      <ParticleBackground />
      
      {/* 主标题 */}
      <FadeIn delay={5}>
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: COLORS.text,
            textAlign: "center",
          }}
        >
          谢谢观看
        </div>
      </FadeIn>

      {/* 时间线回顾 */}
      <FadeIn delay={20}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 15,
          marginTop: 40,
          padding: "20px 25px",
          backgroundColor: COLORS.backgroundSecondary,
          borderRadius: 16,
        }}>
          {[
            { gen: "GPT-1", color: COLORS.gpt1 },
            { gen: "GPT-2", color: COLORS.gpt2 },
            { gen: "GPT-3", color: COLORS.gpt3 },
          ].map((item, i) => (
            <React.Fragment key={item.gen}>
              <div style={{
                padding: "10px 18px",
                borderRadius: 12,
                backgroundColor: `${item.color}15`,
                border: `2px solid ${item.color}40`,
              }}>
                <span style={{ color: item.color, fontSize: 22, fontWeight: "bold" }}>
                  {item.gen}
                </span>
              </div>
              {i < 2 && (
                <span style={{ color: COLORS.textSecondary, fontSize: 24 }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </FadeIn>

      {/* 结语 */}
      <FadeIn delay={40}>
        <div
          style={{
            marginTop: 50,
            fontSize: 28,
            color: COLORS.accent,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          AI 的未来，无限可能 🚀
        </div>
      </FadeIn>

      {/* 底部提示 */}
      <FadeIn delay={55}>
        <div style={{
          marginTop: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 15,
        }}>
          <span style={{
            backgroundColor: `${COLORS.accent}15`,
            color: COLORS.accent,
            padding: "10px 24px",
            borderRadius: 24,
            fontSize: 18,
            fontWeight: 500,
            border: `2px solid ${COLORS.accent}30`,
          }}>
            点赞 · 收藏 · 关注
          </span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
