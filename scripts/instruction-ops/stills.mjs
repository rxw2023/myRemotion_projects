// 抽关键帧自检：只 bundle 一次，然后逐帧出 png。
// 用法：node scripts/instruction-ops/stills.mjs
//
// 帧号不手写：从 src/InstructionOps/timings.ts 里读场景帧数和每场最后一句字幕的起点，
// 取「场景起点 + 最后一句字幕起点 + 24 帧」——
// 这一期多处收口元素（状态板、收口表、图例）都挂在最后一句 cue 上，
// 按百分比采样会拍到还没出场的样子。改完旁白重跑本脚本即可。
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const TRANSITION = 8;
const LEAD = 24; // 最后一句字幕起点之后再等几帧，让收口元素入场

const ts = fs.readFileSync(path.resolve("src/InstructionOps/timings.ts"), "utf8");

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
const FRAMES = order.map((id, i) => {
  const f = Math.min(start + lastCue[id] + LEAD, start + sceneFrames[id] - 6);
  if (i < order.length - 1) start += sceneFrames[id] - TRANSITION;
  return [id, f];
});

const outDir = path.resolve("out/stills-iops");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "InstructionOps" });

for (const [name, frame] of FRAMES) {
  const output = path.join(outDir, `${name}.png`);
  await renderStill({ composition, serveUrl, output, frame, imageFormat: "png", browserExecutable: CHROME });
  console.log(`${name} @ ${frame} -> ${output}`);
}
