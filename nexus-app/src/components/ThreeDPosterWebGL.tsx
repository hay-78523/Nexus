"use client";
import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, ContactShadows, Sparkles, useGLTF, Center } from "@react-three/drei";
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

    const upgradeSingleMaterial = (old: any) => {
      const next = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#e8e6e1"), // Màu trắng ngà thạch cao
        metalness: 0.05,                   // Không mang tính kim loại
        roughness: 0.9,                    // Nhám mờ, không bóng bẩy
        envMapIntensity: 0.4,              // Bắt sáng môi trường vừa phải
        clearcoat: 0,                      // Loại bỏ lớp phủ bóng
      });

      if (old) {
        next.normalMap = old.normalMap ?? null;
        // Bỏ qua roughness map và metalness map cũ để giữ độ nhám tuyệt đối của thạch cao
        next.aoMap = old.aoMap ?? null;
        if (typeof old.dispose === 'function') old.dispose();
      }
      return next;
    };

    if (Array.isArray(child.material)) {
      child.material = child.material.map(upgradeSingleMaterial);
    } else {
      child.material = upgradeSingleMaterial(child.material);
    }
  });
}

function CharacterModel({ baseScale }: { baseScale: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const mouseRotRef = useRef({ x: 0, y: 0 });
  const [hovered, setHover] = useState(false);

  const { scene } = useGLTF("/model/fractured.glb");

  useEffect(() => {
    if (scene) upgradeMaterials(scene);
  }, [scene]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.elapsedTime;
    
    // Xoay 360 độ liên tục đều đặn theo thời gian
    const autoRotate = t * 0.35;
    
    // Tính toán độ nghiêng dựa trên vị trí chuột (tương tác chuột)
    // Tăng tốc độ nội suy (damp) lên 5.0 để phản hồi chuột nhanh nhạy và mượt mà nhất
    mouseRotRef.current.x = THREE.MathUtils.damp(mouseRotRef.current.x, state.pointer.x * 1.5, 5.0, delta);
    mouseRotRef.current.y = THREE.MathUtils.damp(mouseRotRef.current.y, -state.pointer.y * 0.5, 5.0, delta);

    // Cộng thẳng góc xoay gốc và offset chuột, loại bỏ hoàn toàn hiện tượng giật lag
    g.rotation.y = autoRotate + mouseRotRef.current.x;
    g.rotation.x = mouseRotRef.current.y;

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
        scale={baseScale}
        position={[0, -3.5, 0]} // Căn đầu vào giữa khung hình, đế chìm hoàn toàn
      >
        <Center>
          <primitive object={scene} />
        </Center>
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

        <CharacterModel baseScale={isBackdrop ? 7.5 : 8.5} />

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
            <Bloom luminanceThreshold={0.8} mipmapBlur intensity={0.3} radius={0.2} />
            <Vignette eskil={false} offset={0.15} darkness={1.05} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
