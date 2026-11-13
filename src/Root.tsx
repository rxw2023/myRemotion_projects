import "./index.css";
import { Composition } from "remotion";
import React from "react";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/components/Logo";
import { StorageKnowledge } from "./StorageKnowledge";
import { ComputerStructure } from "./ComputerStructure";
import { ComputerStructureCover } from "./ComputerStructure/Cover";
import { PerformanceMetrics, TOTAL_FRAMES as PerformanceMetricsFrames } from "./PerformanceMetrics";
import { ErisPet } from "./ErisPet";
import { MemoryOrganization } from "./MemoryOrganization";
import { ExternalStorage } from "./ExternalStorage";
import { FrontendIsms, TOTAL_FRAMES as FrontendIsmsFrames } from "./FrontendIsms";
import DualVectorFoil, { TOTAL_FRAMES as DualVectorFoilFrames } from "./DualVectorFoil";
import { CachePrinciple, TOTAL_FRAMES as CachePrincipleFrames } from "./CachePrinciple";
import { GameCatEra, GameCatEraFrames } from "./GameCatEra";
import {
  ItomoriNight,
  TOTAL_FRAMES as ItomoriNightFrames,
} from "./ItomoriNight";
import {
  IntegerFloatRepr,
  TOTAL_FRAMES as IntegerFloatReprFrames,
} from "./IntegerFloatRepr";
import {
  ArithConvert,
  TOTAL_FRAMES as ArithConvertFrames,
} from "./ArithConvert";
import { TCPBasics, TOTAL_FRAMES as TCPBasicsFrames } from "./TCPBasics";
import {
  VirtualMemory,
  TOTAL_FRAMES as VirtualMemoryFrames,
} from "./VirtualMemory";
import {
  InstructionFormat,
  TOTAL_FRAMES as InstructionFormatFrames,
} from "./InstructionFormat";
import { DataAlignment, TOTAL_FRAMES as DataAlignmentFrames } from "./DataAlignment";
import { CiscRisc, TOTAL_FRAMES as CiscRiscFrames } from "./CiscRisc";
import { UdpBasics, TOTAL_FRAMES as UdpBasicsFrames } from "./UdpBasics";
import { EternalSignalManga } from "./EternalSignal/manga";
import { EternalSignalCover } from "./EternalSignal/cover";
import { TOTAL_FRAMES as EternalSignalFrames } from "./EternalSignal/timeline";

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
    id: "ComputerStructure",
    component: ComputerStructure,
    durationInFrames: 3164,
    orientation: "portrait",
    category: "video",
    description: "计算机系统层次结构",
  },
  {
    // 静态封面，出 PNG：npx remotion still ComputerStructureCover out/computer-structure-cover.png
    id: "ComputerStructureCover",
    component: ComputerStructureCover,
    durationInFrames: 1,
    orientation: "portrait",
    category: "demo",
    description: "《计算机系统层次结构》视频封面 1080×1920（still 出图）",
  },
  {
    // 横版封面：npx remotion still ComputerStructureCoverWide out/computer-structure-cover-wide.png
    id: "ComputerStructureCoverWide",
    component: ComputerStructureCover,
    durationInFrames: 1,
    orientation: "landscape",
    category: "demo",
    description: "《计算机系统层次结构》视频封面 1920×1080（still 出图）",
  },
  {
    id: "PerformanceMetrics",
    component: PerformanceMetrics,
    durationInFrames: PerformanceMetricsFrames,
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
  {
    id: "IntegerFloatRepr",
    component: IntegerFloatRepr,
    durationInFrames: IntegerFloatReprFrames,
    orientation: "portrait",
    category: "video",
    description:
      "数据的表示 — 整数（无符号数/补码/原码/移码）与 IEEE 754 浮点数（三段结构、手算 2.25、异常值、精度误差、加减四步）",
  },
  {
    id: "ArithConvert",
    component: ArithConvert,
    durationInFrames: ArithConvertFrames,
    orientation: "portrait",
    category: "video",
    description:
      "数据的表示 · 第二期 — 运算电路（半加器/全加器/行波进位/标志位/减法/乘法/除法）与类型转换（位模式不变、长度扩展截断、整型浮点、隐式显式）",
  },
  {
    id: "TCPBasics",
    component: TCPBasics,
    durationInFrames: TCPBasicsFrames,
    orientation: "portrait",
    category: "video",
    description:
      "TCP 可靠传输 — 四条规矩、首部与标志位、三次握手、四次挥手与 2MSL、滑动窗口与序列号回绕、三个窗口、累计确认、超时重传与 RTO、校验和、慢开始/拥塞避免/超时归零/快速重传与快速恢复",
  },

  {
    id: "UdpBasics",
    component: UdpBasics,
    durationInFrames: UdpBasicsFrames,
    orientation: "landscape",
    category: "video",
    description:
      "UDP（横版 1920×1080 · 3Blue1Brown 风格）— 8 字节首部四字段、分用与 ICMP 端口不可达、伪首部 12 字节、发送端四步与进位回卷、完整算例 43E1/BC1E、接收端验证与全 0 全 1 约定、五个特点、四类应用场景、考点表",
  },

  // ---- 横版视频 ----
  {
    id: "VirtualMemory",
    component: VirtualMemory,
    durationInFrames: VirtualMemoryFrames,
    orientation: "landscape",
    category: "video",
    description:
      "虚拟存储器（横版 1920×1080）— 物理/虚拟内存、页式划分、地址结构、MMU 分工、单级与多级页表、PTBR、TLB、缺页中断、请求页式、页面置换、完整访存流程与访存次数、综合例题",
  },
  {
    id: "InstructionFormat",
    component: InstructionFormat,
    durationInFrames: InstructionFormatFrames,
    orientation: "landscape",
    category: "video",
    description:
      "指令格式与寻址方式（横版 1920×1080 · 3Blue1Brown 风格）— 操作码/地址码、按操作码与地址数分类、定长变长、无效字段填充与指令前缀、扩展操作码 16 位真题、前缀编码与 VLSM、八种寻址方式与访存次数",
  },
  {
    id: "DataAlignment",
    component: DataAlignment,
    durationInFrames: DataAlignmentFrames,
    orientation: "landscape",
    category: "video",
    description:
      "数据对齐与结构体填充（横版 1920×1080 · 3Blue1Brown 风格，接《指令格式与寻址方式》）— 对齐因子与二进制视角、类型对齐因子表、不对齐的两次访存、地址译码、结构体 padding 逐字节铺开、成员不可重排、末尾整体补齐、两条规则与成员排序优化",
  },
  {
    id: "CiscRisc",
    component: CiscRisc,
    durationInFrames: CiscRiscFrames,
    orientation: "landscape",
    category: "video",
    description:
      "指令系统 · ISA 与 CISC/RISC（横版 1920×1080 · 3Blue1Brown 风格，接《数据对齐与结构体填充》）— ISA 是软硬件契约、七项内容、规定做什么不规定怎么做、一条 x86 对八条 MIPS、CISC 五特征与变长指令、RISC 五特征与寄存器阵列、有效地址拆解、定长与流水线、七行对照表",
  },
  {
    id: "DualVectorFoil",
    component: DualVectorFoil,
    durationInFrames: DualVectorFoilFrames,
    orientation: "landscape",
    category: "video",
    description: "二向箔 · 太阳系二维化 — 三体系列名场面，3D可视化重现",
  },

  // ---- 漫画版（唯一版本，电台体旧版已归档至 src/EternalSignal/legacy-radio）----
  {
    id: "EternalSignal",
    component: EternalSignalManga,
    durationInFrames: EternalSignalFrames,
    orientation: "landscape",
    category: "video",
    description:
      "永不消逝的电波 · 漫画版 — 51 张生成分镜 / 黑白网点 / 只出现剪影与背影 / 10 幕 92 行台词 / 7:54",
  },

  // ---- 封面（静态帧，still 出图）----
  {
    // npx remotion still EternalSignalCover out/cover-wide.png
    id: "EternalSignalCover",
    component: EternalSignalCover,
    durationInFrames: 1,
    orientation: "landscape",
    category: "demo",
    description: "《永不消逝的电波》封面 1920×1080（still 出图）",
  },
  {
    // npx remotion still EternalSignalCoverTall out/cover-tall.png
    id: "EternalSignalCoverTall",
    component: EternalSignalCover,
    durationInFrames: 1,
    orientation: "portrait",
    category: "demo",
    description: "《永不消逝的电波》封面 1080×1920（still 出图）",
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


  // ---- 横版纪录片：正序 ----
  {
    id: "GameCatEra",
    component: GameCatEra,
    durationInFrames: GameCatEraFrames,
    orientation: "landscape",
    category: "video",
    description: "像素到光子 — 一只橘猫的游戏图像史，正序：从 1970–1974 的黑白方块讲到 2023–2026 的神经渲染，含配音与底噪",
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
