"""
Generate TTS audio for the "虚拟存储器" video using edge-tts.

Same pipeline as scripts/tcp-basics/generate_tts.py: one mp3 per scene, and the
WordBoundary / SentenceBoundary events are streamed so per-cue subtitle timings
land exactly on the narration.

Output:
  public/virtual-memory/s00.mp3 ... s19.mp3
  src/VirtualMemory/timings.ts   (auto-generated: cue frames + scene frames)

Source material:
  https://www.csgraduates.com/constitution_principle/storage/virtual/
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
OUT_DIR = os.path.join(BASE_DIR, "public", "virtual-memory")
TS_PATH = os.path.join(BASE_DIR, "src", "VirtualMemory", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)

# 每个场景 = 一段连续旁白，cues 是逐句字幕（一句一条，控制在 ~34 字以内）
SCENES = [
    {
        "id": "s00",
        "cues": [
            "物理内存就那么多，程序却越开越大。怎么办？",
            "答案是把内存虚拟化，这就是虚拟存储器。",
            "它在物理内存和磁盘之间，造出一个更大的抽象空间。",
            "程序看到的是连续、完整的一段地址空间。",
            "实际这些地址可能分散在内存各处，甚至根本不在内存里。",
            "把逻辑地址空间和物理内存解耦，这是设计的核心。",
            "这一期拆成四个问题：怎么划分、怎么翻译、怎么查表、怎么访存。",
            "先看两种内存到底差在哪。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "物理内存，就是主板上的 RAM 芯片，真实存在的硬件。",
            "访问它必须用物理地址，也就是每个存储单元的唯一编号。",
            "虚拟内存不是一块硬件，它是一种内存管理技术。",
            "它让每个进程都以为自己独占一块连续的内存。",
            "哪怕物理内存不够用，或者被别的进程切得很散。",
            "进程只用虚拟地址，不需要知道物理内存还剩多少。",
            "要访问数据时，操作系统和硬件把虚拟地址翻译成物理地址。",
            "一句话：进程管虚拟地址，硬件管翻译，物理内存管落地。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "要管理这么大的空间，先得把它切成固定大小的块。",
            "虚拟空间切成虚拟页，物理空间切成物理页框。",
            "页和页框一样大，最常见的是四 KB。",
            "程序运行时，不需要把整个地址空间装进内存。",
            "用到哪一页，才把哪一页调进来，其余的留在磁盘上。",
            "页面不在内存，就触发缺页中断，由内核把它调进来。",
            "内存满了，还要挑一页换出去，这叫页面置换。",
            "整个过程对程序透明，它只会觉得这一次访问慢了一点。",
            "顺带还带来两个好处：进程隔离，还有内存共享。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "页式管理的地址，结构特别规整。",
            "虚拟地址分成两段：前面是虚拟页号，后面是页内偏移。",
            "物理地址也分成两段：物理页号，加页内偏移。",
            "关键的一点：两边的偏移完全相同，一个位都不差。",
            "所以地址翻译，只需要把虚拟页号换成物理页号。",
            "页大小是二的偏移位数次方，虚页数是二的 VPN 位数次方。",
            "再记两个同义词：虚拟页又叫逻辑页，页框就是物理页。",
            "考试里换着叫，别被绕晕。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "翻译是谁做的？CPU 里有个部件叫内存管理单元，MMU。",
            "它干三件事：地址转换、地址保护、访问权限控制。",
            "很多同学会卡在这里：页表是操作系统维护的，翻译却是硬件做的。",
            "这不矛盾，关键在分工。",
            "操作系统提供规则和数据，硬件执行翻译过程。",
            "页表的层级、每一位的含义，都由 CPU 架构规范定死。",
            "操作系统只是照着规范，在内存里把页表搭出来。",
            "真正的翻译，是 MMU 按当前页表基址，一级一级查出来的。",
            "对软件完全透明，不需要操作系统逐条参与。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "页表就是一张映射表，一行叫一个页表项，PTE。",
            "单级页表里，虚拟页号是下标，不需要真的存进去。",
            "所以页表项里最关键的是物理页号，PPN。",
            "还有一个有效位，valid，一表示这个页在内存里。",
            "valid 为零，说明页不在内存，要触发缺页。",
            "修改位 dirty 记这一页有没有被写过，写过换出时要写回磁盘。",
            "访问位 accessed 记有没有被读过，给置换算法用。",
            "保护位管读写执行权限，缓存位管能不能进 cache。",
            "后面两位考得少，前三个必须看。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "来算一道最典型的题。",
            "虚拟内存十六 MB，物理内存一 MB，页面四 KB。",
            "先看偏移：四 KB 是二的十二次方，所以偏移十二位。",
            "虚拟地址总位数，十六 MB 是二的二十四次方，二十四位。",
            "物理地址一 MB，二十位。",
            "那 VPN 就是二十四减十二，十二位；PPN 是二十减十二，八位。",
            "现在翻译地址 0x321654。",
            "低十二位 0x654 是页内偏移，直接照抄。",
            "高十二位 0x321 是虚拟页号，拿它当页表下标。",
            "查到第 0x321 个页表项，看 valid。",
            "为零就缺页，为一就取出 PPN，和偏移拼成物理地址。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "单级页表有个硬伤：太大。",
            "三十二位地址空间是四 GB，页面四 KB，就有一百万个虚拟页。",
            "每个页表项四字节，页表本身就是四 MB。",
            "四 MB 必须常驻内存，可程序可能只用了几百 KB。",
            "这不划算，而且每个进程都要来一份。",
            "根源在于：虚拟空间大部分是空的，页表却按最大规模一次铺开。",
            "能不能只给用到的部分建页表？",
            "能，这就是多级页表。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "多级页表的做法，是把 VPN 再切几刀。",
            "切成 k 段，前 k 减一段查到的都是下一级页表的位置。",
            "只有最后一段，查到的才是真正的物理页号。",
            "所以翻译一次，要查 k 次页表。",
            "这里是用时间换空间。",
            "省在哪？只有第一级页表必须常驻。",
            "后面几级按需分配，用不到的那一项 valid 为零，就不建下级页表。",
            "典型程序四 GB 空间里大部分是没分配的，这一省就是几个数量级。",
            "代价是访存次数变多，所以后面还需要 TLB。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "每个进程都有自己的页表，那 MMU 怎么知道用哪一张？",
            "靠一个寄存器：页表基址寄存器，PTBR。",
            "它存的是当前进程顶级页表在物理内存里的起始地址。",
            "注意，存的是物理地址，不是虚拟地址。",
            "每个进程的 PCB 里都记着自己页表的物理基址。",
            "进程切换时，操作系统把新进程的基址写进 PTBR，比如 x86 的 CR3。",
            "从这一刻起，MMU 查的就是新进程的页表。",
            "所以进程切换，本质就是换了一张地址空间的地图。",
            "同一时刻，只有一个 PTBR 生效。",
        ],
    },
    {
        "id": "s10",
        "cues": [
            "页表在内存里，翻译一次至少多一次访存。",
            "多级页表更惨，四级的要访存四次。",
            "于是 CPU 里加了一个小缓存，专门存最近的翻译结果，TLB。",
            "它按行组织，每行有 tag，有物理页号，还有有效位。",
            "查找方式和 cache 一模一样：直接映射、全相联、组相联。",
            "用 VPN 的低几位选行或者选组，高位当 tag 去比对。",
            "直接映射时，匹配字段是行号；全相联时，匹配字段是零位。",
            "命中的条件有两个：valid 为一，tag 相同。",
            "命中就直接拿到物理页号；没命中，才去查页表。",
        ],
    },
    {
        "id": "s11",
        "cues": [
            "TLB 和 cache 经常被放在一起考，别混。",
            "TLB 存的是物理页号，也就是映射关系。",
            "cache 存的是主存里的数据块，是真正的内容。",
            "TLB 用虚拟页号去查。",
            "cache 用物理地址里的主存块号去查。",
            "TLB 只在地址翻译时用；cache 在拿到物理地址之后用。",
            "一句话对位：TLB 对页表，好比 cache 对主存。",
            "两者都是硬件，都在 MMU 附近，只是分工不同。",
        ],
    },
    {
        "id": "s12",
        "cues": [
            "现在说缺页。",
            "MMU 查到页表项，valid 为零，翻译进行不下去。",
            "这时触发一个异常，交给内核处理，这就是缺页中断。",
            "内核先判断原因：是没分配，是被换出到磁盘，还是非法访问。",
            "非法访问直接终止进程，就是常见的段错误。",
            "合法的缺页，得找一个物理页框。",
            "有空闲的就直接用；没有就按置换算法挑一页换出去。",
            "然后从磁盘把这一页读进来，更新页表，把 valid 置一。",
            "最后回到那条指令，重新执行一次，这次就能翻译成功了。",
        ],
    },
    {
        "id": "s13",
        "cues": [
            "这种按需调页的策略，叫请求页式管理。",
            "进程启动时，一页都不装，访问到才装。",
            "所以叫懒加载。",
            "和它对应的是预调页：运行前先装一部分甚至全部。",
            "考研语境下说虚拟存储，默认就是请求页式。",
            "再说一个容易误解的点：缺页之后不一定就要置换。",
            "缺页的本质是页表项 valid 为零，映射不完整。",
            "内核要做的是把映射补上：分配页框、读磁盘、改页表都可能。",
            "教材那句缺页就换页，是简化过的模型。",
        ],
    },
    {
        "id": "s14",
        "cues": [
            "内存满了，就得换出一页，选择权在置换算法。",
            "常用的有 LRU，最近最少使用，还有时钟算法。",
            "这里有两个位很关键。",
            "修改位 dirty 为一，说明这页被写过，换出前必须写回磁盘。",
            "为零就不用写回，直接丢掉，因为磁盘上还有副本。",
            "访问位 accessed 记录最近有没有被访问，置换算法靠它判断。",
            "被换出的页去哪？去交换分区，硬盘上专门划出来的一块。",
            "所以一次缺页，可能包含一次磁盘读，甚至再加一次磁盘写。",
        ],
    },
    {
        "id": "s15",
        "cues": [
            "把前面几块拼起来，就是完整的一次访存。",
            "第一步，从虚拟地址里取出虚拟页号。",
            "第二步，拿虚拟页号查 TLB。",
            "命中了，直接得到物理页号。",
            "没命中，去查页表。",
            "页表命中，取出物理页号，同时把这个映射填回 TLB。",
            "页表没命中，valid 为零，缺页中断，调页、改页表，再重来。",
            "第三步，把物理页号和页内偏移拼成物理地址。",
            "第四步，拿物理地址查 cache，命中就出数据。",
            "没命中，访问主存，再把这一块填进 cache。",
        ],
    },
    {
        "id": "s16",
        "cues": [
            "考大题最爱问：一共访存几次。",
            "按两条线数：翻译几次，取数几次。",
            "TLB 命中，翻译零次访存。",
            "TLB 没命中，查一级页表算一次，几级就几次。",
            "取数时 cache 命中，算一次访存；没命中，再加一次主存。",
            "所以最常见的那组答案：TLB 命中加 cache 命中，总共一次。",
            "TLB 没命中、单级页表、cache 命中，总共两次。",
            "如果缺页，还要再加一次磁盘读，脏页换出再加一次写。",
            "数的时候别漏了页表本身也在内存里这件事。",
        ],
    },
    {
        "id": "s17",
        "cues": [
            "来个综合题，把数算一遍。",
            "三十二位虚拟地址，四 KB 页面，页表项四字节。",
            "先定偏移：十二位。剩下二十位给虚拟页号。",
            "做两级页表，虚拟页号切成十位加十位。",
            "每级页表有多少项？二的十次方，一千零二十四项。",
            "每项四字节，一张页表正好四 KB，刚好一页。",
            "再看 TLB：六十四项，四路组相联。",
            "组数是十六组，所以 index 四位。",
            "虚拟页号二十位减四位，tag 是十六位。",
            "每个表项存 tag、物理页号、有效位和脏位。",
            "物理页号是三十二减十二，二十位。",
            "加起来十六加二十加一加一，三十八位。",
        ],
    },
    {
        "id": "s18",
        "cues": [
            "最后清几个高频坑。",
            "第一，页内偏移两边完全相同，翻译只换页号。",
            "第二，TLB 用虚拟页号查，cache 用物理地址查。",
            "第三，页表本身存在内存里，查页表就是访存。",
            "第四，缺页是 valid 为零，不是 cache 没命中。",
            "第五，有效位有两个含义：页表里表示在不在内存，TLB 里表示表项能不能用。",
            "第六，多级页表省的是空间，代价是访存次数。",
            "第七，脏位决定换出时要不要写回磁盘。",
            "这几条记牢，选择题基本不会错。",
        ],
    },
    {
        "id": "s19",
        "cues": [
            "最后把整条链串一遍。",
            "虚拟存储器把逻辑地址和物理内存解耦，程序看到连续空间，实际分散。",
            "空间切成页，地址切成页号加偏移。",
            "翻译靠页表，单级一次，多级多次。",
            "为了少访存，加了 TLB，用虚拟页号查。",
            "页不在内存就缺页，内核调页、改页表、重新执行。",
            "缺页多了要置换，脏页还得写回。",
            "一条链：虚拟地址、TLB、页表、物理地址、cache、主存。",
            "把这条链画熟，408 的存储大题就有抓手了。",
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

    lines = [
        "// AUTO-GENERATED by scripts/virtual-memory/generate_tts.py — 不要手改。",
        '// 重新生成："C:/Program Files/Python310/python.exe" scripts/virtual-memory/generate_tts.py',
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
