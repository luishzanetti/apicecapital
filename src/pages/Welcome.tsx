import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Smart Strategies',
    description: 'Curated, risk-managed portfolios',
  },
  {
    icon: Zap,
    title: 'AI Automation',
    description: 'Set up once, earn passively',
  },
  {
    icon: Shield,
    title: 'You Stay in Control',
    description: 'Your funds remain on your exchange',
  },
];

export default function Welcome() {
  const navigate = useNavigate();

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
          Build your passive<br />
          <span className="text-gradient-primary">crypto income</span>
        </h1>

        <p className="text-muted-foreground text-body mb-12 max-w-sm">
          Intelligent automation. Transparent strategies. You're always in control.
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
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-center text-micro text-muted-foreground">
          No credit card required • Cancel anytime
        </p>
      </motion.div>
    </div>
  );
}
