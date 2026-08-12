import { Link } from 'react-router-dom';
import type { ActivityEvent, Agent, Company, Opportunity } from '@/data/types';
import { CATEGORY_LABELS } from '@/data/opportunities';
import { companyById, companyName } from '@/data';
import { clockTime, money, percent, signedPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { Claim } from './Claim';
import { ConfidenceMark, Delta, HealthIndicator, Sparkline } from './primitives';

/* ── CompanyRow ──────────────────────────────────────────────────────────── */

/** One row of the portfolio table. */
export function CompanyRow({ company }: { company: Company }) {
  const { openDrawer, setScope } = useApp();

  return (
    <tr className="row-hover" onClick={() => openDrawer({ kind: 'company', id: company.id })}>
      <td>
        <Link
          to={`/company/${company.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setScope(company.id);
          }}
          className="text-base font-medium text-ink transition-colors hover:text-accent"
        >
          {company.name}
        </Link>
        <span className="mt-0.5 block text-sm text-muted">{company.sector}</span>
      </td>
      <td className="tnum whitespace-nowrap text-right text-base">{money(company.revenue)}</td>
      <td className="tnum whitespace-nowrap text-right text-base">
        {money(company.ebitda)}
        <span className="mt-0.5 block text-sm text-faint">
          {percent(company.ebitda / company.revenue)}
        </span>
      </td>
      <td className="whitespace-nowrap text-right">
        <Delta value={company.growth} />
      </td>
      <td className="hidden text-right lg:table-cell">
        <Sparkline data={company.revenue_trend} className="ml-auto" />
      </td>
      <td>
        <HealthIndicator health={company.health} />
      </td>
      <td className="text-base text-ink-2">{company.major_change}</td>
      <td className="tnum text-right text-base text-muted">{company.open_issues}</td>
    </tr>
  );
}

/* ── OpportunityCard ─────────────────────────────────────────────────────── */

/**
 * Deliberately a bordered block rather than a rounded card — the list should
 * read as a register of findings, not a feed of tiles.
 */
export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const { openDrawer } = useApp();
  const o = opportunity;

  return (
    <article className="group border-b border-line py-4 first:border-t">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="eyebrow">{CATEGORY_LABELS[o.category]}</span>
            <span className="text-sm text-faint">·</span>
            <span className="text-sm text-muted">Detected {o.detected}</span>
          </div>

          <h3 className="mt-1.5 text-lg font-semibold leading-snug">
            <button
              type="button"
              onClick={() => openDrawer({ kind: 'opportunity', id: o.id })}
              className="text-left transition-colors hover:text-accent"
            >
              {o.title}
            </button>
          </h3>

          <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-muted">
            {o.thesis.split('. ').slice(0, 2).join('. ')}
            {o.thesis.split('. ').length > 2 ? '.' : ''}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className="text-sm text-muted">
              {o.affected_company_ids.length === 1
                ? companyName(o.affected_company_ids[0])
                : `${o.affected_company_ids.length} companies`}
              {o.affected_company_ids.length > 1 && (
                <span className="ml-1.5 text-faint">
                  {o.affected_company_ids.map((id) => companyById[id].handle).join(' · ')}
                </span>
              )}
            </span>
            <ConfidenceMark confidence={o.confidence} />
            <span className="text-sm text-muted">{o.effort}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <div className="text-right">
            <p className="tnum text-2xl font-semibold tracking-[-0.02em]">
              <Claim evidenceId={o.evidence_ids[0]}>{money(o.impact)}</Claim>
            </p>
            <p className="mt-0.5 text-sm text-faint">per year</p>
          </div>
          <button
            type="button"
            onClick={() => openDrawer({ kind: 'opportunity', id: o.id })}
            className="btn-default"
          >
            Analyze
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── AgentRow ────────────────────────────────────────────────────────────── */

export function AgentRow({ agent }: { agent: Agent }) {
  const { pending } = useApp();
  const waiting = pending.filter((a) => a.agent_id === agent.id).length;

  return (
    <tr className="row-hover">
      <td>
        <Link to={`/agents/${agent.id}`} className="text-base font-medium transition-colors hover:text-accent">
          {agent.name}
        </Link>
        <span className="mt-0.5 block max-w-md text-sm text-muted">{agent.objective}</span>
      </td>
      <td className="text-base text-ink-2">
        {agent.scope_company_ids === null
          ? 'All companies'
          : agent.scope_company_ids.map((id) => companyById[id].handle).join(', ')}
      </td>
      <td className="text-base text-ink-2">Up to level {agent.max_level}</td>
      <td className="tnum text-right text-base">
        {agent.value_identified > 0 ? money(agent.value_identified) : '—'}
      </td>
      <td className="tnum text-right text-base text-muted">{agent.runs_last_30d.toLocaleString()}</td>
      <td className="text-right">
        {waiting > 0 ? (
          <span className="chip border-line-strong text-ink">{waiting} awaiting you</span>
        ) : (
          <span className="text-sm text-muted">Clear</span>
        )}
      </td>
    </tr>
  );
}

/* ── ActivityItem ────────────────────────────────────────────────────────── */

export function ActivityItem({ event }: { event: ActivityEvent }) {
  const isAgent = event.actor_kind === 'agent';

  return (
    <li className="flex gap-4 py-2.5">
      <span className="tnum w-[64px] shrink-0 pt-px text-sm text-muted">{clockTime(event.at)}</span>
      <span
        aria-hidden
        className={cn(
          'mt-[7px] size-[5px] shrink-0 rounded-full',
          isAgent ? 'bg-accent/60' : event.actor_kind === 'human' ? 'bg-ink' : 'bg-line-strong',
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="text-base text-ink-2">
          <span className="font-medium text-ink">{event.actor}</span> {event.verb}{' '}
          {event.link ? (
            <Link to={event.link} className="link">
              {event.object}
            </Link>
          ) : (
            event.object
          )}
        </span>
        {event.detail && <span className="mt-0.5 block text-sm text-muted">{event.detail}</span>}
      </span>
      <span className="hidden shrink-0 items-baseline gap-3 sm:flex">
        {event.company_id && (
          <span className="text-sm text-faint">{companyById[event.company_id]?.handle}</span>
        )}
        {event.level && <span className="chip">L{event.level}</span>}
      </span>
    </li>
  );
}

/* ── AlertRow ────────────────────────────────────────────────────────────── */

export function GrowthCell({ value }: { value: number }) {
  return (
    <span className={cn('tnum text-base', value < 0 ? 'text-risk' : 'text-ink')}>
      {signedPercent(value)}
    </span>
  );
}
