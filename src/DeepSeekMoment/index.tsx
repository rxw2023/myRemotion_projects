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
import { ParallaxLayer } from "../shared/components";

// ==================== Vox 4.0 纸艺拼贴配色 ====================
const C = {
  paper: "#ECE9E1", // 淡网格纸底
  ink: "#1A1A1A", // 油墨黑
  inkSoft: "#3A3A3A",
  beige: "#C9BB9C", // 档案米
  red: "#D62E1F", // 强调红
  coral: "#E8625C", // 珊瑚红（剪纸底衬橙）
  orange: "#E8683A", // 橙（剪纸底衬）
  teal: "#2B697A", // 哑光青蓝
  blue: "#2B697A", // 与 teal 同源（场景强调用）
  yellow: "#D9A441", // 芥末黄
  highlight: "#F2C14E", // 高亮黄（底部下划）
  mustard: "#E5A93C",
  green: "#3E8E5A", // 纸质绿
  card: "#FCFBF7", // 近白卡
  card2: "#E4DfCe", // 纸米
  line: "#D2CBB8",
  soft: "#8C8C8C", // 半调灰
};

// ==================== 场景时长（英文 TTS 实测帧数 + 30f 缓冲） ====================
// 数值来源于 public/deepseek-moment/durations_deepseek.json
const DURATIONS = {
  s1: 750, // 24.00s → 720f + 30f
  s2: 528, // 16.61s → 498f + 30f
  s3: 526, // 16.56s → 496f + 30f
  s4: 611, // 19.39s → 581f + 30f
  s5: 716, // 22.87s → 686f + 30f
  s6: 585, // 18.50s → 555f + 30f
  s7: 586, // 18.55s → 556f + 30f
  s8: 506, // 15.89s → 476f + 30f
};

// 封面帧数 + 转场
const COVER_FRAMES = 110;
const TRANSITION_FADE = 6;
const TRANSITION_SLIDE = 8;

// TOTAL = Σ(封面+场景) − Σ转场 = (110+4808) − 54 = 4864
// （封面→s1 的 fade 6 并入总计）
export const TOTAL_FRAMES = 4864;

// ==================== 字幕文本（英文，与英文旁白一致） ====================
const SUBTITLE_TEXTS: Record<string, string> = {
  s1: "On Jan 27, 2025, Nvidia lost $589 billion in market value in a single day — the biggest one-day collapse in history. There was no bad news. Instead, a Chinese lab called DeepSeek released a free, open-source reasoning model, R1. Overnight, the whole AI industry had to redo the math.",
  s2: "This wasn't a tech giant. DeepSeek was founded in 2023, and its parent was a quant trading fund called High-Flyer. No splashy marketing, no venture hype — just a group of engineers quietly training big models in a server room in Hangzhou.",
  s3: "But it started with the worst hand. US export controls meant it could not buy the top AI chips, only restricted models. And because it could not get the best cards, it had to squeeze every ounce of compute. The limit became its strongest weapon.",
  s4: "In late 2024, DeepSeek released V3 and revealed a number that stunned the industry. Its reported training cost was about $5.6 million. To match that, American labs often spend hundreds of millions. The comparison hit the industry like a stone in a still lake.",
  s5: "The secret wasn't brute force — it was architecture. Mixture of experts activates only part of its parameters per token. Multi-head latent attention cut memory overhead. GRPO skipped the tedious SFT stage and trained with pure reinforcement learning. One clever structure saved the cost of thousands of chips.",
  s6: "Then came the real detonator. January 2025. R1 launched, matching OpenAI's top reasoning model, completely open source, with an API ridiculously cheap. Within days it hit the top of the App Store, and developers around the world rushed in.",
  s7: "And so came the moment. One open-source model, almost overnight, made the market question the assumption that more compute is always better. Nvidia's stock didn't fall because it was bad. It fell because people realized it might not have to be so expensive.",
  s8: "DeepSeek's story is not a Chinese company catching up to America. It is a small team using one open model to reshuffle a trillion-dollar compute narrative. When needing less becomes possible, the real rules of this race are only starting to be rewritten.",
};

// ==================== 可复用组件 ====================

// 大字标题：编辑风 + 红色下划线扫入
const PageTitle: React.FC<{ kicker?: string; title: string; accent?: string }> = ({
  kicker,
  title,
  accent = C.red,
}) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [22, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <PopIn>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {kicker ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 18, height: 18, background: accent, flexShrink: 0 }} />
          <span
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 3,
              color: accent,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </span>
        </div>
      ) : null}
      <h2
        style={{
          fontSize: 74,
          fontWeight: 900,
          color: C.ink,
          margin: 0,
          lineHeight: 1.02,
          letterSpacing: 0.5,
          textShadow: "4px 4px 0 rgba(26,26,26,0.10)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          height: 12,
          background: C.highlight,
          width: `${sweep * 100}%`,
          maxWidth: 640,
          transform: "skewX(-12deg)",
          boxShadow: "3px 3px 0 rgba(26,26,26,0.12)",
        }}
      />
    </div>
    </PopIn>
  );
};

// 硬投影剪纸卡（替代柔和白卡）
const PaperCard: React.FC<{
  children: React.ReactNode;
  color?: string;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ children, color = C.ink, rotate = -0.6, style }) => (
  <div
    style={{
      background: C.card,
      border: `3px solid ${color}`,
      borderRadius: 14,
      boxShadow: "7px 7px 0 rgba(26,26,26,0.16)",
      padding: "22px 28px",
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}
  >
    {children}
  </div>
);

// 网格纸叠层（铺满画布）—— Vox 纪录片背景
const PaperOverlay: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      backgroundColor: "rgba(255,255,255,0.0)",
      backgroundImage:
        "linear-gradient(rgba(26,26,26,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,26,0.05) 1px, transparent 1px)",
      backgroundSize: "86px 86px",
    }}
  />
);

// 数字跳升（大号冲击数字）
const CountUp: React.FC<{
  to: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
}> = ({ to, prefix = "", suffix = "", fontSize = 88, color = C.red }) => {
  const frame = useCurrentFrame();
  const p = Math.min(1, frame / 60);
  const cur = Math.round(to * (1 - Math.pow(1 - p, 3)));
  return (
    <div style={{ fontSize, fontWeight: 900, color, lineHeight: 1 }}>
      {prefix}
      {cur.toLocaleString("en-US")}
      {suffix}
    </div>
  );
};

// 标注贴纸（内联：来源/强调标签）
const Marker: React.FC<{
  children: React.ReactNode;
  kind?: "circle" | "arrow" | "label";
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, kind = "label", color = C.red, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      ...(kind === "circle"
        ? { width: 110, height: 110, borderRadius: "50%", border: `6px solid ${color}` }
        : kind === "arrow"
          ? { background: C.card, border: `3px solid ${color}`, borderRadius: 10, padding: "8px 16px", fontWeight: 800, color, fontSize: 24 }
          : { background: C.yellow, borderRadius: 8, padding: "4px 14px", fontWeight: 800, color: C.ink, fontSize: 22, transform: "rotate(-3deg)" }),
      ...style,
    }}
  >
    {children}
  </span>
);

// 顶部装饰线（纸片条）
const PaperRibbon: React.FC<{ color?: string }> = ({ color = C.red }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 8,
      background: color,
    }}
  />
);

// 顶部章节标签
const Chapter: React.FC<{ text: string; color?: string }> = ({ text, color = C.blue }) => (
  <span
    style={{
      display: "inline-block",
      background: C.card,
      color,
      border: `2.5px solid ${color}`,
      borderRadius: 12,
      padding: "8px 24px",
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: 2,
      boxShadow: "0 4px 0 rgba(20,22,26,0.08)",
    }}
  >
    {text}
  </span>
);

// 纸片弹入（spring 过冲回弹 + 微旋转）—— Vox 节奏
const PopIn: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 190, mass: 0.7 },
  });
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotate = interpolate(s, [0, 1], [-7, 0]);
  return (
    <div style={{ opacity, transform: `scale(${s}) rotate(${rotate}deg)`, transformOrigin: "center", ...style }}>
      {children}
    </div>
  );
};

// 英文字幕（与英文旁白对齐，位置下移不挡内容）
const VoxSub: React.FC<{
  text: string;
  startFrame?: number;
  endFrame?: number;
  fontSize?: number;
}> = ({ text, startFrame = 0, endFrame = 9999, fontSize = 34 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 12, endFrame - 12, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
        opacity,
        padding: "0 20px",
      }}
    >
      <div
        style={{
          background: "rgba(26,26,26,0.52)",
          backdropFilter: "blur(3px)",
          borderRadius: 12,
          padding: "12px 26px",
          maxWidth: "92%",
          textAlign: "center",
          boxShadow: "0 4px 18px rgba(0,0,0,0.24)",
        }}
      >
        <div style={{ color: "#fff", fontSize, fontWeight: 800, letterSpacing: 0.4, lineHeight: 1.4 }}>
          {text}
        </div>
      </div>
    </div>
  );
};

// ==================== 场景1：开场钩子（股价崩塌 + 视差） ====================
// Catmull-Rom 样条 → 平滑贝塞尔路径
const smoothPath = (pts: [number, number][]): string => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

const CrashLine: React.FC<{ color?: string }> = ({ color = C.red }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 平滑崩塌曲线：高位平走 → 平滑下坠 → 低位走平
  const steps = 130;
  const pts: [number, number][] = [];
  const W = 900;
  const highY = 70;
  const lowY = 345;
  const startX = 0.38;
  const endX = 0.86;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    let t = (x / W - startX) / (endX - startX);
    t = Math.max(0, Math.min(1, t));
    const s = t * t * (3 - 2 * t); // smoothstep
    pts.push([x, highY + (lowY - highY) * s]);
  }
  const limit = Math.max(1, Math.floor(progress * steps));
  const clipPts = pts.slice(0, limit + 1);
  const d = smoothPath(clipPts);
  return (
    <svg width={920} height={420} viewBox="0 0 920 420">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line
          key={i}
          x1={0}
          y1={60 + i * 45}
          x2={920}
          y2={60 + i * 45}
          stroke={C.line}
          strokeWidth={1.5}
        />
      ))}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const numScale = spring({
    frame,
    fps: useVideoConfig().fps,
    config: { damping: 12, stiffness: 160 },
  });
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 32,
      }}
    >
      <Audio src={staticFile("deepseek-moment/ds_s1.mp3")} />
      <VoxSub text={SUBTITLE_TEXTS.s1} endFrame={DURATIONS.s1} fontSize={32} />
      <PaperRibbon color={C.red} />

      <Chapter text="THE DEEPSEEK MOMENT · 01" color={C.red} />
      <PageTitle kicker="A RECORD NUMBER" title="$589B in One Day" accent={C.red} />

      <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
        {/* 视差数据面板 */}
        <div style={{ position: "relative", flex: 1, minHeight: 460 }}>
          <ParallaxLayer depth={0.3}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(29,78,216,0.06)",
                borderRadius: 24,
                border: `2px solid ${C.blue}22`,
              }}
            />
          </ParallaxLayer>
          <ParallaxLayer depth={0.8}>
            <CrashLine />
          </ParallaxLayer>
          {/* 聚焦放大镜 */}
          <div style={{ position: "absolute", right: 40, bottom: 170, transform: `scale(${numScale})` }}>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                border: `8px solid ${C.ink}`,
                background: C.card,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 0 rgba(20,22,26,0.12)",
              }}
            >
              <span style={{ fontSize: 34, fontWeight: 900, color: C.red }}>-17%</span>
              <span style={{ fontSize: 18, color: C.soft }}>single day</span>
            </div>
          </div>
        </div>

        {/* 右侧：股市照片 + 数字 */}
        <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 24 }}>
          <TickerArt width={420} height={260} />
          <PopIn delay={24}>
          <div
            style={{
              background: C.card,
              border: `3px solid ${C.ink}`,
              borderRadius: 20,
              padding: "24px 32px",
              boxShadow: "8px 8px 0 rgba(26,26,26,0.16)",
            }}
          >
            <div style={{ fontSize: 24, color: C.soft, fontWeight: 700 }}>Market cap lost in a day</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: C.orange }} />
              <CountUp to={589} prefix="$" suffix="B" fontSize={78} color={C.ink} />
            </div>
            <div style={{ fontSize: 20, color: C.soft, marginTop: 8 }}>Biggest single-day drop in history</div>
          </div>
          </PopIn>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景2：这是谁（剪影 + 反差） ====================
const OriginScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 36,
      }}
    >
      <Audio src={staticFile("deepseek-moment/ds_s2.mp3")} />
      <VoxSub text={SUBTITLE_TEXTS.s2} endFrame={DURATIONS.s2} fontSize={32} />
      <PaperRibbon color={C.blue} />

      <Chapter text="WHO IS DEEPSEEK · 02" color={C.blue} />
      <PageTitle kicker="WHO IS THIS?" title="A Quant Fund That Built an AI Lab" accent={C.blue} />

      <div style={{ display: "flex", gap: 56, alignItems: "stretch" }}>
        <TeamArt width={520} height={620} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 两张人物卡形成反差 */}
          <PaperCard style={{ border: `2.5px solid ${C.ink}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span
                style={{
                  background: C.red,
                  color: "#fff",
                  borderRadius: 10,
                  padding: "6px 18px",
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                GIANT
              </span>
              <span style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>Silicon Valley AI Lab</span>
            </div>
            <p style={{ fontSize: 26, color: C.inkSoft, margin: "14px 0 0 0", lineHeight: 1.6 }}>
              Burns $100M+ · Top chips · Big team
            </p>
          </PaperCard>

          <PaperCard style={{ border: `2.5px solid ${C.blue}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span
                style={{
                  background: C.blue,
                  color: "#fff",
                  borderRadius: 10,
                  padding: "6px 18px",
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                NEWCOMER
              </span>
              <span style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>DeepSeek</span>
            </div>
            <p style={{ fontSize: 26, color: C.inkSoft, margin: "14px 0 0 0", lineHeight: 1.6 }}>
              Hangzhou server room · Quant DNA · Founded 2023
            </p>
          </PaperCard>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              background: C.card2,
              border: `3px solid ${C.ink}`,
              borderRadius: 16,
              padding: "18px 26px",
              boxShadow: "7px 7px 0 rgba(26,26,26,0.14)",
              transform: "rotate(0.6deg)",
            }}
          >
            <CutoutFigure variant="worker" width={104} height={150} />
            <span style={{ fontSize: 40, color: C.ink, fontWeight: 900 }}>⇄</span>
            <CutoutFigure variant="suit" width={104} height={150} />
            <div style={{ marginLeft: 14 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.ink }}>Quant Fund ⇄ AI Lab</div>
              <div style={{ fontSize: 22, color: C.inkSoft, marginTop: 4 }}>
                Market money funding big models
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景3：被逼出来的优势（地图 + 芯片） ====================
const ChipScene: React.FC = () => {
  const frame = useCurrentFrame();
  const arrowX = interpolate(frame, [30, 70], [-160, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 32,
      }}
    >
      <Audio src={staticFile("deepseek-moment/ds_s3.mp3")} />
      <VoxSub text={SUBTITLE_TEXTS.s3} endFrame={DURATIONS.s3} fontSize={32} />
      <PaperRibbon color={C.yellow} />

      <Chapter text="THE CONSTRAINT · 03" color={C.yellow} />
      <PageTitle kicker="A CONSTRAINT, TURNED WEAPON" title="No Top Chips? They Invented Efficiency" accent={C.yellow} />

      <div style={{ display: "flex", gap: 52, alignItems: "center" }}>
        <ChinaMap width={460} height={440} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <GpuCutout width={180} height={180} />
            <span style={{ fontSize: 60, transform: `translateX(${arrowX}px)`, color: C.ink }}>✕</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: C.red }}>
              Top chips
              <br />
              <span style={{ color: C.soft, fontWeight: 600, fontSize: 24 }}>Export controls · can't buy</span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: C.card,
              border: `2.5px solid ${C.ink}`,
              borderRadius: 16,
              padding: "20px 28px",
              boxShadow: "0 6px 0 rgba(20,22,26,0.08)",
            }}
          >
            <span style={{ fontSize: 40 }}>→</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: C.green }}>
              Restricted models only · Squeeze every ounce of compute
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: C.card2,
              borderRadius: 16,
              padding: "18px 26px",
            }}
          >
            <span style={{ fontSize: 34 }}>💡</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: C.inkSoft }}>
              The limit became its strongest weapon.
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景4：那个数字（成本对比柱状图） ====================
const CostScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 32,
      }}
    >
      <Audio src={staticFile("deepseek-moment/ds_s4.mp3")} />
      <VoxSub text={SUBTITLE_TEXTS.s4} endFrame={DURATIONS.s4} fontSize={32} />
      <PaperRibbon color={C.red} />

      <Chapter text="THE REVEAL · 04" color={C.red} />
      <PageTitle kicker="THE NUMBER THAT STOPPED THE INDUSTRY" title="How Cheap Can Training Get?" accent={C.red} />

      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        {/* 真实数据对比卡 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 44, alignItems: "stretch" }}>
            <PopIn>
              <PaperCard color={C.teal} rotate={-0.6} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 24, color: C.soft, fontWeight: 700 }}>DeepSeek V3 · Reported</div>
                <div style={{ fontSize: 82, fontWeight: 900, color: C.ink, lineHeight: 1, marginTop: 10 }}>
                  <span style={{ color: C.orange }}>$</span>5.6M
                </div>
                <div style={{ fontSize: 20, color: C.soft, marginTop: 8 }}>Training compute cost (V3 tech report)</div>
              </PaperCard>
            </PopIn>
            <div style={{ display: "flex", alignItems: "center", fontSize: 42, fontWeight: 900, color: C.ink }}>vs</div>
            <PopIn delay={24}>
              <PaperCard color={C.red} rotate={0.6} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 24, color: C.soft, fontWeight: 700 }}>Comparable models · Estimated</div>
                <div style={{ fontSize: 82, fontWeight: 900, color: C.ink, lineHeight: 1, marginTop: 10 }}>
                  <span style={{ color: C.red }}>$</span>100M+
                </div>
                <div style={{ fontSize: 20, color: C.soft, marginTop: 8 }}>GPT-4 etc. (SemiAnalysis est.)</div>
              </PaperCard>
            </PopIn>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <Marker kind="label" color={C.yellow}>≈ 18× gap</Marker>
            <span style={{ fontSize: 22, color: C.inkSoft, fontWeight: 700 }}>
              Real numbers · DeepSeek V3 tech report / SemiAnalysis et al.
            </span>
          </div>
        </div>

        <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              background: C.card,
              border: `3px solid ${C.ink}`,
              borderRadius: 20,
              padding: "28px 32px",
              boxShadow: "8px 8px 0 rgba(26,26,26,0.16)",
            }}
          >
            <div style={{ fontSize: 22, color: C.soft, fontWeight: 700 }}>V3 reported training cost</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: C.orange, flexShrink: 0 }} />
              <div style={{ fontSize: 62, fontWeight: 900, color: C.ink, lineHeight: 1 }}>$5.6M</div>
            </div>
            <div style={{ fontSize: 20, color: C.soft, marginTop: 6 }}>USD · DeepSeek V3 tech report</div>
          </div>
          <div
            style={{
              background: C.card2,
              borderRadius: 16,
              padding: "18px 26px",
              fontSize: 26,
              fontWeight: 700,
              color: C.inkSoft,
              lineHeight: 1.6,
            }}
          >
            A stone dropped into a still lake.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景5：秘密在架构（图解） ====================
const ArchScene: React.FC = () => {
  const frame = useCurrentFrame();
  const tokenScale = 1 + 0.8 * Math.sin((frame / 30) * Math.PI * 0.5);
  const cards = [
    { name: "Mixture of Experts", zh: "MoE", desc: "Activates only part of parameters per token", color: C.blue },
    { name: "Multi-head Latent Attention", zh: "MLA", desc: "Cuts memory overhead", color: C.green },
    { name: "GRPO", zh: "GRPO", desc: "Skips SFT, trains with pure RL", color: C.yellow },
  ];
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 30,
      }}
    >
      <Audio src={staticFile("deepseek-moment/ds_s5.mp3")} />
      <VoxSub text={SUBTITLE_TEXTS.s5} endFrame={DURATIONS.s5} fontSize={32} />
      <PaperRibbon color={C.green} />

      <Chapter text="THE SECRET · 05" color={C.green} />
      <PageTitle kicker="NOT BRUTE FORCE" title="One Clever Structure Saves Compute" accent={C.green} />

      <div style={{ display: "flex", gap: 40 }}>
        {/* token 路由示意 */}
        <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              background: C.card,
              border: `2.5px solid ${C.ink}`,
              borderRadius: 14,
              padding: "14px 22px",
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: i === 2 || i === 5 ? C.ink : C.card2,
                  border: `2px solid ${C.ink}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${i === 2 || i === 5 ? tokenScale : 1})`,
                  fontSize: 18,
                  fontWeight: 900,
                  color: i === 2 || i === 5 ? C.card : C.soft,
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: C.green }}>↑ Only part of experts active</span>
          <CircuitArt width={360} height={230} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {cards.map((c, i) => (
            <PopIn key={i} delay={i * 12}>
              <PaperCard style={{ border: `2.5px solid ${c.color}`, display: "flex", gap: 20, alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#fff",
                    background: c.color,
                    borderRadius: 8,
                    padding: "6px 18px",
                    minWidth: 150,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {c.zh}
                </span>
                <span style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>{c.name}</span>
                <span style={{ fontSize: 24, color: C.soft, marginLeft: "auto" }}>{c.desc}</span>
              </PaperCard>
            </PopIn>
          ))}
          <div style={{ fontSize: 24, color: C.inkSoft, fontWeight: 700, lineHeight: 1.6 }}>
            The structure saved the cost of thousands of chips.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景6：R1 + 开源（时间轴） ====================
const ReleaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const nodes = [
    { label: "2024.12", text: "DeepSeek V3", color: C.blue },
    { label: "2025.1", text: "DeepSeek R1", color: C.red },
    { label: "Open Source", text: "MIT license", color: C.green },
    { label: "Viral", text: "App Store #1", color: C.yellow },
  ];
  const progress = interpolate(frame, [0, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 34,
      }}
    >
      <Audio src={staticFile("deepseek-moment/ds_s6.mp3")} />
      <VoxSub text={SUBTITLE_TEXTS.s6} endFrame={DURATIONS.s6} fontSize={32} />
      <PaperRibbon color={C.blue} />

      <Chapter text="THE RELEASE · 06" color={C.blue} />
      <PageTitle kicker="THE REAL DETONATOR" title="One Open Model, Global in Weeks" accent={C.blue} />

      {/* 时间轴 */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, position: "relative" }}>
        <div style={{ position: "absolute", left: 60, right: 60, top: "50%", height: 6, background: C.line }} />
        <div
          style={{
            position: "absolute",
            left: 60,
            top: "50%",
            height: 6,
            background: C.blue,
            width: `${progress * (100 - 120 / (920))}%`,
          }}
        />
        {nodes.map((n, i) => {
          const active = progress > i / (nodes.length - 1);
          return (
            <PopIn key={i} delay={i * 22} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, flex: 1 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: active ? n.color : C.card2,
                    border: `3px solid ${n.color}`,
                    zIndex: 2,
                    boxShadow: active ? "0 0 0 8px rgba(20,22,26,0.06)" : "none",
                  }}
                />
                <div style={{ fontSize: 26, fontWeight: 900, color: n.color }}>{n.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{n.text}</div>
              </div>
            </PopIn>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
        <DevArt width={420} height={260} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: C.card,
              border: `2.5px solid ${C.ink}`,
              borderRadius: 16,
              padding: "20px 28px",
              boxShadow: "0 6px 0 rgba(20,22,26,0.08)",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 900, color: C.green }}>Free to download · API absurdly cheap</span>
          </div>
          <div style={{ fontSize: 24, color: C.inkSoft, fontWeight: 700 }}>
            Developers around the world rushed in.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景7：DeepSeek 时刻（视差 + 重算） ====================
const MomentScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 36,
      }}
    >
      <Audio src={staticFile("deepseek-moment/ds_s7.mp3")} />
      <VoxSub text={SUBTITLE_TEXTS.s7} endFrame={DURATIONS.s7} fontSize={32} />
      <PaperRibbon color={C.red} />

      <Chapter text="THE MOMENT · 07" color={C.red} />
      <PageTitle kicker="THE MOMENT" title="From One Model, A Trillion-Dollar Reset" accent={C.red} />

      {/* 视差：一个小模型 → 放大到市场 */}
      <div style={{ position: "relative", height: 380 }}>
        <ParallaxLayer depth={0.3}>
          <CrashLine color={C.red} />
        </ParallaxLayer>
        <ParallaxLayer depth={1.1}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 30,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <span
              style={{
                background: C.card,
                border: `2.5px solid ${C.ink}`,
                borderRadius: 12,
                padding: "8px 18px",
                fontSize: 26,
                fontWeight: 900,
                color: C.blue,
              }}
            >
              One open-source model
            </span>
            <span style={{ fontSize: 40, color: C.red }}>→</span>
            <span
              style={{
                background: C.card,
                border: `3px solid ${C.red}`,
                borderRadius: 12,
                padding: "8px 18px",
                fontSize: 26,
                fontWeight: 900,
                color: C.red,
              }}
            >
              Redo the math
            </span>
          </div>
        </ParallaxLayer>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {[
          { t: "More compute is better?", s: "Questioned", color: C.blue },
          { t: "Nvidia's stock?", s: "One-day crash", color: C.red },
          { t: "It didn't have to?", s: "Be so expensive", color: C.green },
        ].map((c, i) => (
          <PopIn key={i} delay={i * 14} style={{ flex: 1 }}>
            <div
              style={{
                background: C.card,
                border: `2.5px solid ${c.color}`,
                borderRadius: 16,
                padding: "22px 28px",
                textAlign: "center",
                boxShadow: "0 6px 0 rgba(20,22,26,0.08)",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.t}</div>
              <div style={{ fontSize: 22, color: C.soft, marginTop: 6 }}>{c.s}</div>
            </div>
          </PopIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景8：收束 ====================
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 100], [0, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 40,
      }}
    >
      <Audio src={staticFile("deepseek-moment/ds_s8.mp3")} />
      <VoxSub text={SUBTITLE_TEXTS.s8} endFrame={DURATIONS.s8} fontSize={32} />
      <PaperRibbon color={C.ink} />

      <Chapter text="WHAT THIS MEANS · 08" color={C.ink} />

      <div style={{ display: "flex", gap: 52, alignItems: "center" }}>
        {/* 拉远到全球（视差） */}
        <ParallaxLayer depth={0.4} style={{ position: "relative", width: 560, height: 460, inset: "auto" }}>
          <Globe width={560} height={460} style={{ transform: `translateY(${y}px)` }} />
        </ParallaxLayer>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 38, fontWeight: 800, color: C.ink, margin: 0, lineHeight: 1.5 }}>
            Not a Chinese company catching up —
            <br />
            <span style={{ color: C.red }}>One open model reshuffled a trillion-dollar compute narrative.</span>
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 28,
              background: C.card,
              border: `2.5px solid ${C.ink}`,
              borderRadius: 16,
              padding: "20px 28px",
              boxShadow: "0 6px 0 rgba(20,22,26,0.08)",
            }}
          >
            <span style={{ fontSize: 40 }}>?</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: C.inkSoft }}>
              When "needing less" becomes possible, the rules are only starting to be rewritten.
            </span>
          </div>
          <div style={{ fontSize: 24, color: C.soft, marginTop: 22, fontWeight: 700 }}>
            THE DEEPSEEK MOMENT
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 代码绘制的 Vox 视觉（矢量，版权干净） ====================

// 中国地图：风格化剪影 + 网格 + 杭州定位
const ChinaMap: React.FC<{ width?: number; height?: number }> = ({
  width = 460,
  height = 440,
}) => (
  <div
    style={{
      width,
      height,
      background: "rgba(29,78,216,0.06)",
      border: `2px solid ${C.blue}33`,
      borderRadius: 24,
      boxShadow: "0 10px 28px rgba(20,22,26,0.14)",
      padding: 14,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <svg width="100%" height="100%" viewBox="0 0 460 440">
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={"v" + i} x1={i * 57} y1={0} x2={i * 57} y2={440} stroke="rgba(43,105,122,0.10)" strokeWidth={1} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={"h" + i} x1={0} y1={i * 55} x2={460} y2={i * 55} stroke="rgba(43,105,122,0.10)" strokeWidth={1} />
      ))}
      <path
        d="M70 150 L100 120 L150 88 L210 64 L270 48 L340 40 L368 92 L356 132 L396 172 L414 210 L402 252 L366 262 L344 306 L300 332 L268 364 L244 396 L208 380 L172 344 L144 322 L112 300 L92 270 L74 240 L58 214 L44 188 Z"
        fill="#E6ECE1"
        stroke={C.teal}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M150 130 L210 210 L340 220" fill="none" stroke="rgba(43,105,122,0.30)" strokeWidth={2} strokeDasharray="6 5" />
      <circle cx={330} cy={300} r={11} fill={C.red} stroke="#fff" strokeWidth={3} />
      <text x={330} y={280} textAnchor="middle" fontSize={26} fontWeight={800} fill={C.red}>Hangzhou</text>
      <text x={40} y={60} fontSize={32} fontWeight={900} fill={C.blue}>CHINA</text>
    </svg>
    <div style={{ position: "absolute", bottom: 12, right: 16, fontSize: 20, fontWeight: 800, color: C.blue, background: "#fff", borderRadius: 8, padding: "2px 10px" }}>
      Export controls · Restricted
    </div>
  </div>
);

// 地球（全球视角）：圆形 + 经纬网格 + 节点
const Globe: React.FC<{ width?: number; height?: number; style?: React.CSSProperties }> = ({
  width = 560,
  height = 460,
  style,
}) => {
  const s = Math.min(width, height * 1.1);
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <svg width={s} height={s} viewBox="0 0 400 400">
        <circle cx={200} cy={200} r={182} fill="#ECE4D2" stroke={C.ink} strokeWidth={4} />
        {[-120, -60, 0, 60, 120].map((dy) => (
          <ellipse
            key={"pl" + dy}
            cx={200}
            cy={200}
            rx={182 * Math.cos((dy * Math.PI) / 180)}
            ry={46}
            fill="none"
            stroke="rgba(20,22,26,0.22)"
            strokeWidth={2}
          />
        ))}
        {[-120, -60, 0, 60, 120].map((dx) => (
          <ellipse
            key={"me" + dx}
            cx={200}
            cy={200}
            rx={50}
            ry={182}
            fill="none"
            stroke="rgba(20,22,26,0.22)"
            strokeWidth={2}
          />
        ))}
        <circle cx={200} cy={200} r={182} fill="none" stroke={C.ink} strokeWidth={4} />
        <circle cx={145} cy={150} r={10} fill={C.red} />
        <circle cx={248} cy={178} r={10} fill={C.blue} />
        <circle cx={180} cy={225} r={8} fill={C.green} />
      </svg>
      <div style={{ position: "absolute", bottom: 12, fontSize: 22, fontWeight: 800, letterSpacing: 3, color: C.inkSoft }}>
        GLOBAL · WORLD
      </div>
    </div>
  );
};

// GPU 剖面：PCB + 晶片 + 散热 + 金手指
const GpuCutout: React.FC<{ width?: number; height?: number }> = ({
  width = 180,
  height = 180,
}) => (
  <div style={{ width, height, position: "relative" }}>
    <svg width="100%" height="100%" viewBox="0 0 180 180">
      <rect x={6} y={6} width={168} height={168} rx={12} fill="#2D2D2D" stroke={C.ink} strokeWidth={3} />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={20 + i * 8} y={16} width={4} height={110} fill="#6B6B6B" />
      ))}
      <rect x={52} y={52} width={76} height={76} rx={8} fill="#3E8E5A" stroke="#fff" strokeWidth={2} />
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={"g" + i} x1={56 + i * 20} y1={56} x2={56 + i * 20} y2={124} stroke="#fff" strokeWidth={1.5} opacity={0.5} />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={"h" + i} x1={56} y1={56 + i * 20} x2={124} y2={56 + i * 20} stroke="#fff" strokeWidth={1.5} opacity={0.5} />
      ))}
      <rect x={28} y={160} width={124} height={10} rx={2} fill="#D9A441" />
      <text x={90} y={150} textAnchor="middle" fontSize={20} fontWeight={900} fill="#fff">GPU</text>
    </svg>
  </div>
);

// 纸艺插画外框（硬投影裁剪）
const ArtFrame: React.FC<{
  width: number;
  height: number;
  children: React.ReactNode;
  tint?: string;
}> = ({ width, height, children, tint = "#FBF8F0" }) => (
  <div style={{ width, height, position: "relative" }}>
    {/* 橙色剪纸底衬（贴纸层叠） */}
    <div
      style={{
        position: "absolute",
        left: -12,
        top: -12,
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${C.coral}, ${C.orange})`,
        borderRadius: 24,
        boxShadow: "6px 6px 0 rgba(26,26,26,0.10)",
      }}
    />
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: tint,
        border: `3px solid ${C.ink}`,
        borderRadius: 18,
        boxShadow: "7px 7px 0 rgba(26,26,26,0.16)",
        overflow: "hidden",
        transform: "rotate(-0.6deg)",
      }}
    >
      {children}
    </div>
  </div>
);

// 符号化人物剪影（剪纸 + 橙色底衬）—— 对应 Vox 的"工人/士兵"式具象人物
const CutoutFigure: React.FC<{
  variant?: "worker" | "suit";
  backing?: string;
  width?: number;
  height?: number;
}> = ({ variant = "worker", backing = C.orange, width = 110, height = 150 }) => (
  <svg width={width} height={height} viewBox="0 0 200 200">
    {/* 橙色底衬（offset） */}
    <g transform="translate(-16 12)">
      <circle cx="100" cy="46" r="30" fill={backing} />
      <path d="M34 200 C34 132 60 106 100 106 C140 106 166 132 166 200 Z" fill={backing} />
    </g>
    {/* 人物剪影（纸灰） */}
    <circle cx="100" cy="46" r="30" fill="#C7C2B3" />
    <path d="M34 200 C34 132 60 106 100 106 C140 106 166 132 166 200 Z" fill="#C7C2B3" />
    {variant === "worker" ? (
      <g>
        <path d="M64 42 C64 20 136 20 136 42 L136 52 L64 52 Z" fill="#3A3A3A" />
        <rect x="128" y="40" width="22" height="14" rx="4" fill="#3A3A3A" />
      </g>
    ) : (
      <g>
        <path d="M88 100 L100 132 L112 100 L100 120 Z" fill="#201D18" />
        <path d="M84 104 L116 104 L100 122 Z" fill="#D62E1F" />
      </g>
    )}
  </svg>
);

// 股市行情屏纸艺插画
const TickerArt: React.FC<{ width?: number; height?: number }> = ({
  width = 420,
  height = 260,
}) => (
  <ArtFrame width={width} height={height} tint="#201D18">
    <svg width="100%" height="100%" viewBox="0 0 420 260">
      <rect x={0} y={0} width={420} height={260} fill="#201D18" />
      <text x={20} y={34} fontFamily="monospace" fontSize={18} fontWeight={700} fill="#8C8C8C">NASDAQ · NVDA</text>
      <rect x={20} y={48} width={380} height={2} fill="#3A3A3A" />
      {/* 高亮股 */}
      <rect x={20} y={64} width={380} height={52} fill="#D62E1F" opacity={0.9} />
      <text x={36} y={88} fontFamily="monospace" fontSize={22} fontWeight={900} fill="#fff">NVDA</text>
      <text x={150} y={88} fontFamily="monospace" fontSize={22} fontWeight={900} fill="#fff">128.2</text>
      <text x={300} y={88} fontFamily="monospace" fontSize={22} fontWeight={900} fill="#fff">-17.1%</text>
      {/* 小行情 */}
      {Array.from({ length: 5 }).map((_, i) => {
        const up = i % 2 === 0;
        return (
          <g key={i}>
            <rect x={20} y={132 + i * 24} width={180} height={18} fill={up ? "#1F3A2A" : "#3A1F1C"} rx={3} />
            <rect x={210} y={132 + i * 24} width={88} height={18} fill="#3A3A3A" rx={3} />
            <text x={30} y={145 + i * 24} fontFamily="monospace" fontSize={13} fill={up ? "#5FBF77" : "#E3796E"}>
              {up ? "▲" : "▼"} {("0.0" + (i + 1) * 0.7).slice(0, 4)}
            </text>
          </g>
        );
      })}
    </svg>
  </ArtFrame>
);

// 机房/服务器纸艺插画
const TeamArt: React.FC<{ width?: number; height?: number }> = ({
  width = 520,
  height = 620,
}) => (
  <ArtFrame width={width} height={height} tint="#F1EBDD">
    <svg width="100%" height="100%" viewBox="0 0 520 620">
      <rect x={0} y={0} width={520} height={620} fill="#F1EBDD" />
      {/* 地面 */}
      <rect x={0} y={540} width={520} height={80} fill="#E2D8C2" />
      {/* 两个机架 */}
      {[30, 280].map((rx) => (
        <g key={rx}>
          <rect x={rx} y={80} width={210} height={460} fill="#2B697A" rx={10} />
          <rect x={rx + 14} y={100} width={182} height={420} fill="#1F4B58" rx={6} />
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={rx + 26} y={112 + i * 44} width={158} height={30} fill="#2C5A66" rx={4} />
          ))}
          {/* 指示灯 */}
          {Array.from({ length: 9 }).map((_, i) =>
            Array.from({ length: 5 }).map((_, j) => (
              <circle key={j} cx={rx + 40 + j * 26} cy={121 + i * 44} r={3} fill={i % 3 === 0 ? "#8CE99A" : "#5FBF77"} />
            ))
          )}
        </g>
      ))}
      <text x={300} y={604} fontFamily="monospace" fontSize={16} fill="#6B6B6B" textAnchor="middle">Hangzhou · Server room</text>
    </svg>
  </ArtFrame>
);

// 开发者纸艺插画
const DevArt: React.FC<{ width?: number; height?: number }> = ({
  width = 420,
  height = 260,
}) => (
  <ArtFrame width={width} height={height} tint="#F6F2E8">
    <svg width="100%" height="100%" viewBox="0 0 420 260">
      <rect x={0} y={0} width={420} height={260} fill="#F6F2E8" />
      {/* 电脑 */}
      <rect x={70} y={70} width={280} height={150} rx={10} fill="#2D2D2D" stroke={C.ink} strokeWidth={3} />
      <rect x={86} y={86} width={248} height={118} rx={6} fill="#1A1A1A" />
      {/* 代码行 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={96} y={96 + i * 17} width={60 + ((i * 53) % 150)} height={7} rx={2} fill={i % 2 ? "#3E8E5A" : "#2B697A"} />
      ))}
      {/* 光标 */}
      <rect x={96} y={180} width={26} height={8} fill="#D62E1F" />
      {/* 火花 */}
      <path d="M330 70 l10 22 22 10 -22 10 -10 22 -10 -22 -22 -10 22 -10 z" fill="#D9A441" />
      {/* 键盘底座 */}
      <rect x={70} y={222} width={280} height={26} rx={6} fill="#201D18" />
      <text x={92} y={100} fontFamily="monospace" fontSize={14} fill="#FFFFFF" opacity={0.9}>def deepseek():</text>
    </svg>
  </ArtFrame>
);

// 电路板纸艺插画
const CircuitArt: React.FC<{ width?: number; height?: number }> = ({
  width = 360,
  height = 230,
}) => (
  <ArtFrame width={width} height={height} tint="#EAF0E6">
    <svg width="100%" height="100%" viewBox="0 0 360 230">
      <rect x={0} y={0} width={360} height={230} fill="#EAF0E6" />
      <rect x={12} y={16} width={336} height={198} rx={14} fill="#2D2D2D" stroke={C.ink} strokeWidth={3} />
      {/* 走线 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M${30 + i * 70} 60 L${30 + i * 70} 170`} stroke={i % 2 ? "#3E8E5A" : "#2B697A"} strokeWidth={5} fill="none" />
      ))}
      {/* 焊盘 */}
      {Array.from({ length: 5 }).map((_, i) =>
        Array.from({ length: 3 }).map((_, j) => (
          <circle key={j} cx={30 + i * 70} cy={80 + j * 40} r={6} fill="#D9A441" />
        ))
      )}
      {/* 中央芯片 */}
      <rect x={140} y={80} width={90} height={90} rx={8} fill="#3E8E5A" stroke="#fff" strokeWidth={2} />
      <rect x={148} y={88} width={74} height={74} rx={4} fill="#1F4B36" />
      <text x={185} y={132} textAnchor="middle" fontFamily="monospace" fontSize={18} fontWeight={900} fill="#fff">AI</text>
    </svg>
  </ArtFrame>
);

// 封面/标题卡
const CoverScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 160 },
  });
  const underline = interpolate(frame, [34, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 90px",
        gap: 26,
      }}
    >
      <div style={{ height: 70, transform: `scale(${titleScale})` }}>
        <Img src={staticFile("deepseek-moment/deepseek-logo.svg")} style={{ height: 70, width: "auto" }} />
      </div>
      <h1
        style={{
          fontSize: 112,
          fontWeight: 900,
          color: C.ink,
          margin: 0,
          lineHeight: 1,
          letterSpacing: 1.5,
          textAlign: "center",
          textShadow: "5px 5px 0 rgba(26,26,26,0.12)",
        }}
      >
        THE DEEPSEEK MOMENT
      </h1>
      <div style={{ height: 12, background: C.highlight, width: `${underline * 100}%`, maxWidth: 560, transform: "skewX(-12deg)" }} />
      <p style={{ fontSize: 34, fontWeight: 700, color: C.inkSoft, margin: 0, textAlign: "center" }}>
        How a small Chinese lab made the AI industry redo the math.
      </p>
      <div style={{ fontSize: 22, color: C.soft, fontWeight: 700, letterSpacing: 3 }}>2025 · EXPLAINER</div>
    </AbsoluteFill>
  );
};

// ==================== 主组件 ====================
export const DeepSeekMoment: React.FC = () => {
  return (
    <>
      {/* BGM */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.2} loop />

      <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={COVER_FRAMES}>
          <CoverScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FADE })}
        />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.s1}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FADE })}
        />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.s2}>
          <OriginScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_SLIDE })}
        />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.s3}>
          <ChipScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FADE })}
        />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.s4}>
          <CostScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_SLIDE })}
        />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.s5}>
          <ArchScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FADE })}
        />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.s6}>
          <ReleaseScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_SLIDE })}
        />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.s7}>
          <MomentScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FADE })}
        />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.s8}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <PaperOverlay />
      </AbsoluteFill>
    </>
  );
};
