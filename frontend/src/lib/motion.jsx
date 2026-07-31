// Framer-motion variants + reusable animated wrappers.
// Re-triggers on both scroll down AND up (viewport once: false).
import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 },
  }),
};

export const featureFadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

/**
 * StaggerList - reveals children with a stagger.
 * Re-triggers on both scroll directions (viewport once: false).
 * gap: seconds between children (default 0.05).
 */
export const StaggerList = ({ children, gap = 0.05, className = "", testId, tag: Tag = "div", immediate = false }) => {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: gap, delayChildren: 0.05 } },
    exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
  };
  const scrollProps = immediate
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: false, amount: "some" } };
  return (
    <motion.div
      data-testid={testId}
      variants={container}
      initial="hidden"
      {...scrollProps}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = "", i = 0, variants = fadeUp, ...rest }) => (
  <motion.div variants={variants} custom={i} className={className} {...rest}>
    {children}
  </motion.div>
);

/**
 * StaggerItemHoverable - stagger reveal + whileHover lift (2px up, greener border).
 * Use this in feature grids so Framer Motion owns the transform and CSS hover can't lose the fight.
 */
export const StaggerItemHoverable = ({ children, className = "", i = 0, variants = fadeUp, ...rest }) => (
  <motion.div
    variants={variants}
    custom={i}
    className={className}
    whileHover={{ y: -2, borderColor: "rgba(144,238,144,0.30)" }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: "tween", duration: 0.2 }}
    {...rest}
  >
    {children}
  </motion.div>
);

/**
 * RevealImage - image scales from 105% -> 100% + fades in as it enters viewport.
 * Re-triggers each time it enters the viewport (scroll up too).
 */
export const RevealImage = ({ src, alt, className = "", imgClassName = "", testId }) => {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      data-testid={testId}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: "some" }}
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.6 } },
      }}
    >
      <motion.img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${imgClassName}`}
        variants={{
          hidden: { scale: 1.05 },
          show: { scale: 1, transition: { duration: prefersReduced ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] } },
        }}
      />
    </motion.div>
  );
};

/**
 * PageTransition - wraps a route to fade out old + slide in new page from the right.
 */
export const PageTransition = ({ children, routeKey }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export { motion, AnimatePresence };
