import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBybitData } from '@/hooks/useBybitData';
import {
    TrendingUp,
    Zap,
    Award,
    Target,
    DollarSign,
    CheckCircle2,
    Lock,
    Info,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ConsistentInvestmentStrategyProps {
    totalInvested?: number;
}

// Investment levels with progressive unlocks
const INVESTMENT_LEVELS = [
    {
        threshold: 0,
        label: 'Iniciante',
        icon: '🌱',
        color: 'text-gray-400',
        unlocks: ['Portfolios Básicos', 'DCA Básico'],
    },
    {
        threshold: 300,
        label: 'Construtor',
        icon: '🔨',
        color: 'text-blue-400',
        unlocks: ['Portfolios Otimizados', 'DCA Multi-Ativos'],
    },
    {
        threshold: 1000,
        label: 'Estrategista',
        icon: '🎯',
        color: 'text-purple-400',
        unlocks: ['Diversificação Avançada', 'Acesso a Copy Trading'],
    },
    {
        threshold: 3000,
        label: 'Arquiteto',
        icon: '🏗️',
        color: 'text-orange-400',
        unlocks: ['Lista de Alto Crescimento', 'Trading de Futuros'],
    },
    {
        threshold: 10000,
        label: 'Titã',
        icon: '👑',
        color: 'text-yellow-400',
        unlocks: ['Estratégias IA Elite', 'Copy Trading Prioritário', 'Futuros Avançados'],
    },
];

export function ConsistentInvestmentStrategy({ totalInvested: externalTotal }: ConsistentInvestmentStrategyProps) {
    const { totalEquity, isConnected, isLoading } = useBybitData();
    const [weeklyAmount, setWeeklyAmount] = useState(100);

    // Use Bybit data if connected, otherwise use external total
    const totalInvested = isConnected ? totalEquity : (externalTotal || 0);

    // Calculate projections
    const monthlyAmount = weeklyAmount * 4;
    const yearlyAmount = weeklyAmount * 52;

    // 5-year projection with 8% annual return (compounded monthly)
    const calculateCompoundGrowth = (weekly: number, years: number, annualRate: number) => {
        const monthlyRate = annualRate / 12;
        const months = years * 12;
        const monthlyContribution = weekly * 4;

        let total = 0;
        for (let i = 0; i < months; i++) {
            total = (total + monthlyContribution) * (1 + monthlyRate);
        }
        return Math.round(total);
    };

    const fiveYearInvested = yearlyAmount * 5;
    const fiveYearProjected = calculateCompoundGrowth(weeklyAmount, 5, 0.08);
    const fiveYearGain = fiveYearProjected - fiveYearInvested;
    const fiveYearGainPercent = ((fiveYearGain / fiveYearInvested) * 100).toFixed(1);

    // Calculate current level
    const currentLevelIndex = INVESTMENT_LEVELS.reduce((acc, level, i) =>
        totalInvested >= level.threshold ? i : acc, 0
    );
    const currentLevel = INVESTMENT_LEVELS[currentLevelIndex];
    const nextLevel = INVESTMENT_LEVELS[currentLevelIndex + 1];

    const progressToNext = nextLevel
        ? Math.min(100, ((totalInvested - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100)
        : 100;

    const weeksToNextLevel = nextLevel
        ? Math.ceil((nextLevel.threshold - totalInvested) / weeklyAmount)
        : 0;

    return (
        <div className="space-y-6">
            {/* Main Strategy Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Estratégia de Aporte Consistente
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Quanto mais você investe regularmente, mais estratégias você desbloqueia
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Bybit Connection Status */}
                    {isConnected && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-apice-success/10 border border-apice-success/20">
                            <Zap className="w-4 h-4 text-apice-success" />
                            <span className="text-sm font-medium text-apice-success">
                                Conectado com Bybit - Dados em tempo real
                            </span>
                        </div>
                    )}

                    {/* Current Investment Amount */}
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">Seu Aporte Semanal</span>
                            <div className="text-right">
                                <span className="text-3xl font-bold">${weeklyAmount}</span>
                                <span className="text-muted-foreground">/semana</span>
                            </div>
                        </div>

                        <Slider
                            value={[weeklyAmount]}
                            onValueChange={([value]) => setWeeklyAmount(value)}
                            min={25}
                            max={1000}
                            step={25}
                            className="w-full"
                        />

                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>$25</span>
                            <span>$1,000</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-3 rounded-lg bg-secondary/50">
                                <div className="text-xs text-muted-foreground">Mensal</div>
                                <div className="font-semibold">${monthlyAmount.toLocaleString()}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/50">
                                <div className="text-xs text-muted-foreground">Anual</div>
                                <div className="font-semibold">${yearlyAmount.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* 5-Year Projection */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">Projeção em 5 anos (8% a.a.)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-muted-foreground">Total Investido</div>
                                <div className="text-lg font-semibold">${fiveYearInvested.toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground">Valor Projetado</div>
                                <div className="text-lg font-semibold text-apice-success">
                                    ${fiveYearProjected.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-primary/10">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Ganho Estimado</span>
                                <span className="font-semibold text-apice-success">
                                    +${fiveYearGain.toLocaleString()} ({fiveYearGainPercent}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" size="sm">
                            <Info className="w-4 h-4 mr-2" />
                            Ver Detalhes
                        </Button>
                        <Button variant="default" className="flex-1" size="sm">
                            <Zap className="w-4 h-4 mr-2" />
                            Automatizar DCA
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Investment Level Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Seu Nível de Investimento
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current Level */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl">{currentLevel.icon}</div>
                            <div>
                                <div className="text-lg font-bold">{currentLevel.label}</div>
                                <div className="text-sm text-muted-foreground">
                                    Total Investido: ${totalInvested.toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <Badge variant="default" className="text-xs">
                            Nível {currentLevelIndex + 1}/5
                        </Badge>
                    </div>

                    {/* Progress to Next Level */}
                    {nextLevel && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Progresso para {nextLevel.label} {nextLevel.icon}
                                </span>
                                <span className="font-semibold">{progressToNext.toFixed(0)}%</span>
                            </div>
                            <Progress value={progressToNext} className="h-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Faltam ${(nextLevel.threshold - totalInvested).toLocaleString()}</span>
                                <span>~{weeksToNextLevel} semanas com ${weeklyAmount}/semana</span>
                            </div>
                        </div>
                    )}

                    {/* Unlocked Features */}
                    <div className="space-y-3">
                        <div className="text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-apice-success" />
                            Desbloqueado
                        </div>
                        <div className="grid gap-2">
                            {currentLevel.unlocks.map((unlock, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-3 h-3 text-apice-success shrink-0" />
                                    <span>{unlock}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Locked Features */}
                    {nextLevel && (
                        <div className="space-y-3">
                            <div className="text-sm font-semibold flex items-center gap-2">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                Próximo Nível ({nextLevel.label})
                            </div>
                            <div className="grid gap-2">
                                {nextLevel.unlocks.map((unlock, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Lock className="w-3 h-3 shrink-0" />
                                        <span>{unlock}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Why Consistency Matters */}
            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Por que Consistência Importa?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-apice-success shrink-0 mt-0.5" />
                        <div>
                            <div className="font-medium">Reduz risco de timing ruim</div>
                            <div className="text-xs text-muted-foreground">
                                DCA elimina a necessidade de acertar o momento perfeito
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-apice-success shrink-0 mt-0.5" />
                        <div>
                            <div className="font-medium">Aproveita a volatilidade</div>
                            <div className="text-xs text-muted-foreground">
                                Compra mais quando está barato, menos quando está caro
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-apice-success shrink-0 mt-0.5" />
                        <div>
                            <div className="font-medium">Desbloqueia estratégias avançadas</div>
                            <div className="text-xs text-muted-foreground">
                                Mais capital = mais diversificação e automação
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-apice-success shrink-0 mt-0.5" />
                        <div>
                            <div className="font-medium">Cria disciplina financeira</div>
                            <div className="text-xs text-muted-foreground">
                                Investimento regular se torna um hábito automático
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
