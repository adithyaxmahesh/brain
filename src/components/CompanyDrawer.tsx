import { Link } from 'react-router-dom';
import { alertsFor, companyById, metricsFor, opportunitiesFor } from '@/data';
import { change, money, percent, signedPercent } from '@/lib/format';
import { useApp } from '@/state/AppContext';
import { Drawer, DrawerSection } from './Drawer';
import { MetricRow } from './MetricRow';
import { HealthIndicator, SourceBadge, Sparkline } from './primitives';

/** Quick company view — enough to decide whether to open the full page. */
export function CompanyDrawer({ id, depth }: { id: string; depth: number }) {
  const { setScope, closeAllDrawers } = useApp();
  const c = companyById[id];

  if (!c) {
    return (
      <Drawer eyebrow="Company" title="Company not found" depth={depth}>
        <p className="text-base text-muted">No company with id {id}.</p>
      </Drawer>
    );
  }

  const moved = metricsFor(c.id)
    .map((m) => ({ m, delta: Math.abs(change(m.value, m.prior_value)) }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4)
    .map((x) => x.m);

  return (
    <Drawer
      eyebrow="Company"
      title={c.name}
      depth={depth}
      meta={
        <>
          <HealthIndicator health={c.health} />
          <span className="text-sm text-faint">·</span>
          <span className="text-sm text-muted">{c.sector}</span>
          <span className="text-sm text-faint">·</span>
          <SourceBadge source={c.source} />
        </>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/company/${c.id}`}
            onClick={() => {
              setScope(c.id);
              closeAllDrawers();
            }}
            className="btn-primary"
          >
            Open company
          </Link>
          <button
            type="button"
            className="btn-default"
            onClick={() => {
              setScope(c.id);
              closeAllDrawers();
            }}
          >
            Switch context to {c.handle}
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-6 border border-line bg-canvas px-4 py-3.5">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="eyebrow">Revenue</p>
            <p className="tnum mt-1 text-2xl font-semibold">{money(c.revenue)}</p>
          </div>
          <div>
            <p className="eyebrow">EBITDA</p>
            <p className="tnum mt-1 text-2xl font-semibold">{money(c.ebitda)}</p>
            <p className="mt-0.5 text-sm text-muted">{percent(c.ebitda / c.revenue)} margin</p>
          </div>
          <div>
            <p className="eyebrow">Growth</p>
            <p className="tnum mt-1 text-2xl font-semibold">{signedPercent(c.growth)}</p>
          </div>
        </div>
        <Sparkline data={c.revenue_trend} width={112} height={30} />
      </div>

      <p className="mt-4 text-base leading-relaxed text-ink-2">{c.summary}</p>

      <DrawerSection title="What moved most">
        <div className="divide-y divide-line border-y border-line">
          {moved.map((m) => (
            <MetricRow key={m.id} metric={m} />
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Open items">
        <ul className="divide-y divide-line border-y border-line">
          {alertsFor(c.id).map((a) => (
            <li key={a.id} className="py-2.5 text-base text-ink-2">
              {a.title}
            </li>
          ))}
          {opportunitiesFor(c.id)
            .slice(0, 4)
            .map((o) => (
              <li key={o.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="text-base text-ink-2">{o.title}</span>
                <span className="tnum whitespace-nowrap text-base font-medium">
                  {money(o.impact)}
                </span>
              </li>
            ))}
        </ul>
      </DrawerSection>
    </Drawer>
  );
}
