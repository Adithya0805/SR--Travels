"use client";

import { useReducedMotion, type Variants } from "framer-motion";

/**
 * Standard cubic-bezier easings for purposeful motion.
 */
export const EASINGS = {
  easeOut: [0, 0, 0.2, 1] as const,
  overshootFree: [0.16, 1, 0.3, 1] as const,
  standard: [0.4, 0, 0.2, 1] as const,
};

/**
 * Screen transition variants (Home -> Vehicles -> Review -> Done)
 * Slide in from right on forward, from left on back, 220ms ease-out.
 * Respects prefers-reduced-motion by fading only.
 */
export const getScreenVariants = (shouldReduceMotion: boolean | null): Variants => ({
  enter: (direction: number) => ({
    x: shouldReduceMotion ? 0 : direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: EASINGS.easeOut,
    },
  },
  exit: (direction: number) => ({
    x: shouldReduceMotion ? 0 : direction > 0 ? "-100%" : "100%",
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: EASINGS.easeOut,
    },
  }),
});

/**
 * Bottom sheet animation variants
 * TranslateY from 100% to 0, 250ms overshoot-free ease.
 */
export const getBottomSheetVariants = (shouldReduceMotion: boolean | null): Variants => ({
  hidden: {
    y: shouldReduceMotion ? 0 : "100%",
    opacity: shouldReduceMotion ? 0 : 1,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: EASINGS.overshootFree,
    },
  },
  exit: {
    y: shouldReduceMotion ? 0 : "100%",
    opacity: shouldReduceMotion ? 0 : 1,
    transition: {
      duration: 0.2,
      ease: EASINGS.easeOut,
    },
  },
});

/**
 * Backdrop fade variants (250ms alongside bottom sheet)
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: EASINGS.easeOut },
  },
};

/**
 * Staggered card fade + 8px slide-up variant (200ms)
 */
export const getCardVariants = (shouldReduceMotion: boolean | null, delay = 0): Variants => ({
  hidden: {
    opacity: 0,
    y: shouldReduceMotion ? 0 : 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      delay,
      ease: EASINGS.easeOut,
    },
  },
});

export { useReducedMotion };
