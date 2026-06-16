// ==================== 配色（暗色赛博朋克风 · Lucy 主题） ====================
export const C = {
  bg: "#0d0d1a",
  bgCard: "#161630",
  bgCard2: "#1e1e3a",
  accent: "#ff5e7a",     // Lucy 亮粉色
  accent2: "#d060f0",    // 紫
  accent3: "#40f0d0",    // 青
  accent4: "#5080f0",    // 蓝
  text: "#f0f0fa",
  textDim: "#707090",
  textMid: "#a0a0c0",
  border: "#252545",
  shadow: "0 2px 12px rgba(0,0,0,0.3)",
  shadowLg: "0 4px 24px rgba(0,0,0,0.5)",
  glow: "0 0 24px rgba(255,94,122,0.25)",
};

// ==================== 字幕文本 ====================
export const SUBTITLE_TEXTS: Record<string, string> = {
  title: "Claude Fable 5。Mythos 级模型首次公开。Anthropic 史上最强，就在今天。",
  intro: "Fable 5 与机密模型 Mythos 5 共享底层权重，但增加了安全分类器。百万上下文窗口，十二万八千最大输出，自适应思考始终开启。它是 Anthropic 交出的最强答卷。",
  benchmarks: "SWE-bench Pro 得分百分之八十，远超 Opus 4.8。Humanity's Last Exam 无工具百分之五十三。人工智能分析智商指数，全球第一。FrontierCode 钻石级任务，领先所有前沿模型。终端测试，百分之八十四点三。每一项都是榜首。",
  stripe: "Stripe 的真实案例。Fable 5 在一天之内，完成了五千万行 Ruby 代码的完整迁移。这原本是一个工程师团队两个多月的工作量。一天，一个模型。软件工程的未来已经到来。",
  pokemon: "沃顿教授 Ethan Mollick 的测试。Fable 5 不看攻略，不要辅助系统，仅靠游戏截图就打通了 Pokémon 火红版。之前的 Claude 需要复杂的外部工具链才能做到，而 Fable 5，只需要一张一张的截图。",
  research: "科研领域同样震撼。蛋白质药物设计加速十倍，九个蛋白靶点成功产出候选药物。Mythos 5 整合一百三十八个物种的单细胞数据，自主训练出的模型，以百分之一的参数量超过了《科学》期刊发表的成果。一句话生成完整游戏、Photoshop 克隆、甚至博尔赫斯的无限图书馆。",
  pricing: "强大是有代价的。API 定价为每百万输入 Token 十美元，输出五十美元，是 Opus 的两倍。二十美元的 Pro 套餐，有用户三十分钟就用完了全部配额。安全分类器也会误拦一些正常的学术问题。Andrej Karpathy 说，护栏调得有点太敏感了。",
  outro: "Fable 5 是一次真正的代际跨越。它不适合日常闲聊，但面对最复杂的工程、最深度的研究、最长的自主任务时，它就是最好的选择。感谢观看，我们下期再见。",
};

// ==================== 时长（TTS 生成后校准） ====================
// 由 TTS 实际音频文件时长决定（脚本自动估算）
export const DURATIONS: Record<string, number> = {
  title: 378,        // 12.6s
  intro: 686,        // 22.9s
  benchmarks: 1010,  // 33.7s
  stripe: 671,       // 22.4s
  pokemon: 836,      // 27.9s
  research: 1026,    // 34.2s
  pricing: 931,      // 31.0s
  outro: 592,        // 19.7s
};
