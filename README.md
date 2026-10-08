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

## 频道片头

10 秒频道片头，做过两版，**共用同一条 120BPM 时间轴（`src/ChannelIntro/tokens.ts` 的 `T`）和同一份音床**（`public/channel/intro-10s.wav`），只是"每个时刻怎么演"不同。**当前在用像素游戏版，第一版丝网印刷作为「原版」保留。**

| 状态 | 风格 | 竖版 / 横版 | 代码 | 成片 | 设计文档 |
| --- | --- | --- | --- | --- | --- |
| **当前在用** | **像素游戏** | `PixelIntro` / `PixelIntroWide` | `src/PixelIntro/` | `out/mrdave-pixel-intro.mp4` / `-wide.mp4` | — |
| 原版（保留） | 丝网印刷 | `ChannelIntro` / `ChannelIntroWide` | `src/ChannelIntro/` | `out/mrdave-intro-10s.mp4` / `-wide.mp4` | [`docs/CHANNEL_INTRO.md`](docs/CHANNEL_INTRO.md) |

两版的时间轴与音床是同一份，所以**换风格只改"每个时刻怎么演"，不用重做声音**。

> 中间还做过一版**工程蓝图**（图纸自绘 → 线框球 → 二向箔压平），已按用户要求**完全删除**：源码、设计稿、composition 注册都不在了。
> 想回看那种视觉语言，只剩 12 风格候选样张里的 `StyleSample-blueprint`（静态一格，见下）。

**像素游戏版的内容层是可切换的**：`PixelIntro` 带一个 zod `schema` + `defaultProps`，在 Remotion Studio 的 props 面板里改 `pack` 就能换：

| `pack` | 内容 |
| --- | --- |
| `arcade`（默认） | 完整街机 HUD：`1UP 分数` / 金币 / 命 + `* ACHIEVEMENT *` 成就条 |
| `console` | 家用机味：无 HUD，`PUSH START`，页脚多一行 `LICENSED BY BILIBILI` |
| `clean` | 只有 `LOADING` → 地球 → 字标 + 「先生」+ 页脚 |

三包都只用**游戏机的通用界面词汇**，不含"这一期讲什么"，也不含 UID。

像素中文（「先生」「知识科普向」）是**预生成的点阵遮罩**，由 `scripts/channel-intro/make_pixel_text.py` 产出（`public/channel/px-name.png` / `px-sign.png`）——CSS 的 `image-rendering: pixelated` 只对位图生效，矢量字放大依然是平滑的。同一脚本还会写一张 `out/pixel-text-preview.png` 深底放大图供人眼复核。

另有 **12 种风格的静态候选样张**（见 `src/ChannelIntroStyles/`）。十二张画的是同一件事、同一组内容（`SAMPLE`：EP.07 / 缓存原理 / 副题 / 时长），只有视觉语言不同 —— 所以"哪种风格排得出正文、哪种适合这个频道"是可比的。

| 编号 | 风格 | composition | 编号 | 风格 | composition |
| --- | --- | --- | --- | --- | --- |
| 01 | 瑞士网格 | `StyleSample-swiss` | 07 | 霓虹夜市 | `StyleSample-neon` |
| 02 | 磷光终端 | `StyleSample-crt` | 08 | 复古未来 | `StyleSample-retrofuture` |
| 03 | 工程蓝图 | `StyleSample-blueprint` | 09 | 像素游戏 | `StyleSample-pixel` |
| 04 | 孟菲斯波普 | `StyleSample-memphis` | 10 | 蒸汽波 | `StyleSample-vaporwave` |
| 05 | 杂志封面 | `StyleSample-editorial` | 11 | 水墨宣纸 | `StyleSample-ink` |
| 06 | 手绘白板 | `StyleSample-whiteboard` | 12 | 漫画分格 | `StyleSample-comic` |

出图例（3 步，约 3 分钟）：

```bash
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
foreach ($k in "swiss","crt","blueprint","memphis","editorial","whiteboard",
               "neon","retrofuture","pixel","vaporwave","ink","comic") {
  npx remotion still "StyleSample-$k" "out/style-samples/$k.png" --frame=12 --browser-executable="$chrome"
}
python -X utf8 scripts/channel-intro/styles_sheet.py   # → out/channel-intro-style-options.png
```

`public/channel/globe-px32.png` / `globe-px64.png` 由 `scripts/channel-intro/make_globe_pixel.py` 预生成（像素风不能靠 CSS 的 `image-rendering` 临时缩，headless Chrome 里不可靠）。

```bash
# 渲染 MP4 前必须先把 TEMP 指到工作区内
# （沙箱里的 ffmpeg 写不进系统 %TEMP%，否则报 Permission denied）
$env:TEMP = Join-Path (Get-Location) ".tmp"; $env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npx remotion render PixelIntro       out/mrdave-pixel-intro.mp4      --browser-executable="$chrome"
npx remotion render PixelIntroWide   out/mrdave-pixel-intro-wide.mp4 --browser-executable="$chrome"
npx remotion render ChannelIntro     out/mrdave-intro-10s.mp4        --browser-executable="$chrome"
npx remotion render ChannelIntroWide out/mrdave-intro-10s-wide.mp4   --browser-executable="$chrome"

# 不装 ffprobe，直接读 ISO-BMFF 盒子验收时长 / 分辨率 / 音轨
node scripts/channel-intro/verify_mp4.mjs out/mrdave-pixel-intro.mp4
```

音床已入库（纯 numpy 合成，不依赖 TTS），改音效后重跑 `python -X utf8 scripts/channel-intro/generate_intro_sfx.py`。头像与色板全部取自频道真实数据。

## 共享组件

`src/shared/components/index.tsx`：
- **FadeIn** — 淡入 + 上滑
- **SlideUp** — 上滑入场
- **WhiteCard** — 标准卡片容器
- **SubtitleBar** — 底部字幕条
- **SHARED_COLORS** — 通用调色板

## 技术栈

Remotion · React 19 · TypeScript · TailwindCSS 4 · Zod · pnpm
