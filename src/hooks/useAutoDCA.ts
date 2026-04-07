import { useEffect, useRef, useCallback } from 'react';
import { getNextExecutionDate } from '@/lib/dca';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/components/AuthProvider';
import { useDCAExecution } from './useDCAExecution';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

/**
 * Auto-executes DCA plans that are due (nextExecutionDate <= now).
 * Runs on mount + every 5 minutes. Sends results to notification center.
 */
export function useAutoDCA() {
  const { user } = useAuth();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const updateDcaPlan = useAppStore((s) => s.updateDcaPlan);
  const addNotification = useAppStore((s) => s.addNotification);
  const { executePlan, isExecuting } = useDCAExecution();
  const executingRef = useRef(false);
  const lastCheckRef = useRef(0);

  const checkAndExecuteDuePlans = useCallback(async () => {
    if (!user || executingRef.current) return;

    const now = Date.now();
    // Debounce: don't check more than once per minute
    if (now - lastCheckRef.current < 60_000) return;
    lastCheckRef.current = now;

    const duePlans = dcaPlans.filter((plan) => {
      if (!plan.isActive) return false;
      if (!plan.nextExecutionDate) return false;
      const nextDate = new Date(plan.nextExecutionDate).getTime();
      return nextDate <= now;
    });

    if (duePlans.length === 0) return;

    executingRef.current = true;

    for (const plan of duePlans) {
      try {
        const result = await executePlan(plan.id, {
          id: plan.id,
          assets: plan.assets,
          amountPerInterval: plan.amountPerInterval,
          frequency: plan.frequency,
        });

        if (result) {
          updateDcaPlan(plan.id, {
            totalInvested: (plan.totalInvested ?? 0) + result.totalSpent,
            nextExecutionDate: getNextExecutionDate(plan.frequency),
          });

          const successCount = result.executions.filter(e => e.status === 'success').length;
          const failCount = result.executions.filter(e => e.status === 'failed').length;
          const assets = result.executions.map(e => e.asset).join(', ');

          if (successCount > 0 && failCount === 0) {
            addNotification({
              type: 'success',
              category: 'dca',
              title: 'DCA executado',
              message: `$${result.totalSpent.toFixed(2)} investidos em ${assets}`,
              actionRoute: '/portfolio',
              actionLabel: 'Ver portfólio',
            });
          } else if (successCount > 0 && failCount > 0) {
            addNotification({
              type: 'warning',
              category: 'dca',
              title: 'Execução parcial',
              message: `${successCount} ativos executados e ${failCount} falharam. Revise o Planejador DCA.`,
              actionRoute: '/dca-planner',
              actionLabel: 'Ver detalhes',
            });
          } else {
            const firstError = result.executions.find(e => e.error)?.error || 'Erro desconhecido';
            const isPermError = firstError.toLowerCase().includes('permission') ||
                               firstError.toLowerCase().includes('invalid api');
            addNotification({
              type: 'error',
              category: 'dca',
              title: 'Falha no DCA',
              message: isPermError
                ? 'A chave da API não tem permissão de Trade (Spot). Atualize em Configurações > Conexão Bybit.'
                : firstError,
              actionRoute: isPermError ? '/settings' : '/dca-planner',
              actionLabel: isPermError ? 'Corrigir configuração' : 'Ver detalhes',
            });
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'A execução automática falhou de forma inesperada.';
        addNotification({
          type: 'error',
          category: 'dca',
          title: 'Erro no DCA',
          message,
          actionRoute: '/dca-planner',
          actionLabel: 'Revisar planos',
        });
      }
    }

    executingRef.current = false;
  }, [user, dcaPlans, executePlan, addNotification, updateDcaPlan]);

  // Run on mount and when plans change
  useEffect(() => {
    if (!user) return;

    // Initial check after short delay (let app settle)
    const initialTimer = setTimeout(() => {
      checkAndExecuteDuePlans();
    }, 3000);

    // Periodic check
    const interval = setInterval(() => {
      checkAndExecuteDuePlans();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user, checkAndExecuteDuePlans]);

  return { checkAndExecuteDuePlans, isExecuting };
}
