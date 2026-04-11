import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';
import type { BuyingStrategy } from '@/types/explosive';

interface ExplosiveBuyStrategyProps {
  strategy: BuyingStrategy;
}

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
  dca: { label: 'DCA', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  lump_dip: { label: 'Buy the Dip', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  scaled_entry: { label: 'Scaled Entry', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

const HORIZON_LABELS: Record<string, string> = {
  '3-6m': '3-6 months',
  '6-12m': '6-12 months',
  '1-2y': '1-2 years',
};

export function ExplosiveBuyStrategy({ strategy }: ExplosiveBuyStrategyProps) {
  const method = METHOD_LABELS[strategy.method] || METHOD_LABELS.dca;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Buying Strategy</p>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-secondary/30 p-2.5 text-center">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${method.color}`}>
            {method.label}
          </Badge>
        </div>

        <div className="rounded-xl bg-secondary/30 p-2.5 text-center">
          <DollarSign className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs font-bold text-foreground">{strategy.suggestedAllocation}%</p>
          <p className="text-[9px] text-muted-foreground">allocation</p>
        </div>

        <div className="rounded-xl bg-secondary/30 p-2.5 text-center">
          <Clock className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-[10px] font-medium text-foreground">{HORIZON_LABELS[strategy.timeHorizon]}</p>
          <p className="text-[9px] text-muted-foreground">horizon</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/80 leading-relaxed">{strategy.rationale}</p>
    </div>
  );
}
