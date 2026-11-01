/**
 * Formatting and color tokens for FinSight Analytics
 * Concept C: Modern FinTech / Editorial
 */

export function formatCurrency(amount: number | null | undefined, compact: boolean = false): string {
  if (amount == null || isNaN(amount)) return '$0';

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 1_000_000) {
      return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `${sign}$${(abs / 1_000).toFixed(1)}k`;
    }
    return `${sign}$${Math.round(abs).toLocaleString()}`;
  }

  return `$${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPercentage(percent: number | null | undefined): string {
  if (percent == null || isNaN(percent)) return 'N/A';
  return `${Number(percent).toFixed(1)}%`;
}

/**
 * Format 'YYYY-MM' to readable month 'MMM YYYY' (e.g. '2024-05' -> 'May 2024')
 */
export function formatMonthLabel(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1;
  const date = new Date(Date.UTC(year, month, 1));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Chart color palette for Concept C: Modern FinTech / Editorial
 */
export const ANALYTICS_COLORS = {
  electricIndigo: '#4F46E5',
  midnightNavy: '#111322',
  softLavender: '#EEF2FF',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  cyan: '#0EA5E9',
  violet: '#8B5CF6',
  slate: '#64748B',
  palette: [
    '#4F46E5', // Electric Indigo
    '#0EA5E9', // Cyan / Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple / Violet
    '#F43F5E', // Rose
    '#64748B', // Slate
  ],
};
