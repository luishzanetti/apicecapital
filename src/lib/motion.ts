export const spring = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 };
export const springSnappy = { type: 'spring' as const, stiffness: 500, damping: 35 };
export const springGentle = { type: 'spring' as const, stiffness: 200, damping: 25 };

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, ...spring },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: spring },
};
