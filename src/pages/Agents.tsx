import { Link, useParams } from 'react-router-dom';
import { agentById, agents, companyById, companyName, LEVEL_DESCRIPTIONS } from '@/data';
import { clockTime, money } from '@/lib/format';
import { sourceLabel } from '@/lib/sources';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { AgentRow } from '@/components/rows';
import { EmptyState, PageHeader, SourceBadge } from '@/components/primitives';

export function AgentsPage() {
  const { pending, openDrawer } = useApp();

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-10">
      <PageHeader
        eyebrow="Agents"
        title="Six functions, not six chatbots"
        description="Each agent owns an objective, a scope, a set of systems and a permission ceiling. Anything consequential stops here and waits for you."
      />

      {pending.length > 0 && (
        <section className="mt-7">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <h2 className="eyebrow">Awaiting your approval</h2>
            <p className="text-sm text-muted">{pending.length} actions</p>
          </div>
          <ul className="divide-y divide-line">
            {pending.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="chip">Level {a.level}</span>
                    <span className="text-sm text-muted">
                      {agentById[a.agent_id].name} · {companyName(a.company_id)}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-lg font-medium leading-snug">{a.title}</h3>
                  <p className="mt-1 max-w-2xl text-base text-muted">{a.summary}</p>
                  <p className="tnum mt-1.5 text-base font-medium text-ink-2">{a.impact}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openDrawer({ kind: 'approval', id: a.id })}
                  className="btn-primary mt-1 shrink-0"
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="eyebrow mb-3">All agents</h2>
        <div className="scroll-thin overflow-x-auto">
          <table className="grid-table min-w-[860px]">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Scope</th>
                <th>Permissions</th>
                <th className="text-right">Value identified</th>
                <th className="text-right">Runs / 30d</th>
                <th className="text-right">Queue</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <AgentRow key={a.id} agent={a} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ApprovalLayerExplainer />
    </div>
  );
}

function ApprovalLayerExplainer() {
  return (
    <section className="mt-14 border-t border-line pt-6">
      <h2 className="text-xl font-semibold">The approval layer</h2>
      <p className="mt-2 max-w-2xl text-base text-muted">
        Agents cannot freely perform consequential actions. Every action an agent can take is
        classified before it runs.
      </p>
      <dl className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-3">
        {([1, 2, 3] as const).map((level) => {
          const l = LEVEL_DESCRIPTIONS[level];
          return (
            <div key={level} className="border-t-2 border-line pt-3">
              <dt className="flex items-baseline justify-between gap-3">
                <span className="text-base font-semibold">{l.name}</span>
                <span
                  className={cn(
                    'text-sm',
                    level === 3 ? 'text-risk' : level === 2 ? 'text-watch' : 'text-muted',
                  )}
                >
                  {level === 3 ? 'Always gated' : level === 2 ? 'Reviewed' : 'Automatic'}
                </span>
              </dt>
              <dd className="mt-2">
                <p className="text-base text-ink-2">{l.verbs}</p>
                <p className="mt-1.5 text-sm text-muted">{l.rule}</p>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

/* ── Agent detail ────────────────────────────────────────────────────────── */

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { actions, openDrawer } = useApp();
  const agent = id ? agentById[id] : undefined;

  if (!agent) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-10">
        <EmptyState
          title="No such agent"
          body="That agent does not exist in this workspace."
          action={
            <Link to="/agents" className="btn-default">
              Back to agents
            </Link>
          }
        />
      </div>
    );
  }

  const recent = actions.filter((a) => a.agent_id === agent.id);
  const level = LEVEL_DESCRIPTIONS[agent.max_level];

  return (
    <div className="mx-auto max-w-[980px] px-8 py-10">
      <PageHeader
        eyebrow={agent.function}
        title={agent.name}
        description={agent.objective}
        right={
          <span
            className={cn('chip', agent.status === 'active' ? 'border-strong/30 text-strong' : '')}
          >
            {agent.status}
          </span>
        }
      />

      <section className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-5">
        {agent.performance.map((p) => (
          <div key={p.label}>
            <p className="eyebrow">{p.label}</p>
            <p className="tnum mt-1.5 text-2xl font-semibold tracking-[-0.02em]">{p.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_280px]">
        <div className="space-y-10">
          <section>
            <h2 className="eyebrow mb-3">Recent actions</h2>
            {recent.length === 0 ? (
              <p className="max-w-2xl text-base text-muted">
                {agent.name} has run {agent.runs_last_30d.toLocaleString()} times in the last 30 days
                and has not needed to propose an action. Its findings show up as opportunities
                instead.
              </p>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {recent.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-start gap-x-6 gap-y-2 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="chip">Level {a.level}</span>
                        <span
                          className={cn(
                            'text-sm',
                            a.status === 'pending-approval'
                              ? 'text-watch'
                              : a.status === 'rejected'
                                ? 'text-risk'
                                : 'text-muted',
                          )}
                        >
                          {a.status.replace('-', ' ')}
                        </span>
                        <span className="text-sm text-faint">{companyName(a.company_id)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDrawer({ kind: 'approval', id: a.id })}
                        className="mt-1.5 text-left text-base text-ink transition-colors hover:text-accent"
                      >
                        {a.title}
                      </button>
                      <p className="tnum mt-1 text-sm text-muted">
                        {a.impact} · requested {clockTime(a.requested)}
                      </p>
                    </div>
                    {a.status === 'pending-approval' && (
                      <button
                        type="button"
                        onClick={() => openDrawer({ kind: 'approval', id: a.id })}
                        className="btn-default mt-1 shrink-0"
                      >
                        Review
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="eyebrow mb-3">Permission ceiling</h2>
            <p className="text-base text-ink-2">
              {level.name} — {level.rule}
            </p>
            <p className="mt-1.5 max-w-2xl text-base text-muted">{level.verbs}</p>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              {agent.max_level === 3
                ? `${agent.name} can request execution in live systems, but every Level 3 action stops for your decision and records who decided it.`
                : `${agent.name} cannot execute in live systems at all. It prepares and configures; a human performs the final step.`}
            </p>
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <h2 className="eyebrow mb-2.5">Companies</h2>
            <ul className="space-y-1.5">
              {(agent.scope_company_ids ?? Object.keys(companyById)).map((cid) => (
                <li key={cid}>
                  <Link to={`/company/${cid}`} className="link text-base">
                    {companyById[cid].name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="eyebrow mb-2.5">Connected systems</h2>
            <ul className="space-y-2">
              {agent.systems.map((s) => (
                <li key={s}>
                  <SourceBadge source={s} />
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="eyebrow mb-2.5">Access</h2>
            <p className="text-sm leading-relaxed text-muted">
              Read access to {agent.systems.map(sourceLabel).join(', ')}. Write access is limited to
              the systems named on each individual action.
            </p>
          </section>

          {agent.value_identified > 0 && (
            <section>
              <h2 className="eyebrow mb-2.5">Value identified</h2>
              <p className="tnum text-2xl font-semibold">{money(agent.value_identified)}</p>
              <p className="mt-1 text-sm text-muted">Last 30 days, annualized</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
