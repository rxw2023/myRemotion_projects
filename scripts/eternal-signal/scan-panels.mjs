/**
 * 扫描 public/eternal-signal/panels/，把可用的漫画图登记成一份清单。
 *
 * 为什么要这一步：Remotion 渲染时无法"探测文件是否存在"——canvas 里画图必须先知道
 * 有哪些图。所以渲染前扫一遍目录，生成一个静态的清单文件，缺图就自动退回手绘版。
 *
 * 用法：pnpm run panels
 */
import fs from "node:fs";
import path from "node:path";

const DIR = "public/eternal-signal/panels";
const OUT = "src/EternalSignal/manga/panels.generated.ts";
const EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const ACTS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const files = fs
  .readdirSync(DIR)
  .filter((f) => EXT.has(path.extname(f).toLowerCase()))
  // 认 A-01 / A_01 / A1 / a-1 这几种写法；其它文件忽略，避免混进别的素材
  .filter((f) => /^[A-J][-_]?\d{1,2}\.[a-z]+$/i.test(f))
  .sort();

const byAct = Object.fromEntries(ACTS.map((a) => [a, []]));
const unknown = [];

for (const f of files) {
  const act = f[0].toUpperCase();
  if (!byAct[act]) {
    unknown.push(f);
    continue;
  }
  // 统一成 A-01.png：Windows 上有时是 .PNG 或 .JPG
  const num = f.match(/\d{1,2}/)[0].padStart(2, "0");
  const ext = path.extname(f).toLowerCase().replace(".jpeg", ".jpg");
  byAct[act].push(`${act}-${num}${ext}`);
}

for (const a of ACTS) {
  byAct[a].sort((x, y) => parseInt(x.slice(2), 10) - parseInt(y.slice(2), 10));
}

const total = ACTS.reduce((n, a) => n + byAct[a].length, 0);

const body = `/**
 * 自动生成，不要手改。改图之后跑 pnpm run panels。
 *
 * 生成时间：${new Date().toISOString()}
 * 共 ${total} 张。
 */
export const PANELS: Record<string, string[]> = ${JSON.stringify(byAct, null, 2)};

/** 有图的幕；空数组表示该幕仍用手绘版 */
export const HAS_PANELS: Record<string, boolean> = ${JSON.stringify(
  Object.fromEntries(ACTS.map((a) => [a, byAct[a].length > 0])),
  null,
  2,
)};
`;

fs.writeFileSync(OUT, body, "utf8");

console.log(`扫描 ${DIR}`);
for (const a of ACTS) {
  const n = byAct[a].length;
  console.log(`  ${a} ${String(n).padStart(2)} 张${n ? "  " + byAct[a].join(" ") : "  (手绘)"}`);
}
if (unknown.length) console.log(`  忽略：${unknown.join(", ")}`);
console.log(`合计 ${total} 张 → ${OUT}`);
