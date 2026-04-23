import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { useApexAiPortfolios, useApexAiTrades } from '@/hooks/useApexAiData';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Filter,
} from 'lucide-react';
import type { ApexAiTrade } from '@/types/apexAi';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Statements / Histórico de trades
// ═════════════════════════════════════════════════════════════════

type FilterTab = 'all' | 'profit' | 'loss';

export default function ApexAiStatements() {
  const nav = useNavigate();
  const activeId = useAppStore((s) => s.apexAiActivePortfolioId);
  const { data: portfolios } = useApexAiPortfolios();

  const currentId = activeId ?? portfolios?.[0]?.id ?? null;
  const { data: trades, isLoading } = useApexAiTrades(currentId, 200);

  const [filter, setFilter] = useState<FilterTab>('all');

  const filteredTrades = (trades ?? []).filter((t) => {
    const pnl = Number(t.net_pnl ?? t.pnl);
    if (filter === 'profit') return pnl > 0;
    if (filter === 'loss') return pnl <= 0;
    return true;
  });

  const totalPnl = filteredTrades.reduce((sum, t) => sum + Number(t.net_pnl ?? t.pnl), 0);
  const totalFees = filteredTrades.reduce((sum, t) => sum + Number(t.gas_fee), 0);

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => nav('/apex-ai/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Statements</h1>
          <p className="text-xs text-muted-foreground">Histórico completo de trades</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className="text-sm font-bold">{filteredTrades.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Net P&L</p>
            <p className={`text-sm font-bold ${totalPnl > 0 ? 'text-emerald-400' : totalPnl < 0 ? 'text-red-400' : 'text-foreground'}`}>
              {totalPnl > 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Fees pagas</p>
            <p className="text-sm font-bold">${totalFees.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          Todos
        </FilterChip>
        <FilterChip active={filter === 'profit'} onClick={() => setFilter('profit')}>
          Lucro
        </FilterChip>
        <FilterChip active={filter === 'loss'} onClick={() => setFilter('loss')}>
          Prejuízo
        </FilterChip>
      </div>

      {/* List */}
      {isLoading && (
        <div className="text-center py-10 text-sm text-muted-foreground">Carregando…</div>
      )}

      {!isLoading && filteredTrades.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {filter === 'all'
                ? 'Nenhum trade ainda. Ative o bot para começar.'
                : `Nenhum trade ${filter === 'profit' ? 'com lucro' : 'com prejuízo'} neste portfolio.`}
            </p>
          </CardContent>
        </Card>
      )}

      {filteredTrades.length > 0 && (
        <div className="space-y-2">
          {filteredTrades.map((t) => (
            <TradeItem key={t.id} trade={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

function TradeItem({ trade }: { trade: ApexAiTrade }) {
  const pnl = Number(trade.net_pnl ?? trade.pnl);
  const grossPnl = Number(trade.pnl);
  const isProfit = pnl > 0;
  const closedAt = new Date(trade.closed_at);
  const entryExit = ((Number(trade.exit_price) / Number(trade.entry_price) - 1) * 100).toFixed(2);

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{trade.symbol.replace('USDT', '')}</span>
              <span className="text-xs text-muted-foreground">
                {trade.side.toUpperCase()} · {trade.leverage}x
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              {closedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' · '}
              {closedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              <span>
                Entrada: ${Number(trade.entry_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
              <span>→</span>
              <span>
                Saída: ${Number(trade.exit_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
              <span className={isProfit ? 'text-emerald-400' : 'text-red-400'}>
                {isProfit ? '+' : ''}{entryExit}%
              </span>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <p className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}${pnl.toFixed(2)}
            </p>
            {Number(trade.gas_fee) > 0 && (
              <p className="text-xs text-muted-foreground">
                bruto ${grossPnl.toFixed(2)}
              </p>
            )}
            {Number(trade.gas_fee) > 0 && (
              <p className="text-[10px] text-muted-foreground">
                fee 10% = ${Number(trade.gas_fee).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
