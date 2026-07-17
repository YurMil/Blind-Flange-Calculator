/** Shared Framer Motion timings that respect prefers-reduced-motion. */
export const panelMotion = (reduceMotion: boolean | null) =>
  reduceMotion
    ? {initial: false as const, animate: {opacity: 1, y: 0}, exit: {opacity: 1, y: 0}, transition: {duration: 0}}
    : {
        initial: {opacity: 0, y: 12},
        animate: {opacity: 1, y: 0},
        exit: {opacity: 0, y: -8},
        transition: {duration: 0.3},
      };
