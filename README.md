# My Video — Remotion 视频项目

基于 [Remotion](https://remotion.dev) 的多主题科普视频合集，使用 React + TypeScript 编程式生成动画视频。

## 视频列表

| 视频 | 分辨率 | 时长 | 说明 |
|------|--------|------|------|
| **fuck-u-code** | 竖屏 1080×1920 | ~155s | 代码质量分析工具 · 屎山检测器 |
| **Claude Fable 5** | 横版 1920×1080 | ~203s | Fable 5 深度介绍 · 神话降临 |
| GPT进化史 | 竖屏 1080×1920 | ~21s | GPT-1 到 GPT-3 发展历程 |
| 存储系统原理 | 竖屏 | ~96s | 寄存器到磁盘的存储层次 |
| 计算机层次结构 | 竖屏 | ~105s | 冯诺依曼·硬件软件·编译流程 |
| 良渚探秘 | 竖屏 | ~96s | 良渚文化遗址科普 |
| AI文本生成 | 横版 1920×1080 | ~354s | KIMI 制作宣传单教学 |
| 性能指标 | 竖屏 | ~131s | CPI/FLOPS/字长 考研考点 |
| OpenClaw | 竖屏 | ~109s | 开源 AI 智能体框架介绍 |
| ErisPet | 竖屏 | ~14s | 桌宠动画 |

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 核心框架 | Remotion | 4.0.425 |
| UI | React | 19.2.3 |
| 语言 | TypeScript | 5.9.3 |
| 样式 | TailwindCSS | 4.0.0 |
| 校验 | Zod | 3.22.3 |
| 包管理器 | pnpm | — |

关键依赖：`@remotion/media`（音频）、`@remotion/transitions`（转场）、`@remotion/gif`（GIF 播放）

## 快速开始

```bash
pnpm install
pnpm run dev        # 启动 Remotion Studio
pnpm run lint       # ESLint + TypeScript 检查
```

## 渲染视频

```bash
npx remotion render ClaudeModels out/claude-fable5.mp4
npx remotion render GPTEvolution out/GPTEvolution.mp4
```

## 项目结构

```
src/
├── index.ts                     # 入口，注册 RemotionRoot
├── Root.tsx                     # Composition 注册表（配置数组驱动）
├── index.css                    # 全局样式
├── shared/components/index.tsx  # FadeIn, SlideUp, WhiteCard, SubtitleBar, SHARED_COLORS
├── FuckUCode/                    # fuck-u-code 代码质量工具（竖屏）
├── ClaudeModels/                # Claude Fable 5 深度介绍（横版播客）
├── GPTEvolution/                # GPT 进化史（竖屏）
├── StorageKnowledge/            # 存储系统原理（竖屏）
├── ComputerStructure/           # 计算机层次结构（竖屏）
├── Liangzhu/                    # 良渚探秘（竖屏）
├── AITextGen/                   # AI 文本生成教学（横版）
├── PerformanceMetrics/          # 性能指标科普（竖屏）
├── OpenClaw/                    # AI 智能体框架（竖屏）
├── ErisPet/                     # 桌宠动画（竖屏）
└── HelloWorld/                  # Remotion 入门模板

public/                          # 静态资源，按项目分目录
├── shared/                      # 共享：bgm.mp3, bgm-storage.mp3
├── claude-models/               # ClaudeModels 音频 + img/
├── ai-text-gen/                 # AITextGen 语音
├── liangzhu/                    # Liangzhu 语音 + images/
├── fuckucode/                   # FuckUCode 语音
├── openclaw/                    # OpenClaw 语音
├── computer-structure/          # ComputerStructure 语音
├── performance-metrics/         # PerformanceMetrics 语音
├── storage-knowledge/           # StorageKnowledge 语音
└── eris-pet/                    # ErisPet GIF

scripts/                         # TTS 生成脚本，按项目分目录
├── claude-models/generate_tts.py
├── ai-text-gen/gen_aitext_tts.py
├── liangzhu/generate_lzh_tts.py
├── openclaw/generate_openclaw_tts.py
├── fuckucode/generate_fuckucode_tts.py
├── structure/generate_tts_structure.py
├── performance/generate_tts_performance.py
└── storage-knowledge/generate_tts.py
```

## 全部 Composition

| ID | 分辨率 | 帧数 | 时长 | 说明 |
|----|--------|------|------|------|
| FuckUCode | 1080×1920 | 4631 | ~155s | fuck-u-code 代码质量工具 |
| ClaudeModels | 1920×1080 | 6100 | ~203s | Claude Fable 5 深度介绍 |
| GPTEvolution | 1080×1920 | 630 | ~21s | GPT 进化史 |
| StorageKnowledge | 1080×1920 | 2895 | ~96.5s | 存储系统原理 |
| ComputerStructure | 1080×1920 | 3164 | ~105.5s | 计算机层次结构 |
| Liangzhu | 1080×1920 | 2899 | ~96.6s | 良渚文化探秘 |
| AITextGen | 1920×1080 | 10625 | ~354s | AI 文本生成教学 |
| PerformanceMetrics | 1080×1920 | 3936 | ~131s | 计算机性能指标 |
| OpenClaw | 1080×1920 | 3281 | ~109.4s | AI 智能体框架 |
| ErisPet | 1080×1920 | 420 | ~14s | 桌宠动画 |
| HelloWorld | 1920×1080 | 150 | ~5s | Remotion 模板 |
| OnlyLogo | 1920×1080 | 150 | ~5s | Logo 预览 |

全部使用 **30fps**。竖版 1080×1920，横版 1920×1080。

## Root.tsx 架构

配置数组驱动，新增视频只需加一条配置：

```typescript
{
  id: "MyNewVideo",
  component: MyNewVideo,
  durationInFrames: 1500,
  orientation: "portrait",  // or "landscape"
  category: "video",
  description: "我的新视频",
}
```

`orientation` 自动决定分辨率，`fps` 默认 30。

## 共享组件

`src/shared/components/index.tsx` 提供所有子项目复用：
- **FadeIn** — 淡入 + 上滑动画
- **SlideUp** — 上滑入场
- **WhiteCard** — 标准卡片容器
- **SubtitleBar** — 底部字幕条（传 `text` + `startFrame`/`endFrame`）
- **SHARED_COLORS** — 通用调色板

## 新增视频流程

1. 创建 `src/YourVideo/index.tsx`，导出 `React.FC`
2. 在 `src/Root.tsx` 的 `compositions` 数组加一行配置
3. 静态资源放入 `public/your-video/`
4. 用 `staticFile("your-video/asset.ext")` 引用资源

## 代码规范

- ESLint: `@remotion/eslint-config-flat`
- Prettier: 2 空格缩进
- TypeScript: ES2018 target, CommonJS, strict mode, `noUnusedLocals: true`
