import { useEffect, useState } from 'react';

const STORAGE_KEY = 'apice.analytics.portfolio_history.v1';
const MAX_SNAPSHOTS = 90;

export interface PortfolioSnapshot {
  date: string;
  totalValue: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
}

function loadSnapshots(): PortfolioSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_SNAPSHOTS);
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: PortfolioSnapshot[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots.slice(-MAX_SNAPSHOTS)));
  } catch {
    // localStorage full or disabled — ignore
  }
}

interface AppendOptions {
  totalValue: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
  /** When true, force-add a new snapshot even if one exists for today */
  force?: boolean;
}

/**
 * Persists daily portfolio snapshots in localStorage to power evolution charts.
 * Captures at most 1 snapshot per day; rolling window of 90 days.
 */
export function usePortfolioHistory() {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>(() => loadSnapshots());

  const appendSnapshot = (opts: AppendOptions) => {
    const today = new Date().toISOString().slice(0, 10);
    const next: PortfolioSnapshot = {
      date: today,
      totalValue: Math.round(opts.totalValue * 100) / 100,
      invested: Math.round(opts.invested * 100) / 100,
      pnl: Math.round(opts.pnl * 100) / 100,
      pnlPercent: Math.round(opts.pnlPercent * 100) / 100,
    };

    setSnapshots((prev) => {
      const last = prev[prev.length - 1];
      if (!opts.force && last?.date === today) {
        const updated = [...prev.slice(0, -1), next];
        saveSnapshots(updated);
        return updated;
      }
      const updated = [...prev, next];
      saveSnapshots(updated);
      return updated;
    });
  };

  return { snapshots, appendSnapshot };
}

interface CaptureOptions {
  enabled: boolean;
  totalValue: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
}

/** Convenience helper that captures a snapshot on mount when enabled. */
export function usePortfolioSnapshotCapture(opts: CaptureOptions) {
  const { snapshots, appendSnapshot } = usePortfolioHistory();

  useEffect(() => {
    if (!opts.enabled) return;
    if (opts.totalValue <= 0 && opts.invested <= 0) return;
    appendSnapshot({
      totalValue: opts.totalValue,
      invested: opts.invested,
      pnl: opts.pnl,
      pnlPercent: opts.pnlPercent,
    });
    // We only want this to run once per mount/render cycle when inputs stabilise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, Math.round(opts.totalValue), Math.round(opts.invested)]);

  return snapshots;
}
