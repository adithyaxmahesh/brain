import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  alertsFor,
  companies,
  companyName,
  integrationCounts,
  opportunitiesFor,
  portfolioGrowth,
  portfolioTotals,
} from '@/data';
import { money, signedPercent } from '@/lib/format';
import { SUGGESTED_QUERIES } from '@/engine/query';
import { useApp } from '@/state/AppContext';
import { AIResponse, ResponsePending } from '@/components/AIResponse';
import { Claim } from '@/components/Claim';
import { CommandBar } from '@/components/CommandBar';
import { totalIdentifiedSavings } from '@/data/opportunities';

export function CommandPage() {
  const { user, scope, conversation, ask, clearConversation, openDrawer, pending } = useApp();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [conversation.length]);

  const alerts = alertsFor(scope);
  const opportunities = opportunitiesFor(scope);
  // The brief shows the alerts plus the two highest-stakes approvals; the count
  // above it has to describe exactly that list.
  const briefApprovals = pending.filter((a) => a.level === 3).slice(0, 2);

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-[-0.025em]">
          Good morning, {user.name}.
        </h1>
        <p className="mt-2.5 text-lg text-muted">
          {scope ? (
            <>Here is what is happening at {companyName(scope)}.</>
          ) : (
            <>
              Here is what changed across{' '}
              <Claim evidenceId="ev-portfolio-ebitda">
                {companies.length} companies and {money(portfolioTotals.revenue)} of revenue
              </Claim>
              .
            </>
          )}
        </p>
      </header>

      <div className="mt-7">
        <CommandBar autoFocus />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.slice(0, 6).map((q) => (
          <button key={q} type="button" onClick={() => ask(q)} className="btn-default">
            {q}
          </button>
        ))}
      </div>

      {conversation.length > 0 && (
        <section className="mt-12 space-y-12">
          {conversation.map((c) => (
            <div key={c.id} className="border-t border-line pt-7">
              {c.pending || !c.response ? (
                <ResponsePending query={c.query} />
              ) : (
                <>
                  <p className="mb-6 text-lg text-muted">{c.query}</p>
                  <AIResponse response={c.response} />
                </>
              )}
            </div>
          ))}
          <div ref={endRef} className="flex justify-end">
            <button type="button" onClick={clearConversation} className="btn-ghost">
              Clear conversation
            </button>
          </div>
        </section>
      )}

      {conversation.length === 0 && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <h2 className="eyebrow">Daily brief</h2>
            <p className="text-sm text-muted">
              {alerts.length + briefApprovals.length} things need your attention
            </p>
          </div>

          <div className="divide-y divide-line">
            {alerts.map((a) => (
              <article key={a.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-base font-semibold">
                      {a.company_id ? companyName(a.company_id) : 'Portfolio'}
                    </span>
                    <span
                      className={
                        a.severity === 'critical'
                          ? 'chip border-risk/30 text-risk'
                          : 'chip'
                      }
                    >
                      {a.severity}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-lg font-medium leading-snug">
                    <Claim evidenceId={a.evidence_ids[0]}>{a.title}</Claim>
                  </h3>
                  <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-muted">{a.body}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {a.evidence_ids[0] && (
                    <button
                      type="button"
                      onClick={() => openDrawer({ kind: 'evidence', id: a.evidence_ids[0] })}
                      className="btn-ghost"
                    >
                      Evidence
                    </button>
                  )}
                  <Link to={a.cta.to} className="btn-default">
                    {a.cta.label}
                  </Link>
                </div>
              </article>
            ))}

            {briefApprovals.map((a) => (
                <article key={a.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-base font-semibold">
                        {a.company_id ? companyName(a.company_id) : 'Portfolio'}
                      </span>
                      <span className="chip">Level {a.level} · awaiting approval</span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-medium leading-snug">{a.title}</h3>
                    <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-muted">
                      {a.summary} <span className="tnum text-ink-2">{a.impact}.</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDrawer({ kind: 'approval', id: a.id })}
                    className="btn-default shrink-0"
                  >
                    Review action
                  </button>
                </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-4">
            <Figure label="Portfolio revenue" value={money(portfolioTotals.revenue)} />
            <Figure
              label="EBITDA"
              value={money(portfolioTotals.ebitda)}
              evidenceId="ev-portfolio-ebitda"
            />
            <Figure label="Growth" value={signedPercent(portfolioGrowth)} />
            <Figure label="Identified savings" value={money(totalIdentifiedSavings())} />
            <Figure label="Open opportunities" value={String(opportunities.length)} />
            <Figure label="Systems connected" value={String(integrationCounts().total_active)} />
          </div>
        </section>
      )}
    </div>
  );
}

function Figure({
  label,
  value,
  evidenceId,
}: {
  label: string;
  value: string;
  evidenceId?: string;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="tnum mt-1.5 text-xl font-semibold">
        <Claim evidenceId={evidenceId}>{value}</Claim>
      </p>
    </div>
  );
}
