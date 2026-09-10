"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, ContactShadows, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

function CharacterModel() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  
  const { scene } = useGLTF("/model/base_basic_pbr.glb");

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
             // Chuyển chất liệu thành Đen nhám (Matte Black) phong cách Acid Graphics
             child.material.color = new THREE.Color('#111111');
             child.material.metalness = 0.2; 
             child.material.roughness = 0.8;
             child.material.envMapIntensity = 0.5;
          }
        }
      });
    }
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;

    const targetX = hovered ? (state.pointer.x * Math.PI) / 8 : 0;
    const targetY = hovered ? (state.pointer.y * Math.PI) / 8 : 0;
    
    groupRef.current.rotation.y += THREE.MathUtils.lerp(0, targetX, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY, 0.05);
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group 
        ref={groupRef}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        position={[0, -6, 0]} 
        scale={hovered ? 16 : 15}
      >
        <primitive object={scene} />
      </group>
    </Float>
  );
}

export default function ThreeDPosterWebGL() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-auto mix-blend-screen">
      {/* Kích hoạt dpr=[1,2] cho màn hình Retina, ACESFilmic để ánh sáng điện ảnh mượt mà */}
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 45 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, alpha: true }}>
        
        {/* Ánh sáng tổng thể nhẹ nhàng */}
        <ambientLight intensity={0.2} color="#ccff00" />
        
        {/* Đèn Key chính chiếu từ góc chéo: Xanh đọt chuối */}
        <spotLight position={[5, 10, 5]} angle={0.3} penumbra={0.5} intensity={10} castShadow shadow-mapSize={[2048, 2048]} color="#ccff00" />
        
        {/* Fill Light: Ánh sáng bù nhẹ màu xanh */}
        <directionalLight position={[-10, 0, 5]} intensity={5} color="#ccff00" /> 
        
        {/* Rim Light 1: Đánh viền phía sau cực mạnh (Backlight trắng) để tôn khối */}
        <directionalLight position={[0, 10, -10]} intensity={8} color="#ffffff" />
        
        {/* Rim Light 2: Xanh chuối ở dưới hắt lên */}
        <directionalLight position={[10, -5, -5]} intensity={5} color="#ccff00" />

        {/* Sử dụng HDRI Preset "city" để mô hình kim loại phản chiếu chân thực 360 độ */}
        <Environment preset="city" resolution={512}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={5} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
            <Lightformer form="rect" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={10} />
            <Lightformer form="rect" intensity={2} rotation-y={Math.PI / 2} position={[5, 1, -1]} scale={10} />
          </group>
        </Environment>

        <CharacterModel />

        {/* Bóng đổ tiếp xúc dứoi đáy độ phân giải cao */}
        <ContactShadows 
          position={[0, -5.5, 0]} 
          opacity={0.9} 
          scale={20} 
          blur={2} 
          far={8} 
          resolution={1024}
          color="#000000"
        />

        {/* POST-PROCESSING: Sắc nét tối đa (multisampling=8), Bỏ Depth of Field để tránh bị mờ viền */}
        <EffectComposer enableNormalPass={false} multisampling={8}>
          <Bloom luminanceThreshold={0.8} mipmapBlur intensity={0.8} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
