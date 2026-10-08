import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CHANNEL, T } from "../ChannelIntro/tokens";
import {
  GLYPH_H,
  P,
  PX,
  glyphShadows,
  iconShadows,
  rnd,
  textWidth,
  toSticker,
} from "./tokens";
import { PACKS, PACK_KEYS, type PackKey } from "./content";

const GLOBE_PX = staticFile("channel/globe-px64.png");
const MASK_NAME = staticFile("channel/px-name.png");
const MASK_SIGN = staticFile("channel/px-sign.png");

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - Math.pow(1 - v, 3);
const snapP = (v: number) => Math.round(v / P) * P;
/** tsconfig 的 lib 停在 ES2015，`padStart` 用不了，手写一个 */
const pad = (n: number, width: number) => ("0".repeat(width) + Math.round(n)).slice(-width);

// ==================== 版式 ====================
//
// 两个画幅各写一套坐标，**不做等比缩放**。缩放会让虚拟像素落到小数上，
// 方块之间立刻出现半像素缝 —— 像素风最不能忍的就是这个。所以横版是重新排的，
// 不是把竖版乘一个系数。

interface Spec {
  hud: { y: number; m: number; size: number };
  model: { x: number; y: number; size: number };
  globe: { x: number; y: number; d: number };
  horizon: number;
  /** 地面是一条带，不是到底 —— 底下那块深色是给字标留的"标题板" */
  groundH: number;
  word: { x: number; y: number; size: number };
  seal: { x: number; y: number; d: number };
  banner: { x: number; y: number; w: number; h: number };
  footer: { x: number; y: number; size: number; lh: number; center: boolean };
  load: { cx: number; cy: number; size: number; barW: number };
  press: { cx: number; cy: number; size: number };
}

const buildSpec = (width: number, height: number): Spec =>
  width > height
    ? {
        hud: { y: 60, m: 60, size: 3 },
        model: { x: 60, y: 126, size: 3 },
        globe: { x: 120, y: 300, d: 600 },
        // 横版字标在右栏，地面底下没有东西可放 —— 地平线压到画面底，让地面自己收边
        horizon: 900,
        groundH: 180,
        word: { x: 840, y: 180, size: 13 },
        seal: { x: 1368, y: 168, d: 132 },
        banner: { x: 840, y: 336, w: 600, h: 186 },
        footer: { x: 840, y: 560, size: 3, lh: 34, center: false },
        load: { cx: 960, cy: 420, size: 6, barW: 600 },
        press: { cx: 960, cy: 420, size: 8 },
      }
    : {
        hud: { y: 96, m: 72, size: 3 },
        model: { x: 72, y: 168, size: 3 },
        // 地球正好站在地平线上（240 + 720 = 960），所以它是"从地面后面升起来"的
        globe: { x: 180, y: 240, d: 720 },
        horizon: 960,
        groundH: 144,
        word: { x: 276, y: 1140, size: 15 },
        seal: { x: 462, y: 1280, d: 156 },
        banner: { x: 168, y: 1462, w: 744, h: 186 },
        footer: { x: 540, y: 1668, size: 3, lh: 34, center: true },
        load: { cx: 540, cy: 620, size: 6, barW: 480 },
        press: { cx: 540, cy: 620, size: 8 },
      };

// ==================== 原子件 ====================

/**
 * 点阵文字。整行字只用一个 div —— 每个亮点是一条 `box-shadow`。
 * 比"一个像素一个 div"少两个数量级节点，也不会拖慢 Remotion 的逐帧求值。
 */
const PixelText: React.FC<{
  text: string;
  size: number;
  color: string;
  x: number;
  y: number;
  tracking?: number;
  shadow?: string;
  opacity?: number;
}> = ({ text, size, color, x, y, tracking = 1, shadow, opacity = 1 }) => (
  <>
    {shadow ? (
      <div
        style={{
          position: "absolute",
          left: x + P,
          top: y + P,
          width: size,
          height: size,
          opacity,
          boxShadow: glyphShadows(text, size, shadow, tracking),
        }}
      />
    ) : null}
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        opacity,
        boxShadow: glyphShadows(text, size, color, tracking),
      }}
    />
  </>
);

/** 居中版：给中心点而不是左上角 */
const PixelTextC: React.FC<{
  text: string;
  size: number;
  color: string;
  cx: number;
  y: number;
  shadow?: string;
  opacity?: number;
}> = ({ text, size, color, cx, y, shadow, opacity }) => (
  <PixelText
    text={text}
    size={size}
    color={color}
    x={Math.round(cx - textWidth(text, size) / 2)}
    y={y}
    shadow={shadow}
    opacity={opacity}
  />
);

const PixelIcon: React.FC<{
  kind: "coin" | "heart";
  size: number;
  color: string;
  x: number;
  y: number;
}> = ({ kind, size, color, x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      boxShadow: iconShadows(kind, size, color),
    }}
  />
);

/** 纯色像素块。所有边必须是 P 的整数倍，否则会出现半像素缝 */
const Block: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  opacity?: number;
}> = ({ x, y, w, h, color, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: color, opacity }} />
);

/**
 * 中文遮罩贴图。字是 Pillow 预先"压进像素格"的（见 `scripts/channel-intro/make_pixel_text.py`），
 * 这里只把它当 alpha 用，所以同一个字可以随时换色。字体是矢量的，CSS 的
 * `image-rendering: pixelated` 只对位图生效，做不到这件事。
 */
const MaskText: React.FC<{
  src: string;
  w: number;
  h: number;
  x: number;
  y: number;
  color: string;
  opacity?: number;
}> = ({ src, w, h, x, y, color, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: color,
      opacity,
      WebkitMaskImage: `url(${src})`,
      WebkitMaskSize: "100% 100%",
      WebkitMaskRepeat: "no-repeat",
      maskImage: `url(${src})`,
      maskSize: "100% 100%",
      maskRepeat: "no-repeat",
    }}
  />
);

// ==================== 场景件 ====================

/** 星空：64 颗确定性的方块星，越"远"的越小越慢 */
const STARS = Array.from({ length: 64 }, (_, i) => ({
  x: rnd(i * 3 + 1),
  y: rnd(i * 3 + 2),
  big: rnd(i * 3 + 3) < 0.3,
  d: 0.3 + rnd(i * 7 + 5) * 0.7,
}));

const StarField: React.FC<{ frame: number; from: number; w: number; horizon: number }> = ({
  frame,
  from,
  w,
  horizon,
}) => {
  const t = Math.max(0, frame - from);
  const band = horizon + P * 4;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: band, overflow: "hidden" }}>
      {STARS.map((st, i) => {
        const y = (((st.y * band + t * st.d * 2.6) % band) + band) % band;
        const s = st.big ? P * 2 : P;
        return (
          <Block
            key={i}
            x={snapP((st.x * (w - P * 2)) / P) * P}
            y={snapP(y)}
            w={s}
            h={s}
            color={PX.white}
            opacity={0.25 + st.d * 0.5}
          />
        );
      })}
    </div>
  );
};

/** 地平线：一条亮边 + 一片绿地 + 一条压暗的地脚，"地面"在像素风里就是几条纯色带 */
const Ground: React.FC<{ y: number; h: number; w: number }> = ({ y, h, w }) => (
  <>
    <Block x={0} y={y} w={w} h={P} color={PX.lime} />
    <Block x={0} y={y + P} w={w} h={h - P * 3} color={PX.green} />
    <Block x={0} y={y + h - P * 2} w={w} h={P * 2} color={PX.plum} opacity={0.5} />
  </>
);

/** HUD：1UP / 分数 / 金币 / 命。分数在游戏画面切入后往上跳 */
const Hud: React.FC<{ spec: Spec; w: number; frame: number; pack: PackKey }> = ({ spec, w, frame, pack }) => {
  const cfg = PACKS[pack].hud;
  if (!cfg) return null;
  if (frame < T.wipe) return null;

  const { y, m, size } = spec.hud;
  const score = Math.round(240000 * ease(clamp01((frame - T.wipe) / (T.marks - T.wipe))));
  const digits = pad(score, 6);

  const heartW = 7 * size;
  const coinW = 6 * size;
  const gap = P * 2;
  const label = `x${cfg.coins}`;
  const labelW = textWidth(label, size);
  const heartsW = cfg.lives * heartW + (cfg.lives - 1) * gap;
  const heartX = w - m - heartsW;
  const coinX = heartX - P * 6 - labelW - P - coinW;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: clamp01((frame - T.wipe) / 6) }}>
      <PixelText text="1UP" size={size} color={PX.lime} x={m} y={y} shadow={PX.bgDeep} />
      <PixelText
        text={digits}
        size={size}
        color={PX.white}
        x={m + textWidth("1UP", size) + P * 5}
        y={y}
        shadow={PX.bgDeep}
      />
      {Array.from({ length: cfg.lives }, (_, i) => (
        <PixelIcon key={i} kind="heart" size={size} color={PX.red} x={heartX + i * (heartW + gap)} y={y} />
      ))}
      <PixelIcon kind="coin" size={size} color={PX.yellow} x={coinX} y={y} />
      <PixelText text={label} size={size} color={PX.yellow} x={coinX + coinW + P} y={y} shadow={PX.bgDeep} />
    </div>
  );
};

/** 开机自检：LOADING + 16 格进度。进度格硬跳，不做平滑 —— 平滑就不像素了 */
const LoadScreen: React.FC<{ spec: Spec; frame: number; w: number; h: number; pack: PackKey }> = ({
  spec,
  frame,
  w,
  h,
  pack,
}) => {
  const { cx, cy, size, barW } = spec.load;
  const cells = 16;
  const cellW = Math.max(P, Math.floor(barW / cells / P) * P);
  const barH = P * 6;
  const born = Math.max(0, Math.min(11, Math.floor((frame - T.terminal) / 2) + 1));
  const typed = "MRDAVE.SYS".slice(0, born);
  const filled = Math.round(clamp01((frame - T.barFrom) / (T.barTo - T.barFrom)) * cells);
  const locked = frame >= T.barTo;
  const exit = clamp01((frame - T.wipe) / 14);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - exit }}>
      <PixelTextC
        text={PACKS[pack].load}
        size={size}
        color={PX.cyan}
        cx={cx}
        y={cy - P * 14}
        shadow={PX.plum}
      />
      <PixelText text={`> ${typed}`} size={size} color={PX.white} x={cx - barW / 2} y={cy + P * 6} />
      <PixelText
        text="_"
        size={size}
        color={PX.blue}
        x={cx - barW / 2 + textWidth(`> ${typed}`, size) + P * 2}
        y={cy + P * 6}
        opacity={Math.floor(frame / 8) % 2 ? 1 : 0}
      />

      <div
        style={{
          position: "absolute",
          left: cx - (cellW * cells) / 2,
          top: cy + P * 22,
          width: cellW * cells,
          height: barH,
        }}
      >
        {Array.from({ length: cells }, (_, i) => (
          <Block
            key={i}
            x={i * cellW}
            y={0}
            w={cellW - P}
            h={barH}
            color={i < filled ? (locked ? PX.lime : PX.white) : PX.plum}
          />
        ))}
      </div>

      {/* 装满那一下闪一条白 */}
      {frame >= T.barTo && frame < T.barTo + 3 ? (
        <Block x={0} y={0} w={w} h={h} color={PX.white} opacity={0.16} />
      ) : null}

      {/* PRESS START：硬切入 + 快闪 */}
      {frame >= T.ready ? (
        <PixelTextC
          text={PACKS[pack].press}
          size={spec.press.size}
          color={PX.yellow}
          cx={spec.press.cx}
          y={spec.press.cy + P * 42}
          shadow={PX.red}
          opacity={Math.floor(frame / 12) % 2 ? 1 : 0.18}
        />
      ) : null}
    </div>
  );
};

/**
 * 像素溶解幕：18×12 个方块按确定性随机顺序消失，用来从开机画面切到游戏画面。
 * 只画"还没消失"的格子，所以最大 216 个 div，不是 1920 个。
 */
const COLS = 18;
const ROWS = 12;
const Dissolve: React.FC<{ frame: number; from: number; span: number; w: number; h: number }> = ({
  frame,
  from,
  span,
  w,
  h,
}) => {
  const p = clamp01((frame - from) / span);
  // 幕没开始之前必须整块不画 —— 否则 p=0 时所有格子都"还没消失"，等于一块黑板盖住开机画面
  if (frame < from || p >= 1) return null;
  const cw = Math.ceil(w / COLS / P) * P;
  const ch = Math.ceil(h / ROWS / P) * P;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const delay = (Math.floor(i / COLS) / ROWS) * 0.55 + rnd(i) * 0.45;
        if (p > delay) return null;
        return <Block key={i} x={(i % COLS) * cw} y={Math.floor(i / COLS) * ch} w={cw} h={ch} color={PX.bgDeep} />;
      })}
    </div>
  );
};

/**
 * 地球先生。64×64 的预生成位图放大（`imageRendering: pixelated`），
 * 出场是 12×12 的方块按确定性随机顺序退场 —— 也就是"逐块显影"。
 */
const Globe: React.FC<{ spec: Spec; frame: number }> = ({ spec, frame }) => {
  const { x, y, d } = spec.globe;
  const cell = d / 12;
  const reveal = clamp01((frame - T.flatten) / (T.crisp - T.flatten));
  const lid = Math.sin(Math.PI * clamp01((frame - T.blink) / 6));

  return (
    <div style={{ position: "absolute", left: x, top: y, width: d, height: d }}>
      <Img
        src={GLOBE_PX}
        style={{ position: "absolute", inset: 0, width: d, height: d, imageRendering: "pixelated" }}
      />

      {/* 逐块显影：还没轮到的格子用天空色盖住 */}
      {reveal < 1
        ? Array.from({ length: 144 }, (_, i) => {
            if (reveal > rnd(i * 5 + 3)) return null;
            return (
              <Block
                key={`m${i}`}
                x={Math.round((i % 12) * cell)}
                y={Math.round(Math.floor(i / 12) * cell)}
                w={Math.ceil(cell)}
                h={Math.ceil(cell)}
                color={PX.bg}
              />
            );
          })
        : null}

      {/* 眨眼：机械快门，从上往下盖住眼白 */}
      {lid > 0.02
        ? CHANNEL.eyes.map((eye, i) => {
            const s = toSticker(eye.cx, eye.cy, eye.r);
            const r = s.r * d * 0.98;
            return (
              <Block
                key={`b${i}`}
                x={snapP(s.x * d - r)}
                y={snapP(s.y * d - r)}
                w={snapP(r * 2)}
                h={snapP(r * 2 * lid)}
                color={PX.bgDeep}
              />
            );
          })
        : null}
    </div>
  );
};

// ==================== 主组件 ====================

/** 给 Studio 的 props 面板用：不用改代码就能换内容层 */
export const pixelIntroSchema = z.object({
  pack: z.enum(PACK_KEYS as [PackKey, ...PackKey[]]),
});

export const PixelIntro: React.FC<{ pack?: PackKey }> = ({ pack = "arcade" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = buildSpec(width, height);
  const cfg = PACKS[pack];

  // 开机：从中间一条横线张开成整屏（CRT 通电），只花 12 帧
  const open = ease(clamp01(frame / 12));
  // 落点抖动：字标切入与盖章各抖 2 帧
  const hit = (f: number) => (frame >= f && frame < f + 2 ? 1 : 0);
  const shake = (hit(T.frameIn) * 10 - hit(T.stamp) * 7) * (frame % 2 === 0 ? 1 : -1);

  const gameOn = clamp01((frame - T.wipe) / 10);
  const wordSlide = spring({
    frame: frame - T.frameIn,
    fps: 30,
    config: { damping: 12, stiffness: 300, mass: 0.7 },
  });
  const sealDrop = spring({
    frame: frame - T.stamp,
    fps: 30,
    config: { damping: 9, stiffness: 220, mass: 0.8 },
  });
  const bannerUp = spring({
    frame: frame - T.marks,
    fps: 30,
    config: { damping: 14, stiffness: 200, mass: 0.8 },
  });
  const footerOn = clamp01((frame - T.freeze) / 20);

  const wordW = textWidth("MRDAVE", s.word.size);
  const sealInner = s.seal.d - P * 6;
  const nameMaskH = snapP((sealInner * 17) / 32);
  // 印章贴图是 62×14，宽高比必须跟着走；同时不能高过成就条本身
  const signMaskW = Math.min(s.banner.w - P * 8, ((s.banner.h - P * 12) * 62) / 14);
  const signMaskH = Math.round((signMaskW * 14) / 62);

  return (
    <AbsoluteFill style={{ background: PX.bgDeep }}>
      <Audio src={staticFile("channel/intro-10s.wav")} />

      {/* 屏幕内容整体被 clipPath 夹住 —— 通电时从中间一条线张开 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(${(0.5 - open * 0.5) * 100}% 0 ${(0.5 - open * 0.5) * 100}% 0)`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
          {/* ---- 游戏画面：天 → 星 → 地球 → 地 ---- */}
          <div style={{ position: "absolute", inset: 0, opacity: gameOn }}>
            <Block x={0} y={0} w={width} h={height} color={PX.bg} />
            <StarField frame={frame} from={T.wipe} w={width} horizon={s.horizon} />
          </div>

          <PixelText
            text={cfg.model}
            size={s.model.size}
            color={PX.cyan}
            x={s.model.x}
            y={s.model.y}
            opacity={gameOn * 0.75}
          />

          {frame >= T.wipe ? <Globe spec={s} frame={frame} /> : null}
          {frame >= T.wipe ? <Ground y={s.horizon} h={s.groundH} w={width} /> : null}

          <Hud spec={s} w={width} frame={frame} pack={pack} />

          {/* ---- 字标：硬切 + 3 帧双色套印错位 ---- */}
          {frame >= T.frameIn ? (
            <>
              {(() => {
                const off = Math.round(P * 1.5 * clamp01(1 - (frame - T.frameIn) / 3));
                if (off <= 0) return null;
                return (
                  <>
                    <PixelText
                      text="MRDAVE"
                      size={s.word.size}
                      color={PX.blue}
                      x={s.word.x - off}
                      y={s.word.y}
                    />
                    <PixelText
                      text="MRDAVE"
                      size={s.word.size}
                      color={PX.red}
                      x={s.word.x + off}
                      y={s.word.y}
                    />
                  </>
                );
              })()}
              <div style={{ transform: `translateY(${(1 - wordSlide) * P * 6}px)` }}>
                <PixelText
                  text="MRDAVE"
                  size={s.word.size}
                  color={PX.white}
                  x={s.word.x}
                  y={s.word.y}
                  shadow={PX.plum}
                />
              </div>
              <Block
                x={s.word.x}
                y={s.word.y + GLYPH_H * s.word.size + P * 3}
                w={wordW}
                h={P}
                color={PX.plum}
              />
            </>
          ) : null}

          {/* ---- 「先生」方印 ---- */}
          {frame >= T.stamp ? (
            <div
              style={{
                opacity: clamp01(sealDrop * 1.6),
                transform: `translateY(${(1 - sealDrop) * -P * 14}px)`,
              }}
            >
              <Block x={s.seal.x} y={s.seal.y} w={s.seal.d} h={s.seal.d} color={PX.white} />
              <Block x={s.seal.x + P} y={s.seal.y + P} w={s.seal.d - P * 2} h={s.seal.d - P * 2} color={PX.red} />
              <MaskText
                src={MASK_NAME}
                w={sealInner}
                h={nameMaskH}
                x={s.seal.x + P * 3}
                y={s.seal.y + P * 3 + snapP((sealInner - nameMaskH) / 2)}
                color={PX.white}
              />
            </div>
          ) : null}

          {/* ---- 成就条：把「知识科普向」框成一条解锁提示 ---- */}
          {cfg.badge && frame >= T.marks ? (
            <div
              style={{
                opacity: clamp01(bannerUp * 2),
                transform: `translateY(${(1 - bannerUp) * s.banner.h}px)`,
              }}
            >
              <Block x={s.banner.x} y={s.banner.y} w={s.banner.w} h={s.banner.h} color={PX.yellow} />
              <Block
                x={s.banner.x + P}
                y={s.banner.y + P}
                w={s.banner.w - P * 2}
                h={s.banner.h - P * 2}
                color={PX.bgDeep}
              />
              <PixelTextC
                text="* ACHIEVEMENT *"
                size={4}
                color={PX.yellow}
                cx={s.banner.x + s.banner.w / 2}
                y={s.banner.y + P * 2}
              />
              <PixelText
                text="1UP"
                size={4}
                color={PX.lime}
                x={s.banner.x + s.banner.w - P * 4 - textWidth("1UP", 4)}
                y={s.banner.y + P * 2}
              />
              <MaskText
                src={MASK_SIGN}
                w={signMaskW}
                h={signMaskH}
                x={Math.round(s.banner.x + (s.banner.w - signMaskW) / 2)}
                y={s.banner.y + s.banner.h - signMaskH - P * 2}
                color={PX.white}
              />
            </div>
          ) : null}

          {/* ---- 版权行 ---- */}
          {cfg.footer.map((line, i) => (
            <PixelTextC
              key={line}
              text={line}
              size={s.footer.size}
              color={PX.white}
              cx={s.footer.center ? s.footer.x : s.footer.x + textWidth(line, s.footer.size) / 2}
              y={s.footer.y + i * s.footer.lh}
              opacity={footerOn * 0.7}
            />
          ))}
        </div>

        {/* 开机画面与溶解幕都在 clip 之内 —— CRT 通电要连开机画面一起从中间张开 */}
        {frame < T.wipe + 12 ? <LoadScreen spec={s} frame={frame} w={width} h={height} pack={pack} /> : null}
        <Dissolve frame={frame} from={T.wipe} span={22} w={width} h={height} />
      </div>

      {/* 通电白闪，只亮 2 帧 */}
      {frame < 2 ? (
        <Block x={0} y={0} w={width} h={height} color={PX.white} opacity={interpolate(frame, [0, 2], [0.7, 0])} />
      ) : null}

      {/* 扫描线：每 3 个虚拟像素压一条暗线，最便宜也最有效的一层 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.5,
          backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) ${P}px, transparent ${P}px, transparent ${P * 3}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
