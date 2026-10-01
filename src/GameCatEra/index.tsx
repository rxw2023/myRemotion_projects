import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import {
  linearTiming,
  TransitionSeries,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import {
  F_DISPLAY,
  F_MONO,
  F_TEXT,
  Grain,
  LAYOUT,
  NarrationBar,
  ScanBeam,
  Scanlines,
  TechScale,
  ThumbFrame,
  TimelineRuler,
  TopHud,
  Vignette,
} from "./components";
import {
  clamp01,
  COVER_FRAMES,
  COVER_VO_SRC,
  ERAS,
  ERA_FRAMES,
  noiseAt,
  NOISE_AIR_SRC,
  NOISE_CRT_SRC,
  OUTRO_FRAMES,
  OUTRO_VO_SRC,
  pad2,
  pad3,
  PLAY_END,
  PLAY_START,
  REVERSE,
  rgba,
  SCENE_START,
  sceneAt,
  TIMELINE,
  TOTAL_FRAMES,
  TRANSITION_FRAMES,
  type Era,
  voSrc,
} from "./data";

/**
 * BGM 接入位 —— 你自己找的那首 BGM 放这里：
 *   1. 把音频文件放到  public/gameCatEra/bgm.mp3
 *   2. 把下面 BGM_ENABLED 改成 true
 *   3. 重新渲染即可（本片已自带配音＋底噪，BGM 只是叠在下面）
 */
export const BGM_ENABLED: boolean = true;
const BGM_SRC = "gameCatEra/bgm.mp3";
/** 素材实测 RMS −13.3 dBFS，这里压到约 −27 dBFS，垫在配音下面 */
const BGM_VOLUME = 0.2;

/** 配音音量（edge-tts 输出已做过响度归一，直接给满） */
const VO_VOLUME = 1.0;

/**
 * 底噪音量：越老的 CRT 年代电子沙沙声越明显，现代场景只留一丝房间底噪。
 * amt = data.ts 里 noiseAt(frame)，取值 0–1。
 */
const noiseVolumes = (amt: number): { crt: number; air: number } => ({
  crt: 0.19 * amt * amt, // 最早的年代约 −40 dBFS 的电子沙沙声，比配音低约 20 dB
  air: 0.012 + 0.024 * (1 - amt), // 现代场景约 −52 dBFS 的房间底噪
});

// ==================== 自定义转场：CRT 关/开机 + 换台亮线 ====================

type CrtProps = { color: string };

const CrtSwitch: React.FC<TransitionPresentationComponentProps<CrtProps>> = ({
  presentationProgress,
  presentationDirection,
  passedProps,
  children,
}) => {
  const p = presentationProgress;
  const exiting = presentationDirection === "exiting";

  // 前半段：旧画面被压成一条亮线；后半段：新画面从亮线展开。
  const scaleY = exiting
    ? interpolate(p, [0, 0.5, 1], [1, 0.004, 0.004])
    : interpolate(p, [0, 0.5, 1], [0.004, 0.004, 1]);

  const brightness = exiting
    ? interpolate(p, [0, 0.5, 1], [1, 3.8, 3.8])
    : interpolate(p, [0, 0.5, 1], [3.8, 3.8, 1]);

  const beam = exiting
    ? interpolate(p, [0, 0.5, 1], [0.08, 1, 1])
    : interpolate(p, [0, 0.5, 1], [1, 1, 0.08]);

  const fadeOut = exiting ? interpolate(p, [0.38, 0.52], [1, 0], { extrapolateRight: "clamp" }) : 1;

  return (
    <>
      <AbsoluteFill
        style={{
          transform: `scaleY(${scaleY})`,
          filter: `brightness(${brightness})`,
          opacity: fadeOut,
        }}
      >
        {children}
      </AbsoluteFill>
      <ScanBeam opacity={beam} color={passedProps.color} y="49.8%" />
    </>
  );
};

const crtSwitch = (color: string): TransitionPresentation<CrtProps> => ({
  component: CrtSwitch,
  props: { color },
});

// ==================== 通用：舞台背光 ====================

const StageGlow: React.FC<{ accent: string; accent2: string; bloom: number; offset: number }> = ({
  accent,
  accent2,
  bloom,
  offset,
}) => (
  <AbsoluteFill
    style={{
      background: [
        `radial-gradient(60% 70% at ${22 + offset}% 30%, ${rgba(accent, 0.22 * bloom + 0.06)} 0%, rgba(0,0,0,0) 62%)`,
        `radial-gradient(55% 65% at ${84 - offset}% 76%, ${rgba(accent2, 0.2 * bloom + 0.05)} 0%, rgba(0,0,0,0) 60%)`,
      ].join(", "),
      pointerEvents: "none",
    }}
  />
);

// ==================== 封面 ====================

const CoverScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = (delay: number, duration = 30) =>
    spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: duration });

  const title = rise(0, 36);
  const sub = rise(12, 32);
  const meta = rise(22, 30);
  const strip = rise(30, 40);
  const hint = clamp01((frame - 78) / 20);
  const hintBlink = Math.floor(frame / 16) % 2 === 0 ? 1 : 0.35;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(150deg, #04040A 0%, #0B0716 48%, #050510 100%)" }}>
      <StageGlow accent="#FF3DF2" accent2="#22D3EE" bloom={0.9} offset={6} />
      <div
        style={{
          position: "absolute",
          left: LAYOUT.left,
          right: 1920 - LAYOUT.right,
          top: 128,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: F_MONO,
            fontSize: 17,
            letterSpacing: 12,
            color: "rgba(34,211,238,0.85)",
            opacity: meta,
          }}
        >
          FIFTY YEARS OF GAME ART
        </div>

        <div
          style={{
            fontFamily: F_DISPLAY,
            fontSize: 172,
            fontWeight: 700,
            letterSpacing: 16,
            lineHeight: 1.04,
            marginTop: 18,
            color: "#FFFFFF",
            textShadow: "0 0 60px rgba(255,61,242,0.45), 0 0 140px rgba(34,211,238,0.28)",
            opacity: title,
            transform: `translateY(${(1 - title) * 26}px) scale(${0.96 + title * 0.04})`,
          }}
        >
          像素到光子
        </div>

        <div
          style={{
            width: 620 * title,
            height: 2,
            marginTop: 26,
            background: "linear-gradient(90deg, rgba(255,61,242,0), #FF3DF2, #22D3EE, rgba(34,211,238,0))",
          }}
        />

        <div
          style={{
            fontFamily: F_TEXT,
            fontSize: 40,
            fontWeight: 500,
            letterSpacing: 6,
            marginTop: 24,
            color: "rgba(255,255,255,0.9)",
            opacity: sub,
            transform: `translateY(${(1 - sub) * 18}px)`,
          }}
        >
          一只橘猫的五十年游戏图像史
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: 26,
            opacity: meta,
            fontFamily: F_MONO,
            fontSize: 16,
            letterSpacing: 3,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <span style={{ color: "#FFD400" }}>1970 —— 2026</span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span>
          <span>12 个年代 · 12 张形象</span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span>
          <span style={{ color: "#22D3EE" }}>{REVERSE ? "倒叙 REVERSE" : "正序 CHRONOLOGICAL"}</span>
        </div>
      </div>

      {/* 12 张缩略图胶片条 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 720,
          display: "flex",
          justifyContent: "center",
          gap: 10,
          opacity: strip,
          transform: `translateY(${(1 - strip) * 40}px)`,
        }}
      >
        {ERAS.map((era, i) => (
          <div key={era.years} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 138, height: 92 }}>
              <ThumbFrame src={staticFile(era.image)} accent={era.accent} radius={era.radius} />
            </div>
            <div style={{ fontFamily: F_MONO, fontSize: 12, letterSpacing: 1, color: rgba(era.accent, 0.8) }}>
              {era.yearStart}
            </div>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: era.accent,
                opacity: 0.35 + 0.65 * clamp01((frame - 40 - i * 4) / 12),
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 566,
          textAlign: "center",
          fontFamily: F_MONO,
          fontSize: 19,
          letterSpacing: 8,
          color: "rgba(255,255,255,0.8)",
          opacity: hint * hintBlink,
        }}
      >
        ▶ 开始播放
      </div>
    </AbsoluteFill>
  );
};

// ==================== 年代场景 ====================

const InfoPanel: React.FC<{ era: Era; chapter: number }> = ({ era, chapter }) => {
  const frame = useCurrentFrame();
  const rev = (delay: number) => clamp01((frame - delay) / 14);

  const Section: React.FC<{ label: string; children: React.ReactNode; delay: number }> = ({
    label,
    children,
    delay,
  }) => {
    const o = rev(delay);
    return (
      <div style={{ opacity: o, transform: `translateX(${(1 - o) * 18}px)` }}>
        <div
          style={{
            fontFamily: F_MONO,
            fontSize: 13,
            letterSpacing: 5,
            color: rgba(era.accent, 0.92),
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: era.mono ? F_MONO : F_TEXT,
            fontSize: era.mono ? 22 : 24,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: 1,
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  const header = rev(4);

  return (
    <div
      style={{
        position: "absolute",
        left: LAYOUT.panelLeft,
        top: LAYOUT.stageTop,
        width: LAYOUT.panelWidth,
        height: LAYOUT.stageHeight,
        boxSizing: "border-box",
        padding: "30px 34px",
        borderRadius: era.radius,
        border: `1px solid ${rgba(era.accent, 0.28)}`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012))",
        boxShadow: `0 0 70px -20px ${rgba(era.accent, 0.65)}`,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: 3,
          background: `linear-gradient(90deg, ${era.accent}, ${era.accent2}, rgba(0,0,0,0))`,
        }}
      />
      <div
        style={{
          opacity: header,
          transform: `translateY(${(1 - header) * 14}px)`,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: F_DISPLAY,
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: 2,
            lineHeight: 1,
            color: era.accent,
            textShadow: `0 0 40px ${rgba(era.accent, 0.55)}`,
          }}
        >
          {era.years}
        </div>
      </div>
      <div
        style={{
          opacity: header,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: F_MONO,
          fontSize: 14,
          letterSpacing: 3,
          color: "rgba(255,255,255,0.42)",
        }}
      >
        <span style={{ color: rgba(era.accent, 0.95) }}>
          第 {pad2(chapter)} 章 / {pad2(TIMELINE.length)}
        </span>
        <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.14)" }} />
        <span>{era.label}</span>
      </div>

      <Section label="游戏技术 / 平台" delay={20}>
        {era.tech}
      </Section>

      <Section label="视觉关键词" delay={30}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {era.visual.map((v) => (
            <span
              key={v}
              style={{
                fontFamily: era.mono ? F_MONO : F_TEXT,
                fontSize: 17,
                letterSpacing: 1,
                padding: "6px 14px",
                borderRadius: era.radius,
                border: `1px solid ${rgba(era.accent, 0.5)}`,
                background: rgba(era.accent, 0.1),
                color: rgba(era.accent, 0.98),
              }}
            >
              {v}
            </span>
          ))}
        </div>
      </Section>

      <Section label="猫的呈现" delay={40}>
        {era.cat}
      </Section>

      <div style={{ marginTop: "auto", opacity: rev(50) }}>
        <TechScale era={era} frame={frame} />
      </div>
    </div>
  );
};

const EraScene: React.FC<{ era: Era; chapter: number }> = ({ era, chapter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 低帧率动画：年代越早，运动越"卡"
  const step = Math.max(1, Math.round(fps / era.motionFps));
  const qFrame = Math.floor(frame / step) * step;
  const p = clamp01(qFrame / ERA_FRAMES);

  const dir = chapter % 2 === 0 ? 1 : -1;
  const zoom = 1.025 + 0.075 * p;
  const panX = dir * (0.8 + 2.4 * p);
  const panY = -0.6 - 1.6 * p;

  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 26 });
  const clipInset = (1 - enter) * 50;
  const flash = interpolate(frame, [0, 5, 8, 22], [0.9, 1, 0.45, 0], { extrapolateRight: "clamp" });
  const beamY = `${interpolate(frame, [0, 20], [6, 92], { extrapolateRight: "clamp" })}%`;
  const beamOpacity = interpolate(frame, [0, 4, 20], [0, 0.9, 0], { extrapolateRight: "clamp" });

  const onScreen = Math.floor(p * 100);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${era.bgA} 0%, ${era.bgB} 100%)` }}>
      <StageGlow accent={era.accent} accent2={era.accent2} bloom={era.bloom} offset={chapter * 5} />

      {/* 屏幕框 */}
      <div
        style={{
          position: "absolute",
          left: LAYOUT.left,
          top: LAYOUT.stageTop,
          width: LAYOUT.imageWidth,
          height: LAYOUT.stageHeight,
          clipPath: `inset(${clipInset}% 0% ${clipInset}% 0%)`,
          borderRadius: era.radius,
          padding: 10,
          boxSizing: "border-box",
          background: `linear-gradient(180deg, ${rgba(era.accent, 0.14)}, rgba(0,0,0,0.55))`,
          border: `1px solid ${rgba(era.accent, 0.4)}`,
          boxShadow: `0 0 90px -14px ${rgba(era.accent, 0.6)}, inset 0 0 70px rgba(0,0,0,0.65)`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: Math.max(0, era.radius - 2),
            background: "#04040A",
          }}
        >
          <Img
            src={staticFile(era.image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              transform: `scale(${zoom}) translate(${panX}%, ${panY}%)`,
              filter: `blur(${era.blur}px) saturate(${1 + era.bloom * 0.28}) contrast(${1 + era.bloom * 0.1})`,
            }}
          />
          <Scanlines intensity={era.scanline * 0.5} gap={3} />
          <Vignette strength={0.35 + era.scanline * 0.4} />

          {/* 顶部压暗，保证角标可读 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 62,
              background: "linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0))",
            }}
          />

          {/* 屏幕角标 */}
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 12,
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontFamily: F_MONO,
              fontSize: 13,
              letterSpacing: 2,
              color: rgba(era.accent, 0.9),
              opacity: clamp01((frame - 16) / 14),
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                background: era.accent,
                boxShadow: `0 0 12px 2px ${rgba(era.accent, 0.9)}`,
                opacity: Math.floor(qFrame / (step * 2)) % 2 === 0 ? 1 : 0.2,
              }}
            />
            {era.yearStart} · {era.label}
          </div>
          <div
            style={{
              position: "absolute",
              right: 14,
              top: 12,
              fontFamily: F_MONO,
              fontSize: 13,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.4)",
              opacity: clamp01((frame - 16) / 14),
            }}
          >
            {pad3(onScreen)}%
          </div>

          <ScanBeam opacity={beamOpacity} color="#FFFFFF" y={beamY} />
        </div>
      </div>

      {/* 巨型水印字 */}
      <div
        style={{
          position: "absolute",
          right: 1920 - LAYOUT.right,
          top: LAYOUT.stageTop + LAYOUT.stageHeight - 236,
          fontFamily: F_DISPLAY,
          fontSize: 250,
          fontWeight: 700,
          letterSpacing: 6,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: `2px ${rgba(era.accent, 0.12)}`,
          textAlign: "right",
          pointerEvents: "none",
          opacity: clamp01((frame - 10) / 26),
        }}
      >
        {era.label}
      </div>

      <InfoPanel era={era} chapter={chapter} />

      {/* 开场白闪 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 60% at 34% 48%, ${rgba("#FFFFFF", 1)}, rgba(255,255,255,0) 70%)`,
          opacity: flash * 0.5,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ==================== 片尾 ====================

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 32 });
  const note = spring({ frame: frame - 22, fps, config: { damping: 200 }, durationInFrames: 30 });
  const end = clamp01((frame - OUTRO_FRAMES + 70) / 30);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #04040A 0%, #0A0714 55%, #04040A 100%)" }}>
      <StageGlow accent="#FFD400" accent2="#FF3DF2" bloom={0.8} offset={4} />

      <div
        style={{
          position: "absolute",
          left: LAYOUT.left,
          right: 1920 - LAYOUT.right,
          top: 108,
          textAlign: "center",
          opacity: title,
          transform: `translateY(${(1 - title) * 20}px)`,
        }}
      >
        <div
          style={{
            fontFamily: F_DISPLAY,
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: 12,
            color: "#FFFFFF",
            textShadow: "0 0 50px rgba(255,61,242,0.4)",
          }}
        >
          同一个红围巾，五十年
        </div>
        <div
          style={{
            fontFamily: F_MONO,
            fontSize: 16,
            letterSpacing: 7,
            marginTop: 12,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          FROM BLOCKS TO PHOTONS · 1970 — 2026
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: LAYOUT.left,
          right: 1920 - LAYOUT.right,
          top: 284,
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 14,
        }}
      >
        {ERAS.map((era, i) => {
          const o = clamp01((frame - 30 - i * 6) / 18);
          return (
            <div
              key={era.years}
              style={{ opacity: o, transform: `translateY(${(1 - o) * 22}px)` }}
            >
              <div style={{ height: 200 }}>
                <ThumbFrame src={staticFile(era.image)} accent={era.accent} radius={era.radius} />
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  fontFamily: F_MONO,
                  fontSize: 14,
                  letterSpacing: 1,
                }}
              >
                <span style={{ color: rgba(era.accent, 0.95) }}>{era.years}</span>
                <span style={{ color: "rgba(255,255,255,0.42)", fontSize: 12 }}>{era.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: LAYOUT.left,
          right: 1920 - LAYOUT.right,
          top: 772,
          textAlign: "center",
          opacity: note,
          fontFamily: F_TEXT,
          fontSize: 30,
          letterSpacing: 3,
          color: "rgba(255,255,255,0.88)",
        }}
      >
        分辨率涨了几千倍，多边形涨了几万倍。
        <span style={{ color: "#FFD400" }}> 唯一没变的，是那只猫。</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 828,
          textAlign: "center",
          fontFamily: F_MONO,
          fontSize: 15,
          letterSpacing: 6,
          color: rgba("#22D3EE", 0.75),
          opacity: end,
        }}
      >
        ▶ END · 2026 · 未完待续
      </div>
    </AbsoluteFill>
  );
};

// ==================== 音频层：BGM（用户自备）+ 配音 + 常驻底噪 ====================

const Bgm: React.FC = () => {
  if (!BGM_ENABLED) {
    return null;
  }
  // 淡入 1.5s、最后 4s 淡出：素材 144s 比片子 155s 短，循环接缝和结尾都不会硬切
  const volume = (f: number) =>
    BGM_VOLUME * Math.max(0, Math.min(1, f / 45, (TOTAL_FRAMES - f) / 120));
  return <Audio src={staticFile(BGM_SRC)} volume={volume} loop />;
};

/** 常驻底噪：两条无缝循环素材，音量随当前年代平滑过渡 */
const NoiseBed: React.FC<{ amt: number }> = ({ amt }) => {
  const { crt, air } = noiseVolumes(amt);
  return (
    <>
      <Audio src={staticFile(NOISE_CRT_SRC)} volume={crt} loop />
      <Audio src={staticFile(NOISE_AIR_SRC)} volume={air} loop />
    </>
  );
};

// ==================== 主合成 ====================

export const GameCatEra: React.FC = () => {
  const frame = useCurrentFrame();

  const hudOpacity = clamp01(frame / 26);
  const progress = clamp01((frame - PLAY_START) / (PLAY_END - PLAY_START));
  const noiseAmt = noiseAt(frame);

  const info = sceneAt(frame);
  const activeIndex =
    info.kind === "era"
      ? info.era.index
      : info.kind === "cover"
        ? TIMELINE[0].index
        : TIMELINE[TIMELINE.length - 1].index;

  const narrationAppear =
    info.kind === "era"
      ? clamp01((frame - SCENE_START[info.chapter] - TRANSITION_FRAMES * 0.5) / 14)
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#04040A", fontFamily: F_TEXT }}>
      <Bgm />
      <NoiseBed amt={noiseAmt} />

      {/* 配音：按绝对帧摆在 TransitionSeries 之外，每段只在自己的场景里响 */}
      <Sequence from={18}>
        <Audio src={staticFile(COVER_VO_SRC)} volume={VO_VOLUME} />
      </Sequence>
      {TIMELINE.map((era, i) => (
        <Sequence key={era.years} from={SCENE_START[i + 1] + 10}>
          <Audio src={staticFile(voSrc(era))} volume={VO_VOLUME} />
        </Sequence>
      ))}
      <Sequence from={SCENE_START[TIMELINE.length + 1] + 26}>
        <Audio src={staticFile(OUTRO_VO_SRC)} volume={VO_VOLUME} />
      </Sequence>

      {/* 场景层：封面 → 12 个年代（按 TIMELINE 顺序，当前为正序）→ 片尾 */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={COVER_FRAMES}>
          <CoverScene />
        </TransitionSeries.Sequence>

        {TIMELINE.map((era, i) => (
          <React.Fragment key={era.years}>
            <TransitionSeries.Transition
              timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              presentation={crtSwitch(era.accent)}
            />
            <TransitionSeries.Sequence durationInFrames={ERA_FRAMES}>
              <EraScene era={era} chapter={i + 1} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* 常驻层：HUD / 字幕 / 时间轴 / 颗粒 */}
      <TopHud frame={frame} opacity={hudOpacity} />
      <NarrationBar
        text={info.kind === "era" ? info.era.narration : null}
        years={info.kind === "era" ? info.era.years : null}
        accent={info.kind === "era" ? info.era.accent : "#FFFFFF"}
        appear={narrationAppear}
      />
      <TimelineRuler progress={progress} activeIndex={activeIndex} />

      <Grain opacity={0.05} />
      <Vignette strength={0.9} />

      {/* 上下遮幅 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 34, background: "#000000" }} />
      <div style={{ position: "absolute", left: 0, top: 1046, width: 1920, height: 34, background: "#000000" }} />
    </AbsoluteFill>
  );
};

/** TransitionSeries 的实际总时长 = Σ场景 − Σ转场（Root.tsx 注册时使用） */
export const GameCatEraFrames: number = TOTAL_FRAMES;
