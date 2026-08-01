import * as THREE from "three";

// ---- 颜色工具 ----
export const toHex = (n: number): string => {
  const p2 = (v: number) => (v < 16 ? "0" : "") + v.toString(16);
  return "#" + p2((n >> 16) & 255) + p2((n >> 8) & 255) + p2(n & 255);
};

export const rgba = (hex: string | number, a: number): string => {
  const n = typeof hex === "string" ? parseInt(hex.slice(1), 16) : hex;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const mixColor = (c: number, t: number, k: number): string => {
  const f = (a: number, b: number) => Math.round(a + (b - a) * k);
  return toHex(
    (f((c >> 16) & 255, (t >> 16) & 255) << 16) |
      (f((c >> 8) & 255, (t >> 8) & 255) << 8) |
      f(c & 255, t & 255),
  );
};

// ---- 离屏 Canvas 工具 ----
export const canvas2d = (size: number): [HTMLCanvasElement, CanvasRenderingContext2D, number] => {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!, size / 2];
};

// ---- 光晕贴图 ----
export const glowTexture = (color: string): THREE.CanvasTexture => {
  const [c, g, r] = canvas2d(128);
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, mixColor(0xffffff, 0x000000, 0.6));
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

// ---- 箔面贴图 ----
export const foilTexture = (): THREE.CanvasTexture => {
  const [c, g, r] = canvas2d(256);
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0.0, "rgba(190,215,255,0.62)");
  grad.addColorStop(0.45, "rgba(130,150,235,0.50)");
  grad.addColorStop(0.8, "rgba(95,110,205,0.40)");
  grad.addColorStop(1.0, "rgba(120,80,200,0.30)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  // 斜向彩虹干涉带
  g.save();
  g.translate(r, r);
  g.rotate(-0.5);
  const lg = g.createLinearGradient(-r, 0, r, 0);
  lg.addColorStop(0.0, "rgba(150,120,220,0)");
  lg.addColorStop(0.3, "rgba(120,200,255,0.30)");
  lg.addColorStop(0.5, "rgba(220,220,255,0.36)");
  lg.addColorStop(0.7, "rgba(200,130,240,0.28)");
  lg.addColorStop(1.0, "rgba(130,160,225,0)");
  g.fillStyle = lg;
  g.fillRect(-r, -r, r * 2, r * 2);
  g.restore();
  return new THREE.CanvasTexture(c);
};

// ---- 太阳二维画 ----
export const sunTexture = (): THREE.CanvasTexture => {
  const [c, g, r] = canvas2d(512);
  const zones: [number, number, string][] = [
    [0.0, 0.14, "#fffbe0"],
    [0.14, 0.3, "#fff3c0"],
    [0.3, 0.5, "#ffe06a"],
    [0.5, 0.66, "#ffc040"],
    [0.66, 0.8, "#ffa020"],
    [0.8, 0.9, "#ff8a2a"],
    [0.9, 1.0, "#ff5a2a"],
  ];
  zones.forEach(([a, b, col]) => {
    const nn = parseInt(col.slice(1), 16);
    const grd = g.createRadialGradient(r, r, r * a, r, r, r * b);
    grd.addColorStop(0, col);
    grd.addColorStop(1, mixColor(nn, 0x000000, 0.22));
    g.fillStyle = grd;
    g.beginPath();
    g.arc(r, r, r * b, 0, 7);
    if (a > 0) g.arc(r, r, r * a, 0, 7, true);
    g.fill();
  });
  [0.14, 0.3, 0.5, 0.66, 0.8, 0.9].forEach((x) => {
    g.strokeStyle = "rgba(150,70,10,0.4)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(r, r, r * x, 0, 7);
    g.stroke();
  });
  g.save();
  g.globalAlpha = 0.16;
  for (let i = 0; i < 150; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = (0.3 + Math.random() * 0.5) * r;
    const len = (0.05 + Math.random() * 0.13) * r;
    g.strokeStyle = Math.random() > 0.5 ? "#ffffff" : "#ff7000";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(r + Math.cos(a) * rr, r + Math.sin(a) * rr);
    g.lineTo(r + Math.cos(a) * (rr + len), r + Math.sin(a) * (rr + len));
    g.stroke();
  }
  g.restore();
  return new THREE.CanvasTexture(c);
};

// ---- 行星二维画 ----
export interface PlanetPaintOpts {
  core: string | number;
  mantle?: string | number;
  crust: string | number;
  halo?: string;
  earth?: boolean;
  bands?: string[];
  saturnRing?: boolean;
}

export const planetTexture = (o: PlanetPaintOpts): THREE.CanvasTexture => {
  const core = typeof o.core === "number" ? toHex(o.core) : o.core;
  const mantle = typeof o.mantle === "number" ? toHex(o.mantle) : o.mantle ?? core;
  const crust = typeof o.crust === "number" ? toHex(o.crust) : o.crust;
  const [c, g, r] = canvas2d(512);

  // 大气晕环
  if (o.halo) {
    const hg = g.createRadialGradient(r, r, r * 0.72, r, r, r * 1.3);
    hg.addColorStop(0, rgba(o.halo, 0.5));
    hg.addColorStop(0.75, rgba(o.halo, 0.14));
    hg.addColorStop(1, rgba(o.halo, 0));
    g.fillStyle = hg;
    g.beginPath();
    g.arc(r, r, r * 1.3, 0, 7);
    g.fill();
  }

  // 行星盘本体
  g.fillStyle = crust;
  g.beginPath();
  g.arc(r, r, r, 0, 7);
  g.fill();

  if (o.earth) {
    const spots: [number, number, number][] = [
      [0.5, 0.2, 0.3],
      [-0.32, 0.16, 0.22],
      [0.18, -0.42, 0.3],
      [-0.22, -0.14, 0.18],
      [0.42, -0.04, 0.14],
      [-0.48, 0.36, 0.16],
    ];
    spots.forEach(([x, y, s]) => {
      const grd = g.createRadialGradient(r + x * r, r + y * r, 2, r + x * r, r + y * r, s * r);
      grd.addColorStop(0, "rgba(140,200,110,0.95)");
      grd.addColorStop(0.6, "rgba(110,150,80,0.85)");
      grd.addColorStop(1, "rgba(80,130,60,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(r + x * r, r + y * r, s * r, 0, 7);
      g.fill();
    });
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = (0.2 + Math.random() * 0.6) * r;
      const sz = (0.08 + Math.random() * 0.12) * r;
      const grd = g.createRadialGradient(
        r + Math.cos(a) * rr, r + Math.sin(a) * rr, 1,
        r + Math.cos(a) * rr, r + Math.sin(a) * rr, sz,
      );
      grd.addColorStop(0, "rgba(255,255,255,0.9)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(r + Math.cos(a) * rr, r + Math.sin(a) * rr, sz, 0, 7);
      g.fill();
    }
    g.strokeStyle = "rgba(90,60,30,0.5)";
    g.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const rr = (0.5 + Math.random() * 0.35) * r;
      g.beginPath();
      g.moveTo(r, r);
      g.lineTo(r + Math.cos(a) * rr, r + Math.sin(a) * rr);
      g.stroke();
    }
  } else if (o.bands) {
    g.save();
    g.filter = "blur(1px)";
    const n = o.bands.length;
    o.bands.forEach((col, i) => {
      g.globalAlpha = 0.8;
      g.fillStyle = col;
      const y = r - (n / 2 - i) * r * 0.3;
      g.beginPath();
      g.ellipse(r, y, r * 1.05, r * 0.16, 0, 0, 7);
      g.fill();
    });
    g.restore();
  } else {
    const mg = g.createRadialGradient(r, r, r * 0.3, r, r, r * 0.78);
    mg.addColorStop(0, mantle);
    mg.addColorStop(1, mixColor(parseInt(mantle.slice(1), 16), 0x000000, 0.2));
    g.fillStyle = mg;
    g.beginPath();
    g.arc(r, r, r * 0.78, 0, 7);
    g.fill();
    const kg = g.createRadialGradient(r, r, r * 0.05, r, r, r * 0.34);
    kg.addColorStop(0, "#ffffff");
    kg.addColorStop(0.45, core);
    kg.addColorStop(1, rgba(core, 0.75));
    g.fillStyle = kg;
    g.beginPath();
    g.arc(r, r, r * 0.34, 0, 7);
    g.fill();
    g.strokeStyle = rgba(mixColor(parseInt(crust.slice(1), 16), 0x000000, 0.4), 0.5);
    g.lineWidth = 3;
    g.beginPath();
    g.arc(r, r, r * 0.78, 0, 7);
    g.stroke();
  }

  // 土星环
  if (o.saturnRing) {
    g.strokeStyle = "rgba(235,215,165,0.8)";
    g.lineWidth = 9;
    g.beginPath();
    g.ellipse(r, r, r * 1.34, r * 0.42, 0, 0, 7);
    g.stroke();
    g.strokeStyle = "rgba(235,215,165,0.4)";
    g.lineWidth = 17;
    g.beginPath();
    g.ellipse(r, r, r * 1.42, r * 0.48, 0, 0, 7);
    g.stroke();
  }

  // 轨道环
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(r, r, r * 1.55, 0, 7);
  g.stroke();
  g.strokeStyle = "rgba(140,180,235,0.3)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(r, r, r * 1.45, 0, 7);
  g.stroke();

  return new THREE.CanvasTexture(c);
};

// ---- 太空城市光点贴图 ----
export const dotTexture = (): THREE.CanvasTexture => {
  const [c, g, r] = canvas2d(32);
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, "rgba(225,238,255,0.95)");
  grd.addColorStop(0.5, "rgba(150,190,230,0.6)");
  grd.addColorStop(1, "rgba(150,190,230,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
};
