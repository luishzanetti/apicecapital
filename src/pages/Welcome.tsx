import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Brain, Shield, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function Welcome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: t('welcome.feature1Title'),
      description: t('welcome.feature1Desc'),
    },
    {
      icon: Brain,
      title: t('welcome.feature2Title'),
      description: t('welcome.feature2Desc'),
    },
    {
      icon: Shield,
      title: t('welcome.feature3Title'),
      description: t('welcome.feature3Desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12 safe-top relative overflow-hidden">
      {/* Background gradient orb */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -5%, hsl(var(--primary) / 0.10), transparent 70%)',
        }}
      />

      {/* Subtle animated orb */}
      <motion.div
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{
          top: '8%',
          right: '-10%',
          background:
            'radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{ x: [0, -12, 6, 0], y: [0, 10, -6, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 40 40"
              fill="none"
              className="text-white"
            >
              <path
                d="M20 4L36 34H4L20 4Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <span className="font-semibold text-lg">Apice</span>
        </div>

        {/* Hero text */}
        <h1 className="text-display mb-4">
          {t('welcome.heroLine1')}
          <br />
          <span className="text-gradient-primary">
            {t('welcome.heroLine2')}
          </span>
        </h1>

        <p className="text-muted-foreground text-body mb-8 max-w-sm">
          {t('welcome.heroSubtitle')}
        </p>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center gap-2.5 mb-10"
        >
          <div className="flex -space-x-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-medium"
                style={{
                  background: [
                    'hsl(var(--primary) / 0.25)',
                    'hsl(250 84% 60% / 0.25)',
                    'hsl(160 84% 40% / 0.25)',
                    'hsl(var(--primary) / 0.15)',
                  ][i],
                  color: [
                    'hsl(var(--primary))',
                    'hsl(250 84% 70%)',
                    'hsl(160 84% 55%)',
                    'hsl(var(--primary) / 0.8)',
                  ][i],
                }}
              >
                {['A', 'K', 'M', '+'][i]}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary/60" />
            <span className="text-xs text-muted-foreground">
              {t('welcome.socialProof')}
            </span>
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-4 mb-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl glass-light flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-0.5">{feature.title}</h3>
                <p className="text-muted-foreground text-caption">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="space-y-3 relative z-10"
      >
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={() => navigate('/quiz')}
        >
          {t('welcome.cta')}
          <ArrowRight className="w-4 h-4" />
        </Button>

        <button
          onClick={() => navigate('/auth')}
          className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('welcome.signIn')}
        </button>

        <p className="text-center text-micro text-muted-foreground/60">
          {t('welcome.ctaDisclaimer')}
        </p>
      </motion.div>
    </div>
  );
}
