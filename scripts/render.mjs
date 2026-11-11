#!/usr/bin/env node
/**
 * 渲染 + 自动清理临时目录。
 *
 * 为什么需要它：
 *   1. ffmpeg 是沙箱内的子进程，写不进系统 %TEMP%，必须把 TEMP/TMP 指到工作区 .tmp；
 *   2. Remotion 只清理它自己建的 react-motion-render 目录，webpack bundle、puppeteer
 *      用户数据都会留在 .tmp 里（一次渲染能留 500MB+）；
 *   3. 但 bundle 是可复用缓存，无脑 rm -rf 会让下次渲染重新打包。
 *
 * 用法：
 *   node scripts/render.mjs <CompositionId> [输出名] [--clean]
 *   pnpm run render TCPBasics
 *   pnpm run render TCPBasics tcp-basics        # 指定输出名
 *   pnpm run render TCPBasics -- --clean        # 连打包缓存一起清掉
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP = path.join(ROOT, ".tmp");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// 图页每帧要解码几十张 1600px 的图，并发太高会吃光内存，默认 6，可用环境变量覆盖
const CONCURRENCY = process.env.RENDER_CONCURRENCY ?? "6";

/** 可复用缓存：默认保留（删了下次要重新 bundle / 重新拷贝静态资源） */
const KEEP = [/^remotion-webpack-bundle-/, /^remotion-v[\d.]+-assets/, /^node-compile-cache$/];

const rawArgs = process.argv.slice(2);
const cleanAll = rawArgs.includes("--clean");
const positional = rawArgs.filter((a) => !a.startsWith("--"));
const id = positional[0];

if (!id) {
  console.error("用法: node scripts/render.mjs <CompositionId> [输出名] [--clean]");
  process.exit(1);
}

const toKebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

const outName = positional[1] ?? toKebab(id);
const outPath = path.join("out", `${outName}.mp4`);

// ---- 统计目录体积 ----
const dirSize = (p) => {
  let total = 0;
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) total += statSync(full).size;
    }
  };
  walk(p);
  return total;
};

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(0)}MB`;

// ---- 清理 ----
const cleanup = () => {
  if (!existsSync(TMP)) return;
  let freed = 0;
  let kept = 0;
  for (const entry of readdirSync(TMP, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(TMP, entry.name);
    const keep = !cleanAll && KEEP.some((re) => re.test(entry.name));
    if (keep) {
      kept += dirSize(full);
      continue;
    }
    try {
      freed += dirSize(full);
      rmSync(full, { recursive: true, force: true });
    } catch (e) {
      console.warn(`  ! 清理失败（可能仍被占用）: ${entry.name} — ${e.message}`);
    }
  }
  if (freed > 0) console.log(`\n🧹 已清理临时文件 ${mb(freed)}`);
  if (kept > 0) console.log(`   保留打包缓存 ${mb(kept)}（--clean 可一并清掉）`);
};

// ---- 渲染 ----
mkdirSync(TMP, { recursive: true });
const env = { ...process.env, TEMP: TMP, TMP };

console.log(`▶ ${id} → ${outPath}`);
console.log(`  临时目录 ${TMP}   并发 ${CONCURRENCY}${cleanAll ? "   结束时全清" : ""}\n`);

const cmd =
  `npx remotion render "${id}" "${outPath}" ` +
  `--browser-executable="${CHROME}" --concurrency=${CONCURRENCY}` +
  // 透传额外的 Remotion 参数，例如 RENDER_EXTRA="--crf=20"
  (process.env.RENDER_EXTRA ? ` ${process.env.RENDER_EXTRA}` : "");

let child = null;
let interrupted = false;

// Ctrl+C 时 Remotion 的 render 子目录会留下 pre-encode 分片，这里兜底清掉
const shutdown = (signal) => {
  if (interrupted) return;
  interrupted = true;
  console.log(`\n⚠ 收到 ${signal}，停止渲染并清理临时文件…`);
  if (child?.pid) {
    if (process.platform === "win32") {
      spawn(`taskkill /pid ${child.pid} /T /F`, { shell: true, stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }
  setTimeout(() => {
    cleanup();
    process.exit(130);
  }, 400);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

const code = await new Promise((resolve) => {
  child = spawn(cmd, { cwd: ROOT, env, stdio: "inherit", shell: true });
  child.on("exit", (c) => resolve(c ?? 1));
});

if (interrupted) process.exit(130);

// 成败都清理：中断留下的 pre-encode 分片最占地方
cleanup();

const finalPath = path.join(ROOT, outPath);
if (code !== 0) {
  console.error(`\n✗ 渲染失败（exit ${code}）`);
  process.exit(code);
}
const size = existsSync(finalPath) ? `  ${mb(statSync(finalPath).size)}` : "";
console.log(`\n✓ 完成: ${outPath}${size}`);
