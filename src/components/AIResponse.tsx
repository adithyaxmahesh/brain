import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyById, companyName, workflows } from '@/data';
import { sourceLabel } from '@/lib/sources';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import type { AIResponse as AIResponseModel, Block, Cell, Finding, SuggestedAction } from '@/engine/types';
import { Claim, EvidenceLink } from './Claim';
import { SourceBadge } from './primitives';

/**
 * Renders a structured answer. Deliberately not a chat bubble: the output reads
 * as an operating memo, with every number traceable and every recommendation
 * attached to something the user can actually do.
 */
export function AIResponse({ response }: { response: AIResponseModel }) {
  return (
    <article className="animate-rise">
      <div className="space-y-7">
        {response.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
      <ContextStrip response={response} />
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'headline':
      return (
        <header>
          <h2 className="text-2xl font-semibold leading-snug tracking-[-0.02em]">{block.text}</h2>
          {block.sub && <p className="mt-2 max-w-2xl text-base text-muted">{block.sub}</p>}
        </header>
      );

    case 'prose':
      // Underlining a whole paragraph would be visual noise, so the evidence
      // affordance moves to the end of it.
      return (
        <p className="max-w-2xl text-lg leading-relaxed text-ink-2">
          {block.text}
          {block.evidence_id && (
            <EvidenceLink evidenceId={block.evidence_id} className="ml-2 align-[2px]" />
          )}
        </p>
      );

    case 'findings':
      return (
        <section>
          {block.title && <h3 className="eyebrow mb-3.5">{block.title}</h3>}
          <div className="divide-y divide-line border-y border-line">
            {block.items.map((f, i) => (
              <FindingView key={i} finding={f} />
            ))}
          </div>
        </section>
      );

    case 'table':
      return <TableView block={block} />;

    case 'stats':
      return (
        <section className="flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-4">
          {block.items.map((s) => (
            <div key={s.label}>
              <p className="eyebrow">{s.label}</p>
              <p className={cn('tnum mt-1.5 text-xl font-semibold', s.tone === 'good' && 'text-strong', s.tone === 'bad' && 'text-risk')}>
                <Claim evidenceId={s.evidence_id}>{s.value}</Claim>
              </p>
            </div>
          ))}
        </section>
      );

    case 'ledger':
      return (
        <section>
          {block.title && <h3 className="eyebrow mb-3.5">{block.title}</h3>}
          <dl className="divide-y divide-line border-y border-line">
            {block.items.map((i) => (
              <div key={i.label} className="flex items-baseline gap-4 py-2.5">
                <dt className="min-w-0 flex-1">
                  <span className="block text-base text-ink">{i.label}</span>
                  {i.note && <span className="mt-0.5 block text-sm text-faint">{i.note}</span>}
                </dt>
                <dd className="tnum shrink-0 text-base font-medium">
                  <Claim evidenceId={i.evidence_id}>{i.value}</Claim>
                </dd>
              </div>
            ))}
          </dl>
          {block.total && (
            <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
              <span className="eyebrow">{block.total.label}</span>
              <span className="tnum text-xl font-semibold">{block.total.value}</span>
            </div>
          )}
        </section>
      );

    case 'actions':
      return (
        <section>
          {block.title && <h3 className="eyebrow mb-3.5">{block.title}</h3>}
          <ol className="divide-y divide-line border-y border-line">
            {block.items.map((a, i) => (
              <ActionView key={i} action={a} index={i + 1} />
            ))}
          </ol>
        </section>
      );

    case 'workflow':
      return <WorkflowView block={block} />;

    case 'callout':
      return (
        <aside
          className={cn(
            'max-w-2xl border-l-2 pl-4',
            block.tone === 'bad' ? 'border-risk' : 'border-line-strong',
          )}
        >
          <p className="eyebrow">{block.label}</p>
          <p className="mt-1.5 text-base leading-relaxed text-ink-2">
            {block.text}
            {block.evidence_id && (
              <EvidenceLink evidenceId={block.evidence_id} className="ml-2 align-[2px]" />
            )}
          </p>
        </aside>
      );

    case 'followups':
      return <Followups items={block.items} />;

    default:
      return null;
  }
}

/* ── Finding ─────────────────────────────────────────────────────────────── */

function FindingView({ finding }: { finding: Finding }) {
  return (
    <div className="py-3.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {finding.company_id && (
          <span className="text-base font-semibold">{companyName(finding.company_id)}</span>
        )}
        <span
          className={cn(
            'text-base',
            finding.company_id ? 'text-ink-2' : 'font-semibold text-ink',
            finding.tone === 'bad' && 'text-risk',
            finding.tone === 'good' && 'text-strong',
          )}
        >
          <Claim evidenceId={finding.evidence_id}>{finding.claim}</Claim>
        </span>
        {finding.evidence_id && <EvidenceLink evidenceId={finding.evidence_id} className="ml-auto" />}
      </div>

      {finding.reason && (
        <div className="mt-2 max-w-2xl">
          <span className="eyebrow">{finding.reason_label ?? 'Primary reason'}</span>
          <p className="mt-1 text-base leading-relaxed text-ink-2">{finding.reason}</p>
        </div>
      )}

      {finding.facts && finding.facts.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5">
          {finding.facts.map((f) => (
            <span key={f.label} className="text-sm text-muted">
              {f.label}{' '}
              <span className="tnum font-medium text-ink-2">
                <Claim evidenceId={f.evidence_id}>{f.value}</Claim>
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Table ───────────────────────────────────────────────────────────────── */

function TableView({ block }: { block: Extract<Block, { kind: 'table' }> }) {
  const navigate = useNavigate();
  return (
    <section>
      {block.title && <h3 className="eyebrow mb-3.5">{block.title}</h3>}
      <div className="scroll-thin -mx-3 overflow-x-auto px-3">
        <table className="grid-table min-w-[560px]">
          <thead>
            <tr>
              {block.columns.map((c) => (
                <th key={c.key} className={c.align === 'right' ? 'text-right' : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((c, ci) => (
                  <TableCell
                    key={ci}
                    cell={c}
                    align={block.columns[ci]?.align}
                    muted={block.columns[ci]?.muted}
                    onNavigate={navigate}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.note && <p className="mt-2.5 max-w-2xl text-sm text-muted">{block.note}</p>}
    </section>
  );
}

function TableCell({
  cell,
  align,
  muted,
  onNavigate,
}: {
  cell: Cell;
  align?: 'left' | 'right';
  muted?: boolean;
  onNavigate: (to: string) => void;
}) {
  const classes = cn(
    'text-base',
    align === 'right' && 'tnum text-right whitespace-nowrap',
    muted && 'text-muted',
    cell.emphasis && 'font-semibold text-ink',
    cell.tone === 'good' && 'text-strong',
    cell.tone === 'bad' && 'text-risk',
  );

  let content = <>{cell.text}</>;
  if (cell.evidence_id) content = <Claim evidenceId={cell.evidence_id}>{cell.text}</Claim>;
  else if (cell.href)
    content = (
      <button
        type="button"
        onClick={() => onNavigate(cell.href!)}
        className="text-left underline decoration-line-strong decoration-1 underline-offset-[3px] transition-colors hover:decoration-ink"
      >
        {cell.text}
      </button>
    );

  return <td className={classes}>{content}</td>;
}

/* ── Recommended action ──────────────────────────────────────────────────── */

function ActionView({ action, index }: { action: SuggestedAction; index: number }) {
  const navigate = useNavigate();
  const { openDrawer, ask } = useApp();

  const run = () => {
    switch (action.kind) {
      case 'route':
        navigate(action.target);
        break;
      case 'approval':
        openDrawer({ kind: 'approval', id: action.target });
        break;
      case 'opportunity':
        openDrawer({ kind: 'opportunity', id: action.target });
        break;
      case 'query':
        ask(action.target);
        break;
      default:
        break;
    }
  };

  return (
    <li className="flex flex-wrap items-start gap-x-6 gap-y-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold">
          <span className="tnum mr-2 text-muted">{index}.</span>
          {action.title}
        </p>
        {action.detail && (
          <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-muted">{action.detail}</p>
        )}
        {(action.impact || action.effort) && (
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {action.impact && (
              <span className="text-sm text-muted">
                Estimated impact <span className="tnum font-medium text-ink-2">{action.impact}</span>
              </span>
            )}
            {action.effort && (
              <span className="text-sm text-muted">
                Effort <span className="font-medium text-ink-2">{action.effort}</span>
              </span>
            )}
          </div>
        )}
      </div>
      <button type="button" onClick={run} className="btn-default mt-0.5 shrink-0">
        {action.cta}
      </button>
    </li>
  );
}

/* ── Workflow deployment ─────────────────────────────────────────────────── */

function WorkflowView({ block }: { block: Extract<Block, { kind: 'workflow' }> }) {
  const { openDrawer } = useApp();
  const wf = workflows.find((w) => w.id === block.workflow_id);
  if (!wf) return null;
  const target = companyById[block.target_company_id];

  return (
    <section className="border border-line">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line bg-canvas px-4 py-3">
        <div>
          <p className="eyebrow">{block.title ?? 'Workflow'}</p>
          <h3 className="mt-1.5 text-lg font-semibold">{wf.name}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-sm text-muted">
            {companyById[wf.origin_company_id].name} → {target.name}
          </span>
          {block.systems.map((s) => (
            <SourceBadge key={s} source={s} />
          ))}
        </div>
      </header>

      <ol className="divide-y divide-line">
        {wf.steps.map((s, i) => (
          <li key={s.name} className="flex gap-4 px-4 py-2.5">
            <span className="tnum w-4 shrink-0 pt-px text-sm text-faint">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-base text-ink">{s.name}</span>
              <span className="mt-0.5 block text-sm text-muted">{s.detail}</span>
            </span>
            <SourceBadge source={s.system} showLabel={false} className="mt-0.5 shrink-0" />
          </li>
        ))}
      </ol>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-canvas px-4 py-3">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <span className="text-sm text-muted">
            Estimated impact <span className="tnum font-medium text-ink-2">{block.impact}</span>
          </span>
          <span className="text-sm text-muted">
            Implementation <span className="font-medium text-ink-2">{block.effort}</span>
          </span>
        </div>
        {block.action_id && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => openDrawer({ kind: 'approval', id: block.action_id! })}
          >
            Deploy workflow
          </button>
        )}
      </footer>
    </section>
  );
}

/* ── Follow-ups ──────────────────────────────────────────────────────────── */

function Followups({ items }: { items: string[] }) {
  const { ask } = useApp();
  return (
    <section className="border-t border-line pt-4">
      <h3 className="eyebrow mb-2.5">Ask next</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((q) => (
          <button key={q} type="button" onClick={() => ask(q)} className="btn-default">
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Context strip ───────────────────────────────────────────────────────── */

/** What was retrieved before answering. Collapsed by default; the point is that it exists. */
function ContextStrip({ response }: { response: AIResponseModel }) {
  const [open, setOpen] = useState(false);
  const c = response.context;

  return (
    <div className="mt-8 border-t border-line pt-3">
      <button
        type="button"
        data-focus-ring=""
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-sm text-left text-sm text-muted transition-colors hover:text-ink"
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          aria-hidden
          className={cn('transition-transform', open && 'rotate-90')}
        >
          <path d="M2 1l4 3-4 3z" fill="currentColor" />
        </svg>
        Answered from {c.evidence_count} evidence record{c.evidence_count === 1 ? '' : 's'} across{' '}
        {c.systems.length || 'no'} system{c.systems.length === 1 ? '' : 's'} · {c.scope} ·{' '}
        {response.latency_ms} ms
      </button>

      {open && (
        <dl className="mt-3 grid gap-x-8 gap-y-3 border border-line bg-canvas px-4 py-3.5 sm:grid-cols-2">
          <ContextField label="User" value={c.user} />
          <ContextField label="Scope" value={c.scope} />
          <ContextField label="Time period" value={c.period} />
          <ContextField label="Resolver" value={response.resolver} mono />
          <ContextField
            label="Systems retrieved"
            value={c.systems.length ? c.systems.map(sourceLabel).join(', ') : 'None'}
          />
          <ContextField label="Entities" value={c.entities.length ? c.entities.join(', ') : 'None'} />
          <ContextField
            label="Tools available"
            value={c.tools.length ? c.tools.join(', ') : 'None'}
            mono
            className="sm:col-span-2"
          />
        </dl>
      )}
    </div>
  );
}

function ContextField({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="eyebrow">{label}</dt>
      <dd className={cn('mt-1 text-sm text-ink-2', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}

/* ── Thinking state ──────────────────────────────────────────────────────── */

const STEPS = [
  'Resolving scope and entities',
  'Retrieving from connected systems',
  'Normalizing across companies',
  'Checking evidence',
];

export function ResponsePending({ query }: { query: string }) {
  return (
    <div className="animate-fade-in">
      <p className="text-lg text-muted">{query}</p>
      <ul className="mt-4 space-y-1.5">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-2.5 text-sm text-faint"
            style={{ animation: `fade-in 200ms ease-out ${i * 130}ms both` }}
          >
            <span className="block size-[5px] animate-pulse-dot rounded-full bg-line-strong" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
