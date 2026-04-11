import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface ExplosiveScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'; // emerald-500
  if (score >= 60) return '#3b82f6'; // blue-500
  if (score >= 40) return '#f59e0b'; // amber-500
  return '#ef4444';                   // red-500
}

export function ExplosiveScoreRing({ score, size = 28, strokeWidth = 3, className = '' }: ExplosiveScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half circle
  const progress = useMotionValue(0);
  const dashOffset = useTransform(progress, [0, 100], [circumference, 0]);
  const color = getScoreColor(score);

  useEffect(() => {
    const controls = animate(progress, score, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [score, progress]);

  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.55}`}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.path
          d={`M ${strokeWidth / 2} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.55}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <span
        className="text-[9px] font-bold leading-none -mt-0.5"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}
