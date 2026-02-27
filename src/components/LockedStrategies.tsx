import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { lockedStrategies } from '@/data/sampleData';
import { Lock, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LockedStrategies() {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Upcoming Strategies</h3>
                <Badge variant="secondary" className="text-[9px]">
                    Coming Soon
                </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground -mt-1">
                Unlock advanced strategies as you evolve in Apice
            </p>

            <div className="space-y-3">
                {lockedStrategies.map((strategy, i) => (
                    <motion.div
                        key={strategy.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <Card className="overflow-hidden border-border/50 opacity-80 hover:opacity-100 transition-opacity">
                            <div
                                className="h-1"
                                style={{
                                    background: `linear-gradient(90deg, ${strategy.gradient.includes('blue') ? '#3b82f6' : strategy.gradient.includes('purple') ? '#a855f7' : strategy.gradient.includes('amber') ? '#f59e0b' : '#22c55e'}, transparent)`,
                                    opacity: 0.5,
                                }}
                            />
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
                                        {strategy.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-semibold">{strategy.name}</h4>
                                            <Lock className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                                            {strategy.description}
                                        </p>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3 text-green-400" />
                                                <span className="text-[10px] text-green-400 font-medium">{strategy.expectedReturn}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Shield className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">{strategy.risk}</span>
                                            </div>
                                        </div>

                                        {/* Unlock requirements */}
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                                                To unlock:
                                            </p>
                                            {strategy.unlockRequirements.map((req, j) => (
                                                <div key={j} className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                                    <span className="text-[10px] text-muted-foreground">{req}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
