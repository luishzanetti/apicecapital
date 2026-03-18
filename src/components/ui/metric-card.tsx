import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label?: string };
  delay?: number;
  className?: string;
}

export function MetricCard({
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  delay = 0,
  className,
}: MetricCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <motion.div
      className={cn(
        "glass-card rounded-2xl p-4 flex flex-col gap-2",
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between">
        <span className="text-micro text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={cn("w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center", iconColor)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <AnimatedCounter
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        className="text-headline font-bold"
      />
      {trend && (
        <span
          className={cn(
            "text-micro font-medium",
            isPositive ? "text-apice-success" : "text-destructive"
          )}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
          {trend.label && (
            <span className="text-muted-foreground font-normal">{trend.label}</span>
          )}
        </span>
      )}
    </motion.div>
  );
}
