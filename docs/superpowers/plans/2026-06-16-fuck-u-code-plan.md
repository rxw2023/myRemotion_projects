# FuckUCode 科普视频实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建介绍 fuck-u-code 代码质量分析工具的竖版幽默科普视频，6 场景 TTS 驱动。

**Architecture:** 遵循项目现有的 TTS 驱动模式——每个场景一个 React.FC，通过 TransitionSeries + fade/slide 转场串联。TerminalBox 作为可复用子组件。音频由 Python edge-tts 脚本生成。

**Tech Stack:** Remotion, React, TypeScript, edge-tts (Python), tree-sitter CSS

---

## 文件结构

```
src/FuckUCode/
├── index.tsx              # 主视频（TransitionSeries + 6 场景组件 + 配色/字幕/时长）
├── components/
│   └── TerminalBox.tsx    # 终端模拟组件（逐行动画）

scripts/fuckucode/
└── generate_fuckucode_tts.py   # TTS 音频生成

修改:
- src/Root.tsx             # 添加 FuckUCode composition
```

---

### Task 1: TTS 音频生成脚本

**Files:**
- Create: `scripts/fuckucode/generate_fuckucode_tts.py`

- [ ] **Step 1: 创建 TTS 生成脚本**

参照 `scripts/openclaw/generate_openclaw_tts.py` 的模式，创建以下脚本：

```python
"""
Generate TTS audio for FuckUCode video using edge-tts Python API.
Usage: python -X utf8 scripts/fuckucode/generate_fuckucode_tts.py
"""
import asyncio
import json
import os
import subprocess
import sys

# ─── 配置 ─────────────────────────────────────────
VOICE = "zh-CN-XiaoyiNeural"
OUT_DIR = "public/fuckucode"
DURATIONS_FILE = os.path.join(OUT_DIR, "durations_fuckucode.json")

# ─── 旁白文案（纯中文）─────────────────────────────
SCRIPTS = {
    "fuckucode_pain": (
        "你的代码库是不是越来越像一锅意大利面？嵌套十层的ifelse，一个函数三百行，注释？不存在的。"
        "每次改代码都像拆炸弹——碰哪里都炸。今天介绍一个工具，专门给代码质量打分，"
        "名字也很直接——fuck-u-code，代号'屎山检测器'。"
    ),
    "fuckucode_install": (
        "安装很简单，一行命令全局搞定：npm install -g fuck-u-code。装完就能用，"
        "支持Go、Python、JavaScript、TypeScript、Rust、Java、C、C++等十四种语言。"
        "它基于tree-sitter做AST语法树解析——不是简单的关键词匹配，是真正读懂你的代码结构。"
        "进入项目目录，敲下fuck-u-code analyze，一键扫描。"
    ),
    "fuckucode_dimensions": (
        "analyze命令从七个维度给代码打分。圈复杂度看逻辑分叉多不多，"
        "认知复杂度看读起来费不费劲，嵌套深度看你是不是套娃爱好者，"
        "还有函数长度、错误处理覆盖率、命名规范、代码重复率。"
        "每个文件一个分数，全项目汇总成'屎山指数'——100分干净清爽，0分就是……你懂的。"
        "输出格式四种任选：--format json给程序用、--format markdown贴README、"
        "--format html发群里公开处刑，默认终端彩色输出直接看。"
    ),
    "fuckucode_aireview": (
        "光打分还不够，它还能让AI帮你review。fuck-u-code ai-review自动把最烂的文件发给大模型，"
        "支持OpenAI、Anthropic、DeepSeek、Gemini，或者本地跑Ollama完全离线。"
        "配置方式也灵活——CLI传参数、环境变量、或者.fuckucoderc.json配置文件都行。"
        "AI会告诉你具体哪里有问题、怎么改。"
    ),
    "fuckucode_mcp": (
        "更进阶的玩法是MCP Server集成。fuck-u-code mcp-install一行注册到Claude Code或Cursor，"
        "AI编程助手直接变身代码评审官——你说'分析这个项目'，它就自动跑。"
        "配置文件支持JSON、YAML、JS三种格式，七个维度的权重都能自定义。"
        "MIT开源协议，中英俄三语支持，Star蹭蹭涨。"
    ),
    "fuckucode_outro": (
        "代码写得好不好，嘴上说了不算。fuck-u-code analyze跑一遍，分数说话。关注我，下期见。"
    ),
}

# ffprobe 路径
FFPROBE = os.path.join(
    "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"
)
if not os.path.exists(FFPROBE):
    FFPROBE = "ffprobe"


async def generate_tts(key: str, text: str, out_path: str):
    """使用 edge_tts Python API 生成 MP3 文件"""
    import edge_tts

    print(f"  Generating {key} ({len(text)} chars)...")
    communicate = edge_tts.Communicate(text, VOICE, rate="+8%")
    await communicate.save(out_path)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  OK: {key}.mp3 ({size_kb:.1f} KB)")
    return True


def get_duration_seconds(filepath: str) -> float:
    """用 mutagen 获取 MP3 精确时长，失败则回退 ffprobe"""
    # 方案一：mutagen
    try:
        from mutagen.mp3 import MP3
        audio = MP3(filepath)
        return audio.info.length
    except Exception:
        import traceback
        print(f"  DEBUG: mutagen failed for {filepath}, falling back to ffprobe...")
        traceback.print_exc()

    # 方案二：ffprobe
    try:
        result = subprocess.run(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, timeout=15, check=True,
        )
        return float(result.stdout.strip())
    except Exception as e:
        import traceback
        print(f"  ERROR: Cannot get duration for {filepath} — all methods failed.")
        print(f"  mutagen + ffprobe both errored. File may be corrupt or missing.")
        print(f"  Exception: {e}")
        traceback.print_exc()
        raise RuntimeError(
            f"Failed to determine duration for {filepath}. "
            f"Ensure the MP3 file exists and is valid."
        ) from e


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    durations = {}

    print("\n" + "=" * 55)
    print("  FuckUCode TTS Generator")
    print(f"  Voice: {VOICE}  |  Rate: +8%")
    print("=" * 55 + "\n")

    for key, text in SCRIPTS.items():
        out_path = os.path.join(OUT_DIR, f"{key}.mp3")
        try:
            await generate_tts(key, text, out_path)
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"  ERROR: {key} failed: {e}")
            print(f"  Retrying via CLI...")
            try:
                edge_cmd = os.path.join(
                    os.path.dirname(sys.executable), "Scripts", "edge-tts.exe"
                )
                if not os.path.exists(edge_cmd):
                    edge_cmd = "edge-tts"
                proc = await asyncio.create_subprocess_exec(
                    edge_cmd, "--voice", VOICE, "--text", text,
                    "--write-media", out_path, "--rate=+8%",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                _, stderr = await proc.communicate()
                if proc.returncode != 0:
                    print(f"  CLI also failed: {stderr.decode()}")
                    sys.exit(1)
                size_kb = os.path.getsize(out_path) / 1024
                print(f"  CLI OK: {key}.mp3 ({size_kb:.1f} KB)")
            except Exception as e2:
                print(f"  ALL methods failed for {key}: {e2}")
                sys.exit(1)

    print("\n" + "-" * 55)
    print("  Calculating durations...")
    print("-" * 55 + "\n")

    for key in SCRIPTS:
        path = os.path.join(OUT_DIR, f"{key}.mp3")
        dur = get_duration_seconds(path)
        durations[key] = round(dur, 2)
        print(f"  {key}: {dur:.2f}s")

    with open(DURATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 55)
    print("  TTS Duration Summary (30fps)")
    print("=" * 55)
    total_frames = 0
    for key, dur in durations.items():
        frames = int(dur * 30)
        rec_frames = frames + 40
        total_frames += rec_frames
        print(f"  {key:<30s}  {dur:>5.1f}s  =  {frames:>4d}f  ->  rec: {rec_frames:>4d}f")
    total_frames += 34  # transitions: 6+8+6+8+6
    print(f"  {'(transitions)':<30s}  {'':>5s}     {'':>4s}     {'+34f':>6s}")
    print(f"  {'TOTAL':<30s}  {'':>5s}     {'':>4s}     {'':>9s}{total_frames:>4d}f")
    print("=" * 55 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: 运行 TTS 生成脚本**

```bash
python -X utf8 scripts/fuckucode/generate_fuckucode_tts.py
```

预期输出：6 个 MP3 文件生成到 `public/fuckucode/`，控制台打印时长汇总。

- [ ] **Step 3: 记录每段音频的实际帧数**

从控制台输出读取 `rec_frames`（推荐帧数），这些值将用于更新 `DURATIONS` 对象。

- [ ] **Step 4: 提交 TTS 脚本**

```bash
git add scripts/fuckucode/generate_fuckucode_tts.py public/fuckucode/durations_fuckucode.json
git commit -m "feat: add FuckUCode TTS generation script"
```

> 注意：`public/fuckucode/*.mp3` 不提交（通过 .gitignore），本地生成即可。

---

### Task 2: TerminalBox 组件

**Files:**
- Create: `src/FuckUCode/components/TerminalBox.tsx`

- [ ] **Step 1: 创建 TerminalBox 组件**

```typescript
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

// ==================== 终端配色 ====================
const T = {
  bg: "#1E1E2E",
  titleBar: "#2D2D3F",
  text: "#CDD6F4",
  prompt: "#A6E3A1",
  error: "#F38BA8",
  warning: "#FAB387",
  accent: "#89B4FA",
  dim: "#6C7086",
  titleText: "#BAC2DE",
  dotRed: "#F38BA8",
  dotYellow: "#FAB387",
  dotGreen: "#A6E3A1",
};

// ==================== 行数据类型 ====================
export type TerminalLine =
  | { type: "command"; text: string }
  | { type: "output"; text: string }
  | { type: "error"; text: string }
  | { type: "warning"; text: string }
  | { type: "accent"; text: string }
  | { type: "empty" }
  | { type: "header"; text: string }
  | { type: "prompt"; text: string };  // 空提示符，等待输入的感觉

// ==================== Props ====================
interface TerminalBoxProps {
  lines: TerminalLine[];
  title?: string;
  startFrame?: number;
  /** 每行的打字动画延迟（帧），默认 8 */
  lineDelay?: number;
  style?: React.CSSProperties;
}

// ==================== 组件 ====================
export const TerminalBox: React.FC<TerminalBoxProps> = ({
  lines,
  title = "Terminal",
  startFrame = 0,
  lineDelay = 8,
  style,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);

  // 整体透明度入场
  const boxOpacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      opacity: boxOpacity,
      background: T.bg,
      borderRadius: 14,
      border: `1px solid ${T.titleBar}`,
      boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
      overflow: "hidden",
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
      fontSize: 17,
      lineHeight: 1.7,
      maxWidth: 820,
      width: "100%",
      ...style,
    }}>
      {/* 标题栏 */}
      <div style={{
        background: T.titleBar,
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: T.dotRed }} />
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: T.dotYellow }} />
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: T.dotGreen }} />
        </div>
        <span style={{
          color: T.titleText, fontSize: 14, marginLeft: 8,
          fontWeight: 500, letterSpacing: 0.5,
        }}>
          {title}
        </span>
      </div>

      {/* 终端内容 */}
      <div style={{ padding: "16px 22px" }}>
        {lines.map((line, i) => {
          const lineStart = i * lineDelay;
          const lineOpacity = interpolate(localFrame, [lineStart, lineStart + 3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          if (line.type === "empty") {
            return <div key={i} style={{ height: 8 }} />;
          }

          const colorMap: Record<string, string> = {
            command: T.prompt,
            output: T.text,
            error: T.error,
            warning: T.warning,
            accent: T.accent,
            header: T.accent,
            prompt: T.prompt,
          };

          return (
            <div key={i} style={{
              opacity: lineOpacity,
              color: colorMap[line.type] || T.text,
              whiteSpace: "pre-wrap",
              paddingBottom: 1,
            }}>
              {line.type === "command" || line.type === "prompt"
                ? <><span style={{ color: T.prompt }}>$ </span>{line.text}</>
                : line.text
              }
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 提交 TerminalBox 组件**

```bash
git add src/FuckUCode/components/TerminalBox.tsx
git commit -m "feat: add TerminalBox component for FuckUCode video"
```

---

### Task 3: 主视频文件（index.tsx）

**Files:**
- Create: `src/FuckUCode/index.tsx`

- [ ] **Step 1: 创建主视频文件**

整个文件约 500 行，包含 6 个场景组件。下面按照文件结构逐步编写。

**第 1 部分：头部导入 + 常量定义**

```typescript
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { TerminalBox } from "./components/TerminalBox";
import type { TerminalLine } from "./components/TerminalBox";

// ==================== 配色 ====================
const C = {
  bg: "#F8F9FC",
  bgCard: "#FFFFFF",
  bgCard2: "#F0F2F8",
  accent: "#2563EB",
  accent2: "#059669",
  accent3: "#D97706",
  accent4: "#DC2626",
  accent5: "#7C3AED",
  text: "#1F2937",
  textDim: "#9CA3AF",
  textMid: "#6B7280",
  border: "#E5E7EB",
  shadow: "0 2px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 4px 24px rgba(0,0,0,0.08)",
};

// ==================== 通用动画组件 ====================

const FadeIn: React.FC<{
  delay: number; children: React.ReactNode; style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 12], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>{children}</div>;
};

const SlideUp: React.FC<{
  delay: number; children: React.ReactNode; style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 14], [40, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>{children}</div>;
};
```

**第 2 部分：字幕数据 + 字幕组件**

```typescript
// ==================== 字幕文本 ====================
const SUBTITLE_TEXTS: Record<string, string> = {
  pain: (
    "你的代码库是不是越来越像一锅意大利面？嵌套十层的ifelse，一个函数三百行，注释？不存在的。"
    "每次改代码都像拆炸弹——碰哪里都炸。今天介绍一个工具，专门给代码质量打分，"
    "名字也很直接——fuck-u-code，代号'屎山检测器'。"
  ),
  install: (
    "安装很简单，一行命令全局搞定：npm install -g fuck-u-code。装完就能用，"
    "支持Go、Python、JavaScript、TypeScript、Rust、Java、C、C++等十四种语言。"
    "它基于tree-sitter做AST语法树解析——不是简单的关键词匹配，是真正读懂你的代码结构。"
    "进入项目目录，敲下fuck-u-code analyze，一键扫描。"
  ),
  dimensions: (
    "analyze命令从七个维度给代码打分。圈复杂度看逻辑分叉多不多，"
    "认知复杂度看读起来费不费劲，嵌套深度看你是不是套娃爱好者，"
    "还有函数长度、错误处理覆盖率、命名规范、代码重复率。"
    "每个文件一个分数，全项目汇总成'屎山指数'——100分干净清爽，0分就是……你懂的。"
    "输出格式四种任选：--format json给程序用、--format markdown贴README、"
    "--format html发群里公开处刑，默认终端彩色输出直接看。"
  ),
  aireview: (
    "光打分还不够，它还能让AI帮你review。fuck-u-code ai-review自动把最烂的文件发给大模型，"
    "支持OpenAI、Anthropic、DeepSeek、Gemini，或者本地跑Ollama完全离线。"
    "配置方式也灵活——CLI传参数、环境变量、或者.fuckucoderc.json配置文件都行。"
    "AI会告诉你具体哪里有问题、怎么改。"
  ),
  mcp: (
    "更进阶的玩法是MCP Server集成。fuck-u-code mcp-install一行注册到Claude Code或Cursor，"
    "AI编程助手直接变身代码评审官——你说'分析这个项目'，它就自动跑。"
    "配置文件支持JSON、YAML、JS三种格式，七个维度的权重都能自定义。"
    "MIT开源协议，中英俄三语支持，Star蹭蹭涨。"
  ),
  outro: (
    "代码写得好不好，嘴上说了不算。fuck-u-code analyze跑一遍，分数说话。关注我，下期见。"
  ),
};

// 占位值——TTS 生成后用实际时长替换
const DURATIONS = {
  pain: 660,
  install: 750,
  dimensions: 960,
  aireview: 840,
  mcp: 750,
  outro: 390,
};

// ==================== 字幕组件 ====================
const SubtitleBar: React.FC<{
  sceneKey: string;
  startFrame?: number;
  endFrame?: number;
}> = ({ sceneKey, startFrame = 0, endFrame = 9999 }) => {
  const frame = useCurrentFrame();
  const text = SUBTITLE_TEXTS[sceneKey] || "";
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 8, endFrame - 5, endFrame - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div style={{
      position: "absolute", bottom: 56, left: 0, right: 0,
      display: "flex", justifyContent: "center", zIndex: 100, opacity,
    }}>
      <div style={{
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
        borderRadius: 14, padding: "14px 36px", maxWidth: "88%",
        textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      }}>
        <span style={{
          color: "#FFFFFF", fontSize: 26, fontWeight: 500,
          letterSpacing: 1.2, lineHeight: 1.6,
        }}>{text}</span>
      </div>
    </div>
  );
};
```

**第 3 部分：场景 1 — 痛点开场**

```typescript
// ==================== 场景1：痛点开场 ====================
const PainScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });
  const tagOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // 凌乱代码片段
  const codeSnippets = [
    { text: "if (a) { if (b) { if (c) { ... } } }", x: "8%", y: "12%", rot: -8 },
    { text: "function doAllTheThings() {\n  // 300 lines...\n}", x: "55%", y: "8%", rot: 5 },
    { text: "try { ... }\ncatch(e) { }", x: "12%", y: "45%", rot: 3 },
    { text: "const x = foo(bar(\n  baz(qux(...)))\n)", x: "60%", y: "42%", rot: -4 },
    { text: "// TODO: refactor\n// (never happens)", x: "30%", y: "72%", rot: 6 },
  ];

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, #FEE2E2 30%, #FEF3C7 70%)`,
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "60px",
    }}>
      <Audio src={staticFile("fuckucode/fuckucode_pain.mp3")} />
      <SubtitleBar sceneKey="pain" startFrame={0} endFrame={DURATIONS.pain} />

      {/* 凌乱代码片段背景 */}
      {codeSnippets.map((s, i) => {
        const delay = i * 6;
        const opacity = interpolate(frame, [delay, delay + 10, DURATIONS.pain - 40, DURATIONS.pain - 20], [0, 1, 1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{
            position: "absolute", left: s.x, top: s.y,
            opacity, transform: `rotate(${s.rot}deg)`,
            background: "rgba(255,255,255,0.75)", borderRadius: 10,
            padding: "10px 16px", boxShadow: C.shadow,
            fontFamily: "'Fira Code', 'Consolas', monospace",
            fontSize: 14, color: C.accent4, lineHeight: 1.5,
            border: `1px solid ${C.accent4}20`,
          }}>
            {s.text}
          </div>
        );
      })}

      {/* 主标题 */}
      <div style={{
        fontSize: 56, fontWeight: "bold", color: C.accent4,
        transform: `scale(${titleScale})`,
        letterSpacing: 4, textAlign: "center", lineHeight: 1.3,
        zIndex: 10,
      }}>
        fuck-u-code
      </div>

      {/* 副标题 */}
      <div style={{
        fontSize: 24, color: C.textMid, marginTop: 20,
        opacity: tagOpacity, letterSpacing: 3, textAlign: "center",
        zIndex: 10,
      }}>
        你的代码 · 几斤几两 · 一跑就知道
      </div>
    </AbsoluteFill>
  );
};
```

**第 4 部分：场景 2 — 安装 & 上手**

```typescript
// ==================== 场景2：安装 & 上手 ====================
const InstallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const langs = [
    { name: "Go", color: "#00ADD8" },
    { name: "Python", color: "#3776AB" },
    { name: "JavaScript", color: "#F7DF1E" },
    { name: "TypeScript", color: "#3178C6" },
    { name: "Rust", color: "#DEA584" },
    { name: "Java", color: "#ED8B00" },
    { name: "C", color: "#A8B9CC" },
    { name: "C++", color: "#00599C" },
    { name: "C#", color: "#239120" },
    { name: "Lua", color: "#000080" },
    { name: "PHP", color: "#777BB4" },
    { name: "Ruby", color: "#CC342D" },
    { name: "Swift", color: "#F05138" },
    { name: "Shell", color: "#4EAA25" },
  ];

  const terminalLines: TerminalLine[] = [
    { type: "command", text: "npm install -g fuck-u-code" },
    { type: "output", text: "" },
    { type: "output", text: "+ fuck-u-code@1.5.0" },
    { type: "output", text: "added 142 packages in 3s" },
    { type: "empty" },
    { type: "command", text: "fuck-u-code analyze" },
    { type: "output", text: "🔍 Scanning project..." },
    { type: "output", text: "✓ 33 files analyzed in 1.4s" },
    { type: "empty" },
    { type: "output", text: "Shit Mountain Index: 72/100" },
    { type: "warning", text: "⚠ 3 files need serious love" },
  ];

  return (
    <AbsoluteFill style={{
      background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "50px 36px",
    }}>
      <Audio src={staticFile("fuckucode/fuckucode_install.mp3")} />
      <SubtitleBar sceneKey="install" startFrame={0} endFrame={DURATIONS.install} />

      <SlideUp delay={0}>
        <h1 style={{
          fontSize: 42, fontWeight: "bold", color: C.text,
          marginBottom: 8, letterSpacing: 2, textAlign: "center",
        }}>
          一行命令 · 即刻开扫
        </h1>
      </SlideUp>

      {/* TerminalBox */}
      <SlideUp delay={4}>
        <TerminalBox
          lines={terminalLines}
          title="fuck-u-code"
          startFrame={10}
          lineDelay={9}
          style={{ marginTop: 8 }}
        />
      </SlideUp>

      {/* 语言标签墙 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8,
        justifyContent: "center", marginTop: 16,
        maxWidth: 700,
      }}>
        {langs.map((lang, i) => {
          const delay = 30 + i * 3;
          const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <span key={lang.name} style={{
              opacity,
              background: `${lang.color}18`,
              color: lang.color,
              border: `1.5px solid ${lang.color}40`,
              borderRadius: 8,
              padding: "4px 14px",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}>
              {lang.name}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

**第 5 部分：场景 3 — 七维分析**

```typescript
// ==================== 场景3：七维分析 ====================
const DimensionsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dimensions = [
    { icon: "🔄", label: "圈复杂度", desc: "逻辑分叉多不多？", color: C.accent, score: "85" },
    { icon: "🧠", label: "认知复杂度", desc: "读起来费不费劲？", color: C.accent2, score: "72" },
    { icon: "📐", label: "嵌套深度", desc: "是不是套娃爱好者？", color: C.accent3, score: "90" },
    { icon: "📏", label: "函数长度", desc: "一个函数三百行？", color: C.accent4, score: "68" },
    { icon: "🛡️", label: "错误处理", desc: "try-catch 写了没？", color: C.accent5, score: "55" },
    { icon: "🏷️", label: "命名规范", desc: "a、b、x、foo？", color: "#0891B2", score: "92" },
    { icon: "📋", label: "代码重复", desc: "Ctrl+C / Ctrl+V？", color: "#DB2777", score: "60" },
  ];

  const reportLines: TerminalLine[] = [
    { type: "header", text: "┌──── Shit Mountain Index ────┐" },
    { type: "accent", text: "│  Overall Score:  72 / 100   │" },
    { type: "warning", text: "│  ⚠ 3 files need love       │" },
    { type: "header", text: "├─────────────────────────────┤" },
    { type: "error", text: "│  1. src/main.go   34 pts   │" },
    { type: "warning", text: "│  2. src/utils.py  45 pts   │" },
    { type: "warning", text: "│  3. src/legacy.js 51 pts   │" },
    { type: "header", text: "└─────────────────────────────┘" },
  ];

  return (
    <AbsoluteFill style={{
      background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "44px 32px",
    }}>
      <Audio src={staticFile("fuckucode/fuckucode_dimensions.mp3")} />
      <SubtitleBar sceneKey="dimensions" startFrame={0} endFrame={DURATIONS.dimensions} />

      <SlideUp delay={0}>
        <h1 style={{
          fontSize: 42, fontWeight: "bold", color: C.text,
          marginBottom: 4, letterSpacing: 2, textAlign: "center",
        }}>
          七维分析 · 全方位体检
        </h1>
      </SlideUp>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 860 }}>
        {/* 左侧：维度卡片 */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          flex: 1, maxWidth: 480,
        }}>
          {dimensions.map((d, i) => {
            const delay = 4 + i * 5;
            const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const barWidth = interpolate(frame, [delay + 4, delay + 14], [0, Number(d.score)], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <div key={d.label} style={{
                opacity,
                display: "flex", alignItems: "center", gap: 10,
                background: C.bgCard, borderRadius: 10,
                padding: "8px 14px", boxShadow: C.shadow,
                border: `1px solid ${d.color}20`,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{d.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: 0.5 }}>
                      {d.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: d.color }}>{d.score}</span>
                  </div>
                  <div style={{
                    height: 5, borderRadius: 3, background: C.bgCard2,
                    marginTop: 3, overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${barWidth}%`, height: "100%",
                      background: d.color, borderRadius: 3,
                      transition: "width 0.1s",
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 右侧：终端报告 */}
        <SlideUp delay={20}>
          <TerminalBox
            lines={reportLines}
            title="analysis report"
            startFrame={25}
            lineDelay={6}
            style={{ marginTop: 12 }}
          />
        </SlideUp>
      </div>
    </AbsoluteFill>
  );
};
```

**第 6 部分：场景 4 — AI 审查**

```typescript
// ==================== 场景4：AI 审查 ====================
const AIReviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const providers = [
    { name: "OpenAI", color: "#10A37F" },
    { name: "Anthropic", color: "#D97706" },
    { name: "DeepSeek", color: "#4F46E5" },
    { name: "Gemini", color: "#4285F4" },
    { name: "Ollama", color: "#FFFFFF", border: "#D1D5DB", textColor: "#1F2937" },
  ];

  const reviewLines: TerminalLine[] = [
    { type: "command", text: "fuck-u-code ai-review --provider deepseek" },
    { type: "empty" },
    { type: "accent", text: "🤖 AI Review Results:" },
    { type: "header", text: "┌─ src/main.go (Score: 34) ─┐" },
    { type: "error", text: "│ ❌ handleRequest() too    │" },
    { type: "error", text: "│    complex (CC: 24)       │" },
    { type: "accent", text: "│ 💡 Split into 3 smaller  │" },
    { type: "accent", text: "│    functions (< 20 lines) │" },
    { type: "empty" },
    { type: "error", text: "│ ❌ Error ignored at L:42  │" },
    { type: "accent", text: "│ 💡 Add proper error log   │" },
    { type: "header", text: "└──────────────────────────┘" },
  ];

  return (
    <AbsoluteFill style={{
      background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "50px 36px",
    }}>
      <Audio src={staticFile("fuckucode/fuckucode_aireview.mp3")} />
      <SubtitleBar sceneKey="aireview" startFrame={0} endFrame={DURATIONS.aireview} />

      <SlideUp delay={0}>
        <h1 style={{
          fontSize: 42, fontWeight: "bold", color: C.text,
          marginBottom: 4, letterSpacing: 2, textAlign: "center",
        }}>
          AI 加持 · 智能审查
        </h1>
      </SlideUp>

      {/* AI Provider 标签 */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap",
        justifyContent: "center", marginTop: 8,
      }}>
        {providers.map((p, i) => {
          const delay = 5 + i * 5;
          const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          return (
            <span key={p.name} style={{
              opacity,
              background: p.color + "18",
              color: p.textColor || p.color,
              border: `1.5px solid ${p.border || p.color + "40"}`,
              borderRadius: 10,
              padding: "6px 18px",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}>
              {p.name}
            </span>
          );
        })}
      </div>

      {/* AI Review 终端输出 */}
      <SlideUp delay={25}>
        <TerminalBox
          lines={reviewLines}
          title="ai-review"
          startFrame={30}
          lineDelay={7}
          style={{ marginTop: 12 }}
        />
      </SlideUp>

      {/* 配置提示 */}
      <SlideUp delay={72}>
        <p style={{
          color: C.textMid, fontSize: 18, marginTop: 14,
          letterSpacing: 1, textAlign: "center",
        }}>
          CLI 参数 · 环境变量 · .fuckucoderc.json · 灵活配置
        </p>
      </SlideUp>
    </AbsoluteFill>
  );
};
```

**第 7 部分：场景 5 — MCP & 生态**

```typescript
// ==================== 场景5：MCP & 生态 ====================
const MCPScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mcpLines: TerminalLine[] = [
    { type: "command", text: "fuck-u-code mcp-install claude" },
    { type: "empty" },
    { type: "output", text: "✅ MCP Server registered" },
    { type: "output", text: "📁 ~/.claude.json updated" },
    { type: "accent", text: "🔧 Tools: analyze, ai-review" },
    { type: "empty" },
    { type: "output", text: "🧑‍💻 Try in Claude Code:" },
    { type: "prompt", text: "" },
    { type: "command", text: "analyze the current project" },
    { type: "output", text: "→ Auto-runs fuck-u-code analyze" },
  ];

  const leftOpacity = interpolate(frame, [5, 15], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const centerScale = spring({ frame: frame - 8, fps, config: { damping: 15, stiffness: 160 } });
  const rightOpacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: C.bg, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "50px 36px",
    }}>
      <Audio src={staticFile("fuckucode/fuckucode_mcp.mp3")} />
      <SubtitleBar sceneKey="mcp" startFrame={0} endFrame={DURATIONS.mcp} />

      <SlideUp delay={0}>
        <h1 style={{
          fontSize: 42, fontWeight: "bold", color: C.text,
          marginBottom: 8, letterSpacing: 2, textAlign: "center",
        }}>
          MCP Server · AI 生态整合
        </h1>
      </SlideUp>

      {/* 架构示意图：Claude Code ← MCP → fuck-u-code */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 24, marginTop: 10, width: "100%", maxWidth: 760,
      }}>
        {/* Claude Code */}
        <div style={{
          opacity: leftOpacity,
          background: C.bgCard, borderRadius: 16, padding: "20px 28px",
          boxShadow: C.shadowLg, border: `2px solid ${C.accent}30`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40 }}>🧠</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.accent, marginTop: 6 }}>Claude Code</div>
          <div style={{ fontSize: 14, color: C.textDim, marginTop: 2 }}>AI 编程助手</div>
        </div>

        {/* MCP 桥接 */}
        <div style={{
          transform: `scale(${centerScale})`,
          background: `linear-gradient(135deg, ${C.accent5}, ${C.accent})`,
          borderRadius: 16, padding: "14px 22px",
          color: "#FFF", textAlign: "center",
          boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 2 }}>MCP</div>
          <div style={{ fontSize: 28, marginTop: 2 }}>⟷</div>
        </div>

        {/* fuck-u-code */}
        <div style={{
          opacity: rightOpacity,
          background: C.bgCard, borderRadius: 16, padding: "20px 28px",
          boxShadow: C.shadowLg, border: `2px solid ${C.accent4}30`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40 }}>💩</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.accent4, marginTop: 6 }}>fuck-u-code</div>
          <div style={{ fontSize: 14, color: C.textDim, marginTop: 2 }}>代码分析引擎</div>
        </div>
      </div>

      {/* TerminalBox */}
      <SlideUp delay={28}>
        <TerminalBox
          lines={mcpLines}
          title="mcp-install"
          startFrame={33}
          lineDelay={9}
          style={{ marginTop: 14 }}
        />
      </SlideUp>

      {/* 底部信息 */}
      <SlideUp delay={78}>
        <div style={{
          display: "flex", gap: 18, marginTop: 12,
          color: C.textMid, fontSize: 16, letterSpacing: 1,
        }}>
          <span>📄 MIT 开源</span>
          <span>🌐 中·英·俄</span>
          <span>⚙️ JSON/YAML/JS 配置</span>
        </div>
      </SlideUp>
    </AbsoluteFill>
  );
};
```

**第 8 部分：场景 6 — 收尾 + 主组件组装**

```typescript
// ==================== 场景6：收尾 ====================
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ghOpacity = interpolate(frame, [6, 18], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const btnScale = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 140 } });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, #EFF6FF 50%, #EEF2FF 100%)`,
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "60px",
    }}>
      <Audio src={staticFile("fuckucode/fuckucode_outro.mp3")} />
      <SubtitleBar sceneKey="outro" startFrame={0} endFrame={DURATIONS.outro} />

      {/* 装饰粒子 */}
      {Array.from({ length: 20 }, (_, i) => {
        const x = (i * 137 + 50) % 100;
        const y = (i * 73 + 30) % 100;
        const px = interpolate(frame, [0, 60], [x, x + (i % 5 - 2)]);
        const py = interpolate(frame, [0, 60], [y, y - 4 - (i % 4)]);
        return (
          <div key={i} style={{
            position: "absolute", left: `${px}%`, top: `${py}%`,
            width: 3 + (i % 4), height: 3 + (i % 4),
            borderRadius: "50%",
            backgroundColor: i % 3 === 0 ? C.accent : C.accent5,
            opacity: 0.10 + (i % 5) * 0.05,
          }} />
        );
      })}

      <div style={{
        fontSize: 56, fontWeight: "bold", color: C.accent4,
        transform: `scale(${btnScale})`,
        letterSpacing: 4, textAlign: "center", lineHeight: 1.3,
      }}>
        fuck-u-code
      </div>

      <div style={{
        fontSize: 22, color: C.textMid, marginTop: 16,
        opacity: ghOpacity, letterSpacing: 2, textAlign: "center",
      }}>
        npm install -g fuck-u-code
      </div>

      <div style={{
        fontSize: 18, color: C.textMid, marginTop: 8,
        opacity: ghOpacity, letterSpacing: 1, textAlign: "center",
      }}>
        github.com/Done-0/fuck-u-code
      </div>

      <div style={{
        fontSize: 48, fontWeight: "bold", color: C.text,
        marginTop: 20, opacity: ghOpacity, letterSpacing: 3,
      }}>
        关注我 · 下期见 👋
      </div>
    </AbsoluteFill>
  );
};

// ==================== 主组件：TransitionSeries 串联 ====================

export const FuckUCode: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={DURATIONS.pain}>
        <PainScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 6 })}
        presentation={fade()}
      />
      <TransitionSeries.Sequence durationInFrames={DURATIONS.install}>
        <InstallScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 8 })}
        presentation={slide({ direction: "from-right" })}
      />
      <TransitionSeries.Sequence durationInFrames={DURATIONS.dimensions}>
        <DimensionsScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 8 })}
        presentation={slide({ direction: "from-right" })}
      />
      <TransitionSeries.Sequence durationInFrames={DURATIONS.aireview}>
        <AIReviewScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 6 })}
        presentation={fade()}
      />
      <TransitionSeries.Sequence durationInFrames={DURATIONS.mcp}>
        <MCPScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 6 })}
        presentation={fade()}
      />
      <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
```

- [ ] **Step 2: 提交主视频文件**

```bash
git add src/FuckUCode/index.tsx src/FuckUCode/components/TerminalBox.tsx
git commit -m "feat: add FuckUCode video main component with 6 scenes"
```

---

### Task 4: 注册 Composition

**Files:**
- Modify: `src/Root.tsx`

- [ ] **Step 1: 在 Root.tsx 添加 FuckUCode composition**

在 `src/Root.tsx` 中：

1. 在顶部导入区域添加：
```typescript
import { FuckUCode } from "./FuckUCode";
```

2. 在 `compositions` 数组的 `// ---- 竖版科普视频 ----` 区域（`OpenClaw` 后面）添加：
```typescript
  {
    id: "FuckUCode",
    component: FuckUCode,
    durationInFrames: 4384,
    orientation: "portrait",
    category: "video",
    description: "fuck-u-code 代码质量分析工具介绍",
  },
```

- [ ] **Step 2: 提交 Root.tsx 修改**

```bash
git add src/Root.tsx
git commit -m "feat: register FuckUCode composition"
```

---

### Task 5: 验证 & 调试

- [ ] **Step 1: 启动 Remotion Studio**

```bash
pnpm run dev
```

- [ ] **Step 2: 检查点**

1. 浏览器打开后，左侧列表应能看到 `FuckUCode` composition
2. 逐个检查 6 个场景的视觉呈现
3. 确认字幕与音频同步
4. 确认 TerminalBox 动画正常
5. 确认转场流畅

- [ ] **Step 3: 如果运行时发现缺少依赖，安装**

```bash
pnpm install
```

- [ ] **Step 4: 检查类型和 lint**

```bash
pnpm run lint
```

修复任何类型错误。

---

### Task 6: 最终提交

- [ ] **Step 1: 最终检查并提交**

```bash
pnpm run lint
git add -A
git commit -m "chore: finalize FuckUCode video"
```

---

## 后续调整

TTS 生成后，根据实际音频时长更新 `DURATIONS` 对象中的帧数，并同步更新 `Root.tsx` 中的 `durationInFrames`。总帧数 = 各场景帧数之和 - 转场帧数（6+8+8+6+6 = 34）。
