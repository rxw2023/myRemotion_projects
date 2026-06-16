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

// ==================== 颜色配置 ====================
const COLORS = {
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

// ==================== 字幕组件 ====================
const SUBTITLE_TEXTS: Record<string, string> = {
  scene1_title: "存储系统原理。从寄存器到磁盘，从SRAM到ROM，让我们一起了解计算机存储的层次结构。",
  scene2_hierarchy: "存储层次结构中，从快到慢、从小到大。核心思想是：上一层存储器作为低一层的高速缓存。寄存器最快，远程辅助存储最慢。",
  scene3_ram: "半导体随机存储器RAM。SRAM用触发器存储数据，速度快但成本高。DRAM用电容存储，容量大成本低，但需要定期刷新。两者各有优势。",
  scene4_addr: "DRAM内部是二维阵列，需要同时提供行地址和列地址。通过行列地址复用，外部只需要12根地址线。先送行地址，再送列地址，将24根引脚减少到12根。",
  scene5_flash: "Flash闪存和ROM只读存储器。Flash使用浮动门晶体管，是非易失性存储，广泛用于USB优盘和SSD固态硬盘。ROM包括EPROM和CDROM，断电后数据不会丢失。",
  scene6_cache: "Cache到主存层，解决CPU与主存速度不匹配的问题，由硬件自动完成。主存到辅存层，解决存储系统容量不足的问题，由硬件和操作系统共同完成。",
  scene7_outro: "感谢观看。存储系统原理，知识点梳理。点赞收藏关注，我们下期再见。",
};

const SubtitleBar: React.FC<{ sceneKey: string; startFrame?: number; endFrame?: number }> = ({
  sceneKey,
  startFrame = 0,
  endFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const text = SUBTITLE_TEXTS[sceneKey] || "";

  // Fade in/out
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10, endFrame - 10, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
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
          padding: "16px 40px",
          maxWidth: "90%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 30,
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

// ==================== 动画辅助 ====================

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

const SlideUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [delay, delay + 12], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ transform: `translateY(${y}px)`, opacity }}>
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
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16,
      padding: "24px 32px",
      boxShadow: COLORS.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

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
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
      }}
    >
      <Audio src={staticFile("storage-knowledge/scene1_title.mp3")} />
      <SubtitleBar sceneKey="scene1_title" startFrame={0} endFrame={DURATIONS.title} />

      {/* 装饰圆点 */}
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
                backgroundColor: i % 3 === 0 ? COLORS.accent : COLORS.accent2,
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
            border: `1.5px solid ${COLORS.accent}40`,
            backgroundColor: `${COLORS.accent}08`,
            marginBottom: 36,
          }}
        >
          <span style={{ color: COLORS.accent, fontSize: 24, fontWeight: 500, letterSpacing: 4 }}>
            计算机体系结构
          </span>
        </div>
      </FadeIn>

      <div
        style={{
          fontSize: 80,
          fontWeight: "bold",
          color: COLORS.accent,
          transform: `scale(${titleScale})`,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: 6,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        存储系统<br />原理
      </div>

      <div
        style={{
          fontSize: 30,
          color: COLORS.textMid,
          marginTop: 28,
          opacity: subtitleOpacity,
          letterSpacing: 4,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        从寄存器到磁盘 · 从SRAM到ROM
      </div>

      <div
        style={{
          width: 100,
          height: 3,
          backgroundColor: COLORS.accent,
          marginTop: 24,
          opacity: lineOpacity,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

// ==================== 场景2：存储层次结构 ====================
const HierarchyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const layers = [
    { label: "寄存器", en: "Registers", size: 80, color: "#DC2626", delay: 0 },
    { label: "L1 Cache", en: "SRAM", size: 115, color: "#EA580C", delay: 5 },
    { label: "L2 Cache", en: "SRAM", size: 155, color: "#D97706", delay: 10 },
    { label: "L3 Cache", en: "SRAM", size: 210, color: "#2563EB", delay: 15 },
    { label: "主存 (RAM)", en: "DRAM", size: 290, color: "#059669", delay: 20 },
    { label: "本地辅助存储", en: "Local Disk", size: 380, color: "#7C3AED", delay: 25 },
    { label: "远程辅助存储", en: "Remote", size: 480, color: "#6366F1", delay: 30 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 40px",
      }}
    >
      <Audio src={staticFile("storage-knowledge/scene2_hierarchy.mp3")} />
      <SubtitleBar sceneKey="scene2_hierarchy" startFrame={0} endFrame={DURATIONS.hierarchy} />

      <SlideUp delay={0}>
        <h1
          style={{
            fontSize: 44,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 6,
            letterSpacing: 3,
            textAlign: "center",
          }}
        >
          存储层次结构
        </h1>
      </SlideUp>

      <SlideUp delay={4}>
        <p style={{ color: COLORS.textMid, fontSize: 22, marginBottom: 22, letterSpacing: 2, textAlign: "center" }}>
          从快到慢 · 从小到大 · 逐层缓存
        </p>
      </SlideUp>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: "100%", maxWidth: 600 }}>
        {layers.map((layer) => {
          const progress = spring({
            frame: frame - layer.delay,
            fps,
            config: { damping: 20, stiffness: 150 },
          });
          const opacity = interpolate(frame, [layer.delay, layer.delay + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={layer.label}
              style={{
                width: layer.size,
                height: 52,
                transform: `scaleX(${progress})`,
                opacity,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `${layer.color}08`,
                  border: `1.5px solid ${layer.color}40`,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                  boxShadow: `0 1px 4px ${layer.color}15`,
                }}
              >
                <span style={{ color: layer.color, fontSize: 20, fontWeight: "bold" }}>
                  {layer.label}
                </span>
                <span style={{ color: COLORS.textDim, fontSize: 16 }}>
                  {layer.en}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <FadeIn delay={38}>
        <div style={{ display: "flex", gap: 12, marginTop: 18, justifyContent: "center" }}>
          <span style={{ color: COLORS.accent, fontSize: 17, backgroundColor: `${COLORS.accent}10`, padding: "6px 18px", borderRadius: 16, border: `1px solid ${COLORS.accent}30` }}>越快</span>
          <span style={{ color: COLORS.textDim, fontSize: 17 }}>→</span>
          <span style={{ color: COLORS.accent3, fontSize: 17, backgroundColor: `${COLORS.accent3}10`, padding: "6px 18px", borderRadius: 16, border: `1px solid ${COLORS.accent3}30` }}>越大</span>
          <span style={{ color: COLORS.textDim, fontSize: 17 }}>·</span>
          <span style={{ color: COLORS.accent2, fontSize: 17, backgroundColor: `${COLORS.accent2}10`, padding: "6px 18px", borderRadius: 16, border: `1px solid ${COLORS.accent2}30` }}>越慢</span>
        </div>
      </FadeIn>

      <FadeIn delay={45}>
        <WhiteCard style={{ marginTop: 16, maxWidth: 600 }}>
          <p style={{ color: COLORS.text, fontSize: 20, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            <span style={{ color: COLORS.accent2, fontWeight: "bold" }}>核心思想：</span>
            上一层存储器作为低一层存储器的<span style={{ color: COLORS.accent, fontWeight: "bold" }}>高速缓存</span>
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景3：RAM 对比 ====================
const RAMScene: React.FC = () => {
  const frame = useCurrentFrame();

  const sramItems = [
    { label: "触发器存储", desc: "4~6个晶体管组成" },
    { label: "无需刷新", desc: "通电即保持数据" },
    { label: "速度最快", desc: "用于 CPU 缓存" },
    { label: "成本高", desc: "容量小·功耗高" },
  ];

  const dramItems = [
    { label: "1T1C 结构", desc: "1晶体管+1电容器" },
    { label: "定期刷新", desc: "电容漏电需充电" },
    { label: "容量大", desc: "用于主内存·显存" },
    { label: "成本低", desc: "功耗低·速度较慢" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 40px",
      }}
    >
      <Audio src={staticFile("storage-knowledge/scene3_ram.mp3")} />
      <SubtitleBar sceneKey="scene3_ram" startFrame={0} endFrame={DURATIONS.ram} />

      <SlideUp delay={0}>
        <h1
          style={{
            fontSize: 44,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 4,
            letterSpacing: 3,
            textAlign: "center",
          }}
        >
          RAM · 半导体随机存储器
        </h1>
      </SlideUp>

      <SlideUp delay={4}>
        <p style={{ color: COLORS.textMid, fontSize: 21, marginBottom: 22, letterSpacing: 2, textAlign: "center" }}>
          Semiconductor Random-Access Memory
        </p>
      </SlideUp>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 800, justifyContent: "center" }}>
        {/* SRAM */}
        <div style={{ flex: 1, maxWidth: 360 }}>
          <FadeIn delay={6}>
            <WhiteCard style={{ borderTop: `4px solid ${COLORS.accent2}`, padding: "18px 20px" }}>
              <h2 style={{ color: COLORS.accent2, fontSize: 38, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: 2, textAlign: "center" }}>SRAM</h2>
              <p style={{ color: COLORS.textDim, fontSize: 16, margin: "0 0 14px 0", textAlign: "center" }}>Static RAM</p>
              {sramItems.map((item, i) => {
                const op = interpolate(frame, [10 + i * 6, 16 + i * 6], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                return (
                  <div key={item.label} style={{ opacity: op, display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 12px", background: `${COLORS.accent2}06`, borderRadius: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.accent2, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ color: COLORS.textDim, fontSize: 16 }}>{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </WhiteCard>
          </FadeIn>
        </div>

        {/* VS */}
        <FadeIn delay={15}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: "bold", color: "#FFFFFF", boxShadow: COLORS.shadowLg,
            }}>VS</div>
          </div>
        </FadeIn>

        {/* DRAM */}
        <div style={{ flex: 1, maxWidth: 360 }}>
          <FadeIn delay={12}>
            <WhiteCard style={{ borderTop: `4px solid ${COLORS.accent3}`, padding: "18px 20px" }}>
              <h2 style={{ color: COLORS.accent3, fontSize: 38, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: 2, textAlign: "center" }}>DRAM</h2>
              <p style={{ color: COLORS.textDim, fontSize: 16, margin: "0 0 14px 0", textAlign: "center" }}>Dynamic RAM</p>
              {dramItems.map((item, i) => {
                const op = interpolate(frame, [16 + i * 6, 22 + i * 6], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                return (
                  <div key={item.label} style={{ opacity: op, display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 12px", background: `${COLORS.accent3}06`, borderRadius: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.accent3, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ color: COLORS.textDim, fontSize: 16 }}>{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </WhiteCard>
          </FadeIn>
        </div>
      </div>

      <FadeIn delay={38}>
        <WhiteCard style={{ marginTop: 16, maxWidth: 740 }}>
          <p style={{ color: COLORS.text, fontSize: 18, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            <span style={{ color: COLORS.accent, fontWeight: "bold" }}>关键区别：</span>
            SRAM 用触发器 · 快但贵；DRAM 用电容 · 慢但便宜 · 需刷新
          </p>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景4：DRAM 行列地址复用 ====================
const AddressMultiplexingScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 40px",
      }}
    >
      <Audio src={staticFile("storage-knowledge/scene4_addr.mp3")} />
      <SubtitleBar sceneKey="scene4_addr" startFrame={0} endFrame={DURATIONS.addressMux} />

      <SlideUp delay={0}>
        <h1
          style={{
            fontSize: 44,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 6,
            letterSpacing: 3,
            textAlign: "center",
          }}
        >
          DRAM 行列地址复用
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: COLORS.textMid, fontSize: 21, marginBottom: 22, letterSpacing: 2, textAlign: "center" }}>
          Address Multiplexing — 引脚减半的关键技术
        </p>
      </SlideUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 760 }}>
        <FadeIn delay={8}>
          <WhiteCard style={{ borderLeft: `4px solid ${COLORS.accent4}`, padding: "18px 24px" }}>
            <h3 style={{ color: COLORS.accent4, fontSize: 24, margin: "0 0 12px 0", textAlign: "center" }}>问题</h3>
            <p style={{ color: COLORS.text, fontSize: 19, lineHeight: 1.7, margin: 0, textAlign: "center" }}>
              DRAM 内部是 <span style={{ color: COLORS.accent, fontWeight: "bold" }}>二维阵列</span>，需同时提供行地址和列地址。
              16M×4bit 芯片需要 <span style={{ color: COLORS.accent4, fontWeight: "bold" }}>24 根</span>地址线。
              70-80年代封装引脚有限，放不下！
            </p>
          </WhiteCard>
        </FadeIn>

        <FadeIn delay={14}>
          <WhiteCard style={{ borderLeft: `4px solid ${COLORS.accent2}`, padding: "18px 24px" }}>
            <h3 style={{ color: COLORS.accent2, fontSize: 24, margin: "0 0 12px 0", textAlign: "center" }}>方案</h3>
            <p style={{ color: COLORS.text, fontSize: 19, lineHeight: 1.7, margin: 0, textAlign: "center" }}>
              外部只提供 <span style={{ color: COLORS.accent, fontWeight: "bold" }}>12 根</span>地址线，地址分两次送入：
            </p>
            <div style={{ marginTop: 12, fontSize: 18, textAlign: "center" }}>
              <div style={{ color: COLORS.accent, marginBottom: 6 }}>① RAS 信号 · 锁存行地址</div>
              <div style={{ color: COLORS.accent2 }}>② CAS 信号 · 锁存列地址</div>
            </div>
          </WhiteCard>
        </FadeIn>
      </div>

      <FadeIn delay={22}>
        <WhiteCard style={{ marginTop: 16, width: "100%", maxWidth: 760 }}>
          <h3 style={{ color: COLORS.text, fontSize: 22, margin: "0 0 12px 0", textAlign: "center" }}>效果：24 → 12 根地址线</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <div style={{ background: `${COLORS.accent4}08`, border: `1.5px solid ${COLORS.accent4}30`, borderRadius: 12, padding: "14px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 44, fontWeight: "bold", color: COLORS.accent4 }}>24</div>
              <div style={{ fontSize: 16, color: COLORS.textDim }}>不复用</div>
            </div>
            <span style={{ fontSize: 32, color: COLORS.textDim }}>→</span>
            <div style={{ background: `${COLORS.accent2}08`, border: `2px solid ${COLORS.accent2}40`, borderRadius: 12, padding: "14px 24px", textAlign: "center", boxShadow: `0 2px 12px ${COLORS.accent2}20` }}>
              <div style={{ fontSize: 44, fontWeight: "bold", color: COLORS.accent2 }}>12</div>
              <div style={{ fontSize: 16, color: COLORS.textDim }}>复用后</div>
            </div>
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景5：Flash & ROM ====================
const FlashROMScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 40px",
      }}
    >
      <Audio src={staticFile("storage-knowledge/scene5_flash.mp3")} />
      <SubtitleBar sceneKey="scene5_flash" startFrame={0} endFrame={DURATIONS.flashRom} />

      <SlideUp delay={0}>
        <h1
          style={{
            fontSize: 44,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 22,
            letterSpacing: 3,
            textAlign: "center",
          }}
        >
          Flash 存储 · ROM 类型
        </h1>
      </SlideUp>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 800, justifyContent: "center" }}>
        {/* Flash */}
        <FadeIn delay={6}>
          <WhiteCard style={{ borderTop: `4px solid ${COLORS.accent3}`, padding: "18px 22px", flex: 1, maxWidth: 380 }}>
            <h2 style={{ color: COLORS.accent3, fontSize: 32, fontWeight: "bold", margin: "0 0 8px 0", letterSpacing: 2, textAlign: "center" }}>Flash 闪存</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {["非易失性存储", "浮动门晶体管", "NAND / NOR Flash", "USB 优盘 · SSD · 手机存储"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: COLORS.accent3, fontSize: 18 }}>◆</span>
                  <span style={{ color: COLORS.text, fontSize: 18 }}>{item}</span>
                </div>
              ))}
            </div>
          </WhiteCard>
        </FadeIn>

        {/* ROM */}
        <FadeIn delay={12}>
          <WhiteCard style={{ borderTop: `4px solid ${COLORS.accent}`, padding: "18px 22px", flex: 1, maxWidth: 380 }}>
            <h2 style={{ color: COLORS.accent, fontSize: 32, fontWeight: "bold", margin: "0 0 8px 0", letterSpacing: 2, textAlign: "center" }}>ROM · 只读存储器</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: `${COLORS.accent}08`, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <span style={{ color: COLORS.accent, fontSize: 18, fontWeight: "bold" }}>EPROM</span>
                <span style={{ color: COLORS.textDim, fontSize: 16, marginLeft: 6 }}>紫外线擦除 · 可重写 · BIOS 芯片</span>
              </div>
              <div style={{ background: `${COLORS.accent2}08`, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <span style={{ color: COLORS.accent2, fontSize: 18, fontWeight: "bold" }}>CDROM</span>
                <span style={{ color: COLORS.textDim, fontSize: 16, marginLeft: 6 }}>光盘 · 生产时一次性写入 · 只读</span>
              </div>
              <div style={{ background: `${COLORS.accent3}08`, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <span style={{ color: COLORS.accent3, fontSize: 18 }}>非易失性 · 固件存储 · 断电不丢</span>
              </div>
            </div>
          </WhiteCard>
        </FadeIn>
      </div>

      <FadeIn delay={22}>
        <WhiteCard style={{ marginTop: 16, width: "100%", maxWidth: 820 }}>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 16, marginBottom: 4 }}>Flash 速度</div>
              <div style={{ color: COLORS.accent, fontSize: 18, fontWeight: "bold" }}>慢于 RAM · 快于 HDD</div>
            </div>
            <div style={{ width: 1, background: COLORS.border, alignSelf: "stretch" }} />
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 16, marginBottom: 4 }}>RAM 特点</div>
              <div style={{ color: COLORS.accent2, fontSize: 18, fontWeight: "bold" }}>易失性 · 断电数据丢失</div>
            </div>
            <div style={{ width: 1, background: COLORS.border, alignSelf: "stretch" }} />
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 16, marginBottom: 4 }}>Flash/ROM</div>
              <div style={{ color: COLORS.accent3, fontSize: 18, fontWeight: "bold" }}>非易失性 · 断电保留</div>
            </div>
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景6：两个关键层次 ====================
const CacheMemoryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftProgress = spring({ frame: frame - 3, fps, config: { damping: 20 } });
  const rightProgress = spring({ frame: frame - 12, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 40px",
      }}
    >
      <Audio src={staticFile("storage-knowledge/scene6_cache.mp3")} />
      <SubtitleBar sceneKey="scene6_cache" startFrame={0} endFrame={DURATIONS.cacheMemory} />

      <SlideUp delay={0}>
        <h1
          style={{
            fontSize: 44,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 4,
            letterSpacing: 3,
            textAlign: "center",
          }}
        >
          两个关键层次
        </h1>
      </SlideUp>

      <SlideUp delay={3}>
        <p style={{ color: COLORS.textMid, fontSize: 22, marginBottom: 24, letterSpacing: 2, textAlign: "center" }}>
          解决速度不匹配 · 解决容量不足
        </p>
      </SlideUp>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 820, justifyContent: "center" }}>
        <div style={{ flex: 1, maxWidth: 380, transform: `scale(${leftProgress})` }}>
          <WhiteCard style={{ borderTop: `4px solid ${COLORS.accent2}`, padding: "18px 22px" }}>
            <h3 style={{ color: COLORS.accent2, fontSize: 24, margin: "0 0 12px 0", textAlign: "center" }}>Cache — 主存层</h3>
            <p style={{ color: COLORS.text, fontSize: 18, lineHeight: 1.6, margin: "0 0 12px 0", textAlign: "center" }}>
              解决 <span style={{ color: COLORS.accent, fontWeight: "bold" }}>CPU 与主存速度不匹配</span>
            </p>
            <div style={{ background: `${COLORS.accent2}08`, borderRadius: 8, padding: "10px 14px", border: `1px solid ${COLORS.accent2}30`, textAlign: "center" }}>
              <span style={{ color: COLORS.accent2, fontSize: 17, fontWeight: "bold" }}>硬件自动完成</span>
            </div>
          </WhiteCard>
        </div>

        <div style={{ flex: 1, maxWidth: 380, transform: `scale(${rightProgress})` }}>
          <WhiteCard style={{ borderTop: `4px solid ${COLORS.accent3}`, padding: "18px 22px" }}>
            <h3 style={{ color: COLORS.accent3, fontSize: 24, margin: "0 0 12px 0", textAlign: "center" }}>主存 — 辅存层</h3>
            <p style={{ color: COLORS.text, fontSize: 18, lineHeight: 1.6, margin: "0 0 12px 0", textAlign: "center" }}>
              解决 <span style={{ color: COLORS.accent, fontWeight: "bold" }}>存储系统容量不足</span>
            </p>
            <div style={{ background: `${COLORS.accent3}08`, borderRadius: 8, padding: "10px 14px", border: `1px solid ${COLORS.accent3}30`, textAlign: "center" }}>
              <span style={{ color: COLORS.accent3, fontSize: 17, fontWeight: "bold" }}>硬件 + 操作系统 · 对应用透明</span>
            </div>
          </WhiteCard>
        </div>
      </div>

      <FadeIn delay={20}>
        <WhiteCard style={{ marginTop: 18, width: "100%", maxWidth: 820 }}>
          <h3 style={{ color: COLORS.text, fontSize: 20, margin: "0 0 14px 0", textAlign: "center" }}>CPU 数据访问流程</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {["CPU", "→", "Cache", "→(未命中)", "主存", "→(未命中)", "磁盘"].map((item, i) => {
              const isArrow = item.startsWith("→");
              const tagColors = ["#DC2626", "", COLORS.accent2, "", COLORS.accent, "", COLORS.accent3];
              return (
                <span key={i} style={{
                  color: isArrow ? COLORS.textDim : tagColors[i] || COLORS.text,
                  fontSize: isArrow ? 22 : 18,
                  fontWeight: isArrow ? "normal" : "bold",
                  background: isArrow ? "transparent" : COLORS.bgCard2,
                  padding: isArrow ? "0" : "8px 14px",
                  borderRadius: isArrow ? 0 : 8,
                  border: isArrow ? "none" : `1px solid ${COLORS.border}`,
                }}>{item}</span>
              );
            })}
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景7：结尾 ====================
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
      }}
    >
      <Audio src={staticFile("storage-knowledge/scene7_outro.mp3")} />
      <SubtitleBar sceneKey="scene7_outro" startFrame={0} endFrame={DURATIONS.outro} />

      <div
        style={{
          fontSize: 64,
          fontWeight: "bold",
          color: COLORS.accent,
          transform: `scale(${scale})`,
          letterSpacing: 6,
          textAlign: "center",
        }}
      >
        谢谢观看
      </div>

      <FadeIn delay={20}>
        <div style={{ marginTop: 28, fontSize: 28, color: COLORS.textMid, letterSpacing: 3, textAlign: "center" }}>
          存储系统原理 · 知识点梳理
        </div>
      </FadeIn>

      <FadeIn delay={35}>
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {["寄存器", "SRAM", "DRAM", "Flash", "ROM", "Cache"].map((tag) => (
            <span key={tag} style={{ color: COLORS.accent, fontSize: 18, padding: "8px 20px", borderRadius: 22, border: `1.5px solid ${COLORS.accent}40`, backgroundColor: `${COLORS.accent}08` }}>{tag}</span>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={50}>
        <div style={{ marginTop: 32, color: COLORS.textMid, fontSize: 21, letterSpacing: 3, textAlign: "center" }}>
          点赞 · 收藏 · 关注
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景时长配置（基于 TTS 时长 + 缓冲区） ====================
const DURATIONS = {
  title: 290,       // TTS 246f + 44f buffer for visual
  hierarchy: 420,   // TTS 369f + 51f
  ram: 440,         // TTS 395f + 45f
  addressMux: 460,  // TTS 420f + 40f
  flashRom: 515,    // TTS 472f + 43f
  cacheMemory: 450, // TTS 400f + 50f
  outro: 280,       // TTS 228f + 52f
};

// ==================== 主视频组件 ====================
export const StorageKnowledge: React.FC = () => {
  return (
    <>
      {/* BGM - 配音时降低音量 */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.08} loop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.hierarchy}>
          <HierarchyScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.ram}>
          <RAMScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.addressMux}>
          <AddressMultiplexingScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.flashRom}>
          <FlashROMScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.cacheMemory}>
          <CacheMemoryScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
