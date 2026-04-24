import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap,
  Award,
} from 'lucide-react';
import { useApexAiReserveFund, useApexAiReserveEvents } from '@/hooks/useApexAiV2Data';
import type { ApexAiReserveEventType } from '@/types/apexAi';

/**
 * ApexAiReserveFundWidget — Smart Reserve Protocol UI
 *
 * Per backtest v2 spec: shows reserve fund balance + 4 deploy mechanisms.
 * 10% of each profitable cycle auto-contributed; reserve protects against
 * liquidation, helps strategic close, funds emergency layers, and pays
 * consistency bonus.
 */
export function ApexAiReserveFundWidget({ portfolioId }: { portfolioId: string }) {
  const { data: fund } = useApexAiReserveFund(portfolioId);
  const { data: events = [] } = useApexAiReserveEvents(portfolioId, 5);

  if (!fund) return null;

  const balance = Number(fund.balance_usdt);
  const lifetimeContribs = Number(fund.lifetime_contributions);
  const lifetimeDeploys = Number(fund.lifetime_deploys);
  const netGain = lifetimeContribs - lifetimeDeploys;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-background to-background relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(124,58,237,0.12), transparent 50%)',
          }}
        />

        <CardContent className="p-5 relative space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-base">Smart Reserve Protocol</h3>
                  <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px]">
                    Apice exclusive
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fund.contribution_pct}% of each cycle profit auto-saved for protection
                </p>
              </div>
            </div>
          </div>

          {/* Balance hero */}
          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-violet-400 font-bold mb-1">
              Current reserve balance
            </p>
            <p className="text-3xl font-bold">
              <span className="text-violet-300">$</span>
              {balance.toFixed(2)}
              <span className="text-base text-muted-foreground font-normal ml-1">USDT</span>
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px]">
              <span className="text-emerald-400">
                +${lifetimeContribs.toFixed(2)} earned
              </span>
              <span className="text-rose-400">
                −${lifetimeDeploys.toFixed(2)} deployed
              </span>
              <span className="text-muted-foreground">
                = ${netGain.toFixed(2)} net
              </span>
            </div>
          </div>

          {/* 4 deploy mechanisms */}
          <div className="grid grid-cols-2 gap-2">
            <DeployCard
              icon={AlertTriangle}
              title="Liquidation protection"
              description="Inject 5% of position cost when drawdown > 80% CB tol"
              color="text-rose-400"
              bg="bg-rose-500/5"
              border="border-rose-500/20"
            />
            <DeployCard
              icon={Clock}
              title="Strategic close"
              description="Cover 50% of loss for cycles >45d with 8+ layers"
              color="text-amber-400"
              bg="bg-amber-500/5"
              border="border-amber-500/20"
            />
            <DeployCard
              icon={Zap}
              title="Emergency layer"
              description="2× base size extra layer when max reached"
              color="text-violet-400"
              bg="bg-violet-500/5"
              border="border-violet-500/20"
            />
            <DeployCard
              icon={Award}
              title="Consistency bonus"
              description="20% released to user after 90 positive days"
              color="text-emerald-400"
              bg="bg-emerald-500/5"
              border="border-emerald-500/20"
            />
          </div>

          {/* Recent events */}
          {events.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 text-violet-400" />
                <span className="font-semibold">Recent reserve activity</span>
              </div>
              <div className="space-y-1">
                {events.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-muted/30"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {eventIcon(e.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {e.event_type.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[11px] font-bold ml-auto ${
                            e.event_type === 'contribution'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {e.event_type === 'contribution' ? '+' : '−'}$
                          {Number(e.amount_usdt).toFixed(2)}
                        </span>
                      </div>
                      {e.rationale && (
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                          {e.rationale}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fund.consecutive_positive_days > 0 && (
            <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2 flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                <span className="text-emerald-400 font-semibold">
                  {fund.consecutive_positive_days} consecutive positive days.
                </span>{' '}
                {fund.consecutive_positive_days >= 90
                  ? 'Bonus eligible!'
                  : `${90 - fund.consecutive_positive_days} more for consistency bonus.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DeployCard({
  icon: Icon,
  title,
  description,
  color,
  bg,
  border,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-md p-2.5 ${bg} ${border} border`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>
          {title}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">{description}</p>
    </div>
  );
}

function eventIcon(type: ApexAiReserveEventType): React.ReactNode {
  switch (type) {
    case 'contribution':
      return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    case 'protection_deploy':
      return <AlertTriangle className="w-3 h-3 text-rose-400" />;
    case 'strategic_close':
      return <Clock className="w-3 h-3 text-amber-400" />;
    case 'emergency_layer':
      return <Zap className="w-3 h-3 text-violet-400" />;
    case 'consistency_bonus':
      return <Award className="w-3 h-3 text-emerald-400" />;
    default:
      return <Shield className="w-3 h-3 text-muted-foreground" />;
  }
}
