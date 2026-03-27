import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Bitcoin,
    TrendingUp,
    Calendar,
    CreditCard,
    Settings,
    ChevronLeft,
    Sparkles,
    Target,
    ArrowRight,
    ExternalLink,
    TrendingDown
} from 'lucide-react';

export default function CashbackDashboard() {
    const navigate = useNavigate();

    // Mock data - substituir por dados reais depois
    const [btcAccumulated] = useState(0.00234);
    const [usdValue] = useState(158.50);
    const [dailyChange] = useState(2.3);
    const [challengeProgress] = useState(320);
    const [challengeTarget] = useState(500);
    const [daysRemaining] = useState(18);

    const transactions = [
        { id: 1, merchant: 'Starbucks', amount: 8.50, cashback: 0.43, date: '2024-02-11', btc: 0.0000064 },
        { id: 2, merchant: 'Uber', amount: 15.20, cashback: 0.76, date: '2024-02-10', btc: 0.0000112 },
        { id: 3, merchant: 'Amazon', amount: 45.00, cashback: 2.25, date: '2024-02-09', btc: 0.0000333 },
        { id: 4, merchant: 'Netflix', amount: 15.99, cashback: 15.99, date: '2024-02-08', btc: 0.0002367, isSubscription: true },
    ];

    const subscriptionPartners = [
        { name: 'Netflix', logo: '🎬', cashback: '100%', active: true },
        { name: 'Spotify', logo: '🎵', cashback: '100%', active: false },
        { name: 'Amazon Prime', logo: '📦', cashback: '100%', active: false },
        { name: 'Disney+', logo: '🏰', cashback: '100%', active: false },
    ];

    const progressPercentage = (challengeProgress / challengeTarget) * 100;

    return (
        <div className="min-h-screen bg-background pb-28">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
                <div className="px-5 py-4 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/strategies')}
                        className="rounded-full"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-bold">Cashback Machine</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/settings')}
                        className="rounded-full"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="px-5 py-6 space-y-6">
                {/* Saldo BTC Acumulado */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-none bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Bitcoin className="w-32 h-32" />
                        </div>
                        <CardContent className="pt-6 relative z-10">
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground font-medium">Accumulated Bitcoin</p>
                                <div className="flex items-baseline justify-center gap-2">
                                    <Bitcoin className="w-8 h-8 text-amber-500" />
                                    <h1 className="text-4xl font-bold tracking-tight">
                                        {btcAccumulated.toFixed(8)}
                                    </h1>
                                    <span className="text-sm text-muted-foreground">BTC</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-2xl font-semibold text-muted-foreground">
                                        ${usdValue.toFixed(2)}
                                    </p>
                                    <Badge variant={dailyChange >= 0 ? 'default' : 'destructive'} className="gap-1">
                                        {dailyChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {Math.abs(dailyChange).toFixed(2)}%
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Progresso do Desafio 30 Dias */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    30-Day Challenge
                                </CardTitle>
                                <Badge variant="outline" className="gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {daysRemaining} days remaining
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-muted-foreground">Progress</span>
                                <span className="text-2xl font-bold">
                                    ${challengeProgress}
                                    <span className="text-sm text-muted-foreground font-normal">/${challengeTarget}</span>
                                </span>
                            </div>
                            <Progress value={progressPercentage} className="h-3" />
                            <p className="text-xs text-muted-foreground text-center">
                                Only ${(challengeTarget - challengeProgress).toFixed(0)} left to complete the challenge!
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Projeção */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-500" />
                                Accumulation Projection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground mb-1">In 1 year</p>
                                    <p className="text-xl font-bold text-primary">0.028 BTC</p>
                                    <p className="text-xs text-muted-foreground">~$1,900</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground mb-1">In 5 years</p>
                                    <p className="text-xl font-bold text-green-500">0.140 BTC</p>
                                    <p className="text-xs text-muted-foreground">~$9,500</p>
                                </div>
                            </div>
                            <p className="text-xs text-center text-muted-foreground italic">
                                *Based on $500/month average spend and conservative BTC growth
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Últimas Transações */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-sm">Recent Transactions</h3>
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                            See All <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {transactions.map((tx) => (
                            <Card key={tx.id} className="border-none bg-secondary/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm flex items-center gap-2">
                                                    {tx.merchant}
                                                    {tx.isSubscription && (
                                                        <Badge variant="default" className="text-[10px] px-1.5 py-0">100%</Badge>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{tx.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">${tx.amount}</p>
                                            <p className="text-xs text-green-500 flex items-center gap-1">
                                                <Bitcoin className="w-3 h-3" />
                                                +{tx.btc.toFixed(8)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>

                {/* Parceiros 100% Cashback */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-green-500" />
                                100% Cashback Subscriptions
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Get 100% back in Bitcoin on your favorite subscriptions
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {subscriptionPartners.map((partner) => (
                                    <Card
                                        key={partner.name}
                                        className={`cursor-pointer transition-all ${partner.active
                                            ? 'border-green-500/50 bg-green-500/10'
                                            : 'border-dashed hover:border-primary/30'
                                            }`}
                                    >
                                        <CardContent className="p-4 text-center space-y-2">
                                            <div className="text-3xl">{partner.logo}</div>
                                            <div>
                                                <p className="font-semibold text-xs">{partner.name}</p>
                                                <p className="text-[10px] text-green-500 font-bold">{partner.cashback}</p>
                                            </div>
                                            {partner.active ? (
                                                <Badge variant="default" className="text-[10px] w-full">Active</Badge>
                                            ) : (
                                                <Button size="sm" variant="outline" className="w-full h-7 text-[10px]">
                                                    Activate
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* CTA - Solicitar Cartão */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="bg-gradient-to-r from-amber-500 to-orange-600 border-none text-white">
                        <CardContent className="p-6 text-center space-y-3">
                            <CreditCard className="w-12 h-12 mx-auto" />
                            <div>
                                <h3 className="font-bold text-lg">Don't have the card yet?</h3>
                                <p className="text-sm opacity-90">Apply now and start accumulating Bitcoin</p>
                            </div>
                            <Button
                                size="lg"
                                variant="secondary"
                                className="w-full gap-2"
                                onClick={() => navigate('/cashback-machine')}
                            >
                                Request Card
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
