import type { DCAPlan } from '@/store/types';

export type DCAFrequency = DCAPlan['frequency'];

const FREQUENCY_INTERVAL_MS: Record<DCAFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  biweekly: 14 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export function getFrequencyIntervalMs(frequency: DCAFrequency): number {
  return FREQUENCY_INTERVAL_MS[frequency] ?? FREQUENCY_INTERVAL_MS.weekly;
}

export function getNextExecutionDate(
  frequency: DCAFrequency,
  from: Date | string = new Date()
): string {
  const baseDate = typeof from === 'string' ? new Date(from) : from;
  return new Date(baseDate.getTime() + getFrequencyIntervalMs(frequency)).toISOString();
}
