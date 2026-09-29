"use client";

import { useEffect, useState, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { EASINGS } from "@/lib/motion";

interface AnimatedFareProps {
  value: number;
  className?: string;
  prefix?: string;
}

/**
 * AnimatedFare component: animates fare digits with a smooth count-up/roll transition
 * (150ms-300ms depending on the size of the change) instead of a hard jump.
 * Falls back to instant update when prefers-reduced-motion is active.
 */
export function AnimatedFare({
  value,
  className = "",
  prefix = "₹",
}: AnimatedFareProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const prev = prevValueRef.current;
    if (prev === value) return;

    const diff = Math.abs(value - prev);
    // Duration between 150ms and 300ms based on magnitude of change
    const duration = Math.min(0.3, Math.max(0.15, (diff / 4000) * 0.3));

    const controls = animate(prev, value, {
      duration,
      ease: EASINGS.overshootFree,
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
      onComplete: () => {
        setDisplayValue(value);
        prevValueRef.current = value;
      },
    });

    return () => controls.stop();
  }, [value, shouldReduceMotion]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString("en-IN")}
    </span>
  );
}

export default AnimatedFare;
