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
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5 animate-pulse">
        <div className="h-5 bg-zinc-700 rounded w-48 mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-zinc-700 rounded w-full" />
          <div className="h-4 bg-zinc-700 rounded w-3/4" />
          <div className="h-4 bg-zinc-700 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">📋</span>
        <h3 className="text-sm font-semibold text-white">Briefing do Dia</h3>
      </div>

      {/* Summary */}
      {briefing.summary && (
        <p className="text-sm text-zinc-200 font-medium">
          {briefing.summary}
        </p>
      )}

      {/* Sections */}
      <div className="space-y-2">
        {briefing.market && (
          <div className="flex items-start gap-2">
            <span className="text-xs mt-0.5">📊</span>
            <p className="text-xs text-zinc-300">{briefing.market}</p>
          </div>
        )}

        {briefing.portfolio && (
          <div className="flex items-start gap-2">
            <span className="text-xs mt-0.5">💼</span>
            <p className="text-xs text-zinc-300">{briefing.portfolio}</p>
          </div>
        )}

        {briefing.next_action && (
          <div className="flex items-start gap-2">
            <span className="text-xs mt-0.5">✅</span>
            <p className="text-xs text-zinc-300">{briefing.next_action}</p>
          </div>
        )}

        {briefing.tip && (
          <div className="flex items-start gap-2 bg-zinc-800/50 rounded-lg p-2 mt-2">
            <span className="text-xs mt-0.5">💡</span>
            <p className="text-xs text-amber-300/90">{briefing.tip}</p>
          </div>
        )}
      </div>

      {/* Actionable CTA */}
      {briefing.next_action && (
        <button
          onClick={() => navigate('/dca-planner')}
          className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 active:scale-[0.98]"
        >
          {briefing.next_action}
        </button>
      )}

      {/* Motivation */}
      {briefing.motivation && (
        <p className="text-xs text-zinc-500 italic text-center pt-1 border-t border-zinc-700/50">
          {briefing.motivation}
        </p>
      )}
    </div>
  );
}
