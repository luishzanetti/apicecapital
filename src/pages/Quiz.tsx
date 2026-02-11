import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore, UserProfile } from '@/store/appStore';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: keyof UserProfile;
  question: string;
  subtitle: string;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'goal',
    question: "What's your primary goal?",
    subtitle: 'This shapes your recommended path',
    options: [
      { value: 'passive-income', label: 'Passive Income', description: 'Consistent returns over time' },
      { value: 'growth', label: 'Long-term Growth', description: 'Maximize capital appreciation' },
      { value: 'balanced', label: 'Balanced', description: 'Growth with stability' },
      { value: 'protection', label: 'Capital Protection', description: 'Preserve wealth first' },
    ],
  },
  {
    id: 'experience',
    question: 'Your crypto experience?',
    subtitle: 'We adapt complexity to your level',
    options: [
      { value: 'new', label: 'New', description: 'Just getting started' },
      { value: 'intermediate', label: 'Intermediate', description: 'Understand the basics' },
      { value: 'experienced', label: 'Experienced', description: 'Active in the market' },
    ],
  },
  {
    id: 'riskTolerance',
    question: 'Risk tolerance?',
    subtitle: 'Be honest—this affects your strategy',
    options: [
      { value: 'low', label: 'Low', description: 'Prefer stability over high returns' },
      { value: 'medium', label: 'Medium', description: 'Accept moderate fluctuations' },
      { value: 'high', label: 'High', description: 'Comfortable with significant volatility' },
    ],
  },
  {
    id: 'capitalRange',
    question: 'Starting capital?',
    subtitle: 'Helps match suitable strategies',
    options: [
      { value: 'under-200', label: 'Under $200', description: 'Testing the waters' },
      { value: '200-1k', label: '$200 – $1,000', description: 'Starter allocation' },
      { value: '1k-5k', label: '$1,000 – $5,000', description: 'Committed capital' },
      { value: '5k-plus', label: '$5,000+', description: 'Significant investment' },
    ],
  },
  {
    id: 'habitType',
    question: 'How active do you want to be?',
    subtitle: 'We can automate more or less',
    options: [
      { value: 'passive', label: 'Fully Passive', description: 'Set it and forget it' },
      { value: 'minimal', label: 'Minimal Actions', description: 'Quick daily check-ins' },
      { value: 'active', label: 'Active Learner', description: 'Engaged and learning' },
    ],
  },
  {
    id: 'preferredAssets',
    question: 'Preferred asset focus?',
    subtitle: 'Your comfort zone',
    options: [
      { value: 'btc-eth', label: 'BTC & ETH Only', description: 'Blue-chip focus' },
      { value: 'majors', label: 'Top Majors', description: 'Top 10 by market cap' },
      { value: 'majors-alts', label: 'Majors + Alts', description: 'Broader exposure' },
    ],
  },
];

export default function Quiz() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const userProfile = useAppStore((s) => s.userProfile);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const currentQuestion = quizQuestions[currentStep];
  const totalSteps = quizQuestions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleSelect = (value: string) => {
    updateUserProfile({ [currentQuestion.id]: value });
    
    setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        completeOnboarding();
        navigate('/profile-result');
      }
    }, 150);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/welcome');
    }
  };

  const currentValue = userProfile[currentQuestion.id];

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-caption text-muted-foreground font-medium">
          {currentStep + 1} / {totalSteps}
        </span>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary rounded-full mb-10 overflow-hidden">
        <motion.div
          className="h-full apice-gradient-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <h1 className="text-2xl font-bold mb-2">{currentQuestion.question}</h1>
          <p className="text-muted-foreground text-sm mb-8">
            {currentQuestion.subtitle}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98]',
                  currentValue === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm mb-0.5">{option.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    'w-5 h-5 transition-colors',
                    currentValue === option.value ? 'text-primary' : 'text-muted-foreground/30'
                  )} />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Skip option */}
      <div className="mt-auto pt-6">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => {
            if (currentStep < totalSteps - 1) {
              setCurrentStep(currentStep + 1);
            } else {
              completeOnboarding();
              navigate('/profile-result');
            }
          }}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
