/**
 * 十幕的格。
 *
 * 统一语言：
 *   - 人不画脸，只有背影、侧影、剪影。认人靠体态和位置，不靠五官。
 *   - 灰阶全用网点，不用半透明黑（那是 CG 味，不是漫画味）。
 *   - 光只用白。所以"太阳""爆炸""灯火"都是留白，不是发亮。
 */

import {
  blob,
  figure,
  halftone,
  INK,
  line,
  PAPER,
  rnd,
  speedLines,
  streamLines,
} from "./ink";
import { boom, H, inset, M, panel, r, rev, W } from "./page";

type Act = (ctx: CanvasRenderingContext2D, t: number, dur: number) => void;

const fillWhite = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
};

/** 一个"空"的格：白底 + 网点渐层，用来打底 */
function wash(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, d: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y, w, h);
  halftone(ctx, x, y, w, h, d, 8, Math.PI / 5);
}

// ==================== A 调谐 ====================

const A: Act = (ctx, t) => {
  // 1 接收机
  const p1 = r(M, M, 1180, 560);
  panel(ctx, p1, rev(t, 1.2), () => {
    wash(ctx, p1.x, p1.y, p1.w, p1.h, 0.06);
    // 机箱
    ctx.fillStyle = INK;
    ctx.fillRect(p1.x + 26, p1.y + 92, p1.w - 52, p1.h - 130);
    // 频率窗
    ctx.fillStyle = PAPER;
    ctx.fillRect(p1.x + 62, p1.y + 128, p1.w - 400, 84);
    for (let i = 0; i <= 30; i++) {
      const x = p1.x + 70 + (i / 30) * (p1.w - 416);
      const tall = i % 5 === 0;
      line(ctx, [[x, p1.y + 200], [x, p1.y + 200 - (tall ? 26 : 12)]], 2, 40 + i);
    }
    // 指针（缓慢往右)
    const nx = p1.x + 70 + (0.18 + 0.02 * Math.sin(t * 0.7)) * (p1.w - 416);
    line(ctx, [[nx, p1.y + 132], [nx, p1.y + 208]], 4.5, 77);

    // 大表盘
    const cx = p1.x + p1.w - 210;
    const cy = p1.y + 250;
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(cx, cy, 118, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      line(
        ctx,
        [
          [cx + Math.cos(a) * 96, cy + Math.sin(a) * 96],
          [cx + Math.cos(a) * 112, cy + Math.sin(a) * 112],
        ],
        2,
        60 + i,
      );
    }
    const na = -Math.PI / 2 + Math.sin(t * 0.5) * 0.9;
    line(ctx, [[cx, cy], [cx + Math.cos(na) * 92, cy + Math.sin(na) * 92]], 5, 91);

    // 旋钮
    for (let i = 0; i < 5; i++) {
      const kx = p1.x + 90 + i * 120;
      const ky = p1.y + p1.h - 92;
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(kx, ky, 30, 0, Math.PI * 2);
      ctx.fill();
      const ka = (i * 1.1 + t * 0.12) % (Math.PI * 2);
      line(ctx, [[kx, ky], [kx + Math.cos(ka) * 24, ky + Math.sin(ka) * 24]], 3.5, 100 + i);
    }
    // 格栅
    for (let i = 0; i < 22; i++) {
      line(
        ctx,
        [
          [p1.x + 80, p1.y + 330 + i * 12],
          [p1.x + 460, p1.y + 330 + i * 12],
        ],
        1.4,
        200 + i,
      );
    }
  });

  // 2 背影
  const p2 = r(M + 1196, M, 612, 560);
  panel(ctx, p2, rev(t, 1.6), () => {
    wash(ctx, p2.x, p2.y, p2.w, p2.h, 0.3);
    // 灯：一块白
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(p2.x + p2.w * 0.72, p2.y + 40, 120, 0, Math.PI * 2);
    ctx.fill();
    figure(ctx, p2.x + p2.w * 0.4, p2.y + p2.h + 30, 470, "sit");
  });

  // 3 噪声音迹
  const p3 = r(M, M + 576, 880, 318);
  panel(ctx, p3, rev(t, 2.6), () => {
    wash(ctx, p3.x, p3.y, p3.w, p3.h, 0.12);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 90; i++) {
      const u = i / 90;
      pts.push([
        p3.x + 40 + u * (p3.w - 80),
        p3.y + p3.h / 2 + (((i * 37) % 23) - 11) * (2.2 - t * 0.02),
      ]);
    }
    line(ctx, pts, 2.6, 321);
    boom(ctx, "兹——", p3.x + p3.w * 0.62, p3.y + p3.h * 0.55, 76, -0.1);
  });

  // 4 全景：房间、机器、一个人。补上右下角，别让半页空着
  const p4 = r(M + 916, M + 576, 892, 318);
  panel(ctx, p4, rev(t, 3.4), () => {
    wash(ctx, p4.x, p4.y, p4.w, p4.h, 0.62);
    line(ctx, [[p4.x, p4.y + p4.h * 0.8], [p4.x + p4.w, p4.y + p4.h * 0.8]], 4, 300);
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(p4.x + p4.w * 0.27, p4.y + p4.h * 0.44, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillRect(p4.x + 26, p4.y + p4.h * 0.44, 150, 110);
    figure(ctx, p4.x + p4.w * 0.55, p4.y + p4.h * 0.8, 210, "sit");
  });

  // A-02 大特写：手悬在调谐钮上，三厘米，没有落下。他不敢听。
  inset(ctx, r(M + 736, M + 292, 400, 254), rev(t, 7), () => {
    const bx = M + 736;
    const by = M + 292;
    wash(ctx, bx, by, 400, 254, 0.08);
    const kx = bx + 148;
    const ky = by + 172;
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(kx, ky, 58, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      line(
        ctx,
        [
          [kx + Math.cos(a) * 44, ky + Math.sin(a) * 44],
          [kx + Math.cos(a) * 57, ky + Math.sin(a) * 57],
        ],
        2,
        2200 + i,
      );
    }
    // 掌心悬在上方三厘米：掌 + 四指分开画，否则会糊成一团
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(kx + 8, ky - 58, 44, 30, 0.06, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const fx = kx - 26 + i * 24;
      const len = i === 0 || i === 3 ? 26 : 34;
      ctx.save();
      ctx.translate(fx, ky - 78);
      ctx.rotate((i - 1.5) * 0.13);
      ctx.beginPath();
      ctx.ellipse(0, -len * 0.45, 7.5, len * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 手腕向右上出画
    line(ctx, [[kx + 44, ky - 66], [bx + 396, ky - 116]], 22, 2210);
    line(ctx, [[kx + 74, ky - 52], [bx + 400, ky - 30]], 26, 2210);
  });
};

// ==================== B 台呼 ====================

const B: Act = (ctx, t) => {
  // 1 大背影
  const p1 = r(M, M, 700, 894);
  panel(ctx, p1, rev(t, 1), () => {
    wash(ctx, p1.x, p1.y, p1.w, p1.h, 0.55);
    ctx.fillStyle = PAPER;
    ctx.fillRect(p1.x, p1.y, p1.w, p1.h * 0.26);
    figure(ctx, p1.x + p1.w * 0.5, p1.y + p1.h + 60, 900, "sit");
  });

  // 2 手与旋钮
  const p2 = r(M + 716, M, 1082, 430);
  panel(ctx, p2, rev(t, 1.6), () => {
    wash(ctx, p2.x, p2.y, p2.w, p2.h, 0.2);
    const cx = p2.x + p2.w * 0.62;
    const cy = p2.y + p2.h * 0.56;
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(cx, cy, 92, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      line(
        ctx,
        [
          [cx + Math.cos(a) * 74, cy + Math.sin(a) * 74],
          [cx + Math.cos(a) * 88, cy + Math.sin(a) * 88],
        ],
        2,
        400 + i,
      );
    }
    // 前臂：从右下斜插进来的一条粗臂
    blob(
      ctx,
      [
        [cx + 300, cy + 250],
        [cx + 150, cy + 150],
        [cx + 96, cy + 96],
        [cx + 120, cy + 40],
        [cx + 230, cy + 90],
        [cx + 360, cy + 150],
      ],
      7,
      2,
    );
    // 手掌：压在旋钮右缘
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(cx + 74, cy + 34, 74, 62, -0.35, 0, Math.PI * 2);
    ctx.fill();
    // 四根手指扣过来，指缝留白
    for (let i = 0; i < 4; i++) {
      const fy = cy - 6 + i * 26;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(cx + 12 - i * 3, fy, 40, 11, -0.12 + i * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3 指示灯
  const p3 = r(M + 716, M + 446, 1082, 448);
  panel(ctx, p3, rev(t, 3.0), () => {
    ctx.fillStyle = INK;
    ctx.fillRect(p3.x, p3.y, p3.w, p3.h);
    const lx = p3.x + p3.w * 0.5;
    const lum = 0.5 + 0.5 * Math.sin(t * 1.7);
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(lx, p3.y + p3.h * 0.44, 26 + 10 * lum, 0, Math.PI * 2);
    ctx.fill();
    // 光晕用网点（白点画在黑底上）
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 90; i++) {
      const a = rnd(i, 1, 13) * Math.PI * 2;
      const d = 40 + rnd(i, 2, 13) * 150;
      ctx.fillStyle = `rgba(242,238,226,${0.10 + 0.1 * lum})`;
      ctx.beginPath();
      ctx.arc(lx + Math.cos(a) * d, p3.y + p3.h * 0.44 + Math.sin(a) * d, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
};

// ==================== C 出航 ====================

const C: Act = (ctx, t) => {
  // 1 帆
  const p1 = r(M, M, 1808, 520);
  panel(ctx, p1, rev(t, 1.4), () => {
    wash(ctx, p1.x, p1.y, p1.w, p1.h, 0.04);
    // 太阳：一块留白
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(p1.x + 300, p1.y + 210, 160, 0, Math.PI * 2);
    ctx.fill();
    // 放射线
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      line(
        ctx,
        [
          [p1.x + 300 + Math.cos(a) * 170, p1.y + 210 + Math.sin(a) * 170],
          [p1.x + 300 + Math.cos(a) * 240, p1.y + 210 + Math.sin(a) * 240],
        ],
        1.6,
        600 + i,
      );
    }
    // 帆船：梯形帆 + 细船身
    const sx = p1.x + p1.w * 0.52;
    const sy = p1.y + 190;
    const e = Math.min(1, t / 10);
    const hw = 60 + e * 210;
    blob(
      ctx,
      [
        [sx - hw, sy + 150],
        [sx - hw * 0.25, sy - 90 - e * 40],
        [sx + hw * 0.2, sy - 80 - e * 30],
        [sx + hw, sy + 150],
      ],
      11,
      2.4,
    );
    // 帆面留白（被太阳照的那一面）
    ctx.fillStyle = "rgba(242,238,226,0.9)";
    blob(
      ctx,
      [
        [sx - hw * 0.72, sy + 120],
        [sx - hw * 0.2, sy - 60],
        [sx + hw * 0.02, sy + 120],
      ],
      12,
      2,
    );
    // 桅杆
    line(ctx, [[sx, sy - 200], [sx, sy + 158]], 6, 702);
    // 索具：从桅顶拉到帆角
    line(ctx, [[sx, sy - 196], [sx - hw * 0.92, sy + 140]], 2.4, 703);
    line(ctx, [[sx, sy - 196], [sx + hw * 0.92, sy + 138]], 2.4, 704);
    // 船身：一条压扁的黑壳
    blob(
      ctx,
      [
        [sx - hw * 1.02, sy + 158],
        [sx + hw * 1.02, sy + 158],
        [sx + hw * 0.72, sy + 196],
        [sx - hw * 0.74, sy + 194],
      ],
      705,
      2,
    );
    line(ctx, [[sx - hw, sy + 158], [sx + hw, sy + 158]], 7, 700);
    // 流线
    streamLines(ctx, p1.x + 20, p1.y + 30, p1.w - 40, p1.h - 60, 40, 77);
    boom(ctx, "呼——", p1.x + p1.w * 0.82, p1.y + 90, 60, 0.12);
  });

  // 2 塔台与举手的人
  const p2 = r(M, M + 536, 700, 358);
  panel(ctx, p2, rev(t, 2.2), () => {
    wash(ctx, p2.x, p2.y, p2.w, p2.h, 0.35);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y + p2.h);
    ctx.lineTo(p2.x, p2.y + 190);
    ctx.lineTo(p2.x + 120, p2.y + 150);
    ctx.lineTo(p2.x + 250, p2.y + 150);
    ctx.lineTo(p2.x + 250, p2.y + p2.h);
    ctx.closePath();
    ctx.fill();
    figure(ctx, p2.x + 360, p2.y + p2.h - 30, 300, "raise", true);
  });

  // 3 远去
  const p3 = r(M + 716, M + 536, 1092, 358);
  panel(ctx, p3, rev(t, 3.2), () => {
    wash(ctx, p3.x, p3.y, p3.w, p3.h, 0.06);
    line(ctx, [[p3.x, p3.y + 300], [p3.x + p3.w, p3.y + 300]], 5, 800);
    // 越来越远的小点
    const u = Math.min(1, Math.max(0, (t - 44) / 14));
    const px = p3.x + 120 + u * 760;
    const py = p3.y + 300 - u * 90;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(2, 12 - u * 9), 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      line(
        ctx,
        [
          [px - 60 - i * 40, py + 26 + i * 6],
          [px - 20 - i * 40, py + 26 + i * 6],
        ],
        1.6,
        810 + i,
      );
    }
  });
};

// ==================== D 故乡毁灭 ====================

const D: Act = (ctx, t) => {
  // 1 太阳
  const p1 = r(M, M, 900, 894);
  panel(ctx, p1, rev(t, 1.4), () => {
    const cx = p1.x + p1.w / 2;
    const cy = p1.y + p1.h * 0.46;
    // 网格
    for (let i = 0; i <= 12; i++) {
      line(ctx, [[p1.x, p1.y + (i / 12) * p1.h], [p1.x + p1.w, p1.y + (i / 12) * p1.h]], 1, 900 + i);
      line(ctx, [[p1.x + (i / 12) * p1.w, p1.y], [p1.x + (i / 12) * p1.w, p1.y + p1.h]], 1, 920 + i);
    }
    // 太阳：白圆 + 越来越厚的网点边
    const dark = Math.min(1, t / 26);
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(cx, cy, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 192 + dark * 90, 0, Math.PI * 2);
    ctx.clip();
    halftone(ctx, cx - 300, cy - 300, 600, 600, 0.35 + dark * 0.45, 7, Math.PI / 6);
    ctx.restore();
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(cx, cy, 190 * (1 - dark * 0.55), 0, Math.PI * 2);
    ctx.fill();
    // 壳
    for (let k = 0; k < 3; k++) {
      const rr = 200 + dark * 200 + k * 26;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // 2 塔台里的人
  const p2 = r(M + 916, M, 892, 430);
  panel(ctx, p2, rev(t, 1.8), () => {
    wash(ctx, p2.x, p2.y, p2.w, p2.h, 0.22);
    figure(ctx, p2.x + p2.w * 0.34, p2.y + p2.h + 40, 520, "sit");
    figure(ctx, p2.x + p2.w * 0.62, p2.y + p2.h + 40, 300, "child");
  });

  // 3 全黑格
  const p3 = r(M + 916, M + 446, 892, 448);
  panel(ctx, p3, rev(t, 3.0), () => {
    ctx.fillStyle = INK;
    ctx.fillRect(p3.x, p3.y, p3.w, p3.h);
    // 一条断掉的水平线（载波）
    const cut = p3.x + p3.w * (0.28 + Math.min(0.5, t * 0.02));
    line(ctx, [[p3.x + 60, p3.y + p3.h / 2], [cut, p3.y + p3.h / 2]], 3, 950);
    ctx.strokeStyle = PAPER;
    for (let i = 0; i < 3; i++) {
      line(
        ctx,
        [
          [cut + 20 + i * 18, p3.y + p3.h / 2 - 12],
          [cut + 34 + i * 18, p3.y + p3.h / 2 + 12],
        ],
        2.4,
        960 + i,
      );
    }
    boom(ctx, "……", p3.x + p3.w * 0.66, p3.y + p3.h * 0.66, 70, 0, PAPER, "rgba(18,16,14,0)");
  });

  // D-04 全片第一个真正的大特写：孩子的手贴在玻璃上。不给脸。
  inset(ctx, r(M + 356, M + 604, 392, 258), rev(t, 33), () => {
    const bx = M + 356;
    const by = M + 604;
    wash(ctx, bx, by, 392, 258, 0.14);
    // 玻璃上的反光条纹
    for (let i = 0; i < 5; i++) {
      line(ctx, [[bx + 10, by + 30 + i * 46], [bx + 380, by + 8 + i * 46]], 1.6, 2300 + i);
    }
    const cx = bx + 196;
    const cy = by + 150;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 26, 70, 80, -0.05, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const ax = cx - 56 + i * 28;
      const len = i === 2 ? 74 : i === 0 || i === 4 ? 48 : 60;
      ctx.save();
      ctx.translate(ax, cy - 18);
      ctx.rotate((i - 2) * 0.2);
      ctx.beginPath();
      ctx.ellipse(0, -len * 0.55, 12, len * 0.66, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 水汽
    for (let i = 0; i < 46; i++) {
      ctx.fillStyle = "rgba(242,238,226,0.45)";
      ctx.beginPath();
      ctx.arc(cx + (rnd(i, 1, 31) - 0.5) * 190, cy + (rnd(i, 2, 31) - 0.5) * 200, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

// ==================== E 抉择 ====================
const E: Act = (ctx, t) => {
  // 1 舰桥：三个人盯着同一块屏幕
  const p1 = r(M, M, 1120, 520);
  panel(ctx, p1, rev(t, 1.4), () => {
    wash(ctx, p1.x, p1.y, p1.w, p1.h, 0.28);
    for (let i = 0; i < 26; i++) {
      line(ctx, [[p1.x, p1.y + i * 22], [p1.x + p1.w, p1.y + i * 22 - 40]], 1.2, 1000 + i);
    }
    figure(ctx, p1.x + p1.w * 0.28, p1.y + p1.h + 20, 420, "stand");
    figure(ctx, p1.x + p1.w * 0.52, p1.y + p1.h + 20, 430, "stand", true);
    figure(ctx, p1.x + p1.w * 0.74, p1.y + p1.h + 20, 400, "stand", true);
  });

  // 2 影子星：一颗看上去完美、其实不存在的恒星。
  // 没有画恒星本身，只画"被放大的像"——同心虚环 + 一条直插进去的航迹。
  const p2 = r(M + 1136, M, 672, 520);
  panel(ctx, p2, rev(t, 2.0), () => {
    wash(ctx, p2.x, p2.y, p2.w, p2.h, 0.12);
    const cx = p2.x + p2.w * 0.52;
    const cy = p2.y + p2.h * 0.42;

    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(cx, cy, 96, 0, Math.PI * 2);
    ctx.fill();

    // 光环画成"白底黑边"的双线：白在网点上够亮，黑边保证在浅处也看得见。
    // 环越多、越虚，越像一枚被放大的像，而不是一颗真的星。
    for (let k = 0; k < 4; k++) {
      const rr = 104 + k * 26;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = `rgba(18,16,14,${0.75 - k * 0.16})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // 航迹：从右下直插圆心
    const from: [number, number] = [p2.x + p2.w - 26, p2.y + p2.h - 26];
    ctx.save();
    ctx.setLineDash([9, 7]);
    line(ctx, [from, [cx + 18, cy + 20]], 2.6, 1103);
    ctx.restore();
    // 船的位置：越飞越深
    const u = Math.min(1, (t - 2) / 40);
    const px = from[0] + (cx + 18 - from[0]) * u;
    const py = from[1] + (cy + 20 - from[1]) * u;
    ctx.fillStyle = INK;
    ctx.fillRect(px - 4, py - 4, 8, 8);
    boom(ctx, "零", p2.x + p2.w * 0.2, p2.y + p2.h * 0.8, 54, -0.1);
  });

  // 3 横长格：两条路
  const p3 = r(M, M + 536, 1808, 358);
  panel(ctx, p3, rev(t, 3.0), () => {
    wash(ctx, p3.x, p3.y, p3.w, p3.h, 0.1);
    const ox = p3.x + 90;
    const oy = p3.y + p3.h * 0.56;
    const span = p3.w * 0.78;
    line(ctx, [[ox, oy], [ox + span * 0.3, oy]], 4, 1100);
    const grow = Math.min(1, t / 12);
    line(
      ctx,
      Array.from({ length: 16 }, (_, i) => {
        const u = (i / 15) * grow;
        return [ox + span * 0.3 + u * span * 0.7, oy - Math.pow(u, 1.3) * 110] as [number, number];
      }),
      4.5,
      1101,
    );
    ctx.save();
    ctx.setLineDash([9, 9]);
    line(
      ctx,
      Array.from({ length: 16 }, (_, i) => {
        const u = (i / 15) * grow;
        return [ox + span * 0.3 + u * span * 0.7, oy + Math.pow(u, 1.6) * 110] as [number, number];
      }),
      2.4,
      1102,
    );
    ctx.restore();
    boom(ctx, "1776", p3.x + p3.w * 0.14, p3.y + 70, 50, -0.06);
  });

  // E-05 越界特写：手按在点火键上，手腕被格边切掉——这件事关不住。
  inset(ctx, r(M + 1150, M + 486, 430, 306), rev(t, 63), () => {
    const bx = M + 1150;
    const by = M + 486;
    wash(ctx, bx, by, 430, 306, 0.42);
    const kx = bx + 150;
    const ky = by + 226;
    // 按钮座
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(kx, ky + 18, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(kx, ky, 54, 0, Math.PI * 2);
    ctx.fill();
    // 手：四指压在键面上
    ctx.fillStyle = INK;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(kx - 34 + i * 22, ky - 30);
      ctx.rotate((i - 1.5) * 0.12);
      ctx.beginPath();
      ctx.ellipse(0, -22, 10, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 手背，冲出格子右边
    ctx.beginPath();
    ctx.ellipse(kx + 62, ky - 34, 96, 62, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(kx + 120, ky - 90, 220, 120);
    // 指节的白
    for (let i = 0; i < 4; i++) {
      line(ctx, [[kx - 30 + i * 22, ky - 52], [kx - 26 + i * 22, ky - 44]], 3, 2400 + i);
    }
  });
};

// ==================== F 闪光 ====================

const F: Act = (ctx, t) => {
  // 点火前：一小格，中心一个白点
  const p1 = r(W * 0.22, H * 0.18, W * 0.56, H * 0.64);
  if (t < 26) {
    panel(ctx, p1, rev(t, 1), () => {
      ctx.fillStyle = INK;
      ctx.fillRect(p1.x, p1.y, p1.w, p1.h);
      const k = Math.min(1, t / 24);
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(p1.x + p1.w / 2, p1.y + p1.h / 2, 4 + k * 26, 0, Math.PI * 2);
      ctx.fill();
      if (k > 0.7) speedLines(ctx, p1.x + p1.w / 2, p1.y + p1.h / 2, 40, 30, 420, 1300, 1.8);
    });

    // F-02/03/04：一枚表盘，指针在六百 / 三百 / 一百处各停一次。
    // 声音在大声倒数，画面只有一根针在往左走。
    inset(ctx, r(p1.x + 52, p1.y + 408, 372, 232), rev(t, 11), () => {
      const bx = p1.x + 52;
      const by = p1.y + 408;
      wash(ctx, bx, by, 372, 250, 0.06);
      const cx = bx + 186;
      const cy = by + 138;
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(cx, cy, 98, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.stroke();
      // 刻度
      for (let i = 0; i <= 30; i++) {
        const a = -Math.PI * 0.75 + (i / 30) * Math.PI * 1.5;
        const r0 = i % 5 === 0 ? 74 : 82;
        line(
          ctx,
          [
            [cx + Math.cos(a) * r0, cy + Math.sin(a) * r0],
            [cx + Math.cos(a) * 92, cy + Math.sin(a) * 92],
          ],
          i % 5 === 0 ? 2.4 : 1.4,
          2600 + i,
        );
      }
      // 指针只在三个位置停：600 / 300 / 100。不连续走——停住才有分量。
      const val = t < 18.7 ? 600 : t < 25.4 ? 300 : 100;
      const ang = -Math.PI * 0.75 + (val / 600) * Math.PI * 1.5;
      line(ctx, [[cx, cy], [cx + Math.cos(ang) * 84, cy + Math.sin(ang) * 84]], 4.5, 2660);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    return;
  }

  // 点火：整页白，只有黑框和放射线。四秒，不能再长——纯白页超过四秒，观众会以为片子坏了
  if (t < 30) {
    fillWhite(ctx);
    const cx = W / 2;
    const cy = H * 0.46;
    const k = (t - 26) / 4;
    speedLines(ctx, cx, cy, 64, 120 + k * 220, 1500, 1400, 2.2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 16;
    ctx.strokeRect(M / 2, M / 2, W - M, H - M);
    return;
  }

  // 余烬：一整页黑，中间一个正在远去的路标。
  // 这是全片的落点，也是唯一一个占满整页的静格。
  const pg = r(M, M, 1808, 894);
  panel(ctx, pg, rev(t, 30), () => {
    ctx.fillStyle = INK;
    ctx.fillRect(pg.x, pg.y, pg.w, pg.h);

    const k = Math.min(1, (t - 30) / 15);
    const cx = pg.x + pg.w * 0.5;
    const cy = pg.y + pg.h * 0.46;
    const rad = Math.max(3, 26 - k * 20);

    // 路标本体
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    // 向外推的壳：三层，越远越淡
    for (let i = 0; i < 3; i++) {
      const rr = rad + 60 + k * 320 + i * 90;
      ctx.strokeStyle = `rgba(242,238,226,${Math.max(0, 0.5 - k * 0.42 - i * 0.1)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 碎屑：爆炸之后还在往外走的东西
    for (let i = 0; i < 70; i++) {
      const a = rnd(i, 3, 21) * Math.PI * 2;
      const d = 40 + k * (200 + rnd(i, 4, 21) * 420);
      const s = 1 + rnd(i, 5, 21) * 2.4;
      ctx.fillStyle = `rgba(242,238,226,${0.5 - k * 0.4})`;
      ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, s);
    }

  });
};

// ==================== G 播种 ====================
const G: Act = (ctx, t) => {
  // 1 舷窗：窗外就是那颗行星，和一片火
  const p1 = r(M, M, 820, 894);
  panel(ctx, p1, rev(t, 1.4), () => {
    wash(ctx, p1.x, p1.y, p1.w, p1.h, 0.55);
    const cx = p1.x + p1.w * 0.5;
    const cy = p1.y + p1.h * 0.2;
    const rad = 168;

    // 窗内：留白 + 火光放射线
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = PAPER;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    speedLines(ctx, cx, cy + 90, 34, 30, 260, 1510, 1.6);
    ctx.restore();

    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      line(
        ctx,
        [
          [cx + Math.cos(a) * (rad + 6), cy + Math.sin(a) * (rad + 6)],
          [cx + Math.cos(a) * (rad + 24), cy + Math.sin(a) * (rad + 24)],
        ],
        2,
        1500 + i,
      );
    }
    figure(ctx, cx, p1.y + p1.h + 10, 620, "stand");
  });

  // 2 燃烧的船：船体、破口、脱落的舱
  const p2 = r(M + 836, M, 972, 430);
  panel(ctx, p2, rev(t, 1.8), () => {
    wash(ctx, p2.x, p2.y, p2.w, p2.h, 0.06);
    const hx = p2.x + p2.w * 0.5;
    const hy = p2.y + p2.h * 0.44;

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-0.16);
    ctx.fillStyle = INK;
    ctx.fillRect(-260, -46, 520, 92);
    // 破口：一道白
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.moveTo(60, -46);
    ctx.lineTo(150, -10);
    ctx.lineTo(70, 20);
    ctx.lineTo(40, -20);
    ctx.closePath();
    ctx.fill();
    // 火：船尾拖出去的白
    ctx.beginPath();
    ctx.moveTo(-260, -40);
    ctx.lineTo(-520, -6);
    ctx.lineTo(-260, 36);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 烟：几团由浓到淡的墨点，不要框成矩形
    for (let i = 0; i < 16; i++) {
      const v = i / 16;
      ctx.fillStyle = `rgba(18,16,14,${0.42 - v * 0.36})`;
      ctx.beginPath();
      ctx.arc(p2.x + 60 + v * 330, p2.y + p2.h * 0.74 - v * 46, 10 + v * 26, 0, Math.PI * 2);
      ctx.fill();
    }
    // 脱离的舱
    const drop = Math.min(1, (t - 12) / 22);
    if (drop > 0) {
      const dx = hx - 40 + drop * 120;
      const dy = hy + 70 + drop * 180;
      ctx.fillStyle = INK;
      ctx.fillRect(dx - 16, dy - 12, 32, 24);
      ctx.strokeStyle = INK;
      ctx.setLineDash([5, 6]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(hx - 40, hy + 66);
      ctx.lineTo(dx, dy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    boom(ctx, "掉了", p2.x + p2.w * 0.82, p2.y + p2.h * 0.22, 56, 0.1);
  });

  // 3 第七舱：门开着，孩子已经站在外面
  const p3 = r(M + 836, M + 446, 972, 448);
  panel(ctx, p3, rev(t, 3.0), () => {
    wash(ctx, p3.x, p3.y, p3.w, p3.h, 0.28);
    const gy = p3.y + p3.h * 0.84;
    line(ctx, [[p3.x, gy], [p3.x + p3.w, gy]], 4, 1600);

    // 舱体：一个歪着坐下的黑壳
    const bx = p3.x + p3.w * 0.28;
    const bw = p3.w * 0.26;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(bx, gy);
    ctx.lineTo(bx + bw * 0.08, gy - 150);
    ctx.lineTo(bx + bw * 0.92, gy - 162);
    ctx.lineTo(bx + bw, gy);
    ctx.closePath();
    ctx.fill();

    // 舱门：开着的口子（白），门板翻下来
    ctx.fillStyle = PAPER;
    ctx.fillRect(bx + bw * 0.6, gy - 132, bw * 0.2, 132);
    ctx.fillStyle = INK;
    ctx.save();
    ctx.translate(bx + bw * 0.8, gy - 128);
    ctx.rotate(0.42);
    ctx.fillRect(0, 0, 86, 12);
    ctx.restore();

    // 三个孩子：站在舱外的地上
    for (let i = 0; i < 3; i++) {
      figure(ctx, bx + bw + 46 + i * 54, gy + 2, 150 - i * 10, "child");
    }
    boom(ctx, "孩子", p3.x + p3.w * 0.78, p3.y + p3.h * 0.36, 58, -0.08);
  });

  // G-05 全片情感最高点：孩子的背影走进舱门的光里，一只大人的手按在他肩上。
  // 试过"两只手推着孩子"，剪影上会糊成一堆石头；逆光的背影才一眼认得出。
  inset(ctx, r(M + 986, M + 508, 430, 320), rev(t, 37), () => {
    const bx = M + 986;
    const by = M + 508;
    wash(ctx, bx, by, 430, 320, 0.55);
    // 门里的光：一整块白
    ctx.fillStyle = PAPER;
    ctx.fillRect(bx + 262, by + 24, 152, 296);
    // 门框
    line(ctx, [[bx + 262, by + 24], [bx + 262, by + 320]], 7, 2700);
    // 孩子的背影，正朝光里走
    figure(ctx, bx + 248, by + 316, 214, "child");
    // 大人的手按在肩上
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(bx + 194, by + 166, 38, 25, -0.32, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(bx + 178 + i * 11, by + 188);
      ctx.rotate(0.5 + i * 0.07);
      ctx.beginPath();
      ctx.ellipse(0, 15, 7, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 小臂从左边进来
    ctx.beginPath();
    ctx.moveTo(bx - 10, by + 116);
    ctx.lineTo(bx + 168, by + 148);
    ctx.lineTo(bx + 168, by + 212);
    ctx.lineTo(bx - 10, by + 208);
    ctx.closePath();
    ctx.fill();
    // 孩子的手抓着门框，不肯松
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(bx + 268, by + 152 + i * 19, 6, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

// ==================== H 传说 ====================

const HAct: Act = (ctx, t) => {
  // 1 长者与孩子
  const p1 = r(M, M, 1120, 560);
  panel(ctx, p1, rev(t, 1.4), () => {
    wash(ctx, p1.x, p1.y, p1.w, p1.h, 0.42);
    // 火：留白
    ctx.fillStyle = PAPER;
    blob(
      ctx,
      [
        [p1.x + p1.w * 0.5 - 40, p1.y + p1.h + 20],
        [p1.x + p1.w * 0.5 - 18, p1.y + p1.h * 0.62],
        [p1.x + p1.w * 0.5, p1.y + p1.h * 0.44],
        [p1.x + p1.w * 0.5 + 22, p1.y + p1.h * 0.66],
        [p1.x + p1.w * 0.5 + 44, p1.y + p1.h + 20],
      ],
      1700,
      3,
    );
    figure(ctx, p1.x + p1.w * 0.3, p1.y + p1.h + 30, 620, "sit", true);
    figure(ctx, p1.x + p1.w * 0.68, p1.y + p1.h + 30, 380, "child");
  });

  // 2 反相格：流星雨
  const p2 = r(M + 1136, M, 672, 560);
  panel(ctx, p2, rev(t, 1.8), () => {
    ctx.fillStyle = INK;
    ctx.fillRect(p2.x, p2.y, p2.w, p2.h);
    ctx.fillStyle = PAPER;
    for (let k = 0; k < 5; k++) {
      const u0 = ((t * 0.22 + k / 5) % 1);
      for (let i = 20; i >= 0; i--) {
        const u = u0 - i * 0.014;
        if (u < 0) continue;
        const x = p2.x + 40 + u * (p2.w - 60);
        const y = p2.y + 30 + u * u * p2.h * 0.9;
        const s = 3.2 - (i / 20) * 2;
        ctx.fillStyle = `rgba(242,238,226,${0.25 + (1 - i / 20) * 0.75})`;
        ctx.fillRect(x, y, s, s);
      }
    }
  });

  // 3 一排听故事的人
  const p3 = r(M, M + 576, 1808, 318);
  panel(ctx, p3, rev(t, 3.0), () => {
    wash(ctx, p3.x, p3.y, p3.w, p3.h, 0.3);
    const hs = [250, 330, 210, 300, 240, 350];
    for (let i = 0; i < 6; i++) {
      const s2 = hs[i];
      figure(ctx, p3.x + 150 + i * 300 + (i % 3) * 24, p3.y + p3.h + 46, s2, "child");
    }
  });
};

// ==================== I 真相 ====================
const I: Act = (ctx, t) => {
  // 1 控制台：指针停在最左端，那里是"一千八百亿秒前"
  const p1 = r(M, M, 820, 560);
  panel(ctx, p1, rev(t, 1.4), () => {
    wash(ctx, p1.x, p1.y, p1.w, p1.h, 0.3);
    const y = p1.y + p1.h * 0.52;
    line(ctx, [[p1.x + 60, y], [p1.x + p1.w - 60, y]], 4, 1700);
    for (let i = 0; i <= 20; i++) {
      const x = p1.x + 60 + (i / 20) * (p1.w - 120);
      line(ctx, [[x, y], [x, y - (i % 5 === 0 ? 30 : 14)]], 2, 1700 + i);
    }
    // 指针：跳到最左
    const k = Math.min(1, t / 3);
    const nx = p1.x + 60 + (1 - k) * 0 + k * 6;
    line(ctx, [[nx, y - 60], [nx, y + 40]], 6, 1750);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(nx - 12, y - 60);
    ctx.lineTo(nx + 12, y - 60);
    ctx.lineTo(nx, y - 84);
    ctx.closePath();
    ctx.fill();
    boom(ctx, "1800 亿秒", p1.x + p1.w * 0.5, p1.y + p1.h * 0.22, 58, -0.04);
  });

  // 2 远景：一艘裹着火的船，从地平线那头过来
  const p2 = r(M + 836, M, 972, 560);
  panel(ctx, p2, rev(t, 1.8), () => {
    wash(ctx, p2.x, p2.y, p2.w, p2.h, 0.05);
    const hy = p2.y + p2.h * 0.68;
    line(ctx, [[p2.x, hy], [p2.x + p2.w, hy]], 4, 1800);
    // 拉修姆的地平线：一道弧
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p2.x + p2.w * 0.5, p2.y + p2.h * 2.1, p2.h * 1.5, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();

    const u = Math.min(1, Math.max(0, (t - 10) / 26));
    const sx = p2.x + p2.w * (0.94 - u * 0.62);
    const sy = p2.y + p2.h * (0.26 + u * 0.16);
    // 烟迹：越拖越长
    for (let i = 0; i < 26; i++) {
      const v = i / 26;
      ctx.fillStyle = `rgba(18,16,14,${0.5 - v * 0.42})`;
      const r2 = 3 + v * 12;
      ctx.beginPath();
      ctx.arc(sx + v * 240, sy - v * 40 + Math.sin(v * 8) * 8, r2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 船体
    ctx.fillStyle = INK;
    ctx.fillRect(sx - 26, sy - 9, 52, 18);
    // 火头：白
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(sx + 26, sy, 11, 0, Math.PI * 2);
    ctx.fill();
    speedLines(ctx, sx + 26, sy, 22, 14, 90, 1810, 1.4);
  });

  // 3 舱落在拉修姆上，门开了
  const p3 = r(M, M + 576, 1808, 318);
  panel(ctx, p3, rev(t, 3.0), () => {
    wash(ctx, p3.x, p3.y, p3.w, p3.h, 0.22);
    const gy = p3.y + p3.h * 0.82;
    line(ctx, [[p3.x, gy], [p3.x + p3.w, gy]], 4, 1900);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(p3.x + p3.w * 0.42, gy);
    ctx.lineTo(p3.x + p3.w * 0.44, p3.y + p3.h * 0.3);
    ctx.lineTo(p3.x + p3.w * 0.58, p3.y + p3.h * 0.28);
    ctx.lineTo(p3.x + p3.w * 0.6, gy);
    ctx.closePath();
    ctx.fill();
    // 门
    ctx.fillStyle = PAPER;
    ctx.fillRect(p3.x + p3.w * 0.49, p3.y + p3.h * 0.42, 10, p3.y + p3.h * 0.38);
    for (let i = 0; i < 4; i++) {
      figure(ctx, p3.x + p3.w * 0.5 + i * 16, gy - 4, 150, "child");
    }
    // 远处的观察者：一个极小的剪影，站在时间外面
    figure(ctx, p3.x + p3.w * 0.86, gy - 2, 120, "stand");
  });

  // I-05 隔着 1800 亿秒伸出手：指尖被画格切断，碰不到。
  inset(ctx, r(M + 1150, M + 300, 430, 296), rev(t, 33), () => {
    const bx = M + 1150;
    const by = M + 300;
    wash(ctx, bx, by, 430, 296, 0.06);
    // 小臂从左侧进来
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(bx - 30, by + 104);
    ctx.lineTo(bx + 230, by + 120);
    ctx.lineTo(bx + 230, by + 206);
    ctx.lineTo(bx - 30, by + 226);
    ctx.closePath();
    ctx.fill();
    // 拳头：掌背 + 四个指节抵在格边。握拳比张开的手好认得多
    ctx.beginPath();
    ctx.ellipse(bx + 288, by + 162, 58, 48, 0.02, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(bx + 340, by + 128 + i * 22, 22, 11, 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(bx + 300, by + 208);
    ctx.rotate(-0.25);
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      line(ctx, [[bx + 350, by + 134 + i * 22], [bx + 358, by + 138 + i * 22]], 2.4, 2500 + i);
    }
  });
};

// ==================== J 收台 ====================

const J: Act = (ctx, t) => {
  // 1 空房间
  const p1 = r(M, M, 1180, 894);
  panel(ctx, p1, rev(t, 1.4), () => {
    wash(ctx, p1.x, p1.y, p1.w, p1.h, 0.62);
    // 机器还在，人走了
    ctx.fillStyle = INK;
    ctx.fillRect(p1.x + 90, p1.y + 420, 520, 380);
    ctx.fillStyle = PAPER;
    ctx.fillRect(p1.x + 130, p1.y + 460, 440, 90);
    // 指示灯：最后一点亮
    const lum = Math.max(0.15, 1 - t / 24);
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(p1.x + 560, p1.y + 620, 12 * lum + 3, 0, Math.PI * 2);
    ctx.fill();
    // 空椅子
    line(ctx, [[p1.x + 760, p1.y + 800], [p1.x + 760, p1.y + 560]], 8, 2000);
    line(ctx, [[p1.x + 760, p1.y + 560], [p1.x + 900, p1.y + 520]], 8, 2001);
    line(ctx, [[p1.x + 900, p1.y + 520], [p1.x + 900, p1.y + 800]], 8, 2002);
  });

  // 2 白格
  const p2 = r(M + 1196, M, 612, 894);
  panel(ctx, p2, rev(t, 1.6), () => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(p2.x, p2.y, p2.w, p2.h);
    for (let i = 0; i < 14; i++) {
      line(
        ctx,
        [
          [p2.x + 60, p2.y + 120 + i * 46],
          [p2.x + p2.w - 60 - (i % 4) * 40, p2.y + 120 + i * 46],
        ],
        2,
        2100 + i,
      );
    }
  });
};

export const ACTS: Record<string, Act> = { A, B, C, D, E, F, G, H: HAct, I, J };

/** 页脚：页码与标题，漫画页的收尾 */
export function pageFooter(ctx: CanvasRenderingContext2D, act: string, name: string, no: number) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.font = "600 20px 'Microsoft YaHei', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${no} · ${name}`, W - M - 8, H - 22);
  ctx.textAlign = "left";
  ctx.font = "600 18px SimSun, serif";
  ctx.fillText("永不消逝的电波", M + 4, H - 22);
  ctx.restore();
  void act;
}
