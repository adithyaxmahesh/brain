import { useEffect, useRef, useState } from 'react';
import { companies, portfolioTotals } from '@/data';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { HealthIndicator } from './primitives';

/**
 * The current context is always on screen. Everything the product says is
 * scoped by this, so hiding it would make answers ambiguous.
 */
export function PortfolioSwitcher() {
  const { scope, setScope } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const current = scope ? companies.find((c) => c.id === scope) : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-focus-ring=""
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded border border-line bg-paper px-2 py-1.5 text-left shadow-subtle transition-colors hover:border-line-strong"
      >
        <span className="min-w-0 flex-1">
          <span className="eyebrow block">Context</span>
          <span className="mt-0.5 block truncate text-base font-medium">
            {current ? current.name : 'Entire Portfolio'}
          </span>
        </span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          aria-hidden
          className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')}
        >
          <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 animate-fade-in border border-line bg-paper shadow-pop">
          <button
            type="button"
            onClick={() => {
              setScope(null);
              setOpen(false);
            }}
            className={cn(
              'flex w-full items-baseline justify-between gap-3 px-2.5 py-2 text-left transition-colors hover:bg-rail',
              !scope && 'bg-rail',
            )}
          >
            <span className="text-base font-medium">Entire Portfolio</span>
            <span className="tnum text-sm text-muted">{money(portfolioTotals.revenue)}</span>
          </button>

          <div className="border-t border-line">
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setScope(c.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left transition-colors hover:bg-rail',
                  scope === c.id && 'bg-rail',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-base">{c.name}</span>
                  <span className="tnum block text-sm text-muted">{money(c.revenue)}</span>
                </span>
                <HealthIndicator health={c.health} label={false} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
