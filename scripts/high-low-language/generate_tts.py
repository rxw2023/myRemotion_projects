"""
Generate TTS audio for the "高级语言与机器码" video using the DeepSeek TTS API.

与 scripts/udp-basics/generate_tts.py（edge-tts）的区别：
DeepSeek 的 /v1/tools/tts 只回音频、不回 SentenceBoundary，所以拿不到字级时间戳。
这里的做法是**一句一请求**：每句自己合成一次，时长就是这句的精确时长，
依次累加即得字幕时间轴 —— 比按字数比例估算准，也不会有整段的累计漂移。

代价：句与句之间没有自然连读，所以每句之间补 140ms 静音，听感上正好是一句话的停顿。

Output:
  public/high-low-language/s00.wav ... s11.wav   (24kHz / 16bit / mono)
  public/high-low-language/cues.json
  src/HighLowLanguage/timings.ts                 (auto-generated: cue frames + scene frames)

用法:
  python scripts/high-low-language/generate_tts.py            # 全部重来（有缓存会跳过）
  python scripts/high-low-language/generate_tts.py --force    # 忽略缓存，全部重合成
  python scripts/high-low-language/generate_tts.py s03 s07    # 只做某几场

Source material:
  https://www.csgraduates.com/constitution_principle/instruction/high_low_language/
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
SAMPLE_RATE = 24000  # pcm 固定 24kHz / 16bit / mono
BYTES_PER_SEC = SAMPLE_RATE * 2
CUE_GAP = 0.14  # 句间静音（秒）
FPS = 30
TAIL_FRAMES = 40
MAX_RETRIES = 5
RETRY_BASE_DELAY = 2.5
CONCURRENCY = 6  # 账号上限 50 并发，留余量避免 429

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "high-low-language")
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache")
TS_PATH = os.path.join(BASE_DIR, "src", "HighLowLanguage", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# ==========================================================================
# 旁白：一场 = 一段连续叙述，cues 是一句一条字幕（控制在 ~30 字）
# ==========================================================================
SCENES = [
    {
        "id": "s00",
        "cues": [
            "这一期，讲高级语言和机器码之间，隔着什么。",
            "一段 C 代码，要经过四道工序，才变成 CPU 能执行的二进制。",
            "预处理、编译、汇编、链接，每一步都有明确的输入和输出。",
            "然后我们看三样东西的汇编：选择、循环、函数调用。",
            "你会发现，它们在底层只是同一组动作：比较、跳转、压栈、弹栈。",
            "高级语言负责让人写得舒服，机器码负责让机器跑得动。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "先看全流程。一份 C 源文件进去，出来是一个可执行程序。",
            "中间要换四次手：预处理器、编译器、汇编器、链接器。",
            "对应的四个动作，叫预处理、编译、汇编、链接。",
            "预处理处理文本，编译器翻译语言，汇编器翻译指令，链接器拼接程序。",
            "注意产物形态：源文件、扩展代码、汇编代码、目标文件、可执行文件。",
            "每一步的产物，都是下一步的输入，一环扣一环。",
            "越往后，离人越远，离机器越近。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "第一步，预处理。它不懂语法，只做文本替换。",
            "三件事：展开头文件、替换宏、删掉注释。",
            "头文件包含，是把 include 的头文件内容，原样插进这一行。",
            "宏替换，是把 define 定义的标识，机械地换成它的值。",
            "注释对编译器没有意义，预处理阶段就被清空了。",
            "出来的东西叫扩展代码，还是 C 语言，只是变长了。",
            "记住一句：预处理只看井号开头的行，不做任何语义理解。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "第二步，编译。这是整条链上唯一真正理解语法的一步。",
            "输入扩展代码，输出汇编代码，中间走五个子过程。",
            "词法分析把字符流切成记号，语法分析把记号拼成语法树。",
            "语义分析检查类型是否匹配，中间代码生成一层与机器无关的表示。",
            "优化通常在这一层做，最后才生成具体的汇编指令。",
            "这里有个坑。日常说编译，指的是整个流程。",
            "但在流程内部，编译只负责到汇编代码，不负责机器码。",
            "把编译和汇编分开，是做概念题的关键。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "第三步，汇编。这一步没有多少智力含量，只是照表翻译。",
            "汇编器逐条解析汇编指令，翻译成对应的机器码。",
            "输出叫目标文件，已经是二进制，但还不能直接运行。",
            "因为里面的地址还是空的：函数在哪、全局变量在哪，都不知道。",
            "所以需要第四步，链接。链接器做三件事。",
            "第一件，符号解析：把每一处引用和它的定义对上。",
            "第二件，重定位：定下每个符号的最终地址，把指令里的占位数字改掉。",
            "第三件，合并段：把多个目标文件的代码段和数据段拼到一起。",
            "静态链接在编译时把库代码拷进来，程序独立，但体积大。",
            "动态链接只留下引用，运行时再加载共享库，省空间，但依赖运行环境。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "流程讲完，接下来看代码。",
            "高级语言有无数种写法，落到汇编只剩三类语句。",
            "选择、循环、函数调用。",
            "而它们的骨架，只有三条指令：比较、条件跳转、无条件跳转。",
            "cmp 只做减法，不保存结果，只改标志位。",
            "条件跳转看标志位决定走不走，jmp 无条件跳。",
            "换句话说，汇编里没有 if，也没有 for，只有跳转。",
            "下面三节，就把这三类语句一条一条翻译给你看。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "第一个，if-else。C 语言里两行，汇编里八行。",
            "先比较 a 和 b：cmp 做减法，只留下标志位。",
            "然后条件跳转：如果 a 小于等于 b，就跳到 else 那一段。",
            "否则顺序执行，把 a 赋给 max。",
            "然后必须有一条 jmp，跳过 else，直接去合流点。",
            "少了这条 jmp，CPU 会顺着往下走，把两个分支都执行一遍。",
            "else 那一段有标签，赋值 b 之后，自然落到合流点。",
            "所以 if 的本质是四步：判断、跳转、执行、合流。",
            "顺带一句：编译器常把 jle 换成 jg，两个分支对调，少跳一次。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "第二个，循环。三种写法，两个方向。",
            "while 是先判断后执行，条件不成立，循环体一次都不进。",
            "它的汇编是：标签、比较、跳出口、循环体、再 jmp 回标签。",
            "do-while 反过来，先执行一次，再判断。",
            "所以 do-while 的循环体至少执行一次，这是它和 while 唯一的区别。",
            "for 只是把 while 的三段拆开写：初始化、判断、更新。",
            "初始化和判断分了家，更新挪到了循环体后面。",
            "三者没有本质差别，都是条件跳转加一条回跳。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "第三个，函数调用。这是汇编里唯一需要栈的地方。",
            "调用一个函数，要解决四件事：传参、存局部变量、返回结果、回到原处。",
            "所以每次调用，都要在栈上划出一块地，叫栈帧。",
            "栈从高地址往低地址长，所以栈帧是往上顶出来的。",
            "从下往上看：先压参数，最后一个参数先压，第一个参数后压。",
            "然后是返回地址，call 指令自动压入，指向调用点的下一条指令。",
            "再往上是旧的 ebp，被调用函数保存的调用者栈底，栈帧的锚点。",
            "最后是局部变量，用 ebp 减偏移来访问。",
            "所以 ebp 是基准：参数在它上面，局部变量在它下面。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "看一个真的函数。int add(int x, int y)，返回 x 加 y。",
            "进来先 push ebp，把调用者的栈底保住。",
            "再 mov ebp, esp，把当前栈顶，变成新的栈底。",
            "这两条是所有函数的开场白，一个字节都不能少。",
            "取参数用 ebp 加偏移：加 8 是 x，加 12 是 y。",
            "为什么是 8 和 12？因为 ebp 上存着旧 ebp，再往上是返回地址。",
            "结果放进 eax，这是调用约定规定的返回寄存器。",
            "收尾 mov esp, ebp 加 pop ebp，把栈恢复原样，ret 返回。",
        ],
    },
    {
        "id": "s10",
        "cues": [
            "再看调用者。func 要算 sum 等于 add(3,5)，再乘 2。",
            "先 sub esp, 8，给两个局部变量留出八个字节。",
            "然后 push 5，再 push 3，最后一个参数先入栈。",
            "call 把返回地址压进栈，然后跳到 add。",
            "add 返回后，结果已经在 eax 里。",
            "add esp, 8 把两个参数弹掉，栈顶回到调用前。",
            "把 eax 存到 ebp 减 4，也就是 sum。",
            "乘 2 用 shl eax, 1，左移一位，比乘法指令快。",
            "最后 mov esp, ebp，一次性扔掉整块栈帧。",
        ],
    },
    {
        "id": "s11",
        "cues": [
            "最后，把这一期压成一张表。",
            "编译四步：预处理、编译、汇编、链接。",
            "编译的产物是汇编代码，汇编的产物是目标文件。",
            "链接三件事：符号解析、重定位、合并段。",
            "控制结构：cmp 改标志位，条件跳转看标志位，jmp 无条件。",
            "栈帧从高到低：参数、返回地址、旧 ebp、局部变量。",
            "返回地址由 call 压入，返回值放在 eax。",
            "写代码的人在管理复杂度，编译器把复杂度拆成机器听得懂的四个动作。",
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
        cache_path = os.path.join(CACHE_DIR, f"{sid}_{i:02d}.pcm")
        if force and os.path.exists(cache_path):
            os.remove(cache_path)
        async with sem:
            for _ in range(3):
                try:
                    return await loop.run_in_executor(None, synth, text, cache_path)
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
        dur = max(1.2, len(text) / 6.2)  # 晓晓同速约 6 字/秒
        cues.append({"text": text, "start": round(t, 3), "end": round(t + dur, 3)})
        t += dur + CUE_GAP
    return {"duration": round(t, 3), "cues": cues}


async def main():
    args = sys.argv[1:]
    force = "--force" in args
    dry = "--dry" in args
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
        "// AUTO-GENERATED by scripts/high-low-language/generate_tts.py — 不要手改。",
        "// 重新生成：python scripts/high-low-language/generate_tts.py",
        "//",
        ("// ⚠️ 这是 --dry 占位版：时长按字数估算，尚未合成音频。" if dry else
         "// 音频管线：DeepSeek /v1/tools/tts（voice stella，pcm 24kHz）一句一请求，"),
        ("// 拿到 key 后重跑本脚本即可覆盖。" if dry else
         "// 时长即字幕时间轴，所以这里的 cue 边界是精确值，不是按字数估的。"),
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
