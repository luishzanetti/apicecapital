import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { Check, ExternalLink, Shield, Zap, Copy, Bot, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SetupStep {
  id: keyof typeof stepKeys;
  title: string;
  description: string;
  icon: React.ElementType;
}

const stepKeys = {
  exchangeConnected: 'exchangeConnected',
  securityCompleted: 'securityCompleted',
  pathSelected: 'pathSelected',
  moduleActivated: 'moduleActivated',
  confirmationDone: 'confirmationDone',
} as const;

const setupSteps: SetupStep[] = [
  {
    id: 'exchangeConnected',
    title: 'Connect Exchange',
    description: 'Link your Bybit account',
    icon: ExternalLink,
  },
  {
    id: 'securityCompleted',
    title: 'Security Setup',
    description: 'Enable 2FA and verify',
    icon: Shield,
  },
  {
    id: 'pathSelected',
    title: 'Choose Your Path',
    description: 'Select strategy or AI automation',
    icon: Zap,
  },
  {
    id: 'moduleActivated',
    title: 'Activate Module',
    description: 'Go live with your selection',
    icon: Bot,
  },
  {
    id: 'confirmationDone',
    title: 'Confirm & Launch',
    description: 'Final review and activation',
    icon: Check,
  },
];

export default function Automate() {
  const navigate = useNavigate();
  const setupProgress = useAppStore((s) => s.setupProgress);
  const updateSetupProgress = useAppStore((s) => s.updateSetupProgress);
  const unlockState = useAppStore((s) => s.unlockState);

  const completedSteps = Object.values(setupProgress).filter(Boolean).length;
  const totalSteps = Object.keys(setupProgress).length;

  const handleStepAction = (stepId: keyof typeof stepKeys) => {
    // Simulate completing a step
    updateSetupProgress({ [stepId]: true });
  };

  const getNextIncompleteStep = () => {
    for (const step of setupSteps) {
      if (!setupProgress[step.id]) {
        return step.id;
      }
    }
    return null;
  };

  const nextStep = getNextIncompleteStep();

  return (
    <div className="min-h-screen bg-background px-5 py-6 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-primary" />
            <h1 className="text-headline">Automate</h1>
          </div>
          <p className="text-muted-foreground text-caption">
            Your activation engine. Set up in minutes.
          </p>
        </div>

        {/* Progress Overview */}
        <Card variant="elevated">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Setup Checklist</h3>
                <p className="text-caption text-muted-foreground">
                  {completedSteps} of {totalSteps} steps completed
                </p>
              </div>
              <div className="text-right">
                <span className="text-title font-bold text-primary">
                  {Math.round((completedSteps / totalSteps) * 100)}%
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full apice-gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <div className="space-y-3">
          {setupSteps.map((step, i) => {
            const isCompleted = setupProgress[step.id];
            const isCurrent = step.id === nextStep;
            const isLocked = i > 0 && !setupProgress[setupSteps[i - 1].id];

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  variant={isCurrent ? 'premium' : 'default'}
                  className={cn(
                    'transition-all duration-200',
                    isLocked && 'opacity-50'
                  )}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        isCompleted 
                          ? 'bg-apice-success text-white' 
                          : isCurrent 
                            ? 'apice-gradient-primary text-white'
                            : 'bg-secondary text-muted-foreground'
                      )}>
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{step.title}</h3>
                        <p className="text-caption text-muted-foreground truncate">
                          {step.description}
                        </p>
                      </div>

                      {isCompleted ? (
                        <Badge variant="low" size="sm">Done</Badge>
                      ) : isCurrent ? (
                        <Button
                          size="sm"
                          variant="premium"
                          onClick={() => handleStepAction(step.id)}
                        >
                          Start
                        </Button>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Module Options */}
        <div className="pt-4">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Available Modules
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card
              variant="interactive"
              onClick={() => navigate('/automate/ai-bot')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl apice-gradient-primary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-medium text-sm mb-1">AI Bot</h3>
                <p className="text-micro text-muted-foreground">
                  Automated trading
                </p>
                <Badge 
                  variant={unlockState.aiBot ? 'unlocked' : 'locked'} 
                  size="sm" 
                  className="mt-2"
                >
                  {unlockState.aiBot ? 'Unlocked' : 'Locked'}
                </Badge>
              </CardContent>
            </Card>

            <Card
              variant="interactive"
              onClick={() => navigate('/automate/copy-portfolios')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
                  <Copy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm mb-1">Copy Trading</h3>
                <p className="text-micro text-muted-foreground">
                  Follow top traders
                </p>
                <Badge 
                  variant={unlockState.copyPortfolios ? 'unlocked' : 'locked'} 
                  size="sm" 
                  className="mt-2"
                >
                  {unlockState.copyPortfolios ? 'Unlocked' : 'Locked'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Message */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-micro text-muted-foreground">
            Your funds remain on your exchange. No withdrawal access.
            You can stop anytime.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
