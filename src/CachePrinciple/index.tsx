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

// ==================== 新粗野主义设计令牌 (Neo-Brutalism) ====================
// 参考 src/FrontendIsms/styles.ts 中 id=1 新粗野主义：
//   bg #f5f3ee · 卡片 #fff · 文字 #111 · 3px 粗黑边框 · 0 圆角 · 6px 硬阴影 · 点阵背景
const NB = {
  bg: "#f5f3ee",
  card: "#ffffff",
  ink: "#111111",
  gray: "#555555",
  dot: "#d4d0c8",
  yellow: "#FFDE59",
  red: "#FF6B6B",
  blue: "#2454FF",
  green: "#3ECF8E",
  border: "3px solid #111111",
  shadow: "6px 6px 0 #111111",
  shadowSm: "4px 4px 0 #111111",
  fontMono: "DM Mono, 'Courier New', monospace",
  fontCN: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};

// ==================== 字幕文本（与 TTS 完全一致） ====================
const SUBTITLES: Record<string, string> = {
  title:
    "缓存。为什么你的电脑内存都有十六GB了，CPU却还要偷偷藏一个两百五十六KB的小仓库？因为内存太慢。缓存是一种临时存储数据的硬件，用来加速后续访问。今天我们就来聊透计算机组成原理的重点，Cache缓存。",
  principle:
    "缓存的工作原理，靠的是程序的局部性原理。时间局部性，刚刚用过的数据，很可能马上又会被用到，比如循环里的计数器。空间局部性，访问了一个数据，它附近的数据也很快会被用到，比如数组的连续遍历。基于这两条规律，缓存把常用数据提前放在CPU身边。",
  concept:
    "缓存里最小的存储单元叫缓存行，也叫缓存块，里面存的是主存块的一个副本。主存和缓存之间按块交换数据，一个块通常几十到一百多字节。块内偏移用来定位块内的具体字节，偏移位数等于log2块大小，比如64字节的块，偏移就是6位。",
  mapping:
    "主存块怎么放进缓存？有三种映射方式。直接映射，主存块号对缓存块数取模，只能放唯一的位置，硬件最简单，但容易冲突。全相联映射，可以放任意位置，命中率最高，但每次要和所有行比较标记，硬件最复杂。组相联映射是折中，先定位到组，组内N路随便放。比如256KB缓存，块大小64字节，一共4096个缓存块，四路组相联就是1024个组，第10000个主存块映射到第784组。",
  address:
    "访问缓存时，物理地址拆成三段：块内地址、块匹配字段和标记。块内地址定位块内字节，位数由块大小决定。直接映射下，块匹配字段是缓存块号，位数是log2缓存块数；组相联下是组号，位数是log2组数；全相联下没有这个字段。标记用来判断是否命中，位数等于地址总位数减去前两段。",
  replace:
    "缓存行里存的不只是数据，还有元数据：有效位标记这行有没有数据，标记字段用来比对，脏位记录有没有被改过，访问位为替换算法服务。当缓存满了，就需要替换算法，最常用的是LRU最近最少使用，还有FIFO先进先出和随机替换。直接映射不需要替换算法，冲突了直接覆盖。",
  writepolicy:
    "写操作要保证缓存和主存一致。命中时有两种策略：直写法，每次写缓存同时写主存，简单但慢；回写法，只写缓存，等缓存块被替换时才写回主存，需要脏位。未命中时也有两种：写分配法，先把主存块加载进缓存再写；非写分配法，不加载，直接写主存。记忆口诀：直写配非分配，偏向主存；回写配写分配，偏向缓存。",
  hitrate:
    "衡量缓存性能，核心指标是命中率。命中率等于命中次数除以总访问次数，缺失率就是1减去命中率。平均访问时间怎么算？用命中率乘以缓存访问时间，加上缺失率乘以主存访问时间。举个例子，缓存访问一个纳秒，主存访问十个纳秒，命中率百分之九十五，平均访问时间等于零点九五乘一，加零点零五乘十，等于一点四五纳秒。对比直接访问主存的十个纳秒，性能提升了将近七倍。所以缓存的价值，就藏在命中率里。",
  outro:
    "总结一下。缓存利用局部性原理，把常用数据放在CPU身边；映射方式决定主存块放哪；地址结构拆出标记、组号和偏移；替换算法管理空间；写策略保证一致性。Cache是408考研的必考重点，务必深入掌握。点赞收藏关注，我们下期再见。",
};

// ==================== 场景时长（TTS + 40f buffer） ====================
const DURATIONS = {
  title: 594, // TTS 554f + 40f
  principle: 710, // TTS 670f + 40f
  concept: 661, // TTS 621f + 40f
  mapping: 1104, // TTS 1064f + 40f
  hitrate: 1137, // TTS 1097f + 40f
  address: 825, // TTS 785f + 40f
  replace: 781, // TTS 741f + 40f
  writepolicy: 965, // TTS 925f + 40f
  outro: 688, // TTS 648f + 40f
};

// 总时长 = sum(sceneDurations) - sum(transitions) = 7465 - 58 = 7407f
export const TOTAL_FRAMES = 7407;

// ==================== 通用新粗野主义组件 ====================

/** 点阵背景层 */
const DotGrid: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: "radial-gradient(circle, #d4d0c8 1px, transparent 1px)",
      backgroundSize: "22px 22px",
      opacity: 0.55,
      pointerEvents: "none",
    }}
  />
);

/** 粗野主义卡片：白底 + 3px 黑边 + 硬阴影 + 零圆角 */
const NBBox: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  color?: string;
}> = ({ children, style, color = NB.card }) => (
  <div
    style={{
      background: color,
      border: NB.border,
      borderRadius: 0,
      boxShadow: NB.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

/** 黄色高亮标签（neo-brutalism 常用） */
const NBTag: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, color = NB.yellow, style }) => (
  <div
    style={{
      background: color,
      border: NB.border,
      borderRadius: 0,
      boxShadow: NB.shadowSm,
      padding: "8px 20px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: NB.fontMono,
      fontWeight: 700,
      fontSize: 22,
      color: NB.ink,
      textTransform: "uppercase",
      letterSpacing: 1,
      ...style,
    }}
  >
    {children}
  </div>
);

/** 新粗野主义字幕条：黑色硬块 + 白字 */
const NBSubtitle: React.FC<{
  text: string;
  startFrame?: number;
  endFrame?: number;
  fontSize?: number;
}> = ({ text, startFrame = 0, endFrame = 9999, fontSize = 30 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 8, endFrame - 8, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div
      style={{
        position: "absolute",
        bottom: 48,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
        opacity,
        padding: "0 30px",
      }}
    >
      <div
        style={{
          background: NB.ink,
          border: "3px solid #111111",
          borderRadius: 0,
          boxShadow: "8px 8px 0 rgba(17,17,17,0.9)",
          padding: "14px 34px",
          maxWidth: "92%",
          textAlign: "center",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize,
            fontWeight: 700,
            fontFamily: NB.fontCN,
            letterSpacing: 1.5,
            lineHeight: 1.55,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/** 场景标题块（黑底黄字 + 硬阴影） */
const NBSceneTitle: React.FC<{
  cn: string;
  en: string;
  delay?: number;
}> = ({ cn, en, delay = 0 }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [delay, delay + 10], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          background: NB.ink,
          border: "3px solid #111111",
          boxShadow: NB.shadow,
          padding: "10px 28px",
          color: NB.yellow,
          fontFamily: NB.fontCN,
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: 4,
          lineHeight: 1.2,
        }}
      >
        {cn}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: NB.fontMono,
          fontSize: 20,
          fontWeight: 700,
          color: NB.gray,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {en}
      </div>
    </div>
  );
};

/** 场景外壳：统一背景 + 点阵 */
const SceneShell: React.FC<{
  children: React.ReactNode;
  subtitle?: { text: string; startFrame?: number; endFrame?: number };
}> = ({ children, subtitle }) => (
  <AbsoluteFill
    style={{
      background: NB.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 50px",
      position: "relative",
    }}
  >
    <DotGrid />
    {subtitle && (
      <NBSubtitle
        text={subtitle.text}
        startFrame={subtitle.startFrame ?? 0}
        endFrame={subtitle.endFrame ?? 9999}
      />
    )}
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

// ==================== 场景1：标题开场 ====================
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const subOpacity = interpolate(frame, [20, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const diagramOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const blocks = [
    { label: "CPU", sub: "访问", color: NB.ink, text: NB.yellow },
    { label: "CACHE", sub: "256KB", color: NB.yellow, text: NB.ink },
    { label: "RAM", sub: "16GB", color: NB.card, text: NB.ink },
  ];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.title, startFrame: 0, endFrame: DURATIONS.title }}>
      <Audio src={staticFile("cache-principle/scene1_title.mp3")} />

      {/* 顶部标签 */}
      <div style={{ opacity: subOpacity, marginBottom: 30 }}>
        <NBTag color={NB.yellow}>计算机组成原理 · 存储系统</NBTag>
      </div>

      {/* 主标题 */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: NB.fontMono,
            fontSize: 120,
            fontWeight: 900,
            color: NB.ink,
            lineHeight: 1,
            letterSpacing: 2,
            WebkitTextStroke: "3px #111111",
          }}
        >
          CACHE
        </div>
        <div
          style={{
            fontFamily: NB.fontCN,
            fontSize: 74,
            fontWeight: 900,
            color: NB.ink,
            lineHeight: 1.25,
            letterSpacing: 8,
            marginTop: 8,
          }}
        >
          缓存原理
        </div>
      </div>

      {/* 层级示意 */}
      <div
        style={{
          opacity: diagramOpacity,
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginTop: 40,
        }}
      >
        {blocks.map((b, i) => (
          <React.Fragment key={b.label}>
            {i > 0 && (
              <div style={{ fontFamily: NB.fontMono, fontSize: 34, fontWeight: 900, color: NB.ink }}>
                →
              </div>
            )}
            <NBBox
              style={{
                width: 190,
                height: 120,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              color={b.color}
            >
              <span
                style={{
                  fontFamily: NB.fontMono,
                  fontSize: 34,
                  fontWeight: 900,
                  color: b.text,
                  letterSpacing: 2,
                }}
              >
                {b.label}
              </span>
              <span
                style={{
                  fontFamily: NB.fontMono,
                  fontSize: 18,
                  fontWeight: 700,
                  color: b.label === "CACHE" ? NB.ink : NB.gray,
                  marginTop: 6,
                }}
              >
                {b.sub}
              </span>
            </NBBox>
          </React.Fragment>
        ))}
      </div>

      <div style={{ opacity: subOpacity, marginTop: 44 }}>
        <div
          style={{
            fontFamily: NB.fontCN,
            fontSize: 26,
            fontWeight: 700,
            color: NB.gray,
            letterSpacing: 3,
          }}
        >
          为什么需要缓存？
        </div>
      </div>
    </SceneShell>
  );
};

// ==================== 场景2：局部性原理 ====================
const PrincipleScene: React.FC = () => {
  const frame = useCurrentFrame();

  const code = [
    "for (i = 0; i < 1000; i++) {",
    "  sum += arr[i];   // 同一数据反复访问 → 时间局部性",
    "}",
  ];

  const locality = [
    {
      cn: "时间局部性",
      en: "Temporal Locality",
      desc: "刚刚用过的数据，很可能马上又用",
      eg: "循环计数器 · 频繁访问的变量",
      color: NB.blue,
      delay: 10,
    },
    {
      cn: "空间局部性",
      en: "Spatial Locality",
      desc: "访问一个数据，附近的数据也很快被用",
      eg: "数组遍历 · 连续存储的结构体",
      color: NB.red,
      delay: 18,
    },
  ];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.principle, startFrame: 0, endFrame: DURATIONS.principle }}>
      <Audio src={staticFile("cache-principle/scene2_principle.mp3")} />

      <NBSceneTitle cn="局部性原理" en="Locality" delay={0} />

      {/* 两个局部性卡片 */}
      <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 960, marginTop: 36 }}>
        {locality.map((l) => {
          const op = interpolate(frame, [l.delay, l.delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = interpolate(frame, [l.delay, l.delay + 10], [30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={l.cn} style={{ opacity: op, transform: `translateY(${y}px)`, flex: 1 }}>
              <NBBox style={{ padding: "22px 26px", borderTop: `8px solid ${l.color}` }}>
                <div style={{ fontFamily: NB.fontCN, fontSize: 34, fontWeight: 900, color: NB.ink }}>
                  {l.cn}
                </div>
                <div style={{ fontFamily: NB.fontMono, fontSize: 15, fontWeight: 700, color: NB.gray, letterSpacing: 1, marginTop: 2 }}>
                  {l.en.toUpperCase()}
                </div>
                <div style={{ marginTop: 14, fontFamily: NB.fontCN, fontSize: 21, fontWeight: 700, color: NB.ink, lineHeight: 1.5 }}>
                  {l.desc}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    background: `${l.color}22`,
                    border: "2px solid #111111",
                    padding: "8px 12px",
                    fontFamily: NB.fontCN,
                    fontSize: 17,
                    fontWeight: 700,
                    color: NB.ink,
                  }}
                >
                  {l.eg}
                </div>
              </NBBox>
            </div>
          );
        })}
      </div>

      {/* 代码示例 */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 24, opacity: interpolate(frame, [30, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <NBBox style={{ background: NB.ink, padding: "18px 26px" }}>
          {code.map((line, i) => (
            <div key={i} style={{ fontFamily: NB.fontMono, fontSize: 20, fontWeight: 700, color: i === 0 ? NB.yellow : NB.green, lineHeight: 1.7 }}>
              {line}
            </div>
          ))}
        </NBBox>
      </div>
    </SceneShell>
  );
};

// ==================== 场景3：缓存块概念 ====================
const ConceptScene: React.FC = () => {
  const frame = useCurrentFrame();

  const rows = [
    { label: "缓存行 / 缓存块", en: "CACHE LINE", note: "缓存中的最小存储单元", color: NB.blue, delay: 12 },
    { label: "主存块", en: "MAIN MEMORY BLOCK", note: "与缓存块大小一致，按块交换", color: NB.red, delay: 20 },
    { label: "块内偏移", en: "BLOCK OFFSET", note: "块内定位，位数 = log2(块大小)", color: NB.yellow, delay: 28 },
  ];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.concept, startFrame: 0, endFrame: DURATIONS.concept }}>
      <Audio src={staticFile("cache-principle/scene3_concept.mp3")} />

      <NBSceneTitle cn="缓存块概念" en="Cache Block" delay={0} />

      {/* 块大小示例 */}
      <div style={{ width: "100%", maxWidth: 900, marginTop: 30 }}>
        <NBBox style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: 16 }}>
          <NBTag color={NB.green} style={{ fontSize: 18 }}>64 BYTES</NBTag>
          <div style={{ fontFamily: NB.fontMono, fontSize: 26, fontWeight: 900, color: NB.ink }}>
            偏移位数 = log₂64 = <span style={{ color: NB.red }}>6 位</span>
          </div>
        </NBBox>
      </div>

      {/* 概念列表 */}
      <div style={{ width: "100%", maxWidth: 900, marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {rows.map((r) => {
          const op = interpolate(frame, [r.delay, r.delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const x = interpolate(frame, [r.delay, r.delay + 10], [-30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={r.label} style={{ opacity: op, transform: `translateX(${x}px)` }}>
              <NBBox style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 20, borderLeft: `10px solid ${r.color}` }}>
                <div style={{ minWidth: 250 }}>
                  <div style={{ fontFamily: NB.fontCN, fontSize: 28, fontWeight: 900, color: NB.ink }}>{r.label}</div>
                  <div style={{ fontFamily: NB.fontMono, fontSize: 14, fontWeight: 700, color: NB.gray, letterSpacing: 1 }}>{r.en}</div>
                </div>
                <div style={{ fontFamily: NB.fontCN, fontSize: 20, fontWeight: 700, color: NB.gray }}>{r.note}</div>
              </NBBox>
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
};

// ==================== 场景4：映射方式 ====================
const MappingScene: React.FC = () => {
  const frame = useCurrentFrame();

  const mappings = [
    {
      cn: "直接映射",
      en: "DIRECT MAPPED",
      rule: "主存块号 mod 缓存块数",
      note: "只能放唯一位置",
      pros: "硬件最简单 · 查找快",
      cons: "容易冲突 · 命中率低",
      color: NB.blue,
      delay: 12,
    },
    {
      cn: "全相联映射",
      en: "FULLY ASSOCIATIVE",
      rule: "任意缓存行",
      note: "想放哪就放哪",
      pros: "命中率最高 · 无冲突",
      cons: "需遍历所有行 · 硬件最复杂",
      color: NB.red,
      delay: 20,
    },
    {
      cn: "组相联映射",
      en: "SET ASSOCIATIVE",
      rule: "主存块号 mod 组数 → 组内 N 路",
      note: "折中方案 · N 路组相联",
      pros: "冲突少 · 硬件适中",
      cons: "比直接映射复杂",
      color: NB.green,
      delay: 28,
    },
  ];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.mapping, startFrame: 0, endFrame: DURATIONS.mapping }}>
      <Audio src={staticFile("cache-principle/scene4_mapping.mp3")} />

      <NBSceneTitle cn="映射方式" en="Mapping" delay={0} />

      {/* 三个映射卡片 */}
      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 1020, marginTop: 30 }}>
        {mappings.map((m) => {
          const op = interpolate(frame, [m.delay, m.delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = interpolate(frame, [m.delay, m.delay + 10], [40, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={m.cn} style={{ opacity: op, transform: `translateY(${y}px)`, flex: 1 }}>
              <NBBox style={{ padding: "18px 20px", borderTop: `10px solid ${m.color}` }}>
                <div style={{ fontFamily: NB.fontCN, fontSize: 30, fontWeight: 900, color: NB.ink }}>{m.cn}</div>
                <div style={{ fontFamily: NB.fontMono, fontSize: 13, fontWeight: 700, color: NB.gray, letterSpacing: 1, marginTop: 2 }}>{m.en}</div>
                <div style={{ marginTop: 12, background: NB.yellow, border: "2px solid #111111", padding: "8px 10px", fontFamily: NB.fontMono, fontSize: 15, fontWeight: 700, color: NB.ink }}>
                  {m.rule}
                </div>
                <div style={{ marginTop: 10, fontFamily: NB.fontCN, fontSize: 18, fontWeight: 700, color: NB.gray }}>
                  {m.note}
                </div>
                <div style={{ marginTop: 10, fontFamily: NB.fontCN, fontSize: 16, fontWeight: 700, color: NB.green }}>
                  ✓ {m.pros}
                </div>
                <div style={{ marginTop: 4, fontFamily: NB.fontCN, fontSize: 16, fontWeight: 700, color: NB.red }}>
                  ✗ {m.cons}
                </div>
              </NBBox>
            </div>
          );
        })}
      </div>

      {/* 计算示例 */}
      <div style={{ width: "100%", maxWidth: 1020, marginTop: 24, opacity: interpolate(frame, [40, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <NBBox style={{ background: NB.ink, padding: "16px 26px" }}>
          <div style={{ fontFamily: NB.fontMono, fontSize: 21, fontWeight: 700, color: NB.yellow, lineHeight: 1.7 }}>
            256KB / 64B = 4096 块 &nbsp;|&nbsp; 10000 mod 4096 = 1808
          </div>
          <div style={{ fontFamily: NB.fontCN, fontSize: 18, fontWeight: 700, color: "#CCCCCC", marginTop: 6 }}>
            4 路组相联 → 4096/4 = 1024 组 → 10000 mod 1024 = 784 组
          </div>
        </NBBox>
      </div>
    </SceneShell>
  );
};

// ==================== 场景5：命中率与平均访问时间 ====================
const HitRateScene: React.FC = () => {
  const frame = useCurrentFrame();

  const formulaParts = [
    { en: "H", cn: "命中率", note: "命中次数 / 总访问次数", color: NB.yellow, delay: 12 },
    { en: "1-H", cn: "缺失率", note: "未命中比例", color: NB.red, delay: 20 },
    { en: "T_cache", cn: "缓存访问时间", note: "命中时耗时", color: NB.green, delay: 28 },
    { en: "T_main", cn: "主存访问时间", note: "未命中时耗时", color: NB.blue, delay: 36 },
  ];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.hitrate, startFrame: 0, endFrame: DURATIONS.hitrate }}>
      <Audio src={staticFile("cache-principle/scene8_hitrate.mp3")} />

      <NBSceneTitle cn="命中率与平均访问时间" en="Hit Rate & Avg Access Time" delay={0} />

      {/* 核心公式 */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 26 }}>
        <NBBox style={{ background: NB.ink, padding: "22px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: NB.fontMono, fontSize: 30, fontWeight: 900, color: NB.yellow, lineHeight: 1.6, letterSpacing: 1 }}>
            T_avg = H × T_cache + (1−H) × T_main
          </div>
          <div style={{ fontFamily: NB.fontCN, fontSize: 18, fontWeight: 700, color: "#CCCCCC", marginTop: 10 }}>
            平均访问时间 = 命中率×缓存时间 + 缺失率×主存时间
          </div>
        </NBBox>
      </div>

      {/* 参数说明 */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 960, marginTop: 22 }}>
        {formulaParts.map((p) => {
          const op = interpolate(frame, [p.delay, p.delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = interpolate(frame, [p.delay, p.delay + 10], [30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={p.en} style={{ opacity: op, transform: `translateY(${y}px)`, flex: 1 }}>
              <NBBox style={{ padding: "14px 10px", textAlign: "center", borderTop: `8px solid ${p.color}` }}>
                <div style={{ fontFamily: NB.fontMono, fontSize: 22, fontWeight: 900, color: NB.ink }}>{p.en}</div>
                <div style={{ fontFamily: NB.fontCN, fontSize: 19, fontWeight: 900, color: NB.gray, marginTop: 2 }}>{p.cn}</div>
                <div style={{ fontFamily: NB.fontCN, fontSize: 14, fontWeight: 700, color: NB.gray, marginTop: 6 }}>{p.note}</div>
              </NBBox>
            </div>
          );
        })}
      </div>

      {/* 计算示例 */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 24, opacity: interpolate(frame, [48, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <NBBox style={{ padding: "18px 26px", borderLeft: "10px solid #FFDE59" }}>
          <div style={{ fontFamily: NB.fontMono, fontSize: 22, fontWeight: 900, color: NB.ink, lineHeight: 1.7 }}>
            H=95% &nbsp; T_cache=1ns &nbsp; T_main=10ns
          </div>
          <div style={{ fontFamily: NB.fontMono, fontSize: 22, fontWeight: 900, color: NB.ink, lineHeight: 1.7, marginTop: 8 }}>
            T_avg = 0.95×1 + 0.05×10 = <span style={{ color: NB.red }}>1.45ns</span>
          </div>
          <div style={{ fontFamily: NB.fontCN, fontSize: 19, fontWeight: 900, color: NB.green, marginTop: 10 }}>
            ⚡ 对比主存 10ns → 提速 ≈ 6.9 倍
          </div>
        </NBBox>
      </div>
    </SceneShell>
  );
};

// ==================== 场景6：地址结构 ====================
const AddressScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fields = [
    { cn: "标记", en: "TAG", note: "比对是否命中", color: NB.red, delay: 12 },
    { cn: "块匹配字段", en: "INDEX", note: "定位缓存块 / 组", color: NB.blue, delay: 20 },
    { cn: "块内地址", en: "OFFSET", note: "块内定位字节", color: NB.yellow, delay: 28 },
  ];

  const variants = [
    { name: "直接映射", struct: "[ 标记 | 块号 | 偏移 ]", color: NB.blue, delay: 38 },
    { name: "组相联", struct: "[ 标记 | 组号 | 偏移 ]", color: NB.green, delay: 46 },
    { name: "全相联", struct: "[ 标记 | 偏移 ]", color: NB.red, delay: 54 },
  ];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.address, startFrame: 0, endFrame: DURATIONS.address }}>
      <Audio src={staticFile("cache-principle/scene5_address.mp3")} />

      <NBSceneTitle cn="地址结构" en="Address Structure" delay={0} />

      {/* 地址三段 */}
      <div style={{ display: "flex", gap: 0, width: "100%", maxWidth: 900, marginTop: 30 }}>
        {fields.map((f) => {
          const op = interpolate(frame, [f.delay, f.delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={f.cn} style={{ opacity: op, flex: 1, margin: "0 6px" }}>
              <div style={{ background: f.color, border: NB.border, boxShadow: NB.shadowSm, padding: "26px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: NB.fontCN, fontSize: 28, fontWeight: 900, color: f.color === NB.yellow ? NB.ink : "#FFFFFF" }}>{f.cn}</div>
                <div style={{ fontFamily: NB.fontMono, fontSize: 15, fontWeight: 900, color: f.color === NB.yellow ? NB.ink : "#FFFFFF", marginTop: 4, letterSpacing: 2 }}>{f.en}</div>
              </div>
              <div style={{ marginTop: 10, fontFamily: NB.fontCN, fontSize: 17, fontWeight: 700, color: NB.gray, textAlign: "center" }}>{f.note}</div>
            </div>
          );
        })}
      </div>

      {/* 三种映射下的字段布局 */}
      <div style={{ width: "100%", maxWidth: 860, marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
        {variants.map((v) => {
          const op = interpolate(frame, [v.delay, v.delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={v.name} style={{ opacity: op }}>
              <NBBox style={{ padding: "12px 22px", display: "flex", alignItems: "center", gap: 18, borderLeft: `10px solid ${v.color}` }}>
                <div style={{ fontFamily: NB.fontCN, fontSize: 22, fontWeight: 900, color: NB.ink, minWidth: 140 }}>{v.name}</div>
                <div style={{ fontFamily: NB.fontMono, fontSize: 21, fontWeight: 900, color: NB.ink, letterSpacing: 1 }}>{v.struct}</div>
              </NBBox>
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
};

// ==================== 场景6：存储结构与替换 ====================
const ReplaceScene: React.FC = () => {
  const frame = useCurrentFrame();

  const meta = [
    { en: "VALID", cn: "有效位", note: "这行有没有数据", color: NB.blue, delay: 12 },
    { en: "TAG", cn: "标记", note: "与地址比对判命中", color: NB.red, delay: 18 },
    { en: "DIRTY", cn: "脏位", note: "是否被修改过", color: NB.yellow, delay: 24 },
    { en: "REF", cn: "访问位", note: "服务替换算法", color: NB.green, delay: 30 },
  ];

  const algos = [
    { name: "LRU", cn: "最近最少使用", note: "淘汰最久没用的", color: NB.blue, delay: 42 },
    { name: "FIFO", cn: "先进先出", note: "谁先进谁先走", color: NB.red, delay: 50 },
    { name: "RANDOM", cn: "随机替换", note: "随机淘汰一块", color: NB.green, delay: 58 },
  ];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.replace, startFrame: 0, endFrame: DURATIONS.replace }}>
      <Audio src={staticFile("cache-principle/scene6_replace.mp3")} />

      <NBSceneTitle cn="存储结构与替换" en="Metadata & Replacement" delay={0} />

      {/* 元数据字段 */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 1020, marginTop: 28 }}>
        {meta.map((m) => {
          const op = interpolate(frame, [m.delay, m.delay + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={m.en} style={{ opacity: op, flex: 1 }}>
              <NBBox style={{ padding: "14px 10px", textAlign: "center", borderTop: `8px solid ${m.color}` }}>
                <div style={{ fontFamily: NB.fontMono, fontSize: 20, fontWeight: 900, color: NB.ink }}>{m.en}</div>
                <div style={{ fontFamily: NB.fontCN, fontSize: 22, fontWeight: 900, color: NB.gray, marginTop: 2 }}>{m.cn}</div>
                <div style={{ fontFamily: NB.fontCN, fontSize: 14, fontWeight: 700, color: NB.gray, marginTop: 6 }}>{m.note}</div>
              </NBBox>
            </div>
          );
        })}
      </div>

      {/* 替换算法 */}
      <div style={{ display: "flex", gap: 14, width: "100%", maxWidth: 1020, marginTop: 26 }}>
        {algos.map((a) => {
          const op = interpolate(frame, [a.delay, a.delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = interpolate(frame, [a.delay, a.delay + 10], [30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={a.name} style={{ opacity: op, transform: `translateY(${y}px)`, flex: 1 }}>
              <NBBox style={{ padding: "16px 18px", borderLeft: `10px solid ${a.color}` }}>
                <div style={{ fontFamily: NB.fontMono, fontSize: 26, fontWeight: 900, color: NB.ink }}>{a.name}</div>
                <div style={{ fontFamily: NB.fontCN, fontSize: 20, fontWeight: 900, color: NB.gray, marginTop: 4 }}>{a.cn}</div>
                <div style={{ fontFamily: NB.fontCN, fontSize: 16, fontWeight: 700, color: NB.gray, marginTop: 6 }}>{a.note}</div>
              </NBBox>
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
};

// ==================== 场景7：写策略 ====================
const WritePolicyScene: React.FC = () => {
  const frame = useCurrentFrame();

  const hitPolicies = [
    {
      name: "直写法",
      en: "WRITE THROUGH",
      desc: "写缓存同时写主存",
      pros: "简单 · 一致性最好",
      cons: "慢 · 写操作频繁时开销大",
      color: NB.blue,
      delay: 12,
    },
    {
      name: "回写法",
      en: "WRITE BACK",
      desc: "只写缓存，替换时才写回主存",
      pros: "快 · 合并多次写入",
      cons: "需要脏位 · 逻辑复杂",
      color: NB.red,
      delay: 20,
    },
  ];

  const missPolicies = [
    {
      name: "写分配法",
      en: "WRITE ALLOCATE",
      desc: "先把主存块加载进缓存再写",
      color: NB.green,
      delay: 32,
    },
    {
      name: "非写分配法",
      en: "NOT-WRITE-ALLOCATE",
      desc: "不加载，直接写主存",
      color: NB.yellow,
      delay: 40,
    },
  ];

  const memory = [
    "直写 + 非写分配 → 偏向主存",
    "回写 + 写分配 → 偏向缓存",
  ];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.writepolicy, startFrame: 0, endFrame: DURATIONS.writepolicy }}>
      <Audio src={staticFile("cache-principle/scene7_writepolicy.mp3")} />

      <NBSceneTitle cn="写策略" en="Write Policy" delay={0} />

      {/* 命中时 */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 24 }}>
        <NBTag color={NB.ink} style={{ color: NB.yellow, marginBottom: 14 }}>命中时 HIT</NBTag>
        <div style={{ display: "flex", gap: 16 }}>
          {hitPolicies.map((p) => {
            const op = interpolate(frame, [p.delay, p.delay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={p.name} style={{ opacity: op, flex: 1 }}>
                <NBBox style={{ padding: "16px 20px", borderTop: `8px solid ${p.color}` }}>
                  <div style={{ fontFamily: NB.fontCN, fontSize: 26, fontWeight: 900, color: NB.ink }}>{p.name}</div>
                  <div style={{ fontFamily: NB.fontMono, fontSize: 13, fontWeight: 700, color: NB.gray, letterSpacing: 1, marginTop: 2 }}>{p.en}</div>
                  <div style={{ marginTop: 10, fontFamily: NB.fontCN, fontSize: 19, fontWeight: 700, color: NB.ink }}>{p.desc}</div>
                  <div style={{ marginTop: 8, fontFamily: NB.fontCN, fontSize: 16, fontWeight: 700, color: NB.green }}>✓ {p.pros}</div>
                  <div style={{ marginTop: 4, fontFamily: NB.fontCN, fontSize: 16, fontWeight: 700, color: NB.red }}>✗ {p.cons}</div>
                </NBBox>
              </div>
            );
          })}
        </div>
      </div>

      {/* 未命中时 */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 22 }}>
        <NBTag color={NB.ink} style={{ color: NB.yellow, marginBottom: 14 }}>未命中时 MISS</NBTag>
        <div style={{ display: "flex", gap: 16 }}>
          {missPolicies.map((p) => {
            const op = interpolate(frame, [p.delay, p.delay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={p.name} style={{ opacity: op, flex: 1 }}>
                <NBBox style={{ padding: "16px 20px", borderLeft: `10px solid ${p.color}` }}>
                  <div style={{ fontFamily: NB.fontCN, fontSize: 26, fontWeight: 900, color: NB.ink }}>{p.name}</div>
                  <div style={{ fontFamily: NB.fontMono, fontSize: 13, fontWeight: 700, color: NB.gray, letterSpacing: 1, marginTop: 2 }}>{p.en}</div>
                  <div style={{ marginTop: 10, fontFamily: NB.fontCN, fontSize: 19, fontWeight: 700, color: NB.ink }}>{p.desc}</div>
                </NBBox>
              </div>
            );
          })}
        </div>
      </div>

      {/* 记忆口诀 */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 22, opacity: interpolate(frame, [50, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <NBBox style={{ background: NB.ink, padding: "14px 26px" }}>
          {memory.map((m, i) => (
            <div key={i} style={{ fontFamily: NB.fontCN, fontSize: 21, fontWeight: 900, color: i === 0 ? NB.green : NB.yellow, lineHeight: 1.6 }}>
              💡 {m}
            </div>
          ))}
        </NBBox>
      </div>
    </SceneShell>
  );
};

// ==================== 场景8：结尾 ====================
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });

  const tags = ["局部性", "直接映射", "全相联", "组相联", "地址结构", "LRU", "FIFO", "直写", "回写", "写分配"];

  return (
    <SceneShell subtitle={{ text: SUBTITLES.outro, startFrame: 0, endFrame: DURATIONS.outro }}>
      <Audio src={staticFile("cache-principle/scene9_outro.mp3")} />

      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: NB.fontMono,
            fontSize: 96,
            fontWeight: 900,
            color: NB.ink,
            lineHeight: 1,
            WebkitTextStroke: "3px #111111",
          }}
        >
          CACHE
        </div>
        <div
          style={{
            fontFamily: NB.fontCN,
            fontSize: 58,
            fontWeight: 900,
            color: NB.ink,
            letterSpacing: 6,
            marginTop: 10,
          }}
        >
          总结 · 全掌握
        </div>
      </div>

      {/* 知识标签 */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
          maxWidth: 900,
          opacity: interpolate(frame, [25, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {tags.map((tag, i) => (
          <NBTag
            key={tag}
            color={[NB.yellow, NB.green, NB.red, NB.blue][i % 4]}
            style={{ fontSize: 19 }}
          >
            {tag}
          </NBTag>
        ))}
      </div>

      <div
        style={{
          marginTop: 36,
          opacity: interpolate(frame, [40, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <NBTag color={NB.red} style={{ fontSize: 24, padding: "12px 34px" }}>
          点赞 · 收藏 · 关注
        </NBTag>
      </div>
    </SceneShell>
  );
};

// ==================== 主视频组件 ====================
export const CachePrinciple: React.FC = () => {
  return (
    <>
      {/* BGM */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.08} loop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.principle}>
          <PrincipleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.concept}>
          <ConceptScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.mapping}>
          <MappingScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.hitrate}>
          <HitRateScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.address}>
          <AddressScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.replace}>
          <ReplaceScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.writepolicy}>
          <WritePolicyScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
