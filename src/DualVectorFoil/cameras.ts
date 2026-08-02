import { SMOOTH, foilZ, CAM_EPSILON } from "./timeline";

type Vec3 = [number, number, number];
type Shot = { pos: Vec3; target: Vec3 };

const lerpCam = (a: Shot, b: Shot, s: number): Shot => ({
  pos: a.pos.map((v, j) => v + (b.pos[j] - v) * s) as Vec3,
  target: a.target.map((v, j) => v + (b.target[j] - v) * s) as Vec3,
});

// S2 平面模式: 镜头俯视箔面, 太阳二维画在箔中央展开
const shot2At = (p: number): Shot => {
  const fz = foilZ(p);
  const t = SMOOTH(Math.min(1, Math.max(0, (p - 0.4) / 0.22)));
  return lerpCam(
    { pos: [-18, 22, fz + 34], target: [0, 0, fz] },
    { pos: [0, 14, fz + 18], target: [0, 0, fz] },
    t,
  );
};

// S3 沿箔面横移, 掠过行星二维画
const shot3At = (p: number): Shot => {
  const fz = foilZ(p);
  const e = SMOOTH(Math.min(1, Math.max(0, (p - 0.62) / 0.2)));
  return lerpCam(
    { pos: [0, 14, fz + 18], target: [0, 0, fz] },
    { pos: [18, 9, fz + 12], target: [14, 0, fz] },
    e,
  );
};

// S0 深空追逐: 镜头跟随箔片从深空加速飞向太阳系, 从信封大小持续长大
const chaseShot = (p: number): Shot => {
  const fz = foilZ(p);
  const t = SMOOTH(Math.min(1, Math.max(0, p / 0.4)));
  const sway = -18 * t;
  const h = 6 + 16 * t;
  const d = 26 + 8 * t;
  return { pos: [sway, h, fz + d], target: [0, 0, fz] };
};

export const camAt = (p: number): Shot => {
  const fz = foilZ(p);
  const E = CAM_EPSILON;

  if (p <= 0.4) {
    // S0 深空追逐
    return chaseShot(p);
  }
  if (p <= 0.4 + E) {
    // →S2
    return lerpCam(
      { pos: [-18, 22, fz + 34], target: [0, 0, fz] },
      shot2At(0.4 + E),
      SMOOTH((p - 0.4) / E),
    );
  }
  if (p <= 0.62) {
    // S2
    return shot2At(p);
  }
  if (p <= 0.62 + E) {
    // S2→S3
    return lerpCam(
      shot2At(0.62),
      shot3At(0.62 + E),
      SMOOTH((p - 0.62) / E),
    );
  }
  if (p <= 0.82) {
    // S3
    return shot3At(p);
  }
  if (p <= 0.82 + E) {
    // S3→S4 拉远
    return lerpCam(
      shot3At(0.82),
      { pos: [8, 26, fz - 60], target: [0, 0, fz] },
      SMOOTH((p - 0.82) / E),
    );
  }
  // S4 大全景: 程心回望整幅二维画卷
  return lerpCam(
    { pos: [8, 26, fz - 60], target: [0, 0, fz] },
    { pos: [-120, 60, fz - 100], target: [0, 0, fz] },
    SMOOTH((p - 0.82) / 0.18),
  );
};
