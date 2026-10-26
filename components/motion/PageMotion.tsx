'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Route-level entrance. MotionConfig in Providers sets reducedMotion="user",
 * so this collapses to a simple fade when the OS requests less motion.
 */
export function PageMotion({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Small viewport reveal for independent cards and sections. Use sparingly so
 * long lists never feel slow or staggered into a queue.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 10,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px' }}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
