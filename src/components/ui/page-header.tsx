import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, badge, className, children }: PageHeaderProps) {
  return (
    <motion.div
      className={cn("space-y-1.5", className)}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {badge && (
        <motion.span
          className="inline-block text-micro font-semibold uppercase tracking-widest text-primary mb-1"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {badge}
        </motion.span>
      )}
      <h1 className="text-display text-foreground">{title}</h1>
      {subtitle && (
        <p className="text-caption text-muted-foreground max-w-xs">{subtitle}</p>
      )}
      {children}
    </motion.div>
  );
}
