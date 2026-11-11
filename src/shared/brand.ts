/**
 * 频道品牌常量 —— 全部为实测值，不凭印象挑。
 *
 * 来源：B 站 card API 的 `name` / `sign` 字段，色板取自 public/shared/avatar.jpg
 * （头像纸底 300×300 中 3962px、描边是 #242D34 冷墨而非纯黑）。
 *
 * 历史：这批常量原先住在 `src/ChannelIntro/tokens.ts`。频道片头（ChannelIntro /
 * PixelIntro）整套删除后，封面等静态帧仍要用品牌信息，故搬到 shared 独立存放，
 * 避免任何一个视频目录被删就把封面一起带崩。
 */

export const CHANNEL = {
  /** @ 昵称（实测 name 字段） */
  handle: "MRDave先生",
  /** 个性签名（实测 sign 字段） */
  sign: "知识科普向",

  /** ---- 实测色板 ---- */
  colors: {
    /** 头像纸底。与 FrontendIsms 新粗野主义 bg #f5f3ee 同族。 */
    paper: "#F2F3EE",
    /** 眼球白 */
    paperHi: "#FEFEFE",
    /** 描边色。实测是冷墨，不是纯黑 —— 纯黑会显得廉价。 */
    ink: "#242D34",
    /** 印章朱红。全片唯一没有实测来源的颜色：中式印章的朱砂是语义色，必须像印泥。 */
    seal: "#E5341C",
  },
} as const;
