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
        navigate('/welcome', { replace: true });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate, hasCompletedOnboarding]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 apice-gradient-primary opacity-5" />
      
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-32 h-32 rounded-full border border-primary/20"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-32 h-32 rounded-full border border-primary/20"
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        {/* Logo mark */}
        <div className="w-20 h-20 rounded-3xl apice-gradient-primary flex items-center justify-center shadow-lg apice-shadow-soft">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            className="text-white"
          >
            <path
              d="M20 4L36 34H4L20 4Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M20 14L28 30H12L20 14Z"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Brand name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-display tracking-tight"
        >
          Apice
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-muted-foreground text-caption"
        >
          Your passive crypto intelligence
        </motion.p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-16 flex gap-1"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        ))}
      </motion.div>
    </div>
  );
}
