import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TOTAL_FRAMES, DURATION } from "./timeline";
import Scene3D from "./Scene3D";

// ==================== 文字数据 ====================
const CAPTIONS: [number, number, string][] = [
  [0.03, 0.09, "掩体计划 · 在巨行星阴影中苟活的人类,以为能躲过黑暗森林的打击"],
  [0.28, 0.36, "二向箔投入太阳系"],
  [0.40, 0.47, "二维化从冥王星轨道附近开始,如瘟疫般蔓延"],
  [0.74, 0.80, "太空城市与人类,被展开成二维的图案"],
];

const QUOTES: [number, number, string][] = [
  [
    0.535,
    0.645,
    "太阳在二维平面上展开了,像一幅在上帝的画板上绘成的画。核心、辐射层、对流层……这是一幅最壮丽也最恐怖的画。",
  ],
  [
    0.66,
    0.78,
    "地球在二维空间中展开,像一只巨眼的虹膜——蓝色的大洋,褐色的大陆,白色的云层,都精致地画在那个圆盘上。",
  ],
];

// ==================== 文字叠加组件 ====================
const OverlayText: React.FC<{ p: number }> = ({ p }) => {
  const titleOpacity = p >= 0.1 && p <= 0.26 ? 1 : 0;

  let caption = "";
  for (const [a, b, t] of CAPTIONS) {
    if (p >= a && p <= b) caption = t;
  }
  const captionOpacity = caption ? 1 : 0;

  let quote = "";
  for (const [a, b, t] of QUOTES) {
    if (p >= a && p <= b) quote = t;
  }
  const quoteOpacity = quote ? 1 : 0;

  const finalOpacity = p >= 0.92 ? 1 : 0;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          right: 22,
          bottom: 78,
          textAlign: "right",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
          maxWidth: "46vw",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 200,
            letterSpacing: "0.4em",
            color: "#eaf3ff",
            opacity: titleOpacity,
            textShadow: "0 0 30px rgba(150,210,255,0.55), 0 0 90px rgba(90,170,255,0.35)",
          }}
        >
          二向箔
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 300,
            letterSpacing: "0.25em",
            color: "#cfe0f5",
            opacity: captionOpacity,
            textShadow: "0 0 20px rgba(120,180,255,0.5)",
            minHeight: 28,
          }}
        >
          {caption || " "}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 300,
            letterSpacing: "0.15em",
            lineHeight: 1.8,
            color: "#eef4ff",
            opacity: quoteOpacity,
            maxWidth: "38vw",
            textAlign: "right",
            textShadow: "0 0 24px rgba(150,200,255,0.5), 0 2px 24px rgba(0,0,0,0.85)",
            minHeight: 36,
          }}
        >
          {quote || " "}
        </div>
        <div style={{ opacity: finalOpacity }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 300,
              letterSpacing: "0.2em",
              lineHeight: 1.8,
              color: "#eaf3ff",
              textShadow: "0 0 24px rgba(150,210,255,0.5)",
            }}
          >
            那是坟墓,也是纪念碑,是人类文明最宏伟的墓志铭。
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              fontWeight: 300,
              letterSpacing: "0.4em",
              color: "#8aa3c4",
            }}
          >
            ——《三体III · 死神永生》
          </div>
        </div>
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
    <AbsoluteFill style={{ background: "#02030a" }}>
      <Scene3D p={Math.min(p, 1)} />
      <OverlayText p={p} />
    </AbsoluteFill>
  );
};

export default DualVectorFoil;
export { TOTAL_FRAMES, DURATION };
