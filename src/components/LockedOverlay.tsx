import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockedOverlayProps {
  isLocked: boolean;
  message?: string;
  onUnlock?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function LockedOverlay({
  isLocked,
  message = 'Upgrade to unlock',
  onUnlock,
  className,
  children,
}: LockedOverlayProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      <div className="opacity-40 blur-[2px] pointer-events-none select-none">
        {children}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">{message}</p>
          {onUnlock && (
            <button
              onClick={onUnlock}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Upgrade now
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
