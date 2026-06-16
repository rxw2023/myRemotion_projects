"""
Generate TTS audio for each scene using edge-tts.
Output: public/voice/  directory with mp3 files + duration metadata.
"""
import asyncio
import json
import os
import subprocess

VOICE = "zh-CN-YunxiNeural"  # 云希 - 男声，科普风格
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE_DIR, "public", "voice")
os.makedirs(OUT_DIR, exist_ok=True)

# ffprobe from Remotion's node_modules
FFPROBE = os.path.join(
    BASE_DIR, "node_modules",
    "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"
)

# Scripts for each scene
SCRIPTS = {
    "scene1_title": "存储系统原理。从寄存器到磁盘，从SRAM到ROM，让我们一起了解计算机存储的层次结构。",
    "scene2_hierarchy": "存储层次结构中，从快到慢、从小到大。核心思想是：上一层存储器作为低一层的高速缓存。寄存器最快，远程辅助存储最慢。",
    "scene3_ram": "半导体随机存储器RAM。SRAM用触发器存储数据，速度快但成本高。DRAM用电容存储，容量大成本低，但需要定期刷新。两者各有优势。",
    "scene4_addr": "DRAM内部是二维阵列，需要同时提供行地址和列地址。通过行列地址复用，外部只需要12根地址线。先送行地址，再送列地址，将24根引脚减少到12根。",
    "scene5_flash": "Flash闪存和ROM只读存储器。Flash使用浮动门晶体管，是非易失性存储，广泛用于USB优盘和SSD固态硬盘。ROM包括EPROM和CDROM，断电后数据不会丢失。",
    "scene6_cache": "Cache到主存层，解决CPU与主存速度不匹配的问题，由硬件自动完成。主存到辅存层，解决存储系统容量不足的问题，由硬件和操作系统共同完成。",
    "scene7_outro": "感谢观看。存储系统原理，知识点梳理。点赞收藏关注，我们下期再见。",
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
    # edge-tts prints some info to stderr even on success
    return out_path


def get_duration_sec(filepath):
    """Get audio duration using ffprobe or mutagen fallback."""
    # Try ffprobe first
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

    # Fallback: mutagen
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
