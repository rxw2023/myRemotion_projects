// 抽关键帧自检：只 bundle 一次，然后逐帧出 png。
// 用法：node scripts/data-alignment/stills.mjs
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

/** [文件名, 帧号] —— 帧号按 timings.ts 的场景起点 + 偏移手算，改旁白后要跟着改 */
const FRAMES = [
  ["s00", 480],
  ["s01", 1141],
  ["s02", 2078],
  ["s03", 3152],
  ["s04", 4082],
  ["s05", 4826],
  ["s06", 5538],
  ["s07", 6334],
  ["s08", 7317],
  ["s09", 8045],
  ["s10", 8985],
  ["s11", 9615],
];

const outDir = path.resolve("out/stills");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "DataAlignment" });

for (const [name, frame] of FRAMES) {
  const output = path.join(outDir, `${name}.png`);
  await renderStill({ composition, serveUrl, output, frame, imageFormat: "png", browserExecutable: CHROME });
  console.log(`${name} @ ${frame} -> ${output}`);
}
