import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  agents,
  alertsFor,
  companyById,
  customersFor,
  departments,
  employeesFor,
  integrations,
  invoices,
  metricsFor,
  opportunitiesFor,
  transactions,
  vendorsFor,
} from '@/data';
import type { Metric } from '@/data/types';
import { change, money, percent, signedPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { Claim } from '@/components/Claim';
import { MetricRow } from '@/components/MetricRow';
import { EmptyState, HealthIndicator, SourceBadge, Sparkline } from '@/components/primitives';

const TABS = [
  'Overview',
  'Financials',
  'Revenue',
  'Customers',
  'People',
  'Operations',
  'Systems',
  'Agents',
] as const;

type Tab = (typeof TABS)[number];

export function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const { setScope, ask, openDrawer } = useApp();
  const [tab, setTab] = useState<Tab>('Overview');

  const company = id ? companyById[id] : undefined;

  // Opening a company page sets the working context — every answer follows it.
  useEffect(() => {
    if (company) setScope(company.id);
  }, [company, setScope]);

  useEffect(() => setTab('Overview'), [id]);

  if (!company) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-10">
        <EmptyState
          title="No such company"
          body="That company is not part of Redwood Holdings, or it has not been added yet."
          action={
            <Link to="/portfolio" className="btn-default">
              Back to portfolio
            </Link>
          }
        />
      </div>
    );
  }

  const metrics = metricsFor(company.id);

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-10">
      <header className="border-b border-line pb-5">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <p className="eyebrow">Operating company</p>
              <HealthIndicator health={company.health} />
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.025em]">{company.name}</h1>
            <p className="mt-2 text-base text-muted">
              {company.sector} · {company.hq} · acquired {company.acquired} ·{' '}
              {company.employees} employees
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-default"
              onClick={() => ask(`What changed at ${company.handle} this month?`)}
            >
              Ask about {company.handle}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-4">
          <Figure label="Revenue" value={money(company.revenue)} />
          <Figure
            label="EBITDA"
            value={money(company.ebitda)}
            sub={`${percent(company.ebitda / company.revenue)} margin`}
            evidenceId="ev-portfolio-ebitda"
          />
          <Figure label="Growth YoY" value={signedPercent(company.growth)} />
          <Figure
            label="Revenue / employee"
            value={money(company.revenue / company.employees)}
          />
          <div className="ml-auto">
            <p className="eyebrow mb-1.5">Trailing 12 months</p>
            <Sparkline data={company.revenue_trend} width={148} height={34} />
          </div>
        </div>
      </header>

      <nav className="scroll-thin -mb-px mt-5 flex gap-5 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'whitespace-nowrap border-b-2 pb-2.5 text-base transition-colors',
              tab === t
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="pt-8">
        {tab === 'Overview' && <Overview company={company} metrics={metrics} />}
        {tab === 'Financials' && <Financials company={company} metrics={metrics} />}
        {tab === 'Revenue' && <RevenueTab company={company} metrics={metrics} />}
        {tab === 'Customers' && <Customers company={company} />}
        {tab === 'People' && <People company={company} />}
        {tab === 'Operations' && <Operations company={company} metrics={metrics} />}
        {tab === 'Systems' && <Systems company={company} />}
        {tab === 'Agents' && <AgentsTab company={company} />}
      </div>

      <section className="mt-14 border-t border-line pt-6">
        <h2 className="eyebrow mb-3.5">Open opportunities at {company.handle}</h2>
        <ul className="divide-y divide-line border-y border-line">
          {opportunitiesFor(company.id).map((o) => (
            <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-4 py-2.5">
              <button
                type="button"
                onClick={() => openDrawer({ kind: 'opportunity', id: o.id })}
                className="text-left text-base text-ink transition-colors hover:text-accent"
              >
                {o.title}
              </button>
              <span className="tnum text-base font-medium">{money(o.impact)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

type CompanyType = (typeof companyById)[string];

/* ── Overview ────────────────────────────────────────────────────────────── */

function Overview({ company, metrics }: { company: CompanyType; metrics: Metric[] }) {
  const { ask } = useApp();
  const moved = metrics
    .map((m) => ({ m, delta: change(m.value, m.prior_value) }))
    .filter((x) => Math.abs(x.delta) >= 0.04)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const alerts = alertsFor(company.id);

  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_300px]">
      <div>
        <h2 className="text-xl font-semibold">
          {moved.length} meaningful change{moved.length === 1 ? '' : 's'} this month
        </h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {moved.map(({ m, delta }) => (
            <li key={m.id} className="py-3.5">
              <p className="text-base">
                <Claim evidenceId={m.evidence_id}>
                  {m.label} {delta > 0 ? 'increased' : 'decreased'}{' '}
                  {signedPercent(Math.abs(delta)).replace('+', '')}
                </Claim>
              </p>
              <p className="mt-1 text-sm text-muted">{m.period}</p>
            </li>
          ))}
        </ul>

        <section className="mt-9">
          <h2 className="eyebrow">AI assessment</h2>
          <p className="mt-2.5 max-w-2xl text-lg leading-relaxed text-ink-2">
            {ASSESSMENTS[company.id]}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => ask(INVESTIGATIONS[company.id])}
            >
              Investigate
            </button>
            <button
              type="button"
              className="btn-default"
              onClick={() => ask(`What changed at ${company.handle} this month?`)}
            >
              Full change report
            </button>
          </div>
        </section>
      </div>

      <aside>
        <h2 className="eyebrow mb-3">Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-base text-muted">
            No open alerts. Company Brain is watching {metrics.length} metrics here and will surface
            a change when it crosses a threshold.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {alerts.map((a) => (
              <li key={a.id} className="border-l-2 border-line-strong pl-3">
                <p className="text-base font-medium leading-snug">
                  <Claim evidenceId={a.evidence_ids[0]}>{a.title}</Claim>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

const ASSESSMENTS: Record<string, string> = {
  atlas:
    'Atlas remains the healthiest company in the portfolio, but rising technician overtime could reduce EBITDA by approximately $180K annually if current trends continue. The overtime and the lead-response deterioration have the same cause — two dispatcher departures in June — so one fix addresses both.',
  beacon:
    'Beacon is the highest-margin company in the portfolio and is not at risk, but new business has stalled at the proposal stage rather than at the top of the funnel. Discovery volume is intact; proposals are going out eleven days later than they did, which is long enough to lose deals that were already won.',
  northstar:
    'Northstar is the portfolio\'s material risk. Revenue is down 3% while the cost base is flat, and the mechanism is retention rather than pricing: 64 of 212 mid-market accounts have had no producer contact in 90 days. This is recoverable, but the renewal calendar sets the deadline, not the operating plan.',
  summit:
    'Summit is growing revenue and losing margin at the same time. New-construction work is running 16 points below service margin and eleven of the last nineteen bids went out below the portfolio floor. The growth is real; it is also dilutive to portfolio EBITDA at the current mix.',
  clearline:
    'Clearline is the largest and one of the strongest companies in the portfolio. The single issue is that dispatch is still a manual function — 84% of loads are touched by hand — which is showing up as contractor spend growing at three times the rate of volume.',
};

const INVESTIGATIONS: Record<string, string> = {
  atlas: 'Why did Atlas technician overtime increase?',
  beacon: 'Why did Beacon pipeline conversion decline?',
  northstar: 'Why did Northstar customer churn increase?',
  summit: 'Why is Summit new-construction margin below the floor?',
  clearline: 'Why is Clearline contractor spend growing faster than volume?',
};

/* ── Financials ──────────────────────────────────────────────────────────── */

function Financials({ company, metrics }: { company: CompanyType; metrics: Metric[] }) {
  const companyInvoices = invoices.filter((i) => i.company_id === company.id);
  const spend = transactions.filter((t) => t.company_id === company.id);

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-4">
        <Figure label="Revenue" value={money(company.revenue)} sub={`prior year ${money(company.revenue_prior)}`} />
        <Figure label="EBITDA" value={money(company.ebitda)} sub={`prior year ${money(company.ebitda_prior)}`} />
        <Figure label="EBITDA margin" value={percent(company.ebitda / company.revenue)} />
        <Figure
          label="EBITDA change"
          value={money(company.ebitda - company.ebitda_prior, { sign: true })}
          evidenceId="ev-portfolio-ebitda"
        />
      </section>

      <section>
        <h2 className="eyebrow mb-3">Margin metrics</h2>
        <div className="divide-y divide-line border-y border-line">
          {metrics
            .filter((m) => m.unit === 'percent' || m.key.includes('margin'))
            .map((m) => (
              <MetricRow key={m.id} metric={m} />
            ))}
        </div>
      </section>

      {companyInvoices.length > 0 && (
        <section>
          <h2 className="eyebrow mb-3">Receivables</h2>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th className="text-right">Amount</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {companyInvoices.map((i) => (
                <tr key={i.id}>
                  <td className="text-base">{i.customer}</td>
                  <td className="tnum text-right text-base">{money(i.amount)}</td>
                  <td className="text-base text-muted">{i.issued}</td>
                  <td className="text-base text-muted">{i.due}</td>
                  <td className={cn('text-base', i.status === 'overdue' ? 'text-risk' : 'text-ink-2')}>
                    {i.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {spend.length > 0 && (
        <section>
          <h2 className="eyebrow mb-3">Largest recent transactions</h2>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
                <th>Date</th>
                <th>Memo</th>
              </tr>
            </thead>
            <tbody>
              {spend.map((t) => (
                <tr key={t.id}>
                  <td className="text-base">{t.vendor}</td>
                  <td className="text-base text-muted">{t.category}</td>
                  <td className="tnum text-right text-base">{money(t.amount)}</td>
                  <td className="text-base text-muted">{t.date}</td>
                  <td className="text-sm text-muted">{t.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

/* ── Revenue ─────────────────────────────────────────────────────────────── */

function RevenueTab({ company, metrics }: { company: CompanyType; metrics: Metric[] }) {
  const revenueKeys = ['rev_per_seller', 'inbound_conversion', 'stage_conversion', 'target_attainment', 'lead_response', 'uncontacted_leads', 'new_business', 'cac', 'realized_rate'];
  const list = metrics.filter((m) => revenueKeys.includes(m.key));

  return (
    <div className="space-y-10">
      <section>
        <h2 className="eyebrow mb-3">Demand and conversion</h2>
        <div className="divide-y divide-line border-y border-line">
          {list.map((m) => (
            <MetricRow key={m.id} metric={m} />
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-4">
        <Figure label="Revenue" value={money(company.revenue)} />
        <Figure label="Growth" value={signedPercent(company.growth)} />
        <Figure label="Major change" value={company.major_change} />
      </section>
    </div>
  );
}

/* ── Customers ───────────────────────────────────────────────────────────── */

function Customers({ company }: { company: CompanyType }) {
  const list = customersFor(company.id);
  const atRisk = list.filter((c) => c.churn_risk >= 0.35);

  if (list.length === 0) {
    return (
      <EmptyState
        title="Connect a CRM to see customers here"
        body={`Company Brain has ${company.name} financials but no customer-level data. Once a CRM is connected it will begin identifying:`}
        bullets={[
          'Accounts at risk before the renewal window closes',
          'Revenue concentration across the top ten accounts',
          'Owners with no logged contact in 90 days',
        ]}
        action={<button type="button" className="btn-primary">Connect a CRM</button>}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-4">
        <Figure label="Customers tracked" value={String(list.length)} />
        <Figure label="Revenue represented" value={money(list.reduce((s, c) => s + c.arr, 0))} />
        <Figure
          label="Weighted at risk"
          value={money(atRisk.reduce((s, c) => s + c.arr * c.churn_risk, 0))}
        />
      </section>

      <table className="grid-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th className="text-right">Revenue</th>
            <th>Since</th>
            <th>Owner</th>
            <th className="text-right">Churn risk</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id}>
              <td className="text-base">{c.name}</td>
              <td className="tnum text-right text-base">{money(c.arr)}</td>
              <td className="text-base text-muted">{c.since}</td>
              <td className="text-base text-muted">{c.owner}</td>
              <td
                className={cn(
                  'tnum text-right text-base',
                  c.churn_risk >= 0.55 ? 'text-risk' : c.churn_risk >= 0.35 ? 'text-watch' : 'text-ink-2',
                )}
              >
                {percent(c.churn_risk, 0)}
              </td>
              <td className="max-w-sm text-sm text-muted">{c.churn_reason ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── People ──────────────────────────────────────────────────────────────── */

function People({ company }: { company: CompanyType }) {
  const depts = departments.filter((d) => d.company_id === company.id);
  const people = employeesFor(company.id);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="eyebrow mb-3">Departments</h2>
        <table className="grid-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Lead</th>
              <th className="text-right">Headcount</th>
              <th className="text-right">Annual cost</th>
              <th className="text-right">Cost / head</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d) => (
              <tr key={d.id}>
                <td className="text-base">{d.name}</td>
                <td className="text-base text-muted">{d.lead}</td>
                <td className="tnum text-right text-base">{d.headcount}</td>
                <td className="tnum text-right text-base">{money(d.cost)}</td>
                <td className="tnum text-right text-base text-muted">
                  {money(d.cost / d.headcount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Key people</h2>
        <table className="grid-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Department</th>
              <th className="text-right">Tenure</th>
              <th className="text-right">Attributed revenue</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td className="text-base">{p.name}</td>
                <td className="text-base text-muted">{p.title}</td>
                <td className="text-base text-muted">{p.department}</td>
                <td className="tnum text-right text-base">{p.tenure_years.toFixed(1)} yrs</td>
                <td className="tnum text-right text-base">
                  {p.revenue_attributed ? money(p.revenue_attributed) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ── Operations ──────────────────────────────────────────────────────────── */

function Operations({ company, metrics }: { company: CompanyType; metrics: Metric[] }) {
  const opsKeys = ['overtime_hours', 'gross_margin', 'service_margin', 'manual_dispatch', 'contractor_spend', 'lead_response'];
  const list = metrics.filter((m) => opsKeys.includes(m.key));

  return (
    <div className="space-y-10">
      <section>
        <h2 className="eyebrow mb-3">Operating metrics</h2>
        <div className="divide-y divide-line border-y border-line">
          {list.map((m) => (
            <MetricRow key={m.id} metric={m} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Vendors</h2>
        <table className="grid-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Category</th>
              <th className="text-right">Annual spend</th>
              <th className="text-right">Seats</th>
              <th className="text-right">Utilization</th>
              <th>Contract end</th>
            </tr>
          </thead>
          <tbody>
            {vendorsFor(company.id)
              .sort((a, b) => b.annual_spend - a.annual_spend)
              .map((v) => (
                <tr key={v.id}>
                  <td className="text-base">{v.name}</td>
                  <td className="text-base text-muted">{v.category}</td>
                  <td className="tnum text-right text-base">{money(v.annual_spend)}</td>
                  <td className="tnum text-right text-base text-muted">{v.seats ?? '—'}</td>
                  <td
                    className={cn(
                      'tnum text-right text-base',
                      v.utilization !== undefined && v.utilization < 0.2 ? 'text-risk' : 'text-ink-2',
                    )}
                  >
                    {v.utilization !== undefined ? percent(v.utilization, 0) : '—'}
                  </td>
                  <td className="text-base text-muted">{v.contract_end}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ── Systems ─────────────────────────────────────────────────────────────── */

function Systems({ company }: { company: CompanyType }) {
  const list = integrations.filter((i) => i.company_id === company.id || i.company_id === null);

  return (
    <section>
      <h2 className="eyebrow mb-3">Connected systems</h2>
      <table className="grid-table">
        <thead>
          <tr>
            <th>System</th>
            <th>Category</th>
            <th>Scope</th>
            <th>Status</th>
            <th className="text-right">Records</th>
            <th>Last synced</th>
          </tr>
        </thead>
        <tbody>
          {list.map((i) => (
            <tr key={i.id}>
              <td>
                <SourceBadge source={i.system} />
              </td>
              <td className="text-base text-muted">{i.category}</td>
              <td className="text-base text-muted">
                {i.company_id ? company.name : 'Portfolio-wide'}
              </td>
              <td
                className={cn(
                  'text-base',
                  i.status === 'error' ? 'text-risk' : i.status === 'syncing' ? 'text-watch' : 'text-ink-2',
                )}
              >
                {i.status.replace('-', ' ')}
                {i.error && <span className="mt-0.5 block text-sm text-muted">{i.error}</span>}
              </td>
              <td className="tnum text-right text-base text-muted">
                {i.record_count?.toLocaleString() ?? '—'}
              </td>
              <td className="text-base text-muted">{i.last_synced ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ── Agents ──────────────────────────────────────────────────────────────── */

function AgentsTab({ company }: { company: CompanyType }) {
  const { actions, openDrawer } = useApp();
  const scoped = agents.filter(
    (a) => a.scope_company_ids === null || a.scope_company_ids.includes(company.id),
  );
  const companyActions = actions.filter((a) => a.company_id === company.id);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="eyebrow mb-3">Agents operating here</h2>
        <ul className="divide-y divide-line border-y border-line">
          {scoped.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-4 py-3">
              <div className="min-w-0">
                <Link to={`/agents/${a.id}`} className="text-base font-medium hover:text-accent">
                  {a.name}
                </Link>
                <p className="mt-0.5 max-w-xl text-sm text-muted">{a.objective}</p>
              </div>
              <span className="text-sm text-muted">Up to level {a.max_level}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Actions at {company.handle}</h2>
        {companyActions.length === 0 ? (
          <p className="text-base text-muted">
            No agent has proposed an action here yet.
          </p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {companyActions.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-4 py-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openDrawer({ kind: 'approval', id: a.id })}
                    className="text-left text-base text-ink hover:text-accent"
                  >
                    {a.title}
                  </button>
                  <p className="mt-0.5 text-sm text-muted">
                    Level {a.level} · {a.status.replace('-', ' ')} · {a.impact}
                  </p>
                </div>
                {a.status === 'pending-approval' && (
                  <button
                    type="button"
                    onClick={() => openDrawer({ kind: 'approval', id: a.id })}
                    className="btn-default"
                  >
                    Review
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ── Shared ──────────────────────────────────────────────────────────────── */

function Figure({
  label,
  value,
  sub,
  evidenceId,
}: {
  label: string;
  value: string;
  sub?: string;
  evidenceId?: string;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="tnum mt-1.5 text-2xl font-semibold tracking-[-0.02em]">
        <Claim evidenceId={evidenceId}>{value}</Claim>
      </p>
      {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
    </div>
  );
}
