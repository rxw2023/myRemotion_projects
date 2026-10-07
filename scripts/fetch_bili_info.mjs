// 抓取 B 站 UID 的公开资料（昵称 / 头像 / 简介），用于提取频道主色。
// 直接调用 api.bilibili.com 会被风控（-352 / -799），带浏览器 UA + Referer 可绕过大部分。
// 用法: node scripts/fetch_bili_info.mjs 475296302
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const mid = process.argv[2] ?? "475296302";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const headers = {
  "User-Agent": UA,
  Referer: `https://space.bilibili.com/${mid}`,
  Origin: "https://space.bilibili.com",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "zh-CN,zh;q=0.9",
};

const endpoints = [
  `https://api.bilibili.com/x/web-interface/card?mid=${mid}&photo=true`,
  `https://api.bilibili.com/x/space/acc/info?mid=${mid}&jsonp=jsonp`,
  `https://api.bilibili.com/x/space/arc/search?mid=${mid}&ps=10&pn=1&order=pubdate`,
];

const outDir = path.join(process.cwd(), "public", "channel");
await mkdir(outDir, { recursive: true });

for (const url of endpoints) {
  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    console.log(`\n=== ${url}\nHTTP ${res.status}`);
    console.log(text.slice(0, 3000));

    // 顺手把头像下载下来
    const json = JSON.parse(text);
    const face = json?.data?.card?.face ?? json?.data?.face;
    if (face) {
      const imgRes = await fetch(face, { headers: { "User-Agent": UA } });
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ext = face.split(".").pop().split("@")[0] || "jpg";
      const file = path.join(outDir, `avatar.${ext}`);
      await writeFile(file, buf);
      console.log(`\nAVATAR_SAVED ${file} (${buf.length} bytes) from ${face}`);
    }
  } catch (err) {
    console.log(`\n=== ${url}\nERROR ${err.message}`);
  }
}
