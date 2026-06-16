import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

// ==================== 配色（科技蓝白系） ====================
const C = {
  bg: "#F0F4F8",
  bgCard: "#FFFFFF",
  bgDark: "#1A2332",
  kimiBg: "#F7F8FA",
  kimiUser: "#EFF6FF",
  kimiAI: "#F9FAFB",
  accent: "#4F46E5",     // Indigo
  accent2: "#059669",   // Green
  accent3: "#D97706",   // Amber
  text: "#1F2937",
  textDim: "#9CA3AF",
  textMid: "#6B7280",
  border: "#E5E7EB",
  shadow: "0 2px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 4px 24px rgba(0,0,0,0.08)",
};

// ==================== 时长配置（TTS 帧数） ====================
const DURATIONS: Record<string, number> = {
  title: 252,
  genai_intro: 627,
  genai_text: 742,
  task_intro: 631,
  kimi_open: 698,
  upload_outline: 761,
  outline_result: 774,
  generate_text: 740,
  refine_text: 755,
  upload_images: 540,
  compare_images: 786,
  layout: 722,
  layout_rules: 871,
  wpsai: 853,
  summary: 777,
};

// ==================== 字幕文本 ====================
const SUBTITLES: Record<string, string> = {
  title: "项目一，探寻人工智能。生成文本，用AI制作良渚文化宣传单。",
  genai_intro: "什么是生成式人工智能？它是AI的一个分支，能基于所学知识和模式生成全新内容。",
  genai_text: "文本生成式人工智能是目前应用最广泛的一类，通义千问、文心一言、KIMI等都是常见工具。",
  task_intro: "本次任务：使用KIMI分析良渚文化资料，提炼主题，生成宣传单文案，完成图文排版。",
  kimi_open: "第一步：用浏览器打开KIMI智能助手，完成免费注册。",
  upload_outline: "第二步：上传文章.docx，输入提示词，让KIMI按时间顺序梳理大纲。",
  outline_result: "KIMI将良渚文化分为早晚期，梳理出完整的文物出土大纲。",
  generate_text: "第三步：要求KIMI撰写标题、宣传语和结束语。四字标题，十言宣传语。",
  refine_text: "第四步：提出修改要求，重拟标题、增减段落，保存至排版资料.docx。",
  upload_images: "第五步：上传图片素材，要求KIMI解析图片内容，匹配文字。",
  compare_images: "第六、七步：对比分析图片，使用视觉思考功能，挑选最匹配的图片。",
  layout: "第八、九步：将图片插入文档，复制到设计稿中进行图文排版。",
  layout_rules: "排版规则：竖向大标题、禹卫书法字体、深红色、七处圆形放图片。",
  wpsai: "巩固拓展：使用WPS AI进行风格化处理，生成风格化宣传单。",
  summary: "总结：掌握从素材分析、文本生成、图文匹配到最终排版的完整工作流程。",
};

// ==================== 通用动画组件 ====================
const FadeIn: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay, children, style,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [delay, delay + 12], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>{children}</div>;
};

const SlideUp: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay, children, style,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [delay, delay + 14], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>{children}</div>;
};

const WhiteCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 32px", boxShadow: C.shadow, ...style }}>{children}</div>
);

// ==================== 字幕条 ====================
const SubtitleBar: React.FC<{ sceneKey: string }> = ({ sceneKey }) => {
  const frame = useCurrentFrame();
  const text = SUBTITLES[sceneKey] || "";
  const dur = DURATIONS[sceneKey] || 200;
  const opacity = interpolate(frame, [0, 12, dur - 15, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 100, opacity }}>
      <div style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", borderRadius: 14, padding: "14px 36px", maxWidth: "88%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>
        <span style={{ color: "#FFFFFF", fontSize: 44, fontWeight: 600, letterSpacing: 1.5, lineHeight: 1.8 }}>{text}</span>
      </div>
    </div>
  );
};

// ==================== 步骤标签 ====================
const StepBadge: React.FC<{ num: number; label: string; delay?: number }> = ({ num, label, delay = 0 }) => (
  <SlideUp delay={delay}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: "bold", flexShrink: 0 }}>
        {num}
      </div>
      <div style={{ fontSize: 30, fontWeight: "bold", color: C.text, letterSpacing: 1 }}>{label}</div>
    </div>
  </SlideUp>
);

// ==================== KIMI 对话气泡 ====================
const ChatBubble: React.FC<{ type: "user" | "ai"; text: string; delay: number }> = ({ type, text, delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [delay, delay + 10], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isUser = type === "user";
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16, padding: "0 24px" }}>
      <div style={{
        maxWidth: "82%",
        background: isUser ? C.kimiUser : C.kimiAI,
        border: `1px solid ${isUser ? "#BFDBFE" : C.border}`,
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "16px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        {isUser && (
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.accent }} />
            你
          </div>
        )}
        {!isUser && (
          <div style={{ fontSize: 13, color: C.accent2, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.accent2 }} />
            KIMI
          </div>
        )}
        <div style={{ fontSize: 18, color: C.text, lineHeight: 1.7, letterSpacing: 0.5 }}>{text}</div>
      </div>
    </div>
  );
};

// ==================== 模拟 KIMI 界面框架 ====================
const KimiFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 18, stiffness: 150 } });

  return (
    <div style={{ transform: `scale(${scale})`, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* KIMI 顶部栏 */}
      <div style={{
        width: "80%", background: C.bgCard, borderRadius: "16px 16px 0 0",
        border: `1px solid ${C.border}`, borderBottom: "none",
        padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, #7C3AED)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          K
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>KIMI 智能助手</span>
        <span style={{ fontSize: 14, color: C.textDim, marginLeft: "auto" }}>月之暗面</span>
      </div>

      {/* 聊天内容区 */}
      <div style={{
        width: "92%", flex: 1, minHeight: 100,
        background: C.kimiBg,
        borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
        padding: "20px 0", overflow: "hidden",
      }}>
        {children}
      </div>

      {/* 底部输入栏 */}
      <div style={{
        width: "92%", background: C.bgCard, borderRadius: "0 0 16px 16px",
        border: `1px solid ${C.border}`, borderTop: "none",
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ flex: 1, height: 40, background: C.bg, borderRadius: 20, border: `1px solid ${C.border}`, padding: "0 16px", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 15, color: C.textDim }}>输入提示词...</span>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </div>
      </div>
    </div>
  );
};

// ==================== 场景1：标题开场 ====================
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });
  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #F0F4F8 0%, #EEF2FF 50%, #F0FDFA 100%)`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 200px" }}>

      {/* 装饰粒子 */}
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.25 }}>
        {Array.from({ length: 20 }, (_, i) => {
          const x = (i * 137 + 50) % 100;
          const y = (i * 83 + 25) % 100;
          const px = interpolate(frame, [0, 90], [x, x + (i % 5 - 2)]);
          const py = interpolate(frame, [0, 90], [y, y - 3 - (i % 4)]);
          return <div key={i} style={{ position: "absolute", left: `${px}%`, top: `${py}%`, width: 3 + (i % 4), height: 3 + (i % 4), borderRadius: "50%", backgroundColor: i % 2 === 0 ? C.accent : C.accent2, opacity: 0.15 + (i % 3) * 0.04 }} />;
        })}
      </div>

      <FadeIn delay={5}>
        <div style={{ padding: "10px 28px", borderRadius: 22, border: `1.5px solid ${C.accent}40`, backgroundColor: `${C.accent}08`, marginBottom: 32 }}>
          <span style={{ color: C.accent, fontSize: 24, fontWeight: 600, letterSpacing: 4 }}>项目一 · 探寻人工智能</span>
        </div>
      </FadeIn>

      <div style={{ fontSize: 88, fontWeight: "bold", color: C.text, transform: `scale(${scale})`, letterSpacing: 10, textAlign: "center", lineHeight: 1.2 }}>
        生成文本
      </div>

      <div style={{ fontSize: 30, color: C.textMid, marginTop: 24, opacity: subtitleOpacity, letterSpacing: 4, textAlign: "center" }}>
        用AI制作良渚文化宣传单
      </div>

      <div style={{ width: 100, height: 3, backgroundColor: C.accent, marginTop: 24, opacity: lineOpacity, borderRadius: 2 }} />
    </AbsoluteFill>
  );
};

// ==================== 场景2：生成式AI概念介绍 ====================
const GenAIIntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  useVideoConfig();

  const categories = [
    { icon: "📝", label: "文本生成", desc: "文章、故事、诗歌、对话", color: C.accent },
    { icon: "🎨", label: "图像生成", desc: "图片、插画、设计稿", color: "#EC4899" },
    { icon: "🎵", label: "音频生成", desc: "音乐、语音、音效", color: C.accent3 },
    { icon: "🎬", label: "视频生成", desc: "动态视频、动画", color: C.accent2 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "50px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 42, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 2, textAlign: "center" }}>什么是生成式人工智能？</h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 28, textAlign: "center", letterSpacing: 1 }}>基于知识和模式，生成全新的文本、图像、音频、视频</p>
      </SlideUp>

      <WhiteCard style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
        <p style={{ fontSize: 19, color: C.text, lineHeight: 1.7, margin: 0, textAlign: "center" }}>
          生成式人工智能是<span style={{ color: C.accent, fontWeight: "bold" }}>人工智能的一个分支</span>，它能够基于所学到的知识和模式，生成新的内容。
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 12 }}>
          {categories.map((c, i) => {
            const op = interpolate(frame, [20 + i * 8, 30 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={c.label} style={{ opacity: op, minWidth: 150, padding: "16px 20px", background: `${c.color}08`, borderRadius: 14, border: `1.5px solid ${c.color}30`, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.label}</div>
                <div style={{ fontSize: 14, color: C.textMid, marginTop: 4 }}>{c.desc}</div>
              </div>
            );
          })}
        </div>
      </WhiteCard>
    </AbsoluteFill>
  );
};

// ==================== 场景3：文本生成工具介绍 ====================
const GenAITextScene: React.FC = () => {
  const frame = useCurrentFrame();

  const tools = [
    { name: "通义千问", company: "阿里云", color: "#6366F1" },
    { name: "文心一言", company: "百度", color: "#2563EB" },
    { name: "讯飞星火", company: "科大讯飞", color: "#059669" },
    { name: "豆包", company: "字节跳动", color: "#EC4899" },
    { name: "KIMI", company: "月之暗面", color: C.accent, highlight: true },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "50px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 42, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 2, textAlign: "center" }}>文本生成式人工智能</h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 24, textAlign: "center" }}>目前应用最为广泛的一类生成式AI</p>
      </SlideUp>

      <WhiteCard style={{ flex: 1 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {tools.map((t, i) => {
            const op = interpolate(frame, [12 + i * 6, 22 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const scale = t.highlight ? interpolate(frame, [50, 65], [1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
            return (
              <div key={t.name} style={{
                opacity: op, transform: `scale(${scale})`,
                minWidth: 140, padding: "16px 24px",
                background: t.highlight ? `${t.color}12` : `${t.color}06`,
                borderRadius: 14,
                border: `1.5px solid ${t.highlight ? t.color : `${t.color}30`}`,
                textAlign: "center",
                boxShadow: t.highlight ? `0 0 20px ${t.color}20` : "none",
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.color }}>{t.name}</div>
                <div style={{ fontSize: 14, color: C.textMid, marginTop: 4 }}>{t.company}</div>
                {t.highlight && (
                  <div style={{ fontSize: 13, color: t.color, fontWeight: 600, marginTop: 6, padding: "3px 12px", background: `${t.color}15`, borderRadius: 10, display: "inline-block" }}>
                    本次任务使用
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <FadeIn delay={60}>
          <div style={{ marginTop: 24, padding: "16px 24px", background: `${C.accent2}08`, borderRadius: 12, border: `1px solid ${C.accent2}30`, textAlign: "center" }}>
            <span style={{ fontSize: 19, color: C.accent2, fontWeight: 600 }}>本次任务将使用 KIMI 完成良渚文化宣传单的AI辅助创作</span>
          </div>
        </FadeIn>
      </WhiteCard>
    </AbsoluteFill>
  );
};

// ==================== 场景4：任务说明 ====================
const TaskIntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const steps = [
    { num: "1", label: "分析素材", desc: "用KIMI分析良渚文化文字资料和图片" },
    { num: "2", label: "生成文案", desc: "生成标题、宣传语、结束语" },
    { num: "3", label: "润色修改", desc: "调整文本、凝练内容" },
    { num: "4", label: "图文匹配", desc: "AI分析图片、匹配文字内容" },
    { num: "5", label: "排版设计", desc: "将内容插入设计稿，完成排版" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "50px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 42, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 2, textAlign: "center" }}>本次任务</h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 20, textAlign: "center" }}>用KIMI制作良渚文化宣传单</p>
      </SlideUp>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
        {steps.map((s, i) => {
          const op = interpolate(frame, [15 + i * 10, 25 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame, [15 + i * 10, 28 + i * 10], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={s.num} style={{ opacity: op, transform: `translateX(${x}px)`, display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: "bold", flexShrink: 0 }}>
                {s.num}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{s.label}</div>
                <div style={{ fontSize: 16, color: C.textMid, marginTop: 2 }}>{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景5：打开KIMI ====================
const KimiOpenScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - 8, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 38, fontWeight: "bold", color: C.text, marginBottom: 20, letterSpacing: 2, textAlign: "center" }}>打开 KIMI 智能助手</h1>
      </SlideUp>

      {/* 模拟浏览器地址栏 */}
      <div style={{ transform: `scale(${scale})`, width: "90%", maxWidth: 700 }}>
        <div style={{ background: "#E5E7EB", borderRadius: "12px 12px 0 0", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[C.accent3, C.accent3, C.accent3].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c, opacity: 0.6 }} />)}
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 15, color: C.textMid }}>
            🔒 kimi.moonshot.cn
          </div>
        </div>

        <KimiFrame>
          <div style={{ padding: "30px 0", textAlign: "center" }}>
            <FadeIn delay={25}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>KIMI 智能助手</div>
              <div style={{ fontSize: 16, color: C.textDim, marginTop: 8 }}>有什么我可以帮你的吗？</div>
            </FadeIn>

            <FadeIn delay={40}>
              <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {["上传文件", "解析文档", "生成文案", "图文匹配"].map((tag) => (
                  <span key={tag} style={{ fontSize: 15, padding: "8px 18px", borderRadius: 20, border: `1px solid ${C.border}`, color: C.textMid }}>{tag}</span>
                ))}
              </div>
            </FadeIn>
          </div>
        </KimiFrame>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景6：上传文档生成大纲 ====================
const UploadOutlineScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 36, fontWeight: "bold", color: C.text, marginBottom: 16, letterSpacing: 1, textAlign: "center" }}>上传文档 · 生成大纲</h1>
      </SlideUp>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ width: "94%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
          <KimiFrame>
            {/* 上传提示 */}
            <FadeIn delay={10}>
              <div style={{ padding: "10px 24px 6px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ padding: "4px 12px", background: C.accent, borderRadius: 8, color: "#fff", fontSize: 14 }}>📎 附件</div>
                <span style={{ fontSize: 16, color: C.text }}>文章.docx</span>
              </div>
            </FadeIn>

            <ChatBubble type="user" text="请根据时间顺序，为我详细梳理并整理出本文档的主要内容，并列出其大纲" delay={20} />
            <ChatBubble type="ai" text="好的，我已阅读文档内容。以下是按时间顺序整理的良渚文化大纲：&#10;&#10;【良渚文化早期】约5300-4500年&#10;• 北村遗址 - 玉蝉&#10;• 瑶山遗址 - 玉钺&#10;• 官井头遗址 - 刻纹陶器&#10;&#10;【良渚文化晚期】约4500-4000年&#10;• 反山遗址 - 玉琮王&#10;• 瑶山遗址 - 玉璜&#10;• 寺墩遗址 - 石犁&#10;• 福泉山遗址 - 椭圆形盘刻符陶豆" delay={45} />
          </KimiFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景7：大纲结果 ====================
const OutlineResultScene: React.FC = () => {
  const frame = useCurrentFrame();

  const early = [
    { site: "北村遗址", item: "玉蝉", desc: "造型栩栩如生，线条流畅" },
    { site: "瑶山遗址", item: "玉钺", desc: "权力与地位的象征" },
    { site: "官井头遗址", item: "刻纹陶器", desc: "独特的艺术价值" },
  ];
  const late = [
    { site: "反山遗址", item: "玉琮王", desc: "史前玉器巅峰之作" },
    { site: "瑶山遗址", item: "玉璜", desc: "主流玉礼器" },
    { site: "寺墩遗址", item: "石犁", desc: "农耕工具，农业发达" },
    { site: "福泉山遗址", item: "刻符陶豆", desc: "双鸟朝阳纹饰" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 38, fontWeight: "bold", color: C.text, marginBottom: 16, textAlign: "center" }}>良渚文化大纲</h1>
      </SlideUp>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
        {/* 早期 */}
        <WhiteCard>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ padding: "4px 14px", background: C.accent3, borderRadius: 8, color: "#fff", fontSize: 16, fontWeight: 600 }}>早期</div>
            <span style={{ fontSize: 16, color: C.textMid }}>距今约5300-4500年</span>
          </div>
          {early.map((e, i) => {
            const op = interpolate(frame, [15 + i * 8, 25 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={e.item} style={{ opacity: op, display: "flex", alignItems: "center", gap: 14, padding: "10px 16px", background: `${C.accent3}06`, borderRadius: 10, marginBottom: i < 2 ? 8 : 0 }}>
                <div style={{ fontSize: 20 }}>{["🏺", "⛏️", "🏺"][i]}</div>
                <div>
                  <span style={{ fontWeight: 700, color: C.text }}>{e.site}</span>
                  <span style={{ color: C.accent3, fontWeight: 600 }}> — {e.item}</span>
                  <div style={{ fontSize: 15, color: C.textMid, marginTop: 2 }}>{e.desc}</div>
                </div>
              </div>
            );
          })}
        </WhiteCard>

        {/* 晚期 */}
        <WhiteCard>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ padding: "4px 14px", background: C.accent, borderRadius: 8, color: "#fff", fontSize: 16, fontWeight: 600 }}>晚期</div>
            <span style={{ fontSize: 16, color: C.textMid }}>距今约4500-4000年</span>
          </div>
          {late.map((e, i) => {
            const op = interpolate(frame, [60 + i * 8, 70 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={e.item} style={{ opacity: op, display: "flex", alignItems: "center", gap: 14, padding: "10px 16px", background: `${C.accent}06`, borderRadius: 10, marginBottom: i < 3 ? 8 : 0 }}>
                <div style={{ fontSize: 20 }}>{["💎", "📿", "🪨", "🏺"][i]}</div>
                <div>
                  <span style={{ fontWeight: 700, color: C.text }}>{e.site}</span>
                  <span style={{ color: C.accent, fontWeight: 600 }}> — {e.item}</span>
                  <div style={{ fontSize: 15, color: C.textMid, marginTop: 2 }}>{e.desc}</div>
                </div>
              </div>
            );
          })}
        </WhiteCard>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景8：生成标题/宣传语 ====================
const GenerateTextScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 36, fontWeight: "bold", color: C.text, marginBottom: 16, letterSpacing: 1, textAlign: "center" }}>生成标题 · 宣传语 · 结束语</h1>
      </SlideUp>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ width: "94%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
          <KimiFrame>
            <ChatBubble type="user" text="请为本文拟一个恰当的标题，并撰写一段简介、宣传语和结束语。标题需为四字，宣传语总计十言，分为两句，每句各五字。" delay={10} />
            <ChatBubble type="ai" text="好的，为您生成如下内容：&#10;&#10;📌 标题：《良渚之光》&#10;&#10;📢 宣传语：&#10;「玉润中华，文明之光」&#10;&#10;📝 简介：&#10;良渚文化是中国新石器时代晚期高度发达的古文化...&#10;&#10;🙏 结束语：&#10;良渚遗址是中华文明的重要源头..." delay={35} />
          </KimiFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景9：润色修改 ========================
const RefineTextScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 36, fontWeight: "bold", color: C.text, marginBottom: 16, letterSpacing: 1, textAlign: "center" }}>润色修改 · 保存文档</h1>
      </SlideUp>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ width: "94%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
          <KimiFrame>
            <ChatBubble type="user" text="请对上面的内容进行修改：1.重拟标题为更简洁的形式 2.增加对玉琮王工艺的描述 3.精简结束语字数" delay={10} />
            <ChatBubble type="ai" text="已为您修改完成：&#10;&#10;📌 标题：《良渚遗韵》&#10;📢 宣传语：「五千年玉，华夏魂魄」&#10;📝 简介已更新...&#10;🙏 结束语已精简..." delay={35} />

            <FadeIn delay={55}>
              <div style={{ margin: "8px 24px 16px", padding: "14px 20px", background: `${C.accent2}10`, borderRadius: 12, border: `1px solid ${C.accent2}30`, textAlign: "center" }}>
                <span style={{ fontSize: 18, color: C.accent2, fontWeight: 600 }}>✅ 保存至「排版资料.docx」完成</span>
              </div>
            </FadeIn>
          </KimiFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景10：上传图片 ====================
const UploadImagesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const images = ["配图 (1).png", "配图 (2).png", "配图 (3).png", "配图 (4).png"];
  const imgLabels = ["玉琮", "玉钺", "陶器", "水稻田"];

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <StepBadge num={5} label="上传图片 · 图文匹配" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <FadeIn delay={8}>
          <WhiteCard>
            <div style={{ fontSize: 18, color: C.text, lineHeight: 1.7 }}>
              将图片素材上传至KIMI平台，输入提示词要求AI解析图片内容，匹配文字内容，指出应插入的具体位置。
            </div>
          </WhiteCard>
        </FadeIn>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {images.map((img, i) => {
            const op = interpolate(frame, [20 + i * 10, 32 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const y = interpolate(frame, [20 + i * 10, 35 + i * 10], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={img} style={{ opacity: op, transform: `translateY(${y}px)`, width: "44%", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                <Img src={staticFile(`liangzhu/images/${img}`)} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                <div style={{ padding: "8px 14px", background: C.bgCard }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: C.accent }}>{imgLabels[i]}</span>
                  <span style={{ fontSize: 13, color: C.textDim, marginLeft: 8 }}>{img}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景11：对比选图 ====================
const CompareImagesScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <StepBadge num={6} label="对比选图 · 视觉思考" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ width: "94%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
          <KimiFrame>
            {/* 两张对比图 */}
            <FadeIn delay={8}>
              <div style={{ display: "flex", gap: 12, padding: "12px 24px" }}>
                <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "2px solid #E5E7EB" }}>
                  <Img src={staticFile("liangzhu/images/可替换配图.png")} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                  <div style={{ padding: "6px 12px", background: C.bgCard, textAlign: "center", fontSize: 14, color: C.textMid }}>图片 A</div>
                </div>
                <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "2px solid C.accent" }}>
                  <Img src={staticFile("liangzhu/images/配图 (5).png")} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                  <div style={{ padding: "6px 12px", background: `${C.accent}10`, textAlign: "center", fontSize: 14, color: C.accent, fontWeight: 600 }}>图片 B ✓</div>
                </div>
              </div>
            </FadeIn>

            <ChatBubble type="user" text="请对比这两张图片，哪张与「玉琮王」这段文字更匹配？原因是什么？" delay={20} />
            <ChatBubble type="ai" text="分析结果：&#10;• 图片B与「玉琮王」段落更匹配&#10;• 原因：图片B展示了典型的玉琮形态，与文中描述的「神人兽面」图案一致&#10;• 建议：将图片B插入到玉琮王段落对应位置" delay={45} />
          </KimiFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景12：排版 ====================
const LayoutScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <StepBadge num={8} label="插入图片 · 图文排版" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <FadeIn delay={8}>
          <WhiteCard>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ padding: "6px 16px", background: C.accent, borderRadius: 8, color: "#fff", fontSize: 16, fontWeight: 600 }}>📄 排版资料.docx</div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <div style={{ padding: "6px 16px", background: C.accent2, borderRadius: 8, color: "#fff", fontSize: 16, fontWeight: 600 }}>📄 底版.docx → 设计稿</div>
            </div>
            <div style={{ fontSize: 18, color: C.text, lineHeight: 1.7 }}>
              将图片按照KIMI指定的位置插入排版资料.docx，然后将内容复制到底版.docx中，进行最终的图文排版。
            </div>
          </WhiteCard>
        </FadeIn>

        {/* 模拟文档预览 */}
        <FadeIn delay={25}>
          <div style={{ flex: 1, background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, boxShadow: C.shadowLg }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: "40%" }}>
                <div style={{ fontSize: 15, color: C.textDim, marginBottom: 8 }}>设计稿预览</div>
                <div style={{ aspectRatio: "3/4", background: `${C.accent3}08`, borderRadius: 10, border: `1px dashed ${C.accent3}40`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20 }}>
                  <span style={{ fontSize: 28, fontWeight: "bold", color: C.accent3, writingMode: "vertical-rl" }}>良渚之光</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    {[1,2,3,4,5,6,7].map(i => (
                      <div key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: `${C.accent}15`, border: `1px solid ${C.accent}30` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: C.textDim }}>底版.docx</span>
                </div>
              </div>
              <div style={{ flex: 1, fontSize: 16, color: C.text, lineHeight: 1.8 }}>
                <div style={{ fontWeight: 700, color: C.accent, marginBottom: 4 }}>玉琮王</div>
                <div style={{ color: C.textMid, marginBottom: 12 }}>反山遗址出土，体量最大、雕琢最精美的玉琮...</div>
                <div style={{ fontWeight: 700, color: C.accent, marginBottom: 4 }}>玉璜</div>
                <div style={{ color: C.textMid, marginBottom: 12 }}>瑶山遗址出土，良渚晚期玉器主流...</div>
                <div style={{ fontWeight: 700, color: C.accent, marginBottom: 4 }}>石犁</div>
                <div style={{ color: C.textDim }}>寺墩遗址出土，农耕工具...</div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景13：排版规则 ====================
const LayoutRulesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const rules = [
    { num: "1", label: "大标题", detail: "竖向文字 · 禹卫书法行书简体 · #8E3433 · 190号", color: C.accent3 },
    { num: "2", label: "宣传语", detail: "竖向文字 · 等线 · 二号加粗 · #8E3433", color: C.accent3 },
    { num: "3", label: "分类词", detail: "竖向文字 · 等线 · 二号加粗 · #8E3433", color: C.accent3 },
    { num: "4", label: "小标题", detail: "等线 · 小二号 · 加粗 · #AE9155（金棕色）", color: "#AE9155" },
    { num: "5", label: "正文", detail: "等线 · 五号 · 黑色 · 首行缩进2字符", color: C.text },
    { num: "6", label: "结束语", detail: "等线 · 11号 · 加粗 · #F7EBD3 · 1.5倍行距", color: C.accent2 },
    { num: "7", label: "图片", detail: "七处圆形位置放置对应配图", color: C.accent },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 36, fontWeight: "bold", color: C.text, marginBottom: 16, letterSpacing: 1, textAlign: "center" }}>排版规则</h1>
      </SlideUp>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        {rules.map((r, i) => {
          const op = interpolate(frame, [10 + i * 8, 20 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame, [10 + i * 8, 24 + i * 8], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={r.num} style={{ opacity: op, transform: `translateX(${x}px)`, display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: "bold", flexShrink: 0 }}>
                {r.num}
              </div>
              <div style={{ minWidth: 70 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: r.color }}>{r.label}</span>
              </div>
              <div style={{ fontSize: 16, color: C.textMid, lineHeight: 1.5 }}>{r.detail}</div>
            </div>
          );
        })}
      </div>

      <FadeIn delay={80}>
        <div style={{ marginTop: 12, padding: "12px 20px", background: `${C.accent2}10`, borderRadius: 10, border: `1px solid ${C.accent2}30`, textAlign: "center" }}>
          <span style={{ fontSize: 17, color: C.accent2, fontWeight: 600 }}>完成后保存为「设计稿.docx」</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景14：WPS AI ====================
const WPSAIScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - 8, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", padding: "40px 160px" }}>

      <SlideUp delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ padding: "6px 16px", borderRadius: 20, border: `1.5px solid ${C.accent2}40`, background: `${C.accent2}08` }}>
            <span style={{ color: C.accent2, fontSize: 20, fontWeight: 600, letterSpacing: 2 }}>巩固与拓展</span>
          </div>
        </div>
      </SlideUp>

      <SlideUp delay={3}>
        <h1 style={{ fontSize: 36, fontWeight: "bold", color: C.text, marginBottom: 16, letterSpacing: 1, textAlign: "center" }}>WPS AI 风格化处理</h1>
      </SlideUp>

      {/* 模拟 WPS AI 界面 */}
      <div style={{ transform: `scale(${scale})`, flex: 1 }}>
        <WhiteCard style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* WPS菜单栏 */}
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 16 }}>
            {["文件", "开始", "插入", "页面布局", "引用"].map((m) => (
              <div key={m} style={{ padding: "6px 16px", fontSize: 16, color: C.textMid, borderRadius: "6px 6px 0 0" }}>{m}</div>
            ))}
            <div style={{ padding: "6px 16px", fontSize: 16, color: "#fff", background: C.accent2, borderRadius: "6px 6px 0 0", fontWeight: 600 }}>WPS AI</div>
          </div>

          <div style={{ flex: 1 }}>
            <FadeIn delay={18}>
              <div style={{ fontSize: 19, color: C.text, lineHeight: 1.7, marginBottom: 14 }}>
                打开WPS Word，在菜单栏中选择<span style={{ color: C.accent2, fontWeight: "bold" }}>WPS AI</span>命令，可以按需选择风格或某种语言，将文本进行二次处理。
              </div>
            </FadeIn>

            <FadeIn delay={30}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {["文言文", "诗歌风", "新闻报道", "儿童故事", "广告文案"].map((style, i) => {
                  const op = interpolate(frame, [35 + i * 6, 43 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  return (
                    <div key={style} style={{ opacity: op, padding: "10px 20px", background: `${C.accent2}08`, borderRadius: 10, border: `1px solid ${C.accent2}30`, fontSize: 17, color: C.accent2, fontWeight: 500 }}>
                      {style}
                    </div>
                  );
                })}
              </div>
            </FadeIn>

            <FadeIn delay={50}>
              <div style={{ marginTop: 16, padding: "14px 20px", background: `${C.accent}08`, borderRadius: 12, border: `1px solid ${C.accent}30` }}>
                <span style={{ fontSize: 17, color: C.accent, fontWeight: 600 }}>替换文字 → 复制到设计稿 → 另存为「设计稿（风格化）.docx」</span>
              </div>
            </FadeIn>
          </div>
        </WhiteCard>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景15：总结 ====================
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });

  const takeaways = [
    { icon: "📝", label: "素材分析", desc: "用KIMI上传文档生成大纲" },
    { icon: "✍️", label: "文本生成", desc: "生成标题、宣传语、结束语" },
    { icon: "🔄", label: "内容润色", desc: "提示词调整、二次修改" },
    { icon: "🖼️", label: "图文匹配", desc: "AI分析图片、对比选图" },
    { icon: "📋", label: "排版设计", desc: "设计稿排版、字体配色" },
    { icon: "🎨", label: "风格拓展", desc: "WPS AI风格化处理" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #F0F4F8 0%, #EEF2FF 50%, #F0FDFA 100%)`, display: "flex", flexDirection: "column", padding: "50px 200px" }}>

      <div style={{ fontSize: 56, fontWeight: "bold", color: C.accent, transform: `scale(${scale})`, letterSpacing: 8, textAlign: "center" }}>
        课堂总结
      </div>

      <FadeIn delay={18}>
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {takeaways.map((t, i) => {
            const op = interpolate(frame, [22 + i * 6, 32 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={t.label} style={{ opacity: op, padding: "14px 20px", background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, minWidth: 140, textAlign: "center" }}>
                <div style={{ fontSize: 26 }}>{t.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 4 }}>{t.label}</div>
                <div style={{ fontSize: 14, color: C.textMid, marginTop: 2 }}>{t.desc}</div>
              </div>
            );
          })}
        </div>
      </FadeIn>

      <FadeIn delay={55}>
        <div style={{ marginTop: 28, color: C.textMid, fontSize: 22, letterSpacing: 3, textAlign: "center" }}>
          掌握AI辅助内容创作的完整工作流程
        </div>
      </FadeIn>

      <FadeIn delay={65}>
        <div style={{ marginTop: 20, color: C.accent3, fontSize: 24, letterSpacing: 4, textAlign: "center", fontWeight: 600 }}>
          感谢观看
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 音频偏移量 ====================
// TransitionSeries transition durations: 6,8,6,8,6,8,6,8,6,8,6,8,6,6
const OFFSETS = {
  title: 0,
  genai_intro: 0 + 252 + 6,          // 258
  genai_text: 258 + 627 + 8,         // 893
  task_intro: 893 + 742 + 6,         // 1641
  kimi_open: 1641 + 631 + 8,        // 2280
  upload_outline: 2280 + 698 + 6,   // 2984
  outline_result: 2984 + 761 + 8,   // 3753
  generate_text: 3753 + 774 + 6,    // 4533
  refine_text: 4533 + 740 + 8,      // 5281
  upload_images: 5281 + 755 + 6,    // 6042
  compare_images: 6042 + 540 + 8,   // 6590
  layout: 6590 + 786 + 6,           // 7382
  layout_rules: 7382 + 722 + 8,     // 8112
  wpsai: 8112 + 871 + 6,            // 8989
  summary: 8989 + 853 + 6,          // 9848
};
// TOTAL_FRAMES = 9848 + 777 = 10625 (used in Root.tsx composition config)

// ==================== 音轨 + 字幕层（顶层 Sequence） ====================
const AudioSubtitlesLayer: React.FC = () => {
  const scenes = [
    { key: "title", file: "s01_title.mp3" },
    { key: "genai_intro", file: "s02_genai_intro.mp3" },
    { key: "genai_text", file: "s03_genai_text.mp3" },
    { key: "task_intro", file: "s04_task_intro.mp3" },
    { key: "kimi_open", file: "s05_kimi_open.mp3" },
    { key: "upload_outline", file: "s06_upload_outline.mp3" },
    { key: "outline_result", file: "s07_outline_result.mp3" },
    { key: "generate_text", file: "s08_generate_text.mp3" },
    { key: "refine_text", file: "s09_refine_text.mp3" },
    { key: "upload_images", file: "s10_upload_images.mp3" },
    { key: "compare_images", file: "s11_compare_images.mp3" },
    { key: "layout", file: "s12_layout.mp3" },
    { key: "layout_rules", file: "s13_layout_rules.mp3" },
    { key: "wpsai", file: "s14_wpsai.mp3" },
    { key: "summary", file: "s15_summary.mp3" },
  ];

  return (
    <>
      {scenes.map((s) => {
        const offset = OFFSETS[s.key as keyof typeof OFFSETS];
        const dur = DURATIONS[s.key];
        return (
          <Sequence key={s.key} from={offset} durationInFrames={dur}>
            <Audio src={staticFile(`ai-text-gen/${s.file}`)} />
            <SubtitleBar sceneKey={s.key} />
          </Sequence>
        );
      })}
    </>
  );
};

// ==================== 主视频组件 ====================
export const AITextGen: React.FC = () => {
  return (
    <>
      {/* BGM（顶层，全程循环） */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.22} loop />

      {/* 音轨 + 字幕（顶层 Sequence，独立于 TransitionSeries） */}
      <AudioSubtitlesLayer />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.genai_intro}>
          <GenAIIntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.genai_text}>
          <GenAITextScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.task_intro}>
          <TaskIntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.kimi_open}>
          <KimiOpenScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.upload_outline}>
          <UploadOutlineScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.outline_result}>
          <OutlineResultScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.generate_text}>
          <GenerateTextScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.refine_text}>
          <RefineTextScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.upload_images}>
          <UploadImagesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.compare_images}>
          <CompareImagesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.layout}>
          <LayoutScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.layout_rules}>
          <LayoutRulesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.wpsai}>
          <WPSAIScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.summary}>
          <SummaryScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
