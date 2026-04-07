import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function Welcome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: t('welcome.feature1Title'),
      description: t('welcome.feature1Desc'),
    },
    {
      icon: Zap,
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
    <div className="min-h-screen bg-background flex flex-col px-6 py-12 safe-top">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col"
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
          {t('welcome.heroLine1')}<br />
          <span className="text-gradient-primary">{t('welcome.heroLine2')}</span>
        </h1>

        <p className="text-muted-foreground text-body mb-12 max-w-sm">
          {t('welcome.heroSubtitle')}
        </p>

        {/* Features */}
        <div className="space-y-4 mb-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-0.5">{feature.title}</h3>
                <p className="text-muted-foreground text-caption">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="space-y-4"
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

        <p className="text-center text-micro text-muted-foreground">
          {t('welcome.ctaDisclaimer')}
        </p>
      </motion.div>
    </div>
  );
}
