"""
Generate TTS audio for the "数据对齐与结构体填充" video using edge-tts.

Same pipeline as scripts/instruction-format/generate_tts.py: one mp3 per scene,
逐句 SentenceBoundary → 字符级对齐 → 生成 src/DataAlignment/timings.ts。
场景里的动画只认 cue 序号（at(3)），不认绝对帧号，所以改旁白不用重排画面。

Output:
  public/data-alignment/s00.mp3 ... s11.mp3
  public/data-alignment/cues.json
  src/DataAlignment/timings.ts   (auto-generated: cue frames + scene frames)

Source material:
  https://www.csgraduates.com/constitution_principle/instruction/alignment/
"""
import asyncio
import json
import os
import random
import sys

import edge_tts
from mutagen.mp3 import MP3

VOICE = "zh-CN-XiaoxiaoNeural"  # 晓晓 - 与上一期同一副嗓子
RATE = "+6%"
FPS = 30
TAIL_FRAMES = 40  # 每个场景末尾留白：3b1b 风格需要一个"呼吸"的停顿
MAX_RETRIES = 6
RETRY_BASE_DELAY = 3.0

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "data-alignment")
TS_PATH = os.path.join(BASE_DIR, "src", "DataAlignment", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)

# 每个场景 = 一段连续旁白，cues 是逐句字幕（一句一条，控制在 ~30 字以内）
SCENES = [
    {
        "id": "s00",
        "cues": [
            "先看一个现象：同样是一个 int，为什么有的地址能放，有的不能？",
            "编译器给它的地址，一定能被四整除。",
            "不是巧合，这是硬件定下的规矩。",
            "这一期只讲一件事：数据在内存里，为什么要对齐。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "这个规矩，叫数据对齐。",
            "它要求数据的起始地址，必须是某个数的整数倍。",
            "这个数，叫对齐因子。",
            "写成公式就是：起始地址对 K 取余，等于零。",
            "换成二进制看更直接：地址的低几位必须全是零。",
            "对齐因子是四，低两位为零；是八，低三位为零。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "对齐因子多大，由数据类型的大小决定。",
            "基本规律一句话：对齐因子等于类型自身的字节数。",
            "char 一字节，因子一，任何地址都能放。",
            "short 两字节，地址必须是二的倍数。",
            "int 和 float 四字节，地址是四的倍数。",
            "double 和 long long 八字节，地址是八的倍数。",
            "六十四位系统里，指针也是八。",
            "但有个上限：对齐因子不会超过硬件的最大对齐限制。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "那偏要放在不对齐的位置呢？",
            "多数机器允许，但代价来了。",
            "内存是按块读的：一次搬一个存储字，起点必须落在块的边界上。",
            "一个 double 放在偏移二，就横跨了两个存储字。",
            "取这一个数，要拆成两次访存。",
            "再把两半拼回去，电路多一级，时间多一倍。",
            "在更严格的架构上，比如某些 ARM，这不只是慢，直接抛异常。",
            "所以对齐不是为了好看，是为了让一次访存，真的一次搬完。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "再往下一层问：硬件为什么非要这样？",
            "因为地址送到内存，低几位根本不参与选行。",
            "它们只决定块内偏移，也就是你要的那几个字节，在块里的位置。",
            "真正被选中、整块取回的，是高位地址指向的那一行。",
            "所以硬件干脆规定：一次访问的起点，只能是块大小的整数倍。",
            "对齐，是这种读取方式的必然结果，不是后来加的约束。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "单个变量好办。真正考人的，是结构体。",
            "定义一个结构体，两个成员：一个 char，一个 int。",
            "按直觉，一加四，占五个字节。",
            "但 sizeof 打印出来，是八。",
            "多出来的三个字节，叫填充，padding。",
            "它们不存任何数据，只为了让后面的成员站对位置。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "把内存摊开看，一格一字节。",
            "a 是 char，因子一，放在偏移零，占一格。",
            "b 是 int，因子四，地址必须是四的倍数。",
            "偏移一、二、三这三格，只能空着。",
            "从偏移四开始，b 占四到七。",
            "总共八字节，正好是四的倍数，末尾不用再补。",
            "这三格填充不是浪费，是让 b 的地址能够被四整除。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "这里插一句：编译器明知道有空隙，为什么不把成员挪紧凑？",
            "因为标准规定，成员必须按声明顺序存放。",
            "顺序一变，初始化列表、指针运算、内存映射，全都对不上。",
            "所以编译器只填空隙，不搬家。",
            "省空间的活，留给写代码的人。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "再换一个更阴的：char、short、char。",
            "直觉是三，实际是六。",
            "a 在零，b 要对齐到二，所以偏移一空着，b 占二三。",
            "c 是 char，紧跟着放在四。",
            "到这里只用了五格，答案却是六。",
            "因为整体大小，必须是最大对齐因子的整数倍。",
            "最大因子是 short 的二，五要补齐到六。",
            "末尾这一格，是给数组留的。",
            "结构体数组里每个元素都得对齐；末尾不补，第二个元素就站歪了。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "到这里，结构体大小只剩两条规则。",
            "第一条：每个成员按自己的因子找位置，放不下就补空隙。",
            "第二条：整体大小，向上取整到最大因子的倍数。",
            "还有一条附带结论：结构体自己的对齐因子，等于成员里最大的那个。",
            "所以结构体套结构体，还是同一套算法。",
        ],
    },
    {
        "id": "s10",
        "cues": [
            "填充既然是空转，能不能少填一点？",
            "办法是把成员按对齐因子从大到小排。",
            "原来 char、int、char：一加三空，四加四，一加三空，共十二字节。",
            "改成 int、char、char：四加一加一，再补两格，八字节。",
            "信息一点没少，省下三分之一。",
            "这也是好头文件里，大类型总写在前面。",
            "反过来也有：用 pack 强行压缩对齐，那是拿速度换空间。",
        ],
    },
    {
        "id": "s11",
        "cues": [
            "回到最开始的问题。",
            "地址能不能放，看它能不能被对齐因子整除。",
            "填充不是浪费，是让每个成员都站在自己的边界上。",
            "算大小分两步：先按成员铺一遍，再整体取整。",
            "这两步练熟，这类题就不会再错。",
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
        "// AUTO-GENERATED by scripts/data-alignment/generate_tts.py — 不要手改。",
        '// 重新生成：python scripts/data-alignment/generate_tts.py',
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
