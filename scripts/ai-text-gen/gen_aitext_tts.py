#!/usr/bin/env python3
"""
生成AI教学视频的TTS配音
"""
import subprocess
import json
import os

VOICE = "zh-CN-YunxiNeural"
OUT_DIR = "C:/Users/Rao/Desktop/学习/project-vibe/my-video/public/voice/aitext"
os.makedirs(OUT_DIR, exist_ok=True)

scenes = [
    {
        "id": "s01_title",
        "text": "项目一，探寻人工智能。生成文本，用AI制作良渚文化宣传单。"
    },
    {
        "id": "s02_genai_intro",
        "text": "什么是生成式人工智能？生成式人工智能，是人工智能的一个分支，它能够基于所学到的知识和模式，生成全新的内容。按生成内容类型，可以分为文本生成式、图像生成式、音频生成式和视频生成式。"
    },
    {
        "id": "s03_genai_text",
        "text": "文本生成式人工智能，是目前应用最为广泛的一类。它可以生成新闻文章、故事、诗歌、对话等多种文本形式。常见的工具包括通义千问、文心一言、讯飞星火、豆包等。而KIMI，是我们本次任务要使用的AI助手。"
    },
    {
        "id": "s04_task_intro",
        "text": "本次任务，我们将使用KIMI工具，对介绍良渚文化的文字资料和图片资源进行深入分析，提炼核心主题，生成宣传单的文案内容，并将AI凝练的文字和遴选的图片，插入到良渚文化宣传单设计稿中。"
    },
    {
        "id": "s05_kimi_open",
        "text": "第一步，用浏览器打开KIMI智能助手，完成免费注册。KIMI是由月之暗面公司开发的AI平台。在KIMI操作界面中，可以通过按钮上传一个或多个文件，提供提示词后，KIMI会根据需求解析文件内容，提供相关服务。"
    },
    {
        "id": "s06_upload_outline",
        "text": "第二步，通过上传按钮，将文章.docx文件上传至KIMI平台。同时，在对话框内输入提示词：请根据时间顺序，为我详细梳理并整理出本文档的主要内容，并列出其大纲。KIMI会自动分析文档内容，并按照时间顺序整理出大纲。"
    },
    {
        "id": "s07_outline_result",
        "text": "KIMI分析后，将良渚文化分为早期和晚期两个阶段，梳理出了完整的文物大纲。早期包括北村遗址的玉蝉、瑶山遗址的玉钺、官井头遗址的刻纹陶器。晚期包括反山遗址的玉琮王、瑶山遗址的玉璜、寺墩遗址的石犁、福泉山遗址的椭圆形盘刻符陶豆。"
    },
    {
        "id": "s08_generate_text",
        "text": "第三步，在对话框中输入命令，要求KIMI撰写标题、宣传语和结束语。具体提示词为：请为本文拟一个恰当的标题，并撰写一段简介、宣传语和结束语。标题需为四字，宣传语总计十言，分为两句，每句各五字。"
    },
    {
        "id": "s09_refine_text",
        "text": "第四步，在输入框中进一步提出修改的具体要求。比如重拟标题、增加段落、重新概括、扩句或精简字数等。对文档进行二次梳理和整合，并保存至排版资料.docx文档中。至此，文本内容的凝练工作已全部完成。"
    },
    {
        "id": "s10_upload_images",
        "text": "第五步，通过按钮将图片资料文件上传至KIMI平台。在对话框内输入提示词，要求KIMI解析图片内容，匹配文字内容，并指出应插入的具体位置及操作步骤。"
    },
    {
        "id": "s11_compare_images",
        "text": "第六步，将素材中可替换的图片上传至平台，要求KIMI对图片内容进行对比分析，挑选出与文字资料更为匹配的一张图片，并详细阐述选择理由。第七步，使用KIMI的视觉思考功能，上传两张玉琮图片进行对比，让AI判断哪张与对应文字更加匹配。"
    },
    {
        "id": "s12_layout",
        "text": "第八步，将图片按照KIMI生成的指定位置，插入至排版资料.docx文档中。第九步，用文字编辑软件打开素材中的底版.docx文件，将排版资料.docx文档中的相关内容复制到设计稿中，按照要求进行图文排版。"
    },
    {
        "id": "s13_layout_rules",
        "text": "排版规则包括：大标题为竖向文字，字体为禹卫书法行书简体，颜色深红色，字号190。宣传语为竖向文字，等线字体，二号加粗。七处小标题为等线小二号加粗，颜色金棕色。七处正文为等线五号字，首行缩进两字符。七处圆形位置放置对应图片。"
    },
    {
        "id": "s14_wpsai",
        "text": "巩固与拓展部分。当需要将良渚文化宣传单的内容翻译成特定风格化语言时，WPS AI可以起到很好的辅助作用。打开WPS Word，在菜单栏中选择WPS AI命令，可以按需选择风格或某种语言，将文本进行二次处理，替换排版资料文档中的文字，并复制到设计稿中。"
    },
    {
        "id": "s15_summary",
        "text": "总结。通过本次任务，我们学习了如何使用生成式AI工具，完成从素材分析、文本生成、内容润色、图文匹配到最终排版的完整工作流程。掌握了KIMI和WPS AI的基本操作方法，体验了人工智能在内容创作中的实际应用。"
    },
]

results = {}
total_duration = 0

for scene in scenes:
    sid = scene["id"]
    text = scene["text"]
    out_path = os.path.join(OUT_DIR, f"{sid}.mp3")

    cmd = [
        "edge-tts",
        "--voice", VOICE,
        "--text", text,
        "--write-media", out_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        print(f"FAIL {sid}: {result.stderr}")
        continue

    # Extract duration from stderr
    for line in result.stderr.strip().split("\n"):
        if "Audio duration" in line:
            print(f"{sid}: {line.strip()}")

    results[sid] = out_path
    print(f"OK: {sid}")

# Save durations info
print(f"\nTotal scenes: {len(results)}")
print("All TTS generated!")
