/**
 * 像素片头 · 可切换的"内容层"
 *
 * 设计约束（来自用户 m00404 的明确要求）：**片头不写任何具体内容**。
 * 不写集数、不写标题、不写 UID、不写频道 slogan —— 选题会变，片头不该跟着过期。
 *
 * 所以这里放的全是**游戏机的通用界面词汇**：载入、按键开始、分数、命数、版权行。
 * 它们是"这台机器在动"的证据，不是"这一期讲什么"的声明。
 * 唯一保留的频道属性是 `MRDave` / 「先生」/「知识科普向」—— 这三样不会随选题变。
 *
 * 想换内容层就换 `pack`：Studio 里点开 `PixelIntro` 直接在 props 面板里选，
 * 不用改代码。（three packs are rendered by `src/PixelIntro/index.tsx`）
 */

export interface Pack {
  /** 面板左上角的机型标 —— 和 `MRDave` 同源，等于"这是我的机器" */
  model: string;
  /** 载入条上方那行 */
  load: string;
  /** 载入完成后闪的字 */
  press: string;
  /** 顶部 HUD：分数 / 金币 / 命数。null = 整条不画 */
  hud: { score: string; coins: number; lives: number } | null;
  /** 结尾的成就条。null = 不弹 */
  badge: string | null;
  /** 最底下的小字，一行一条 */
  footer: string[];
}

export const PACKS = {
  /** 街机开机：HUD 全开，信息密度最高，最"游戏" */
  arcade: {
    model: "MRDAVE-SYS",
    load: "LOADING",
    press: "PRESS START",
    hud: { score: "000000", coins: 7, lives: 3 },
    badge: "知识科普向",
    footer: ["\u00a9 2026 MRDAVE"],
  },
  /** 卡带标题画面：没有 HUD，但保留版权行 —— 安静，仍然像一台机器 */
  console: {
    model: "MRDAVE-SYS",
    load: "LOADING",
    press: "PUSH START",
    hud: null,
    badge: "知识科普向",
    footer: ["\u00a9 2026 MRDAVE", "LICENSED BY BILIBILI"],
  },
  /** 只剩一件事：开机 → 地球 → 字标。给"不想被打扰"的片子用 */
  clean: {
    model: "MRDAVE-SYS",
    load: "LOADING",
    press: "PRESS START",
    hud: null,
    badge: null,
    footer: ["\u00a9 2026 MRDAVE"],
  },
} satisfies Record<string, Pack>;

export type PackKey = keyof typeof PACKS;

export const PACK_KEYS = Object.keys(PACKS) as PackKey[];
