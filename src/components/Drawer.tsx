import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';

/**
 * The right-hand drawer shell. Stacked drawers offset slightly so the one
 * underneath stays visible — the user should always know they can go back.
 */
export function Drawer({
  eyebrow,
  title,
  meta,
  children,
  footer,
  depth = 0,
  width = 'md',
}: {
  eyebrow?: string;
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  depth?: number;
  width?: 'md' | 'lg';
}) {
  const { closeDrawer, drawers } = useApp();
  const isTop = depth === drawers.length - 1;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className={cn('fixed inset-0 z-40 flex justify-end', !isTop && 'pointer-events-none')}>
      {depth === 0 && (
        <button
          type="button"
          aria-label="Close"
          onClick={closeDrawer}
          className="absolute inset-0 animate-fade-in bg-ink/[0.12]"
        />
      )}
      <aside
        role="dialog"
        aria-modal="true"
        style={{ marginRight: (drawers.length - 1 - depth) * 20 }}
        className={cn(
          'pointer-events-auto relative flex h-full animate-slide-in flex-col border-l border-line bg-paper shadow-drawer',
          width === 'lg' ? 'w-full max-w-[720px]' : 'w-full max-w-[560px]',
          !isTop && 'opacity-70',
        )}
      >
        <header className="flex items-start justify-between gap-6 border-b border-line px-6 py-4">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            <h2 className="text-xl font-semibold leading-snug">{title}</h2>
            {meta && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">{meta}</div>}
          </div>
          <button
            type="button"
            data-focus-ring=""
            onClick={closeDrawer}
            className="-mr-1.5 -mt-1 flex size-7 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-rail hover:text-ink"
            aria-label="Close drawer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </header>

        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="border-t border-line bg-canvas px-6 py-3.5">{footer}</div>}
      </aside>
    </div>
  );
}

/** A labeled field row — the drawer's core layout unit. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-[124px_1fr] items-baseline gap-4 py-2', className)}>
      <dt className="eyebrow pt-px">{label}</dt>
      <dd className="min-w-0 text-base text-ink">{children}</dd>
    </div>
  );
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('divide-y divide-line', className)}>{children}</dl>;
}

export function DrawerSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mt-6 border-t border-line pt-5 first:mt-0 first:border-0 first:pt-0', className)}>
      <h3 className="eyebrow mb-3">{title}</h3>
      {children}
    </section>
  );
}
