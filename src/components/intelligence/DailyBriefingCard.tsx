import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';

export function DailyBriefingCard() {
  const { briefing, fetchBriefing, isLoading } = useMarketIntelligence();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  if (isLoading && !briefing) {
    return (
      <div className="glass-card rounded-xl p-5 animate-pulse">
        <div className="h-5 bg-secondary/40 rounded w-48 mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-secondary/40 rounded w-full" />
          <div className="h-4 bg-secondary/40 rounded w-3/4" />
          <div className="h-4 bg-secondary/40 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">📋</span>
        <h3 className="text-sm font-semibold text-white">Briefing do Dia</h3>
      </div>

      {/* Summary */}
      {briefing.summary && (
        <p className="text-sm text-foreground font-medium">
          {briefing.summary}
        </p>
      )}

      {/* Sections */}
      <div className="space-y-2">
        {briefing.market && (
          <div className="flex items-start gap-2">
            <span className="text-xs mt-0.5">📊</span>
            <p className="text-xs text-foreground/80">{briefing.market}</p>
          </div>
        )}

        {briefing.portfolio && (
          <div className="flex items-start gap-2">
            <span className="text-xs mt-0.5">💼</span>
            <p className="text-xs text-foreground/80">{briefing.portfolio}</p>
          </div>
        )}

        {briefing.next_action && (
          <div className="flex items-start gap-2">
            <span className="text-xs mt-0.5">✅</span>
            <p className="text-xs text-foreground/80">{briefing.next_action}</p>
          </div>
        )}

        {briefing.tip && (
          <div className="flex items-start gap-2 glass-light rounded-lg p-2 mt-2">
            <span className="text-xs mt-0.5">💡</span>
            <p className="text-xs text-amber-300/90">{briefing.tip}</p>
          </div>
        )}
      </div>

      {/* Actionable CTA */}
      {briefing.next_action && (
        <button
          onClick={() => navigate('/dca-planner')}
          className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all glass-light text-primary border-primary/20 hover:bg-primary/15 press-scale"
        >
          {briefing.next_action}
        </button>
      )}

      {/* Motivation */}
      {briefing.motivation && (
        <p className="text-xs text-muted-foreground italic text-center pt-1 border-t border-border/30">
          {briefing.motivation}
        </p>
      )}
    </div>
  );
}
