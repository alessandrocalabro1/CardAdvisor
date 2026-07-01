/**
 * Shared formatting helpers and Italian label maps.
 * Frontend-only: no API behavior is changed here.
 */

export function currencySymbol(currency: string): string {
  return currency === 'USD' ? '$' : '€';
}

/** Static conversion factor 1 EUR = 1.08 USD (kept from previous implementation). */
export function convertCurrency(value: number, from: string, to: string): number {
  const f = (from || 'EUR').toUpperCase();
  const t = (to || 'EUR').toUpperCase();
  if (f === t) return value;
  if (f === 'EUR' && t === 'USD') return value * 1.08;
  if (f === 'USD' && t === 'EUR') return value / 1.08;
  return value;
}

/** Format a money amount in the display currency, e.g. "€1.240,50". */
export function formatMoney(value: number, displayCurrency: string, fromCurrency: string = displayCurrency): string {
  const converted = convertCurrency(value, fromCurrency, displayCurrency);
  return `${currencySymbol(displayCurrency)}${converted.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Card tracking status → Italian label + badge class. */
export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  WATCH: { label: 'In osservazione', className: 'badge-neutral' },
  CONSIDER: { label: 'Da valutare', className: 'badge-info' },
  OWNED: { label: 'In portafoglio', className: 'badge-positive' },
  SELL: { label: 'Da vendere', className: 'badge-warn' },
  AVOID: { label: 'Da evitare', className: 'badge-negative' },
};

export function statusLabel(status: string): { label: string; className: string } {
  return STATUS_LABELS[status] || { label: status, className: 'badge-neutral' };
}

/** Backend opportunity label (English) → Italian label + badge class. */
export function opportunityLabel(label: string | undefined | null): { label: string; className: string } {
  const l = (label || '').toLowerCase();
  if (l.includes('strong opportunity')) return { label: 'Opportunità', className: 'badge-positive' };
  if (l.includes('interesting')) return { label: 'Interessante', className: 'badge-info' };
  if (l.includes('watch')) return { label: 'Da osservare', className: 'badge-warn' };
  return { label: 'Da evitare', className: 'badge-negative' };
}

export function opportunityLabelFromScore(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Opportunità', className: 'badge-positive' };
  if (score >= 60) return { label: 'Interessante', className: 'badge-info' };
  if (score >= 40) return { label: 'Da osservare', className: 'badge-warn' };
  return { label: 'Da evitare', className: 'badge-negative' };
}

/** Confidence level → Italian label + badge class. */
export function confidenceLabel(conf: string): { label: string; className: string } {
  switch (conf) {
    case 'HIGH':
      return { label: 'Affidabilità alta', className: 'badge-positive' };
    case 'MEDIUM':
      return { label: 'Affidabilità media', className: 'badge-info' };
    default:
      return { label: 'Affidabilità bassa', className: 'badge-warn' };
  }
}

export const LEVEL_LABELS: Record<string, string> = {
  LOW: 'Bassa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export function levelLabel(level: string): string {
  return LEVEL_LABELS[level] || level;
}
