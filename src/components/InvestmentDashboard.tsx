import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';
import { getReturnRateForInvestorType } from '@/data/sampleData';
import {
    TrendingUp, DollarSign, Flame, Eye, EyeOff, Edit3,
    Trash2, Check, X, ChevronRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

interface Props {
    compact?: boolean;
}

function generateGrowthData(weekly: number, weeks: number, annualRate: number) {
    const data = [];
    let total = 0;
    let invested = 0;
    for (let w = 0; w <= Math.max(weeks, 12); w++) {
        invested += weekly;
        total = (total + weekly) * (1 + annualRate / 52);
        if (w % 4 === 0) {
            data.push({
                label: `S${w}`,
                value: Math.round(total),
                invested: Math.round(invested),
            });
        }
    }
    return data;
}

export default function InvestmentDashboard({ compact }: Props) {
    const navigate = useNavigate();
    const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);
    const investmentFrequency = useAppStore((s) => s.investmentFrequency);
    const setWeeklyInvestment = useAppStore((s) => s.setWeeklyInvestment);
    const setInvestmentFrequency = useAppStore((s) => s.setInvestmentFrequency);
    const weeklyDepositHistory = useAppStore((s) => s.weeklyDepositHistory);
    const weeklyDepositStreak = useAppStore((s) => s.weeklyDepositStreak);
    const investorType = useAppStore((s) => s.investorType);
    const editDeposit = useAppStore((s) => s.editDeposit);
    const removeDeposit = useAppStore((s) => s.removeDeposit);

    const [hideBalance, setHideBalance] = useState(false);
    const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState(0);
    const [editingInvestment, setEditingInvestment] = useState(false);
    const [tempInvestment, setTempInvestment] = useState(weeklyInvestment);

    const totalDeposited = weeklyDepositHistory.reduce((sum, d) => sum + d.amount, 0);
    const annualRate = getReturnRateForInvestorType(investorType);
    const simulatedGain = totalDeposited * annualRate * (weeklyDepositHistory.length / 52);
    const estimatedValue = totalDeposited + simulatedGain;
    const gainPercent = totalDeposited > 0 ? ((simulatedGain / totalDeposited) * 100).toFixed(1) : '0';

    const growthData = generateGrowthData(weeklyInvestment, weeklyDepositHistory.length, annualRate);

    const handleEditSave = (weekId: string) => {
        editDeposit(weekId, editValue);
        setEditingWeekId(null);
    };

    if (compact) {
        return (
            <Card className="overflow-hidden border-primary/10">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                            >
                                <DollarSign className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                                    Portfolio Value
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold">
                                        {hideBalance ? '•••••' : `$${estimatedValue.toFixed(2)}`}
                                    </span>
                                    <button onClick={() => setHideBalance(!hideBalance)}>
                                        {hideBalance ? (
                                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                                        ) : (
                                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {weeklyDepositStreak > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10">
                                <Flame className="w-3 h-3 text-orange-400" />
                                <span className="text-[11px] text-orange-400 font-bold">{weeklyDepositStreak}w</span>
                            </div>
                        )}
                    </div>

                    {/* Mini stats row */}
                    <div className="flex gap-3 text-[11px]">
                        <span className="text-muted-foreground">
                            Invested: <span className="text-foreground font-medium">${totalDeposited.toLocaleString()}</span>
                        </span>
                        {simulatedGain > 0 && (
                            <span className="text-green-400 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                +${simulatedGain.toFixed(2)} ({gainPercent}%)
                            </span>
                        )}
                    </div>

                    {/* Mini chart */}
                    {growthData.length > 2 && totalDeposited > 0 && (
                        <div className="mt-3 h-[60px] -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#dashGrad)" strokeWidth={1.5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Investment plan row */}
                    {weeklyInvestment > 0 ? (
                        <div className="mt-3 pt-3 border-t border-border/20">
                            <AnimatePresence mode="wait">
                                {editingInvestment ? (
                                    <motion.div
                                        key="edit"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                                <input
                                                    type="number"
                                                    value={tempInvestment}
                                                    onChange={(e) => setTempInvestment(Math.max(0, Number(e.target.value)))}
                                                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-secondary/60 text-sm font-semibold border border-border/40 focus:border-primary/40 focus:outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                            <button
                                                onClick={() => { setWeeklyInvestment(tempInvestment); setEditingInvestment(false); }}
                                                className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                                            >
                                                <Check className="w-4 h-4 text-primary" />
                                            </button>
                                            <button
                                                onClick={() => { setTempInvestment(weeklyInvestment); setEditingInvestment(false); }}
                                                className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
                                            >
                                                <X className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {[25, 50, 100, 200, 500].map((preset) => (
                                                <button
                                                    key={preset}
                                                    onClick={() => setTempInvestment(preset)}
                                                    className={cn(
                                                        'flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                                                        tempInvestment === preset
                                                            ? 'bg-primary/15 text-primary border border-primary/30'
                                                            : 'bg-secondary/40 text-muted-foreground border border-transparent hover:bg-secondary/60'
                                                    )}
                                                >
                                                    ${preset}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="display"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-between"
                                    >
                                        <button
                                            onClick={() => { setTempInvestment(weeklyInvestment); setEditingInvestment(true); }}
                                            className="flex items-center gap-2 group"
                                        >
                                            <span className="text-xs text-muted-foreground">Plan:</span>
                                            <span className="text-sm font-bold text-primary">${weeklyInvestment}</span>
                                            <span
                                                className="text-[11px] text-muted-foreground/60 cursor-pointer hover:text-muted-foreground transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setInvestmentFrequency(investmentFrequency === 'weekly' ? 'monthly' : 'weekly');
                                                }}
                                            >
                                                /{investmentFrequency === 'weekly' ? 'week' : 'month'}
                                            </span>
                                            <Edit3 className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        </button>
                                        {weeklyDepositStreak === 0 && (
                                            <span className="text-[11px] text-muted-foreground/50">tap to edit</span>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <button
                            className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/5 transition-all"
                            onClick={() => navigate('/portfolio')}
                        >
                            Set Up Weekly Investment
                            <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                        </button>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Full dashboard
    return (
        <div className="space-y-4">
            {/* Value Card */}
            <Card
                className="overflow-hidden border-none"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))' }}
            >
                <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Total Portfolio
                        </p>
                        <button onClick={() => setHideBalance(!hideBalance)}>
                            {hideBalance ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                            )}
                        </button>
                    </div>
                    <div className="flex items-end gap-3 mb-1">
                        <span className="text-3xl font-bold">
                            {hideBalance ? '•••••' : `$${estimatedValue.toFixed(2)}`}
                        </span>
                        {simulatedGain > 0 && !hideBalance && (
                            <span className="text-sm text-green-400 font-medium flex items-center gap-1 mb-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                +${simulatedGain.toFixed(2)} ({gainPercent}%)
                            </span>
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="p-3 rounded-xl bg-secondary/30">
                            <p className="text-[11px] text-muted-foreground">Invested</p>
                            <p className="text-sm font-bold">{hideBalance ? '•••' : `$${totalDeposited.toLocaleString()}`}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/30">
                            <p className="text-[11px] text-muted-foreground">Deposits</p>
                            <p className="text-sm font-bold">{weeklyDepositHistory.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/30">
                            <p className="text-[11px] text-muted-foreground">Streak</p>
                            <p className="text-sm font-bold flex items-center gap-1">
                                {weeklyDepositStreak}w
                                {weeklyDepositStreak > 0 && <Flame className="w-3 h-3 text-orange-400" />}
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    {growthData.length > 2 && totalDeposited > 0 && (
                        <div className="mt-4 h-[100px] -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="fullGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a2e', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#fullGrad)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="invested" stroke="#4ade80" fillOpacity={0} strokeDasharray="5 5" strokeWidth={1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent deposits with edit/delete */}
            {weeklyDepositHistory.length > 0 && (
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs font-semibold mb-3">Recent Deposits</p>
                        <div className="space-y-2">
                            {[...weeklyDepositHistory].reverse().slice(0, 5).map((deposit) => (
                                <div key={deposit.weekId} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20">
                                    <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                        <DollarSign className="w-3.5 h-3.5 text-green-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium">{deposit.weekId}</p>
                                        {editingWeekId === deposit.weekId ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(Number(e.target.value))}
                                                    className="w-20 px-2 py-1 rounded bg-secondary text-xs border border-border"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleEditSave(deposit.weekId)} className="text-green-500">
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setEditingWeekId(null)} className="text-muted-foreground">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {deposit.allocations.slice(0, 3).map((a) => (
                                                    <span key={a.asset} className="text-[11px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                                        {a.asset} ${a.amount.toFixed(0)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {editingWeekId !== deposit.weekId && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs font-bold text-green-400">+${deposit.amount}</span>
                                            <button
                                                onClick={() => { setEditingWeekId(deposit.weekId); setEditValue(deposit.amount); }}
                                                className="p-1 rounded-md hover:bg-secondary"
                                            >
                                                <Edit3 className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => removeDeposit(deposit.weekId)}
                                                className="p-1 rounded-md hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-400/60" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
