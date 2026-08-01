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

// ==================== 字幕数据 ====================
// 按 TTS 朗读节奏分段，帧范围基于字数和语速估算（+5% rate ≈ 5.2 字/秒）
const SUBTITLES: [number, number, string][] = [
  [
    0,
    440,
    "在黑暗森林威慑建立之后，人类启动了掩体计划。他们在木星、土星等巨行星的阴影中建造太空城市，以为这样就能躲避来自高等文明的打击。然而他们不知道，真正的末日远比想象中更加彻底。",
  ],
  [
    445,
    750,
    "那一天，歌者向太阳系投下了一枚二向箔。它看起来只是一张薄如蝉翼的半透明纸片，却能将三维空间不可逆转地坍缩为二维。",
  ],
  [
    755,
    1040,
    "二维化从太阳系边缘开始，如瘟疫般蔓延。行星一个一个被吸入那无底的平面，在无限的光滑表面上留下它们生前的轮廓。",
  ],
  [
    1045,
    1350,
    "太阳是最后一个被二维化的，它在平面上展开了——核心、辐射层、对流层、光球层，像一幅在上帝画板上绘成的画。最壮丽，也最恐怖。",
  ],
  [
    1355,
    1640,
    "地球也在二维空间中展开，像一只巨眼的虹膜。蓝色的大洋、褐色的大陆、白色的云层，都精致地画在那个圆盘上。",
  ],
  [
    1645,
    1840,
    "太空城市里的人类也被展开成二维的图案，生命的最后印记凝固在无限延伸的平面上。",
  ],
  [
    1845,
    2138,
    "那是坟墓，也是纪念碑，是人类文明最宏伟的墓志铭。",
  ],
];

// 最后一条字幕结束后的静默期，显示三体署名
const EPILOGUE_START = 2150;
const EPILOGUE_END = 2800;

// ==================== 字幕组件 ====================
const SubtitleBar: React.FC = () => {
  const frame = useCurrentFrame();

  let text = "";
  let visible = false;
  for (const [start, end, t] of SUBTITLES) {
    if (frame >= start && frame <= end) {
      text = t;
      visible = true;
      break;
    }
  }

  // 淡入淡出：首尾各 8 帧
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lastSubtitleEnd = SUBTITLES[SUBTITLES.length - 1][1];
  const fadeOut = interpolate(frame, [lastSubtitleEnd - 8, lastSubtitleEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const epilogueOpacity = interpolate(
    frame,
    [EPILOGUE_START, EPILOGUE_START + 30, EPILOGUE_END - 30, EPILOGUE_END],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  if (!visible && frame < EPILOGUE_START) return null;

  return (
    <>
      {visible && (
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: fadeIn * fadeOut * 0.95,
          }}
        >
          <div
            style={{
              maxWidth: "76vw",
              padding: "18px 36px",
              background: "rgba(0,0,0,0.6)",
              borderRadius: 10,
              textAlign: "center",
              fontSize: 26,
              fontWeight: 300,
              letterSpacing: "0.06em",
              lineHeight: 1.7,
              color: "#eaf3ff",
              textShadow: "0 0 16px rgba(150,200,255,0.4)",
            }}
          >
            {text}
          </div>
        </div>
      )}

      {/* 尾声 */}
      {frame >= EPILOGUE_START && (
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
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
      )}
    </>
  );
};

// ==================== 主组件 ====================
const DualVectorFoil: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = frame / (fps * DURATION);

  return (
    <AbsoluteFill style={{ background: "#02030a" }}>
      <Audio src={staticFile("dual-vector-foil/narration.mp3")} />
      <Scene3D p={Math.min(p, 1)} />
      <SubtitleBar />
    </AbsoluteFill>
  );
};

export default DualVectorFoil;
export { TOTAL_FRAMES, DURATION };
