"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface ParallaxElementProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: "horizontal" | "vertical" | "both";
}

export const ParallaxElement = ({
  children,
  className = "",
  speed = 0.5,
  direction = "both",
}: ParallaxElementProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, {
    stiffness: 150,
    damping: 15,
  });
  const mouseYSpring = useSpring(y, {
    stiffness: 150,
    damping: 15,
  });

  const translateX = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    direction === "horizontal" || direction === "both"
      ? [`${-speed * 50}px`, `${speed * 50}px`]
      : ["0px", "0px"]
  );
  const translateY = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    direction === "vertical" || direction === "both"
      ? [`${-speed * 50}px`, `${speed * 50}px`]
      : ["0px", "0px"]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      const maxDistance = Math.max(window.innerWidth, window.innerHeight);
      const normalizedX = distanceX / maxDistance;
      const normalizedY = distanceY / maxDistance;

      x.set(normalizedX);
      y.set(normalizedY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{
        x: translateX,
        y: translateY,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};






