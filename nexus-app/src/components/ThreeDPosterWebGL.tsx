"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, ContactShadows, Sparkles, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/** Bảng màu ánh sáng: xanh chanh thương hiệu, cộng hai màu viền đối nghịch. */
const KEY = "#ccff00";
const RIM_WARM = "#ff2d9b";
const RIM_COOL = "#00d4ff";

/**
 * Đổi chất liệu gốc sang MeshPhysicalMaterial để có lớp phủ bóng và hiệu
 * ứng ngũ sắc — bề mặt tối bóng bắt màu đèn tốt hơn nhiều so với chất
 * liệu nhám ban đầu. Giữ lại các map sẵn có của model.
 */
function upgradeMaterials(scene: THREE.Object3D) {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.castShadow = true;
    child.receiveShadow = true;

    // useGLTF dùng chung một scene cho mọi nơi gọi, tránh đổi chất liệu hai lần
    if (child.userData.nxUpgraded) return;
    child.userData.nxUpgraded = true;

    const old = child.material as THREE.MeshStandardMaterial;

    const next = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0a0a0c"),
      metalness: 0.78,
      roughness: 0.28,
      envMapIntensity: 1.35,
      clearcoat: 1,
      clearcoatRoughness: 0.22,
      iridescence: 0.32,
      iridescenceIOR: 1.28,
      iridescenceThicknessRange: [180, 520],
    });

    // Giữ lại chi tiết bề mặt của model gốc
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

    // Đung đưa trong khoảng hẹp quanh chính diện thay vì quay trọn vòng,
    // để khách vào trang lúc nào cũng thấy khuôn mặt.
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

/** Giàn đèn màu quay chậm quanh nhân vật, tạo chuyển sắc trên bề mặt bóng. */
function LightRig() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.07;
    ref.current.children.forEach((child, i) => {
      const light = child as THREE.PointLight;
      if (light.isPointLight) {
        // Nhịp sáng lệch pha giữa các đèn cho màu chuyển liên tục
        light.intensity = light.userData.nxBase + Math.sin(t * 0.9 + i * 2.1) * 12;
      }
    });
  });

  return (
    <group ref={ref}>
      <pointLight position={[4, 2.5, 9]} intensity={110} color={KEY} distance={40} decay={2} userData={{ nxBase: 110 }} />
      <pointLight position={[-8, 2, -4]} intensity={26} color={RIM_WARM} distance={28} decay={2} userData={{ nxBase: 26 }} />
      <pointLight position={[8, -2, -4]} intensity={30} color={RIM_COOL} distance={28} decay={2} userData={{ nxBase: 30 }} />
    </group>
  );
}

type Variant = "stage" | "backdrop";

export default function ThreeDPosterWebGL({
  variant = "stage",
  className = "",
}: {
  /** 'stage': nhân vật chính ở landing. 'backdrop': lớp nền mờ, không bắt chuột. */
  variant?: Variant;
  className?: string;
} = {}) {
  const isBackdrop = variant === "backdrop";

  // Tạo một lần, tránh dựng lại vector mỗi khung hình
  const aberration = useMemo(() => new THREE.Vector2(0.0004, 0.0005), []);

  return (
    <div
      className={`absolute inset-0 z-0 flex items-center justify-center mix-blend-screen ${
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
        {/* Nền tối, chỉ đủ để bề mặt không đen tuyệt đối */}
        <ambientLight intensity={0.25} color="#8899aa" />

        {/* Đèn chính chiếu chéo, màu thương hiệu */}
        <spotLight
          position={[5, 6, 9]}
          angle={0.5}
          penumbra={0.6}
          intensity={7}
          castShadow={!isBackdrop}
          shadow-mapSize={[2048, 2048]}
          color={KEY}
        />

        {/* Đèn viền sau đánh tách khối khỏi nền */}
        <directionalLight position={[0, 6, -9]} intensity={2.2} color="#ffffff" />

        <LightRig />

        {/*
          Môi trường phản chiếu tự dựng bằng Lightformer thay vì nạp ảnh HDRI.
          Bề mặt kim loại chủ yếu phản chiếu môi trường, nên HDRI ngoài kéo
          màu về xám xanh và nuốt mất màu thương hiệu. Tự dựng thì kiểm soát
          được đúng ba màu, lại bỏ được 1.5MB tải về.
        */}
        <Environment resolution={256}>
          <color attach="background" args={["#050506"]} />

          {/* Tấm sáng lớn phía trên: nguồn phản chiếu chính, màu thương hiệu */}
          <Lightformer form="rect" intensity={5} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[14, 8, 1]} color={KEY} />

          {/* Hai tấm hai bên đánh viền màu đối nghịch */}
          <Lightformer form="rect" intensity={3.5} position={[-7, 1, -2]} rotation-y={Math.PI / 2} scale={[10, 8, 1]} color={RIM_WARM} />
          <Lightformer form="rect" intensity={3.5} position={[7, 1, -2]} rotation-y={-Math.PI / 2} scale={[10, 8, 1]} color={RIM_COOL} />

          {/* Đốm trắng nhỏ tạo điểm sáng sắc nét trên bề mặt bóng */}
          <Lightformer form="circle" intensity={6} position={[3, 4, 6]} scale={2.5} color="#ffffff" />

          {/* Tấm mờ phía dưới hắt nhẹ lên, tránh phần chân tối đặc */}
          <Lightformer form="rect" intensity={1.2} position={[0, -6, 2]} rotation-x={-Math.PI / 2} scale={[12, 6, 1]} color={KEY} />
        </Environment>

        <CharacterModel baseScale={isBackdrop ? 11 : 15} />

        {/* Bụi sáng lơ lửng, chỉ ở cảnh chính */}
        {!isBackdrop && (
          <Sparkles count={50} scale={[14, 12, 10]} size={2} speed={0.25} opacity={0.32} color={KEY} />
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

        {/* Nền bỏ hậu kỳ để đỡ tốn GPU, chỉ landing mới cần */}
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
