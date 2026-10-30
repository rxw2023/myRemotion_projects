"""
Generate TTS audio for the "运算电路与类型转换" video using edge-tts.

Same pipeline as scripts/repr-basics/generate_tts.py: one mp3 per scene, but
WordBoundary/SentenceBoundary events are streamed so per-cue subtitle timings
land exactly on the narration.

Output:
  public/arith-convert/s00.mp3 ... s14.mp3
  src/ArithConvert/timings.ts   (auto-generated: cue frames + scene frames)

Source material:
  https://www.csgraduates.com/constitution_principle/representation/circuit/
  https://www.csgraduates.com/constitution_principle/representation/conversion/
"""
import asyncio
import json
import os
import random
import sys

import edge_tts
from mutagen.mp3 import MP3

VOICE = "zh-CN-YunxiNeural"  # 云希 - 男声，科普风格
RATE = "+4%"
FPS = 30
TAIL_FRAMES = 18             # 每个场景末尾留白，避免字幕撞转场
MAX_RETRIES = 6
RETRY_BASE_DELAY = 3.0

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "arith-convert")
TS_PATH = os.path.join(BASE_DIR, "src", "ArithConvert", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)

# 每个场景 = 一段连续旁白，cues 是逐句字幕（一句一条，控制在 ~32 字以内）
SCENES = [
    {
        "id": "s00",
        "cues": [
            "计算机的算术单元里，其实只有一种运算。",
            "减法、乘法、除法，最后都被拆成了加法。",
            "所以这一期先讲加法器怎么搭，再讲类型转换怎么算。",
            "一个是硬件怎么算，一个是同一串位怎么被换个读法。",
            "先看最小的一步：一位加一位。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "一位加一位，输入是两个比特。",
            "输出有两个：一个叫和，一个叫进位。",
            "和用异或门：相同得零，不同得一。",
            "进位用与门：只有两个一相加，才进位。",
            "两个门拼起来，就是半加器。",
            "但它有个缺陷：它听不到低位传来的进位。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "补上第三个输入，来自低位的进位 Cin。",
            "和等于 A 异或 B，再异或 Cin。",
            "进位等于 A 与 B，或者 A 异或 B 再与 Cin。",
            "八个输入组合逐条列出来，就是全加器的真值表。",
            "看进位这一列：三个输入里有两个以上是一，就进位。",
            "换句话说，全加器就是一个三输入的多数表决门。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "把 n 个全加器串起来，就是 n 位加法器。",
            "每一位的进位输出，接到下一位的进位输入。",
            "这叫行波进位，进位像波纹一样从最低位爬到最高位。",
            "延迟逐级累加，位数越多，最高位等得越久。",
            "所以加法看着最简单，却常常是时序上的瓶颈。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "同一个加法器，既能算无符号数，也能算补码。",
            "因为电路只认零和一，它不知道你在算什么类型。",
            "一一一一加一，无符号是一百二十八加一，得一百二十九。",
            "补码里，它是负一加一，得零，还留下一个进位。",
            "位模式一样，只是解释规则不同。",
            "运算电路不区分类型，区分类型的是标志位和指令。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "有符号运算，需要四个标志位说明结果的性质。",
            "ZF 零标志：结果每一位都是零，它就置一。",
            "SF 符号标志：直接取结果的最高位。",
            "CF 进位标志：加法取最高位进位，减法取借位。",
            "OF 溢出标志：最高位进位，异或次高位进位。",
            "为什么是异或？只有一进一出不一致，符号才被真的顶翻。",
            "正加正得负，负加负得正，都是溢出。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "有了全加器，减法就不需要单独的电路。",
            "A 减 B，等于 A 加 B 的补码，也就是取反再加一。",
            "所以在 B 前面加一排异或门，用 Sub 做开关。",
            "Sub 等于零，B 原样通过；等于一，B 每一位都取反。",
            "同时把 Sub 接到最低位的进位输入，加一也顺手完成。",
            "一个加法器通吃加减，代价是减法下 CF 变成了借位。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "乘法本质是移位相加。",
            "手算一一零一乘一一一零，是四次部分积错位排好再求和。",
            "没有硬件支持时，编译器用循环：看最低位，是就加，再移位。",
            "顺序乘法器就是这么做的，一个周期出一位结果。",
            "阵列乘法器把全加器铺成二维网格，所有部分积同时算。",
            "用面积换时间，这是硬件里最经典的一笔交易。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "除法是乘法的逆运算，也是最慢的那一个。",
            "手算长除法：从高位开始，够减就商一，不够就商零。",
            "硬件版本每轮做三件事：余数左移、引入下一位、减去除数。",
            "减法结果的符号，决定这一位商是零还是一。",
            "循环到全部位处理完，商和余数同时出炉。",
            "所以早期 CPU 里，除法要几十个周期，比加法慢一个数量级。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "硬件讲完，换到软件视角：类型转换。",
            "第一个结论，也最容易被忽略：位模式不变。",
            "把负一强制转成无符号，内存里还是八个一。",
            "变的是编译器怎么读：有符号读成负一，无符号读成二百五十五。",
            "所以八位有符号转无符号，负数会跳到一个很大的正数。",
            "这不是错误，是同一串位的另一种解释。",
        ],
    },
    {
        "id": "s10",
        "cues": [
            "类型转换只有两种命运：改解释，或者改位。",
            "同宽度的有符号无符号互换，只改解释，位不动。",
            "位不动，值就按另一套规则重算，可能突变。",
            "所以无符号和有符号比较大小，结果常常反直觉。",
            "负一会变成最大的无符号数，比任何正数都大。",
            "写循环时，无符号做递减判断，很容易变成死循环。",
        ],
    },
    {
        "id": "s11",
        "cues": [
            "整型和浮点之间转换，风险就实打实了。",
            "float 尾数二十三位，加上隐含的一，能精确表示二十四位整数。",
            "二的二十四次方以内的整数，转成 float 不丢精度。",
            "超过这个范围，低位就被挤掉了。",
            "反过来，浮点转整型，小数部分直接截断，不是四舍五入。",
            "一旦超出整型范围，就是溢出，C 语言里属于未定义行为。",
        ],
    },
    {
        "id": "s12",
        "cues": [
            "长度不同的整数互转，规则只有两条。",
            "短转长：符号扩展，高位补符号位；无符号就补零。",
            "长转短：高位直接截断，低位保留。",
            "截断不报错，但值会被悄悄改写。",
            "浮点这边，float 转 double 精确，反过来可能丢精度。",
            "因为 double 的尾数更长，塞回 float 只能舍入。",
        ],
    },
    {
        "id": "s13",
        "cues": [
            "最后是语法层面：隐式转换和显式转换。",
            "隐式转换发生在混合运算里，编译器按规则自动提升。",
            "注意，规则不是简单地往精度高的那一方转。",
            "有符号和无符号混合时，有符号会被转成无符号，这才是坑。",
            "显式转换由你指定目标类型，风险也随之转移给你。",
            "精度丢失、数据截断、数值溢出，编译器都不拦。",
        ],
    },
    {
        "id": "s14",
        "cues": [
            "收个尾。",
            "运算电路：半加器两个门，全加器三个输入，串起来就是加法器。",
            "减法靠取反加一，乘法靠移位相加，除法靠移位试减。",
            "标志位里，OF 是最高位进位异或次高位进位。",
            "类型转换：位模式不变是常态，变的是解释。",
            "变长度就符号扩展或截断，跨类型就可能丢精度。",
            "这两块串起来，选择题和综合题都有抓手。",
            "有帮助的话点个赞，我们下期见。",
        ],
    },
]


async def synth(text, out_path, timeout=75):
    """Synthesize one scene's narration, collecting WordBoundary offsets (100ns).

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
            print(f"  (retry {attempt}/{MAX_RETRIES} {os.path.basename(out_path)} in {delay:.1f}s: {type(e).__name__})", flush=True)
            await asyncio.sleep(delay)
    return None


def _norm(s):
    out = []
    for ch in s:
        if ch.isalnum() or "\u4e00" <= ch <= "\u9fff":
            out.append(ch)
    return "".join(out)


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
        out[0]["start"] = max(0.0, round(out[0]["start"], 3))
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

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    lines = [
        "// AUTO-GENERATED by scripts/arith-convert/generate_tts.py — 不要手改。",
        '// 重新生成："C:/Program Files/Python310/python.exe" scripts/arith-convert/generate_tts.py',
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
