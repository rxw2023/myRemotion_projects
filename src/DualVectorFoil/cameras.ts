import { SMOOTH, foilZ, CAM_EPSILON } from "./timeline";

type Vec3 = [number, number, number];
type Shot = { pos: Vec3; target: Vec3 };

const lerpCam = (a: Shot, b: Shot, s: number): Shot => ({
  pos: a.pos.map((v, j) => v + (b.pos[j] - v) * s) as Vec3,
  target: a.target.map((v, j) => v + (b.target[j] - v) * s) as Vec3,
});

// S1 贴箔近景
const shot1At = (p: number): Shot => {
  const fz = foilZ(p);
  const t = (p - 0.2) / 0.2;
  const h = 20 - 4 * t;
  const d = 30 - 6 * t;
  const sway = Math.sin(t * Math.PI * 5) * 3;
  return { pos: [sway, h, fz + d], target: [0, 0, fz] };
};

export const camAt = (p: number): Shot => {
  const fz = foilZ(p);
  const E = CAM_EPSILON;

  if (p <= 0.2) {
    // S0 远景开场
    return lerpCam(
      { pos: [0, 62, 130], target: [0, 0, 0] },
      { pos: [0, 32, 78], target: [0, 0, 0] },
      SMOOTH(p / 0.2),
    );
  }
  if (p <= 0.2 + E) {
    // S0→S1
    return lerpCam(
      { pos: [0, 32, 78], target: [0, 0, 0] },
      shot1At(0.2 + E),
      SMOOTH((p - 0.2) / E),
    );
  }
  if (p <= 0.4) {
    // S1
    return shot1At(p);
  }
  if (p <= 0.4 + E) {
    // S1→S2
    return lerpCam(
      shot1At(0.4),
      { pos: [-28, 14, 44], target: [0, 0, 0] },
      SMOOTH((p - 0.4) / E),
    );
  }
  if (p <= 0.62) {
    // S2 太阳特写
    return lerpCam(
      { pos: [-28, 14, 44], target: [0, 0, 0] },
      { pos: [0, 5, 2], target: [0, 0, 0] },
      SMOOTH((p - 0.4) / 0.22),
    );
  }
  if (p <= 0.62 + E) {
    // S2→S3
    return lerpCam(
      { pos: [0, 5, 2], target: [0, 0, 0] },
      { pos: [-18, 6, fz + 10], target: [-8.46, 0, fz] },
      SMOOTH((p - 0.62) / E),
    );
  }
  if (p <= 0.82) {
    // S3 行星特写
    const e = SMOOTH((p - 0.62) / 0.2);
    return lerpCam(
      { pos: [-18, 6, fz + 10], target: [-8.46, 0, fz] },
      { pos: [4, 6, fz + 10], target: [13, 0, fz] },
      e,
    );
  }
  if (p <= 0.82 + E) {
    // S3→S4
    return lerpCam(
      { pos: [4, 6, fz + 10], target: [13, 0, fz] },
      { pos: [8, 22, -42], target: [0, 0, -60] },
      SMOOTH((p - 0.82) / E),
    );
  }
  // S4 大远景
  return lerpCam(
    { pos: [8, 22, -42], target: [0, 0, -60] },
    { pos: [-120, 60, -145], target: [0, 0, -60] },
    SMOOTH((p - 0.82) / 0.18),
  );
};
