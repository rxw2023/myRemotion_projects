"""
Generate TTS audio for the "指令操作码" video using the DeepSeek TTS API.

管线与 scripts/high-low-language/generate_tts.py 完全一致：
DeepSeek 的 /v1/tools/tts 只回音频、不回 SentenceBoundary，拿不到字级时间戳，
所以**一句一请求**，每句自己的时长就是这句的精确时长，依次累加即得字幕时间轴。
句间补 140ms 静音，听感上正好是一句话的停顿。

Output:
  public/instruction-ops/s00.wav ... s11.wav   (24kHz / 16bit / mono)
  public/instruction-ops/cues.json
  src/InstructionOps/timings.ts                (auto-generated: cue frames + scene frames)

两个引擎，产物格式与时间轴算法完全相同（都是一句一请求，最后写 wav）：
  deepseek（默认）: /v1/tools/tts，voice stella，要 DEEPSEEK_API_KEY
  edge          : edge-tts 晓晓，免费无需 key，与前四期音色一致

用法:
  python scripts/instruction-ops/generate_tts.py            # 全部（有缓存会跳过）
  python scripts/instruction-ops/generate_tts.py --edge      # 换 edge-tts 晓晓
  python scripts/instruction-ops/generate_tts.py --dry       # 不联网，按字数估时长，先跑通版式
  python scripts/instruction-ops/generate_tts.py --force     # 忽略缓存，全部重合成
  python scripts/instruction-ops/generate_tts.py s03 s07     # 只做某几场

Source material:
  https://www.csgraduates.com/constitution_principle/instruction/instruction_ops/
"""
import asyncio
import json
import os
import random
import sys
import urllib.error
import urllib.request
import wave

API_URL = "https://api.deepseek.com/v1/tools/tts"
VOICE = "stella"  # stella（女，默认）/ tide（男）
EDGE_VOICE = "zh-CN-XiaoxiaoNeural"  # edge-tts 晓晓，前四期用的音色
ENGINE = os.environ.get("TTS_ENGINE", "deepseek")
SAMPLE_RATE = 24000  # pcm 固定 24kHz / 16bit / mono
BYTES_PER_SEC = SAMPLE_RATE * 2
CUE_GAP = 0.14  # 句间静音（秒）
FPS = 30
TAIL_FRAMES = 40
MAX_RETRIES = 5
RETRY_BASE_DELAY = 2.5
CONCURRENCY = 6  # 账号上限 50 并发，留余量避免 429

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "instruction-ops")
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache")
TS_PATH = os.path.join(BASE_DIR, "src", "InstructionOps", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# ==========================================================================
# 旁白：一场 = 一段连续叙述，一句一条字幕（控制在 ~30 字）
#
# 全片主线：每条指令都在改某几份状态 —— 寄存器 / 内存 / 标志位 / PC / I/O 端口。
# 十三个小节按功能分七大类，但每一类的画面语言是同一张五格状态板。
# ==========================================================================
SCENES = [
    {
        # 主题页：门牌 + 目录 + 主线
        "id": "s00",
        "cues": [
            "上一期把 C 语言翻译成了汇编，这一期看这些汇编到底在干什么。",
            "指令操作码，就是每条指令开头那几个比特，它决定 CPU 要做哪个动作。",
            "不同架构的操作码长得不一样，但要做的事翻来覆去就那么几类。",
            "这一期按功能把它们分成六大类，一条一条过。",
            "主线只有一句话：每条指令，都在改某几份状态。",
            "寄存器、内存、标志位、程序计数器、输入输出端口，就这五份。",
            "看完你会发现，分类不是背名字，是问它动了谁。",
        ],
    },
    {
        # 总纲：五份状态 + 六大类
        "id": "s01",
        "cues": [
            "先把机器拆开，看看有哪些东西能被指令改动。",
            "第一份，通用寄存器。eax、ebx 这些，相当于 CPU 手边最快的抽屉。",
            "第二份，内存。所有变量、数组、还有运行栈，都住在这里。",
            "第三份，标志位。结果是不是零、有没有进位、有没有溢出，记在这几个比特上。",
            "第四份，程序计数器。它永远指向下一条要执行的指令，改它就能改流程。",
            "第五份，输入输出端口。这是 CPU 跟外设说话的唯一窗口。",
            "一条指令不管多复杂，动作范围不会超出这五份。",
            "所以按它动哪一份来分类，就不会乱。",
        ],
    },
    {
        # MOV
        "id": "s02",
        "cues": [
            "第一类，数据传输。最典型的是 mov。",
            "它只做一件事：把第二个操作数，复制到第一个操作数。",
            "源可以是寄存器、内存或者常数，目的地可以是寄存器或者内存。",
            "两两组合一共五种写法，覆盖了寄存器与内存之间的全部搬运。",
            "注意，内存到内存不能直接搬，必须过一次寄存器。",
            "mov 不改标志位，也不算数，它只是把值挪个地方。",
            "执行完，源操作数里的值还在，这叫复制，不叫剪切。",
        ],
    },
    {
        # PUSH / POP
        "id": "s03",
        "cues": [
            "栈是程序运行时的临时仓库，从高地址往低地址长。",
            "push 把数据压到栈顶，pop 从栈顶把数据取走。",
            "push 其实是两条动作的合并：先把栈指针减四，再把值写进新栈顶。",
            "pop 反过来：先读出栈顶的值，再把栈指针加四。",
            "所以一条 push，同时改了两份状态：内存和栈指针。",
            "它俩都是零地址思维：操作数藏在栈顶，指令里不用写地址。",
            "入栈出栈能交换两个寄存器的值，中间就是借了一次内存。",
            "记住，栈指针永远指向栈顶，往下走是压，往上走是弹。",
        ],
    },
    {
        # ADD / SUB / MUL / DIV
        "id": "s04",
        "cues": [
            "第二类，算术运算。add 加法，sub 减法，结果写回第一个操作数。",
            "它们顺手更新标志位：结果是不是零、有没有进位、有没有溢出。",
            "乘除就没这么自由了，x86 给它们指定了固定的寄存器。",
            "乘法的被乘数默认在 eax，乘积放进 edx 和 eax 拼起来的六十四位里。",
            "除法也是这个寄存器对当被除数，除完商回 eax，余数回 edx。",
            "所以做除法前一定要先把 edx 清零，否则高位残留会污染被除数。",
            "无符号除法前异或自己清零，有符号除法前用 cdq 做符号扩展。",
            "除零会直接触发异常，这是硬件层面的检查，不是软件判断出来的。",
        ],
    },
    {
        # 位操作 + 移位
        "id": "s05",
        "cues": [
            "位操作直接对二进制位动手，四种：与、或、异或、取反。",
            "与用来清零，或用来置一，异或用来翻转指定位。",
            "xor eax, eax 是最经典的清零写法，自己异或自己，结果必定为零。",
            "移位分三种，区别只在空出来的那几位补什么。",
            "逻辑移位一律补零，用于无符号数；算术右移补符号位，用于有符号数。",
            "所以负十六算术右移一位是负八，逻辑右移一位就变成一个大正数了。",
            "循环移位不补任何东西，移出去的位从另一端转回来，一个比特都不丢。",
            "记住左移一位等于乘二，这个技巧后面讲函数调用还会用到。",
        ],
    },
    {
        # CMP
        "id": "s06",
        "cues": [
            "比较指令 cmp，是这一期最该单独拎出来的一条。",
            "它做减法，但结果不保存，只更新标志位。",
            "换句话说，cmp 相当于 sub，只是第一个操作数的值原封不动。",
            "四个标志位各管一件事：结果为零、结果为负、无符号借位、有符号溢出。",
            "cmp 自己不跳，它只是把结论写进标志位，等后面的指令来读。",
            "这就是为什么比较和跳转永远成对出现。",
            "也解释了真题那个问法：哪条指令不改变程序流程，cmp 就是一个。",
        ],
    },
    {
        # JMP / Jcc
        "id": "s07",
        "cues": [
            "第三类，控制转移。它动的不是数据，是程序计数器。",
            "jmp 无条件跳，直接把程序计数器改成目标地址，中间那段就跳过了。",
            "跳转多用相对寻址，指令里存的是偏移量，不是绝对地址。",
            "偏移量等于目标地址，减去 jmp 下一条指令的地址。",
            "为什么减下一条？因为取指之后，程序计数器已经指向下一条了。",
            "条件跳转多一个前提：先看标志位，成立才跳，不成立就顺着往下走。",
            "有符号数用 jg、jl 这一套，无符号数用 ja、jb 这一套。",
            "为什么要两套？因为 CPU 根本不知道你比较的是 int 还是 unsigned。",
            "同一组标志位，编译器认定有符号就用 jg，认定无符号就用 ja。",
        ],
    },
    {
        # CALL / RET
        "id": "s08",
        "cues": [
            "子程序调用，是控制转移里唯一需要栈的。",
            "call 做两件事：把下一条指令的地址压栈，然后跳到子程序入口。",
            "压进去的这个地址叫返回地址，它是子程序能回来的唯一凭证。",
            "ret 反过来：从栈顶弹出返回地址，再把它写回程序计数器。",
            "于是控制流回到了 call 的下一条，好像什么都没发生过。",
            "所以 call 和 ret 动的状态最多：计数器、内存里的栈、还有栈指针。",
            "这也解释了上一期栈帧里那个位置：返回地址为什么夹在参数和旧栈底中间。",
        ],
    },
    {
        # INT
        "id": "s09",
        "cues": [
            "陷阱指令是一类特殊的转移：由程序主动触发，跳进操作系统。",
            "int 后面跟一个中断向量号，CPU 拿它去中断向量表里查处理程序的地址。",
            "这一步不只是改程序计数器，还要保存现场，压入标志位和返回地址。",
            "执行它的瞬间，CPU 从用户态切到内核态，权限提高了。",
            "系统调用就是靠这个进的：把功能号放进寄存器，然后触发中断。",
            "处理完，iret 把现场恢复，回到用户态接着往下跑。",
            "注意它和单步标志不是一回事：int 是程序写的，单步标志是每条指令后自动触发。",
        ],
    },
    {
        # CLI/STI + IN/OUT + 字符串
        "id": "s10",
        "cues": [
            "还剩三小组，都跟 CPU 的外部世界有关。",
            "cli 和 sti 只改标志位里的一个比特：中断允许位。",
            "清零就关中断，置一就开中断。",
            "但它只挡得住可屏蔽中断，不可屏蔽中断照样能进来。",
            "in 和 out 负责跟端口打交道，从端口读进寄存器，或者把寄存器写出去。",
            "这里有个常考的点：只有独立编址，才需要 in 和 out。",
            "统一编址时端口就是内存的一部分，用 mov 就够了。",
            "字符串指令基本不考，知道它们靠隐含寄存器批量搬数据就行。",
        ],
    },
    {
        # 收口表
        "id": "s11",
        "cues": [
            "最后，把十三类指令压成一张表。",
            "横着是五份状态，竖着是六大类。",
            "哪一格打勾，就是这条指令动了谁。",
            "mov 只动寄存器，cmp 只动标志位，jmp 只动程序计数器。",
            "push 和 call 动得最多，内存、栈指针、计数器一起改。",
            "所以问会不会改变执行流程，看计数器那一列就够了。",
            "问会不会影响标志位，看标志位那一列就够了。",
            "分类题不考记忆，考的是你有没有把机器拆成这几份状态来看。",
        ],
    },
]


# ==========================================================================
# 合成
# ==========================================================================
def post_tts(text, key):
    """POST /v1/tools/tts，返回裸 PCM。只有标准库，不依赖 requests。"""
    body = json.dumps({"text": text, "voice_id": VOICE, "format": "pcm", "filter_markdown": True}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        ct = r.headers.get("Content-Type", "")
        if "json" in ct or "text" in ct:
            raise RuntimeError(f"unexpected content-type {ct}: {r.read()[:120]!r}")
        return r.read()


def synth(text, cache_path):
    """一句话 -> 裸 PCM（24kHz/16bit/mono），带磁盘缓存与退避重试。"""
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        with open(cache_path, "rb") as f:
            return f.read()

    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key:
        raise RuntimeError("缺少 DEEPSEEK_API_KEY：先 export DEEPSEEK_API_KEY=sk-... 再跑（或写进 .env 后 source）。")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            pcm = post_tts(text, key)
            # "音频开始后才失败，响应会被截断" —— 短到不像一句话就是失败
            if len(pcm) < BYTES_PER_SEC * 0.25:
                raise RuntimeError(f"audio too short: {len(pcm)} bytes")
            with open(cache_path, "wb") as f:
                f.write(pcm)
            return pcm
        except urllib.error.HTTPError as e:
            detail = e.read()[:160].decode("utf-8", "replace")
            if e.code == 400:
                # 内容审核不过：改词，重试没意义
                raise RuntimeError(f"400 {detail}（内容审核未过，换一种说法）") from e
            if attempt == MAX_RETRIES:
                raise RuntimeError(f"HTTP {e.code}: {detail}") from e
            delay = RETRY_BASE_DELAY * attempt + random.uniform(0, 1.2)
            print(f"    retry {attempt}/{MAX_RETRIES} HTTP {e.code} in {delay:.1f}s", flush=True)
            time_sleep(delay)
        except Exception as e:  # noqa: BLE001  网络抖动 / 截断，退避重试
            if "400" in str(e) or attempt == MAX_RETRIES:
                raise
            delay = RETRY_BASE_DELAY * attempt + random.uniform(0, 1.2)
            print(f"    retry {attempt}/{MAX_RETRIES} in {delay:.1f}s: {type(e).__name__} {e}", flush=True)
            time_sleep(delay)
    raise RuntimeError("unreachable")


def synth_edge(text, cache_path):
    """edge-tts 一句话 -> 裸 PCM（24kHz/16bit/mono），带磁盘缓存。

    edge 只吐 mp3，所以每句过一次 ffmpeg 解成裸 PCM —— 与 DeepSeek 那条路产物一致，
    后面的拼 wav、算时间轴代码完全不用分叉。
    """
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        with open(cache_path, "rb") as f:
            return f.read()

    import subprocess

    import edge_tts

    mp3 = cache_path + f".{os.getpid()}.mp3"
    asyncio.run(edge_tts.Communicate(text, EDGE_VOICE).save(mp3))
    try:
        pcm = subprocess.run(
            ["ffmpeg", "-v", "quiet", "-i", mp3, "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"],
            capture_output=True,
            check=True,
        ).stdout
    finally:
        if os.path.exists(mp3):
            os.remove(mp3)
    if len(pcm) < BYTES_PER_SEC * 0.25:
        raise RuntimeError(f"audio too short: {len(pcm)} bytes")
    with open(cache_path, "wb") as f:
        f.write(pcm)
    return pcm


def time_sleep(sec):
    import time

    time.sleep(sec)


def write_wav(path, pcm):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm)


# ==========================================================================
# 主流程
# ==========================================================================
async def build_scene(scene, sem, force):
    sid = scene["id"]
    loop = asyncio.get_running_loop()

    async def one(i, text):
        cache_path = os.path.join(CACHE_DIR, f"{sid}_{i:02d}_{ENGINE}.pcm")
        if force and os.path.exists(cache_path):
            os.remove(cache_path)
        fn = synth_edge if ENGINE == "edge" else synth
        async with sem:
            for _ in range(3):
                try:
                    return await loop.run_in_executor(None, fn, text, cache_path)
                except Exception as e:  # noqa: BLE001
                    print(f"  [{sid}#{i}] {e}", flush=True)
                    break
            raise RuntimeError(f"{sid}#{i} failed")

    pcms = await asyncio.gather(*(one(i, t) for i, t in enumerate(scene["cues"])))

    gap = b"\x00" * int(BYTES_PER_SEC * CUE_GAP)
    blob = b""
    cues = []
    for pcm, text in zip(pcms, scene["cues"]):
        start = len(blob) / BYTES_PER_SEC
        end = start + len(pcm) / BYTES_PER_SEC
        cues.append({"text": text, "start": round(start, 3), "end": round(end, 3)})
        blob += pcm + gap

    wav_path = os.path.join(OUT_DIR, f"{sid}.wav")
    write_wav(wav_path, blob)
    duration = len(blob) / BYTES_PER_SEC
    print(f"[{sid}] OK {duration:6.2f}s  {len(scene['cues'])} cues -> {os.path.basename(wav_path)}", flush=True)
    return {"duration": round(duration, 3), "cues": cues}


def dry_scene(scene):
    """--dry：不联网，只按字数估时长，用来在没有 key 时先把 timings.ts 跑通、能抽帧看版式。"""
    cues, t = [], 0.0
    for text in scene["cues"]:
        dur = max(1.2, len(text) / (6.2 if ENGINE == "edge" else 4.8))  # 实测：edge 晓晓约 6.2、stella 约 4.7 字/秒
        cues.append({"text": text, "start": round(t, 3), "end": round(t + dur, 3)})
        t += dur + CUE_GAP
    return {"duration": round(t, 3), "cues": cues}


async def main():
    args = sys.argv[1:]
    global ENGINE
    force = "--force" in args
    dry = "--dry" in args
    if "--edge" in args:
        ENGINE = "edge"
    only = {a for a in args if not a.startswith("--")} or None

    meta_path = os.path.join(OUT_DIR, "cues.json")
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    sem = asyncio.Semaphore(CONCURRENCY)
    targets = [s for s in SCENES if not only or s["id"] in only]

    if dry:
        for s in targets:
            meta[s["id"]] = dry_scene(s)
            print(f"[{s['id']}] dry {meta[s['id']]['duration']:6.2f}s  {len(s['cues'])} cues")
        results = [None] * len(targets)
    else:
        results = await asyncio.gather(*(build_scene(s, sem, force) for s in targets), return_exceptions=True)

    failed = False
    for s, res in zip(targets, results):
        if isinstance(res, Exception):
            print(f"[{s['id']}] FAILED: {res}")
            failed = True
        elif res is not None:
            meta[s["id"]] = res

    if not dry:
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    if failed:
        print("\n有场景失败，timings.ts 未更新。修好后重跑（已合成的句子有缓存，不会重复计费）。")
        return

    lines = [
        "// AUTO-GENERATED by scripts/instruction-ops/generate_tts.py — 不要手改。",
        "// 重新生成：python scripts/instruction-ops/generate_tts.py",
        "//",
        ("// ⚠️ 这是 --dry 占位版：时长按字数估算，尚未合成音频。" if dry else
         "// 音频管线：DeepSeek /v1/tools/tts（voice stella，pcm 24kHz）一句一请求，"),
        ("// 拿到 key 后重跑本脚本即可覆盖。" if dry else
         "// pcm 24kHz，时长即字幕时间轴，cue 边界是精确值，不是按字数估的。"),
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
        frames = round(meta[sid]["duration"] * FPS) + TAIL_FRAMES
        scene_frames[sid] = frames
        lines.append(f"  {sid}: [")
        for c in meta[sid]["cues"]:
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

    os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)
    with open(TS_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))

    total_sec = sum(m["duration"] for m in meta.values())
    total_frames = sum(scene_frames.values()) - 8 * (len(scene_frames) - 1)
    chars = sum(len(c) for s in SCENES for c in s["cues"])
    print(f"\n=== {len(scene_frames)} scenes, {total_sec:.1f}s audio, {chars} 字 ===")
    print(f"  估算费用：{chars * 2 / 10000 * 0.225:.3f} USD（限时 5 折，汉字按 2 字符计）")
    for sid, f in scene_frames.items():
        print(f"  {sid}: {meta[sid]['duration']:6.2f}s -> {f}f")
    print(f"  TOTAL: {total_frames}f  ({total_frames / FPS:.1f}s)")
    print(f"  timings -> {TS_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
