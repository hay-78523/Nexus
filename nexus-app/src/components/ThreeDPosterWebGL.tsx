"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, ContactShadows, Sparkles, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/** Bảng màu ánh sáng */
const KEY = "#ccff00";
const RIM_WARM = "#ff00aa"; // Hot Pink
const RIM_COOL = "#00f0ff"; // Cyan

/**
 * Đổi chất liệu gốc sang MeshPhysicalMaterial siêu rực rỡ
 */
function upgradeMaterials(scene: THREE.Object3D) {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.castShadow = true;
    child.receiveShadow = true;

    if (child.userData.nxUpgraded) return;
    child.userData.nxUpgraded = true;

    const old = child.material as THREE.MeshStandardMaterial;

    const next = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#1a1a24"), // Nền tối xám/xanh để tôn màu ngũ sắc
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      iridescence: 1.0, // Bật ngũ sắc tối đa
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [100, 800], // Phạm vi màu ngũ sắc
    });

    if (old) {
      next.normalMap = old.normalMap ?? null;
      next.roughnessMap = old.roughnessMap ?? null;
      next.metalnessMap = old.metalnessMap ?? null;
      next.aoMap = old.aoMap ?? null;
      old.dispose();
    }

    child.material = next;
  });
}

function CharacterModel({ baseScale }: { baseScale: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);

  const { scene } = useGLTF("/model/base_basic_pbr.glb");

  useEffect(() => {
    if (scene) upgradeMaterials(scene);
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const swing = Math.sin(t * 0.22) * 0.34;
    const aimY = hovered ? (state.pointer.x * Math.PI) / 9 : 0;
    const aimX = hovered ? (state.pointer.y * Math.PI) / 11 : 0;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      swing + aimY,
      0.06
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -aimX, 0.06);
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group
        ref={groupRef}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        position={[0, -6, 0]}
        scale={hovered ? baseScale * 1.07 : baseScale}
      >
        <primitive object={scene} />
      </group>
    </Float>
  );
}

/** Giàn đèn nhiều màu quay quanh nhân vật */
function LightRig() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.15; // Quay nhanh hơn một chút
  });

  return (
    <group ref={ref}>
      <pointLight position={[6, 3, 6]} intensity={120} color="#ccff00" distance={50} decay={2} />
      <pointLight position={[-6, 3, 6]} intensity={150} color="#ff00aa" distance={50} decay={2} />
      <pointLight position={[0, -5, 6]} intensity={150} color="#00f0ff" distance={50} decay={2} />
      <pointLight position={[6, 0, -6]} intensity={120} color="#ffaa00" distance={50} decay={2} />
      <pointLight position={[-6, 0, -6]} intensity={120} color="#aa00ff" distance={50} decay={2} />
    </group>
  );
}

type Variant = "stage" | "backdrop";

export default function ThreeDPosterWebGL({
  variant = "stage",
  className = "",
}: {
  variant?: Variant;
  className?: string;
} = {}) {
  const isBackdrop = variant === "backdrop";
  const aberration = useMemo(() => new THREE.Vector2(0.0004, 0.0005), []);

  return (
    <div
      className={`absolute inset-0 z-0 flex items-center justify-center ${
        isBackdrop ? "pointer-events-none opacity-45" : "pointer-events-auto"
      } ${className}`}
      aria-hidden={isBackdrop || undefined}
    >
      <Canvas
        shadows={!isBackdrop}
        dpr={isBackdrop ? [1, 1.25] : [1, 2]}
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: !isBackdrop, toneMapping: THREE.ACESFilmicToneMapping, alpha: true }}
      >
        <ambientLight intensity={0.25} color="#8899aa" />

        <spotLight
          position={[5, 6, 9]}
          angle={0.5}
          penumbra={0.6}
          intensity={7}
          castShadow={!isBackdrop}
          shadow-mapSize={[2048, 2048]}
          color={KEY}
        />

        <directionalLight position={[0, 6, -9]} intensity={2.2} color="#ffffff" />

        <LightRig />

        <Environment resolution={256}>
          {/* Đã gỡ bỏ background đen để thấy được nền Galaxy phía sau Canvas */}

          <Lightformer form="rect" intensity={5} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[14, 8, 1]} color={KEY} />
          <Lightformer form="rect" intensity={3.5} position={[-7, 1, -2]} rotation-y={Math.PI / 2} scale={[10, 8, 1]} color={RIM_WARM} />
          <Lightformer form="rect" intensity={3.5} position={[7, 1, -2]} rotation-y={-Math.PI / 2} scale={[10, 8, 1]} color={RIM_COOL} />
          <Lightformer form="circle" intensity={6} position={[3, 4, 6]} scale={2.5} color="#ffffff" />
          <Lightformer form="rect" intensity={1.2} position={[0, -6, 2]} rotation-x={-Math.PI / 2} scale={[12, 6, 1]} color={KEY} />
        </Environment>

        <CharacterModel baseScale={isBackdrop ? 11 : 15} />

        {!isBackdrop && (
          <Sparkles count={150} scale={[14, 14, 14]} size={3} speed={0.5} opacity={0.5} color="#ffffff" />
        )}

        <ContactShadows
          position={[0, -5.5, 0]}
          opacity={0.9}
          scale={20}
          blur={2}
          far={8}
          resolution={1024}
          color="#000000"
        />

        {!isBackdrop && (
          <EffectComposer enableNormalPass={false} multisampling={8}>
            <Bloom luminanceThreshold={0.78} mipmapBlur intensity={0.7} radius={0.6} />
            <ChromaticAberration offset={aberration} />
            <Vignette eskil={false} offset={0.15} darkness={1.05} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
