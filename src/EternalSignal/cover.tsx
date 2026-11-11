import React from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { INK, PAPER } from "./manga/ink";

/**
 * 《永不消逝的电波》封面 —— 静态帧，供 `npx remotion still` 出图。
 *
 *   npx remotion still EternalSignalCover       out/cover-wide.png      # 横版 1920×1080
 *   npx remotion still EternalSignalCoverTall   out/cover-tall.png      # 竖版 1080×1920
 *
 * 设计只讲一件事：**一个人背对着我们，在暗处听**。
 *
 *   1. 直接用正片里的 a-01（暗室里对着短波接收机的背影），已经做过墨/纸双色调，
 *      所以封面的白就是正片的纸、封面的黑就是正片的墨，不是另做一套。
 *   2. 标题竖排。中文竖排是"书"的语言，横排会变成"视频封面"。
 *   3. 只用墨和纸两色，唯一的花样是右下那条极细的载波线——它是全片的声音。
 *   4. 缩略图要能认：标题占满右侧一列，字距拉开，缩到 320×180 仍是四个黑块。
 *
 * 本组件不读 useCurrentFrame，任何一帧渲染结果都一样。
 */

const TITLE = "永不消逝的电波";

const MODE = {
  wide: {
    w: 1920,
    h: 1080,
    title: 104,
    titleRight: 92,
    titleTop: 74,
    frame: 34,
    small: 22,
    lineGap: 1.34,
  },
  tall: {
    w: 1080,
    h: 1920,
    title: 128,
    titleRight: 86,
    titleTop: 120,
    frame: 32,
    small: 26,
    lineGap: 1.36,
  },
} as const;

export const EternalSignalCover: React.FC = () => {
  const { width, height } = useVideoConfig();
  const m = width > height ? MODE.wide : MODE.tall;

  return (
    <AbsoluteFill style={{ background: INK }}>
      {/* 画面：整幅铺满。暗室的背影，右侧是接收机 */}
      <Img
        src={staticFile("eternal-signal/panels/A-01.jpg")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: width > height ? "38% 50%" : "46% 42%",
        }}
      />

      {/* 右侧压暗：竖排标题要压在干净的暗部上 */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(18,16,14,0) 42%, rgba(18,16,14,0.55) 62%, rgba(18,16,14,0.9) 82%, rgba(18,16,14,0.97) 100%)",
        }}
      />
      {/* 上下压边：让画面像印在纸上的一块，而不是贴上去的照片 */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(18,16,14,0.75) 0%, rgba(18,16,14,0) 16%, rgba(18,16,14,0) 78%, rgba(18,16,14,0.82) 100%)",
        }}
      />

      {/* 竖排标题 */}
      <div
        style={{
          position: "absolute",
          top: m.titleTop,
          right: m.titleRight,
          writingMode: "vertical-rl",
          fontFamily: "'SimSun', 'Songti SC', 'Noto Serif SC', serif",
          fontSize: m.title,
          fontWeight: 700,
          letterSpacing: "0.06em",
          lineHeight: m.lineGap,
          color: PAPER,
          textShadow: "0 2px 18px rgba(18,16,14,0.85), 0 0 2px rgba(18,16,14,0.9)",
        }}
      >
        {TITLE}
      </div>

      {/* 左下：出处与规格 */}
      <div
        style={{
          position: "absolute",
          left: m.frame + 34,
          bottom: m.frame + 30,
          fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
          color: "rgba(242,238,226,0.86)",
          fontSize: m.small,
          letterSpacing: "0.14em",
          lineHeight: 1.9,
        }}
      >
        <div>拉拉 · 2007 银河奖中篇</div>
        <div style={{ opacity: 0.62 }}>漫画广播剧 · 10 幕 · 7 分 54 秒</div>
      </div>

      {/* 右下：载波。一条极细的线，中间被信号顶起一次 */}
      <svg
        width={width > height ? 460 : 360}
        height={90}
        viewBox="0 0 460 90"
        style={{
          position: "absolute",
          right: m.frame + 40,
          bottom: m.frame + 46,
          opacity: 0.7,
        }}
      >
        <path
          d="M0 60 H150 C162 60 166 22 176 22 C186 22 190 60 202 60 H268 C276 60 279 44 286 44 C293 44 296 60 304 60 H460"
          fill="none"
          stroke={PAPER}
          strokeWidth={2}
        />
        <circle cx={176} cy={22} r={3.4} fill={PAPER} />
      </svg>

      {/* 左上：频率。这不是装饰，是尼古拉的呼号 */}
      <div
        style={{
          position: "absolute",
          left: m.frame + 34,
          top: m.frame + 30,
          fontFamily: "'Consolas', 'Courier New', monospace",
          color: "rgba(242,238,226,0.72)",
          fontSize: m.small - 2,
          letterSpacing: "0.3em",
        }}
      >
        PY-6&nbsp;&nbsp;4.860 MHz
      </div>

      {/* 内框：印刷品的出血线 */}
      <div
        style={{
          position: "absolute",
          inset: m.frame,
          border: `2px solid rgba(242,238,226,0.34)`,
        }}
      />
    </AbsoluteFill>
  );
};
