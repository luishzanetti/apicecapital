import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';

/** Frequency to approximate monthly multiplier */
const MONTHLY_MULTIPLIER: Record<string, number> = {
  daily: 30,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
};

export function useDCAStats() {
  const dcaPlans = useAppStore((s) => s.dcaPlans);

  return useMemo(() => {
    const activePlans = dcaPlans.filter((p) => p.isActive);

    const totalInvested = dcaPlans.reduce(
      (sum, p) => sum + (p.totalInvested ?? 0),
      0,
    );

    const monthlyCommitment = activePlans.reduce((sum, p) => {
      const mult = MONTHLY_MULTIPLIER[p.frequency] ?? 1;
      return sum + p.amountPerInterval * mult;
    }, 0);

    const nextExecution =
      activePlans
        .map((p) => p.nextExecutionDate)
        .filter(Boolean)
        .sort()[0] || null;

    return {
      allPlans: dcaPlans,
      activePlans,
      activeCount: activePlans.length,
      totalInvested,
      monthlyCommitment,
      nextExecution,
    };
  }, [dcaPlans]);
}
