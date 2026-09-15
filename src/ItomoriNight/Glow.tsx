import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 朝向相机的加色光斑。
 *
 * createGlowMaterial 的径向衰减是在 uv 上算的，所以只能贴在四边形上，
 * 而四边形一旦侧过来就变成一条线 —— 必须每帧对齐相机。
 * 这里直接把相机的 quaternion 抄给网格:
 * 平面的正面法线是 +Z，相机看向自己的 -Z，两者对齐就是正对相机。
 *
 * 同样不用 useFrame —— 走 useLayoutEffect，
 * 保证在 ThreeCanvas 里那个 advance() 之前把朝向摆好。
 */
export const BillboardGlow: React.FC<{
  material: THREE.Material;
  position: [number, number, number];
  scale: number | [number, number, number];
  opacity?: number;
  renderOrder?: number;
}> = ({ material, position, scale, opacity = 1, renderOrder = 4 }) => {
  const ref = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  useLayoutEffect(() => {
    const m = ref.current;
    if (m) m.quaternion.copy(camera.quaternion);
  });

  return (
    <mesh
      ref={ref}
      geometry={geo}
      material={material}
      position={position}
      scale={scale}
      renderOrder={renderOrder}
      frustumCulled={false}
      visible={opacity > 0.001}
    />
  );
};
