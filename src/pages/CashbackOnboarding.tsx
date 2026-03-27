import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    CreditCard,
    TrendingUp,
    Sparkles,
    ArrowRight,
    Bitcoin,
    Zap,
    Target,
    ChevronLeft
} from 'lucide-react';

interface OnboardingSlide {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    visual: React.ReactNode;
    cta: string;
}

export default function CashbackOnboarding() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides: OnboardingSlide[] = [
        {
            id: 1,
            title: "Transform Every Purchase into Bitcoin",
            subtitle: "Silently build wealth the smart way",
            description: "Every coffee, every Uber, every Netflix subscription automatically turns into Bitcoin. No effort, no thinking, just accumulating.",
            visual: (
                <motion.div
                    className="relative w-full h-64 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Cartão de Crédito */}
                    <motion.div
                        className="absolute w-48 h-32 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-2xl"
                        animate={{
                            rotateY: [0, 180, 360],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <div className="p-4 h-full flex flex-col justify-between text-white">
                            <div className="flex justify-between items-start">
                                <Sparkles className="w-6 h-6" />
                                <CreditCard className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs opacity-80">Apice Cashback</p>
                                <p className="text-sm font-mono">•••• •••• •••• 8888</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Moedas BTC caindo */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            initial={{ y: -100, x: Math.random() * 200 - 100, opacity: 0 }}
                            animate={{
                                y: 300,
                                opacity: [0, 1, 1, 0],
                                rotate: 360
                            }}
                            transition={{
                                duration: 2,
                                delay: i * 0.3,
                                repeat: Infinity,
                                repeatDelay: 1
                            }}
                        >
                            <Bitcoin className="w-8 h-8 text-amber-500" />
                        </motion.div>
                    ))}
                </motion.div>
            ),
            cta: "See How It Works"
        },
        {
            id: 2,
            title: "2-10% Cashback on EVERYTHING",
            subtitle: "100% back on your favorite subscriptions",
            description: "It's not about spending more. It's about turning what you already spend into an automatic investment that grows over time.",
            visual: (
                <div className="space-y-6 py-8">
                    {/* Cashback Principal */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/30"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <Zap className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">2-10% Cashback</h3>
                                <p className="text-sm text-muted-foreground">On all your purchases</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Assinaturas 100% */}
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">100% Cashback</h3>
                                <p className="text-sm text-muted-foreground">Netflix, Spotify, Amazon Prime...</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Benefícios */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        {[
                            { icon: Bitcoin, text: "Auto DCA" },
                            { icon: TrendingUp, text: "Grows with BTC" },
                            { icon: Zap, text: "Effortless" },
                            { icon: Target, text: "Long Term" }
                        ].map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                                className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50"
                            >
                                <benefit.icon className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium">{benefit.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ),
            cta: "Continue"
        },
        {
            id: 3,
            title: "The Power of Time",
            subtitle: "Bitcoin grew 22,000% in the last 10 years",
            description: "Imagine having automatically accumulated Bitcoin during this period. Every small purchase turning into something significant.",
            visual: (
                <div className="space-y-6 py-4">
                    {/* Simplified Chart */}
                    <div className="relative h-48 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 400 200">
                                <motion.path
                                    d="M 0 180 Q 100 150 200 80 T 400 20"
                                    stroke="url(#gradient)"
                                    strokeWidth="3"
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="text-right">
                                <p className="text-xs text-gray-400">2024</p>
                                <p className="text-2xl font-bold text-green-500">$67,000</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">2014</p>
                                <p className="text-lg font-bold text-amber-500">$300</p>
                            </div>
                        </div>
                    </div>

                    {/* Calculadora Rápida */}
                    <Card className="p-6 bg-primary/5 border-primary/20">
                        <h4 className="font-semibold mb-4 text-center">Simple Simulation</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Monthly spend:</span>
                                <span className="font-bold">$500</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Average cashback (5%):</span>
                                <span className="font-bold text-amber-500">$25/mo in BTC</span>
                            </div>
                            <div className="h-px bg-border my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">In 1 year:</span>
                                <span className="font-bold text-green-500">~$300 in BTC</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">If BTC grows 50%:</span>
                                <span className="text-xl font-bold text-green-500">$450</span>
                            </div>
                        </div>
                    </Card>

                    <p className="text-xs text-center text-muted-foreground italic">
                        "It's not about timing the market. It's about time in the market."
                    </p>
                </div>
            ),
            cta: "See My Potential"
        },
        {
            id: 4,
            title: "30-Day Challenge",
            subtitle: "Spend $500 and watch the magic happen",
            description: "Take the challenge. Use the card normally for 30 days. See yourself automatically accumulating Bitcoin. No tricks, just math and time.",
            visual: (
                <div className="space-y-6 py-4">
                    {/* Card do Desafio */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">30-Day Challenge</h3>
                                    <p className="text-sm opacity-90">Start your Bitcoin journey</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">1</div>
                                    <span className="text-sm">Use the card normally</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">2</div>
                                    <span className="text-sm">Spend $500 in 30 days</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">3</div>
                                    <span className="text-sm">Accumulate Bitcoin automatically</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/20">
                                <p className="text-xs opacity-80">Estimated reward:</p>
                                <p className="text-3xl font-bold">$25-50 in BTC</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Motivação */}
                    <div className="text-center space-y-2">
                        <p className="text-sm font-medium">
                            "The best time to start was 10 years ago."
                        </p>
                        <p className="text-lg font-bold text-primary">
                            The second best time is now.
                        </p>
                    </div>
                </div>
            ),
            cta: "Accept Challenge"
        }
    ];

    const currentSlideData = slides[currentSlide];

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            // Último slide - aceitar desafio
            navigate('/cashback-machine');
        }
    };

    const handleBack = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        } else {
            navigate('/strategies');
        }
    };

    const handleSkip = () => {
        navigate('/cashback-dashboard');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="p-4 flex justify-between items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="rounded-full"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>

                {/* Progress Dots */}
                <div className="flex gap-2">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all ${index === currentSlide
                                ? 'w-8 bg-primary'
                                : 'w-2 bg-muted'
                                }`}
                        />
                    ))}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-xs"
                >
                    Skip
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-8 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Visual */}
                        <div className="min-h-[280px]">
                            {currentSlideData.visual}
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 text-center">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">
                                    {currentSlideData.title}
                                </h1>
                                <p className="text-lg text-primary font-medium">
                                    {currentSlideData.subtitle}
                                </p>
                            </div>

                            <p className="text-muted-foreground leading-relaxed">
                                {currentSlideData.description}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* CTA Button */}
            <div className="p-6 border-t border-border bg-background/95 backdrop-blur">
                <Button
                    onClick={handleNext}
                    size="lg"
                    className="w-full gap-2 text-lg h-14"
                >
                    {currentSlideData.cta}
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
