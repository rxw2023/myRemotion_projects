"""
Generate TTS audio for the "整数与浮点数表示" video using edge-tts.

Unlike the older scripts in this repo (one mp3 per scene, one giant subtitle for
the whole scene), this one streams WordBoundary events so we can build *per-cue*
subtitle timings that actually line up with the narration.

Output:
  public/integer-float-repr/s00.mp3 ... s13.mp3
  src/IntegerFloatRepr/timings.ts   (auto-generated: cue frames + scene frames)

Source material:
  https://www.csgraduates.com/constitution_principle/representation/integer/
  https://www.csgraduates.com/constitution_principle/representation/floats/
"""
import asyncio
import json
import os
import random
import sys

import edge_tts
from mutagen.mp3 import MP3

VOICE = "zh-CN-YunxiNeural"  # 云希 - 男声，科普风格
RATE = "+4%"                 # 稍微放慢，便于跟读
FPS = 30
TAIL_FRAMES = 18             # 每个场景末尾留白，避免字幕撞转场
MAX_RETRIES = 6
RETRY_BASE_DELAY = 3.0

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "integer-float-repr")
TS_PATH = os.path.join(BASE_DIR, "src", "IntegerFloatRepr", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)

# 每个场景 = 一段连续旁白，cues 是逐句字幕（一句一条，控制在 ~30 字以内）
SCENES = [
    {
        "id": "s00",
        "cues": [
            "同样八个比特，能表示多少？",
            "答案是：取决于你怎么解释它。",
            "当成无符号数，是一百二十九。",
            "当成补码，是负一百二十七。",
            "当成原码是负一，当成 BCD 是八十一。",
            "今天把两件事讲透：整数怎么存，浮点数怎么存。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "先分清两个概念：字面值，和二进制位。",
            "字面值是我们写在纸上的负七十三，带正负号。",
            "二进制位，是机器里真正存的一串零和一。",
            "原码、补码、无符号数，不是三种不同的数据。",
            "它们是对同一组比特的三种解释规则。",
            "所以关键不是这串位是什么，而是编译器用哪套规则读它。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "先看最简单的：无符号数，也就是纯二进制。",
            "第 i 位的权重，是二的 i 次方。",
            "从右往左，一、二、四、八，一路翻倍。",
            "每一位乘以权重再求和，就得到数值。",
            "八个位里，最高位的权重是一百二十八。",
            "一后面六个零再加一个一，等于一百二十九。",
            "八位无符号的范围，是零到二百五十五。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "反过来，十进制转二进制用除二取余。",
            "以七十三为例，连续除以二，记下每次的余数。",
            "七十三除二余一，三十六除二余零。",
            "十八除二余零，九除二余一。",
            "四、二、一依次除下去，商到零就停。",
            "余数从下往上倒着读，就是零一零零一零零一。",
            "熟练之后可以直接凑二的幂：六十四加八加一。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "有符号数用补码，它和纯二进制只差一个地方。",
            "最高位的权重，不是正的一百二十八。",
            "而是负的一百二十八。",
            "把这个负号刻进脑子里，补码就通了。",
            "还是那串位，一后面七个零，代表负一百二十八。",
            "加上最低位的一，就是负一百二十七。",
            "所以八位补码的范围，是负一百二十八到正一百二十七。",
            "负数比正数多一个，因为正零和负零合并了。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "给定一个负数求补码，两步：取反，加一。",
            "先写出它绝对值的纯二进制。",
            "负七十三的绝对值是七十三，零一零零一零零一。",
            "按位取反，变成一零一一零一零。",
            "再加一，得到一零一一零一一一。",
            "为什么叫二的补码？本质是用二的八次方减去七十三。",
            "在模运算里，减法就变成了加法。",
            "所以加减法共用一套加法器，这是补码最大的工程价值。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "对比一下原码：最高位符号位，剩下是绝对值。",
            "正二十五和负二十五，只差最高位。",
            "原码直观，但有两个硬伤。",
            "第一，零有两种编码，正零和负零，浪费一个。",
            "第二，做加法要先比大小再决定谁减谁，硬件更复杂。",
            "所以现代机器里，整数只用补码。",
            "再补一个概念：把补码的符号位取反，得到移码。",
            "移码把大小顺序变成无符号比较，专门用来存阶码。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "整数说完了，实数怎么办？",
            "最直接的方案是定点数。",
            "约定某一位是小数点，左边整数，右边小数。",
            "小数点右边，权重是二分之一、四分之一、八分之一。",
            "但小数点位置固定，范围就被锁死了。",
            "要表示二的负一百零二次方这种量级，得写一百多个位。",
            "其中绝大部分还是零，位被白白浪费。",
            "于是有了浮点数，本质是二进制的科学计数法。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "IEEE 七五四标准，把浮点数拆成三段。",
            "符号位 s，阶码 E，尾数 M。",
            "值等于负一的 s 次方，乘一点几，再乘二的 E 减偏置次方。",
            "单精度三十二位：一、八、二十三，偏置一百二十七。",
            "双精度六十四位：一、十一、五十二，偏置一千零二十三。",
            "为什么要加偏置？因为阶码要表示负指数，可它按无符号存。",
            "加偏置把所有指数平移成正数，比大小就是比二进制。",
            "还有个便宜：规格化后尾数总是一点几，那个一不存，白赚一位。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "手算一遍二点二五的单精度。",
            "先规格化：二点二五等于一点一二五乘以二的一次方。",
            "符号位零，正数。",
            "阶码是一加一百二十七，等于一百二十八。",
            "一百二十八的二进制，是一后面七个零。",
            "尾数去掉整数的一，剩下零零一，后面补零填满二十三位。",
            "三段拼起来，写成十六进制是四零一零，后面四个零。",
        ],
    },
    {
        "id": "s10",
        "cues": [
            "阶码不是随便取的，它决定浮点数的四种身份。",
            "阶码既不全零也不全一，是正常值，用隐含的一。",
            "阶码全零，是非正常值：没有隐含的一。",
            "指数固定成一减偏置，尾数全零就是零。",
            "阶码全一、尾数全零，是正无穷或负无穷。",
            "阶码全一、尾数非零，是非数字 NaN。",
            "非正常值的意义，是在最小正常数和零之间铺一条过渡带。",
        ],
    },
    {
        "id": "s11",
        "cues": [
            "现在回答那个经典问题。",
            "为什么零点一加零点二，不等于零点三。",
            "因为一点二的二进制是无限循环的，零零一一不断重复。",
            "二十三位尾数装不下，只能舍入到最近的那个数。",
            "把浮点数想成数轴上一串离散的点。",
            "单精度相邻两点间隔是二的负二十三次方，约一亿分之一。",
            "落不到点上的数只能就近取点，误差从这里来。",
            "所以判断浮点相等，要比较差值，不能直接写等号。",
        ],
    },
    {
        "id": "s12",
        "cues": [
            "浮点加减，四步：对阶、尾数运算、规格化、舍入。",
            "对阶原则是：小阶向大阶看齐。",
            "小阶的尾数右移，阶码变大。",
            "对阶只丢精度，不会引起阶码溢出。",
            "尾数运算后可能进位，要右规，阶码加一，可能上溢。",
            "尾数太小要左规，阶码减一，可能下溢。",
            "最后舍入，舍入进位后还要再右规一次。",
            "记住：尾数溢出不等于结果溢出，只看最终阶码有没有越界。",
        ],
    },
    {
        "id": "s13",
        "cues": [
            "收个尾。",
            "整数：无符号用纯二进制，有符号用补码。",
            "最高位权重带负号，负数取反加一。",
            "浮点数：符号、阶码、尾数三段，",
            "阶码加偏置，尾数隐含一。",
            "非正常值、无穷、NaN 各占特殊编码，精度看尾数位数。",
            "把这几个点串起来，选择题就是送分题。",
            "有帮助的话点个赞，我们下期见。",
        ],
    },
]


async def synth(text, out_path):
    """Synthesize one scene's narration, collecting WordBoundary offsets (100ns)."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
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
        except Exception as e:  # noqa: BLE001
            if attempt == MAX_RETRIES:
                print(f"  [ERROR] {out_path}: {e}")
                return None
            delay = RETRY_BASE_DELAY * attempt + random.uniform(0, 1.5)
            print(f"  (retry {attempt}/{MAX_RETRIES} in {delay:.1f}s: {e})", flush=True)
            await asyncio.sleep(delay)
    return None


def _norm(s):
    """归一化：去掉标点与空白，用于把字幕句和 TTS 断句对齐。"""
    out = []
    for ch in s:
        if ch.isalnum() or "\u4e00" <= ch <= "\u9fff":
            out.append(ch)
    return "".join(out)


def cue_times(cues, boundaries, total_sec):
    """把每条字幕句映射到 [start, end]。

    edge-tts 对中文返回 SentenceBoundary（每句的精确起止，单位 100ns）。服务端的
    断句和我们的字幕切分不保证一一对应（它会把逗号处合并、也会把长句再拆开），
    但这些断点的文本拼起来就是原始旁白文本。于是做**字符级对齐**：给旁白的每个
    字符分配一个时间（落在所在断句内部按长度插值），字幕句的字符区间直接查出
    起止时间。这样拆分、合并都不会错位。
    """
    sents = [b for b in boundaries if b["type"] == "SentenceBoundary"] or boundaries

    # 兜底：完全没有断点信息，按字数比例铺开
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

    # 每个字符的 (起, 止) 时间
    char_t = []
    for b in sents:
        t0 = b["offset"] / 1e7
        t1 = t0 + b["duration"] / 1e7
        n = max(1, len(b["text"]))
        char_t.extend((t0 + (t1 - t0) * j / n, t0 + (t1 - t0) * (j + 1) / n) for j in range(n))

    # 文本一致 → 直接下标；不一致（个别数字被读法改写）→ 按比例缩放下标
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

    # 收尾修正：单调、补掉句间空隙、不越过音频末尾
    for i in range(1, len(out)):
        if out[i]["start"] < out[i - 1]["end"]:
            out[i]["start"] = out[i - 1]["end"]
    for i in range(len(out) - 1):
        if out[i + 1]["start"] - out[i]["end"] > 0.22:
            out[i]["end"] = round(out[i + 1]["start"], 3)
    if out:
        out[0]["start"] = max(0.0, round(out[0]["start"], 3))
        out[-1]["end"] = min(total_sec, round(out[-1]["end"] + 0.35, 3))
    return out


async def main():
    args = sys.argv[1:]
    reuse = "--reuse" in args
    only = {a for a in args if not a.startswith("--")} or None

    # 部分重生成时，保留已有场景的元数据
    meta_path = os.path.join(OUT_DIR, "cues.json")
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    for scene in SCENES:
        sid = scene["id"]
        if only and sid not in only:
            continue
        out_path = os.path.join(OUT_DIR, f"{sid}.mp3")
        # --reuse：音频与断点都在，只重算字幕时间轴
        if reuse and os.path.exists(out_path) and meta.get(sid, {}).get("sentences"):
            dur = MP3(out_path).info.length
            cues = cue_times(scene["cues"], meta[sid]["sentences"], dur)
            meta[sid] = {"duration": round(dur, 3), "sentences": meta[sid]["sentences"], "cues": cues}
            print(f"[{sid}] reuse {dur:6.2f}s  {len(cues)} cues")
            continue

        text = "".join(scene["cues"])
        print(f"[{sid}] {len(text)} chars ...", end=" ", flush=True)
        boundaries = await synth(text, out_path)
        if boundaries is None:
            print("FAILED")
            continue
        dur = MP3(out_path).info.length
        cues = cue_times(scene["cues"], boundaries, dur)
        meta[sid] = {"duration": round(dur, 3), "sentences": boundaries, "cues": cues}
        print(f"OK {dur:6.2f}s  {len(boundaries):3d} sents  {len(cues)} cues")
        await asyncio.sleep(0.8)

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    # ---- emit TypeScript timings ----
    lines = [
        "// AUTO-GENERATED by scripts/integer-float-repr/generate_tts.py — 不要手改。",
        "// 重新生成：\"C:/Program Files/Python310/python.exe\" scripts/integer-float-repr/generate_tts.py",
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
    lines.append("/** 各场景帧数，顺序同 SCENE_ORDER（用于汇总总帧数） */")
    lines.append("export const SCENE_FRAME_LIST: number[] = [")
    lines.append("  " + ", ".join(str(f) for f in scene_frames.values()) + ",")
    lines.append("];")
    lines.append("")
    lines.append("/** 转场时长（每两个相邻场景之间） */")
    lines.append("export const TRANSITION_FRAMES = 10;")
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
    total_frames = sum(scene_frames.values()) - 10 * (len(scene_frames) - 1)
    print(f"\n=== {len(scene_frames)} scenes, {total_sec:.1f}s audio ===")
    for sid, f in scene_frames.items():
        print(f"  {sid}: {meta[sid]['duration']:6.2f}s -> {f}f")
    print(f"  TOTAL: {total_frames}f  ({total_frames / FPS:.1f}s)")
    print(f"  timings -> {TS_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
