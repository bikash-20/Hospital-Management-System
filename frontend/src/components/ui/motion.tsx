import { type ReactNode } from 'react';
import {
  motion,
  type Variants,
  type HTMLMotionProps,
} from 'framer-motion';

// ===== Respects prefers-reduced-motion =====
function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ===== Animation Variants =====
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// ===== Shared Transition Configs =====
export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 24,
};

export const smoothTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

// ===== Component Wrappers =====

interface MotionDivProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
}

/** Fade in from transparent */
export function FadeIn({ children, delay = 0, ...props }: MotionDivProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : fadeIn}
      initial={reduced ? undefined : 'hidden'}
      animate="visible"
      transition={{ ...smoothTransition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Fade in + slide up from below */
export function FadeInUp({ children, delay = 0, ...props }: MotionDivProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : fadeInUp}
      initial={reduced ? undefined : 'hidden'}
      animate="visible"
      transition={{ ...springTransition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Scale in from smaller */
export function FadeInScale({ children, delay = 0, ...props }: MotionDivProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : fadeInScale}
      initial={reduced ? undefined : 'hidden'}
      animate="visible"
      transition={{ ...springTransition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Staggered list container — children animate in sequence */
export function StaggerContainer({ children, ...props }: MotionDivProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : staggerContainer}
      initial={reduced ? undefined : 'hidden'}
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Staggered list item — use as direct child of StaggerContainer */
export function StaggerItem({ children, ...props }: MotionDivProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : staggerItem}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Page transition wrapper with AnimatePresence */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      {children}
    </motion.div>
  );
}

/** Interactive card with hover lift + tap press */
export function InteractiveCard({
  children,
  className = '',
  ...props
}: MotionDivProps & { className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Pressable button with scale feedback */
export function Pressable({
  children,
  className = '',
  ...props
}: HTMLMotionProps<'button'> & { className?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Number counter animation */
export function AnimatedNumber({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      transition={springTransition}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}
