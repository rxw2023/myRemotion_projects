"""
Generate TTS audio for the "指令格式与寻址方式" video using edge-tts.

Same pipeline as scripts/tcp-basics/generate_tts.py: one mp3 per scene, but
WordBoundary/SentenceBoundary events are streamed so per-cue subtitle timings
land exactly on the narration. Scenes also drive every animation in the video —
each scene's visuals key off its own cue start frames.

Output:
  public/instruction-format/s00.mp3 ... s19.mp3
  public/instruction-format/cues.json
  src/InstructionFormat/timings.ts   (auto-generated: cue frames + scene frames)

Source material:
  https://www.csgraduates.com/constitution_principle/instruction/format/
"""
import asyncio
import json
import os
import random
import sys

import edge_tts
from mutagen.mp3 import MP3

VOICE = "zh-CN-XiaoxiaoNeural"  # 晓晓 - 女声，温暖稳重，适合讲原理
RATE = "+6%"
FPS = 30
TAIL_FRAMES = 40  # 每个场景末尾留白：3b1b 风格需要一个"呼吸"的停顿
MAX_RETRIES = 6
RETRY_BASE_DELAY = 3.0

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "instruction-format")
TS_PATH = os.path.join(BASE_DIR, "src", "InstructionFormat", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)

# 每个场景 = 一段连续旁白，cues 是逐句字幕（一句一条，控制在 ~34 字以内）
SCENES = [
    # ========== 第一幕：指令格式 ==========
    {
        "id": "s00",
        "cues": [
            "一条指令，说到底就一句话：对什么数据，做什么操作。",
            "所以它被切成两部分：操作码，和地址。",
            "操作码决定做什么，地址决定对谁做。",
            "这一期，先把格式拆开，再把八种寻址方式走一遍。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "操作码决定这是一条什么指令。",
            "加、减、搬运、跳转，全靠它区分。",
            "地址这个词要小心，它是一个统称。",
            "它可以是内存地址，代号 addr。",
            "可以是寄存器编号，代号 reg。",
            "也可以直接是一个立即数，代号 imm。",
            "同一个位置，放的东西不同，取数的方式就不同。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "按操作码分类，指令有七大类。",
            "第一类，数据传输：MOV 搬运，PUSH 入栈，POP 出栈。",
            "第二类，算术逻辑：加减乘除，与或非，还有 CMP 比较。",
            "第三类，控制转移：JMP 无条件跳转，Jxx 条件跳转，CALL 调用，RET 返回。",
            "第四类，输入输出：IN 读端口，OUT 写端口。",
            "剩下三类比较边缘：字符串操作、陷阱指令、协处理器指令。",
            "记住前三类就够用了，考场上的题九成在这里。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "换个维度分，看一条指令里写了几个地址。",
            "零地址指令，只写操作码。操作数藏在栈顶，靠 PUSH 和 POP 供给。",
            "一地址指令，写一个地址，它既是源也是目的。",
            "二地址指令最常见：A1 和 A2 运算，结果写回 A1。",
            "三地址指令多一个目的地址，结果写进 A3，不破坏源操作数。",
            "还有四地址指令，多存一个下条指令的地址，现代机器已经不用了。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "指令的长度怎么定，是两条完全不同的路。",
            "定长：所有指令一样长，代表是 ARM 这类 RISC。",
            "解码简单，取指一步到位，代价是有时在浪费空间。",
            "变长：不同指令不同长度，代表是 x86，属于 CISC。",
            "编码紧凑，能塞下复杂操作，代价是指令边界不好找。",
            "这两种设计，各自引出一个必考的变形问题。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "第一个问题：定长指令里，各条指令要的地址字段数量不一样，怎么统一？",
            "办法是无效字段填充。缺的部分用填充值占位，不参与执行。",
            "长度就齐了，硬件解码逻辑也不必为每条指令单独设计。",
            "第二个问题：变长指令里，CPU 怎么知道一条指令到哪里结束？",
            "常用办法是指令前缀：在开头放一个字段，说明这条指令有多长。",
            "也可以在操作码的高位嵌标志位，先读前缀，再决定读几位。",
            "代价是解码变复杂，换来的是编码灵活、指令集好扩展。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "定长指令里，还有一种思路更常考：操作码扩展编码。",
            "它让操作码本身有层次：先读一小段，如果是扩展前缀，就继续往下读。",
            "于是指令系统变成：可变长的操作码，配定长的指令字。",
            "这里有一条硬规则，叫前缀编码。",
            "任何一个短操作码，都不能是长操作码的前缀。",
            "比如四位操作码里已经用了 0000，六位操作码就不能再以 0000 开头。",
            "否则解码器读到 0000，根本不知道该停，还是该继续。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "来看真题。指令长十六位，操作码四位，地址码四位。",
            "要求做出：三地址十五条，二地址十二条，一地址六十三条，零地址十六条。",
            "先看三地址。四位操作码有十六个编码，用掉十五个，从 0000 到 1110。",
            "只剩 1111 这一个前缀，拿它去扩。",
            "三地址后面跟三个地址，二地址只用两个，所以二地址的操作码是八位。",
            "1111 后面还有四位，共十六个编码，用掉十二个：从 1111 0000 到 1111 1011。",
            "剩下四个前缀：1100、1101、1110、1111，全都挂在 1111 之后。",
            "再往下扩四位，一地址的操作码变成十二位。",
            "四个前缀，每个配十六种，一共六十四个编码。",
            "用掉六十三个，只剩最后一个：全一。",
            "它再扩四位，正好给零地址留出十六个编码。",
            "整棵树走完，一层层把编码空间切小，这就是扩展操作码。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "把这个过程抽成算法，只有一句话。",
            "每往下扩一层，可用编码数等于：上一层剩下的前缀数，乘以二的扩展位数次方。",
            "再减掉这一层实际用掉的条数，剩下的继续往下传。",
            "所以判断一道题能不能做出来，就看每一步的剩余量会不会变成负数。",
            "常见问法有两种：给条数，求某类最多几条；或者反过来，问你设计得对不对。",
            "只要守住前缀编码这一条，答案就是唯一的。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "这套思想不只属于 CPU。",
            "网络里的变长子网划分，是把 IP 地址空间按前缀一层层切开。",
            "每往下一层扩一位，地址空间就减半。",
            "两个问题，长成了同一棵二叉树。",
        ],
    },
    # ========== 第二幕：寻址方式 ==========
    {
        "id": "s10",
        "cues": [
            "格式讲完，进入第二幕：寻址方式。",
            "寻址方式回答一个问题：操作数到底在哪里？",
            "先纠正一个常见误解。",
            "寻址方式针对的是每一个操作数，不是整条指令。",
            "MOV AX, 1234H 这一条，其实是两种寻址拼起来的。",
            "AX 是寄存器寻址，1234H 是立即寻址。",
            "考试里说这条指令采用立即寻址，指的是源操作数，按这个习惯理解就行。",
        ],
    },
    {
        "id": "s11",
        "cues": [
            "第一种，立即寻址。操作数直接写在指令里。",
            "取操作数不用访存，速度最快。",
            "适合加载常量、和固定值比较。",
            "缺点也很明显：它是常数，不能改，也不能当左值。",
        ],
    },
    {
        "id": "s12",
        "cues": [
            "第二种，寄存器寻址。操作数放在寄存器里。",
            "指令里写的是寄存器编号，同样不访存。",
            "MOV AX, BX，把 BX 的值拷进 AX。",
            "寄存器数量有限，所以编号字段很短。",
        ],
    },
    {
        "id": "s13",
        "cues": [
            "第三种，直接寻址。指令里直接给出内存地址。",
            "有效地址就是那个地址本身，访存一次。",
            "MOV R1, [1000]，去一千号单元把数据取回 R1。",
            "注意，现代机器上这个地址是虚拟地址，真正访存前还要过一遍地址翻译。",
        ],
    },
    {
        "id": "s14",
        "cues": [
            "第四种，间接寻址。指令给出的是地址的地址。",
            "先去取一次地址，再按这个地址取数据，访存两次。",
            "它最常用的形态是寄存器间接：地址存在寄存器里。",
            "MOV R1, [R2]，R2 里装着地址，取数只要访存一次。",
            "指针和链表能跑起来，靠的就是它。",
        ],
    },
    {
        "id": "s15",
        "cues": [
            "第五种，基址寻址。有效地址等于基址寄存器加上偏移量。",
            "基址由系统定，程序运行中基本不变；变的是那个偏移量。",
            "8086 里有两个寄存器干这活：BX 管数组和结构体的起点，BP 管函数栈帧的栈底。",
            "看栈帧：BP 指的位置存着旧 BP，往上 BP 加二存返回地址，加四加六是参数。",
            "往下 BP 减二减四，是局部变量。",
            "所以函数里的局部变量，地址都是 BP 减一个常数。",
        ],
    },
    {
        "id": "s16",
        "cues": [
            "第六种，变址寻址。形式一样，也是两个值相加。",
            "区别在谁在变：基址寻址里基址不动，变址寻址里变址寄存器在运行时变。",
            "遍历数组最典型：BX 指数组起点不动，SI 一个一个往后挪。",
            "第一次 BX 加零，第二次加二，第三次加四。",
            "一句话记：基址配偏移量管结构体，变址配索引管数组和循环。",
        ],
    },
    {
        "id": "s17",
        "cues": [
            "第七种，相对寻址。有效地址等于 PC 加偏移量。",
            "这里有个坑：PC 指的是下一条指令的地址，不是当前这条。",
            "看例子。je 指令在 1000，长两个字节。",
            "执行时 PC 已经指到 1002。",
            "指令里存的是偏移 18，两者相加，跳到 101A。",
            "为什么不用绝对地址？因为程序装到哪里都能跑。",
            "指令之间的相对距离不变，机器码就不用改，这就是位置无关代码。",
        ],
    },
    {
        "id": "s18",
        "cues": [
            "最后一种，堆栈寻址。操作数在栈里，用 SP 定位栈顶。",
            "PUSH 时栈顶下移，数据压进去；POP 时数据弹出，栈顶上移。",
            "函数调用、现场保护，全靠这一套。",
        ],
    },
    {
        "id": "s19",
        "cues": [
            "八种寻址，一张表收住。",
            "看两个指标：有效地址怎么算，要访存几次。",
            "立即和寄存器，零次；直接、寄存器间接、基址、变址、相对、堆栈，一次。",
            "内存间接，两次。用在哪：立即配常量，寄存器配变量，直接配固定单元。",
            "基址配栈帧，变址配数组，相对配跳转，堆栈配函数调用。",
            "格式决定这条指令怎么读，寻址决定数据去哪里取。",
            "把这两件事分清楚，指令系统这一章就立住了。",
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
        "// AUTO-GENERATED by scripts/instruction-format/generate_tts.py — 不要手改。",
        '// 重新生成：python scripts/instruction-format/generate_tts.py',
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
