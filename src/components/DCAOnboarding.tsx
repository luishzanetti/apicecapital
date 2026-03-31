import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { dcaEducationSlides } from '@/data/sampleData';
import { ChevronRight, CheckCircle2, X, Sparkles } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export default function DCAOnboarding({ isOpen, onClose, onComplete }: Props) {
    const [step, setStep] = useState(0);
    const setPortfolioAccepted = useAppStore((s) => s.setPortfolioAccepted);
    const completeMissionTask = useAppStore((s) => s.completeMissionTask);
    const totalSlides = dcaEducationSlides.length;

    const handleNext = () => {
        if (step < totalSlides - 1) {
            setStep(step + 1);
        } else {
            // Complete
            setPortfolioAccepted(true);
            completeMissionTask('m3_strategyChosen');
            completeMissionTask('m3_portfolioSelected');
            onComplete();
            onClose();
            setStep(0);
        }
    };

    if (!isOpen) return null;

    const slide = dcaEducationSlides[step];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="w-full max-w-lg bg-card rounded-t-3xl border border-border/50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress bar */}
                    <div className="flex gap-1 px-6 pt-4">
                        {dcaEducationSlides.map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 h-1 rounded-full transition-all duration-300"
                                style={{
                                    background:
                                        i <= step
                                            ? 'linear-gradient(90deg, #6366f1, #a855f7)'
                                            : 'rgba(255,255,255,0.07)',
                                }}
                            />
                        ))}
                    </div>

                    {/* Close */}
                    <button
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.2 }}
                            className="px-6 py-6"
                        >
                            <div className="text-center mb-6">
                                <div className="text-5xl mb-3">{slide.icon}</div>
                                <h2 className="text-xl font-bold mb-2">{slide.title}</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                                    {slide.content}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {slide.stats.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        className="p-4 rounded-2xl bg-secondary/50 border border-border/30 text-center"
                                    >
                                        <p className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                                            {stat.value}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                                            {stat.label}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                            {stat.detail}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="px-6 pb-8">
                        {step < totalSlides - 1 ? (
                            <Button
                                className="w-full h-12 rounded-full text-sm font-semibold"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                onClick={handleNext}
                            >
                                Continue
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                className="w-full h-12 rounded-full text-sm font-semibold"
                                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                                onClick={handleNext}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Activate My Portfolio
                            </Button>
                        )}
                        <p className="text-center text-[11px] text-muted-foreground mt-3">
                            {step + 1} of {totalSlides} · {step < totalSlides - 1 ? 'Slide to continue' : 'Ready to start!'}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
