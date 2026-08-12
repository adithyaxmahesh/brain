import { useState } from 'react';
import {
  companies,
  fragmentedCategories,
  metricAcrossPortfolio,
  portfolioGrowth,
  portfolioTotals,
  vendorRollups,
} from '@/data';
import { money, percent, signedPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { Claim } from '@/components/Claim';
import { CompanyRow } from '@/components/rows';
import { PageHeader } from '@/components/primitives';

type SortKey = 'name' | 'revenue' | 'ebitda' | 'growth' | 'health';

const HEALTH_ORDER = { risk: 0, watch: 1, strong: 2 } as const;

export function PortfolioPage() {
  const [sort, setSort] = useState<SortKey>('revenue');
  const [desc, setDesc] = useState(true);

  const sorted = [...companies].sort((a, b) => {
    const dir = desc ? -1 : 1;
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name) * -dir;
      case 'growth':
        return (a.growth - b.growth) * dir;
      case 'ebitda':
        return (a.ebitda - b.ebitda) * dir;
      case 'health':
        return (HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]) * -dir;
      default:
        return (a.revenue - b.revenue) * dir;
    }
  });

  const toggle = (key: SortKey) => {
    if (sort === key) setDesc((d) => !d);
    else {
      setSort(key);
      setDesc(true);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-10">
      <PageHeader
        eyebrow="Portfolio"
        title="Five companies, one set of definitions"
        description="Each company reports from a different system. These figures are normalized to the canonical metric layer, so the columns are comparable."
      />

      <section className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-5">
        <Figure label="Combined revenue" value={money(portfolioTotals.revenue)} />
        <Figure
          label="Combined EBITDA"
          value={money(portfolioTotals.ebitda)}
          sub={`${percent(portfolioTotals.ebitda / portfolioTotals.revenue)} margin`}
          evidenceId="ev-portfolio-ebitda"
        />
        <Figure label="Revenue growth" value={signedPercent(portfolioGrowth)} />
        <Figure label="Employees" value={portfolioTotals.employees.toLocaleString()} />
        <Figure
          label="Revenue per employee"
          value={money(portfolioTotals.revenue / portfolioTotals.employees)}
        />
      </section>

      <div className="scroll-thin mt-7 overflow-x-auto">
        <table className="grid-table min-w-[940px]">
          <thead>
            <tr>
              <SortHeader label="Company" active={sort === 'name'} desc={desc} onClick={() => toggle('name')} />
              <SortHeader label="Revenue" align="right" active={sort === 'revenue'} desc={desc} onClick={() => toggle('revenue')} />
              <SortHeader label="EBITDA" align="right" active={sort === 'ebitda'} desc={desc} onClick={() => toggle('ebitda')} />
              <SortHeader label="Growth" align="right" active={sort === 'growth'} desc={desc} onClick={() => toggle('growth')} />
              <th className="hidden text-right lg:table-cell">12 mo</th>
              <SortHeader label="Health" active={sort === 'health'} desc={desc} onClick={() => toggle('health')} />
              <th>Major change</th>
              <th className="text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <CompanyRow key={c.id} company={c} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-muted">
        Click a row for a quick view, or the company name for the full page.
      </p>

      <CrossCompanySection />
    </div>
  );
}

/* ── Cross-company intelligence ──────────────────────────────────────────── */

function CrossCompanySection() {
  const { ask, openDrawer } = useApp();
  const conversion = [...metricAcrossPortfolio('inbound_conversion')].sort(
    (a, b) => b.value - a.value,
  );
  const revPer = [...metricAcrossPortfolio('rev_per_seller')].sort((a, b) => b.value - a.value);
  const duplicates = vendorRollups().filter((r) => r.companies.length > 1);
  const fragmented = fragmentedCategories();

  return (
    <section className="mt-14">
      <div className="border-b border-line pb-3">
        <h2 className="text-xl font-semibold">Cross-company intelligence</h2>
        <p className="mt-1.5 max-w-2xl text-base text-muted">
          Patterns no single company's software can see. These get sharper as more companies
          connect.
        </p>
      </div>

      <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-2">
        <Panel
          title="Best-practice transfer"
          finding={
            <>
              <Claim evidenceId="ev-atlas-lead-workflow">
                Atlas converts inbound leads {percent(conversion[0].value)}
              </Claim>{' '}
              against a portfolio average of 31.4% — {percent(conversion[0].value - conversion[conversion.length - 1].value, 0)}{' '}
              better than the weakest company.
            </>
          }
          rows={conversion.map((m) => ({
            label: m.company_id,
            value: percent(m.value),
            evidenceId: m.evidence_id,
          }))}
          cta={{
            label: 'Deploy Atlas lead workflow portfolio-wide',
            run: () => ask("Deploy Atlas's lead follow-up process to Northstar"),
          }}
        />

        <Panel
          title="Talent benchmarking"
          finding={
            <>
              <Claim evidenceId="ev-north-rev-per-producer">
                Northstar generates {money(revPer[0].value)} per quota-carrying seller
              </Claim>{' '}
              — more than twice Beacon. Some of that is the renewal book, but not all of it.
            </>
          }
          rows={revPer.map((m) => ({
            label: m.company_id,
            value: money(m.value),
            evidenceId: m.evidence_id,
          }))}
          cta={{ label: 'Compare sales operations', run: () => ask('Which company has the best sales operation?') }}
        />

        <Panel
          title="Vendor consolidation"
          finding={
            <>
              {fragmented.length} functions are served by more than one provider across the
              portfolio, and {duplicates.length} vendors bill separate contracts to companies that
              share an owner.
            </>
          }
          rows={fragmented.slice(0, 5).map((f) => ({
            label: f.category,
            value: `${f.providers.length} providers · ${money(f.total_spend)}`,
          }))}
          cta={{ label: 'Find duplicate vendors', run: () => ask('Find duplicate vendors.') }}
        />

        <Panel
          title="Pricing and margin comparison"
          finding={
            <>
              Companies selling comparable service work realize materially different margins.{' '}
              <Claim evidenceId="ev-summit-margin">
                Summit runs 18.2% on new construction
              </Claim>{' '}
              where Atlas holds 34.8% on service.
            </>
          }
          rows={companies.map((c) => ({
            label: c.id,
            value: percent(c.ebitda / c.revenue),
          }))}
          cta={{
            label: 'Review Summit bid discipline',
            run: () => openDrawer({ kind: 'opportunity', id: 'opp-summit-margin' }),
          }}
        />
      </div>
    </section>
  );
}

function Panel({
  title,
  finding,
  rows,
  cta,
}: {
  title: string;
  finding: React.ReactNode;
  rows: { label: string; value: string; evidenceId?: string }[];
  cta: { label: string; run: () => void };
}) {
  return (
    <article>
      <h3 className="eyebrow">{title}</h3>
      <p className="mt-2 text-base leading-relaxed text-ink-2">{finding}</p>
      <dl className="mt-3.5 divide-y divide-line border-y border-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-base text-muted">{labelFor(r.label)}</dt>
            <dd className="tnum text-base text-ink">
              <Claim evidenceId={r.evidenceId}>{r.value}</Claim>
            </dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={cta.run} className="btn-default mt-3.5">
        {cta.label}
      </button>
    </article>
  );
}

function labelFor(idOrLabel: string): string {
  const company = companies.find((c) => c.id === idOrLabel);
  return company ? company.name : idOrLabel;
}

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

function SortHeader({
  label,
  align,
  active,
  desc,
  onClick,
}: {
  label: string;
  align?: 'right';
  active: boolean;
  desc: boolean;
  onClick: () => void;
}) {
  return (
    <th className={align === 'right' ? 'text-right' : undefined}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-ink',
          active && 'text-ink',
        )}
      >
        {label}
        {active && <span aria-hidden>{desc ? '↓' : '↑'}</span>}
      </button>
    </th>
  );
}
