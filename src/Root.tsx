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

  // ---- 横版视频 ----
  {
    id: "AITextGen",
    component: AITextGen,
    durationInFrames: 10625,
    orientation: "landscape",
    category: "video",
    description: "AI生成文本教学演示",
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
