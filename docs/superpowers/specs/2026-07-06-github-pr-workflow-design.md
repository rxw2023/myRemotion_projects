# GitHub PR Workflow — 科普视频设计

## Meta
- **Video ID**: `GitHubPRWorkflow`
- **Orientation**: portrait (1080×1920)
- **FPS**: 30
- **Category**: video
- **Style**: 暗色终端风，TerminalBox 为主视觉
- **Audio**: edge-tts 生成（`zh-CN-XiaoyiNeural`，rate=+8%），每场景一个 mp3

## TTS 字幕文本 & 场景时长

场景时长 = TTS 时长 × 30fps + 40f buffer（TTS 脚本跑完后精确修正）。

| # | Scene Key | 字幕文本（TTS 源） | 估算帧 |
|---|-----------|-------------------|--------|
| 1 | `intro` | 今天我们来聊聊 GitHub 的正确打开方式。从 Fork 到 Merge，一个完整的 Pull Request 工作流到底该怎么走？ | 180 |
| 2 | `fork` | 首先，你应该先 Fork 我的仓库，而不是直接 clone。Fork 会在你自己的账户下创建一份副本，这样你就有了完整的读写权限，不会影响原仓库。 | 420 |
| 3 | `branch` | 然后从 develop 分支 checkout 一个新的 feature 分支，比如叫 feature/confession。记住，永远不要在 main 或 develop 分支上直接开发，功能分支隔离是关键。 | 420 |
| 4 | `code` | 接着把你的代码写出来，并为它写好单元测试和集成测试，确保代码覆盖率达到百分之九十五以上。没有测试的代码，谁敢合并？ | 420 |
| 5 | `lintCommit` | 跑一下 Linter，通过所有的代码风格检查。然后 commit，commit message 要遵循 Conventional Commits 规范，比如 feat: add confession feature。 | 420 |
| 6 | `pushPR` | 把这个分支 push 到你自己的远程仓库，然后提一个 Pull Request。在 PR 描述里详细说明你的功能改动和实现思路，并且 at 我和至少两个其他的评审。 | 450 |
| 7 | `reviewMerge` | 我们会 review 你的代码，可能会留下一些评论，你需要解决所有的 thread。等 CI/CD 流水线全部通过，并且拿到至少两个 LGTM 之后，我才会考虑把你的分支 squash and merge 到 develop 里，等待下一个版本发布。 | 540 |
| 8 | `wrongMain` | 你怎么能直接 commit 到我的 main 分支？GitHub 上不是这样！main 分支是保护分支，所有的改动都应该通过 Pull Request 进来。 | 360 |
| 9 | `wrongForce` | 怎么直接上来就想 force push 到 main？GitHub 上根本不是这样！force push 会覆盖远程历史，别人的代码可能就丢了。我拒绝合并！ | 360 |
| 10 | `outro` | 回顾一下：Fork 仓库，创建 feature 分支，写代码加测试，通过 Lint，规范 commit，提 PR，通过 review，squash and merge。记住这个流程，开源协作不迷路。点赞收藏关注，下期见。 | 300 |
| **Total** | | | **~3870** |

TTS 生成后，从 `durations_githubpr.json` 读取精确时长，修正帧数。

## Structure

视频分两大部分：Part 1 完整演示正确 PR 流程（核心流程字幕），Part 2 集中展示错误做法（警示字幕）。

TransitionSeries 用 fade(6f) 衔接各场景。最终 `totalFrames = sum(sceneDurations) - 9×6`。

## Scenes Detail

### Scene 1 — intro
- 暗色终端风格标题 "GitHub PR 工作流"，spring 放大
- 副标题 "从 Fork 到 Merge 的正确姿势"
- 粒子背景，TerminalBox 未出现（纯标题页）

### Scene 2 — fork
- TerminalBox 模拟：`gh repo fork upstream/repo` → cloning → `cd repo`
- 高亮说明 Fork 的权限隔离作用

### Scene 3 — branch
- TerminalBox：`git checkout -b feature/confession` 从 develop 切出
- 图形展示 `main → develop → feature/confession` 分支树

### Scene 4 — code
- 上半：伪代码 diff（绿色新增行），模拟写代码
- 下半 TerminalBox：`npm test` → 95% coverage 报告，绿色通过
- 单元测试 + 集成测试都显示 ✓

### Scene 5 — lintCommit
- TerminalBox：`npm run lint` → ✓ 0 errors, 0 warnings
- 然后 `git add .` → `git commit -m "feat: add confession feature"`
- 标注 Conventional Commits 格式（feat/fix/chore/...）

### Scene 6 — pushPR
- TerminalBox：`git push origin feature/confession`
- GitHub PR UI mock：PR 标题、描述框、@reviewers 字段
- 标注 "详细说明改动和实现思路"

### Scene 7 — reviewMerge
- CI/CD pipeline 绿色 ✓ 条
- Review comments → "LGTM 👍" x2
- squash & merge 按钮高亮 → 合并到 develop

### Scene 8 — wrongMain ⚠️
- 红色警报风格，红色边框 TerminalBox
- `git add .` → `git commit -m "fix stuff"` directly on main
- 大字叠加 "🚫 怎么能直接 commit 到 main？！"
- 红色 X 覆盖

### Scene 9 — wrongForce ⚠️
- 红色警报风格，比 Scene 8 更强烈（闪烁）
- `git push --force origin main` → 红色警告
- 大字叠加 "🚫 GitHub 上根本不是这样！"
- 模拟 remote 被覆盖的 branch 图形碎裂效果

### Scene 10 — outro
- 左右分栏：✓ 正确（绿）vs ✗ 错误（红）
- "Fork → Branch → Code → Test → Lint → PR → Review → Merge"
- "点赞 · 收藏 · 关注"

## 字幕设计
- **核心流程字幕**：白色半透明底 bar，复用 `SubtitleBar`
- **警示字幕**：红色背景底 bar，传 backgroundColor 参数或新建 `AlertSubtitleBar`

## 终端模拟
- 复用 `src/FuckUCode/components/TerminalBox.tsx`
- 扩展支持：红色边框模式（警示场景）
- PR review 场景自定义 GitHub UI mock（非 TerminalBox）

## 文件规划
```
src/GitHubPRWorkflow/
  index.tsx              # 主视频 + 10 个场景组件
  components/
    GitHubPRBox.tsx       # PR 描述 / review UI / CI pipeline mock
    AlertSubtitleBar.tsx  # 警示场景红色字幕条

scripts/github-pr-workflow/
  generate_tts.py         # TTS 生成脚本

public/github-pr-workflow/
  durations_githubpr.json # TTS 生成后写入的时长文件
  *.mp3                   # 各场景音频
```

## TTS 生成
- 复用项目已有的 edge-tts 模式（参考 `scripts/fuckucode/generate_fuckucode_tts.py`）
- Voice: `zh-CN-XiaoyiNeural`，rate: `+8%`
- 每段文本独立生成 mp3，存入 `public/github-pr-workflow/`
- 生成 `durations_githubpr.json` 记录精确时长，用于修正帧数

## 注意事项
- BGM 复用 `public/shared/bgm.mp3`
- 场景帧数待 TTS 生成后精确修正
- 所有终端命令无需外部资源
