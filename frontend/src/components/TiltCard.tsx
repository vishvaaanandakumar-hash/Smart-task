import { ReactNode } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

/**
 * Wraps any card content with a subtle pointer-tracked 3D tilt + gloss highlight.
 * Pure CSS/framer-motion perspective transform — no WebGL needed for this scale of effect.
 */
export default function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 220, damping: 20 });
  const glossX = useTransform(mx, [0, 1], ["0%", "100%"]);
  const glossY = useTransform(my, [0, 1], ["0%", "100%"]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }
  function onLeave() { mx.set(0.5); my.set(0.5); }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 800 }}
      className={`card relative overflow-hidden ${className}`}
    >
      <motion.div
        aria-hidden
        style={{
          background: `radial-gradient(220px circle at ${glossX} ${glossY}, rgb(var(--ink) / .06), transparent 60%)`,
        }}
        className="pointer-events-none absolute inset-0"
      />
      <div style={{ transform: "translateZ(24px)" }}>{children}</div>
    </motion.div>
  );
}
