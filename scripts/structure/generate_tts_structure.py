"""
Generate TTS audio for ComputerStructure video using edge-tts Python API.
Usage: python scripts/generate_tts_structure.py
"""
import asyncio
import json
import os
import subprocess
import sys

# ─── 配置 ─────────────────────────────────────────
VOICE = "zh-CN-YunxiNeural"  # 云希 - 男声，科普风格
OUT_DIR = "public/voice"
DURATIONS_FILE = os.path.join(OUT_DIR, "durations_structure.json")

# ─── 旁白文案（纯中文，避免英文词导致 edge-tts 报错）───
SCRIPTS = {
    "structure_title": "一台完整的计算机，由硬件系统和软件系统共同构成。硬件是物理设备，软件是指令和数据。",
    "structure_vonneumann": "冯诺依曼提出了存储程序思想，奠定了现代计算机的基本结构。冯诺依曼机由五大部件组成。运算器负责算术和逻辑运算。控制器读取并解码指令。存储器存放程序和数据。输入设备接收外部信息。输出设备反馈处理结果。",
    "structure_hwsw": "软件分为系统软件和应用软件。系统软件直接运行在硬件之上，为其他软件提供运行平台。应用软件解决用户的具体问题，提供交互界面。如果把硬件比作身体，那么软件就是灵魂。",
    "structure_languages": "编程语言分为三个级别。机器语言用二进制代码表示，中央处理器可以直接执行。汇编语言使用助记符替代二进制，更易编写。高级语言接近自然语言，与硬件无关，抽象度最高。三层语言，层层抽象。",
    "structure_source2exe": "从源程序到可执行程序，需要经过五个步骤。预处理进行宏替换和文件包含。编译将源代码转为汇编代码。汇编将汇编代码转为机器码。链接合并目标文件和库文件。最后由加载器将程序装入内存执行。",
    "structure_outro": "计算机系统的层次结构，从底层硬件到高层应用，层层封装，各司其职。感谢观看，我们下期再见。",
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
    """用 ffprobe 获取音频时长（秒）"""
    try:
        result = subprocess.run(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, timeout=15,
        )
        return float(result.stdout.strip())
    except Exception as e:
        print(f"  WARN: Cannot get duration for {filepath}: {e}")
        return 0.0


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    durations = {}

    print("\n" + "=" * 55)
    print("  ComputerStructure TTS Generator")
    print(f"  Voice: {VOICE}  |  Rate: +8%")
    print("=" * 55 + "\n")

    for key, text in SCRIPTS.items():
        out_path = os.path.join(OUT_DIR, f"{key}.mp3")
        try:
            await generate_tts(key, text, out_path)
            # 避免请求过快被限流
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"  ERROR: {key} failed: {e}")
            # fallback: use subprocess with CLI
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

    with open(DURATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 55)
    print("  TTS Duration Summary (30fps)")
    print("=" * 55)
    total_frames = 0
    for key, dur in durations.items():
        frames = int(dur * 30)
        rec_frames = frames + 50
        total_frames += rec_frames
        print(f"  {key:<28s}  {dur:>5.1f}s  =  {frames:>4d}f  →  rec: {rec_frames:>4d}f")
    total_frames += 36  # transitions: 8+6+8+6+8
    print(f"  {'(transitions)':<28s}  {'':>5s}     {'':>4s}     {'+36f':>6s}")
    print(f"  {'TOTAL':<28s}  {'':>5s}     {'':>4s}     {'':>4s}  {total_frames:>4d}f")
    print("=" * 55 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
