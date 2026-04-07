import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketIntelligence, type SmartAlert } from '@/hooks/useMarketIntelligence';

const ALERT_ICONS: Record<string, string> = {
  opportunity: '💰',
  rebalance: '⚖️',
  milestone: '🏆',
  regime_change: '🔄',
  risk: '⚠️',
  education: '📚',
  strategy_graduation: '🎓',
  streak: '🔥',
};

const SEVERITY_STYLES: Record<string, string> = {
  info: 'border-l-blue-500 bg-blue-500/5',
  warning: 'border-l-yellow-500 bg-yellow-500/5',
  critical: 'border-l-red-500 bg-red-500/5',
  celebration: 'border-l-green-500 bg-green-500/5',
};

interface SmartAlertsListProps {
  maxAlerts?: number;
  compact?: boolean;
}

export function SmartAlertsList({ maxAlerts = 5, compact = false }: SmartAlertsListProps) {
  const { alerts, fetchAlerts, markAlertRead, markAlertActed, dismissAlert } = useMarketIntelligence();
  const navigate = useNavigate();

  useEffect(() => {
    try { fetchAlerts(); } catch { /* intelligence system not yet deployed */ }
  }, [fetchAlerts]);

  const visibleAlerts = (alerts || []).slice(0, maxAlerts);

  if (visibleAlerts.length === 0) {
    return compact ? null : (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 text-center">No alerts right now</p>
      </div>
    );
  }

  const handleAlertClick = async (alert: SmartAlert) => {
    if (!alert.is_read) {
      await markAlertRead(alert.id);
    }
    if (alert.action_route) {
      await markAlertActed(alert.id);
      navigate(alert.action_route);
    }
  };

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <span>🔔</span> Smart Alerts
          </h3>
          <span className="text-xs text-zinc-500">{visibleAlerts.length} alert(s)</span>
        </div>
      )}

      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`
            border-l-2 rounded-r-lg p-3 cursor-pointer
            transition-all hover:bg-secondary/30
            ${SEVERITY_STYLES[alert.severity]}
            ${alert.is_read ? 'opacity-70' : ''}
          `}
          onClick={() => handleAlertClick(alert)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="text-sm mt-0.5 flex-shrink-0">
                {ALERT_ICONS[alert.alert_type] || '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${alert.is_read ? 'text-zinc-400' : 'text-white'}`}>
                  {alert.title}
                </p>
                {!compact && (
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                    {alert.message}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
              className="text-zinc-600 hover:text-zinc-400 text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {alert.action_label && !compact && (
            <button
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium"
              onClick={(e) => { e.stopPropagation(); handleAlertClick(alert); }}
            >
              {alert.action_label} →
            </button>
          )}

          <p className="text-[10px] text-zinc-600 mt-1">
            {new Date(alert.created_at).toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
