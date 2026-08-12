import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { arrow, changeTone, signedPercent } from '@/lib/format';
import { SOURCE_MARKS, sourceLabel } from '@/lib/sources';
import type { Confidence, Health, Polarity, SourceSystem } from '@/data/types';

/* ── HealthIndicator ─────────────────────────────────────────────────────── */

const HEALTH_LABEL: Record<Health, string> = { strong: 'Strong', watch: 'Watch', risk: 'Risk' };
const HEALTH_DOT: Record<Health, string> = {
  strong: 'bg-strong',
  watch: 'bg-watch',
  risk: 'bg-risk',
};

export function HealthIndicator({
  health,
  label = true,
  className,
}: {
  health: Health;
  label?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <span
        aria-hidden
        className={cn('size-[6px] shrink-0 rounded-full', HEALTH_DOT[health])}
      />
      {label && (
        <span
          className={cn(
            'text-sm',
            health === 'risk' ? 'text-risk' : health === 'watch' ? 'text-watch' : 'text-ink-2',
          )}
        >
          {HEALTH_LABEL[health]}
        </span>
      )}
    </span>
  );
}

/* ── SourceBadge ─────────────────────────────────────────────────────────── */

export function SourceBadge({
  source,
  showLabel = true,
  className,
}: {
  source: SourceSystem;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-muted', className)}
      title={sourceLabel(source)}
    >
      <span className="flex h-[15px] w-[19px] items-center justify-center rounded-sm border border-line bg-canvas font-mono text-[9px] font-semibold tracking-tight text-muted">
        {SOURCE_MARKS[source]}
      </span>
      {showLabel && <span className="text-xs">{sourceLabel(source)}</span>}
    </span>
  );
}

/* ── Delta ───────────────────────────────────────────────────────────────── */

const TONE_TEXT = {
  good: 'text-strong',
  bad: 'text-risk',
  neutral: 'text-muted',
} as const;

export function Delta({
  value,
  polarity = 'higher-better',
  showArrow = true,
  digits = 0,
  className,
}: {
  value: number;
  polarity?: Polarity;
  showArrow?: boolean;
  digits?: number;
  className?: string;
}) {
  const tone = changeTone(value, polarity);
  return (
    <span className={cn('tnum inline-flex items-center gap-1 text-sm', TONE_TEXT[tone], className)}>
      {showArrow && <span aria-hidden>{arrow(value)}</span>}
      {signedPercent(Math.abs(value), digits).replace('+', '')}
    </span>
  );
}

export function Tone({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'good' | 'bad' | 'neutral';
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn(TONE_TEXT[tone], className)}>{children}</span>;
}

/* ── Sparkline ───────────────────────────────────────────────────────────── */

export function Sparkline({
  data,
  polarity = 'higher-better',
  width = 72,
  height = 20,
  className,
}: {
  data: number[];
  polarity?: Polarity;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`)
    .join(' ');

  const trend = (data[data.length - 1] - data[0]) / (Math.abs(data[0]) || 1);
  const tone = changeTone(trend, polarity);
  const stroke =
    tone === 'good' ? 'rgb(var(--cb-strong))' : tone === 'bad' ? 'rgb(var(--cb-risk))' : 'rgb(var(--cb-faint))';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

/* ── ConfidenceMark ──────────────────────────────────────────────────────── */

export function ConfidenceMark({ confidence }: { confidence: Confidence }) {
  const filled = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title={`${confidence} confidence`}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'w-[3px] rounded-[1px]',
              i < filled ? 'bg-ink-2' : 'bg-line-strong',
              i === 0 ? 'h-[5px]' : i === 1 ? 'h-[8px]' : 'h-[11px]',
            )}
          />
        ))}
      </span>
      <span className="text-sm capitalize text-ink-2">{confidence}</span>
    </span>
  );
}

/* ── Layout helpers ──────────────────────────────────────────────────────── */

export function SectionHeader({
  title,
  action,
  description,
  className,
}: {
  title: string;
  action?: ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <div>
        <h2 className="eyebrow">{title}</h2>
        {description && <p className="mt-1.5 max-w-prose text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-5">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-lg text-muted">{description}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}

/** Big number with a small label above it — used sparingly, never as a card grid. */
export function StatFigure({
  label,
  value,
  sub,
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      data-focus-ring={onClick ? '' : undefined}
      className={cn(
        'block text-left',
        onClick && 'group cursor-pointer rounded-sm transition-colors',
        className,
      )}
    >
      <div className="eyebrow">{label}</div>
      <div
        className={cn(
          'tnum mt-1.5 text-2xl font-semibold tracking-[-0.02em]',
          onClick && 'group-hover:text-accent',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </Comp>
  );
}

export function EmptyState({
  title,
  body,
  bullets,
  action,
}: {
  title: string;
  body: string;
  bullets?: string[];
  action?: ReactNode;
}) {
  return (
    <div className="panel max-w-xl px-6 py-7">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2.5 text-base text-muted">{body}</p>
      {bullets && (
        <ul className="mt-4 space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-base text-ink-2">
              <span aria-hidden className="mt-[9px] size-[3px] shrink-0 rounded-full bg-faint" />
              {b}
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Small live indicator used next to sync states. */
export function PulseDot({ tone = 'good' }: { tone?: 'good' | 'bad' | 'neutral' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-[6px] shrink-0 rounded-full',
        tone === 'good' ? 'bg-strong' : tone === 'bad' ? 'bg-risk' : 'bg-watch',
        tone === 'neutral' && 'animate-pulse-dot',
      )}
    />
  );
}
