"""
Generate TTS audio for ExternalStorage scenes using edge-tts.
Output: public/external-storage/ directory with mp3 files + duration metadata.
"""
import asyncio
import json
import os
import subprocess

VOICE = "zh-CN-YunxiNeural"  # 云希 - 男声，科普风格
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "external-storage")
os.makedirs(OUT_DIR, exist_ok=True)

FFPROBE = os.path.join(
    BASE_DIR, "node_modules",
    "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"
)

SCRIPTS = {
    "scene1_title": (
        "外部存储科普。"
        "从机械硬盘的物理结构到固态硬盘的闪存技术，"
        "让我们一起了解计算机外存的工作原理、性能指标与选型对比。"
    ),
    "scene2_hdd_structure": (
        "机械硬盘使用磁性存储介质。"
        "数据存储在旋转的盘片上，每个盘片有两个盘面，每个盘面对应一个磁头。"
        "盘面上的同心圆环称为磁道，相同半径位置的所有磁道组成柱面，"
        "每个磁道分为多个扇区，扇区是数据读写的最小单位，大小通常为512字节或4KB。"
    ),
    "scene3_chs": (
        "CHS寻址通过柱面号、磁头号、扇区号三个字段定位物理扇区。"
        "柱面号位数等于log2柱面数向上取整，"
        "磁头号位数等于log2盘面数向上取整，"
        "扇区号位数等于log2每道扇区数向上取整。"
        "例如：1000个柱面需10位，4个盘面需2位，32扇区每道需5位，总共17位地址。"
        "访问时先移动磁头到目标柱面，再选择盘面，最后等待扇区旋转到磁头下方。"
    ),
    "scene4_hdd_perf": (
        "磁盘性能指标。"
        "平均存取时间等于寻道时间加旋转延迟时间加传输时间。"
        "寻道时间是磁头移动到目标磁道的时间，取决于移动距离和驱动器性能。"
        "旋转延迟是盘片旋转使目标扇区到达磁头下方的时间，平均为半圈。"
        "传输时间是实际读写数据的时间。"
        "数据传速率D_r等于转速r乘以每道字节数N，"
        "r为每秒转数，N为每道扇区数乘以扇区大小。"
        "5400转每秒约90转，7200转每秒约120转。"
    ),
    "scene5_raid": (
        "RAID独立磁盘冗余阵列，将多个物理磁盘组合成一个逻辑磁盘。"
        "核心技术有四种。"
        "磁盘镜像，同一数据写入多块磁盘，对应RAID1。"
        "条带化，数据分块分散存储，对应RAID0，无容错。"
        "奇偶校验，冗余校验位实现数据重建，对应RAID3、5、6，兼容可靠性和存储效率。"
        "RAID在考研中仅考过一题，了解基本概念即可。"
    ),
    "scene6_ssd": (
        "固态硬盘SSD使用NAND闪存作为存储介质，没有机械部件。"
        "与机械硬盘相比，SSD读写速度极快，可达500到7000兆字节每秒，"
        "而HDD仅100到200兆字节每秒。"
        "随机访问延迟极低，在0.1毫秒以下，而HDD需5到10毫秒。"
        "SSD抗震动、无噪音、轻薄，无需碎片整理，适合做系统盘和高性能计算。"
        "HDD优势在于大容量存储成本低，适合备份和归档。"
    ),
    "scene7_outro": (
        "感谢观看。"
        "机械硬盘的CHS寻址、性能指标计算，"
        "RAID的核心技术，"
        "固态硬盘与机械硬盘的对比。"
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
