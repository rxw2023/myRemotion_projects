// B 站视频搜索（带登录 Cookie，避免 -352 风控），用于找同类知识区视频做选题参考。
// 用法: node scripts/bili_search.mjs "运算电路 全加器" "类型转换 补码"
import { readFile } from "node:fs/promises";

const COOKIE_PATH =
  "C:/Users/Rao/Desktop/学习/bilibili-video-downloadtool/bilibili_cookies.txt";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

async function loadCookie() {
  const raw = await readFile(COOKIE_PATH, "utf8");
  const pairs = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const f = line.split("\t");
    if (f.length >= 7) pairs.push(`${f[5]}=${f[6]}`);
  }
  return pairs.join("; ");
}

const cookie = await loadCookie();
const keywords = process.argv.slice(2);
if (!keywords.length) keywords.push("408 运算电路");

for (const kw of keywords) {
  const url =
    "https://api.bilibili.com/x/web-interface/search/type?search_type=video&page=1&page_size=12&keyword=" +
    encodeURIComponent(kw);
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Referer: `https://search.bilibili.com/all?keyword=${encodeURIComponent(kw)}`,
      Cookie: cookie,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
  });
  const json = await res.json();
  console.log(`\n===== ${kw}  (code=${json.code} ${json.message ?? ""}) =====`);
  const list = json?.data?.result ?? [];
  if (!list.length) {
    console.log(JSON.stringify(json).slice(0, 400));
    continue;
  }
  for (const v of list) {
    const title = String(v.title ?? "").replace(/<[^>]+>/g, "");
    const dur = v.duration ?? "";
    const play = v.play ?? 0;
    const danmaku = v.video_review ?? 0;
    console.log(
      `- ${title}\n  UP:${v.author} | 播放:${play} | 弹幕:${danmaku} | 时长:${dur} | ${v.bvid}`,
    );
  }
}
