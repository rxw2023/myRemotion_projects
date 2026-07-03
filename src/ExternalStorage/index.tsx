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
import {
  FadeIn,
  SlideUp,
  WhiteCard,
  SubtitleBar,
  SHARED_COLORS,
} from "../shared/components";

const C = SHARED_COLORS;

// ==================== 字幕文本 ====================
const SUBTITLES: Record<string, string> = {
  title:
    "外部存储科普。从机械硬盘的物理结构到固态硬盘的闪存技术，让我们一起了解计算机外存的工作原理、性能指标与选型对比。",
  hdd_structure:
    "机械硬盘使用磁性存储介质。数据存储在旋转的盘片上，每个盘片有两个盘面，每个盘面对应一个磁头。盘面上的同心圆环称为磁道，相同半径位置的所有磁道组成柱面，每个磁道分为多个扇区，扇区是数据读写的最小单位，大小通常为512字节或4KB。",
  chs:
    "CHS寻址通过柱面号、磁头号、扇区号三个字段定位物理扇区。柱面号位数等于log2柱面数向上取整，磁头号位数等于log2盘面数向上取整，扇区号位数等于log2每道扇区数向上取整。例如：1000个柱面需10位，4个盘面需2位，32扇区每道需5位，总共17位地址。访问时先移动磁头到目标柱面，再选择盘面，最后等待扇区旋转到磁头下方。",
  hdd_perf:
    "磁盘性能指标。平均存取时间等于寻道时间加旋转延迟时间加传输时间。寻道时间是磁头移动到目标磁道的时间，取决于移动距离和驱动器性能。旋转延迟是盘片旋转使目标扇区到达磁头下方的时间，平均为半圈。传输时间是实际读写数据的时间。数据传速率D_r等于转速r乘以每道字节数N，r为每秒转数，N为每道扇区数乘以扇区大小。5400转每秒约90转，7200转每秒约120转。",
  raid:
    "RAID独立磁盘冗余阵列，将多个物理磁盘组合成一个逻辑磁盘。核心技术有四种。磁盘镜像，同一数据写入多块磁盘，对应RAID1。条带化，数据分块分散存储，对应RAID0，无容错。奇偶校验，冗余校验位实现数据重建，对应RAID3、5、6，兼顾可靠性和存储效率。RAID在考研中仅考过一题，了解基本概念即可。",
  ssd:
    "固态硬盘SSD使用NAND闪存作为存储介质，没有机械部件。与机械硬盘相比，SSD读写速度极快，可达500到7000兆字节每秒，而HDD仅100到200兆字节每秒。随机访问延迟极低，在0.1毫秒以下，而HDD需5到10毫秒。SSD抗震动、无噪音、轻薄，无需碎片整理，适合做系统盘和高性能计算。HDD优势在于大容量存储成本低，适合备份和归档。",
  outro:
    "感谢观看。机械硬盘的CHS寻址、性能指标计算，RAID的核心技术，固态硬盘与机械硬盘的对比。点赞收藏关注，我们下期再见。",
};

// ==================== 场景时长（TTS + buffer） ====================
const DURATIONS = {
  title: 376,          // TTS 336f + 40f
  hdd_structure: 700,  // TTS 657f + 43f
  chs: 1012,           // TTS 967f + 45f
  hdd_perf: 1210,      // TTS 1167f + 43f
  raid: 944,           // TTS 904f + 40f
  ssd: 1008,           // TTS 968f + 40f
  outro: 406,          // TTS 366f + 40f
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
      <Audio src={staticFile("external-storage/scene1_title.mp3")} />
      <SubtitleBar text={SUBTITLES.title} startFrame={0} endFrame={DURATIONS.title} />

      {/* 装饰圆点 */}
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.4 }}>
        {Array.from({ length: 30 }, (_, i) => {
          const x = (i * 137 + 50) % 100;
          const y = (i * 89 + 30) % 100;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
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
            计算机组成原理
          </span>
        </div>
      </FadeIn>

      <div
        style={{
          fontSize: 76,
          fontWeight: "bold",
          color: C.accent,
          transform: `scale(${titleScale})`,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: 6,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        外部存储
      </div>

      <div
        style={{
          fontSize: 28,
          color: C.textMid,
          marginTop: 28,
          opacity: subtitleOpacity,
          letterSpacing: 3,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        机械硬盘 · RAID · 固态硬盘
      </div>

      <div
        style={{
          width: 100,
          height: 3,
          backgroundColor: C.accent,
          marginTop: 24,
          opacity: subtitleOpacity,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

// ==================== 场景2：HDD 物理结构 ====================
const HDDStructureScene: React.FC = () => {
  const frame = useCurrentFrame();

  const concepts = [
    { name: "盘片 Platter", desc: "磁性存储介质，旋转载体", color: C.accent, delay: 8 },
    { name: "磁道 Track", desc: "同心圆环，数据记录路径", color: C.accent2, delay: 12 },
    { name: "柱面 Cylinder", desc: "同半径磁道的集合", color: C.accent3, delay: 16 },
    { name: "扇区 Sector", desc: "最小读写单位 512B/4KB", color: C.accent5, delay: 20 },
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
      <Audio src={staticFile("external-storage/scene2_hdd_structure.mp3")} />
      <SubtitleBar text={SUBTITLES.hdd_structure} startFrame={0} endFrame={DURATIONS.hdd_structure} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          机械硬盘 · 物理结构
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 21, marginBottom: 20, letterSpacing: 2, textAlign: "center" }}>
          Hard Disk Drive — 磁性存储 · 非易失性
        </p>
      </SlideUp>

      {/* 四大概念卡片 */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 860, flexWrap: "wrap", justifyContent: "center" }}>
        {concepts.map((item) => {
          const op = interpolate(frame, [item.delay, item.delay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={item.name} style={{ opacity: op, flex: "1 1 180px", maxWidth: 200 }}>
              <WhiteCard style={{ padding: "16px", borderTop: `4px solid ${item.color}`, textAlign: "center" }}>
                <h3 style={{ color: item.color, fontSize: 22, margin: "0 0 4px 0" }}>{item.name}</h3>
                <p style={{ color: C.textMid, fontSize: 15, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              </WhiteCard>
            </div>
          );
        })}
      </div>

      {/* 结构示意 */}
      <FadeIn delay={18}>
        <WhiteCard style={{ maxWidth: 820, marginTop: 16, padding: "14px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, textAlign: "center", flexWrap: "wrap" }}>
            <div>
              <span style={{ color: C.accent4, fontSize: 28, fontWeight: "bold" }}>N</span>
              <p style={{ color: C.textDim, fontSize: 14, margin: "2px 0 0" }}>个盘片 → 2N 个盘面</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", color: C.textDim, fontSize: 20 }}>→</div>
            <div>
              <span style={{ color: C.accent, fontSize: 28, fontWeight: "bold" }}>2N</span>
              <p style={{ color: C.textDim, fontSize: 14, margin: "2px 0 0" }}>个磁头（每盘面一个）</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", color: C.textDim, fontSize: 20 }}>→</div>
            <div>
              <span style={{ color: C.accent2, fontSize: 28, fontWeight: "bold" }}>磁头</span>
              <p style={{ color: C.textDim, fontSize: 14, margin: "2px 0 0" }}>悬浮在气流上读写</p>
            </div>
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景3：CHS 寻址 ====================
const CHSScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formulaScale = spring({ frame: frame - 10, fps, config: { damping: 15 } });

  const fields = [
    { label: "柱面号 C", bits: "⌈log₂(1000)⌉ = 10", color: C.accent, delay: 12 },
    { label: "磁头号 H", bits: "⌈log₂(4)⌉ = 2", color: C.accent2, delay: 16 },
    { label: "扇区号 S", bits: "⌈log₂(32)⌉ = 5", color: C.accent3, delay: 20 },
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
      <Audio src={staticFile("external-storage/scene3_chs.mp3")} />
      <SubtitleBar text={SUBTITLES.chs} startFrame={0} endFrame={DURATIONS.chs} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 44, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          CHS 寻址
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 21, marginBottom: 16, letterSpacing: 2, textAlign: "center" }}>
          Cylinder-Head-Sector · 三字段物理地址
        </p>
      </SlideUp>

      {/* 地址公式 */}
      <FadeIn delay={6}>
        <WhiteCard style={{ maxWidth: 780, marginBottom: 16, padding: "16px 32px", textAlign: "center" }}>
          <div style={{
            fontSize: 26,
            fontWeight: "bold",
            color: C.accent,
            fontFamily: "monospace",
            letterSpacing: 2,
            transform: `scale(${formulaScale})`,
          }}>
            CHS 地址 = C + H + S
          </div>
          <div style={{ color: C.textMid, fontSize: 17, marginTop: 6 }}>
            总位数 = ⌈log₂(柱面数)⌉ + ⌈log₂(盘面数)⌉ + ⌈log₂(每道扇区数)⌉
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 例题：三个字段 */}
      <FadeIn delay={10}>
        <WhiteCard style={{ maxWidth: 780, marginBottom: 16, padding: "12px 20px" }}>
          <h4 style={{ color: C.accent4, fontSize: 18, margin: "0 0 10px 0", textAlign: "center" }}>
            📐 例题：1000 柱面 · 4 盘面 · 32 扇区/道
          </h4>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {fields.map((f) => {
              const op = interpolate(frame, [f.delay, f.delay + 8], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              return (
                <div key={f.label} style={{ opacity: op, flex: 1, textAlign: "center" }}>
                  <div style={{
                    padding: "12px",
                    background: `${f.color}08`,
                    border: `2px solid ${f.color}30`,
                    borderRadius: 10,
                  }}>
                    <div style={{ color: f.color, fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>{f.label}</div>
                    <div style={{ color: C.text, fontSize: 18, fontFamily: "monospace" }}>{f.bits} 位</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* 结果 */}
          <FadeIn delay={26}>
            <div style={{
              marginTop: 14,
              padding: "12px",
              background: `linear-gradient(135deg, ${C.accent}10, ${C.accent2}10)`,
              borderRadius: 10,
              textAlign: "center",
              border: `2px solid ${C.accent}30`,
            }}>
              <span style={{ color: C.accent, fontSize: 22, fontWeight: "bold" }}>
                总计：10 + 2 + 5 = 17 位 → 唯一标识 2¹⁷ = 131072 个扇区
              </span>
            </div>
          </FadeIn>
        </WhiteCard>
      </FadeIn>

      {/* 访问流程 */}
      <FadeIn delay={28}>
        <WhiteCard style={{ maxWidth: 780, padding: "12px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { step: "①", text: "磁头移动到目标柱面", color: C.accent4 },
              { step: "②", text: "选择对应盘面的磁头", color: C.accent3 },
              { step: "③", text: "等待目标扇区旋转到位", color: C.accent2 },
            ].map((s, i) => (
              <React.Fragment key={s.step}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ color: s.color, fontSize: 18, fontWeight: "bold" }}>{s.step}</span>
                  <p style={{ color: C.textMid, fontSize: 15, margin: "4px 0 0" }}>{s.text}</p>
                </div>
                {i < 2 && <span style={{ color: C.textDim, fontSize: 20 }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景4：HDD 性能指标 ====================
const HDDPerfScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formulaScale = spring({ frame: frame - 8, fps, config: { damping: 15 } });

  const metrics = [
    {
      name: "寻道时间", en: "Seek Time",
      desc: "磁头移动到目标磁道的时间，取决于移动距离和驱动器性能",
      color: C.accent4, delay: 10,
    },
    {
      name: "旋转延迟", en: "Rotational Latency",
      desc: "盘片旋转使目标扇区到达磁头下方，平均半圈",
      color: C.accent3, delay: 15,
    },
    {
      name: "传输时间", en: "Transfer Time",
      desc: "实际读写数据的时间，取决于扇区大小和数据传输率",
      color: C.accent2, delay: 20,
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
        padding: "50px 36px",
      }}
    >
      <Audio src={staticFile("external-storage/scene4_hdd_perf.mp3")} />
      <SubtitleBar text={SUBTITLES.hdd_perf} startFrame={0} endFrame={DURATIONS.hdd_perf} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 42, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          磁盘性能指标
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 16, letterSpacing: 2, textAlign: "center" }}>
          Average Access Time · Data Transfer Rate
        </p>
      </SlideUp>

      {/* 平均存取时间公式 */}
      <FadeIn delay={6}>
        <WhiteCard style={{ maxWidth: 800, marginBottom: 14, padding: "16px 32px", textAlign: "center" }}>
          <div style={{
            fontSize: 24,
            fontWeight: "bold",
            color: C.accent,
            transform: `scale(${formulaScale})`,
            fontFamily: "monospace",
            letterSpacing: 2,
          }}>
            T_access = T_seek + T_rotation + T_transfer
          </div>
          <div style={{ color: C.textMid, fontSize: 17, marginTop: 6 }}>
            平均存取时间 = 寻道时间 + 旋转延迟时间 + 传输时间
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 三项指标卡片 */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 840 }}>
        {metrics.map((m) => {
          const op = interpolate(frame, [m.delay, m.delay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={m.name} style={{ opacity: op, flex: 1 }}>
              <WhiteCard style={{ padding: "14px 16px", borderTop: `4px solid ${m.color}` }}>
                <h3 style={{ color: m.color, fontSize: 22, margin: "0 0 2px 0", textAlign: "center" }}>{m.name}</h3>
                <p style={{ color: C.textDim, fontSize: 14, margin: "0 0 8px 0", textAlign: "center" }}>{m.en}</p>
                <p style={{ color: C.text, fontSize: 16, margin: 0, lineHeight: 1.6, textAlign: "center" }}>{m.desc}</p>
              </WhiteCard>
            </div>
          );
        })}
      </div>

      {/* 数据传输率 */}
      <FadeIn delay={24}>
        <WhiteCard style={{ maxWidth: 800, marginTop: 14, padding: "16px 32px", textAlign: "center" }}>
          <div style={{
            fontSize: 24,
            fontWeight: "bold",
            color: C.accent2,
            fontFamily: "monospace",
            letterSpacing: 2,
          }}>
            D_r = r × N
          </div>
          <div style={{ color: C.textMid, fontSize: 16, marginTop: 4 }}>
            r = 转速 (转/秒) &nbsp;|&nbsp; N = 每道字节数 = 每道扇区数 × 扇区大小
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 10 }}>
            <span style={{ color: C.accent3, fontSize: 17, fontWeight: "bold" }}>5400 RPM ≈ 90 rev/s</span>
            <span style={{ color: C.accent, fontSize: 17, fontWeight: "bold" }}>7200 RPM ≈ 120 rev/s</span>
          </div>
        </WhiteCard>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景5：RAID ====================
const RAIDScene: React.FC = () => {
  const frame = useCurrentFrame();

  const techs = [
    {
      name: "磁盘镜像", en: "Mirroring",
      desc: "同一数据写入多块磁盘，实现冗余保护",
      raid: "RAID 1",
      color: C.accent2, delay: 8,
    },
    {
      name: "条带化", en: "Striping",
      desc: "数据分块分散存储到多块磁盘，提升读写性能",
      raid: "RAID 0",
      color: C.accent3, delay: 14,
    },
    {
      name: "奇偶校验", en: "Parity",
      desc: "冗余校验位实现数据重建，兼顾可靠性和效率",
      raid: "RAID 3/5/6",
      color: C.accent5, delay: 20,
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
        padding: "50px 36px",
      }}
    >
      <Audio src={staticFile("external-storage/scene5_raid.mp3")} />
      <SubtitleBar text={SUBTITLES.raid} startFrame={0} endFrame={DURATIONS.raid} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 42, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          RAID 磁盘阵列
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 18, letterSpacing: 2, textAlign: "center" }}>
          Redundant Array of Independent Disks
        </p>
      </SlideUp>

      {/* 三大核心技术 */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 860 }}>
        {techs.map((t) => {
          const op = interpolate(frame, [t.delay, t.delay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <div key={t.name} style={{ opacity: op, flex: 1 }}>
              <WhiteCard style={{ padding: "14px 16px", borderTop: `4px solid ${t.color}` }}>
                <h3 style={{ color: t.color, fontSize: 22, margin: "0 0 2px 0", textAlign: "center" }}>{t.name}</h3>
                <p style={{ color: C.textDim, fontSize: 14, margin: "0 0 8px 0", textAlign: "center" }}>{t.en}</p>
                <p style={{ color: C.text, fontSize: 16, margin: "0 0 10px 0", lineHeight: 1.6, textAlign: "center" }}>{t.desc}</p>
                <div style={{
                  padding: "8px",
                  background: `${t.color}10`,
                  borderRadius: 8,
                  textAlign: "center",
                  border: `1.5px solid ${t.color}30`,
                }}>
                  <span style={{ color: t.color, fontSize: 17, fontWeight: "bold" }}>{t.raid}</span>
                </div>
              </WhiteCard>
            </div>
          );
        })}
      </div>

      {/* RAID 级别对比 */}
      <FadeIn delay={26}>
        <WhiteCard style={{ maxWidth: 840, marginTop: 14, padding: "14px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 28, textAlign: "center", flexWrap: "wrap" }}>
            <div>
              <span style={{ color: C.accent2, fontSize: 24, fontWeight: "bold" }}>RAID 0</span>
              <p style={{ color: C.textDim, fontSize: 15, margin: "2px 0 0" }}>条带化 · 高性能 · 无容错</p>
            </div>
            <div style={{ width: 1, background: C.border }} />
            <div>
              <span style={{ color: C.accent3, fontSize: 24, fontWeight: "bold" }}>RAID 1</span>
              <p style={{ color: C.textDim, fontSize: 15, margin: "2px 0 0" }}>镜像 · 100%冗余 · 高可靠</p>
            </div>
            <div style={{ width: 1, background: C.border }} />
            <div>
              <span style={{ color: C.accent5, fontSize: 24, fontWeight: "bold" }}>RAID 5</span>
              <p style={{ color: C.textDim, fontSize: 15, margin: "2px 0 0" }}>条带化+校验 · 兼顾性能与可靠</p>
            </div>
            <div style={{ width: 1, background: C.border }} />
            <div>
              <span style={{ color: C.accent4, fontSize: 24, fontWeight: "bold" }}>RAID 6</span>
              <p style={{ color: C.textDim, fontSize: 15, margin: "2px 0 0" }}>双校验 · 容忍双盘故障</p>
            </div>
          </div>
        </WhiteCard>
      </FadeIn>

      {/* 低优先级提示 */}
      <FadeIn delay={32}>
        <div style={{
          marginTop: 12,
          padding: "8px 20px",
          borderRadius: 20,
          background: `${C.accent4}08`,
          border: `1px solid ${C.accent4}20`,
        }}>
          <span style={{ color: C.accent4, fontSize: 15 }}>💡 考研低频考点 — 了解基本概念即可</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 场景6：SSD vs HDD ====================
const SSDScene: React.FC = () => {
  const frame = useCurrentFrame();

  const comparisons = [
    { label: "存储介质", ssd: "NAND 闪存", hdd: "旋转盘片 + 磁头", ssdColor: C.accent2, hddColor: C.textDim },
    { label: "机械部件", ssd: "无（全电子）", hdd: "有（盘片/磁头/手臂）", ssdColor: C.accent2, hddColor: C.textDim },
    { label: "读写速度", ssd: "500–7000 MB/s", hdd: "100–200 MB/s", ssdColor: C.accent2, hddColor: C.textDim },
    { label: "随机访问", ssd: "< 0.1 ms", hdd: "5–10 ms", ssdColor: C.accent2, hddColor: C.textDim },
    { label: "耐用性", ssd: "抗震抗摔", hdd: "怕震动怕摔", ssdColor: C.accent2, hddColor: C.textDim },
    { label: "噪音", ssd: "完全静音", hdd: "盘片旋转+磁头噪音", ssdColor: C.accent2, hddColor: C.textDim },
    { label: "碎片化", ssd: "无需整理", hdd: "需定期碎片整理", ssdColor: C.accent2, hddColor: C.textDim },
    { label: "适用场景", ssd: "系统盘/高性能/移动端", hdd: "大容量存储/备份/低成本", ssdColor: C.accent2, hddColor: C.textDim },
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 36px",
      }}
    >
      <Audio src={staticFile("external-storage/scene6_ssd.mp3")} />
      <SubtitleBar text={SUBTITLES.ssd} startFrame={0} endFrame={DURATIONS.ssd} />

      <SlideUp delay={0}>
        <h1 style={{ fontSize: 42, fontWeight: "bold", color: C.text, marginBottom: 4, letterSpacing: 3, textAlign: "center" }}>
          SSD vs HDD
        </h1>
      </SlideUp>
      <SlideUp delay={3}>
        <p style={{ color: C.textMid, fontSize: 20, marginBottom: 14, letterSpacing: 2, textAlign: "center" }}>
          Solid State Drive — NAND Flash · 无机械延迟
        </p>
      </SlideUp>

      {/* 表头 */}
      <FadeIn delay={6}>
        <div style={{
          display: "flex",
          width: "100%", maxWidth: 820,
          padding: "10px 20px",
          background: `linear-gradient(135deg, ${C.accent2}15, ${C.accent}10)`,
          borderRadius: "10px 10px 0 0",
          border: `1.5px solid ${C.border}`,
          borderBottom: "none",
          marginBottom: -1,
        }}>
          <div style={{ flex: 1, textAlign: "center", color: C.textDim, fontSize: 18, fontWeight: "bold" }}>对比维度</div>
          <div style={{ flex: 1.5, textAlign: "center", color: C.accent2, fontSize: 18, fontWeight: "bold" }}>✅ SSD</div>
          <div style={{ flex: 1.5, textAlign: "center", color: C.textDim, fontSize: 18, fontWeight: "bold" }}>HDD</div>
        </div>
      </FadeIn>

      {/* 对比行 */}
      <div style={{ width: "100%", maxWidth: 820 }}>
        {comparisons.map((row, i) => {
          const rowDelay = 8 + i * 3;
          const op = interpolate(frame, [rowDelay, rowDelay + 6], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const isLast = i === comparisons.length - 1;
          return (
            <div
              key={row.label}
              style={{
                opacity: op,
                display: "flex",
                padding: "8px 20px",
                border: `1.5px solid ${C.border}`,
                borderBottom: isLast ? `1.5px solid ${C.border}` : "none",
                borderRadius: isLast ? "0 0 10px 10px" : undefined,
                background: i % 2 === 0 ? C.bgCard : C.bgCard2,
              }}
            >
              <div style={{ flex: 1, textAlign: "center", color: C.text, fontSize: 16, fontWeight: 500 }}>
                {row.label}
              </div>
              <div style={{ flex: 1.5, textAlign: "center", color: row.ssdColor, fontSize: 16, fontWeight: 600 }}>
                {row.ssd}
              </div>
              <div style={{ flex: 1.5, textAlign: "center", color: row.hddColor, fontSize: 16 }}>
                {row.hdd}
              </div>
            </div>
          );
        })}
      </div>

      {/* 总结 */}
      <FadeIn delay={36}>
        <WhiteCard style={{ maxWidth: 820, marginTop: 12, padding: "12px 24px", textAlign: "center" }}>
          <span style={{ color: C.accent2, fontSize: 18, fontWeight: "bold" }}>
            SSD 在日常使用中体验远超 HDD，但大容量冷存储仍首选 HDD
          </span>
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

  const tags = ["机械硬盘", "CHS寻址", "寻道时间", "旋转延迟", "RAID", "镜像", "条带化", "奇偶校验", "SSD", "NAND闪存"];

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
      <Audio src={staticFile("external-storage/scene7_outro.mp3")} />
      <SubtitleBar text={SUBTITLES.outro} startFrame={0} endFrame={DURATIONS.outro} />

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
          外部存储原理 · 核心知识点梳理
        </div>
      </FadeIn>

      <FadeIn delay={35}>
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 600 }}>
          {tags.map((tag) => (
            <span key={tag} style={{ color: C.accent, fontSize: 17, padding: "7px 18px", borderRadius: 20, border: `1.5px solid ${C.accent}40`, backgroundColor: `${C.accent}08` }}>{tag}</span>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={50}>
        <div style={{ marginTop: 28, color: C.textMid, fontSize: 22, letterSpacing: 3, textAlign: "center" }}>
          点赞 · 收藏 · 关注
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// ==================== 主视频组件 ====================
export const ExternalStorage: React.FC = () => {
  return (
    <>
      {/* BGM */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.08} loop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.hdd_structure}>
          <HDDStructureScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.chs}>
          <CHSScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.hdd_perf}>
          <HDDPerfScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 8 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.raid}>
          <RAIDScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.ssd}>
          <SSDScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 6 })} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
