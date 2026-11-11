#!/usr/bin/env node
/**
 * 把分段渲染的 chunk 拼成成片。
 *
 * 为什么要分段：10 分钟、18554 帧、每帧几十个 DOM 层，单次渲染动辄 40 分钟以上，
 * 一旦中途挂掉（机器休眠、Chrome 崩）就得从头再来。按场景边界切 4 段，
 * 每段独立出片，断了只需要重渲那一段。
 *
 * 用法：
 *   node scripts/instruction-format/concat.mjs
 *   node scripts/instruction-format/concat.mjs --reencode   # -c copy 接不上时用
 */
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const CHUNKS = ["chunk1", "chunk2", "chunk3", "chunk4"].map((n) =>
  path.join(ROOT, "out", "chunks", `${n}.mp4`),
);
const OUT = path.join(ROOT, "out", "instruction-format.mp4");

const missing = CHUNKS.filter((p) => !existsSync(p));
if (missing.length) {
  console.error("缺分段：\n" + missing.map((p) => "  " + p).join("\n"));
  process.exit(1);
}

const list = path.join(ROOT, "out", "chunks", "chunks.txt");
writeFileSync(list, CHUNKS.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n", "utf8");

const reencode = process.argv.includes("--reencode");
const args = reencode
  ? ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c:v", "libx264", "-preset", "medium",
     "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", OUT]
  : ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", OUT];

const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (r.status !== 0) {
  console.error(reencode ? "拼接失败" : "无损拼接失败，试试 --reencode");
  process.exit(r.status ?? 1);
}
console.log(`\n→ ${OUT}`);
