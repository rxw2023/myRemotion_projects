// 校验渲染出的 MP4：画面是否正好 10.000s、分辨率、有没有音轨。
// 不依赖 ffprobe —— 直接读 ISO-BMFF 盒子，避免再引入一个二进制。
//
// 为什么必须分轨看：mvhd（容器总时长）取的是各轨最大值。AAC 每帧固定 1024 采样，
// ffmpeg 还要在头部塞 2048 采样的 encoder delay，10.000s 的画面配出来的音轨
// 会被凑整到 471 帧 = 482304 采样 = 10.048s，于是 mvhd 也是 10.048s。
// 这是 AAC 的framing 行为，不是渲染少/多了帧 —— 所以判据落在视频轨的 mdhd 上。
//
// 用法: node scripts/channel-intro/verify_mp4.mjs out/mrdave-intro-10s.mp4
import { readFileSync } from "node:fs";

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl"]);

const walk = (buf, start, end, path, hits) => {
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    let head = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(p + 8));
      head = 16;
    } else if (size === 0) {
      size = end - p;
    }
    if (size < head || p + size > end) break;
    hits.push({ type, path: [...path, type], at: p, size, head });
    if (CONTAINERS.has(type)) walk(buf, p + head, p + size, [...path, type], hits);
    p += size;
  }
};

const file = process.argv[2];
const buf = readFileSync(file);
const boxes = [];
walk(buf, 0, buf.length, [], boxes);

// version 0 与 version 1 的 tkhd / mdhd 里，timescale 与 duration 的偏移不同。
// tkhd v0: +12 timescale? 不 —— tkhd 没有 timescale，宽度在尾巴上。
// mdhd v0: +12 timescale, +16 duration;  v1: +20 timescale, +24 duration (64bit)
const mdhdOf = (b) => {
  const v = buf[b.at + b.head];
  return v === 1
    ? { timescale: buf.readUInt32BE(b.at + b.head + 20), duration: Number(buf.readBigUInt64BE(b.at + b.head + 24)) }
    : { timescale: buf.readUInt32BE(b.at + b.head + 12), duration: buf.readUInt32BE(b.at + b.head + 16) };
};

const traks = boxes
  .filter((b) => b.type === "trak")
  .map((trak) => {
    const inside = boxes.filter((b) => b.path[0] === "moov" && b.path[1] === "trak" && b.at > trak.at && b.at < trak.at + trak.size);
    const hdlr = inside.find((b) => b.type === "hdlr");
    const mdhd = inside.find((b) => b.type === "mdhd");
    const tkhd = inside.find((b) => b.type === "tkhd");
    const handler = hdlr ? buf.toString("latin1", hdlr.at + hdlr.head + 8, hdlr.at + hdlr.head + 12) : "?";
    const { timescale, duration } = mdhd ? mdhdOf(mdhd) : { timescale: 0, duration: 0 };
    const w = tkhd ? buf.readUInt32BE(tkhd.at + tkhd.size - 8) / 65536 : 0;
    const h = tkhd ? buf.readUInt32BE(tkhd.at + tkhd.size - 4) / 65536 : 0;
    return { handler, seconds: duration / timescale, w, h };
  });

const video = traks.find((t) => t.handler === "vide");
const audio = traks.find((t) => t.handler === "soun");

const frames = video ? video.seconds * 30 : 0;
const problems = [];
if (!video) problems.push("没有视频轨");
else {
  if (Math.abs(frames - 300) > 0.001) problems.push(`画面 ${frames.toFixed(2)} 帧 != 300`);
  if (Math.abs(video.w - 1080) > 0 && Math.abs(video.w - 1920) > 0) problems.push(`宽度 ${video.w} 既不是 1080 也不是 1920`);
}
if (!audio) problems.push("没有音频轨");
else if (Math.abs(audio.seconds - 10) > 0.12) problems.push(`音轨 ${audio.seconds.toFixed(3)}s 与画面差超过 0.12s`);

console.log(
  `${file}\n` +
    traks
      .map(
        (t) =>
          `  ${t.handler === "vide" ? "画面" : t.handler === "soun" ? "声音" : t.handler}  ` +
          `${t.seconds.toFixed(4)}s` +
          (t.handler === "vide" ? `  = ${frames.toFixed(2)} 帧 @30fps  ${t.w}x${t.h}` : "") +
          (t.handler === "soun" ? `  (比画面多 ${((t.seconds - (video?.seconds ?? 0)) * 1000).toFixed(0)}ms，AAC 凑整，正常)` : "")
      )
      .join("\n") +
    `\n  体积     = ${(buf.length / 1048576).toFixed(2)} MB` +
    `\n  结论     = ${problems.length ? "FAIL: " + problems.join("; ") : "PASS（画面正好 10.000s，含音轨）"}`
);
process.exit(problems.length ? 1 : 0);
