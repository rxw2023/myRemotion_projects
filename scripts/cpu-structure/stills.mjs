// 抽关键帧自检：只 bundle 一次，然后逐帧出 png。
// 用法：node scripts/cpu-structure/stills.mjs
//
// 每场抽两张：
//   A = 场景 60% 处（看中场元素是否都就位）
//   B = 场景起点 + 最后一句字幕起点 + 24 帧（看收口元素）
// 帧号从 src/CpuStructure/timings.ts 解析，不手写 —— 改旁白重跑 TTS 后仍可用。
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const TRANSITION = 8;
const LEAD = 24;

const ts = fs.readFileSync(path.resolve("src/CpuStructure/timings.ts"), "utf8");

const sceneFrames = {};
for (const m of ts.matchAll(/^ {2}(s\d{2}): (\d+),$/gm)) sceneFrames[m[1]] = Number(m[2]);
if (!Object.keys(sceneFrames).length) throw new Error("解析 SCENE_FRAMES 失败");

const lastCue = {};
for (const m of ts.matchAll(/^ {2}(s\d{2}): \[([\s\S]*?)^ {2}\],$/gm)) {
  const starts = [...m[2].matchAll(/start: (\d+)/g)].map((x) => Number(x[1]));
  lastCue[m[1]] = starts.length ? starts[starts.length - 1] : 0;
}

const order = [...ts.matchAll(/"(s\d{2})"/g)].map((x) => x[1]);

let start = 0;
const FRAMES = [];
order.forEach((id, i) => {
  const total = sceneFrames[id];
  const a = Math.min(start + Math.round(total * 0.6), start + total - 6);
  const b = Math.min(start + lastCue[id] + LEAD, start + total - 6);
  FRAMES.push([`${id}-mid`, a]);
  FRAMES.push([`${id}-end`, b]);
  if (i < order.length - 1) start += total - TRANSITION;
});

const outDir = path.resolve("out/stills-cpust");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "CpuStructure" });

for (const [name, frame] of FRAMES) {
  const output = path.join(outDir, `${name}.png`);
  await renderStill({ composition, serveUrl, output, frame, imageFormat: "png", browserExecutable: CHROME });
  console.log(`${name} @ ${frame} -> ${output}`);
}
