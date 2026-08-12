import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyName, opportunitiesFor, opportunityById } from '@/data';
import { CATEGORY_LABELS, SAVINGS_CATEGORIES } from '@/data/opportunities';
import type { OpportunityCategory } from '@/data/types';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { OpportunityCard } from '@/components/rows';
import { PageHeader } from '@/components/primitives';

type SortKey = 'impact' | 'confidence' | 'recent';

const CONFIDENCE_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function OpportunitiesPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { scope, openDrawer, drawers } = useApp();
  const [category, setCategory] = useState<OpportunityCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('impact');

  const all = opportunitiesFor(scope);

  // A deep link to /opportunities/:id opens that opportunity's drawer.
  useEffect(() => {
    if (id && opportunityById(id)) openDrawer({ kind: 'opportunity', id });
  }, [id, openDrawer]);

  // Closing the drawer returns to the plain list URL.
  useEffect(() => {
    if (id && drawers.length === 0) navigate('/opportunities', { replace: true });
  }, [drawers.length, id, navigate]);

  const filtered = useMemo(() => {
    const list = category === 'all' ? all : all.filter((o) => o.category === category);
    return [...list].sort((a, b) => {
      if (sort === 'confidence')
        return CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence] || b.impact - a.impact;
      if (sort === 'recent') return a.detected.localeCompare(b.detected, undefined, { numeric: true });
      return b.impact - a.impact;
    });
  }, [all, category, sort]);

  const categories = useMemo(() => {
    const set = new Map<OpportunityCategory, number>();
    for (const o of all) set.set(o.category, (set.get(o.category) ?? 0) + o.impact);
    return [...set.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const savings = all
    .filter((o) => SAVINGS_CATEGORIES.includes(o.category))
    .reduce((s, o) => s + o.impact, 0);
  const revenue = all
    .filter((o) => !SAVINGS_CATEGORIES.includes(o.category))
    .reduce((s, o) => s + o.impact, 0);

  return (
    <div className="mx-auto max-w-[1060px] px-8 py-10">
      <PageHeader
        eyebrow="Opportunities"
        title={scope ? `${companyName(scope)} opportunities` : 'What Company Brain found'}
        description="Continuously discovered, ranked by annual impact. Each one carries the evidence that produced it and a plan specific enough to hand to someone."
      />

      <section className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-5">
        <Figure label="Cost reduction identified" value={money(savings)} />
        <Figure label="Revenue upside modeled" value={money(revenue)} />
        <Figure label="Open opportunities" value={String(all.length)} />
        <Figure
          label="High confidence"
          value={String(all.filter((o) => o.confidence === 'high').length)}
        />
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>
            All
          </FilterChip>
          {categories.map(([cat, total]) => (
            <FilterChip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
              {CATEGORY_LABELS[cat]}
              <span className="tnum ml-1.5 text-faint">{money(total)}</span>
            </FilterChip>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-line-strong bg-paper px-2 py-1 text-sm text-ink"
          >
            <option value="impact">Annual impact</option>
            <option value="confidence">Confidence</option>
            <option value="recent">Most recently detected</option>
          </select>
        </label>
      </div>

      <section className="mt-7">
        {filtered.map((o) => (
          <OpportunityCard key={o.id} opportunity={o} />
        ))}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-sm border px-2 py-1 text-sm transition-colors',
        active
          ? 'border-ink bg-ink text-white'
          : 'border-line bg-paper text-muted hover:border-line-strong hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="tnum mt-1.5 text-2xl font-semibold tracking-[-0.02em]">{value}</p>
    </div>
  );
}
