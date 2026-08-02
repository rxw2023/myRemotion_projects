import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { TOTAL_FRAMES, DURATION } from "./timeline";
import Scene3D from "./Scene3D";

// ==================== 颜色 ====================
const C = {
  accent: "#7eb8ff",
  text: "#eaf3ff",
};

// ==================== 字幕文本（与 TTS 一致） ====================
const SUBTITLE_TEXTS: Record<string, string> = {
  s1: "在黑暗森林威慑建立之后，人类启动了掩体计划。他们在木星、土星等巨行星的阴影中建造太空城市，以为这样就能躲避来自高等文明的打击。然而他们不知道，真正的末日远比想象中更加彻底。",
  s2: "那一天，歌者向太阳系投下了一枚二向箔。它看起来只是一张薄如蝉翼的半透明纸片，却能将三维空间不可逆转地坍缩为二维。",
  s3: "二维化从太阳系边缘开始，如瘟疫般蔓延。行星一个一个被吸入那无底的平面，在无限的光滑表面上留下它们生前的轮廓。",
  s4: "太阳是最后一个被二维化的，它在平面上展开了——核心、辐射层、对流层、光球层，像一幅在上帝画板上绘成的画。最壮丽，也最恐怖。",
  s5: "地球也在二维空间中展开，像一只巨眼的虹膜。蓝色的大洋、褐色的大陆、白色的云层，都精致地画在那个圆盘上。",
  s6: "太空城市里的人类也被展开成二维的图案，生命的最后印记凝固在无限延伸的平面上。",
  s7: "那是坟墓，也是纪念碑，是人类文明最宏伟的墓志铭。",
};

// ==================== 字幕分段时长 ====================
const SEGMENTS: { key: string; start: number; end: number }[] = [
  { key: "s1", start: 0, end: 440 },
  { key: "s2", start: 445, end: 750 },
  { key: "s3", start: 755, end: 1040 },
  { key: "s4", start: 1045, end: 1350 },
  { key: "s5", start: 1355, end: 1640 },
  { key: "s6", start: 1645, end: 1840 },
  { key: "s7", start: 1845, end: 2138 },
];

const EPILOGUE_START = 2150;
const EPILOGUE_END = TOTAL_FRAMES;

// ==================== 字幕条（对标 ClaudeModels） ====================
const SubtitleBar: React.FC = () => {
  const frame = useCurrentFrame();

  // 查找当前字幕段
  let active: (typeof SEGMENTS)[number] | null = null;
  for (const seg of SEGMENTS) {
    if (frame >= seg.start && frame <= seg.end) {
      active = seg;
      break;
    }
  }

  if (!active && frame < EPILOGUE_START) return null;

  if (active) {
    const { start, end } = active;
    const opacity = interpolate(
      frame,
      [start, start + 3, end - 3, end],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

    return (
      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 100,
          opacity,
          padding: "0 140px",
        }}
      >
        <div
          style={{
            background: "rgba(6,6,14,0.88)",
            backdropFilter: "blur(10px)",
            borderRadius: 10,
            padding: "14px 36px",
            maxWidth: "72%",
            textAlign: "center",
            border: `1px solid ${C.accent}20`,
          }}
        >
          <span
            style={{
              color: C.text,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: 1.5,
              lineHeight: 1.7,
            }}
          >
            {SUBTITLE_TEXTS[active.key]}
          </span>
        </div>
      </div>
    );
  }

  // 尾声署名
  const epilogueOpacity = interpolate(
    frame,
    [EPILOGUE_START, EPILOGUE_START + 30, EPILOGUE_END - 30, EPILOGUE_END],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 90,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 100,
        opacity: epilogueOpacity,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 300,
          letterSpacing: "0.3em",
          color: "#8aa3c4",
          textShadow: "0 0 12px rgba(120,160,220,0.3)",
        }}
      >
        ——《三体III · 死神永生》
      </div>
    </div>
  );
};

// ==================== 主组件 ====================
const DualVectorFoil: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = frame / (fps * DURATION);

  return (
    <AbsoluteFill style={{ background: "#02030a", filter: "brightness(1.2) contrast(1.12)" }}>
      <Audio src={staticFile("dual-vector-foil/bgm-dark-forest.mp3")} volume={0.25} />
      <Scene3D p={Math.min(p, 1)} />
      <SubtitleBar />
    </AbsoluteFill>
  );
};

export default DualVectorFoil;
export { TOTAL_FRAMES, DURATION };
