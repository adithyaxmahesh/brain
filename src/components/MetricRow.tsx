import type { Metric } from '@/data/types';
import { change, formatUnit, metricValue } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { Delta, Sparkline } from './primitives';

/**
 * One normalized metric with its movement. The whole row is the evidence
 * affordance — clicking anywhere opens the source, which is faster than hunting
 * for a small icon.
 */
export function MetricRow({
  metric,
  showPeriod = true,
  className,
}: {
  metric: Metric;
  showPeriod?: boolean;
  className?: string;
}) {
  const { openDrawer } = useApp();
  const delta = change(metric.value, metric.prior_value);

  return (
    <button
      type="button"
      data-focus-ring=""
      onClick={() => openDrawer({ kind: 'evidence', id: metric.evidence_id })}
      title="Show evidence"
      className={cn(
        'group flex w-full items-center gap-4 py-2.5 text-left transition-colors hover:bg-rail/60',
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base text-ink-2 group-hover:text-ink">
          {metric.label}
        </span>
        {showPeriod && <span className="mt-0.5 block text-sm text-faint">{metric.period}</span>}
      </span>

      {metric.history && metric.history.length > 2 && (
        <Sparkline
          data={metric.history}
          polarity={metric.polarity}
          className="hidden shrink-0 sm:block"
        />
      )}

      <span className="shrink-0 text-right">
        <span className="tnum block text-base font-medium">{metricValue(metric)}</span>
        <span className="mt-0.5 block text-sm text-faint">
          from {formatUnit(metric.prior_value, metric.unit)}
        </span>
      </span>

      <span className="w-[68px] shrink-0 text-right">
        <Delta value={delta} polarity={metric.polarity} />
      </span>
    </button>
  );
}
