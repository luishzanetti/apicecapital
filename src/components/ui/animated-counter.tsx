import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  /** Prefix like "$" */
  prefix?: string;
  /** Suffix like "%" */
  suffix?: string;
  /** Decimal places */
  decimals?: number;
  /** Duration in seconds */
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.2,
  className,
}: AnimatedCounterProps) {
  const springValue = useSpring(0, {
    stiffness: 60,
    damping: 20,
    duration: duration * 1000,
  });

  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(
        latest.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
    });
    return unsubscribe;
  }, [springValue, decimals]);

  return (
    <motion.span
      className={cn("tabular-nums", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
}
