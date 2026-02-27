import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';

export default function Splash() {
  const navigate = useNavigate();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasCompletedOnboarding) {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate, hasCompletedOnboarding]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(var(--primary) / 0.12), transparent 70%)',
      }} />

      {/* Animated orb — blue */}
      <motion.div
        className="absolute w-72 h-72 rounded-full pointer-events-none animate-orb-drift"
        style={{
          top: '15%', left: '5%',
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Animated orb — purple */}
      <motion.div
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{
          bottom: '15%', right: '0%',
          background: 'radial-gradient(circle, hsl(250 84% 60% / 0.12), transparent 70%)',
          filter: 'blur(40px)',
          animationDelay: '2s',
        }}
        animate={{
          x: [0, -15, 8, 0],
          y: [0, 12, -8, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pulse rings behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 0.6, 1.2].map((delay, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-20 h-20 rounded-full"
            style={{ border: '1px solid hsl(var(--primary) / 0.18)' }}
          />
        ))}
      </div>

      {/* Logo + Brand */}
      <motion.div
        initial={{ scale: 0.75, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-7"
      >
        {/* Logo mark */}
        <motion.div
          className="w-20 h-20 rounded-[24px] apice-gradient-primary flex items-center justify-center glow-primary"
          initial={{ rotate: -15, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg width="42" height="42" viewBox="0 0 40 40" fill="none" className="text-white">
            <path
              d="M20 4L36 34H4L20 4Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M20 13L30 32H10L20 13Z"
              fill="currentColor"
              opacity="0.28"
            />
          </svg>
        </motion.div>

        {/* Brand */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl font-bold tracking-tight"
          >
            Apice
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="text-muted-foreground text-sm tracking-[0.12em] font-medium uppercase"
          >
            Capital
          </motion.p>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="text-muted-foreground/70 text-xs tracking-wide text-center"
        >
          Crypto Portfolio Intelligence
        </motion.p>
      </motion.div>

      {/* Loading indicator — capsule progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="absolute bottom-16 flex flex-col items-center gap-3"
      >
        <div className="w-32 h-0.5 rounded-full bg-border/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full apice-gradient-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.2, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em]">Loading</p>
      </motion.div>
    </div>
  );
}
