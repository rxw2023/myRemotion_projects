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

`public/**/*.mp3` 已在 `.gitignore` 里忽略，所以 clone 后要先生成音频再渲染，否则 `staticFile()` 找不到文件。以《像素到光子》（`GameCatEra`）为例：

```bash
python -X utf8 scripts/gamecat-audio.py              # 旁白 + 底噪，一次生成
python -X utf8 scripts/gamecat-audio.py --only-voice # 只重新生成旁白
python -X utf8 scripts/gamecat-audio.py --only-noise # 只重新生成底噪
```

脚本会从 `src/GameCatEra/data.ts` 里按顺序抓取 12 条 `narration` 作为旁白文本，改字幕文案后重跑即可保持配音同步。BGM 同样不入库，自己放一首到 `public/gameCatEra/bgm.mp3` 就能带上。

## 频道片头（ChannelIntro）

10 秒频道片头。竖版 `ChannelIntro` / 横版 `ChannelIntroWide`，两版共用同一套代码，只换锚点。

```bash
# 渲染 MP4 前必须先把 TEMP 指到工作区内
# （沙箱里的 ffmpeg 写不进系统 %TEMP%，否则报 Permission denied）
$env:TEMP = Join-Path (Get-Location) ".tmp"; $env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npx remotion render ChannelIntro     out/mrdave-intro-10s.mp4      --browser-executable="$chrome"
npx remotion render ChannelIntroWide out/mrdave-intro-10s-wide.mp4 --browser-executable="$chrome"

# 不装 ffprobe，直接读 ISO-BMFF 盒子验收时长 / 分辨率 / 音轨
node scripts/channel-intro/verify_mp4.mjs out/mrdave-intro-10s.mp4
```

音床 `public/channel/intro-10s.wav` 已入库（纯 numpy 合成，不依赖 TTS），改音效后重跑 `python -X utf8 scripts/channel-intro/generate_intro_sfx.py`。头像与色板全部取自频道真实数据，完整设计说明见 [`docs/CHANNEL_INTRO.md`](docs/CHANNEL_INTRO.md)。

## 共享组件

`src/shared/components/index.tsx`：
- **FadeIn** — 淡入 + 上滑
- **SlideUp** — 上滑入场
- **WhiteCard** — 标准卡片容器
- **SubtitleBar** — 底部字幕条
- **SHARED_COLORS** — 通用调色板

## 技术栈

Remotion · React 19 · TypeScript · TailwindCSS 4 · Zod · pnpm
