import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore, investorTypeDescriptions, recommendedPath } from '@/store/appStore';
import { ArrowRight, Check, Shield, Target, Zap, ExternalLink, Wallet, PieChart } from 'lucide-react';

export default function ProfileResult() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const setupProgress = useAppStore((s) => s.setupProgress);

  const description = investorType ? investorTypeDescriptions[investorType] : null;
  const recommended = investorType ? recommendedPath[investorType] : 'balanced';

  const setupSteps = [
    { 
      id: 'exchange',
      label: 'Create Exchange Account', 
      sublabel: 'Via Bybit referral link',
      done: setupProgress.exchangeAccountCreated,
      icon: ExternalLink,
    },
    { 
      id: 'portfolio',
      label: 'Choose Core Portfolio', 
      sublabel: 'One-tap selection',
      done: setupProgress.corePortfolioSelected,
      icon: PieChart,
    },
    { 
      id: 'dca',
      label: 'Activate DCA Plan', 
      sublabel: 'Simple schedule setup',
      done: setupProgress.dcaPlanConfigured,
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-background px-6 py-8 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl apice-gradient-primary flex items-center justify-center shadow-lg"
          >
            <Target className="w-10 h-10 text-white" />
          </motion.div>
          
          <Badge variant="default" className="mb-3">Your Investor Profile</Badge>
          
          <h1 className="text-2xl font-bold mb-2">{investorType}</h1>
          <p className="text-muted-foreground text-sm">
            Based on your answers, here's your personalized path
          </p>
        </div>

        {/* Profile Card */}
        {description && (
          <Card className="bg-card border-border">
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-apice-success/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-apice-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">What you want</p>
                  <p className="text-sm">{description.wants}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">What to avoid</p>
                  <p className="text-sm">{description.avoids}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your first step</p>
                  <p className="text-sm">{description.firstStep}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommended Setup Path */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Recommended Setup Path
              </h3>
              <Badge variant="recommended" size="sm">3 Steps</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-5">
              Complete these to activate your {recommended} strategy
            </p>

            {/* Setup Checklist */}
            <div className="space-y-3">
              {setupSteps.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    step.done 
                      ? 'bg-apice-success text-white' 
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {step.done ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-semibold">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.done ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.sublabel}</p>
                  </div>
                  <step.icon className="w-4 h-4 text-muted-foreground/50" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust Message */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your funds remain under your control at all times. You can stop or adjust settings whenever you want.
          </p>
        </div>

        {/* CTA */}
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={() => navigate('/home')}
        >
          Start Your Setup
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}
