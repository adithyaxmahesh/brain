import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';

/**
 * Wraps any assertion that came from data. Clicking opens the evidence drawer.
 *
 * The dotted underline is the product's one consistent affordance: if a number
 * has it, you can see where it came from. If it does not, Company Brain is not
 * claiming it as fact.
 */
export function Claim({
  evidenceId,
  children,
  className,
  block = false,
}: {
  evidenceId?: string;
  children: ReactNode;
  className?: string;
  /** Render as a block element, for whole paragraphs. */
  block?: boolean;
}) {
  const { openDrawer } = useApp();

  if (!evidenceId) return <span className={className}>{children}</span>;

  return (
    <button
      type="button"
      data-focus-ring=""
      onClick={(e) => {
        e.stopPropagation();
        openDrawer({ kind: 'evidence', id: evidenceId });
      }}
      title="Show evidence"
      className={cn(
        'group/claim inline text-left underline decoration-dotted decoration-line-strong decoration-1 underline-offset-[3px] transition-colors hover:decoration-accent hover:text-accent',
        block && 'block',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** An explicit "Evidence" affordance, for places where an underline is too quiet. */
export function EvidenceLink({
  evidenceId,
  label = 'Evidence',
  className,
}: {
  evidenceId?: string;
  label?: string;
  className?: string;
}) {
  const { openDrawer } = useApp();
  if (!evidenceId) return null;
  return (
    <button
      type="button"
      data-focus-ring=""
      onClick={(e) => {
        e.stopPropagation();
        openDrawer({ kind: 'evidence', id: evidenceId });
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm text-2xs font-semibold uppercase tracking-[0.08em] text-faint transition-colors hover:text-accent',
        className,
      )}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
        <rect x="0.5" y="0.5" width="8" height="8" stroke="currentColor" />
        <path d="M2.5 4.5h4M2.5 6.2h2.6M2.5 2.8h4" stroke="currentColor" strokeWidth="0.9" />
      </svg>
      {label}
    </button>
  );
}
