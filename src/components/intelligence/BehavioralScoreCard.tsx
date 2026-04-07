import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';

const SCORE_LEVELS = [
  { min: 0, max: 30, label: 'Iniciante', color: '#ef4444', emoji: '🌱' },
  { min: 31, max: 50, label: 'Aprendiz', color: '#f97316', emoji: '📈' },
  { min: 51, max: 70, label: 'Consistente', color: '#eab308', emoji: '⭐' },
  { min: 71, max: 85, label: 'Disciplinado', color: '#22c55e', emoji: '💪' },
  { min: 86, max: 100, label: 'Mestre Apice', color: '#8b5cf6', emoji: '👑' },
];

interface ScoreDimension {
  label: string;
  value: number;
  weight: string;
  color: string;
}

export function BehavioralScoreCard() {
  const { userIntel } = useMarketIntelligence();

  if (!userIntel) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-zinc-800 rounded w-36 mb-3" />
        <div className="h-24 bg-zinc-800 rounded" />
      </div>
    );
  }

  const score = userIntel.behavioral_score;
  const level = SCORE_LEVELS.find(l => score >= l.min && score <= l.max) || SCORE_LEVELS[0];

  const dimensions: ScoreDimension[] = [
    { label: 'Consistência', value: userIntel.consistency_score, weight: '30%', color: '#3b82f6' },
    { label: 'Disciplina', value: userIntel.discipline_score, weight: '25%', color: '#8b5cf6' },
    { label: 'Conhecimento', value: userIntel.knowledge_score, weight: '20%', color: '#22c55e' },
    { label: 'Engajamento', value: userIntel.engagement_score, weight: '15%', color: '#f97316' },
    { label: 'Comprometimento', value: userIntel.capital_commitment_score, weight: '10%', color: '#eab308' },
  ];

  const executionRate = userIntel.total_dca_executed + userIntel.total_dca_skipped > 0
    ? Math.round(userIntel.total_dca_executed / (userIntel.total_dca_executed + userIntel.total_dca_skipped) * 100)
    : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      {/* Header with score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{level.emoji}</span>
          <div>
            <h3 className="text-sm font-medium text-white">Score Comportamental</h3>
            <p className="text-xs text-zinc-500">{level.label}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold" style={{ color: level.color }}>
            {score}
          </span>
          <span className="text-xs text-zinc-500">/100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, backgroundColor: level.color }}
        />
      </div>

      {/* Dimensions breakdown */}
      <div className="space-y-2">
        {dimensions.map((dim) => (
          <div key={dim.label} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 w-24 flex-shrink-0">{dim.label}</span>
            <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${dim.value}%`, backgroundColor: dim.color }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 w-8 text-right">{dim.value}</span>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{userIntel.current_streak_weeks}</p>
          <p className="text-[10px] text-zinc-500">Semanas streak</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{executionRate}%</p>
          <p className="text-[10px] text-zinc-500">Taxa execução</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{userIntel.confidence_index}</p>
          <p className="text-[10px] text-zinc-500">Confiança</p>
        </div>
      </div>

      {/* Evolved profile indicator */}
      {userIntel.evolved_investor_type && userIntel.evolved_investor_type !== userIntel.original_investor_type && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2">
          <p className="text-xs text-purple-300">
            🎓 Perfil evoluiu: <span className="line-through text-zinc-500">{userIntel.original_investor_type}</span>{' '}
            → <span className="font-medium">{userIntel.evolved_investor_type}</span>
          </p>
        </div>
      )}
    </div>
  );
}
