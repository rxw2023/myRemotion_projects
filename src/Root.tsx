import "./index.css";
import { Composition } from "remotion";
import React from "react";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/components/Logo";
import { GPTEvolution } from "./GPTEvolution";
import { StorageKnowledge } from "./StorageKnowledge";
import { ComputerStructure } from "./ComputerStructure";
import { Liangzhu } from "./Liangzhu";
import { AITextGen } from "./AITextGen";
import { OpenClaw } from "./OpenClaw";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { ErisPet } from "./ErisPet";
import { ClaudeModels } from "./ClaudeModels";
import { FuckUCode } from "./FuckUCode";
import { MemoryOrganization } from "./MemoryOrganization";
import { ExternalStorage } from "./ExternalStorage";
import { GitHubPRWorkflow } from "./GitHubPRWorkflow";
import { FrontendIsms, TOTAL_FRAMES as FrontendIsmsFrames } from "./FrontendIsms";
import DualVectorFoil, { TOTAL_FRAMES as DualVectorFoilFrames } from "./DualVectorFoil";
import { CachePrinciple, TOTAL_FRAMES as CachePrincipleFrames } from "./CachePrinciple";
import { DeepSeekMoment, TOTAL_FRAMES as DeepSeekMomentFrames } from "./DeepSeekMoment";
import { GameCatEra, GameCatEraFrames } from "./GameCatEra";
import {
  ItomoriNight,
  TOTAL_FRAMES as ItomoriNightFrames,
} from "./ItomoriNight";
import { ChannelIntro } from "./ChannelIntro";
import { TOTAL_FRAMES as ChannelIntroFrames } from "./ChannelIntro/tokens";
import { StyleSample, STYLE_KEYS, STYLE_META, STYLE_SAMPLE_FRAMES } from "./ChannelIntroStyles";
import { PixelIntro, pixelIntroSchema } from "./PixelIntro";

// ==================== 配置类型 ====================

type Orientation = "portrait" | "landscape";
type Category = "demo" | "video";

interface CompConfig {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<any>;
  durationInFrames: number;
  orientation: Orientation;
  category: Category;
  description: string;
  /** Override default fps (30) */
  fps?: number;
  /** Zod schema for props validation */
  schema?: unknown;
  defaultProps?: Record<string, unknown>;
}

// ==================== 默认值 ====================

const DEFAULT_FPS = 30;
const RESOLUTION: Record<Orientation, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
};

// ==================== 注册表 ====================

const compositions: CompConfig[] = [
  // ---- 频道片头 · 像素游戏版（当前在用，10 秒，两种画幅同源，内容层可切换） ----
  {
    id: "PixelIntro",
    component: PixelIntro,
    durationInFrames: ChannelIntroFrames,
    orientation: "portrait",
    category: "video",
    description: "MRDave先生 · 频道片头【像素游戏】竖版 — 开机自检 → 溶解 → 逐块显影，10.000s 整",
    schema: pixelIntroSchema,
    defaultProps: { pack: "arcade" },
  },
  {
    id: "PixelIntroWide",
    component: PixelIntro,
    durationInFrames: ChannelIntroFrames,
    orientation: "landscape",
    category: "video",
    description: "MRDave先生 · 频道片头【像素游戏】横版 — 开机自检 → 溶解 → 逐块显影，10.000s 整",
    schema: pixelIntroSchema,
    defaultProps: { pack: "arcade" },
  },

  // ---- 频道片头 · 丝网印刷版（原版，10 秒，两种画幅同源） ----
  {
    id: "ChannelIntro",
    component: ChannelIntro,
    durationInFrames: ChannelIntroFrames,
    orientation: "portrait",
    category: "video",
    description: "MRDave先生 · 频道片头（竖版）— 终端初始化 → 二向箔显影，10.000s 整",
  },
  {
    id: "ChannelIntroWide",
    component: ChannelIntro,
    durationInFrames: ChannelIntroFrames,
    orientation: "landscape",
    category: "video",
    description: "MRDave先生 · 频道片头（横版）— 终端初始化 → 二向箔显影，10.000s 整",
  },

  // ---- 片头风格候选样张（静态帧，只为出图比较，不做动画） ----
  ...STYLE_KEYS.map((k) => ({
    id: `StyleSample-${k}`,
    component: StyleSample,
    durationInFrames: STYLE_SAMPLE_FRAMES,
    orientation: "portrait" as Orientation,
    category: "demo" as Category,
    description: `片头风格样张 ${STYLE_META[k].no} · ${STYLE_META[k].name}（${STYLE_META[k].en}）— ${STYLE_META[k].feel}`,
    defaultProps: { style: k },
  })),

  // ---- 竖版科普视频 ----
  {
    id: "GPTEvolution",
    component: GPTEvolution,
    durationInFrames: 630,
    orientation: "portrait",
    category: "video",
    description: "GPT进化史科普视频",
  },
  {
    id: "StorageKnowledge",
    component: StorageKnowledge,
    durationInFrames: 2895,
    orientation: "portrait",
    category: "video",
    description: "存储系统原理",
  },
  {
    id: "MemoryOrganization",
    component: MemoryOrganization,
    durationInFrames: 3330,
    orientation: "portrait",
    category: "video",
    description: "内存工作原理 — DRAM芯片、多体交叉存储、容量扩展",
  },
  {
    id: "ExternalStorage",
    component: ExternalStorage,
    durationInFrames: 5616,
    orientation: "portrait",
    category: "video",
    description: "外部存储科普 — 机械硬盘CHS寻址、RAID、SSD对比",
  },
  {
    id: "GitHubPRWorkflow",
    component: GitHubPRWorkflow,
    durationInFrames: 4198,
    orientation: "portrait",
    category: "video",
    description: "GitHub PR 工作流科普 — Fork到Merge的正确姿势 vs 常见错误",
  },
  {
    id: "ComputerStructure",
    component: ComputerStructure,
    durationInFrames: 3164,
    orientation: "portrait",
    category: "video",
    description: "计算机系统层次结构",
  },
  {
    id: "Liangzhu",
    component: Liangzhu,
    durationInFrames: 2899,
    orientation: "portrait",
    category: "video",
    description: "良渚探秘",
  },
  {
    id: "PerformanceMetrics",
    component: PerformanceMetrics,
    durationInFrames: 3936,
    orientation: "portrait",
    category: "video",
    description: "计算机性能指标科普",
  },
  {
    id: "ErisPet",
    component: ErisPet,
    durationInFrames: 420,
    orientation: "portrait",
    category: "video",
    description: "桌宠口腔可爱动画",
  },
  {
    id: "OpenClaw",
    component: OpenClaw,
    durationInFrames: 3281,
    orientation: "portrait",
    category: "video",
    description: "开源AI智能体框架介绍",
  },
  {
    id: "FuckUCode",
    component: FuckUCode,
    durationInFrames: 4631,
    orientation: "portrait",
    category: "video",
    description: "fuck-u-code 代码质量分析工具介绍",
  },
  {
    id: "FrontendIsms",
    component: FrontendIsms,
    durationInFrames: FrontendIsmsFrames,
    orientation: "portrait",
    category: "video",
    description: "50种前端设计主义全展示 — 从新粗野主义到复古胶片",
  },
  {
    id: "CachePrinciple",
    component: CachePrinciple,
    durationInFrames: CachePrincipleFrames,
    orientation: "portrait",
    category: "video",
    description: "Cache缓存科普（新粗野主义）— 局部性原理、映射方式、地址结构、替换算法、写策略",
  },

  // ---- 横版视频 ----
  {
    id: "DualVectorFoil",
    component: DualVectorFoil,
    durationInFrames: DualVectorFoilFrames,
    orientation: "landscape",
    category: "video",
    description: "二向箔 · 太阳系二维化 — 三体系列名场面，3D可视化重现",
  },
  {
    id: "AITextGen",
    component: AITextGen,
    durationInFrames: 10625,
    orientation: "landscape",
    category: "video",
    description: "AI生成文本教学演示",
  },

  // ---- 横版视频：三维微缩景观 ----
  {
    id: "ItomoriNight",
    component: ItomoriNight,
    durationInFrames: ItomoriNightFrames,
    orientation: "landscape",
    category: "video",
    description:
      "系守湖四季 · 微缩模型 — 三渲二日式动画夜景空镜，环形山峦环抱一片正圆陨石湖，御神体山丘、鸟居岩腔与湖畔小镇，春樱夏萤秋叶冬雪各环绕一周",
  },

  // ---- 横版视频：Vox 风格纪录片 ----
  {
    id: "DeepSeekMoment",
    component: DeepSeekMoment,
    durationInFrames: DeepSeekMomentFrames,
    orientation: "landscape",
    category: "video",
    description: "DeepSeek 时刻 — Vox 风格纪录片：一家量化基金孵化的小团队，如何用一个开源模型让万亿算力叙事重算账",
  },

  // ---- 横版纪录片：正序 ----
  {
    id: "GameCatEra",
    component: GameCatEra,
    durationInFrames: GameCatEraFrames,
    orientation: "landscape",
    category: "video",
    description: "像素到光子 — 一只橘猫的游戏图像史，正序：从 1970–1974 的黑白方块讲到 2023–2026 的神经渲染，含配音与底噪",
  },

  // ---- 横版播客 ----
  {
    id: "ClaudeModels",
    component: ClaudeModels,
    durationInFrames: 6100, // ~203s @30fps (8 scenes + quick transitions)
    orientation: "landscape",
    category: "video",
    description: "Claude Fable 5 深度介绍 — 神话降临",
  },

  // ---- 示例/模板 ----
  {
    id: "HelloWorld",
    component: HelloWorld,
    durationInFrames: 150,
    orientation: "landscape",
    category: "demo",
    description: "Remotion 入门模板",
    schema: myCompSchema,
    defaultProps: {
      titleText: "Welcome to Remotion",
      titleColor: "#000000",
      logoColor1: "#91EAE4",
      logoColor2: "#86A8E7",
    },
  },
  {
    id: "OnlyLogo",
    component: Logo,
    durationInFrames: 150,
    orientation: "landscape",
    category: "demo",
    description: "单独 Logo 组件预览",
    schema: myCompSchema2,
    defaultProps: {
      logoColor1: "#91dAE2",
      logoColor2: "#86A8E7",
    },
  },
];

// ==================== 根组件 ====================

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {compositions.map((c) => {
        const { width, height } = RESOLUTION[c.orientation];
        return (
          <Composition
            key={c.id}
            id={c.id}
            component={c.component}
            durationInFrames={c.durationInFrames}
            fps={c.fps ?? DEFAULT_FPS}
            width={width}
            height={height}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            schema={c.schema as any}
            defaultProps={c.defaultProps}
          />
        );
      })}
    </>
  );
};
