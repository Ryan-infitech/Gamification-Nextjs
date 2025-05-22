"use client";

import React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";

// Export AnimatePresence directly
export { AnimatePresence };

// Animation variants for staggered animations
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Animated components
export function AnimatedDiv(
  props: HTMLMotionProps<"div"> & { children: React.ReactNode }
) {
  return <motion.div {...props}>{props.children}</motion.div>;
}

export function AnimatedSection(
  props: HTMLMotionProps<"section"> & { children: React.ReactNode }
) {
  return <motion.section {...props}>{props.children}</motion.section>;
}
