# My Video — Remotion 视频项目

基于 [Remotion](https://remotion.dev) 的编程式视频合集，React + TypeScript。

## 快速开始

```bash
pnpm install          # 安装依赖
pnpm run dev          # 启动 Remotion Studio → http://localhost:3000
pnpm run lint         # ESLint + TypeScript 检查
pnpm run build        # 打包项目
```

## 渲染视频

```bash
# 单个渲染
npx remotion render <composition-id> out/<name>.mp4

# 示例
npx remotion render FrontendIsms out/frontend-isms.mp4
```

Composition ID 列表见 `pnpm run dev` 左侧面板，或查看 `src/Root.tsx` 中的 `compositions` 数组。

## 新增视频

1. 创建 `src/YourVideo/index.tsx`，导出 `React.FC`
2. 在 `src/Root.tsx` 的 `compositions` 数组加一条配置
3. 静态资源放入 `public/your-video/`
4. 用 `staticFile("your-video/asset.ext")` 引用资源

```typescript
// Root.tsx 配置示例
{
  id: "MyVideo",
  component: MyVideo,
  durationInFrames: 1500,
  orientation: "portrait",  // "portrait" | "landscape"
  category: "video",
  description: "...",
}
```

`orientation` 自动决定分辨率（portrait = 1080×1920, landscape = 1920×1080），默认 30fps。

## TTS 音频

音频使用 edge-tts 生成，需要 Python 3.8+：

```bash
pip install edge-tts mutagen

# 生成所有 TTS
python -X utf8 scripts/*/generate*.py
```

## 共享组件

`src/shared/components/index.tsx`：
- **FadeIn** — 淡入 + 上滑
- **SlideUp** — 上滑入场
- **WhiteCard** — 标准卡片容器
- **SubtitleBar** — 底部字幕条
- **SHARED_COLORS** — 通用调色板

## 技术栈

Remotion · React 19 · TypeScript · TailwindCSS 4 · Zod · pnpm
