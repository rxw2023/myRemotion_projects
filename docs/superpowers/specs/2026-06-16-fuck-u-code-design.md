# FuckUCode 科普视频设计文档

**日期**: 2026-06-16 | **风格**: 幽默科普 | **方向**: 竖版 (1080×1920)

---

## 一、概述

介绍开源代码质量分析工具 **fuck-u-code** 的竖版科普视频。采用"痛点开场 → 安装上手 → 核心能力 → AI 审查 → 生态 → 收尾"六段式结构，旁白幽默风趣，终端模拟界面增强技术感。

---

## 二、场景详情

### 场景 1：痛点开场（660fps, ~22s）

**旁白**: "你的代码库是不是越来越像一锅意大利面？嵌套十层的 if-else，一个函数三百行，注释？不存在的。每次改代码都像拆炸弹——碰哪里都炸。今天介绍一个工具，专门给代码质量打分，名字也很直接——fuck-u-code，代号'屎山检测器'。"

**视觉**: 白底 + 逐渐浮现的凌乱代码片段（斜的、重叠的），营造"屎山"感。后半段标题卡片出现。

---

### 场景 2：安装 & 上手（750fps, ~25s）

**旁白**: "安装很简单，一行命令全局搞定：`npm install -g fuck-u-code`。装完就能用，支持 Go、Python、JavaScript、TypeScript、Rust、Java、C/C++ 等 14 种语言。它基于 tree-sitter 做 AST 语法树解析——不是简单的关键词匹配，是真正读懂你的代码结构。进入项目目录，敲下 `fuck-u-code analyze`，一键扫描。"

**视觉**: TerminalBox 组件展示安装过程 → 语言标签墙（14 个语言 Logo）→ TerminalBox 展示 `analyze` 命令输出。

**TerminalBox 内容**:
```
$ npm install -g fuck-u-code
+ fuck-u-code@1.x.x
added 142 packages in 3s

$ fuck-u-code analyze
Scanning project... done (33 files)
```

---

### 场景 3：核心能力 — 七维分析（960fps, ~32s）

**旁白**: "`analyze` 命令从七个维度给代码打分。圈复杂度看逻辑分叉多不多，认知复杂度看读起来费不费劲，嵌套深度看你是不是套娃爱好者，还有函数长度、错误处理覆盖率、命名规范、代码重复率。每个文件一个分数，全项目汇总成'屎山指数'——100 分干净清爽，0 分就是……你懂的。输出格式四种任选：`--format json` 给程序用、`--format markdown` 贴 README、`--format html` 发群里公开处刑，默认终端彩色输出直接看。"

**视觉**:
- 上半部分：七维卡片逐个浮现（复杂度、认知、嵌套、函数长度、错误处理、命名、重复）
- 下半部分：TerminalBox 展示彩色分析报告

**TerminalBox 内容**:
```
$ fuck-u-code analyze --format console

  ┌─────────────────────────────────┐
  │   Shit Mountain Index: 72/100   │
  │   ⚠ Warning: 3 files need love  │
  ├─────────────────────────────────┤
  │  Worst Files:                   │
  │  1. src/main.go      Score: 34 │
  │  2. src/utils.py     Score: 45 │
  │  3. src/legacy.js    Score: 51 │
  └─────────────────────────────────┘
```

---

### 场景 4：AI 审查（840fps, ~28s）

**旁白**: "光打分还不够，它还能让 AI 帮你 review。`fuck-u-code ai-review` 自动把最烂的文件发给大模型，支持 OpenAI、Anthropic、DeepSeek、Gemini，或者本地跑 Ollama 完全离线。配置方式也灵活——CLI 传参数、环境变量、或者 `.fuckucoderc.json` 配置文件都行。AI 会告诉你具体哪里有问题、怎么改。"

**视觉**: AI 提供商 Logo 横向排列 + TerminalBox 展示 AI Review 输出。

**TerminalBox 内容**:
```
$ fuck-u-code ai-review \
  --provider deepseek \
  --model deepseek-chat

  🤖 AI Review Results:
  ┌─ src/main.go (Score: 34) ─┐
  │ ❌ handleRequest() is too  │
  │    complex (CC: 24)       │
  │ 💡 Split into smaller     │
  │    functions (< 20 lines) │
  │ ❌ Error ignored at L42   │
  │ 💡 Add proper error log   │
  └────────────────────────────┘
```

---

### 场景 5：MCP & 生态（750fps, ~25s）

**旁白**: "更进阶的玩法是 MCP Server 集成。`fuck-u-code mcp-install` 一行注册到 Claude Code 或 Cursor，AI 编程助手直接变身代码评审官——你说'分析这个项目'，它就自动跑。配置文件支持 JSON、YAML、JS 三种格式，七个维度的权重都能自定义。MIT 开源协议，中英俄三语支持，Star 蹭蹭涨。"

**视觉**: 
- 架构示意图：Claude Code / Cursor ← MCP → fuck-u-code
- TerminalBox 展示 `mcp-install` 输出
- 右下角配置多格式图标

**TerminalBox 内容**:
```
$ fuck-u-code mcp-install claude

  ✅ MCP server registered
  📁 ~/.claude.json updated
  🔧 Tools: analyze, ai-review
```

---

### 场景 6：收尾（390fps, ~13s）

**旁白**: "代码写得好不好，嘴上说了不算。`fuck-u-code analyze` 跑一遍，分数说话。关注我，下期见。"

**视觉**: 简洁结尾卡 + GitHub 仓库链接。

---

## 三、帧计算

| 场景 | 内容帧 | 转场 |
|------|--------|------|
| 1 痛点 | 660 | fade 6f |
| 2 安装 | 750 | fade 6f |
| 3 核心 | 960 | slide 8f |
| 4 AI | 840 | slide 8f |
| 5 生态 | 750 | fade 6f |
| 6 收尾 | 390 | - |
| **总计** | **4350** | **+34** = **4384f** |

取整 **4400fps** ≈ 146s ≈ 2:26

---

## 四、视觉设计

### 配色（沿用现有白色卡牌风）

```typescript
const C = {
  bg: "#F8F9FC",
  bgCard: "#FFFFFF",
  bgCard2: "#F0F2F8",
  accent: "#2563EB",    // 蓝色主调
  accent2: "#059669",   // 绿色（终端输出）
  accent3: "#D97706",   // 橙色（警告）
  accent4: "#DC2626",   // 红色（严重）
  text: "#1F2937",
  textDim: "#9CA3AF",
  textMid: "#6B7280",
  border: "#E5E7EB",
  shadow: "0 2px 12px rgba(0,0,0,0.06)",
};
```

### 终端模拟配色
```typescript
const TERMINAL = {
  bg: "#1E1E2E",        // 深色终端背景
  titleBar: "#2D2D3F",
  text: "#CDD6F4",       // 普通输出
  prompt: "#A6E3A1",     // 命令/提示符
  error: "#F38BA8",      // 错误
  warning: "#FAB387",    // 警告
  accent: "#89B4FA",     // 蓝色高亮
};
```

---

## 五、组件架构

```
src/FuckUCode/
├── index.tsx                    # 主视频组件（TransitionSeries）
├── constants.ts                 # 配色、时长、字幕文本
├── components/
│   ├── TitleCard.tsx            # 标题卡
│   ├── TerminalBox.tsx          # 终端模拟（可复用）
│   ├── LangTags.tsx             # 14 种语言标签
│   ├── DimensionCards.tsx       # 七维分析卡片
│   └── AIProviderLogos.tsx      # AI 提供商 Logo
```

**TerminalBox 接口**:
```typescript
interface TerminalBoxProps {
  lines: TerminalLine[];          // 每行的内容和类型
  title?: string;                 // 标题栏文字
  startFrame: number;             // 动画起始帧
}
type TerminalLine =
  | { type: "command"; text: string }
  | { type: "output"; text: string }
  | { type: "error"; text: string }
  | { type: "report"; text: string }  // 彩色报告块
  | { type: "empty" };
```

---

## 六、TTS 生成

- 脚本路径: `scripts/fuckucode/generate_fuckucode_tts.py`
- 音频输出: `public/fuckucode/`
- 语音: `zh-CN-XiaoyiNeural` (Cartoon 风格活泼女声), rate `+8%`
- 字幕文本: 硬编码在 `src/FuckUCode/index.tsx` 的 `SUBTITLE_TEXTS` 对象中
- 时长文件: `public/fuckucode/durations_fuckucode.json`
