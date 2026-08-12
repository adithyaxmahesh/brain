import {
  agents,
  companies,
  customers,
  employees,
  metrics,
  opportunities,
  vendorRollups,
  actions,
  integrations,
} from '@/data';
import { companyName } from '@/data/portfolio';
import { money, percent } from './format';
import { metricValue } from './format';
import { sourceLabel } from './sources';

export type SearchKind =
  | 'Company'
  | 'Employee'
  | 'Customer'
  | 'Vendor'
  | 'Metric'
  | 'Agent'
  | 'Opportunity'
  | 'Action'
  | 'System';

export interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  /** Right-hand context, e.g. "Used by 4 companies · $241K/year". */
  meta: string;
  /** Where selecting the result goes. */
  action:
    | { type: 'route'; to: string }
    | { type: 'drawer'; kind: 'evidence' | 'approval' | 'opportunity' | 'company'; id: string }
    | { type: 'query'; text: string }
    | { type: 'scope'; id: string | null };
  /** Lower sorts first. */
  rank: number;
}

/**
 * One index over everything the product knows about, so ⌘K can answer "where is
 * this?" without the user knowing which page owns the entity.
 */
export function search(term: string, limit = 12): SearchResult[] {
  const q = term.trim().toLowerCase();
  if (!q) return defaultResults();

  const out: SearchResult[] = [];
  const match = (text: string) => text.toLowerCase().includes(q);
  const starts = (text: string) => text.toLowerCase().startsWith(q);
  const rankFor = (text: string, base: number) => base + (starts(text) ? 0 : 1);

  for (const c of companies) {
    if (match(c.name) || match(c.handle) || match(c.sector)) {
      out.push({
        id: `company-${c.id}`,
        kind: 'Company',
        title: c.name,
        meta: `${money(c.revenue)} revenue · ${c.employees} employees · ${c.sector}`,
        action: { type: 'route', to: `/company/${c.id}` },
        rank: rankFor(c.name, 0),
      });
    }
  }

  for (const roll of vendorRollups()) {
    if (match(roll.name) || match(roll.category)) {
      out.push({
        id: `vendor-${roll.name}`,
        kind: 'Vendor',
        title: roll.name,
        meta:
          roll.companies.length > 1
            ? `Used by ${roll.companies.length} companies · ${money(roll.total_spend)}/year portfolio spend`
            : `${companyName(roll.companies[0])} · ${money(roll.total_spend)}/year`,
        action: { type: 'query', text: roll.name },
        rank: rankFor(roll.name, roll.companies.length > 1 ? 0 : 2),
      });
    }
  }

  for (const c of customers) {
    if (match(c.name)) {
      out.push({
        id: `customer-${c.id}`,
        kind: 'Customer',
        title: c.name,
        meta: `${companyName(c.company_id)} · ${money(c.arr)} · ${percent(c.churn_risk, 0)} churn risk`,
        action: { type: 'drawer', kind: 'company', id: c.company_id },
        rank: rankFor(c.name, 1),
      });
    }
  }

  for (const e of employees) {
    if (match(e.name) || match(e.title)) {
      out.push({
        id: `employee-${e.id}`,
        kind: 'Employee',
        title: e.name,
        meta: `${e.title} · ${companyName(e.company_id)}`,
        action: { type: 'drawer', kind: 'company', id: e.company_id },
        rank: rankFor(e.name, 1),
      });
    }
  }

  for (const m of metrics) {
    if (match(m.label)) {
      out.push({
        id: `metric-${m.id}`,
        kind: 'Metric',
        title: `${m.label} — ${companyName(m.company_id)}`,
        meta: `${metricValue(m)} · ${m.period} · ${sourceLabel(m.source)}`,
        action: { type: 'drawer', kind: 'evidence', id: m.evidence_id },
        rank: rankFor(m.label, 2),
      });
    }
  }

  for (const o of opportunities) {
    if (match(o.title) || match(o.category)) {
      out.push({
        id: `opp-${o.id}`,
        kind: 'Opportunity',
        title: o.title,
        meta: `${money(o.impact)} · ${o.affected_company_ids.length} companies · ${o.confidence} confidence`,
        action: { type: 'drawer', kind: 'opportunity', id: o.id },
        rank: rankFor(o.title, 1),
      });
    }
  }

  for (const a of agents) {
    if (match(a.name) || match(a.function)) {
      out.push({
        id: `agent-${a.id}`,
        kind: 'Agent',
        title: a.name,
        meta: `${a.function} · ${a.runs_last_30d.toLocaleString()} runs in 30 days`,
        action: { type: 'route', to: `/agents/${a.id}` },
        rank: rankFor(a.name, 1),
      });
    }
  }

  for (const a of actions) {
    if (match(a.title)) {
      out.push({
        id: `action-${a.id}`,
        kind: 'Action',
        title: a.title,
        meta: `Level ${a.level} · ${a.status.replace('-', ' ')} · ${a.impact}`,
        action: { type: 'drawer', kind: 'approval', id: a.id },
        rank: rankFor(a.title, 2),
      });
    }
  }

  for (const i of integrations) {
    if (match(i.name) || match(i.category)) {
      out.push({
        id: `system-${i.id}`,
        kind: 'System',
        title: i.name,
        meta: `${i.category} · ${companyName(i.company_id)} · ${i.status.replace('-', ' ')}`,
        action: { type: 'route', to: '/settings' },
        rank: rankFor(i.name, 3),
      });
    }
  }

  // Always offer the raw text as a question — the palette should never dead-end.
  out.push({
    id: 'ask',
    kind: 'Action',
    title: `Ask Company Brain: "${term.trim()}"`,
    meta: 'Run as a portfolio question',
    action: { type: 'query', text: term.trim() },
    rank: 9,
  });

  return dedupe(out).sort((a, b) => a.rank - b.rank).slice(0, limit);
}

function dedupe(list: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return list.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

function defaultResults(): SearchResult[] {
  return [
    { id: 'nav-command', kind: 'Action', title: 'Command', meta: 'Ask the portfolio anything', action: { type: 'route', to: '/' }, rank: 0 },
    { id: 'nav-portfolio', kind: 'Action', title: 'Portfolio', meta: 'All five companies, one table', action: { type: 'route', to: '/portfolio' }, rank: 0 },
    { id: 'nav-opps', kind: 'Action', title: 'Opportunities', meta: 'What Company Brain found', action: { type: 'route', to: '/opportunities' }, rank: 0 },
    { id: 'nav-agents', kind: 'Action', title: 'Agents', meta: 'Approvals and agent activity', action: { type: 'route', to: '/agents' }, rank: 0 },
    { id: 'nav-activity', kind: 'Action', title: 'Activity', meta: 'The audit trail', action: { type: 'route', to: '/activity' }, rank: 0 },
    { id: 'scope-all', kind: 'Company', title: 'Switch to Entire Portfolio', meta: 'Reset company context', action: { type: 'scope', id: null }, rank: 1 },
    ...companies.map((c) => ({
      id: `scope-${c.id}`,
      kind: 'Company' as const,
      title: `Switch to ${c.name}`,
      meta: `${money(c.revenue)} · ${c.sector}`,
      action: { type: 'scope' as const, id: c.id },
      rank: 2,
    })),
  ];
}
