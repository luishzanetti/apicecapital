import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import type { InvestorType } from '@/store/types';
import { DCAAmountSlider } from '@/components/dca/DCAAmountSlider';
import { DCAAssetSelector } from '@/components/dca/DCAAssetSelector';
import { getNextExecutionDate } from '@/lib/dca';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react';

// ─── Recommended allocations per profile ────────────────────

interface AllocationPreset {
  id: string;
  label: string;
  description: string;
  assets: { symbol: string; allocation: number }[];
}

const ALLOCATION_PRESETS: AllocationPreset[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    description: 'Blue-chip safety net',
    assets: [
      { symbol: 'BTC', allocation: 65 },
      { symbol: 'ETH', allocation: 35 },
    ],
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Diversified growth',
    assets: [
      { symbol: 'BTC', allocation: 45 },
      { symbol: 'ETH', allocation: 30 },
      { symbol: 'SOL', allocation: 15 },
      { symbol: 'LINK', allocation: 10 },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    description: 'Maximum upside potential',
    assets: [
      { symbol: 'BTC', allocation: 35 },
      { symbol: 'ETH', allocation: 25 },
      { symbol: 'SOL', allocation: 20 },
      { symbol: 'ARB', allocation: 10 },
      { symbol: 'INJ', allocation: 10 },
    ],
  },
];

const INVESTOR_TYPE_DEFAULTS: Record<InvestorType, { amount: number; presetId: string }> = {
  'Conservative Builder': { amount: 25, presetId: 'conservative' },
  'Balanced Optimizer': { amount: 35, presetId: 'balanced' },
  'Growth Seeker': { amount: 50, presetId: 'growth' },
};

// ─── Component ──────────────────────────────────────────────

export default function QuickDCA() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const addDcaPlan = useAppStore((s) => s.addDcaPlan);

  const defaults = INVESTOR_TYPE_DEFAULTS[investorType || 'Balanced Optimizer'];

  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState(defaults.amount);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(defaults.presetId);
  const [customAssets, setCustomAssets] = useState<{ symbol: string; allocation: number }[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Resolve final assets from preset or custom
  const resolvedAssets = showCustom
    ? customAssets
    : ALLOCATION_PRESETS.find((p) => p.id === selectedPresetId)?.assets ?? [];

  const canSubmit = resolvedAssets.length > 0 && amount >= 5;

  // ─── Handlers ───────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const startDate = new Date().toISOString();
    await addDcaPlan({
      assets: resolvedAssets,
      amountPerInterval: amount,
      frequency: 'weekly',
      durationDays: null,
      startDate,
      isActive: true,
      totalInvested: 0,
      nextExecutionDate: getNextExecutionDate('weekly', startDate),
    });

    setShowSuccess(true);
  };

  // ─── Confetti + auto-navigate on success ────────────────

  useEffect(() => {
    if (!showSuccess) return;

    const end = Date.now() + 2000;
    const colors = ['#528FFF', '#FFD700', '#8B5CF6'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    const timer = setTimeout(() => navigate('/home'), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess, navigate]);

  // ─── Success overlay ────────────────────────────────────

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="text-center px-8"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-bold mb-2"
          >
            Your DCA plan is live!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-sm text-muted-foreground"
          >
            ${amount}/week — In 52 weeks: ~${(amount * 52).toLocaleString('en-US')} invested
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Main flow ──────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Top bar */}
      <div className="px-5 pt-6 pb-4 safe-top flex items-center justify-between">
        <button
          onClick={() => (step === 1 ? navigate(-1) : setStep(1))}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex gap-2">
          {[1, 2].map((dot) => (
            <div
              key={dot}
              className={`w-2 h-2 rounded-full transition-colors ${
                dot <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        <div className="w-10" /> {/* spacer */}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 pt-4"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Start Your DCA Journey</h1>
                <p className="text-sm text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
                  Invest automatically every week. Start small, stay consistent.
                </p>
              </div>

              <DCAAmountSlider
                value={amount}
                onChange={setAmount}
                frequency="weekly"
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-5 pt-4"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Pick your portfolio</h1>
                <p className="text-sm text-muted-foreground">
                  Choose a preset or build your own mix.
                </p>
              </div>

              {/* Preset cards */}
              <div className="space-y-3">
                {ALLOCATION_PRESETS.map((preset) => {
                  const isRecommended = preset.id === defaults.presetId;
                  const isActive = !showCustom && selectedPresetId === preset.id;

                  return (
                    <motion.button
                      key={preset.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setShowCustom(false);
                      }}
                      className={`relative w-full p-4 rounded-2xl text-left transition-all border ${
                        isActive
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      {isRecommended && (
                        <div className="absolute -top-2.5 right-3">
                          <Badge variant="default" className="text-[10px] px-2 py-0.5 gap-1">
                            <Sparkles className="w-3 h-3" />
                            Recommended
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{preset.label}</p>
                          <p className="text-xs text-muted-foreground">{preset.description}</p>
                        </div>
                        {isActive && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {preset.assets.map((a) => (
                          <Badge key={a.symbol} variant="secondary" className="text-[11px]">
                            {a.symbol} {a.allocation}%
                          </Badge>
                        ))}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom toggle */}
              <button
                onClick={() => setShowCustom((prev) => !prev)}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all border ${
                  showCustom
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                {showCustom ? 'Using custom allocation' : 'Custom allocation'}
              </button>

              {/* Custom asset selector */}
              <AnimatePresence>
                {showCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <DCAAssetSelector
                      selectedAssets={customAssets}
                      onChange={setCustomAssets}
                      maxAssets={5}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 bg-gradient-to-t from-background via-background to-transparent">
        {step === 1 ? (
          <Button
            variant="premium"
            size="lg"
            className="w-full"
            disabled={amount < 5}
            onClick={() => setStep(2)}
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            variant="premium"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Create My DCA Plan
          </Button>
        )}
      </div>
    </div>
  );
}
