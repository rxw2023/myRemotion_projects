/**
 * 《像素到光子》—— 一只橘猫的游戏图像史
 *
 * 素材：用户提供的 12 个年代的「游戏技术与画风年代表」，以及对应生成的 12 张橘猫图
 *       （public/gameCatEra/cat-00.jpg … cat-11.jpg，图上烧了年代字样，配对已逐张目视核对）。
 *
 * 叙事：正序（chronological）。影片从 1970–1974 一路讲到 2023–2026。
 *       ERAS 始终按年代升序书写（便于与素材表逐行对照）；
 *       TIMELINE 才是实际出场顺序，把下面的 REVERSE 改成 true 即可切回倒叙。
 *
 * 音频：每个年代一段配音（edge-tts 生成，见 scripts/gamecat-audio.py）＋一条常驻底噪。
 */

export type Era = {
  /** 与素材表行号一致，0 = 1970-1974（最老），11 = 2023-2026（最新） */
  index: number;
  /** 年代区间文案，如 "2023–2026" */
  years: string;
  yearStart: number;
  yearEnd: number;
  /** 短标签，如 "神经渲染" */
  label: string;
  /** 游戏技术 / 平台 */
  tech: string;
  /** 视觉关键词 */
  visual: string[];
  /** 猫的呈现 */
  cat: string;
  /** 纪录片旁白（字幕） */
  narration: string;
  /** 静态图路径（相对 public/） */
  image: string;
  /** 年代主色 */
  accent: string;
  /** 年代辅色 */
  accent2: string;
  /** 背景渐变两端 */
  bgA: string;
  bgB: string;
  /** CRT 扫描线强度 0–1 */
  scanline: number;
  /** 图片模糊（px），模拟低清/雾气 */
  blur: number;
  /** 高光/辉光强度 0–1 */
  bloom: number;
  /** 胶片颗粒强度 0–1 */
  grain: number;
  /** 运动帧率：越早的年代动画越卡（低帧率动画） */
  motionFps: number;
  /** 是否使用等宽/终端字体 */
  mono: boolean;
  /** 面板圆角（复古年代硬边） */
  radius: number;
  /** 技术标尺：抽象的"画质三指标"，0–1 */
  metrics: { resolution: number; polys: number; light: number };
};

export const ERAS: Era[] = [
  {
    index: 0,
    years: "1970–1974",
    yearStart: 1970,
    yearEnd: 1974,
    label: "符号",
    tech: "早期街机、Odyssey",
    visual: ["单色", "点阵", "CRT", "极简"],
    cat: "黑白块状像素猫，几乎只是符号",
    narration: "一切从黑白方块开始。这只猫，几乎只是一个符号。",
    image: "gameCatEra/cat-00.jpg",
    accent: "#E8E8E8",
    accent2: "#9AA0A6",
    bgA: "#040404",
    bgB: "#161616",
    scanline: 1,
    blur: 0.7,
    bloom: 0.05,
    grain: 0.9,
    motionFps: 6,
    mono: true,
    radius: 0,
    metrics: { resolution: 0.02, polys: 0.02, light: 0.02 },
  },
  {
    index: 1,
    years: "1975–1979",
    yearStart: 1975,
    yearEnd: 1979,
    label: "彩块",
    tech: "Atari 2600、Space Invaders",
    visual: ["彩色块", "低分辨率", "街机"],
    cat: "简单彩色像素猫，粗轮廓",
    narration: "彩色块出现了。轮廓很粗，但你已经能认出它。",
    image: "gameCatEra/cat-01.jpg",
    accent: "#7ED321",
    accent2: "#2E6BFF",
    bgA: "#050A18",
    bgB: "#111C3E",
    scanline: 0.95,
    blur: 0.5,
    bloom: 0.15,
    grain: 0.8,
    motionFps: 6,
    mono: true,
    radius: 0,
    metrics: { resolution: 0.04, polys: 0.04, light: 0.04 },
  },
  {
    index: 2,
    years: "1980–1984",
    yearStart: 1980,
    yearEnd: 1984,
    label: "8 位",
    tech: "街机黄金期、Pac-Man、Donkey Kong",
    visual: ["8位早期", "纯色", "像素"],
    cat: "8位像素猫，大眼、红围巾",
    narration: "纯色、大眼、红围巾——一只猫的符号，在这里定型。",
    image: "gameCatEra/cat-02.jpg",
    accent: "#FFD400",
    accent2: "#FF4FA3",
    bgA: "#0A0620",
    bgB: "#161B4A",
    scanline: 0.9,
    blur: 0.35,
    bloom: 0.25,
    grain: 0.7,
    motionFps: 8,
    mono: true,
    radius: 0,
    metrics: { resolution: 0.07, polys: 0.06, light: 0.06 },
  },
  {
    index: 3,
    years: "1985–1989",
    yearStart: 1985,
    yearEnd: 1989,
    label: "横版",
    tech: "NES / FC、Game Boy",
    visual: ["8位成熟", "横版", "有限色板"],
    cat: "经典像素猫，平台跳跃感",
    narration: "有限色板，横版卷轴。像素开始有了表情。",
    image: "gameCatEra/cat-03.jpg",
    accent: "#E0453A",
    accent2: "#FFB300",
    bgA: "#04122E",
    bgB: "#0B2A5B",
    scanline: 0.85,
    blur: 0.25,
    bloom: 0.3,
    grain: 0.6,
    motionFps: 8,
    mono: true,
    radius: 0,
    metrics: { resolution: 0.1, polys: 0.09, light: 0.08 },
  },
  {
    index: 4,
    years: "1990–1994",
    yearStart: 1990,
    yearEnd: 1994,
    label: "16 位",
    tech: "SNES、Genesis、Doom",
    visual: ["16位像素", "视差", "伪3D"],
    cat: "精细像素猫，RPG / 动作风",
    narration: "16 位色板、视差滚动、伪 3D：像素的黄金年代。",
    image: "gameCatEra/cat-04.jpg",
    accent: "#4FC3F7",
    accent2: "#B24BF3",
    bgA: "#060B18",
    bgB: "#1A0F2E",
    scanline: 0.75,
    blur: 0.2,
    bloom: 0.35,
    grain: 0.55,
    motionFps: 12,
    mono: true,
    radius: 0,
    metrics: { resolution: 0.16, polys: 0.15, light: 0.13 },
  },
  {
    index: 5,
    years: "1995–1999",
    yearStart: 1995,
    yearEnd: 1999,
    label: "低模",
    tech: "PS1、Saturn、N64",
    visual: ["早期3D", "低多边形", "雾", "模糊贴图"],
    cat: "低多边形猫，方块感明显",
    narration: "第一次进入 3D。低多边形，浓雾，模糊贴图。",
    image: "gameCatEra/cat-05.jpg",
    accent: "#8B8BFF",
    accent2: "#3DDC97",
    bgA: "#07070F",
    bgB: "#171A2E",
    scanline: 0.6,
    blur: 0.35,
    bloom: 0.3,
    grain: 0.5,
    motionFps: 12,
    mono: true,
    radius: 2,
    metrics: { resolution: 0.22, polys: 0.3, light: 0.22 },
  },
  {
    index: 6,
    years: "2000–2004",
    yearStart: 2000,
    yearEnd: 2004,
    label: "成熟 3D",
    tech: "PS2、Xbox、GameCube",
    visual: ["3D成熟", "写实化", "开放世界雏形"],
    cat: "3D猫，贴图更清晰，动态光影",
    narration: "多边形终于够用了。贴图清晰，光影开始会动。",
    image: "gameCatEra/cat-06.jpg",
    accent: "#00C2A8",
    accent2: "#FF8A3D",
    bgA: "#050F16",
    bgB: "#0E2430",
    scanline: 0.45,
    blur: 0.2,
    bloom: 0.35,
    grain: 0.4,
    motionFps: 20,
    mono: false,
    radius: 4,
    metrics: { resolution: 0.32, polys: 0.45, light: 0.38 },
  },
  {
    index: 7,
    years: "2005–2009",
    yearStart: 2005,
    yearEnd: 2009,
    label: "高清",
    tech: "Xbox 360、PS3、Wii",
    visual: ["HD", "光晕", "在线", "电影化"],
    cat: "高清3D猫，毛发初现",
    narration: "高清降临，光晕铺开。毛发第一次长在猫身上。",
    image: "gameCatEra/cat-07.jpg",
    accent: "#8CD800",
    accent2: "#00C2FF",
    bgA: "#05120A",
    bgB: "#0C2438",
    scanline: 0.35,
    blur: 0.12,
    bloom: 0.4,
    grain: 0.35,
    motionFps: 30,
    mono: false,
    radius: 6,
    metrics: { resolution: 0.52, polys: 0.62, light: 0.55 },
  },
  {
    index: 8,
    years: "2010–2014",
    yearStart: 2010,
    yearEnd: 2014,
    label: "电影化",
    tech: "PS4、Xbox One、移动游戏",
    visual: ["电影化", "写实", "开放世界", "独立复兴"],
    cat: "写实猫，第三视角，HUD简洁",
    narration: "电影化运镜与开放世界，猫成了世界的居民。",
    image: "gameCatEra/cat-08.jpg",
    accent: "#4A7DFF",
    accent2: "#FF6B6B",
    bgA: "#050A1C",
    bgB: "#101C3C",
    scanline: 0.25,
    blur: 0.08,
    bloom: 0.4,
    grain: 0.3,
    motionFps: 30,
    mono: false,
    radius: 8,
    metrics: { resolution: 0.65, polys: 0.72, light: 0.68 },
  },
  {
    index: 9,
    years: "2015–2019",
    yearStart: 2015,
    yearEnd: 2019,
    label: "PBR / 4K",
    tech: "PS4 Pro、Switch、4K",
    visual: ["PBR", "4K", "光追早期", "风格化"],
    cat: "高细节猫，光影自然",
    narration: "PBR 材质与 4K：「真实」成了默认设置。",
    image: "gameCatEra/cat-09.jpg",
    accent: "#B388FF",
    accent2: "#FFB86B",
    bgA: "#0B0620",
    bgB: "#241134",
    scanline: 0.18,
    blur: 0.05,
    bloom: 0.45,
    grain: 0.25,
    motionFps: 30,
    mono: false,
    radius: 8,
    metrics: { resolution: 0.8, polys: 0.82, light: 0.8 },
  },
  {
    index: 10,
    years: "2020–2022",
    yearStart: 2020,
    yearEnd: 2022,
    label: "光追",
    tech: "PS5、XSX、虚幻 5",
    visual: ["光追", "SSD", "体积雾", "全局光照"],
    cat: "超写实猫，毛发根根分明",
    narration: "光追、SSD、体积雾。光影不再需要预烘焙。",
    image: "gameCatEra/cat-10.jpg",
    accent: "#00E5FF",
    accent2: "#FF7A45",
    bgA: "#03080F",
    bgB: "#10202E",
    scanline: 0.15,
    blur: 0.03,
    bloom: 0.5,
    grain: 0.2,
    motionFps: 30,
    mono: false,
    radius: 10,
    metrics: { resolution: 0.92, polys: 0.9, light: 0.94 },
  },
  {
    index: 11,
    years: "2023–2026",
    yearStart: 2023,
    yearEnd: 2026,
    label: "神经渲染",
    tech: "路径追踪、AI 渲染、VR / AR",
    visual: ["神经渲染", "全息UI", "云游戏"],
    cat: "电影级猫，AR / VR 沉浸感",
    narration: "路径追踪与神经渲染，把每一根毛都算成了成本。",
    image: "gameCatEra/cat-11.jpg",
    accent: "#FF3DF2",
    accent2: "#22D3EE",
    bgA: "#0A0418",
    bgB: "#160A2E",
    scanline: 0.12,
    blur: 0,
    bloom: 0.55,
    grain: 0.25,
    motionFps: 30,
    mono: false,
    radius: 10,
    metrics: { resolution: 1, polys: 0.97, light: 1 },
  },
];

/**
 * 叙事方向开关：
 *   false = 正序（1970–1974 → 2023–2026），当前采用；
 *   true  = 倒叙（2023–2026 → 1970–1974），时间轴播放头会改回从右往左走。
 */
export const REVERSE: boolean = false;

/** 影片实际出场顺序。 */
export const TIMELINE: Era[] = REVERSE ? [...ERAS].reverse() : [...ERAS];

// ==================== 时长 / 排版常量 ====================

export const FPS = 30;

export const COVER_FRAMES = 210; //  7.0s（要放得下开场配音）
export const ERA_FRAMES = 360; // 12.0s × 12
export const OUTRO_FRAMES = 330; // 11.0s（要放得下结束语配音）
export const TRANSITION_FRAMES = 16;

const SCENE_DURATIONS: number[] = [
  COVER_FRAMES,
  ...TIMELINE.map(() => ERA_FRAMES),
  OUTRO_FRAMES,
];

/** 每个场景（含转场重叠）的起始帧，算法与 TransitionSeries 内部一致。 */
export const SCENE_START: number[] = (() => {
  const out: number[] = [];
  let t = 0;
  for (let i = 0; i < SCENE_DURATIONS.length; i++) {
    out.push(t);
    t += SCENE_DURATIONS[i];
    if (i < SCENE_DURATIONS.length - 1) {
      t -= TRANSITION_FRAMES;
    }
  }
  return out;
})();

/** TransitionSeries 的总时长 = Σ场景 − Σ转场。 */
export const TOTAL_FRAMES: number =
  SCENE_DURATIONS.reduce((a, b) => a + b, 0) -
  TRANSITION_FRAMES * (SCENE_DURATIONS.length - 1);

export const TOTAL_SECONDS: number = TOTAL_FRAMES / FPS;

/** 时间轴进度尺的起止：第一个年代场景开始 → 最后一个年代场景结束。 */
export const PLAY_START: number = SCENE_START[1];
export const PLAY_END: number = SCENE_START[TIMELINE.length] + ERA_FRAMES;

export type SceneInfo =
  | { kind: "cover" }
  | { kind: "era"; era: Era; chapter: number }
  | { kind: "outro" };

export const sceneAt = (frame: number): SceneInfo => {
  const mid = TRANSITION_FRAMES / 2;
  if (frame < SCENE_START[1] + mid) {
    return { kind: "cover" };
  }
  for (let i = 0; i < TIMELINE.length; i++) {
    const isLast = i === TIMELINE.length - 1;
    const end = isLast ? SCENE_START[i + 1] + ERA_FRAMES - mid : SCENE_START[i + 2] + mid;
    if (frame < end) {
      return { kind: "era", era: TIMELINE[i], chapter: i + 1 };
    }
  }
  return { kind: "outro" };
};

// ==================== 小工具 ====================

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** 两位补零（tsconfig 的 lib 是 es2015，没有 padStart） */
export const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** 三位补零 */
export const pad3 = (n: number): string => (n < 10 ? `00${n}` : n < 100 ? `0${n}` : String(n));

/** #RRGGBB → rgba(...) */
export const rgba = (hex: string, alpha: number): string => {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/** 帧 → mm:ss */
export const timecode = (frames: number): string => {
  const total = Math.max(0, Math.round(frames / FPS));
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
};

// ==================== 音频：配音 / 底噪 ====================

/** 年代配音文件（与 cat-NN.jpg 同号，由 scripts/gamecat-audio.py 生成） */
export const voSrc = (era: Era): string => `gameCatEra/vo/cat-${pad2(era.index)}.mp3`;

export const COVER_VO_SRC = "gameCatEra/vo/cover.mp3";
export const OUTRO_VO_SRC = "gameCatEra/vo/outro.mp3";

/** 两条常驻底噪循环素材 */
export const NOISE_CRT_SRC = "gameCatEra/sfx/static-crt.wav";
export const NOISE_AIR_SRC = "gameCatEra/sfx/air.wav";

/**
 * 当前帧的底噪强度 0–1。
 * 刻意复用扫描线强度：越老的 CRT 年代电子底噪越明显，现代场景只剩一丝房间底噪。
 * 换台时在转场窗口内线性过渡，避免音量突跳。
 */
export const noiseAt = (frame: number): number => {
  const mid = TRANSITION_FRAMES / 2;

  let idx: number;
  if (frame < SCENE_START[1] + mid) {
    idx = -1; // 封面
  } else {
    idx = TIMELINE.length; // 落到片尾
    for (let i = 0; i < TIMELINE.length; i++) {
      const isLast = i === TIMELINE.length - 1;
      const end = isLast ? SCENE_START[i + 1] + ERA_FRAMES - mid : SCENE_START[i + 2] + mid;
      if (frame < end) {
        idx = i;
        break;
      }
    }
  }

  const at = (i: number): number => {
    if (i < 0) return TIMELINE[0].scanline;
    if (i >= TIMELINE.length) return TIMELINE[TIMELINE.length - 1].scanline;
    return TIMELINE[i].scanline;
  };

  const boundary =
    idx < 0 ? SCENE_START[1] + mid : idx >= TIMELINE.length ? TOTAL_FRAMES : SCENE_START[idx + 2] + mid;
  const w = clamp01((frame - (boundary - TRANSITION_FRAMES)) / TRANSITION_FRAMES);
  const cur = at(idx);
  return cur + (at(idx + 1) - cur) * w;
};
