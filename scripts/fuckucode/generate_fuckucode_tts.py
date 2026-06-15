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
    total_frames += 34  # transitions: 6+8+8+6+6
    print(f"  {'(transitions)':<30s}  {'':>5s}     {'':>4s}     {'+34f':>6s}")
    print(f"  {'TOTAL':<30s}  {'':>5s}     {'':>4s}     {'':>9s}{total_frames:>4d}f")
    print("=" * 55 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
