'use client'

import { useMemo, useRef, useSyncExternalStore } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { hasWebGL, subscribeNever } from '@/lib/webgl'

/**
 * Khối cầu vân chất lỏng chuyển động chậm, kiểu hình nền điện thoại.
 *
 * Hoa văn sinh hoàn toàn bằng shader chứ không dùng ảnh: nhiễu fBm được bẻ
 * miền hai lần để ra vân xoáy kiểu đá hoa, rồi đẩy biến thời gian vào cho
 * nó cuộn liên tục. Nhờ vậy không tốn một byte texture nào và không đụng
 * tới bản quyền ảnh nền của hãng khác.
 */

const vertexShader = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vPos = position;
    vNormalW = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uLight;
  uniform vec3 uGlow;

  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  vec3 hash3(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  // Nhiễu gradient 3 chiều
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
            dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
        mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
            dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(
        mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
            dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
        mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
            dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * noise(p);
      p *= 2.02;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    float t = uTime * 0.06;
    vec3 p = vPos * 1.9;

    // Bẻ miền hai lượt: đây là thứ tạo ra vân xoáy kiểu đá hoa,
    // fbm trơn một lượt chỉ ra mây mờ chứ không ra vân.
    vec3 q = vec3(
      fbm(p + vec3(0.0, 0.0, t)),
      fbm(p + vec3(5.2, 1.3, t)),
      fbm(p + vec3(2.7, 8.3, t * 0.7))
    );

    vec3 r = vec3(
      fbm(p + 3.2 * q + vec3(1.7, 9.2, t * 1.1)),
      fbm(p + 3.2 * q + vec3(8.3, 2.8, t * 0.9)),
      fbm(p + 3.2 * q + vec3(4.1, 6.4, t))
    );

    float f = fbm(p + 3.6 * r);
    f = clamp(f * 1.5 + 0.5, 0.0, 1.0);

    // Dải màu: sâu -> tím -> sáng
    vec3 col = mix(uDeep, uMid, smoothstep(0.18, 0.66, f));
    col = mix(col, uLight, smoothstep(0.70, 0.97, f));

    // Gân sáng mảnh chạy dọc các đường vân
    float vein = smoothstep(0.72, 0.99, length(r));
    col += uLight * vein * 0.22;

    // Viền sáng quanh mép cầu
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0), 2.6);
    col += uGlow * fresnel * 0.55;

    // Nửa khuất tối dần cho ra khối
    float shade = smoothstep(-0.55, 0.85, dot(normalize(vNormalW), normalize(vec3(0.75, 0.35, 0.6))));
    col *= mix(0.04, 1.0, shade);

    gl_FragColor = vec4(col, 1.0);
  }
`

function Sphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Giá trị khởi tạo; về sau chỉ sửa qua materialRef trong vòng lặp khung hình
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#0a0b24') },
      uMid: { value: new THREE.Color('#3a2b80') },
      uLight: { value: new THREE.Color('#c9b6ff') },
      uGlow: { value: new THREE.Color('#a78bfa') },
    }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (materialRef.current) materialRef.current.uniforms.uTime.value = t
    if (meshRef.current) meshRef.current.rotation.y = t * 0.025
  })

  return (
    <mesh ref={meshRef} position={[-1.15, 0.15, 0]}>
      <sphereGeometry args={[2.05, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export default function LiquidSphere({ className = '' }: { className?: string }) {
  // Máy chủ luôn coi như không có WebGL để hai bên dựng ra cùng một thứ;
  // không dựng được thì bỏ qua, nền tối phía sau vẫn ổn.
  const webgl = useSyncExternalStore(subscribeNever, hasWebGL, () => false)
  if (!webgl) return null

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <Canvas dpr={[1, 1.25]} camera={{ position: [0, 0, 3.1], fov: 50 }} gl={{ antialias: true }}>
        <Sphere />
      </Canvas>
    </div>
  )
}
