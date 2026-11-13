"""
Generate TTS audio for the "指令系统 · ISA 与 CISC/RISC" video using edge-tts.

Same pipeline as scripts/data-alignment/generate_tts.py: one mp3 per scene,
逐句 SentenceBoundary → 字符级对齐 → 生成 src/CiscRisc/timings.ts。
场景里的动画只认 cue 序号（at(3)），不认绝对帧号，所以改旁白不用重排画面。

Output:
  public/cisc-risc/s00.mp3 ... s10.mp3
  public/cisc-risc/cues.json
  src/CiscRisc/timings.ts        (auto-generated: cue frames + scene frames)

Source material:
  https://www.csgraduates.com/constitution_principle/instruction/concepts/#cisc
"""
import asyncio
import json
import os
import random
import sys

import edge_tts
from mutagen.mp3 import MP3

VOICE = "zh-CN-XiaoxiaoNeural"  # 晓晓 - 与前两期同一副嗓子
RATE = "+6%"
FPS = 30
TAIL_FRAMES = 40  # 每个场景末尾留白：3b1b 风格需要一个"呼吸"的停顿
MAX_RETRIES = 6
RETRY_BASE_DELAY = 3.0

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "cisc-risc")
TS_PATH = os.path.join(BASE_DIR, "src", "CiscRisc", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)

# 每个场景 = 一段连续旁白，cues 是逐句字幕（一句一条，控制在 ~30 字以内）
SCENES = [
    {
        "id": "s00",
        "cues": [
            "先问一个问题：编译器写下一条 ADD 指令的时候，它到底在跟谁打交道？",
            "不是某一块具体的芯片，而是芯片对软件承诺的那份契约。",
            "这份契约，叫指令体系结构，ISA。",
            "它是软件能观察到的处理器行为，以及软硬件交互必须遵守的规则。",
            "上面是程序，下面是电路，中间这条线，就是 ISA。",
            "对软件来说，线下面的流水线、Cache、ALU，一概不可见。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "这份契约规定七件事，先过一遍，有个整体印象。",
            "第一，有哪些指令，每条执行后产生什么可观察的结果。",
            "第二，指令怎么编码：操作码、操作数各占几位。",
            "第三，软件可见的寄存器：有哪些、干什么用、怎么访问。",
            "第四，操作数怎么给：立即数、寄存器，还是内存地址。",
            "第五，支持哪些数据类型，整数、浮点，还是向量。",
            "第六，访存行为：字节序、原子操作、多处理器的内存一致性。",
            "第七，异常、中断与特权级，操作系统靠它管住处理器。",
            "这七条，全都是从软件那一侧能看见的东西。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "反过来说，ISA 不规定的东西，才是真正的分界线。",
            "它只说：执行完 ADD，目标寄存器等于两个操作数之和。",
            "至于有几级流水线、是否乱序、有没有寄存器重命名，一字不提。",
            "ALU 有几个、Cache 多大、分支预测用什么算法，也不提。",
            "这些属于微架构，是实现，不是契约。",
            "一句话记住：ISA 规定机器表现成什么样，微架构规定它具体怎么做到。",
            "所以同一个 x86-64，Intel 和 AMD 的内部可以完全不同，程序照样跑。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "契约只要求行为一致，至于这份契约怎么设计，就出现了两条路。",
            "看这一行 C：给二维数组的一个元素赋值。",
            "在 x86 上，它是一条指令。",
            "在 MIPS 上，它是一串指令。",
            "一条对一串，这就是复杂指令集和精简指令集的分野。",
            "不是谁更先进，是两种设计哲学。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "先看复杂指令集，CISC。",
            "第一条，指令复杂：一条指令里可以既访问内存，又做运算。",
            "第二条，指令不定长：一个字节到十几个字节都有。",
            "第三条，寻址方式多，允许指令直接访问内存。",
            "前三条的后果，是第四条：控制器只能靠微程序。",
            "把一条复杂指令，翻译成一串微指令，存进控制存储器，一条条执行。",
            "第五条，硬件复杂、芯片面积大。典型代表就是 x86。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "再看精简指令集，RISC。",
            "指令少而简单，每条只做一件事。",
            "长度固定，ARM 和 MIPS 都是四字节。",
            "寻址方式很少，想算数，先把数据 load 进寄存器。",
            "于是控制器可以用硬布线：组合逻辑直接出控制信号，不查微程序表。",
            "代价是寄存器必须多，少了根本不够用。",
            "硬件精简，功耗低。典型代表是 ARM。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "把 x86 那条指令放大看，它一次干了五件事。",
            "取 ecx 当基址，把 edx 乘四当偏移，再加上 0x00422000 这个常数。",
            "三者相加，得到有效地址。",
            "再把立即数 0x0A 写进这个地址。",
            "整个过程取指一次、译码一次、访存一次，全在一条指令里完成。",
            "程序短、代码密度高，这是 CISC 的长处。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "同样一件事，MIPS 怎么做？",
            "先把 i 左移六位，相当于乘六十四；加上 j，再左移两位，乘四。",
            "基址太长，一条指令装不下，只能 lui 取高十六位，ori 补低十六位。",
            "三段相加得到地址，把十装进 a1，最后 sw 写内存。",
            "八条指令，一条不多，一条不少。",
            "每条都只做一件事，译码器看一眼就知道要干什么。",
            "代码变长了，但每一步都简单、规整、可以并行。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "为什么简单和规整这么重要？因为流水线。",
            "流水线要求每个周期，都能取到一条完整的指令。",
            "定长四字节，取指地址加四就行，下一条在哪，永远知道。",
            "不定长就麻烦：不译码完，不知道这条指令到底有几个字节。",
            "所以 CISC 的取指和译码，很难整齐地排进流水线。",
            "RISC 用长度换了规律，规律换来了并行。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "把两者放进同一张表里，这是选择题最常见的样子。",
            "指令集：一个复杂、数量多，一个精简、数量少。",
            "指令长度：一个不定长，一个固定。",
            "寻址模式：一个多，一个少。",
            "控制方式：一个微程序，一个硬布线。",
            "硬件复杂度：一个复杂，一个精简。",
            "优点：一个功能强，一个性能高、功耗低。",
            "缺点也对称：一个执行效率低，一个复杂操作要靠多条指令拼。",
        ],
    },
    {
        "id": "s10",
        "cues": [
            "最后提醒一句：这条界线，今天已经模糊了。",
            "x86 内部会把复杂指令翻译成类 RISC 的微操作，再送进流水线。",
            "ARM 也在不断加指令，做成了以定长为主、部分变长的混合编码。",
            "但两者的分野没有消失，它变成了同一份 ISA 下不同的微架构选择。",
            "回到开头那条线：契约规定做什么，实现决定怎么做。",
            "记住这张表，比记住结论更有用。",
        ],
    },
]


async def synth(text, out_path, timeout=180):
    """Synthesize one scene; return boundary list or None.

    edge-tts occasionally hangs mid-stream with no error; a hard timeout keeps the
    whole batch from stalling (symptom: 0-byte mp3 that never grows).
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:

            async def _stream():
                com = edge_tts.Communicate(text, VOICE, rate=RATE)
                boundaries = []
                with open(out_path, "wb") as f:
                    async for chunk in com.stream():
                        if chunk["type"] == "audio":
                            f.write(chunk["data"])
                        elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                            boundaries.append(
                                {
                                    "type": chunk["type"],
                                    "text": chunk["text"],
                                    "offset": chunk["offset"],
                                    "duration": chunk.get("duration", 0),
                                }
                            )
                return boundaries

            return await asyncio.wait_for(_stream(), timeout=timeout)
        except Exception as e:  # noqa: BLE001
            if attempt == MAX_RETRIES:
                print(f"  [ERROR] {out_path}: {type(e).__name__} {e}")
                return None
            delay = RETRY_BASE_DELAY * attempt + random.uniform(0, 1.5)
            print(
                f"  (retry {attempt}/{MAX_RETRIES} {os.path.basename(out_path)} in {delay:.1f}s: {type(e).__name__})",
                flush=True,
            )
            await asyncio.sleep(delay)
    return None


def cue_times(cues, boundaries, total_sec):
    """把每条字幕句映射到 [start, end]（字符级对齐，拆分合并都不会错位）。"""
    sents = [b for b in boundaries if b["type"] == "SentenceBoundary"] or boundaries

    if not sents:
        written_total = sum(len(c) for c in cues)
        out, cum = [], 0.0
        for cue in cues:
            s = total_sec * cum / written_total
            cum += len(cue)
            out.append(
                {"text": cue, "start": round(s, 3), "end": round(total_sec * cum / written_total, 3)}
            )
        return out

    spoken = "".join(b["text"] for b in sents)
    written = "".join(cues)

    char_t = []
    for b in sents:
        t0 = b["offset"] / 1e7
        t1 = t0 + b["duration"] / 1e7
        n = max(1, len(b["text"]))
        char_t.extend((t0 + (t1 - t0) * j / n, t0 + (t1 - t0) * (j + 1) / n) for j in range(n))

    ratio = len(char_t) / max(1, len(written))
    exact = spoken == written

    out, cum = [], 0
    for cue in cues:
        a = cum
        cum += len(cue)
        b = cum - 1
        if not exact:
            a = min(len(char_t) - 1, int(a * ratio))
            b = min(len(char_t) - 1, int(b * ratio))
        b = min(b, len(char_t) - 1)
        start = char_t[a][0]
        end = char_t[b][1]
        out.append({"text": cue, "start": round(start, 3), "end": round(end, 3)})

    for i in range(1, len(out)):
        if out[i]["start"] < out[i - 1]["end"]:
            out[i]["start"] = out[i - 1]["end"]
    for i in range(len(out) - 1):
        if out[i + 1]["start"] - out[i]["end"] > 0.22:
            out[i]["end"] = round(out[i + 1]["start"], 3)
    if out:
        out[0]["start"] = max(0.1, round(out[0]["start"], 3))
        out[-1]["end"] = min(total_sec, round(out[-1]["end"] + 0.35, 3))
    return out


async def main():
    args = sys.argv[1:]
    reuse = "--reuse" in args
    only = {a for a in args if not a.startswith("--")} or None

    meta_path = os.path.join(OUT_DIR, "cues.json")
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    lock = asyncio.Lock()
    sem = asyncio.Semaphore(3)  # 并发 3：太快会被服务端限流

    async def save_meta():
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    async def work(scene):
        sid = scene["id"]
        if only and sid not in only:
            return
        out_path = os.path.join(OUT_DIR, f"{sid}.mp3")

        # --reuse：音频与断点都在，只重算字幕时间轴
        if reuse and os.path.exists(out_path) and meta.get(sid, {}).get("sentences"):
            dur = MP3(out_path).info.length
            cues = cue_times(scene["cues"], meta[sid]["sentences"], dur)
            async with lock:
                meta[sid] = {"duration": round(dur, 3), "sentences": meta[sid]["sentences"], "cues": cues}
            print(f"[{sid}] reuse {dur:6.2f}s  {len(cues)} cues")
            return

        text = "".join(scene["cues"])
        async with sem:
            boundaries = await synth(text, out_path)
        if boundaries is None:
            print(f"[{sid}] FAILED")
            return
        dur = MP3(out_path).info.length
        cues = cue_times(scene["cues"], boundaries, dur)
        async with lock:
            meta[sid] = {"duration": round(dur, 3), "sentences": boundaries, "cues": cues}
            await save_meta()  # 每个场景落盘一次，中途挂掉也不丢已完成部分
        print(f"[{sid}] OK {dur:6.2f}s  {len(boundaries):3d} sents  {len(cues)} cues")

    await asyncio.gather(*(work(s) for s in SCENES))
    await save_meta()

    lines = [
        "// AUTO-GENERATED by scripts/cisc-risc/generate_tts.py — 不要手改。",
        '// 重新生成：python scripts/cisc-risc/generate_tts.py',
        "",
        "export interface Cue {",
        "  text: string;",
        "  start: number;",
        "  end: number;",
        "}",
        "",
        "/** 逐句字幕，帧为单位，相对当前场景起点 */",
        "export const CUES: Record<string, Cue[]> = {",
    ]
    scene_frames = {}
    for scene in SCENES:
        sid = scene["id"]
        if sid not in meta:
            continue
        entry = meta[sid]
        frames = round(entry["duration"] * FPS) + TAIL_FRAMES
        scene_frames[sid] = frames
        lines.append(f"  {sid}: [")
        for c in entry["cues"]:
            text = c["text"].replace('"', '\\"')
            s = round(c["start"] * FPS)
            e = min(round(c["end"] * FPS), frames)
            lines.append(f'    {{ text: "{text}", start: {s}, end: {e} }},')
        lines.append("  ],")
    lines.append("};")
    lines.append("")
    lines.append("/** 每个场景总帧数（旁白 + 尾部留白） */")
    lines.append("export const SCENE_FRAMES: Record<string, number> = {")
    for sid, f in scene_frames.items():
        lines.append(f"  {sid}: {f},")
    lines.append("};")
    lines.append("")
    lines.append("export const SCENE_ORDER = [")
    lines.append("  " + ", ".join(f'"{s["id"]}"' for s in SCENES) + ",")
    lines.append("] as const;")
    lines.append("")
    lines.append("export const SCENE_FRAME_LIST: number[] = [")
    lines.append("  " + ", ".join(str(f) for f in scene_frames.values()) + ",")
    lines.append("];")
    lines.append("")
    lines.append("/** 转场时长（每两个相邻场景之间） */")
    lines.append("export const TRANSITION_FRAMES = 8;")
    lines.append("")
    lines.append(
        "export const TOTAL_FRAMES: number =\n"
        "  SCENE_FRAME_LIST.reduce((a: number, b: number) => a + b, 0) -\n"
        "  TRANSITION_FRAMES * (SCENE_ORDER.length - 1);"
    )
    lines.append("")

    with open(TS_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))

    total_sec = sum(m["duration"] for m in meta.values())
    total_frames = sum(scene_frames.values()) - 8 * (len(scene_frames) - 1)
    print(f"\n=== {len(scene_frames)} scenes, {total_sec:.1f}s audio ===")
    for sid, f in scene_frames.items():
        print(f"  {sid}: {meta[sid]['duration']:6.2f}s -> {f}f")
    print(f"  TOTAL: {total_frames}f  ({total_frames / FPS:.1f}s)")
    print(f"  timings -> {TS_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
