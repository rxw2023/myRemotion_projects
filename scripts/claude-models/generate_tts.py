"""
Generate TTS voice files for ClaudeModels video using Edge-TTS.
Voice: zh-CN-XiaoyiNeural (calm, cool female voice — closest to Lucy from Cyberpunk: Edgerunners)
"""
import asyncio
import json
import os
import edge_tts  # pip install edge-tts

VOICE = "zh-CN-XiaoyiNeural"
OUTPUT_DIR = "public/claude-models"

SCENES = [
    ("s01_title", "Claude Fable 5。Mythos级模型首次公开。Anthropic史上最强，就在今天。"),
    ("s02_intro", "Fable 5 与机密模型 Mythos 5 共享底层权重，但增加了安全分类器。百万上下文窗口，十二万八千最大输出，自适应思考始终开启。它是Anthropic交出的最强答卷。"),
    ("s03_benchmarks", "SWE-bench Pro得分百分之八十，远超Opus 4.8。Humanity's Last Exam 无工具百分之五十三。人工智能分析智商指数，全球第一。FrontierCode钻石级任务，领先所有前沿模型。终端测试，百分之八十四点三。每一项都是榜首。"),
    ("s04_stripe", "Stripe的真实案例。Fable 5 在一天之内，完成了五千万行Ruby代码的完整迁移。这原本是一个工程师团队两个多月的工作量。一天，一个模型。软件工程的未来已经到来。"),
    ("s05_pokemon", "沃顿教授Ethan Mollick的测试。Fable 5 不看攻略，不要辅助系统，仅靠游戏截图就打通了Pokémon火红版。之前的Claude需要复杂的外部工具链才能做到，而Fable 5，只需要一张一张的截图。"),
    ("s06_research", "科研领域同样震撼。蛋白质药物设计加速十倍，九个蛋白靶点成功产出候选药物。Mythos 5 整合一百三十八个物种的单细胞数据，自主训练出的模型，以百分之一的参数量超过了《科学》期刊发表的成果。一句话生成完整游戏、Photoshop克隆、甚至博尔赫斯的无限图书馆。"),
    ("s07_pricing", "强大是有代价的。API定价为每百万输入Token十美元，输出五十美元，是Opus的两倍。二十美元的Pro套餐，有用户三十分钟就用完了全部配额。安全分类器也会误拦一些正常的学术问题。Andrej Karpathy说，护栏调得有点太敏感了。"),
    ("s08_outro", "Fable 5 是一次真正的代际跨越。它不适合日常闲聊，但面对最复杂的工程、最深度的研究、最长的自主任务时，它就是最好的选择。感谢观看，我们下期再见。"),
]


async def generate():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    durations = {}

    for file_key, text in SCENES:
        out_path = os.path.join(OUTPUT_DIR, f"{file_key}.mp3")
        print(f"Generating {file_key}... ({len(text)} chars)")

        communicate = edge_tts.Communicate(
            text=text,
            voice=VOICE,
            rate="-5%",      # slightly slower for calmer delivery
            pitch="-2Hz",    # slightly lower pitch for cooler tone
        )
        await communicate.save(out_path)

        # Estimate duration: ~4 chars/sec for Chinese TTS at this rate
        estimated_frames = max(int(len(text) / 3.8 * 30), 120)
        durations[file_key] = estimated_frames

    # Write durations.json for reference
    with open(os.path.join(OUTPUT_DIR, "durations.json"), "w", encoding="utf-8") as f:
        json.dump(durations, f, indent=2, ensure_ascii=False)

    print("\nDone! Estimated durations (frames @30fps):")
    for k, v in durations.items():
        print(f"  {k}: {v} frames ({v/30:.1f}s)")
    print(f"\nTotal: {sum(durations.values())} frames ({sum(durations.values())/30:.1f}s)")


if __name__ == "__main__":
    asyncio.run(generate())
