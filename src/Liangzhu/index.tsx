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
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

// ==================== 配色（白色系） ====================
const C = {
  bg: "#F8F9FC",
  bgCard: "#FFFFFF",
  bgCard2: "#F0F2F8",
  accent: "#2563EB",
  accent2: "#059669",
  accent3: "#D97706",
  text: "#1F2937",
  textDim: "#9CA3AF",
  textMid: "#6B7280",
  border: "#E5E7EB",
  shadow: "0 2px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 4px 24px rgba(0,0,0,0.08)",
};

// ==================== 可复用组件 ====================

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

// ==================== 时长配置（TTS 帧数 + 缓冲） ====================
const DURATIONS = {
  title: 163,          // TTS 133f + 30f
  overview: 404,       // TTS 354f + 50f
  mojiaoshan: 404,     // TTS 359f + 45f
  fanshan: 351,        // TTS 306f + 45f
  yaoshan_early: 346,  // TTS 301f + 45f
  maoshan: 426,        // TTS 381f + 45f
  huiguanshan: 400,    // TTS 355f + 45f
  outro: 357,          // TTS 317f + 40f
};

// ==================== 字幕文本 ====================
const SUBTITLE_TEXTS: Record<string, string> = {
  title: "良渚探秘。跨越千年，文明之光。",
  overview: "良渚文化是中国新石器时代晚期高度发达的古文化，距今约五千三百至四千年。分布于太湖流域，被誉为实证中华五千年文明史的圣地。",
  mojiaoshan: "良渚早期，距今约五千三百年。莫角山遗址是一处大型人工营建台地，发现有规模宏大的祭坛遗迹，反映了当时社会已具备高度组织能力。",
  fanshan: "反山遗址是良渚早期的贵族墓地。出土了大量精美玉器，等级分明，表明当时社会已经出现了明显的阶级分化。",
  yaoshan_early: "瑶山遗址是良渚早期的祭坛与墓葬复合遗址。出土了众多玉器，工艺精湛，展现了良渚先民高超的治玉技术。",
  maoshan: "良渚晚期，距今约四千五百年。茅山遗址发现了大规模水稻田遗迹，证明良渚先民已拥有发达的稻作农业，为文明提供了坚实的物质基础。",
  huiguanshan: "汇观山遗址和瑶山祭坛是良渚晚期的代表性遗址。出土了玉琮、玉璧等珍贵礼器，体现了良渚社会成熟的礼仪制度和信仰体系。",
  outro: "良渚遗址是中华文明的重要源头。这里高度发达的古文化，为实证中华五千年文明史提供了坚实依据。感谢观看。",
};

// ==================== 字幕组件 ====================
const SubtitleBar: React.FC<{ sceneKey: string; startFrame?: number; endFrame?: number }> = ({
  sceneKey, startFrame = 0, endFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const text = SUBTITLE_TEXTS[sceneKey] || "";
  const opacity = interpolate(frame, [startFrame, startFrame + 10, endFrame - 10, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 100, opacity }}>
      <div style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", borderRadius: 14, padding: "14px 36px", maxWidth: "88%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>
        <span style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 500, letterSpacing: 1.2, lineHeight: 1.6 }}>{text}</span>
      </div>
    </div>
  );
};

// ==================== 站点信息组件 ====================
const SiteInfo: React.FC<{ title: string; subtitle: string; period: string; delay?: number }> = ({
  title, subtitle, period, delay = 0,
}) => (
  <div style={{ textAlign: "center" }}>
    <SlideUp delay={delay}>
      <div style={{ display: "inline-block", padding: "8px 24px", borderRadius: 20, border: `1.5px solid ${C.accent}40`, backgroundColor: `${C.accent}08`, marginBottom: 16 }}>
        <span style={{ color: C.accent, fontSize: 22, fontWeight: 500, letterSpacing: 2 }}>{period}</span>
      </div>
    </SlideUp>
    <SlideUp delay={delay + 2}>
      <h1 style={{ fontSize: 46, fontWeight: "bold", color: C.text, marginBottom: 10, letterSpacing: 3 }}>{title}</h1>
    </SlideUp>
    <SlideUp delay={delay + 4}>
      <p style={{ color: C.textMid, fontSize: 22, letterSpacing: 1.5, margin: 0 }}>{subtitle}</p>
    </SlideUp>
  </div>
);

// ==================== 场景1：标题开场 ====================
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });
  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #F8F9FC 0%, #EEF2FF 50%, #ECFDF5 100%)`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px" }}>
      <Audio src={staticFile("liangzhu/lzh_title.mp3")} />
      <SubtitleBar sceneKey="title" startFrame={0} endFrame={DURATIONS.title} />

      {/* 装饰圆点 */}
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.3 }}>
        {Array.from({ length: 24 }, (_, i) => {
          const x = (i * 157 + 40) % 100;
          const y = (i * 97 + 30) % 100;
          const px = interpolate(frame, [0, 90], [x, x + (i % 7 - 3)]);
          const py = interpolate(frame, [0, 90], [y, y - 5 - (i % 5)]);
          return <div key={i} style={{ position: "absolute", left: `${px}%`, top: `${py}%`, width: 4 + (i % 5), height: 4 + (i % 5), borderRadius: "50%", backgroundColor: i % 3 === 0 ? C.accent : C.accent2, opacity: 0.12 + (i % 4) * 0.04 }} />;
        })}
      </div>

      <FadeIn delay={5}>
        <div style={{ padding: "10px 32px", borderRadius: 24, border: `1.5px solid ${C.accent3}40`, backgroundColor: `${C.accent3}08`, marginBottom: 36 }}>
          <span style={{ color: C.accent3, fontSize: 24, fontWeight: 500, letterSpacing: 4 }}>良渚文化</span>
        </div>
      </FadeIn>

      <div style={{ fontSize: 96, fontWeight: "bold", color: C.text, transform: `scale(${titleScale})`, fontFamily: "system-ui, sans-serif", letterSpacing: 12, textAlign: "center", lineHeight: 1.2 }}>
        良渚探秘
      </div>

      <div style={{ fontSize: 32, color: C.textMid, marginTop: 28, opacity: subtitleOpacity, letterSpacing: 6, textAlign: "center", lineHeight: 1.6 }}>
        跨越千年 · 文明之光
      </div>

      <div style={{ width: 120, height: 3, backgroundColor: C.accent3, marginTop: 28, opacity: lineOpacity, borderRadius: 2 }} />
    </AbsoluteFill>
  );
};

// ==================== 场景2：文化概述 ====================
const OverviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgProgress = spring({ frame: frame - 5, fps, config: { damping: 20 } });

  const facts = [
    { label: "年代", value: "5300 - 4000 年前" },
    { label: "地域", value: "太湖流域" },
    { label: "分期", value: "早期 / 晚期" },
    { label: "地位", value: "中华五千年文明实证" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "50px 40px" }}>
      <Audio src={staticFile("liangzhu/lzh_overview.mp3")} />
      <SubtitleBar sceneKey="overview" startFrame={0} endFrame={DURATIONS.overview} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          良渚文化概述
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 22, marginBottom: 20, letterSpacing: 2, textAlign: "center" }}>
          中国新石器时代晚期 · 高度发达的古文化
        </p>
      </SlideUp>

      {/* 图片 */}
      <div style={{ transform: `scale(${imgProgress})`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowLg, marginBottom: 20, maxWidth: 740 }}>
        <Img src={staticFile("liangzhu/images/配图 (6).png")} style={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />
      </div>

      {/* 关键信息卡片 */}
      <FadeIn delay={15}>
        <WhiteCard style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {facts.map((f, i) => {
              const op = interpolate(frame, [18 + i * 6, 26 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={f.label} style={{ opacity: op, textAlign: "center", minWidth: 140, padding: "12px 20px", background: C.bgCard2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 15, color: C.textDim, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: C.accent }}>{f.value}</div>
                </div>
              );
            })}
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景3：莫角山遗址 ====================
const MojiaoshanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgProgress = spring({ frame: frame - 8, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "50px 40px" }}>
      <Audio src={staticFile("liangzhu/lzh_mojiaoshan.mp3")} />
      <SubtitleBar sceneKey="mojiaoshan" startFrame={0} endFrame={DURATIONS.mojiaoshan} />

      <SiteInfo title="莫角山遗址" subtitle="大型人工台地 · 祭坛遗迹" period="良渚早期 · 约5300年前" />

      <div style={{ transform: `scale(${imgProgress})`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowLg, marginTop: 24, maxWidth: 740 }}>
        <Img src={staticFile("liangzhu/images/配图 (1).png")} style={{ width: "100%", maxHeight: 420, objectFit: "cover" }} />
      </div>

      <FadeIn delay={22}>
        <WhiteCard style={{ marginTop: 18, maxWidth: 760 }}>
          <p style={{ color: C.text, fontSize: 20, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            <span style={{ color: C.accent, fontWeight: "bold" }}>莫角山</span>
            是一处人工营建的巨型台地，发现规模宏大的
            <span style={{ color: C.accent2, fontWeight: "bold" }}>祭坛</span>
            ，反映良渚社会具有高度组织协调能力
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景4：反山遗址 ====================
const FanshanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgProgress = spring({ frame: frame - 8, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "50px 40px" }}>
      <Audio src={staticFile("liangzhu/lzh_fanshan.mp3")} />
      <SubtitleBar sceneKey="fanshan" startFrame={0} endFrame={DURATIONS.fanshan} />

      <SiteInfo title="反山遗址" subtitle="贵族墓地 · 精美玉器" period="良渚早期 · 约5300年前" />

      <div style={{ transform: `scale(${imgProgress})`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowLg, marginTop: 24, maxWidth: 740 }}>
        <Img src={staticFile("liangzhu/images/配图 (2).png")} style={{ width: "100%", maxHeight: 420, objectFit: "cover" }} />
      </div>

      <FadeIn delay={22}>
        <WhiteCard style={{ marginTop: 18, maxWidth: 760 }}>
          <p style={{ color: C.text, fontSize: 20, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            <span style={{ color: C.accent, fontWeight: "bold" }}>反山遗址</span>
            出土大量精美玉器，墓葬等级分明，表明良渚社会已出现
            <span style={{ color: C.accent3, fontWeight: "bold" }}>明显的阶级分化</span>
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景5：瑶山遗址（早期） ====================
const YaoshanEarlyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgProgress = spring({ frame: frame - 8, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "50px 40px" }}>
      <Audio src={staticFile("liangzhu/lzh_yaoshan_early.mp3")} />
      <SubtitleBar sceneKey="yaoshan_early" startFrame={0} endFrame={DURATIONS.yaoshan_early} />

      <SiteInfo title="瑶山遗址" subtitle="祭坛与墓葬复合 · 治玉技术" period="良渚早期 · 约5300年前" />

      <div style={{ transform: `scale(${imgProgress})`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowLg, marginTop: 24, maxWidth: 740 }}>
        <Img src={staticFile("liangzhu/images/配图 (3).png")} style={{ width: "100%", maxHeight: 420, objectFit: "cover" }} />
      </div>

      <FadeIn delay={22}>
        <WhiteCard style={{ marginTop: 18, maxWidth: 760 }}>
          <p style={{ color: C.text, fontSize: 20, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            <span style={{ color: C.accent, fontWeight: "bold" }}>瑶山遗址</span>
            是祭坛与墓葬复合遗址，出土玉器
            <span style={{ color: C.accent2, fontWeight: "bold" }}>工艺精湛</span>
            ，展现良渚先民高超的治玉技艺
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景6：茅山遗址 ====================
const MaoshanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgProgress = spring({ frame: frame - 8, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "50px 40px" }}>
      <Audio src={staticFile("liangzhu/lzh_maoshan.mp3")} />
      <SubtitleBar sceneKey="maoshan" startFrame={0} endFrame={DURATIONS.maoshan} />

      <SiteInfo title="茅山遗址" subtitle="大规模水稻田 · 发达农业" period="良渚晚期 · 约4500年前" />

      <div style={{ transform: `scale(${imgProgress})`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowLg, marginTop: 24, maxWidth: 740 }}>
        <Img src={staticFile("liangzhu/images/配图 (4).png")} style={{ width: "100%", maxHeight: 420, objectFit: "cover" }} />
      </div>

      <FadeIn delay={22}>
        <WhiteCard style={{ marginTop: 18, maxWidth: 760 }}>
          <p style={{ color: C.text, fontSize: 20, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            <span style={{ color: C.accent, fontWeight: "bold" }}>茅山遗址</span>
            发现大规模水稻田遗迹，证明良渚先民已拥有
            <span style={{ color: C.accent2, fontWeight: "bold" }}>发达的稻作农业</span>
            ，为文明提供坚实物质基础
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景7：汇观山遗址 ====================
const HuiguanshanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgProgress = spring({ frame: frame - 8, fps, config: { damping: 20 } });

  const artifacts = [
    { label: "玉琮", desc: "天圆地方礼器" },
    { label: "玉璧", desc: "祭天礼器" },
    { label: "祭坛", desc: "祭祀活动中心" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "50px 40px" }}>
      <Audio src={staticFile("liangzhu/lzh_huiguanshan.mp3")} />
      <SubtitleBar sceneKey="huiguanshan" startFrame={0} endFrame={DURATIONS.huiguanshan} />

      <SiteInfo title="汇观山遗址" subtitle="玉琮玉璧 · 礼仪制度" period="良渚晚期 · 约4500年前" />

      <div style={{ transform: `scale(${imgProgress})`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowLg, marginTop: 24, maxWidth: 740 }}>
        <Img src={staticFile("liangzhu/images/配图 (5).png")} style={{ width: "100%", maxHeight: 380, objectFit: "cover" }} />
      </div>

      <FadeIn delay={18}>
        <WhiteCard style={{ marginTop: 16, maxWidth: 760 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {artifacts.map((a, i) => {
              const op = interpolate(frame, [20 + i * 6, 28 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={a.label} style={{ opacity: op, textAlign: "center", padding: "12px 24px", background: C.bgCard2, borderRadius: 12, border: `1px solid ${C.border}`, flex: "1 0 auto", minWidth: 140 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.accent3 }}>{a.label}</div>
                  <div style={{ fontSize: 16, color: C.textMid, marginTop: 4 }}>{a.desc}</div>
                </div>
              );
            })}
          </div>
        </WhiteCard>
      </FadeIn>

      <FadeIn delay={28}>
        <WhiteCard style={{ marginTop: 14, maxWidth: 760 }}>
          <p style={{ color: C.text, fontSize: 20, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            体现了良渚社会成熟的<strong style={{ color: C.accent }}>礼仪制度</strong>和
            <strong style={{ color: C.accent3 }}>信仰体系</strong>
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景8：结尾 ====================
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #F8F9FC 0%, #EEF2FF 50%, #ECFDF5 100%)`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "50px 40px" }}>
      <Audio src={staticFile("liangzhu/lzh_outro.mp3")} />
      <SubtitleBar sceneKey="outro" startFrame={0} endFrame={DURATIONS.outro} />

      {/* 背景图片淡入 */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.12 }}>
        <Img src={staticFile("liangzhu/images/配图 (7).png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div style={{ fontSize: 64, fontWeight: "bold", color: C.accent, transform: `scale(${scale})`, letterSpacing: 8, textAlign: "center" }}>
        良渚探秘
      </div>

      <FadeIn delay={18}>
        <div style={{ marginTop: 24, fontSize: 28, color: C.textMid, letterSpacing: 4, textAlign: "center" }}>
          穿越五千年的文明对话
        </div>
      </FadeIn>

      <FadeIn delay={32}>
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {["莫角山", "反山", "瑶山", "茅山", "汇观山", "玉琮", "玉璧", "水稻田"].map((tag) => (
            <span key={tag} style={{ color: C.accent, fontSize: 18, padding: "8px 20px", borderRadius: 22, border: `1.5px solid ${C.accent}40`, backgroundColor: `${C.accent}08` }}>
              {tag}
            </span>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={48}>
        <div style={{ marginTop: 32, color: C.accent3, fontSize: 24, letterSpacing: 4, textAlign: "center", fontWeight: 600 }}>
          实证中华五千年文明史的圣地
        </div>
      </FadeIn>

      <FadeIn delay={58}>
        <div style={{ marginTop: 28, color: C.textMid, fontSize: 22, letterSpacing: 3, textAlign: "center" }}>
          感谢观看
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 主视频组件 ====================
export const Liangzhu: React.FC = () => {
  return (
    <>
      {/* BGM - 低音量 */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.24} loop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.overview}>
          <OverviewScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.mojiaoshan}>
          <MojiaoshanScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.fanshan}>
          <FanshanScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.yaoshan_early}>
          <YaoshanEarlyScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.maoshan}>
          <MaoshanScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.huiguanshan}>
          <HuiguanshanScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
