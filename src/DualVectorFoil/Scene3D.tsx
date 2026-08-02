import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useVideoConfig } from "remotion";
import * as THREE from "three";
import {
  SWEEP0,
  SWEEP1,
  SUN_CATCH_P,
  PLANAR_P,
  SMOOTH,
  foilZ,
  catchP,
} from "./timeline";
import {
  glowTexture,
  foilTexture,
  sunTexture,
  planetTexture,
  dotTexture,
} from "./textures";
import type { PlanetPaintOpts } from "./textures";
import { camAt } from "./cameras";

// ==================== 行星数据 ====================
interface PlanetData {
  name: string;
  r: number;
  orbit: number;
  frozen: number;
  color: number;
  paintOpts: PlanetPaintOpts;
  paintR: number;
}

const PLANETS: PlanetData[] = [
  { name: "水星", r: 0.5, orbit: 5, frozen: 60, color: 0xb8a899, paintOpts: { core: 0xf0dcc0, mantle: 0xb8a899, crust: 0x8a7a68, halo: "#c9c2b8" }, paintR: 1.2 },
  { name: "金星", r: 0.8, orbit: 7, frozen: 160, color: 0xe8c39e, paintOpts: { core: 0xffe8c8, mantle: 0xe8c39e, crust: 0xc99f6e, halo: "#f0d8b8" }, paintR: 1.92 },
  { name: "地球", r: 0.9, orbit: 9, frozen: 200, color: 0x4f86e8, paintOpts: { core: 0x9a4a1a, mantle: 0x6a5a3a, crust: 0x3a6ec9, halo: "#9fc4ef", earth: true }, paintR: 2.16 },
  { name: "火星", r: 0.7, orbit: 11, frozen: 320, color: 0xc96b4a, paintOpts: { core: 0xf0a080, mantle: 0xc96b4a, crust: 0x8a4a32, halo: "#e08a66" }, paintR: 1.68 },
  { name: "木星", r: 2.1, orbit: 15, frozen: 30, color: 0xd9a066, paintOpts: { core: 0xfff0d8, crust: 0xd9a066, halo: "#e8c9a0", bands: ["#f0e0c8", "#d9a066", "#b57f4a", "#e8c9a0", "#c98d52"] }, paintR: 5.04 },
  { name: "土星", r: 1.8, orbit: 19, frozen: 120, color: 0xe0c68a, paintOpts: { core: 0xfff0d8, crust: 0xe0c68a, halo: "#e9d5a8", bands: ["#e9d5a8", "#c7a968", "#e0c68a"], saturnRing: true }, paintR: 4.32 },
  { name: "天王星", r: 1.4, orbit: 23, frozen: 210, color: 0x8fd4d0, paintOpts: { core: 0xffffff, crust: 0x8fd4d0, halo: "#b6e6e2", bands: ["#c8ecea", "#8fd4d0", "#6abcb8"] }, paintR: 3.36 },
  { name: "海王星", r: 1.4, orbit: 27, frozen: 300, color: 0x4a6bd9, paintOpts: { core: 0xffffff, crust: 0x4a6bd9, halo: "#6b8ae6", bands: ["#8aa6ee", "#4a6bd9", "#3a55b0"] }, paintR: 3.36 },
  { name: "冥王星", r: 0.45, orbit: 31, frozen: 40, color: 0x9aa0a8, paintOpts: { core: 0xd8dce0, mantle: 0x9aa0a8, crust: 0x70747a, halo: "#b8bec4" }, paintR: 1.08 },
];

const CITY_ORBS = [16.5, 17.5, 19.5, 20.5, 23.5, 24.5, 27.5, 28.5];

// ==================== 星空 ====================
const Stars: React.FC = () => {
  const geo = useMemo(() => {
    const N = 2600;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 160 + Math.random() * 320;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial color={0xffffff} size={1.3} sizeAttenuation transparent opacity={1} />
    </points>
  );
};

// ==================== 箔面 ====================
const Foil: React.FC<{ p: number }> = ({ p }) => {
  const sheetMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const rimMatRef = useRef<THREE.LineBasicMaterial>(null);

  const sheetTex = useMemo(() => foilTexture(), []);
  const rimGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-90, -90, 0), new THREE.Vector3(90, -90, 0),
      new THREE.Vector3(90, 90, 0), new THREE.Vector3(-90, 90, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const fade = SMOOTH(Math.min(1, Math.max(0, (p - 0.12) / 0.06)));
  const sw = Math.min(1, Math.max(0, (p - SWEEP0) / (SWEEP1 - SWEEP0)));
  const grow = 0.12 + 0.88 * sw;
  const visible = p > 0.12;

  useFrame(() => {
    if (sheetMatRef.current) sheetMatRef.current.opacity = 0.42 * fade;
    if (rimMatRef.current) rimMatRef.current.opacity = 0.95 * fade;
  });

  if (!visible) return null;

  return (
    <group position={[0, 0, foilZ(p)]} scale={[grow, grow, 1]}>
      <mesh>
        <planeGeometry args={[180, 180]} />
        <meshBasicMaterial ref={sheetMatRef} map={sheetTex} transparent opacity={0.42 * fade} depthWrite={false} />
      </mesh>
      <lineLoop geometry={rimGeo}>
        <lineBasicMaterial ref={rimMatRef} color={0x9aa6c0} transparent opacity={0.95 * fade} />
      </lineLoop>
    </group>
  );
};

// ==================== 太阳 ====================
const Sun3D: React.FC<{ p: number }> = ({ p }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const paintRef = useRef<THREE.Mesh>(null);
  const paintGlowRef = useRef<THREE.Sprite>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const rippleMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const glowTex = useMemo(() => glowTexture("#ffe9a8"), []);
  const sunTex = useMemo(() => sunTexture(), []);
  const paintGlowTex = useMemo(() => glowTexture("#fff0c0"), []);

  useFrame(() => {
    const sphere = sphereRef.current;
    const glow = glowRef.current;
    const paint = paintRef.current;
    const paintGlow = paintGlowRef.current;
    const ripple = rippleRef.current;

    // 二维画/光晕/涟漪跟随箔面位置
    if (paint) paint.position.z = foilZ(p);
    if (paintGlow) paintGlow.position.z = foilZ(p);
    if (ripple) ripple.position.z = foilZ(p);

    if (p >= SUN_CATCH_P) {
      const sq = Math.min(1, (p - SUN_CATCH_P) / 0.05);
      const k = 1 + 0.3 * sq;
      if (sphere) {
        sphere.scale.set(k, k, 1 - 0.95 * sq);
        (sphere.material as THREE.MeshBasicMaterial).opacity = 1 - sq;
        sphere.visible = sq < 1;
      }
      if (glow) glow.material.opacity = 0.8 * (1 - sq);

      const g = Math.min(1, (p - SUN_CATCH_P) / 0.12);
      if (paint) {
        paint.visible = g > 0.02;
        paint.scale.setScalar(10.5 * Math.max(0.001, 0.12 + 0.88 * g));
        (paint.material as THREE.MeshBasicMaterial).opacity = Math.min(1, g * 2.2);
      }
      if (paintGlow) {
        paintGlow.visible = g > 0.02;
        const breathe = 0.82 + 0.18 * Math.sin(p * Math.PI * 18);
        paintGlow.material.opacity = Math.min(0.9, g * 1.6) * breathe;
      }
      const rk = p - SUN_CATCH_P;
      if (ripple) {
        ripple.visible = rk < 0.16;
        if (ripple.visible) {
          const cyc = (rk % 0.04) / 0.04;
          ripple.scale.setScalar(1 + cyc * 13);
          ripple.rotation.z = rk * 2.5;
        }
      }
      if (rippleMatRef.current) {
        rippleMatRef.current.opacity = ripple?.visible
          ? (1 - ((p - SUN_CATCH_P) % 0.04) / 0.04) * 0.5
          : 0;
      }
    } else {
      if (sphere) {
        sphere.scale.set(1, 1, 1);
        (sphere.material as THREE.MeshBasicMaterial).opacity = 1;
        sphere.visible = true;
      }
      if (glow) glow.material.opacity = 0.8;
      if (paint) paint.visible = false;
      if (paintGlow) paintGlow.visible = false;
      if (ripple) ripple.visible = false;
    }
  });

  return (
    <>
      {/* 3D 太阳 */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[3, 48, 48]} />
        <meshBasicMaterial color={0xffd76a} />
      </mesh>
      <sprite ref={glowRef} scale={[52, 52, 1]}>
        <spriteMaterial map={glowTex} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {/* 二维画 */}
      <mesh ref={paintRef} visible={false} position={[0, 0, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial map={sunTex} transparent opacity={0} depthWrite={false} />
      </mesh>
      <sprite ref={paintGlowRef} scale={[70, 70, 1]} visible={false} position={[0, 0, 0]}>
        <spriteMaterial map={paintGlowTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh ref={rippleRef} visible={false} position={[0, 0, 0]}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial ref={rippleMatRef} color={0xffffff} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
};

// ==================== 行星 ====================
const Planets: React.FC<{ p: number }> = ({ p }) => {
  const planetRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringRefs = useRef<(THREE.LineLoop | null)[]>([]);
  const paintRefs = useRef<(THREE.Mesh | null)[]>([]);

  const paintTextures = useMemo(() => PLANETS.map((d) => planetTexture(d.paintOpts)), []);

  const orbitGeos = useMemo(
    () =>
      PLANETS.map((d) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < 128; i++) {
          const a = (i / 128) * Math.PI * 2;
          pts.push(new THREE.Vector3(d.orbit * Math.cos(a), 0, d.orbit * Math.sin(a)));
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
      }),
    [],
  );

  useFrame(() => {
    planetRefs.current.forEach((sphere, i) => {
      if (!sphere) return;
      const d = PLANETS[i];
      const ring = ringRefs.current[i];
      const paint = paintRefs.current[i];

      // 公转 (仅片头)
      const t = SMOOTH(Math.min(1, p / 0.12));
      const a0 = (d.frozen * Math.PI) / 180;
      const a = a0 + (3 / d.orbit) * t * Math.PI * 2;
      const px = d.orbit * Math.cos(a);
      const pz = d.orbit * Math.sin(a);
      sphere.position.set(px, 0, pz);

      // 平面模式: 隐藏 3D, 只留箔面上的二维画
      if (p > PLANAR_P) {
        sphere.visible = false;
        if (ring) ring.visible = false;
        if (paint) {
          const fade = SMOOTH(Math.min(1, (p - PLANAR_P) / 0.03));
          paint.visible = true;
          paint.position.set(px, 0, foilZ(p));
          paint.scale.setScalar(d.paintR * 1.25 * Math.max(0.001, 0.15 + 0.85 *fade));
          (paint.material as THREE.MeshBasicMaterial).opacity = Math.min(1, fade * 2.5);
        }
        return;
      }

      // 二维化
      const cp = catchP(sphere.position.z);
      if (p >= cp) {
        const sq = Math.min(1, (p - cp) / 0.03);
        const k = 1 + 0.2 * sq;
        sphere.scale.set(k, k, 1 - 0.95 * sq);
        (sphere.material as THREE.MeshLambertMaterial).opacity = 1 - sq;
        sphere.visible = sq < 1;
        if (ring) ring.visible = sq < 1;
        if (paint) {
          const g = Math.min(1, (p - cp) / 0.06);
          paint.visible = g > 0.02;
          paint.position.set(px, 0, foilZ(p));
          paint.scale.setScalar(d.paintR * 1.25 * Math.max(0.001, 0.15 + 0.85 *g));
          (paint.material as THREE.MeshBasicMaterial).opacity = Math.min(1, g * 2.2);
        }
      } else {
        sphere.scale.set(1, 1, 1);
        (sphere.material as THREE.MeshLambertMaterial).opacity = 1;
        sphere.visible = true;
        if (ring) ring.visible = true;
        if (paint) paint.visible = false;
      }
    });
  });

  return (
    <>
      {PLANETS.map((d, i) => (
        <React.Fragment key={d.name}>
          <mesh ref={(el) => { planetRefs.current[i] = el; }}>
            <sphereGeometry args={[d.r, 28, 28]} />
            <meshLambertMaterial color={d.color} transparent />
          </mesh>
          <lineLoop ref={(el) => { ringRefs.current[i] = el; }} geometry={orbitGeos[i]}>
            <lineBasicMaterial color={0x7f97b8} transparent opacity={0.35} />
          </lineLoop>
          <mesh ref={(el) => { paintRefs.current[i] = el; }} visible={false}>
            <circleGeometry args={[1, 48]} />
            <meshBasicMaterial map={paintTextures[i]} transparent opacity={0} depthWrite={false} />
          </mesh>
        </React.Fragment>
      ))}
    </>
  );
};

// ==================== 太空城市 ====================
const Cities: React.FC<{ p: number }> = ({ p }) => {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const paintRefs = useRef<(THREE.Mesh | null)[]>([]);
  const sizes = useRef<number[]>([]);

  const dotTex = useMemo(() => dotTexture(), []);

  const cityData = useMemo(() => {
    const data: { pos: [number, number, number]; sz: number }[] = [];
    for (let i = 0; i < 48; i++) {
      const orb = CITY_ORBS[i % CITY_ORBS.length] + (Math.random() * 0.8 - 0.4);
      const a = Math.PI * (1.35 + Math.random() * 0.3);
      const x = orb * Math.cos(a);
      const z = orb * Math.sin(a);
      const y = (Math.random() * 0.8 - 0.4) * 0.5;
      data.push({ pos: [x, y, z], sz: 0.2 + Math.random() * 0.12 });
    }
    sizes.current = data.map((d) => d.sz);
    return data;
  }, []);

  useFrame(() => {
    cityData.forEach((cd, i) => {
      const mesh = meshRefs.current[i];
      const paint = paintRefs.current[i];
      if (!mesh) return;

      // 平面模式: 隐藏 3D 城市点, 只留箔面上的二维点
      if (p > PLANAR_P) {
        mesh.visible = false;
        if (paint) {
          const fade = SMOOTH(Math.min(1, (p - PLANAR_P) / 0.03));
          paint.visible = true;
          paint.position.set(cd.pos[0], cd.pos[1], foilZ(p));
          paint.scale.setScalar(sizes.current[i] * Math.max(0.001, 0.2 + 0.8 * fade));
          (paint.material as THREE.MeshBasicMaterial).opacity = Math.min(1, fade * 2.5);
        }
        return;
      }

      const cp = catchP(cd.pos[2]);
      if (p >= cp) {
        mesh.visible = false;
        if (paint) {
          const g = Math.min(1, (p - cp) / 0.02);
          paint.visible = g > 0;
          paint.position.set(cd.pos[0], cd.pos[1], foilZ(p));
          paint.scale.setScalar(sizes.current[i] * Math.max(0.001, 0.2 + 0.8 * g));
          (paint.material as THREE.MeshBasicMaterial).opacity = Math.min(1, g * 2.5);
        }
      } else {
        mesh.visible = true;
        if (paint) paint.visible = false;
      }
    });
  });

  return (
    <>
      {cityData.map((cd, i) => (
        <React.Fragment key={i}>
          <mesh ref={(el) => { meshRefs.current[i] = el; }} position={cd.pos}>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshLambertMaterial color={0x9fb4cf} />
          </mesh>
          <mesh ref={(el) => { paintRefs.current[i] = el; }} visible={false}>
            <circleGeometry args={[1, 20]} />
            <meshBasicMaterial map={dotTex} transparent opacity={0} depthWrite={false} />
          </mesh>
        </React.Fragment>
      ))}
    </>
  );
};

// ==================== 主场景 ====================
const Scene: React.FC<{ p: number }> = ({ p }) => {
  useFrame(({ camera }) => {
    const cam = camAt(p);
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.target);
  });

  return (
    <>
      <Stars />
      <ambientLight intensity={0.9} color={0x9ab0d8} />
      <pointLight position={[0, 0, 0]} intensity={2.6} distance={220} color={0xffe3b0} />
      <Sun3D p={p} />
      <Planets p={p} />
      <Cities p={p} />
      <Foil p={p} />
    </>
  );
};

// ==================== Canvas 包装 ====================
const Scene3D: React.FC<{ p: number }> = ({ p }) => {
  const { width, height } = useVideoConfig();
  return (
    <Canvas
      camera={{ position: [30, 45, 110], fov: 50, near: 0.1, far: 3000 }}
      style={{ width, height }}
    >
      <color attach="background" args={[0x02030a]} />
      <Scene p={p} />
    </Canvas>
  );
};

export default Scene3D;
