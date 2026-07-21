# FrontendIsms — 50种前端设计主义视频

## 概述

纯视觉展示视频，逐一呈现50种前端设计风格。竖版1080×1920，30fps，纯BGM驱动无TTS配音，5秒/风格 = ~250秒总时长（~7500帧 + 片头片尾）。

## 参考来源

- 设计资料：`C:\Users\Rao\Desktop\学习\前端设计\desgin\`
- BGM：SimpsonWave1995 辛普森浪潮1995（合成器波/复古未来，与vaporwave/retro-future风格契合）

## 架构

### 文件

```
src/FrontendIsms/index.tsx      ← 主组件
src/FrontendIsms/styles.ts      ← 50种风格数据
public/frontend-isms/bgm.m4a    ← BGM（复制自下载目录）
src/Root.tsx                    ← +1 composition注册
```

### 单组件设计

一个 `FrontendIsms` 组件，`useCurrentFrame` 按时间切风格，无 `TransitionSeries` — 直接 `interpolate` 控制 opacity 淡入淡出。

## 卡片布局（1080×1920）

- 序号徽章（#01/50）
- 中文名（大字，该风格标题字体）
- 英文名
- 色板（3-5个颜色方块）
- 特征标签行（3-4个关键词，如"粗黑边框 · 点阵背景 · DM Mono"）
- 一条风格装饰线（该风格的边框样式）
- 一行简介

卡片背景、边框、阴影、圆角、字体全面反映该风格的特征。

## 时序

- 片头：150帧（5秒）
- 每风格：150帧（5秒），前15帧淡入 + 后15帧淡出
- 片尾：150帧（5秒，无音频消隐）
- 总帧数：150 + 50×150 + 150 = 7800帧（约260秒）

## 数据模型

```typescript
interface StyleData {
  id: number;
  nameCN: string;
  nameEN: string;
  bgColor: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  palette: string[];        // 3-5 hex colors
  fontFamily: string;       // 'Inter' | 'DM Mono' | 'Georgia' | 'Press Start 2P' | 'Noto Sans SC'
  borderStyle: string;      // CSS border shorthand
  borderRadius: number;
  boxShadow: string;
  tags: string[];           // 3-4 keywords
  description: string;      // 一行简介
}
```

## 技术要点

- Audio组件播放BGM，`staticFile("frontend-isms/bgm.m4a")`
- 不依赖TransitionSeries，纯opacity过渡
- 共享组件复用 `FadeIn`、`AbsoluteFill`
- 字体需在全局CSS声明（Inter、DM Mono、Georgia、Press Start 2P、Noto Sans SC）
