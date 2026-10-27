# Remotion Skills 变更摘要（安装 4.0.513 → 上游 4.0.538）

> 数据来源：`.tmp/skills-diff-report.txt`、`.tmp/skills-numstat.txt`、`.tmp/skills-content.diff`（逐文件 unified diff）、`.tmp/skills-upstream/skills/`（上游原文）。
> diff 引用格式：`.tmp/skills-content.diff` 的 `L行号`。

## 0. 结论（TL;DR）

1. **有更新，且是功能性大更新，不是版本号刷新**：新增 14 个文件（=7 个新主题 × 2 份拷贝）、9 个 `SKILL.md` 实质改写、约 35 个独立主题文档有实质内容变化；无删除文件。
2. **新内容整体面向 Remotion 4.0.5xx 的"Studio 可编辑性/交互"能力**，例如 `Interactive.create()`（≥4.0.536）、`<Track>`（≥4.0.534）、`effects` prop（≥4.0.455）、`colorCorrection()`（≥4.0.509）、`lut()`（≥4.0.526）、`<HtmlInCanvasMotionBlur>`（≥4.0.529）、`@remotion/whisper-webgpu`（≥4.0.518）、媒体组件 `from`/`durationInFrames`（≈4.0.45x）、CLI `render --frames` 多帧导出（≥4.0.502）。
3. **项目 Remotion 安装在 4.0.425**（`package.json` 与 `node_modules` 均已核实）：如果直接让 AI 按 4.0.538 的 skills 写代码，会写出 4.0.425 里不存在的 API。**推荐 `npx remotion upgrade`（upgrade skill 说明它也会更新项目内 skills）一步升级**；若暂不升级，可以只更新 skills，但必须按第 6 节的版本门控使用。

## 1. 事实基础

| 项 | 值 | 证据 |
| --- | --- | --- |
| 已安装 skills | 4.0.513，271 个文件 | `.agents/skills/`；diff report 第 2 行 |
| 上游 skills | 4.0.538，commit `6c67adc`（2026-10-22），285 个文件 | `.tmp/skills-upstream/`（shallow clone） |
| 项目 Remotion | **4.0.425**（remotion / @remotion/cli / media / transitions / gif / three / tailwind-v4 / zod-types 全部同版本） | `package.json` |
| 文件级差异 | 新增 14、删除 0、改动 108（其中 9 个仅版本号） | `.tmp/skills-diff-report.txt` L2-L5 |
| 噪音项 | 108 个改动里 **25 个是 `agents/openai.yaml` 仅图标 `.png`→`.svg`**；约 35 个是 bundle 内重复拷贝（`remotion-best-practices/remotion-*/*` 与独立 `remotion-*/*` 内容重复） | numstat 全 +2/-2；例如 diff L4190-L4197 |
| 真实独立主题变化 | ≈39 个文档（见第 2-4 节） | — |

注：skills 在 `.agents/skills/` 下存了两份（顶层各 skill，以及 `remotion-best-practices/` bundle 内的副本），更新时两边都要覆盖。

## 2. 新增文档（7 个主题，14 个文件）

路径均为「顶层路径 / bundle 内路径」两处；版本列是本文核实过的引入版本（方法见第 6 节）。

| 文档 | 作用与关键 API | 引入版本 | 对 TTS 多场景项目相关度 |
| --- | --- | --- | --- |
| `remotion-markup/timing-props.md`（`remotion-best-practices/remotion-markup/timing-props.md`） | 统一讲 timing props：`from` 定位、`trimBefore` 设自身时间线起点、`durationInFrames` 选范围、`playbackRate` 变速、`loop` 循环；给出运算顺序与子组件 `useCurrentFrame() = trimBefore + (frame - from) * playbackRate`；不支持这些 props 的组件用 `<Sequence layout="absolute-fill"/"none">` 兜底 | props 是否可用取决于组件版本；`Sequence` 兜底 4.0.425 可用 | **高**：取代旧 skill 里散落甚至写错的时序说明（旧文还写 "For media, pass the natural duration" 等） |
| `remotion-markup/motion-blur.md` | `@remotion/motion-blur` 的 `<HtmlInCanvasMotionBlur>`：按分数帧采样并平均像素；`shutterAngle`（0–360，默认 180）、`samples`（1–64，默认 8）；子组件内调 `useCurrentFrame`；实时预览需 Chrome 149+ 的 `chrome://flags/#canvas-draw-element`；嵌套需 `HtmlInCanvas.isNestingSupported()`（Chrome 157+） | **≥4.0.529**（原文明确 "Available from Remotion 4.0.529"） | 低（运动模糊可选增强） |
| `remotion-markup/color-correction.md` | `@remotion/effects` 的 `colorCorrection()`：一次 WebGL pass 做曝光/白平衡/阴影高光/黑点白点/对比/饱和/自然饱和度；`lut()` 应用 3D `.cube`（`content` 传完整文件文本，`LUT_3D_SIZE` 2–256，只支持 3D LUT，无强度参数，`disabled` 旁路）；`.cube` 放 `public/` 可在 Studio Assets 面板拖拽应用 | `colorCorrection()` **≥4.0.509**、`lut()` **≥4.0.526** | 中低（统一调色/相机 LUT 时有用） |
| `remotion-markup/connected-compositions.md` | 用 `Interactive.create()` 导出场景/元素，在父视频中直接渲染该组件，并在 `<Composition>` 注册**同一个导出引用**，即可在完整视频里双击下钻到独立 Studio 时间线；`layout:'absolute-fill'`（场景）/`'none'`（有界元素）；字号字体在组件内部加载；父级不挂载时 defaultProps 要自洽；含"从现有分组抽取"和"父/独立双视图验收"步骤 | **≥4.0.536**（`Interactive.create`） | **中高**：多场景项目让每个 scene 可独立编辑/下钻的方向 |
| `remotion-interactivity/timeline-structure.md` | 先定"编辑单元"再选时间容器：不重叠且独立起点→命名 `<Track>`；连续且改时长要联动→`TransitionSeries`；多图层要一起移动/裁剪/变速→共享 `Sequence` 或带时序的组件；给出 Title→Chapter→MyVideo→Root 的完整示例（Track 场景 + Track 音乐 + `Interactive.create` 注册） | **≥4.0.534**（Track）、≥4.0.536（create） | **高**：多场景/音乐轨结构直接可参考 |
| `remotion-markup/arabic-text.md` | 阿拉伯/波斯/乌尔都/希伯来 RTL：`dir="rtl"`、按词而非按字母动画、需要拆字时保留连写（harakat/lam-alef 连字/ZWJ）、字体建议（Noto Sans Arabic 等） | 无版本门槛（纯 HTML/字体） | 无 |
| `remotion-interactivity/inline-effects.md` | effects 数组必须 inline（数组形状稳定、参数内联），条件渲染 effects 不可动画；否版本见第 6 节 | 依赖 effects（≥4.0.455） | 低 |

## 3. SKILL.md 变更（9 个有实质改动）

| 文件 | 主要变化 | diff 位置 | 对项目影响 |
| --- | --- | --- | --- |
| `remotion-best-practices/SKILL.md`（router） | 新增 **"Open the preview"**（"做视频"时默认不渲染，先开 Studio 预览：Cursor 用 `npx remotion studio`；in-app browser 用 `--no-open` 并打开打印的 URL 验证；Studio 支持 WebMCP 工具）与 **"Render the video"**（只有用户明确说渲染/导出/给 MP4 才渲染，可优先用 Studio 的渲染界面）；原 "Opening Remotion Studio" 段被并入 | L3355-L3434 | **工作流变化**，4.0.425 可用，与项目 `pnpm run dev` 习惯一致 |
| `remotion-captions/SKILL.md` | `Caption` 类型新增可选字段 `pageBreakAfter?: boolean`；新增 "Post-creation"（做完后加载 best-practices、打开 Studio） | L3801-L3829 | 中（字幕分页编辑相关，新字段需新 @remotion/captions） |
| `remotion-create/SKILL.md` | 脚手架区分**空目录/非空目录**（空目录直接 `npx create-video@latest --yes --blank --no-tailwind .`；隐藏文件里只有 `.DS_Store` 之类可删，`.env`/`.git` 不能删）；"能跑就立刻开 Studio 预览再写 composition"提前；新增 "Is this a timeline of clips?" 分支；原 Preview/Render 段移除（挪到 router） | L4073-L4183 | 工作流，4.0.425 可用 |
| `remotion-interactivity/SKILL.md` | 几乎重写：Studio 以 JSX 节点为编辑目标；先读 timeline-structure；schema 字段类型全表（`string/number/boolean/color/enum/array/asset/font-family/font-weight/translate/scale/rotation-css/rotation-degrees/transform-origin/uv-coordinate/svg-path/remotion-captions/hidden` + 是否可关键帧）；新增 schema 片段（`textSchema/backgroundSchema/borderSchema/borderRadiusSchema/captionsSchema/childrenSchema`，`Interactive.create` 自动带 transform）；**不许手写 transform/opacity 字段**；新增 `<Interactive.Path>` + `interpolatePaths()`（`@remotion/paths`）与内联 path 关键帧；`<Sequence name>` 包标题改为 `<Interactive.Div name>`；effects 段挪到 inline-effects.md | L4238-L4471（bundle 副本 L786-L1014 同内容） | **版本门控严重**：`Interactive` ≥4.0.475、`create()` ≥4.0.536 |
| `remotion-markup/SKILL.md` | 新增 general rules：`useCurrentFrame()` 放最小组件（否则整场景逐帧重渲染）、秒→帧一律用 `useVideoConfig()` 的 fps 且表达式写在 JSX 上（`trimBefore={4 * fps}`，Studio 可编辑且换 fps 不出错）；删除旧 "Example scene" 与旧 timing props 细节（改指向 timing-props.md）；新增 motion-blur / connected-compositions / color-correction / arabic-text 索引；新增 **effects 支持组件矩阵**与内置 effects 清单；"Advanced compositions" 改名 "Compositions and stills" 并指向 compositions/connected；**删除** "Previewing markup" 和 "Optional: one-frame render check"（改为 Visual checks：开 Studio 检查，必要时渲染多帧）；补 `@huggingface/transformers` 也要用 `remotion add` 安装 | L5754-L6053（bundle 副本 L1902-L2194） | **高**：新 general rules 中"fps 用 useVideoConfig、timing 表达式内联、frame 订阅最小化"与项目代码习惯高度相关 |
| `remotion-render/SKILL.md` | 新增多帧导出：`npx remotion render [comp] out/frames --frames=0,30,90 --image-format=png` | L6735-L6762 | 需 **≥4.0.502**（4.0.425 的 `--frames` 只支持单帧或区间） |
| `remotion-studio/SKILL.md` | 改为"预览优先"：一能跑就开 Studio 保持打开；Cursor 下不要加 `--no-open`；有 in-app browser 时用 `--no-open` 并验证打印出的 URL（含 composition 后要验证预览视频加载），打不开就别用 `--no-open` | L6814-L6847 | 工作流 |
| `remotion-upgrade/SKILL.md` | 依赖对齐方式变化：不再读 Mediabunny 兼容页，改为 `npm view @remotion/studio@<version> dependencies --json`，按它对齐 `zod`/`mediabunny`/`@huggingface/transformers`（`@mediabunny/*` 用 mediabunny 的版本）；升级后跑 `npx remotion versions`；若 `@remotion/cli` 可用，`npx remotion upgrade` 会同时更新项目内 skills；否则用 `npx skills update remotion-best-practices … --yes` | L6865-L6890；SKILL 原文 `remotion-upgrade/SKILL.md` | **重要**：这是本项目升级路径的权威说明 |
| `remotion-docs/SKILL.md` | 只把相对链接改成纯文本 + 图标 yaml（png→svg），无实质 API 变化 | L4201-L4220 | 无 |

（其余 `remotion-maps/SKILL.md`、`remotion-saas/SKILL.md`、`remotion-multimedia/SKILL.md` 仅版本号变化。）

## 4. 重点文档实质变更（按 TTS 多场景相关性排序）

### 4.1 `remotion-markup/sequencing.md`（+17/-135，几乎删光重写；diff L5519-L5711）

- **删掉**：`<Sequence>` 基础用法长示例、`<Series>` / `<Series.Sequence>`、Series 负 offset 重叠、嵌套 Sequence、Sequence 内嵌 composition（width/height）、**"Premounting：Always premount any `<Sequence>`!"（`premountFor`）**。
- **换成**：如何选时序边界——能接受 timing props 的内建/`Interactive.create()` 组件就把 props 直接写在它身上；多图层要共同 trim/变速/起点、要覆盖尺寸、子组件不支持 timing 时才用共享 `Sequence`（`layout="none"` 不产生布局元素）；不重叠独立起点用 `<Track>`，连续且要联动用 `TransitionSeries`；并指向 timing-props.md / video-editing.md / timeline-structure。
- 影响：旧 `Series`/`premountFor` 写法在新版文档里已不存在（4.0.425 仍支持，但不必新增使用）；新写法需要 Track（≥4.0.534）。

### 4.2 `remotion-markup/transitions.md`（+110/-71；diff L6067-L6313）

- 多场景时**保留外层 `<TransitionSeries>` 在时间线可见**（Studio 在两者画布轮廓相同时偏好看当前 scene）。
- 主示例改为 connected `Chapter` 组件 + `TransitionSeries.Sequence name="..."`。
- 新增 **"Custom presentation"**：`TransitionPresentationComponentProps<Record<string, never>>` 的 `{children, presentationDirection, presentationProgress}`，用 `presentation={{component: SlideInPresentation, props: {}}}` 接入。
- Overlay 示例改为 `Interactive.create()` 包 `lightLeak` effect；"mixing" 规则从"overlay 不能相邻 transition/overlay"改成 **"用 scene 把 overlay 和 transition 隔开"**。
- 影响：custom presentation / Overlay / fade 在 4.0.425 可用；lightLeak(effects) 需升级。

### 4.3 `remotion-markup/video-editing.md`（+118/-61，整篇重写为 "Editable video timelines"；diff L6315-L6539）

- 剪辑行为选择：**命名 `<Track>`**（独立起点，改一个不动其他）vs **`TransitionSeries`**（涟漪编辑，`durationInFrames` 放每个 `TransitionSeries.Sequence`，改时长自动后移）。
- **同步层走同一个时钟**：一个镜头的 video、字幕、源同步 overlay 放进同一个 `Sequence` 或 `TransitionSeries.Sequence`，`trimBefore/durationInFrames/playbackRate` 只写在这个共享父级一次；"只把 trim 写在 `<Video>` 上，兄弟字幕不会继承"被明确点出。
- overlay 作用域：源同步 HUD 放镜头内，跨切点贴纸放场景层；cutaway 放命名 `Cutaways` track，同时画面放不同 track；覆盖说话的 cutaway 时注意别把声音一起删掉；视觉+音效同组时保留局部偏移与两者时长。
- 音乐段放共享 track（有间隙/相邻边界都行），overlap 的尾音要分轨，不要缩短声音硬塞。
- 重构时保持原剪辑：trim/切点时长/速率/字幕数组/音量包络/叠放顺序不变；移动时序边界会改变 `useCurrentFrame()`，要有意调整局部偏移。
- 影响：**这是与项目最相关的新结构文档**，但示例用了 `Video trimBefore+durationInFrames` 和 `BasicCaptions`（都需升级）。

### 4.4 `remotion-markup/multi-scene-video.md`（+17/-72，重写；diff L5290-L5400）

- 旧版：每 scene 一个文件 + TransitionSeries + 每个 scene 单独注册 `<Composition>`（可双击跳转）+ 后续可加 transitions。
- 新版：每场景独立组件，值得独立编辑时做成 **connected composition**；父结构二选一：独立起点用 `Track`（`from`+`durationInFrames` 显式、不可重叠），联动用 `TransitionSeries`（duration/source trim 放在 Sequence 边界、转场重叠要算进总时长）；指向 timeline-structure / transitions / connected-compositions。
- 影响：旧"单独注册+双击"思路被 connected composition（Interactive.create）取代，需 ≥4.0.536。

### 4.5 `remotion-markup/audio.md`（+29/-16；diff L4608-L4749）

- 裁剪：`trimAfter` → **`trimBefore` + `durationInFrames`**（示例：`trimBefore={2*fps}` + `durationInFrames={8*fps}` = 播到第 10 秒）。
- 延迟：不再包 `<Sequence>`，**直接 `<Audio from={fps}>`**。
- 音量：`volume={(f) => interpolate(f, ...)}` 回调 → **`volume={interpolate(frame, ...)}`**（用 `useCurrentFrame()`；新版 Studio 里可编辑并显示为音量曲线）。
- **删除 `loopVolumeCurveBehavior`**（不再需要 repeat/extend 说明）。
- 多处补 `import { Audio } from "@remotion/media"`。
- 影响：4.0.425 的 `<Audio>` 没有 `from`/`durationInFrames`（只有 trimBefore/trimAfter），因此**这条新写法不能直接照搬**；`volume` 用 `interpolate` 数值在 4.0.425 兼容。

### 4.6 `remotion-markup/compositions.md`（+89/-37；diff L4772-L4951）

- 新增 **"Source-editable registrations"**：每个要独立编辑的 `<Composition>`/`<Still>` 用**独立 JSX 节点**、`id` 用 JSX 字符串字面量、metadata/defaultProps 内联；程序化注册（数组 `.map()`）只适合"整组作为一个模板、不需单独排序/复制/删除/编辑"的场景。
- 子编辑器拥有的数据（如字幕数组）放在子组件 JSX 节点上，不要塞进 `defaultProps` 或组件 prop（Caption editor 需要源码里的数组字面量）。
- 嵌套 composition：需要独立尺寸时用 `<Sequence width height>`；需要独立可编辑时间线时用 connected composition。
- 影响：**项目 `src/Root.tsx` 正是 `compositions.map(...)` 程序化注册**（`id={c.id}` 来自变量），与新指引相反；Studio 源码写回/下钻能力（新 Studio）下会受限。

### 4.7 Captions 两篇重写（transcribe +130/-38，display +125/-128）

**`remotion-captions/transcribe-captions.md`（diff L3831-L4053）**
- 转写包从 `@remotion/install-whisper-cpp` 换成 **`@remotion/whisper-webgpu`**（`canUseWhisperWebGpu`、`WHISPER_WEBGPU_SAMPLE_RATE`、`downloadWhisperModel`、`loadWhisperModel`、`transcribe`、`toCaptions`），并需要 `@huggingface/transformers`、`mediabunny`、`@mediabunny/server`；用 mediabunny 的 `Conversion`/`FilePathSource`/`NullTarget`/`WavOutputFormat` 把音频解成 16kHz mono；默认模型 `small.en`，多语言用 `small` + 显式 `language`（不支持自动识别）；浏览器用 `resampleTo16Khz()`。
- 时间戳规则：按**原始素材**逐个转写，保持相对原文件的时间（包括被剪掉的部分），**不要加 composition 偏移、不要合并成全局时间**。
- 版本：`@remotion/whisper-webgpu` 首个 npm 版本 **4.0.518**。
- 影响：项目 TTS 是自写 Python 生成音频+文本，不用 whisper；但"字幕时间戳相对原素材、随场景 trim 走"的原则与项目一致。

**`remotion-captions/display-captions.md`（diff L3453-L3774）**
- 删除整套旧方案：`useDelayRender` 拉 JSON + `createTikTokStyleCaptions()` 分页 + `pages.map(<Sequence>)` + 手写 word highlight。
- 新方案：用 **"Basic Captions" 元素**（从 `https://www.remotion.dev/elements/captions/basic-captions.md` 复制 `basic-captions.tsx` **原样**进项目），`<BasicCaptions captions={[...]}>`。
- 字幕必须**内联**在 `captions` prop（Caption editor 会写回这个数组字面量；传变量/组件 prop 就没有源码数组可写）。
- 字幕与视频**放进同一个 `<Sequence>`/`<TransitionSeries.Sequence>`**，`trimBefore/durationInFrames/playbackRate` 放共享父级；给 caption 区域定宽并用 `translate` 居中（示例 1920 宽、900 字幕区 → `translate: "510px 0px"`）。
- `caption.pageBreakAfter === true` 时该 caption 后换页。
- 影响：BasicCaptions 源码依赖 `Interactive.create`（≥4.0.536）+ `@remotion/captions`，**4.0.425 不可用**；但"字幕与画面同一时序边界"的原则可先借鉴（项目现为 `SubtitleBar` + 硬编码 startFrame/endFrame）。

**`remotion-captions/import-srt-captions.md`**：仅去掉 `AbsoluteFill` 包裹（Fragment）、改链接，无 API 变化（diff L359-L382）。

### 4.8 `remotion-markup/effects.md` + 新增 color-correction（+28/-5；diff L4975-L5049）

- 新增 **effects 支持组件矩阵**：`remotion`（`Img/CanvasImage/AnimatedImage/Solid/HtmlInCanvas`）、`@remotion/media`（`Video`）、`@remotion/gif`（`Gif`）、`@remotion/rive`（`RemotionRiveCanvas`）、`@remotion/shapes`（`Arrow/Callout/Circle/...`）；普通 HTML、`Interactive.*`、`AbsoluteFill`、`Sequence` **不接受 effects**，要处理整组内容就包 `<HtmlInCanvas>` 再在 wrapper 上放 effects。
- 内置 effects 名单大幅扩充并分类（颜色/模糊轨迹/光照/畸变/纹理/边缘/像素化），新增 `colorCorrection/exposure/levels/lut/shadowsHighlights/vibrance/whiteBalance/regionBlur/longShadows/skew/tile/flannel/liquidContours/outline/tear/linearProgressivePixelate/radialProgressivePixelate` 等；多数是 WebGL2，`cylinder()/sphere()/pageTurn()` 用 WebGPU；渲染要 `Config.setChromiumOpenGlRenderer('angle')`。
- import 全部改为子路径（`@remotion/effects/brightness`）。
- 版本：`@remotion/effects` 包首发 4.0.455；具体 effect 更晚（`colorCorrection` 4.0.509、`lut` 4.0.526、`lightLeak` 4.0.500+）。
- 影响：项目 4.0.425 无 `@remotion/effects`、组件也没有 `effects` prop，整块需升级后才能用。

### 4.9 其它文档变更

| 文档 | 变化 | diff 位置 |
| --- | --- | --- |
| `remotion-markup/html-in-canvas.md` | 嵌套支持改为 `HtmlInCanvas.isNestingSupported()`（Chrome 157+，旧版直接拒绝嵌套）；`onPaint` 参数去掉 `element`；不再手工 `element.style.transform = transform`（只画图）；WebGL 上传改用 `texElementSubImage2D`（旧 Chromium 用 `texElementImage2D` 兜底） | L5170-L5235 |
| `remotion-markup/images.md` | `getImageDimensions` 从 `remotion` 改为 **`@remotion/media-utils`**（`staticFile`/`CalculateMetadataFunction` 仍从 remotion） | L5236-L5267 |
| `remotion-markup/sfx.md` | `<Audio>` 从 `@remotion/sfx` 改为 **`@remotion/media`** | L5713-L5731 |
| `remotion-markup/cropping.md` | crop props 支持 `<Interactive.*>` 与 `Interactive.create()` 组件（absolute-fill 作用在容器，none 通过 style 透传） | L4953-L4974 |
| `remotion-markup/ffmpeg.md` / `embedding-videos.md` / `silence-detection.md` | 统一 `trimBefore` + `durationInFrames` 取代 `trimAfter`；音视频延迟改为 `from` 直接放组件；音量改 `interpolate`；删除 `loopVolumeCurveBehavior` | L5148-L5169、L5050-L5146、L5732-L5753 |
| `remotion-markup/light-leaks.md` | 示例去掉 `AbsoluteFill` 包裹（Fragment）；保留 "需 Remotion 4.0.500+" 提示 | L5268-L5289 |
| `remotion-markup/voiceover.md` | `FPS` 改名 `compositionFps` 并明确"`calculateMetadata` 在组件外，不能调 `useVideoConfig()`；组件内 timing 仍用 useVideoConfig 的 fps"；音频时长链接改纯文本 | L6541-L6577 |
| `remotion-multimedia/get-audio-duration.md` / `get-video-duration.md` / `get-video-dimensions.md` | mediabunny：Node 用 `FilePathSource`（替代 `FileSource(file)`）、浏览器 File 用 `BlobSource`；`UrlSource` 不再传 `getRetryDelay`；用完 `input.dispose()` | L6596-L6717 |
| `remotion-maps/techniques/maplibre/TECHNIQUE.md` | `import * as maplibregl` + `maplibregl.setWorkerUrl(URL.createObjectURL(new Blob([...worker.mjs...])))` 修 worker 加载；去掉 `AbsoluteFill` 包裹 | L4515-L4577（bundle 副本同） |
| `remotion-saas/framework.md` | 模板列表精简（Next.js 一条） | L6780-L6796 |
| `*/REFERENCE.md`（bundle 形态） | captions/create/interactivity/render/studio/upgrade 的 REFERENCE 与其独立 SKILL 同内容变化；`remotion-markup/REFERENCE.md` 与 `remotion-markup/SKILL.md` 同步 | L384-L413、L656-L751、L786-L1014、L1902-L2194、L3196-L3224、L3275-L3309、L3326-L3355 |

## 5. 被删除/改写的旧命令与旧 API 指引（项目现状 vs 新指引）

| 旧（4.0.513 / 项目当前代码） | 新（4.0.538） | 项目影响 |
| --- | --- | --- |
| `trimAfter={10*fps}` | `trimBefore` + `durationInFrames` | 4.0.425 的 `@remotion/media` 只有 `trimAfter`，**不能照搬** |
| `volume={(f) => ...}` 回调 | `volume={interpolate(frame, ...)}`（可编辑音量曲线） | 数值写法 4.0.425 兼容；曲线编辑不可用 |
| `loopVolumeCurveBehavior="extend"` | 删除（改用 frame→interpolate 自然延伸） | 4.0.425 仍可继续用旧写法 |
| `<Series>` / `<Series.Sequence>` / 负 offset 重叠 / "Always premount any Sequence!" / `premountFor` | 全部删除；改用 `Track` / `TransitionSeries` / 共享 `Sequence` | 4.0.425 仍支持，不必新增；但新文档不再教你这些 |
| `<Sequence name="Title">` 包文本（Studio 交互） | `<Interactive.Div name="Title">` | 需 ≥4.0.475 |
| `npx remotion add @remotion/transitions`（部分文档） | 示例改成 `bunx remotion add ...`（文档风格，非强制） | 无 |
| 默认 `npx remotion studio --no-open` 再手动开 URL | 先 `npx remotion studio`（自动开浏览器）；`--no-open` 只用于 in-app browser 且必须验证 URL | 工作流变化，立即可用 |
| `npx remotion still --scale=0.25 --frame=30` 单帧自检 | 开 Studio 做视觉检查；需要多帧用 `render --frames` | 多帧导出需 ≥4.0.502 |
| `@remotion/install-whisper-cpp`（whisper.cpp） | `@remotion/whisper-webgpu` + `@huggingface/transformers` + mediabunny | 新包 ≥4.0.518 |
| TikTok 字幕手写（`createTikTokStyleCaptions` + `useDelayRender` + map Sequence + word highlight） | Basic Captions 元素 + 内联 captions + Caption editor | 需 ≥4.0.536 |
| `import {Audio} from "@remotion/sfx"` | `import {Audio} from "@remotion/media"` | 项目已用 @remotion/media，无影响 |
| `getImageDimensions` 来自 `remotion` | 来自 `@remotion/media-utils` | 4.0.425 有该包（需另装） |
| `@remotion/effects` 根导入 | 子路径 `@remotion/effects/<slug>` | 需 ≥4.0.455 |
| html-in-canvas：`onPaint({canvas, element, elementImage})` + `element.style.transform` + `texElementImage2D` | 新签名（无 element）+ 新 `texElementSubImage2D` + `isNestingSupported()` | 需 ≥4.0.455 / Chrome 149+ |
| 多处 `<AbsoluteFill>` 包裹示例 | 改为 Fragment（`<>`） | 无 |

## 6. 版本门控（关键：项目 = Remotion 4.0.425）

核实方法：读本地 `node_modules` 类型定义 + npm 版本列表 + jsDelivr 各版本 `remotion` 包文件 + remotion.dev 文档的 `AvailableFrom` 标注。

| 新能力 | 最早版本 | 4.0.425 可用？ | 证据 |
| --- | --- | --- | --- |
| `Interactive` 命名空间（`Interactive.Div` 等） | **4.0.475** | ❌（本地 `remotion` 无任何 Interactive 导出） | /docs/interactive；本地 node_modules grep |
| `Interactive.create()` | **4.0.536** | ❌ | /docs/interactive-create 标注 |
| `Interactive.childrenSchema` | 4.0.535 | ❌ | /docs/interactive |
| 其它 schema 片段 | 4.0.479–4.0.501 | ❌ | /docs/interactive |
| `<Track>` | **4.0.534** | ❌（本地无 Track 导出；4.0.529 包内也无 Track.d.ts） | /docs/track |
| `effects` prop / `createEffect()` / `@remotion/effects` | **4.0.455** | ❌（包未安装、组件类型无 effects） | npm 首发 4.0.455；jsDelivr `remotion@4.0.455` 已有 `HtmlInCanvas.d.ts`、`effects/` |
| `colorCorrection()` | **4.0.509** | ❌ | /docs/effects/color-correction |
| `lut()` | **4.0.526** | ❌ | /docs/effects/lut |
| `lightLeak()` / light-leaks 文档 | 4.0.500+ | ❌ | `light-leaks.md` 原文 |
| `<HtmlInCanvas>` | 4.0.455 | ❌ | jsDelivr 4.0.455 存在 `dist/cjs/HtmlInCanvas.d.ts` |
| `<HtmlInCanvasMotionBlur>`（`@remotion/motion-blur`） | **4.0.529** | ❌ | `motion-blur.md` 原文 |
| `interpolatePaths()`（`@remotion/paths`） | **4.0.529** | ❌ | /docs/paths/interpolate-paths |
| `<Video>/<Audio>` 的 `from`/`durationInFrames` | 4.0.441–4.0.455 之间（4.0.440 无、4.0.455 有） | ❌（本地 Video props 只有 trimBefore/trimAfter） | jsDelivr `@remotion/media@4.0.440` vs `4.0.455` props.d.ts |
| CLI `render --frames=0,30,90` 多帧 | **4.0.502** | ❌（本地 CLI 只接受单帧或 `a-b` 区间） | /docs/cli/render 的 AvailableFrom |
| `@remotion/whisper-webgpu` | **4.0.518**（npm 首发） | ❌ | npm versions |
| Basic Captions 元素源码 | 需 `Interactive.create`（4.0.536）+ `@remotion/captions` | ❌ | elements 页面源码 |
| `Caption.pageBreakAfter` | 新版 `@remotion/captions` | 项目未装该包 | skills 文档 |
| 音量用 `interpolate` 数值 | 4.0.425 的 `VolumeProp = number \| fn` | ✅ | 本地 `volume-prop.d.ts` |
| 自定义 transition presentation、Overlay | 4.0.425 | ✅ | 本地 `@remotion/transitions` types |
| `Sequence` 的 `name`/`premountFor`/`layout` | 4.0.425 | ✅ | 本地 `Sequence.d.ts` |
| `npx remotion studio`（新的预览优先流程） | 4.0.425 已有 studio | ✅ | 本地 CLI |
| `@remotion/media-utils` 的 getImageDimensions | 4.0.425 有该包 | ✅（需 `pnpm add`） | npm |

**结论**：4.0.538 的 skills 是给（接近）最新 Remotion 写的；项目停在 4.0.425，**即使现在已安装的 4.0.513 skills 也已经比运行时新**，4.0.538 把差距进一步拉大（新增 Interactive/Track/effects/motion-blur 等）。

## 7. 对项目的落地建议

### 方案 A（推荐）：升级 Remotion + 更新 skills 一起做
- `npx remotion upgrade`：upgrade skill 明确说它会同时更新项目内 skills；升级后按新的 `upgrade/REFERENCE` 用 `npm view @remotion/studio@<version> dependencies --json` 对齐 `zod`/`mediabunny`/`@huggingface/transformers`，再跑 `npx remotion versions`。
- 升级后逐项采纳（对 TTS 多场景项目收益最大）：
  1. **结构**：每个 scene 用 `Interactive.create()` 做 connected composition（Studio 双击下钻），父级用 `<Track name="Scenes">` 放独立场景、`<Track name="Music">` 放配乐；连续转场继续用 `TransitionSeries`（新 transitions 文档仍保留"总帧数 = Σ场景 − Σ转场重叠"规则）。
  2. **字幕**：Basic Captions 元素替代自写 `SubtitleBar`（能获得字幕编辑器写回 + caption 与视频同一时序边界）；`pageBreakAfter` 控制分页。
  3. **音频**：`<Audio from={...} durationInFrames={...}>` 直接放时序；音量用 `interpolate(frame, ...)`；`trimBefore + durationInFrames` 统一裁剪。
  4. **调色/效果**：`@remotion/effects` 的 `colorCorrection()` / `lut()`（相机 LUT）/ `vignette()` 等，注意 `Config.setChromiumOpenGlRenderer('angle')`。
  5. **预览/渲染工作流**：先开 Studio（`pnpm run dev` 已是），非明确要求不渲染；多帧检查用 `render --frames`。
  6. **性能**：`useCurrentFrame()` 收到最小组件、`fps` 一律 `useVideoConfig()`、timing 表达式内联在 JSX。
- 风险/回归：Remotion 主版本内升级但跨度 113 个 patch，需 `pnpm run lint` + 关键 composition 抽帧/渲染回归；`@remotion/three`/`@remotion/gif` 等同版本一起升；本地 Chrome 渲染参数（CLAUDE.md）继续用。

### 方案 B（暂不升级 Remotion，只更新 skills）
- 可以只更新 skills（`npx skills update …`），但必须让代理知道"skills 是 4.0.538，运行时是 4.0.425"，否则会写出编译不过的代码。建议把第 6 节做成 `CLAUDE.md` 的一条"版本门控"清单。
- 4.0.425 下**可以直接采纳**的改进：
  - 预览优先 / 不主动渲染；`--no-open` 用法；
  - 字幕与场景共享同一个 `TransitionSeries.Sequence` 时序边界（`SubtitleBar` 的 start/end 相对场景帧）、音频与场景边界对齐；
  - `volume={interpolate(frame,...)}`（数值）；`Audio` 统一 `@remotion/media`；
  - 把 `useCurrentFrame()` 收进 `FadeIn`/`SlideUp` 等小组件（项目已是这种写法，保持）；`fps` 用 `useVideoConfig()`；
  - 自定义 transition presentation 的类型写法；Audio trim 继续用 `trimBefore`+`trimAfter`（新写法不可用）；
  - 渲染自检用 Studio / `remotion still`（`render --frames` 需升级）。
- 4.0.425 下**不要采纳**：`Interactive.*`/`Interactive.create`、`<Track>`、effects/lightLeaks/colorCorrection/lut、`HtmlInCanvas`/motion blur、`Video/Audio` 的 `from`/`durationInFrames`、BasicCaptions、BasicCaptions 式 Caption editor、`render --frames` 多帧、whisper-webgpu。
- 可顺手改（与版本无关）：`src/Root.tsx` 目前用 `compositions.map()` + `id={c.id}` 程序化注册；若希望 Studio 能逐个编辑/写回/下钻，应改成每个 `<Composition>` 独立 JSX 节点 + 字符串 id + 内联 metadata/defaultProps（新 compositions.md 的明确指引，但完整收益依赖新 Studio 源码编辑能力）。

## 8. 引用索引

- 差异报告：`.tmp/skills-diff-report.txt`（L7-L21 新增清单；L25-L133 改动清单）
- numstat：`.tmp/skills-numstat.txt`
- 全文 diff：`.tmp/skills-content.diff`（各文件起始行见下）
- 上游原文：`.tmp/skills-upstream/skills/<skill>/…`

关键 diff 行号：`best-practices/SKILL.md` L3355；`captions/SKILL.md` L3801；`captions/display-captions.md` L3453；`captions/transcribe-captions.md` L3831；`create/SKILL.md` L4073；`interactivity/SKILL.md` L4238（bundle L786）；`markup/SKILL.md` L5754（bundle L1902）；`markup/sequencing.md` L5519；`markup/transitions.md` L6067；`markup/video-editing.md` L6315；`markup/multi-scene-video.md` L5290；`markup/audio.md` L4608；`markup/compositions.md` L4772；`markup/effects.md` L4975；`markup/html-in-canvas.md` L5170；`markup/images.md` L5236；`markup/cropping.md` L4953；`markup/sfx.md` L5713；`markup/ffmpeg.md` L5148；`markup/voiceover.md` L6541；`multimedia/get-*.md` L6596-L6717；`render/SKILL.md` L6735；`studio/SKILL.md` L6814；`upgrade/SKILL.md` L6865；`saas/framework.md` L6780。

新增文档原文（每个 2 份）：
`remotion-markup/{arabic-text,color-correction,connected-compositions,motion-blur,timing-props}.md`、`remotion-interactivity/{inline-effects,timeline-structure}.md`，以及 `remotion-best-practices/` 下同名副本。
