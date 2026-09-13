"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, ContactShadows, Sparkles, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * Bảng màu ánh sáng, lấy theo họ tím của nền để cả khung hình về một tông.
 * Đèn chính gần trắng chứ không phải màu bão hoà: bề mặt bóng cần một nguồn
 * trung tính để ra điểm sáng sạch, màu để dành cho đèn viền.
 */
const KEY = "#fdfaff";      // trắng ám tím, đèn chính
const FILL = "#8f7ec4";     // tím khói, đèn bù phía đối diện
const RIM_LILAC = "#c9a8ff"; // tím sáng, viền chính
const RIM_PINK = "#ff007a";  // hồng thương hiệu, viền phụ

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
      color: new THREE.Color("#1a1a24"),
      metalness: 0.88,
      roughness: 0.24,
      envMapIntensity: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
      // Ngũ sắc để hết cỡ cộng với normal map của model sinh ra đám lốm đốm
      // cầu vồng trông như nhiễu. Hạ xuống vừa phải thì còn ánh chuyển sắc
      // mà bề mặt vẫn đọc ra là một khối liền.
      iridescence: 0.45,
      iridescenceIOR: 1.4,
      iridescenceThicknessRange: [220, 620],
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

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.elapsedTime;

    // Trôi nhẹ khi không ai đụng tới, cộng với hướng nhìn bám theo con trỏ.
    // Bám cả khi chưa rê vào model, nếu đợi hover mới phản hồi thì lúc chuột
    // đi ngang qua sẽ thấy nó giật một cái.
    const idle = Math.sin(t * 0.18) * 0.14;
    const aimY = idle + state.pointer.x * 0.40;
    const aimX = -state.pointer.y * 0.24;

    // damp giảm chấn theo delta nên tốc độ chuyển động không đổi giữa máy
    // 60fps và máy 144fps; lerp với hệ số cố định thì máy nhanh sẽ chạy nhanh hơn.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, aimY, 2.4, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, aimX, 2.4, delta);

    const targetScale = hovered ? baseScale * 1.05 : baseScale;
    const nextScale = THREE.MathUtils.damp(g.scale.x, targetScale, 3.5, delta);
    g.scale.setScalar(nextScale);
  });

  return (
    <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.14}>
      <group
        ref={groupRef}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        position={[0, -6, 0]}
        scale={baseScale}
      >
        <primitive object={scene} />
      </group>
    </Float>
  );
}

/**
 * Camera dịch nhẹ ngược chiều con trỏ. Đây là thứ tạo cảm giác chiều sâu
 * thật: chỉ xoay vật thể thì mắt vẫn đọc ra là một hình phẳng đang quay.
 */
function CameraParallax() {
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, state.pointer.x * 0.75, 1.8, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, state.pointer.y * 0.45, 1.8, delta);
    cam.lookAt(target);
  });

  return null;
}

/**
 * Giàn đèn viền quay rất chậm quanh nhân vật. Chỉ hai đèn màu để chuyển sắc
 * nhẹ trên bề mặt bóng; đèn chính nằm ngoài giàn này và đứng yên, nếu cho
 * nguồn sáng chính quay theo thì điểm sáng chạy loạn, mất vẻ tĩnh của studio.
 */
function RimRig() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.06;
  });

  return (
    <group ref={ref}>
      <pointLight position={[-7, 2, -5]} intensity={70} color={RIM_LILAC} distance={34} decay={2} />
      <pointLight position={[7, -1, -5]} intensity={40} color={RIM_PINK} distance={30} decay={2} />
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
        {!isBackdrop && <CameraParallax />}

        <ambientLight intensity={0.35} color="#9b8fc4" />

        {/* Đèn chính đứng yên, gần trắng, đánh chéo từ trên phải phía trước */}
        <spotLight
          position={[6, 7, 9]}
          angle={0.55}
          penumbra={0.85}
          intensity={9}
          castShadow={!isBackdrop}
          shadow-mapSize={[2048, 2048]}
          color={KEY}
        />

        {/* Đèn bù phía đối diện, yếu, để nửa khuất không rơi vào đen đặc */}
        <directionalLight position={[-8, 1, 4]} intensity={2.6} color={FILL} />

        {/* Đèn viền sau tách khối khỏi nền lavender vốn cũng sáng */}
        <directionalLight position={[0, 5, -10]} intensity={3.2} color={RIM_LILAC} />

        <RimRig />

        <Environment resolution={256}>
          {/* Không đặt background để thấy khối cầu nền phía sau Canvas */}

          {/* Tấm sáng lớn phía trên là nguồn phản chiếu chính của bề mặt bóng */}
          <Lightformer form="rect" intensity={4} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[14, 8, 1]} color={KEY} />
          <Lightformer form="rect" intensity={2.2} position={[-7, 1, -2]} rotation-y={Math.PI / 2} scale={[10, 8, 1]} color={RIM_LILAC} />
          <Lightformer form="rect" intensity={1.6} position={[7, 1, -2]} rotation-y={-Math.PI / 2} scale={[10, 8, 1]} color={RIM_PINK} />
          <Lightformer form="circle" intensity={5} position={[3, 4, 6]} scale={2.5} color={KEY} />
          <Lightformer form="rect" intensity={1} position={[0, -6, 2]} rotation-x={-Math.PI / 2} scale={[12, 6, 1]} color={FILL} />
        </Environment>

        <CharacterModel baseScale={isBackdrop ? 11 : 15} />

        {!isBackdrop && (
          <Sparkles count={60} scale={[14, 14, 14]} size={2} speed={0.22} opacity={0.28} color="#ffffff" />
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
