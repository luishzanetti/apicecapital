import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/appStore';
import { DCAAmountSlider } from '@/components/dca/DCAAmountSlider';
import { DCAAssetSelector } from '@/components/dca/DCAAssetSelector';
import { DCARecommendationCard } from '@/components/dca/DCARecommendationCard';
import { DCAHistoricalProof } from '@/components/dca/DCAHistoricalProof';
import { DCABadges } from '@/components/dca/DCABadges';
import { DCALearnBlock } from '@/components/dca/DCALearnBlock';
import { DCAPlanCard } from '@/components/dca/DCAPlanCard';
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  ChevronRight,
  ChevronLeft,
  Infinity,
  Sparkles,
  Check,
  ExternalLink
} from 'lucide-react';
import { referralLinks } from '@/data/sampleData';

type WizardStep = 'amount' | 'assets' | 'schedule' | 'review';

export default function DCAPlanner() {
  const navigate = useNavigate();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const addDcaPlan = useAppStore((s) => s.addDcaPlan);
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);
  const linkClicks = useAppStore((s) => s.linkClicks);
  
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('amount');
  const [newPlan, setNewPlan] = useState<{
    assets: { symbol: string; allocation: number }[];
    amountPerInterval: number;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    durationDays: number | null;
    isForever: boolean;
  }>({
    assets: [],
    amountPerInterval: 25,
    frequency: 'weekly',
    durationDays: 90,
    isForever: false,
  });

  const handleCreatePlan = () => {
    addDcaPlan({
      assets: newPlan.assets,
      amountPerInterval: newPlan.amountPerInterval,
      frequency: newPlan.frequency,
      durationDays: newPlan.isForever ? null : newPlan.durationDays,
      startDate: new Date().toISOString(),
      isActive: true,
      totalInvested: 0,
      nextExecutionDate: new Date().toISOString(),
    });
    setShowWizard(false);
    setWizardStep('amount');
    setNewPlan({
      assets: [],
      amountPerInterval: 25,
      frequency: 'weekly',
      durationDays: 90,
      isForever: false,
    });
  };

  const handleApplyRecommendation = (
    assets: { symbol: string; allocation: number }[],
    amount: number,
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  ) => {
    setNewPlan({
      ...newPlan,
      assets,
      amountPerInterval: amount,
      frequency,
    });
    setShowWizard(true);
    setWizardStep('review');
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const durationOptions = [
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '180 days' },
    { value: 365, label: '1 year' },
  ];

  const canProceed = () => {
    switch (wizardStep) {
      case 'amount': return newPlan.amountPerInterval >= 5;
      case 'assets': return newPlan.assets.length > 0;
      case 'schedule': return true;
      case 'review': return true;
    }
  };

  const nextStep = () => {
    const steps: WizardStep[] = ['amount', 'assets', 'schedule', 'review'];
    const currentIndex = steps.indexOf(wizardStep);
    if (currentIndex < steps.length - 1) {
      setWizardStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: WizardStep[] = ['amount', 'assets', 'schedule', 'review'];
    const currentIndex = steps.indexOf(wizardStep);
    if (currentIndex > 0) {
      setWizardStep(steps[currentIndex - 1]);
    } else {
      setShowWizard(false);
    }
  };

  const getStepNumber = () => {
    const steps: WizardStep[] = ['amount', 'assets', 'schedule', 'review'];
    return steps.indexOf(wizardStep) + 1;
  };

  const bybitLink = referralLinks.find(l => l.id === 'bybit');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => showWizard ? prevStep() : navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {showWizard ? `Create Plan (${getStepNumber()}/4)` : 'DCA Planner'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {showWizard ? 
                wizardStep === 'amount' ? 'Set your investment amount' :
                wizardStep === 'assets' ? 'Choose your assets' :
                wizardStep === 'schedule' ? 'Configure schedule' :
                'Review and create' 
                : 'Systematic buying schedules'
              }
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 pb-24"
      >
        {!showWizard ? (
          <>
            {/* AI Recommendation Card */}
            <DCARecommendationCard onApply={handleApplyRecommendation} />

            {/* Active Plans */}
            {dcaPlans.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Your DCA Plans ({dcaPlans.length})
                </h2>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {dcaPlans.map((plan) => (
                      <DCAPlanCard key={plan.id} plan={plan} />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            )}

            {/* Create New Plan Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowWizard(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New DCA Plan
            </Button>

            {/* Learn Block */}
            <DCALearnBlock />

            {/* Historical Proof */}
            <DCAHistoricalProof />

            {/* Gamification / Badges */}
            <DCABadges />

            {/* Execution Guide */}
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-sm mb-3">How to Execute on Bybit</h3>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">1</span>
                    <p>Open Bybit and navigate to "Trade" → "Spot"</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">2</span>
                    <p>Set up a recurring buy order for your chosen assets</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">3</span>
                    <p>Configure the amount and frequency to match your plan</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">4</span>
                    <p>Review and confirm your recurring order</p>
                  </div>
                </div>

                {bybitLink && (
                  <Button
                    variant={linkClicks.bybitClicked ? 'outline' : 'premium'}
                    className="w-full mt-4"
                    onClick={() => {
                      trackLinkClick('bybit');
                      window.open(bybitLink.url, '_blank');
                    }}
                  >
                    {linkClicks.bybitClicked ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Account Created
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Bybit
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Wizard Flow */
          <AnimatePresence mode="wait">
            {wizardStep === 'amount' && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Investment Amount</h3>
                        <p className="text-xs text-muted-foreground">How much per interval?</p>
                      </div>
                    </div>

                    <DCAAmountSlider
                      value={newPlan.amountPerInterval}
                      onChange={(v) => setNewPlan({ ...newPlan, amountPerInterval: v })}
                      frequency={newPlan.frequency}
                    />

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Minimum $5 per interval
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {wizardStep === 'assets' && (
              <motion.div
                key="assets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Select Assets</h3>
                        <p className="text-xs text-muted-foreground">Choose up to 5 assets</p>
                      </div>
                    </div>

                    <DCAAssetSelector
                      selectedAssets={newPlan.assets}
                      onChange={(assets) => setNewPlan({ ...newPlan, assets })}
                      maxAssets={5}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {wizardStep === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card>
                  <CardContent className="pt-5 space-y-5">
                    {/* Frequency */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Frequency
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {frequencyOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setNewPlan({ ...newPlan, frequency: opt.value as 'daily' | 'weekly' | 'biweekly' | 'monthly' })}
                            className={`py-3 rounded-xl text-sm font-medium transition-all ${
                              newPlan.frequency === opt.value
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Forever Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <Infinity className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Forever Mode</p>
                          <p className="text-xs text-muted-foreground">No end date, ongoing DCA</p>
                        </div>
                      </div>
                      <Switch
                        checked={newPlan.isForever}
                        onCheckedChange={(checked) => setNewPlan({ ...newPlan, isForever: checked })}
                      />
                    </div>

                    {/* Duration (if not forever) */}
                    {!newPlan.isForever && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">
                          Duration
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {durationOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setNewPlan({ ...newPlan, durationDays: opt.value })}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                newPlan.durationDays === opt.value
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {wizardStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card variant="premium">
                  <CardContent className="pt-5">
                    <h3 className="font-semibold text-lg mb-4 text-center">Plan Summary</h3>
                    
                    {/* Amount */}
                    <div className="text-center mb-4">
                      <span className="text-4xl font-bold text-primary">${newPlan.amountPerInterval}</span>
                      <span className="text-lg text-muted-foreground">/{newPlan.frequency}</span>
                    </div>

                    {/* Assets */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {newPlan.assets.map((asset) => (
                        <Badge key={asset.symbol} variant="outline">
                          {asset.symbol} ({asset.allocation}%)
                        </Badge>
                      ))}
                    </div>

                    {/* Duration */}
                    <div className="p-3 rounded-xl bg-secondary/50 text-center mb-4">
                      {newPlan.isForever ? (
                        <div className="flex items-center justify-center gap-2">
                          <Infinity className="w-5 h-5 text-primary" />
                          <span className="font-medium">Forever Mode</span>
                        </div>
                      ) : (
                        <span className="font-medium">{newPlan.durationDays} days</span>
                      )}
                    </div>

                    {/* Projections */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-secondary/30 text-center">
                        <p className="text-xs text-muted-foreground">Monthly</p>
                        <p className="text-lg font-bold">
                          ${(newPlan.amountPerInterval * (
                            newPlan.frequency === 'daily' ? 30 :
                            newPlan.frequency === 'weekly' ? 4 :
                            newPlan.frequency === 'biweekly' ? 2 : 1
                          )).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/10 text-center">
                        <p className="text-xs text-muted-foreground">Yearly</p>
                        <p className="text-lg font-bold text-primary">
                          ${(newPlan.amountPerInterval * (
                            newPlan.frequency === 'daily' ? 365 :
                            newPlan.frequency === 'weekly' ? 52 :
                            newPlan.frequency === 'biweekly' ? 26 : 12
                          )).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-[10px] text-center text-muted-foreground mb-4">
                      Crypto is volatile. Past performance ≠ future results. Only invest what you can afford to lose.
                    </p>

                    <Button
                      variant="premium"
                      className="w-full"
                      onClick={handleCreatePlan}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Create DCA Plan
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Wizard Navigation */}
        {showWizard && wizardStep !== 'review' && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={prevStep}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button 
              variant="premium" 
              className="flex-1"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
