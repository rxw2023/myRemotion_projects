import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { CHANNEL, SKIN, T, rgba, toSticker } from "./tokens";

/**
 * MRDave先生 · 频道片头 10 秒
 * 「地球先生的开机自检」—— 120BPM × 5 小节 = 300 帧 = 10.000s 整。
 *
 * 三条借来的规矩（出处见 docs/CHANNEL_INTRO.md）：
 *   1. 时间网格先于镜头：所有硬切/入场落在 15 帧的整数倍上。
 *   2. 品牌色与几何必须实测：色板与眼睛坐标都来自 public/channel/avatar.jpg。
 *   3. 亮底不用辉光：底色亮度 ≈0.95，只用硬阴影 + 粗描边（见 tokens.ts ALLOW_GLOW）。
 */

const C = CHANNEL.colors;
const FPS = 30;

// ==================== 版式（设计稿基于 1080×1920 / 1920×1080） ====================

type Spec = {
  u: number;
  strip: { cx: number; cy: number };
  stage: { cx: number; cy: number; size: number };
  word: { cx: number; cy: number; size: number };
  seal: { size: number; gap: number };
  sign: { cx: number; cy: number; size: number };
};

const buildSpec = (width: number, height: number): Spec => {
  const wide = width > height;
  const u = height / (wide ? 1080 : 1920);
  return wide
    ? {
        u,
        strip: { cx: 1360, cy: 232 },
        stage: { cx: 566, cy: 540, size: 660 },
        word: { cx: 1352, cy: 486, size: 108 },
        seal: { size: 120, gap: 26 },
        sign: { cx: 1352, cy: 700, size: 24 },
      }
    : {
        u,
        strip: { cx: 540, cy: 152 },
        stage: { cx: 540, cy: 812, size: 780 },
        word: { cx: 540, cy: 1338, size: 128 },
        seal: { size: 136, gap: 30 },
        // 签名条原来在 1672（87%），B 站竖屏 UI 会盖住；标语拿掉后顺势提到 1560（81%），
        // 既补上标语留下的空档，也退出底部 UI 的危险区。
        sign: { cx: 540, cy: 1560, size: 26 },
      };
};

const ease = (v: number) => 1 - Math.pow(1 - v, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 硬切：指定帧之前 0、之后 1，绝不淡入 */
const hardCut = (frame: number, at: number) => (frame >= at ? 1 : 0);

// ==================== 元素 1：点阵基底（一个点 = 一个 bit） ====================

const DotLayer: React.FC<{
  pitch: number;
  radius: number;
  color: string;
  alpha: number;
  /** 0..1，按行揭开，不是渐变淡入 */
  reveal?: number;
  drift?: number;
}> = ({ pitch, radius, color, alpha, reveal = 1, drift = 0 }) => {
  const stop = clamp01(reveal) * 100;
  const mask = `linear-gradient(to bottom, #000 0%, #000 ${stop}%, transparent ${stop}%)`;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(circle at center, ${color} ${radius}px, transparent ${
          radius + 0.7
        }px)`,
        backgroundSize: `${pitch}px ${pitch}px`,
        backgroundPosition: `${drift}px ${drift}px`,
        opacity: Math.max(0, alpha),
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
};

// ==================== 元素 2：终端引导（只有"我是谁"，没有"我讲什么"） ====================

/**
 * 原来的自检清单（SILICON 硅基原理 / MEMORY 存储与缓存 / …）整块拿掉了。
 * 理由：那五行等于替频道承诺了选题范围，选题一变片头就过期。
 * 片头只保留一句纯机器语，指向昵称本身，不含任何内容主张。
 *
 * 「终端初始化」这件事还是要演出来的 —— 但它演的是**机器在动**，不是内容在说什么：
 *   ① 字符逐个落定，每个字先乱码 5 帧再锁死（终端刷字符集的样子）
 *   ② 一个块状光标跟着打字位置走：打字时实心，打完后 2Hz 闪
 *   ③ 第二行 16 格进度条硬跳填满，填满那刻整条翻绿闪 3 帧，然后 OK 落下
 * 全程没有一个有语义的词 —— 乱码是十六进制字符集，不是字。
 */
const BOOT_LINE = "> MRDAVE.SYS";
const SCRAMBLE = "0123456789ABCDEF";

/** 确定性伪随机：Remotion 每帧可能在不同进程重算，不能用 Math.random()。 */
const noise = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const TerminalInit: React.FC<{ frame: number; size: number; u: number }> = ({ frame, size, u }) => {
  const chars = BOOT_LINE.split("");
  const barCells = 16;
  const cell = size * 0.62; // 等宽单元格：字宽固定，整行才不会一边打字一边左右抖

  const bornCount = Math.max(0, Math.min(chars.length, Math.floor((frame - T.terminal) / 2) + 1));
  const typingDone = frame >= T.terminal + (chars.length - 1) * 2;

  // 落定前 5 帧显示随机十六进制字符，之后锁死成真字符
  const glyph = (i: number) => {
    const born = T.terminal + i * 2;
    if (frame < born) return "";
    if (frame - born < 5) return SCRAMBLE[Math.floor(noise(i * 31.7 + frame) * SCRAMBLE.length)];
    return chars[i];
  };

  // 打字时实心、打完后 2Hz 闪 —— 光标是"机器还活着"的唯一信号
  const cursorOn = !typingDone || Math.floor(frame / 8) % 2 === 0;

  // 16 格硬跳，刻意不做平滑：一格一格蹦才是"在初始化"
  const fill = Math.round(clamp01((frame - T.barFrom) / (T.barTo - T.barFrom)) * barCells);
  const flash = frame >= T.barTo && frame < T.ready; // 填满 → OK 之间的 3 帧翻绿
  const ready = frame >= T.ready;
  const jolt = frame === T.terminal ? 1 : 0; // 上电那一帧的 CRT 同步抖动

  // 整块向上擦除（和原来的清单同一种退场，不是淡出）
  const exit = interpolate(frame, [T.wipe - 4, T.wipe + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sx = spring({ frame: frame - T.ready, fps: FPS, config: { damping: 13, stiffness: 320, mass: 0.5 } });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: size * 0.72,
        fontFamily: SKIN.fontMono,
        fontSize: size,
        fontWeight: 700,
        color: C.ink,
        whiteSpace: "nowrap",
        clipPath: `inset(${exit * 100}% 0 0 0)`,
        transform: `translate(${-3 * u * jolt}px, ${-exit * size * 1.6}px)`,
        opacity: 1 - 0.35 * jolt,
      }}
    >
      {/* 第一行：13 格 = 12 个字符位 + 1 个游标位。行宽恒定，所以不会一边打字一边抖 */}
      <div style={{ display: "flex", alignItems: "baseline" }}>
        {Array.from({ length: chars.length + 1 }, (_, i) =>
          i === bornCount ? (
            // 游标永远停在"下一个要打的位置"，随打字一格一格往右跳 —— 终端光标唯一正确的行为
            <span key="cursor" style={{ display: "inline-block", width: cell, textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  width: cell * 0.62,
                  height: size * 0.78,
                  background: C.ocean,
                  opacity: cursorOn ? 1 : 0,
                }}
              />
            </span>
          ) : (
            <span key={i} style={{ display: "inline-block", width: cell, textAlign: "center" }}>
              {i < bornCount ? glyph(i) : ""}
            </span>
          ),
        )}
        <span
          style={{
            display: "inline-block",
            marginLeft: cell * 1.2,
            color: C.land,
            WebkitTextStroke: `${1.6 * u}px ${C.ink}`,
            opacity: ready ? 1 : 0,
            transform: `scale(${Math.max(0.001, ready ? sx : 0)})`,
          }}
        >
          OK
        </span>
      </div>

      {/* 第二行：16 格进度条（宽度和上一行基本相等，两行会自然对齐） */}
      <div style={{ display: "flex", gap: size * 0.09, opacity: frame >= T.terminal ? 1 : 0 }}>
        {Array.from({ length: barCells }, (_, i) => (
          <div
            key={i}
            style={{
              width: cell * 0.86,
              height: size * 0.44,
              background:
                i < fill
                  ? flash || (ready && i === barCells - 1)
                    ? C.land
                    : C.ink
                  : rgba(C.ink, 0.13),
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ==================== 元素 3：线框地球（二向箔压扁） ====================

const WireGlobe: React.FC<{
  size: number;
  /** 0..1 成形进度 */
  grow: number;
  /** 1 → 0：被压成一张平面 */
  depth: number;
  /** 自转相位（度） */
  rot: number;
}> = ({ size, grow, depth, rot }) => {
  const c = size / 2;
  const sw = size / 80;
  const R = c - sw * 2;
  const circum = 2 * Math.PI * R;
  const g = ease(clamp01(grow));

  const meridians = [-66, -33, 0, 33, 66].map((deg) => {
    const th = ((deg + rot) * Math.PI) / 180;
    return { deg, rx: R * Math.abs(Math.sin(th)) * g * depth };
  });
  const lats = [-60, -30, 0, 30, 60].map((deg) => {
    const ph = (deg * Math.PI) / 180;
    return {
      deg,
      y: c - R * Math.sin(ph) * g,
      rx: R * Math.cos(ph) * g,
      ry: R * Math.cos(ph) * Math.sin((22 * Math.PI) / 180) * g * depth,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      <g stroke={C.ink} fill="none" strokeLinecap="round">
        {meridians.map((m) => (
          <ellipse
            key={`m${m.deg}`}
            cx={c}
            cy={c}
            rx={Math.max(m.rx, 0.4)}
            ry={R * g}
            strokeWidth={sw * 0.75}
          />
        ))}
        {lats.map((l) => (
          <ellipse
            key={`l${l.deg}`}
            cx={c}
            cy={l.y}
            rx={Math.max(l.rx, 0.4)}
            ry={Math.max(l.ry, sw * 0.4)}
            strokeWidth={sw * 0.75}
          />
        ))}
        <circle
          cx={c}
          cy={c}
          r={R}
          strokeWidth={sw * 1.9}
          strokeDasharray={circum}
          strokeDashoffset={circum * (1 - g)}
        />
      </g>
    </svg>
  );
};

// ==================== 元素 4：真实头像的网点印刷 ====================

/**
 * 真实头像的网点印刷。
 *
 * 用的是 scripts/channel-intro/make_globe.py 预切好的 public/channel/globe.png
 * （600×600 RGBA，地球内切、圆外 alpha=0），**不在渲染期做圆形 mask**。
 * 理由：在渲染期用"实测圆心+半径"做 mask，半径差 3% 就会在圆外露出一圈白纸，
 * 而症状看起来像"遮罩没生效"、真因是一个小数 —— 这正是 RuiC gotchas.md 说的那类坑。
 * 预切成 alpha 之后，片子只负责摆放，不负责几何。
 */
const PrintedGlobe: React.FC<{
  disc: number;
  /** 网点半径 0..15 */
  dot: number;
  /** 实心层透明度 */
  crisp: number;
  /** 0..1 眨眼闭合量 */
  lid: number;
}> = ({ disc, dot, crisp, lid }) => {
  const img = { position: "absolute" as const, left: 0, top: 0, width: disc, height: disc };
  const mask = `radial-gradient(circle at center, #000 ${dot}px, transparent ${dot}px)`;

  return (
    <div
      style={{
        width: disc,
        height: disc,
        position: "relative",
        // 眨眼时整颗地球轻微"挤"一下，像是被机械快门夹了一下
        transform: `scale(${1 + lid * 0.045}, ${1 - lid * 0.05})`,
      }}
    >
      {/* 第一遍：网点 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: mask,
          maskImage: mask,
          WebkitMaskSize: "20px 20px",
          maskSize: "20px 20px",
          WebkitMaskRepeat: "repeat",
          maskRepeat: "repeat",
        }}
      >
        <Img src={staticFile("channel/globe.png")} style={img} />
      </div>
      {/* 第二遍：压实成实心 */}
      <div style={{ position: "absolute", inset: 0, opacity: crisp }}>
        <Img src={staticFile("channel/globe.png")} style={img} />
      </div>
      {/* 机械快门式眨眼：坐标是实测的，右眼天生比左眼高 */}
      {lid > 0.004
        ? CHANNEL.eyes.map((e, i) => {
            const p = toSticker(e.cx, e.cy, e.r);
            const r = p.r * disc;
            return (
              <div
                key={`eye${i}`}
                style={{
                  position: "absolute",
                  left: p.x * disc - r,
                  top: p.y * disc - r * lid,
                  width: r * 2,
                  height: r * 2 * lid,
                  background: C.ink,
                  borderRadius: r * 0.45,
                }}
              />
            );
          })
        : null}
    </div>
  );
};

// ==================== 元素 5：字标 + 「先生」印章 ====================

/**
 * 套印错位：同一行字印三遍（黑版在上、蓝版右偏、绿版左偏），
 * 用 text-shadow 让色版落在字身之后 —— 只在边缘露出彩色毛边，落定后 3 帧内归零。
 * 不要改成 mixBlendMode 叠三个 <span>：绝对定位的子元素永远盖在正常流内容之上，黑版会被压到最下面。
 */
const Wordmark: React.FC<{ frame: number; size: number; u: number }> = ({ frame, size, u }) => {
  const local = frame - T.frameIn;
  const off = 9 * u * (1 - clamp01(local / 3));
  const slide = interpolate(local, [0, 5], [-size * 1.1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: SKIN.fontHeavy,
        fontSize: size,
        fontWeight: 900,
        letterSpacing: -size * 0.02,
        color: C.ink,
        WebkitTextStroke: `${3 * u}px ${C.ink}`,
        lineHeight: 1,
        whiteSpace: "nowrap",
        transform: `translateX(${slide}px)`,
        textShadow:
          off > 0.05 ? `${off}px 0 0 ${C.ocean}, ${-off}px 0 0 ${C.land}` : "none",
      }}
    >
      MRDave
    </span>
  );
};

const Seal: React.FC<{ frame: number; size: number; u: number }> = ({ frame, size, u }) => {
  const local = frame - T.stamp;
  const drop = spring({ frame: local, fps: FPS, config: { damping: 11, stiffness: 250, mass: 0.7 } });
  const ring = clamp01(local / 7);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {local >= 0 && ring < 1 ? (
        <div
          style={{
            position: "absolute",
            left: size / 2,
            top: size / 2,
            width: size * (1 + ring * 1.6),
            height: size * (1 + ring * 1.6),
            transform: "translate(-50%, -50%) rotate(-3deg)",
            border: `${5 * u}px solid ${rgba(C.seal, 1 - ring)}`,
          }}
        />
      ) : null}
      <div
        style={{
          width: size,
          height: size,
          background: C.seal,
          borderRadius: 7 * u,
          transform: `scale(${Math.max(0.001, drop)}) rotate(-3deg)`,
          opacity: hardCut(frame, T.stamp),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `${5 * u}px ${5 * u}px 0 ${rgba(C.ink, 0.92)}`,
        }}
      >
        <div
          style={{
            border: `${4 * u}px solid ${rgba(C.paper, 0.92)}`,
            borderRadius: 3 * u,
            padding: `${size * 0.08}px ${size * 0.14}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {["先", "生"].map((ch) => (
            <span
              key={ch}
              style={{
                color: C.paper,
                fontFamily: SKIN.fontCN,
                fontWeight: 800,
                fontSize: size * 0.33,
                lineHeight: 1.02,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== 主组件 ====================

export const ChannelIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const s = buildSpec(width, height);
  const u = s.u;

  // ---- 落点抖动：二维化与盖章各抖 2 帧 ----
  const hit = (f: number) => (frame >= f && frame < f + 2 ? 1 : 0);
  const shake = (hit(T.flatten) * 14 - hit(T.stamp) * 9) * u * (frame % 2 === 0 ? 1 : -1);

  // ---- 点阵 ----
  const pitch = 27 * u;
  const rows = height / pitch;
  const reveal = clamp01(Math.floor(frame / 0.65) / rows);
  const dotsLive =
    frame < T.wipe
      ? 0.55
      : interpolate(frame, [T.wipe, T.wipe + 24], [0.55, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  // 签名条落定之后，底色点阵开始极缓慢地呼吸 —— 静帧看不出来，但尾巴不是死的
  const breathe = frame > T.marks ? 0.02 * Math.sin((frame - T.marks) / 9) : 0;

  // ---- BAR1 上电 ----
  const scan = interpolate(frame, [0, 46], [-0.05, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanAlpha = frame < 48 ? 0.9 * clamp01(1 - scan) : 0;

  // ---- BAR2 线框地球 → 二维化 ----
  const grow = clamp01((frame - T.wipe) / 30);
  const depth = 1 - ease(clamp01((frame - T.flatten) / 8));
  const rot = interpolate(frame, [T.spin, T.flatten], [0, 168], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 线框必须在印刷开始前彻底退场，否则会像一层灰网格糊在印出来的脸上。
  // 锚点是 T.print 而不是 T.crisp —— 挂在 crisp 上会让线框和网点重叠 13 帧。
  const globeAlpha =
    frame < T.print - 4
      ? frame < T.wipe
        ? 0
        : 1
      : interpolate(frame, [T.print - 4, T.print], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // ---- BAR4 印刷 → 眨眼 → 框 ----
  const dot = interpolate(frame, [T.print, T.crisp], [0, 15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const crisp = interpolate(frame, [T.crisp, T.crisp + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blinkPhase = (frame - T.blink) / 4;
  const lid = blinkPhase > 0 && blinkPhase < 1 ? Math.sin(Math.PI * blinkPhase) : 0;
  const disc = s.stage.size * 0.82 * u;
  const rebound = spring({
    frame: frame - T.print,
    fps,
    config: { damping: 13, stiffness: 150, mass: 0.9 },
  });
  const discScale = frame < T.print ? 1 : Math.max(0.001, rebound);
  const frameIn = hardCut(frame, T.frameIn);
  const cardDrop = spring({
    frame: frame - T.frameIn,
    fps,
    config: { damping: 13, stiffness: 200, mass: 0.8 },
  });

  return (
    <AbsoluteFill style={{ background: C.paper, fontFamily: SKIN.fontCN }}>
      <Audio src={staticFile("channel/intro-10s.wav")} />

      <DotLayer
        pitch={pitch}
        radius={1.6 * u}
        color={C.ink}
        alpha={0.12 + breathe}
        drift={(frame * 0.3) % pitch}
      />
      <DotLayer pitch={pitch} radius={2.0 * u} color={C.land} alpha={dotsLive} reveal={reveal} />

      {scanAlpha > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: scan * height,
            height: 3 * u,
            background: C.land,
            opacity: scanAlpha,
          }}
        />
      ) : null}

      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
        {/* ---------- 顶部系统条：实测昵称 + 实测签名 ---------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: s.strip.cy * u,
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16 * u,
            opacity: hardCut(frame, 10),
            fontFamily: SKIN.fontMono,
            fontSize: 26 * u,
            color: C.ink,
          }}
        >
          <span
            style={{
              width: 13 * u,
              height: 13 * u,
              borderRadius: "50%",
              background: C.land,
              border: `${3 * u}px solid ${C.ink}`,
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 700 }}>{CHANNEL.handle}</span>
          <span style={{ color: rgba(C.ink, 0.3) }}>/</span>
          <span style={{ color: rgba(C.ink, 0.55) }}>{CHANNEL.sign}</span>
          <span style={{ color: rgba(C.ink, 0.3) }}>/</span>
          <span style={{ color: rgba(C.ink, 0.55) }}>120 BPM × 5</span>
        </div>

        {/* ---------- 舞台 ---------- */}
        <div
          style={{
            position: "absolute",
            left: s.stage.cx * u,
            top: s.stage.cy * u,
            width: s.stage.size * u,
            height: s.stage.size * u,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* f0–2.5s 终端引导（拿掉自检清单后，这段独自撑起开场） */}
          {frame < T.wipe + 13 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: hardCut(frame, T.terminal - 5),
              }}
            >
              <TerminalInit frame={frame} size={54 * u} u={u} />
            </div>
          ) : null}

          {/* BAR2 线框地球 + 二维化压扁 */}
          {frame >= T.wipe ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: globeAlpha,
              }}
            >
              <div style={{ width: disc, height: disc, position: "relative" }}>
                <WireGlobe size={disc} grow={grow} depth={depth} rot={rot} />
              </div>
            </div>
          ) : null}

          {/* BAR4 真实头像：网点印刷 → 压实 → 眨眼 → 头像框 */}
          {frame >= T.print - 2 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "relative", transform: `scale(${discScale})` }}>
                <PrintedGlobe disc={disc} dot={dot} crisp={crisp} lid={lid} />
                {frameIn ? (
                  <div
                    style={{
                      position: "absolute",
                      left: -disc * 0.075,
                      top: -disc * 0.075,
                      width: disc * 1.15,
                      height: disc * 1.15,
                      border: `${6 * u}px solid ${C.ink}`,
                      boxShadow: `${11 * u}px ${11 * u}px 0 ${C.ink}`,
                      transform: `scale(${Math.max(0.001, cardDrop)})`,
                    }}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* ---------- 字标 + 「先生」印章（f210 前完全不渲染，否则会在开场抢占画面） ---------- */}
        <div
          style={{
            position: "absolute",
            left: s.word.cx * u,
            top: s.word.cy * u,
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            gap: s.seal.gap * u,
            opacity: hardCut(frame, T.frameIn),
          }}
        >
          <Wordmark frame={frame} size={s.word.size * u} u={u} />
          <Seal frame={frame} size={s.seal.size * u} u={u} />
        </div>

        {/* ---------- 四角套准十字（印刷对齐标记） ---------- */}
        {hardCut(frame, T.marks) ? (
          <div style={{ opacity: 0.32 }}>
            {[
              [86, 86],
              [width - 86, 86],
              [86, height - 86],
              [width - 86, height - 86],
            ].map(([x, y], i) => (
              <svg
                key={i}
                width={64 * u}
                height={64 * u}
                viewBox="0 0 64 64"
                style={{ position: "absolute", left: x - 32 * u, top: y - 32 * u }}
              >
                <circle cx="32" cy="32" r="15" fill="none" stroke={C.ink} strokeWidth="2.4" />
                <path
                  d="M32 0 V20 M32 44 V64 M0 32 H20 M44 32 H64"
                  stroke={C.ink}
                  strokeWidth="2.4"
                />
              </svg>
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
