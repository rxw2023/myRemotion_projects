// 抽关键帧自检：只 bundle 一次，然后逐帧出 png。
// 用法：node scripts/cisc-risc/stills.mjs
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

/** [文件名, 帧号] —— 帧号 = 场景起点 + 82% 场景长度，改旁白后要跟着改 */
const FRAMES = [
  ["s00", 810],
  ["s01", 2159],
  ["s02", 3397],
  ["s03", 4215],
  ["s04", 5243],
  ["s05", 6174],
  ["s06", 7075],
  ["s07", 8083],
  ["s08", 8990],
  ["s09", 9981],
  ["s10", 10931],
];

const outDir = path.resolve("out/stills-cisc");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "CiscRisc" });

for (const [name, frame] of FRAMES) {
  const output = path.join(outDir, `${name}.png`);
  await renderStill({ composition, serveUrl, output, frame, imageFormat: "png", browserExecutable: CHROME });
  console.log(`${name} @ ${frame} -> ${output}`);
}
