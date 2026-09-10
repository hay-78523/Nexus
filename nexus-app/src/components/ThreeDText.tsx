"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function ThreeDText() {
  const ref = useRef<HTMLDivElement>(null);

  // Theo dõi vị trí chuột
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Làm mượt chuyển động với lò xo (spring)
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  // Map vị trí chuột thành góc xoay 3D (Tối đa 15 độ)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    
    // Tính toán tọa độ chuột tương đối so với phần tử (giá trị từ -0.5 đến 0.5)
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    // Trả về vị trí cân bằng khi chuột rời khỏi
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
      className="relative z-10 text-center px-4 max-w-5xl mt-20 cursor-crosshair"
    >
      <motion.h1 
        style={{ transform: "translateZ(50px)" }}
        className="text-5xl md:text-7xl lg:text-[100px] font-black uppercase leading-[0.85] tracking-tighter mix-blend-difference text-white drop-shadow-2xl"
      >
        <span className="block text-[#ccff00]">DISCONNECTED</span>
        <span className="block">THE INTERNET</span>
      </motion.h1>
      
      <motion.p 
        style={{ transform: "translateZ(30px)" }}
        className="mt-8 text-lg md:text-2xl font-light max-w-2xl mx-auto text-white/80"
      >
        We create 3D visual storytelling and interactive AI batch generation experiences that help creators stand out.
      </motion.p>
    </motion.div>
  );
}
