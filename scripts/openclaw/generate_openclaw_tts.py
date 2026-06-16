"""
Generate TTS audio for OpenClaw video using edge-tts Python API.
Usage: python -X utf8 scripts/generate_openclaw_tts.py
"""
import asyncio
import json
import os
import subprocess
import sys

# ─── 配置 ─────────────────────────────────────────
VOICE = "zh-CN-YunxiNeural"
OUT_DIR = "public/voice"
DURATIONS_FILE = os.path.join(OUT_DIR, "durations_openclaw.json")

# ─── 旁白文案（纯中文）─────────────────────────────
SCRIPTS = {
    "openclaw_title": (
        "AIA智能体的新时代已经到来。一个开源的本地优先AI智能体框架，"
        "前身名为爪形机器人，目前在代码托管平台星标超过三十一万。"
        "它不同于只能在网页聊天的AI助手，能真正接管键盘鼠标，自动完成各类实际操作任务。"
    ),
    "openclaw_abilities": (
        "这不是普通的聊天机器人，而是真正能动手干活的智能助手。"
        "用自然语言下达指令，就能在电脑上自动执行文件操作、网页抓取、数据处理。"
        "一句话部署容器、抓取竞品价格生成报表，都是它的拿手好戏。"
    ),
    "openclaw_local": (
        "框架采用本地优先设计理念。所有数据不出本地，完全离线运行。"
        "运行在终端中，通过系统接口直接调用计算机的底层能力。"
        "无需云服务，你的数据始终在你的掌控之中。"
    ),
    "openclaw_models": (
        "中国社区版原生支持多款国产大模型，大幅降低使用成本。"
        "同时支持二十多种通讯平台集成，包括飞书和企业微信等国内主流办公工具。"
        "通过技能系统，功能可以无限扩展。"
    ),
    "openclaw_usecases": (
        "自动化运维方面，一句话部署容器、查询系统负载。"
        "信息搜集方面，自动打开浏览器，抓取竞品信息生成数据报表。"
        "办公提效方面，整理桌面杂乱文件，按日期重命名归档，样样精通。"
    ),
    "openclaw_outro": (
        "框架基于开源协议发布，全球开发者共同建设。"
        "安装简便，文档齐全，社区活跃。无论是个人效率提升，"
        "还是企业自动化方案，它都是得力助手。感谢观看，下期再见。"
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
    print("  OpenClaw TTS Generator")
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
