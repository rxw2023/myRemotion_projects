"""
Generate TTS audio for MemoryOrganization scenes using edge-tts.
Output: public/memory-organization/ directory with mp3 files + duration metadata.
"""
import asyncio
import json
import os
import subprocess

VOICE = "zh-CN-YunxiNeural"  # 云希 - 男声，科普风格
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "memory-organization")
os.makedirs(OUT_DIR, exist_ok=True)

# ffprobe from Remotion's node_modules
FFPROBE = os.path.join(
    BASE_DIR, "node_modules",
    "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"
)

SCRIPTS = {
    "scene1_title": (
        "主存工作原理。"
        "从DRAM芯片的1T1C结构，到多体交叉存储的流水线并行，"
        "让我们一起揭开计算机内存的奥秘。"
    ),
    "scene2_dram": (
        "DRAM动态随机存取存储器，采用1T1C结构，"
        "一个晶体管加一个电容存储一位数据。"
        "电容会漏电，所以需要定期刷新。"
        "三种刷新方式：集中刷新暂停访问集中完成，"
        "分散刷新穿插在存取周期中，"
        "异步刷新由外部控制器按需触发。"
    ),
    "scene3_interleave": (
        "多体交叉存储，将主存分成多个独立的存储体。"
        "高位交叉编址，高位选体、低位选体内地址，"
        "连续地址在同一体内，只能串行工作。"
        "低位交叉编址，低位选体、高位选体内地址，"
        "连续地址分布在不同体中，可以并行工作，大幅提升带宽。"
    ),
    "scene4_pipeline": (
        "低位交叉存储的流水线工作方式。"
        "假设存储周期为T，有n个存储体，"
        "则最小连续访问间隔为T除以n。"
        "读取操作分为三个阶段：发送地址、存储体读取数据、传输数据到总线。"
        "前一体的读取阶段与后一体的地址发送阶段重叠执行，实现流水线并行。"
    ),
    "scene5_expand": (
        "主存容量扩展有三种方式。"
        "位扩展扩展字长，多片芯片并联共享地址线。"
        "字扩展扩展字数，高位地址线经译码器选片。"
        "字位同时扩展，结合两种方法。"
        "位扩展对应低位交叉编址，字扩展对应高位交叉编址。"
    ),
    "scene6_outro": (
        "感谢观看。"
        "DRAM存储原理、多体交叉存储、容量扩展技术，"
        "内存工作原理的核心知识点。"
        "点赞收藏关注，我们下期再见。"
    ),
}


async def generate_tts(key, text, out_path):
    """Generate TTS audio using edge-tts CLI."""
    cmd = [
        "edge-tts",
        "--voice", VOICE,
        "--text", text,
        "--write-media", out_path,
        "--rate=+8%",
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        print(f"  [ERROR] {key}: {stderr.decode()}")
        return None
    return out_path


def get_duration_sec(filepath):
    """Get audio duration using ffprobe or mutagen fallback."""
    try:
        result = subprocess.run(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, timeout=10,
        )
        if result.returncode == 0:
            return float(result.stdout.strip())
    except Exception:
        pass

    try:
        from mutagen.mp3 import MP3
        return MP3(filepath).info.length
    except Exception:
        pass

    raise RuntimeError(f"Cannot get duration for {filepath}")


async def main():
    durations = {}
    for key, text in SCRIPTS.items():
        out_path = os.path.join(OUT_DIR, f"{key}.mp3")
        print(f"Generating: {key}...", end=" ", flush=True)
        result = await generate_tts(key, text, out_path)
        if result:
            dur = get_duration_sec(result)
            durations[key] = dur
            frames = round(dur * 30)
            print(f"OK ({dur:.2f}s, {frames}f)")
        else:
            print("FAILED")

    # Write metadata
    meta_path = os.path.join(OUT_DIR, "durations.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)
    print(f"\nDurations saved to {meta_path}")

    # Summary
    total = sum(durations.values())
    total_frames = round(total * 30)
    print(f"\n=== Summary ===")
    print(f"Total TTS: {total:.2f}s ({total_frames}f @30fps)")
    for key, dur in durations.items():
        print(f"  {key}: {dur:.2f}s = {round(dur * 30)}f")
    print(f"\nSuggested scene durations (TTS + 30f padding):")
    for key, dur in durations.items():
        print(f"  {key}: {round(dur * 30) + 30}f")


if __name__ == "__main__":
    asyncio.run(main())
