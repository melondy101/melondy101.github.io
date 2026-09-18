"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface MotionSectionProps {
  id?: string;
  className?: string;
  delay?: number;
  children: ReactNode;
}

export function MotionSection({ id, className, delay = 0, children }: MotionSectionProps) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
        delay
      }}
    >
      {children}
    </motion.section>
  );
}

export function FadeInBlock({
  id,
  className,
  delay = 0,
  children
}: {
  id?: string;
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
        delay
      }}
    >
      {children}
    </motion.div>
  );
}
