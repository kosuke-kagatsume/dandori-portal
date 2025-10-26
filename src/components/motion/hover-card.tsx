'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  tapScale?: number;
}

/**
 * ホバー・タップ時にスケールするカード
 */
export function HoverCard({
  children,
  className,
  hoverScale = 1.02,
  tapScale = 0.98,
}: HoverCardProps) {
  return (
    <motion.div
      className={cn('cursor-pointer', className)}
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ホバー時に上に浮き上がるカード
 */
export function LiftCard({ children, className }: HoverCardProps) {
  return (
    <motion.div
      className={cn('cursor-pointer', className)}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * グラデーション背景が動くカード
 */
export function GradientCard({ children, className }: HoverCardProps) {
  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0"
        variants={{
          rest: { opacity: 0, scale: 0.8 },
          hover: { opacity: 1, scale: 1 },
        }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </motion.div>
  );
}
