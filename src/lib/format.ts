import type { Metric, Polarity } from '@/data/types';

/** $24.2M, $186K, $384 — the compact form used everywhere numbers are dense. */
export function money(value: number, opts: { sign?: boolean; cents?: boolean } = {}): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : opts.sign ? '+' : '';
  if (abs >= 1_000_000_000) return `${sign}$${trim(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}$${trim(abs / 1_000_000)}M`;
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  if (abs >= 1_000) return `${sign}$${trim(abs / 1_000)}K`;
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  })}`;
}

/** Full dollar amount with separators — used where precision matters. */
export function moneyExact(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function trim(n: number): string {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits).replace(/\.0$/, '')}%`;
}

export function signedPercent(value: number, digits = 0): string {
  const pct = (value * 100).toFixed(digits).replace(/\.0$/, '');
  if (value > 0) return `+${pct}%`;
  if (value < 0) return `${pct.replace('-', '−')}%`;
  return `${pct}%`;
}

export function count(value: number): string {
  return value.toLocaleString('en-US');
}

/** Renders a metric value according to its declared unit. */
export function metricValue(m: Pick<Metric, 'value' | 'unit'>): string {
  return formatUnit(m.value, m.unit);
}

export function formatUnit(value: number, unit: Metric['unit']): string {
  switch (unit) {
    case 'currency':
      return money(value);
    case 'percent':
      return percent(value);
    case 'minutes':
      return `${count(Math.round(value))} min`;
    case 'days':
      return `${count(Math.round(value))} days`;
    case 'ratio':
      return `${value.toFixed(2)}×`;
    default:
      return count(value);
  }
}

/** Relative change between two values. Returns 0 when the prior value is 0. */
export function change(value: number, prior: number): number {
  if (!prior) return 0;
  return (value - prior) / Math.abs(prior);
}

/**
 * Whether a change should read as good, bad, or neutral. Polarity is a property
 * of the metric, not of the sign — a rising response time is bad news.
 */
export function changeTone(delta: number, polarity: Polarity): 'good' | 'bad' | 'neutral' {
  if (Math.abs(delta) < 0.005 || polarity === 'neutral') return 'neutral';
  const rising = delta > 0;
  return (polarity === 'higher-better') === rising ? 'good' : 'bad';
}

export function arrow(delta: number): string {
  if (Math.abs(delta) < 0.005) return '→';
  return delta > 0 ? '↑' : '↓';
}

const TIME_FMT = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const DAY_FMT = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function clockTime(iso: string): string {
  return TIME_FMT.format(new Date(iso));
}

/** "Today" / "Yesterday" / "Monday, August 10" — the activity feed's day headers. */
export function dayLabel(iso: string, today = new Date('2026-08-12T12:00:00-07:00')): string {
  const d = new Date(iso);
  const days = Math.round(
    (startOfDay(today).getTime() - startOfDay(d).getTime()) / 86_400_000,
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return DAY_FMT.format(d);
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function titleCase(slug: string): string {
  return slug.replace(/(^|[-_])(\w)/g, (_, sep: string, ch: string) =>
    (sep ? ' ' : '') + ch.toUpperCase(),
  );
}
