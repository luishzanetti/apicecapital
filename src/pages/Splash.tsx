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
    }, 2800);

    return () => clearTimeout(timer);
  }, [navigate, hasCompletedOnboarding]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent" />
      
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-24 h-24 rounded-full border border-primary/10"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2.5, delay: 0.6, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-24 h-24 rounded-full border border-primary/10"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2.5, delay: 1.2, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-24 h-24 rounded-full border border-primary/10"
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        {/* Logo mark */}
        <motion.div 
          className="w-20 h-20 rounded-2xl apice-gradient-primary flex items-center justify-center shadow-lg"
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
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
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M20 12L30 32H10L20 12Z"
              fill="currentColor"
              opacity="0.25"
            />
          </svg>
        </motion.div>

        {/* Brand name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-4xl font-bold tracking-tight"
        >
          Apice
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-muted-foreground text-sm tracking-wide"
        >
          Crypto Portfolio Intelligence.
        </motion.p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-20 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        ))}
      </motion.div>
    </div>
  );
}
