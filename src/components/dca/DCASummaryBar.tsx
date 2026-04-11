import { motion } from 'framer-motion';
import { DollarSign, Calendar, Zap, Clock } from 'lucide-react';
import { useDCAStats } from '@/hooks/useDCAStats';
import { cn } from '@/lib/utils';

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) return 'Due now';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'in <1h';
  if (diffHours < 24) return `in ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `in ${diffDays}d`;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
  delay: number;
}

function StatCard({ icon, label, value, colorClass, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3',
        'bg-white/5 backdrop-blur-md border border-white/10',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          colorClass,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-white/50 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
      </div>
    </motion.div>
  );
}

export function DCASummaryBar() {
  const { totalInvested, monthlyCommitment, activeCount, nextExecution } =
    useDCAStats();

  const stats: Omit<StatCardProps, 'delay'>[] = [
    {
      icon: <DollarSign className="h-4 w-4 text-emerald-400" />,
      label: 'Total Invested',
      value: totalInvested > 0 ? formatUsd(totalInvested) : '\u2014',
      colorClass: 'bg-emerald-500/20',
    },
    {
      icon: <Calendar className="h-4 w-4 text-blue-400" />,
      label: 'Monthly',
      value: monthlyCommitment > 0 ? formatUsd(monthlyCommitment) : '\u2014',
      colorClass: 'bg-blue-500/20',
    },
    {
      icon: <Zap className="h-4 w-4 text-violet-400" />,
      label: 'Active Plans',
      value: activeCount > 0 ? String(activeCount) : '\u2014',
      colorClass: 'bg-violet-500/20',
    },
    {
      icon: <Clock className="h-4 w-4 text-amber-400" />,
      label: 'Next Execution',
      value: relativeTime(nextExecution),
      colorClass: 'bg-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} delay={i * 0.07} />
      ))}
    </div>
  );
}
