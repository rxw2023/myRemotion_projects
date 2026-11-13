// 抽关键帧自检：只 bundle 一次，然后逐帧出 png。
// 用法：node scripts/udp-basics/stills.mjs
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

/** [文件名, 帧号] —— 帧号 = 场景终点前 25 帧（所有元素都已入场），改旁白后要跟着改 */
const FRAMES = [
  ["s00", 988],
  ["s01", 2086],
  ["s02", 3017],
  ["s03", 4339],
  ["s04", 5416],
  ["s05", 6702],
  ["s06", 7813],
  ["s07", 8787],
  ["s08", 10035],
  ["s09", 11041],
  ["s10", 11675],
];

const outDir = path.resolve("out/stills-udp");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "UdpBasics" });

for (const [name, frame] of FRAMES) {
  const output = path.join(outDir, `${name}.png`);
  await renderStill({ composition, serveUrl, output, frame, imageFormat: "png", browserExecutable: CHROME });
  console.log(`${name} @ ${frame} -> ${output}`);
}
