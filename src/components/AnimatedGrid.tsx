"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedGridProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

/**
 * Animación al montar (no whileInView).
 * whileInView + opacity:0 deja el listado invisible en Instagram/WebViews de iOS
 * cuando IntersectionObserver falla — la clienta ve "página en blanco".
 */
const AnimatedGrid = ({
  children,
  className = "",
  staggerDelay = 0.1,
}: AnimatedGridProps) => {
  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      y: 12,
      opacity: 1,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants}>{children}</motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedGrid;
