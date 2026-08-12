import { useMemo, useState } from 'react';
import { companyName } from '@/data';
import { dayLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { ActivityItem } from '@/components/rows';
import { PageHeader } from '@/components/primitives';

type Filter = 'all' | 'agent' | 'human' | 'system';

export function ActivityPage() {
  const { activity, scope } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const events = useMemo(() => {
    const scoped = scope
      ? activity.filter((e) => e.company_id === scope || e.company_id === null)
      : activity;
    const filtered = filter === 'all' ? scoped : scoped.filter((e) => e.actor_kind === filter);
    return [...filtered].sort((a, b) => b.at.localeCompare(a.at));
  }, [activity, filter, scope]);

  // Group into day buckets, preserving order.
  const days = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const key = dayLabel(e.at);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [events]);

  return (
    <div className="mx-auto max-w-[900px] px-8 py-10">
      <PageHeader
        eyebrow="Activity"
        title="One ledger"
        description={`Every action taken by a person or an agent, in order. This is the audit trail${scope ? ` — filtered to ${companyName(scope)} and portfolio-wide events` : ''}.`}
      />

      <div className="mt-6 flex flex-wrap gap-1.5">
        {(
          [
            ['all', 'Everything'],
            ['agent', 'Agents'],
            ['human', 'People'],
            ['system', 'Systems'],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-sm border px-2 py-1 text-sm transition-colors',
              filter === key
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-paper text-muted hover:border-line-strong hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
        <p className="ml-auto self-center text-sm text-muted">{events.length} events</p>
      </div>

      <div className="mt-8 space-y-9">
        {days.map(([day, list]) => (
          <section key={day}>
            <div className="flex items-baseline gap-3 border-b border-line pb-2">
              <h2 className="eyebrow">{day}</h2>
              <span className="text-sm text-faint">{list.length}</span>
            </div>
            <ul className="divide-y divide-line">
              {list.map((e) => (
                <ActivityItem key={e.id} event={e} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {events.length === 0 && (
        <p className="mt-8 text-base text-muted">
          No events match this filter yet.
        </p>
      )}
    </div>
  );
}
