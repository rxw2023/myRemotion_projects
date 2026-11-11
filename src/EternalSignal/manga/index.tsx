import React, { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { BOOM_AT, clamp01, smooth } from "../signal";
import { INK, PAPER, paper } from "./ink";
import { ACTS, pageFooter } from "./acts";
import { H, M, W } from "./page";
import { drawPhotoPage, hasPanels, preloadPanels, usePanelVersion } from "./photo";
import { PANELS } from "./panels.generated";
import { AUDIO_BED, AUDIO_BOOM, LINES, SCENES, TOTAL_FRAMES } from "../timeline";

/**
 * 漫画版《永不消逝的电波》。
 *
 * 声音一个字没动——78 行台词、底噪、点火全复用。换的只是画面：
 * 从"一台在接收的机器"变成"一本黑白漫画"，人只以剪影和背影出现。
 */

const NUMBER: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10,
};

const TAG: Record<string, string> = {
  nicolai: "倾听者",
  ground: "莆田港",
  captain: "远行者六号",
  captain2: "达·伽马号",
  crew: "船员",
  colonist: "殖民二号",
  elder: "长者",
  ai: "航行电脑",
  far: "残片",
};

const keyLine = (scene: string, prefix: string) =>
  LINES.find((l) => l.scene === scene && l.text.startsWith(prefix))?.start ?? 0;

/** F 幕倒计时，与三处配音帧位对齐 */
const countdownAt = (frame: number): { on: boolean; n: number } => {
  const a = keyLine("F", "六百");
  const b = keyLine("F", "三百");
  const c = keyLine("F", "一百");
  if (a <= 0) return { on: false, n: 0 };
  const lerp = (x: number, y: number, u: number) => Math.round(x + (y - x) * clamp01(u));
  if (frame < a - 16) return { on: false, n: 600 };
  if (frame < b) return { on: true, n: lerp(600, 300, (frame - a) / Math.max(1, b - a)) };
  if (frame < c) return { on: true, n: lerp(300, 100, (frame - b) / Math.max(1, c - b)) };
  if (frame < BOOM_AT) return { on: true, n: lerp(100, 0, (frame - c) / Math.max(1, BOOM_AT - c)) };
  return { on: frame < BOOM_AT + 60, n: 0 };
};

/**
 * 纸底是静止的，但它每帧要画 1400 个纤维点和 5 团径向渐变——这部分没必要每帧重算。
 * 画一次，之后整帧贴图。
 */
let paperCache: HTMLCanvasElement | null = null;
const getPaper = () => {
  if (paperCache) return paperCache;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (g) paper(g, W, H);
  paperCache = c;
  return c;
};

export const EternalSignalManga: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);

  // 有生成好的图就先解码，没有就是空操作
  preloadPanels();
  // 图加载完会抬版本号，靠它把这一帧重画一遍
  const panelVersion = usePanelVersion();

  const scene = [...SCENES].reverse().find((s) => frame >= s.start) ?? SCENES[0];
  const t = (frame - scene.start) / fps;
  const line = LINES.find((l) => frame >= l.start - 2 && frame <= l.end + 12);
  const cd = countdownAt(frame);
  const bedLoops = Math.ceil(TOTAL_FRAMES / (12 * fps));
  // 翻页要对齐台词，所以把这一幕每句台词的起点抠出来交给图页
  const lineTimes = LINES.filter((l) => l.scene === scene.id).map(
    (l) => (l.start - scene.start) / fps,
  );

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(getPaper(), 0, 0);
    // 这一幕有生成图就用图页，没有就退回手绘页
    if (hasPanels(scene.id)) {
      drawPhotoPage(ctx, scene.id, PANELS[scene.id], t, scene.frames / fps, lineTimes);
    } else {
      const act = ACTS[scene.id];
      if (act) act(ctx, t, scene.frames / fps);
    }
    pageFooter(ctx, scene.id, scene.name, NUMBER[scene.id] ?? 1);
  }, [frame, scene, t, panelVersion]);

  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {/* ---------------- 声音：与电台版完全一致 ---------------- */}
      {Array.from({ length: bedLoops }).map((_, i) => (
        <Sequence key={i} from={i * 12 * fps} durationInFrames={12 * fps} layout="none">
          <Audio src={staticFile(AUDIO_BED)} volume={0.85} />
        </Sequence>
      ))}
      <Sequence from={Math.max(0, BOOM_AT - 6)} durationInFrames={120} layout="none">
        <Audio src={staticFile(AUDIO_BOOM)} volume={1} />
      </Sequence>
      {LINES.map((l) => (
        <Sequence
          key={l.src}
          from={l.start}
          durationInFrames={Math.max(1, l.end - l.start + 4)}
          layout="none"
        >
          <Audio src={staticFile(l.src)} volume={1} />
        </Sequence>
      ))}

      {/* ---------------- 页 ---------------- */}
      <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H }} />

      {/* 倒计时数字：手绘版才需要。图页里 f-02/03/04 三格本身就是表盘，再叠一个大数字会打架 */}
      {cd.on && !hasPanels("F") && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 300,
            textAlign: "center",
            fontFamily: "'Segoe UI', 'Microsoft YaHei', sans-serif",
            fontVariantNumeric: "tabular-nums",
            // 点火前是黑页，得用白字；点火后是白页，得用黑字
            color: t < 26 ? PAPER : INK,
            fontSize: 190,
            fontWeight: 300,
            lineHeight: 1.1,
            opacity: 0.92 * smooth(clamp01((frame - (keyLine("F", "六百") - 16)) / 16)),
          }}
        >
          {cd.n}
        </div>
      )}

      {/* 说白框：漫画的旁白格，不是字幕条 */}
      <div
        style={{
          position: "absolute",
          left: M,
          top: H - 116,
          maxWidth: 1280,
          minHeight: 62,
          padding: "12px 22px 14px",
          background: PAPER,
          border: `4px solid ${INK}`,
          fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
          color: INK,
          fontSize: 30,
          fontWeight: 600,
          lineHeight: 1.32,
          letterSpacing: "0.02em",
          opacity: line ? 1 : 0,
        }}
      >
        <span
          style={{
            display: "inline-block",
            marginRight: 14,
            padding: "2px 9px",
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: "0.08em",
            background: INK,
            color: PAPER,
            verticalAlign: "3px",
          }}
        >
          {line ? TAG[line.role] : ""}
        </span>
        {line ? line.text : ""}
      </div>
    </AbsoluteFill>
  );
};
