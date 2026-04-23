import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { useApexAiPortfolios } from '@/hooks/useApexAiData';
import {
  Bot,
  Plus,
  ArrowRight,
  TrendingUp,
  Wallet,
  Sparkles,
} from 'lucide-react';
import type { ApexAiPortfolio, ApexAiPortfolioStatus } from '@/types/apexAi';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Lista de portfolios do usuário
// ═════════════════════════════════════════════════════════════════

export default function ApexAiPortfolios() {
  const nav = useNavigate();
  const setActiveId = useAppStore((s) => s.setApexAiActivePortfolio);
  const { data: portfolios, isLoading } = useApexAiPortfolios();

  function selectPortfolio(id: string) {
    setActiveId(id);
    nav('/apex-ai/dashboard');
  }

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Seus bots Apex AI</h1>
          <p className="text-xs text-muted-foreground">
            {portfolios?.length ?? 0} portfolio{(portfolios?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          onClick={() => nav('/apex-ai/onboarding')}
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo bot
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16 text-muted-foreground text-sm">Carregando…</div>
      )}

      {/* Empty */}
      {!isLoading && (!portfolios || portfolios.length === 0) && (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Nenhum bot ainda</p>
              <p className="text-sm text-muted-foreground">
                Crie seu primeiro Apex AI em menos de 5 minutos.
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              onClick={() => nav('/apex-ai/onboarding')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Criar primeiro bot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {portfolios && portfolios.length > 0 && (
        <div className="space-y-3">
          {portfolios.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PortfolioCard portfolio={p} onSelect={() => selectPortfolio(p.id)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioCard({
  portfolio,
  onSelect,
}: {
  portfolio: ApexAiPortfolio;
  onSelect: () => void;
}) {
  const pnl = Number(portfolio.total_pnl);
  const totalTrades = portfolio.win_count + portfolio.loss_count;
  const winRate = totalTrades > 0 ? (portfolio.win_count / totalTrades) * 100 : 0;

  return (
    <Card className="border-border/50 hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">{portfolio.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={portfolio.status} />
                <span className="text-xs text-muted-foreground capitalize">{portfolio.risk_profile}</span>
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <Stat
            label="P&L"
            value={`${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}`}
            colorClass={pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-foreground'}
          />
          <Stat label="Capital" value={`$${portfolio.capital_usdt.toLocaleString()}`} />
          <Stat
            label="Win rate"
            value={`${winRate.toFixed(0)}%`}
            colorClass={winRate >= 50 ? 'text-emerald-400' : 'text-foreground'}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, colorClass = 'text-foreground' }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ApexAiPortfolioStatus }) {
  const config: Record<ApexAiPortfolioStatus, { label: string; className: string }> = {
    active: { label: 'Ativo', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    paused: { label: 'Pausado', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    stopped: { label: 'Parado', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    error: { label: 'Erro', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    circuit_breaker: { label: 'Circuit', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  };
  const c = config[status];
  return <Badge className={c.className}>{c.label}</Badge>;
}
