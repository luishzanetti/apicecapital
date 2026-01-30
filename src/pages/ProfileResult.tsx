import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore, investorTypeTraits, recommendedStrategy } from '@/store/appStore';
import { ArrowRight, Check, Shield, Target, Zap } from 'lucide-react';

export default function ProfileResult() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const userProfile = useAppStore((s) => s.userProfile);

  const traits = investorType ? investorTypeTraits[investorType] : [];
  const recommended = investorType ? recommendedStrategy[investorType] : 'balanced';

  const setupSteps = [
    { label: 'Connect exchange', done: false },
    { label: 'Security setup', done: false },
    { label: 'Activate strategy', done: false },
    { label: 'Go live', done: false },
  ];

  return (
    <div className="min-h-screen bg-background px-6 py-8 safe-top">
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
            className="w-20 h-20 mx-auto mb-6 rounded-full apice-gradient-primary flex items-center justify-center shadow-lg"
          >
            <Target className="w-10 h-10 text-white" />
          </motion.div>
          
          <Badge variant="default" className="mb-3">Your Profile</Badge>
          
          <h1 className="text-title mb-2">{investorType}</h1>
          <p className="text-muted-foreground text-caption">
            Based on your answers, we've created your personalized path
          </p>
        </div>

        {/* Traits */}
        <Card variant="elevated">
          <CardContent className="pt-5">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Your Investor Traits
            </h3>
            <div className="space-y-3">
              {traits.map((trait, i) => (
                <motion.div
                  key={trait}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-caption text-foreground">{trait}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Path */}
        <Card variant="premium">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Recommended Path
              </h3>
              <Badge variant="recommended" size="sm">Best Match</Badge>
            </div>
            
            <p className="text-caption text-muted-foreground mb-5">
              Based on your {userProfile.riskTolerance || 'medium'} risk tolerance and{' '}
              {userProfile.goal || 'balanced'} goal
            </p>

            <div className="p-4 rounded-xl bg-secondary/50 mb-5">
              <p className="font-medium capitalize mb-1">
                {recommended} Strategy
              </p>
              <p className="text-micro text-muted-foreground">
                Optimized for your profile • Activate in minutes
              </p>
            </div>

            {/* Setup Checklist */}
            <div className="space-y-2">
              {setupSteps.map((step, i) => (
                <div
                  key={step.label}
                  className="flex items-center gap-3 text-caption"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    step.done 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/30'
                  }`}>
                    {step.done && <Check className="w-3 h-3 text-primary-foreground" />}
                    {!step.done && <span className="text-micro text-muted-foreground">{i + 1}</span>}
                  </div>
                  <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust Message */}
        <p className="text-center text-micro text-muted-foreground px-4">
          Your funds remain under your control at all times.<br />
          You can stop or adjust settings whenever you want.
        </p>

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
