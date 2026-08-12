import {
  actions,
  alerts,
  atRiskCustomers,
  companies,
  companyById,
  companyName,
  customersFor,
  evidence,
  findMetric,
  fragmentedCategories,
  metricAcrossPortfolio,
  metricsFor,
  opportunities,
  pendingActions,
  portfolioGrowth,
  portfolioTotals,
  PRIMARY_PERIOD,
  SAVINGS_CATEGORIES,
  vendorRollups,
  vendors,
  workflows,
} from '@/data';
import type { Metric, Opportunity, SourceSystem } from '@/data/types';
import { CATEGORY_LABELS } from '@/data/opportunities';
import { arrow, change, changeTone, formatUnit, metricValue, money, moneyExact, percent, signedPercent } from '@/lib/format';
import type { AIResponse, Block, Cell, Finding, SuggestedAction } from './types';

/* ────────────────────────────────────────────────────────────────────────────
 * Query parsing
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ParsedQuery {
  raw: string;
  lower: string;
  /** Company ids resolved from `@mentions` and from bare company names. */
  mentions: string[];
  /** A leading `/command`, if present. */
  slash?: string;
  /** A dollar figure in the query, e.g. "$500K" → 500000. */
  amount?: number;
  /** A recognized relative period, e.g. "last 90 days". */
  period?: string;
}

export function parseQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase();
  const mentions: string[] = [];

  for (const c of companies) {
    const handle = c.handle.toLowerCase();
    if (
      lower.includes(`@${handle}`) ||
      new RegExp(`\\b${handle}\\b`).test(lower) ||
      lower.includes(c.name.toLowerCase())
    ) {
      mentions.push(c.id);
    }
  }

  const slashMatch = raw.match(/^\/(\w[\w-]*)/);
  const amountMatch = lower.match(/\$\s?([\d.,]+)\s?(k|m|thousand|million)?/);
  let amount: number | undefined;
  if (amountMatch) {
    const n = Number(amountMatch[1].replace(/,/g, ''));
    const suffix = amountMatch[2];
    amount =
      suffix === 'k' || suffix === 'thousand'
        ? n * 1_000
        : suffix === 'm' || suffix === 'million'
          ? n * 1_000_000
          : n;
  }

  const periodMatch = lower.match(/last (\d+)\s?(days|weeks|months|quarters|years)/);
  const period = periodMatch
    ? `Last ${periodMatch[1]} ${periodMatch[2]}`
    : /this week/.test(lower)
      ? 'This week'
      : /this month|month/.test(lower)
        ? 'This month'
        : /today/.test(lower)
          ? 'Today'
          : undefined;

  return { raw, lower, mentions: [...new Set(mentions)], slash: slashMatch?.[1], amount, period };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Block helpers
 * ──────────────────────────────────────────────────────────────────────────── */

const cell = (text: string, extra: Partial<Cell> = {}): Cell => ({ text, ...extra });

function metricFinding(m: Metric, reason: string, reasonLabel = 'Primary reason'): Finding {
  const delta = change(m.value, m.prior_value);
  return {
    company_id: m.company_id,
    claim: `${m.label} ${arrow(delta)} ${signedPercent(Math.abs(delta)).replace('+', '')}`,
    reason,
    reason_label: reasonLabel,
    evidence_id: m.evidence_id,
    tone: changeTone(delta, m.polarity),
    facts: [
      {
        label: m.period,
        value: `${formatUnit(m.prior_value, m.unit)} → ${metricValue(m)}`,
        evidence_id: m.evidence_id,
      },
    ],
  };
}

function sourcesOf(evidenceIds: string[]): SourceSystem[] {
  const set = new Set<SourceSystem>();
  for (const id of evidenceIds) {
    const e = evidence.find((x) => x.id === id);
    if (e) set.add(e.source);
  }
  return [...set];
}

function opportunityAction(o: Opportunity): SuggestedAction {
  return {
    title: o.title,
    detail: o.thesis.split('. ')[0] + '.',
    impact: `${money(o.impact)} · ${o.impact_note.toLowerCase()}`,
    effort: o.effort,
    cta: 'Review opportunity',
    kind: 'opportunity',
    target: o.id,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Resolvers
 *
 * Each resolver declares how strongly it matches a query. The highest score
 * wins; ties break toward the earlier entry. This is deliberately a rule engine
 * rather than a model call — the P1 milestone swaps `resolve()` for a real LLM
 * call while keeping this block format as the response contract.
 * ──────────────────────────────────────────────────────────────────────────── */

interface Resolver {
  id: string;
  /** 0 means "does not apply". Higher wins. */
  score: (q: ParsedQuery, scope: string | null) => number;
  build: (q: ParsedQuery, scope: string | null) => { blocks: Block[]; systems?: SourceSystem[]; entities?: string[]; period?: string; tools?: string[] };
}

const hits = (lower: string, ...needles: string[]) => needles.filter((n) => lower.includes(n)).length;

/* ── Demo 1 — What needs my attention today? ─────────────────────────────── */

const attentionResolver: Resolver = {
  id: 'attention',
  score: (q) => {
    const n = hits(q.lower, 'attention', 'worry', 'need my', 'urgent', 'priorit', 'what should i', 'focus on');
    if (!n) return 0;
    return 90 + n * 2;
  },
  build: (_q, scope) => {
    const scoped = alerts.filter((a) => !scope || a.company_id === scope || a.company_id === null);
    const approvals = pendingActions(scope).filter((a) => a.level === 3);

    const items: Finding[] = [];

    for (const a of scoped.slice(0, 3)) {
      items.push({
        company_id: a.company_id ?? undefined,
        claim: a.title,
        reason: a.body,
        reason_label: a.severity === 'critical' ? 'Critical' : 'Material',
        evidence_id: a.evidence_ids[0],
        tone: a.severity === 'critical' ? 'bad' : 'neutral',
      });
    }

    for (const a of approvals.slice(0, 2)) {
      items.push({
        company_id: a.company_id ?? undefined,
        claim: `${a.verb} — ${a.title}`,
        reason: a.rationale,
        reason_label: 'Awaiting your approval',
        evidence_id: a.evidence_ids[0],
        tone: 'neutral',
      });
    }

    const suggested: SuggestedAction[] = [
      ...scoped.slice(0, 2).map((a) => ({
        title: a.title,
        detail: a.cta.label === 'Investigate' ? 'Open the full picture and the underlying data.' : undefined,
        cta: a.cta.label,
        kind: 'route' as const,
        target: a.cta.to,
      })),
      ...approvals.slice(0, 1).map((a) => ({
        title: a.title,
        detail: a.impact,
        cta: 'Review approval',
        kind: 'approval' as const,
        target: a.id,
      })),
    ];

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${items.length} things need your attention.`,
          sub: `${scoped.filter((a) => a.severity === 'critical').length} critical · ${approvals.length} awaiting approval · ranked by dollar exposure`,
        },
        { kind: 'findings', items },
        { kind: 'actions', title: 'Recommended actions', items: suggested },
        {
          kind: 'followups',
          items: [
            'Why did Northstar churn increase?',
            'Where can I save $500K across the portfolio?',
            'Which company has the best sales operation?',
          ],
        },
      ],
      systems: sourcesOf(scoped.flatMap((a) => a.evidence_ids)),
      entities: ['Alert', 'Action', 'Metric', 'Customer'],
      period: 'Today',
      tools: ['retrieve_alerts', 'rank_by_exposure', 'list_pending_approvals'],
    };
  },
};

/* ── Demo 2 — Where can I save $500K? ────────────────────────────────────── */

const savingsResolver: Resolver = {
  id: 'savings',
  score: (q) => {
    const n = hits(q.lower, 'save', 'saving', 'wasting', 'waste', 'overspend', 'over-spend', 'reduce cost', 'cut cost', 'cost reduction', 'spending too much');
    if (!n) return 0;
    return 88 + n * 2 + (q.amount ? 4 : 0);
  },
  build: (q, scope) => {
    const target = q.amount ?? 500_000;
    const pool = opportunities
      .filter((o) => SAVINGS_CATEGORIES.includes(o.category))
      .filter((o) => !scope || o.company_id === scope || o.affected_company_ids.includes(scope))
      .sort((a, b) => b.impact - a.impact);

    // Take enough opportunities to clear the target, then show the rest as upside.
    const chosen: Opportunity[] = [];
    let running = 0;
    for (const o of pool) {
      chosen.push(o);
      running += o.impact;
      if (running >= target && chosen.length >= 4) break;
    }
    const remainder = pool.filter((o) => !chosen.includes(o));

    const rows: Cell[][] = chosen.map((o) => [
      cell(o.title, { href: `/opportunities/${o.id}` }),
      cell(CATEGORY_LABELS[o.category]),
      cell(
        o.affected_company_ids.length > 1
          ? `${o.affected_company_ids.length} companies`
          : companyName(o.affected_company_ids[0]),
      ),
      cell(o.confidence, { tone: o.confidence === 'high' ? 'good' : 'neutral' }),
      cell(money(o.impact), { evidence_id: o.evidence_ids[0], emphasis: true }),
    ]);

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${moneyExact(running)} identified across ${chosen.length} areas.`,
          sub: `Target was ${money(target)}. ${remainder.length > 0 ? `A further ${money(remainder.reduce((s, o) => s + o.impact, 0))} sits below the line.` : ''}`.trim(),
        },
        {
          kind: 'ledger',
          title: 'Where the money is',
          items: chosen.map((o) => ({
            label: o.title,
            value: money(o.impact),
            note: o.impact_note,
            evidence_id: o.evidence_ids[0],
          })),
          total: { label: 'Total annual', value: moneyExact(running) },
        },
        {
          kind: 'table',
          title: 'Detail',
          columns: [
            { key: 'opp', label: 'Opportunity' },
            { key: 'cat', label: 'Category', muted: true },
            { key: 'scope', label: 'Scope', muted: true },
            { key: 'conf', label: 'Confidence', muted: true },
            { key: 'impact', label: 'Annual impact', align: 'right' },
          ],
          rows,
          note: 'Impact figures are annualized and net of implementation cost where known. Migration one-time costs are excluded.',
        },
        {
          kind: 'callout',
          label: 'What makes this findable',
          text: 'Each of these is invisible from inside a single company. The payroll, security and payments findings only exist when five sets of books are normalized into one vendor view — no subsidiary controller can see a rate they are not paying.',
        },
        {
          kind: 'actions',
          title: 'Recommended actions',
          items: [
            ...chosen.slice(0, 2).map(opportunityAction),
            {
              title: 'Approve the Beacon Slack cancellation',
              detail: 'The fastest item on the list — the contract auto-renews in 50 days.',
              impact: '$18,400 annual savings',
              cta: 'Review approval',
              kind: 'approval' as const,
              target: 'act-slack',
            },
          ],
        },
      ],
      systems: sourcesOf(chosen.flatMap((o) => o.evidence_ids)),
      entities: ['Vendor', 'Transaction', 'Opportunity', 'Employee'],
      period: 'Trailing 12 months',
      tools: ['scan_vendor_spend', 'detect_duplicates', 'rank_by_impact', 'model_savings'],
    };
  },
};

/* ── Demo 3 — Which company has the best sales operation? ────────────────── */

const salesComparisonResolver: Resolver = {
  id: 'sales-comparison',
  score: (q) => {
    const sales = hits(q.lower, 'sales', 'selling', 'sell', 'pipeline', 'revenue per');
    if (!sales) return 0;
    const comparative = hits(q.lower, 'best', 'which company', 'compare', 'worst', 'rank', 'across the portfolio', 'efficiency');
    if (!comparative) return 0;
    return 86 + sales + comparative * 3;
  },
  build: () => {
    const revPer = metricAcrossPortfolio('rev_per_seller');
    const conv = metricAcrossPortfolio('inbound_conversion');

    // Rank on conversion first — it is the part of a sales operation that is
    // actually a process, rather than a function of deal size.
    const ranked = [...conv].sort((a, b) => b.value - a.value);
    const winner = companyById[ranked[0].company_id];

    const rows: Cell[][] = ranked.map((c) => {
      const company = companyById[c.company_id];
      const rp = revPer.find((x) => x.company_id === c.company_id);
      const response = findMetric(c.company_id, 'lead_response');
      const uncontacted = findMetric(c.company_id, 'uncontacted_leads');
      const isWinner = c.company_id === ranked[0].company_id;
      return [
        cell(company.name, { href: `/company/${company.id}`, emphasis: isWinner }),
        cell(percent(c.value), { evidence_id: c.evidence_id, emphasis: isWinner, tone: isWinner ? 'good' : undefined }),
        cell(rp ? money(rp.value) : '—', { evidence_id: rp?.evidence_id }),
        cell(response ? `${Math.round(response.value)} min` : 'No SLA', {
          evidence_id: response?.evidence_id,
          tone: response ? undefined : 'bad',
        }),
        cell(uncontacted ? uncontacted.value.toLocaleString() : '—', { evidence_id: uncontacted?.evidence_id }),
        cell(signedPercent(company.growth), { tone: company.growth >= 0 ? 'good' : 'bad' }),
      ];
    });

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${winner.name} runs the best sales operation in the portfolio.`,
          sub: 'Ranked on inbound conversion — the part of a sales operation that is process rather than deal size.',
        },
        {
          kind: 'prose',
          text: `${winner.name} converts inbound leads to booked work at ${percent(ranked[0].value)} against a portfolio average of 31.4%. The advantage is mechanical, not talent: a 15-minute first-response SLA with automatic round-robin ownership, proven over 11 months against an 890-lead holdout control. Northstar and Beacon have no routing rules at all and rely on producers to pick leads up manually.`,
          evidence_id: 'ev-atlas-workflow-proof',
        },
        {
          kind: 'table',
          title: 'Portfolio comparison',
          columns: [
            { key: 'company', label: 'Company' },
            { key: 'conv', label: 'Inbound → booked', align: 'right' },
            { key: 'rev', label: 'Rev / seller', align: 'right' },
            { key: 'sla', label: 'Response time', align: 'right' },
            { key: 'unc', label: 'Uncontacted', align: 'right' },
            { key: 'growth', label: 'Growth', align: 'right' },
          ],
          rows,
          note: 'Revenue per seller is not comparable across models — Northstar producers carry renewal books that Atlas must re-sell each year, which is why conversion is the ranking metric.',
        },
        {
          kind: 'findings',
          title: 'Why Atlas wins',
          items: [
            {
              company_id: 'atlas',
              claim: 'A response SLA that is measured and escalated',
              reason:
                'Any lead past 15 minutes appears on the sales manager dashboard hourly. Median first response is the only sales metric Atlas manages daily.',
              reason_label: 'Mechanism',
              evidence_id: 'ev-atlas-lead-response',
              tone: 'good',
            },
            {
              company_id: 'atlas',
              claim: 'Five structured touches over nine days',
              reason:
                'Median touches to book is 2.4, so most of the value comes from touches two and three — exactly the ones manual follow-up skips.',
              reason_label: 'Mechanism',
              evidence_id: 'ev-atlas-workflow-proof',
              tone: 'good',
            },
            {
              claim: 'The gap is not closing on its own',
              reason:
                'Northstar has 498 leads with no contact attempt at all, up 42% over 90 days. That is the single largest recoverable revenue item in the portfolio.',
              reason_label: 'Contrast',
              evidence_id: 'ev-north-uncontacted',
              tone: 'bad',
            },
          ],
        },
        {
          kind: 'callout',
          label: 'One caveat',
          text: 'Atlas is also where lead response has deteriorated fastest — 8 to 31 minutes since May, following two dispatcher departures. The best operation in the portfolio is currently degrading.',
          evidence_id: 'ev-atlas-lead-response',
          tone: 'bad',
        },
        {
          kind: 'actions',
          title: 'Recommended actions',
          items: [
            {
              title: "Deploy Atlas's lead follow-up workflow to Northstar",
              detail: 'The 498 uncontacted leads are the highest-value target for the same process.',
              impact: '+$220K estimated first-year new business',
              effort: '2 days to configure',
              cta: 'Deploy workflow',
              kind: 'query',
              target: "Deploy Atlas's lead follow-up process to Northstar",
            },
            {
              title: 'Standardize lead routing across the portfolio',
              detail: 'Beacon and Summit have the volume to benefit from the same SLA.',
              impact: '+$410K modeled annual revenue',
              effort: '30-day pilot, then 3 weeks per company',
              cta: 'Review opportunity',
              kind: 'opportunity',
              target: 'opp-lead-routing',
            },
          ],
        },
      ],
      systems: ['hubspot', 'salesforce', 'netsuite'],
      entities: ['Metric', 'Workflow', 'Employee'],
      period: 'Trailing 12 months',
      tools: ['compare_metric_across_portfolio', 'normalize_sales_model', 'retrieve_workflow_proof'],
    };
  },
};

/* ── Demo 4 — Deploy Atlas's workflow to Northstar ───────────────────────── */

const deployWorkflowResolver: Resolver = {
  id: 'deploy-workflow',
  score: (q) => {
    const deploy = hits(q.lower, 'deploy', 'roll out', 'rollout', 'copy', 'replicate', 'apply');
    if (!deploy) return 0;
    const subject = hits(q.lower, 'workflow', 'process', 'follow-up', 'follow up', 'lead', 'playbook', 'sequence');
    if (!subject) return 0;
    return 92 + deploy * 2 + subject;
  },
  build: (q) => {
    const wf = workflows[0];
    // Target is whichever mentioned company is not the workflow's origin.
    const target =
      q.mentions.find((id) => id !== wf.origin_company_id) ?? 'northstar';
    const targetCompany = companyById[target];
    const pending = actions.find((a) => a.id === 'act-north-outreach');

    return {
      blocks: [
        {
          kind: 'headline',
          text: `Ready to deploy the Atlas lead follow-up workflow to ${targetCompany.name}.`,
          sub: 'Nothing has changed yet — this is a Level 3 action and needs your approval.',
        },
        {
          kind: 'prose',
          text: `${wf.description} ${wf.proof} At ${targetCompany.name} the same process addresses 498 inbound leads that currently receive no contact attempt within 72 hours.`,
          evidence_id: 'ev-atlas-workflow-proof',
        },
        {
          kind: 'workflow',
          title: 'What will be configured',
          workflow_id: wf.id,
          target_company_id: target,
          systems: ['salesforce', 'company-brain'],
          impact: '+$220K estimated first-year new business commission',
          effort: '2 days to configure · 30 days to measure against a holdout',
          action_id: pending?.id,
        },
        {
          kind: 'stats',
          items: [
            { label: 'Uncontacted leads to backfill', value: '498', evidence_id: 'ev-north-uncontacted' },
            { label: 'Producers in round-robin', value: '22' },
            { label: 'Proven lift at origin', value: '+31%', evidence_id: 'ev-atlas-workflow-proof', tone: 'good' },
            { label: 'Systems modified', value: 'Salesforce only' },
          ],
        },
        {
          kind: 'callout',
          label: 'Translation risk',
          text: `The Atlas sequence was built for residential HVAC leads that close in days. ${targetCompany.name} writes commercial P&C with a 40-day cycle, so the day-2 and day-4 touches will likely need to stretch. The pilot is scoped against a holdout for exactly this reason.`,
          evidence_id: 'ev-portfolio-lead-routing',
        },
        {
          kind: 'actions',
          title: 'Approval required',
          items: [
            {
              title: `Assign 64 untouched accounts and enable the sequence at ${targetCompany.name}`,
              detail:
                'Creates Salesforce ownership assignments, routing rules and a one-time backfill campaign. No customer-facing message is sent until you approve the sequence content.',
              impact: '+$220K first-year new business · $480K retention exposure addressed',
              effort: '2 days',
              cta: 'Review approval',
              kind: 'approval',
              target: pending?.id ?? 'act-north-outreach',
            },
          ],
        },
      ],
      systems: ['hubspot', 'salesforce'],
      entities: ['Workflow', 'Action', 'Employee', 'Customer'],
      period: 'Trailing 12 months',
      tools: ['load_workflow', 'map_systems', 'model_impact', 'create_action'],
    };
  },
};

/* ── Duplicate vendors ───────────────────────────────────────────────────── */

const vendorDuplicateResolver: Resolver = {
  id: 'duplicate-vendors',
  score: (q) => {
    const n = hits(q.lower, 'duplicate vendor', 'duplicate', 'vendor consolidat', 'same vendor', 'redundant vendor', 'overlapping vendor');
    if (!n) return 0;
    return 87 + n * 3;
  },
  build: () => {
    const dupes = vendorRollups().filter((r) => r.companies.length > 1);
    const fragmented = fragmentedCategories().slice(0, 4);

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${dupes.length} vendors are billed separately by more than one company.`,
          sub: `${money(dupes.reduce((s, d) => s + d.total_spend, 0))} of annual spend with no volume aggregation.`,
        },
        {
          kind: 'table',
          title: 'Same vendor, separate contracts',
          columns: [
            { key: 'vendor', label: 'Vendor' },
            { key: 'cat', label: 'Category', muted: true },
            { key: 'companies', label: 'Companies', align: 'right' },
            { key: 'spend', label: 'Combined annual', align: 'right' },
          ],
          rows: dupes.map((d) => [
            cell(d.name),
            cell(d.category),
            cell(d.companies.map((c) => companyById[c].handle).join(', ')),
            cell(money(d.total_spend), { emphasis: true }),
          ]),
        },
        {
          kind: 'table',
          title: 'Same function, different vendors',
          columns: [
            { key: 'cat', label: 'Category' },
            { key: 'providers', label: 'Providers in use' },
            { key: 'companies', label: 'Companies', align: 'right' },
            { key: 'spend', label: 'Combined annual', align: 'right' },
          ],
          rows: fragmented.map((f) => [
            cell(f.category),
            cell(f.providers.join(', ')),
            cell(String(f.companies.length)),
            cell(money(f.total_spend), { emphasis: true }),
          ]),
          note: 'Fragmentation matters more than duplication — four payroll providers cost more than one provider billed four times.',
        },
        {
          kind: 'actions',
          title: 'Recommended actions',
          items: [
            opportunityAction(opportunities.find((o) => o.id === 'opp-payroll')!),
            opportunityAction(opportunities.find((o) => o.id === 'opp-cyber')!),
            {
              title: 'Consolidate three DocuSign accounts',
              detail: 'Vendor Agent has a 57-seat enterprise quote request ready to send.',
              impact: '$7,700 annual savings · Northstar renews in 19 days',
              cta: 'Review approval',
              kind: 'approval',
              target: 'act-docusign',
            },
          ],
        },
      ],
      systems: ['ramp', 'quickbooks', 'netsuite', 'stripe'],
      entities: ['Vendor', 'Transaction'],
      period: 'Trailing 12 months',
      tools: ['normalize_merchant_names', 'group_by_function', 'price_at_volume'],
    };
  },
};

/* ── What changed ────────────────────────────────────────────────────────── */

const changedResolver: Resolver = {
  id: 'changed',
  score: (q) => {
    const n = hits(q.lower, 'what changed', 'changed this', 'what happened', 'what is new', "what's new", 'update me', 'summary of');
    if (!n) return 0;
    return 85 + n * 3;
  },
  build: (q, scope) => {
    const scoped = scope ? [companyById[scope]] : companies;
    const findings: Finding[] = [];

    for (const c of scoped) {
      const list = metricsFor(c.id)
        .map((m) => ({ m, delta: change(m.value, m.prior_value) }))
        .filter((x) => Math.abs(x.delta) >= 0.05)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, scope ? 4 : 1);

      for (const { m } of list) {
        findings.push(metricFinding(m, changeReason(c.id, m.key), 'What is behind it'));
      }
    }

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${findings.length} material change${findings.length === 1 ? '' : 's'} ${scope ? `at ${companyName(scope)}` : 'across the portfolio'}.`,
          sub: `${q.period ?? PRIMARY_PERIOD} · a change is material when it moves more than 5% or crosses a threshold you have set.`,
        },
        { kind: 'findings', items: findings },
        {
          kind: 'stats',
          items: [
            { label: 'Portfolio revenue', value: money(portfolioTotals.revenue) },
            { label: 'Portfolio EBITDA', value: money(portfolioTotals.ebitda), evidence_id: 'ev-portfolio-ebitda' },
            { label: 'Revenue growth', value: signedPercent(portfolioGrowth), tone: 'good' },
            { label: 'Companies on watch or risk', value: String(companies.filter((c) => c.health !== 'strong').length), tone: 'bad' },
          ],
        },
        {
          kind: 'followups',
          items: ['What needs my attention today?', 'Why did EBITDA decline at Northstar?', 'Which customers are at risk?'],
        },
      ],
      systems: ['quickbooks', 'netsuite', 'hubspot', 'salesforce', 'rippling', 'ramp'],
      entities: ['Metric', 'Company', 'Alert'],
      period: q.period ?? PRIMARY_PERIOD,
      tools: ['diff_metrics', 'threshold_check', 'attribute_cause'],
    };
  },
};

/** Short causal notes, keyed by the metric that moved. */
function changeReason(companyId: string, key: string): string {
  const map: Record<string, string> = {
    'atlas:lead_response':
      'Two dispatchers left in June and the capacity-based scheduling rules were switched off to cope. Leads now queue behind field scheduling.',
    'atlas:rev_per_seller':
      'Not a selling problem — the same lead volume is arriving and converting worse because first response moved from 8 to 31 minutes.',
    'atlas:overtime_hours':
      'The same dispatch gap. Scheduling moved to the field, so technicians absorb the coordination as overtime.',
    'atlas:cac': 'Paid search spend rose 18% while attributed conversions were flat.',
    'beacon:stage_conversion':
      'Discovery calls are holding at 318, but the median lag from discovery to proposal went from 4 days to 11. Proposals are going out too late to win.',
    'beacon:target_attainment': 'Weighted pipeline is $1.32M against a $1.52M target, driven by the proposal backlog.',
    'northstar:churn':
      '64 of 212 mid-market accounts have had no producer contact in 90 days. Retention correlates with contact coverage, not with price.',
    'northstar:uncontacted_leads':
      'Inbound leads are landing in a queue with no owner. There are no routing rules — assignment depends on a producer noticing.',
    'northstar:new_business': 'Only 7 of 22 producers are at or above quota, and the uncontacted lead pool is the largest input.',
    'summit:gross_margin':
      '11 of the last 19 new-construction bids were submitted below the 25% portfolio margin floor.',
    'clearline:contractor_spend':
      'Volume grew 9% but contracted capacity grew 31%. Four lanes with stable volume are being covered at a $0.41/mi premium.',
  };
  return (
    map[`${companyId}:${key}`] ??
    'Company Brain has not isolated a single cause yet — the change is inside normal variance for this metric.'
  );
}

/* ── Missing targets ─────────────────────────────────────────────────────── */

const targetsResolver: Resolver = {
  id: 'targets',
  score: (q) => {
    const n = hits(q.lower, 'missing target', 'miss target', 'missing sales target', 'below target', 'behind target', 'off plan', 'underperform', 'attainment');
    if (!n) return 0;
    return 86 + n * 3;
  },
  build: () => {
    const underperformers = companies.filter((c) => c.health !== 'strong' || c.growth < 0.06);
    const findings: Finding[] = [
      metricFinding(findMetric('beacon', 'target_attainment')!, changeReason('beacon', 'target_attainment'), 'Gap'),
      metricFinding(findMetric('northstar', 'new_business')!, changeReason('northstar', 'new_business'), 'Gap'),
      metricFinding(findMetric('atlas', 'rev_per_seller')!, changeReason('atlas', 'rev_per_seller'), 'Gap'),
    ];

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${findings.length} companies are behind on new business.`,
          sub: `Measured against each company's own plan, not against each other.`,
        },
        { kind: 'findings', items: findings },
        {
          kind: 'table',
          title: 'Attainment',
          columns: [
            { key: 'company', label: 'Company' },
            { key: 'growth', label: 'Growth', align: 'right' },
            { key: 'health', label: 'Health', muted: true },
            { key: 'change', label: 'Major change', muted: true },
            { key: 'issues', label: 'Open issues', align: 'right' },
          ],
          rows: underperformers.map((c) => [
            cell(c.name, { href: `/company/${c.id}` }),
            cell(signedPercent(c.growth), { tone: c.growth >= 0 ? 'neutral' : 'bad' }),
            cell(c.health),
            cell(c.major_change),
            cell(String(c.open_issues)),
          ]),
        },
        {
          kind: 'actions',
          title: 'Recommended actions',
          items: [
            opportunityAction(opportunities.find((o) => o.id === 'opp-lead-routing')!),
            opportunityAction(opportunities.find((o) => o.id === 'opp-beacon-pricing')!),
          ],
        },
      ],
      systems: ['netsuite', 'salesforce', 'hubspot'],
      entities: ['Metric', 'Company'],
      period: PRIMARY_PERIOD,
      tools: ['compare_to_plan', 'rank_gap', 'attribute_cause'],
    };
  },
};

/* ── Customers at risk ───────────────────────────────────────────────────── */

const churnResolver: Resolver = {
  id: 'churn',
  score: (q) => {
    const n = hits(q.lower, 'churn', 'at risk', 'at-risk', 'retention', 'losing customers', 'customers leaving', 'cancel');
    if (!n) return 0;
    return 84 + n * 3;
  },
  build: (_q, scope) => {
    const risky = atRiskCustomers(scope).slice(0, 6);
    const exposure = risky.reduce((s, c) => s + c.arr * c.churn_risk, 0);

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${risky.length} accounts carry ${money(exposure)} of weighted revenue at risk.`,
          sub: 'Weighted exposure is revenue × modeled churn probability, not the full contract value.',
        },
        {
          kind: 'table',
          title: 'Highest exposure first',
          columns: [
            { key: 'cust', label: 'Customer' },
            { key: 'company', label: 'Company', muted: true },
            { key: 'arr', label: 'Revenue', align: 'right' },
            { key: 'risk', label: 'Churn risk', align: 'right' },
            { key: 'why', label: 'Why' },
          ],
          rows: risky.map((c) => [
            cell(c.name),
            cell(companyName(c.company_id), { href: `/company/${c.company_id}` }),
            cell(money(c.arr)),
            cell(percent(c.churn_risk, 0), { tone: c.churn_risk > 0.55 ? 'bad' : 'neutral' }),
            cell(c.churn_reason ?? 'Health score decline with no single driver'),
          ]),
        },
        {
          kind: 'findings',
          title: 'The pattern underneath',
          items: [
            metricFinding(findMetric('northstar', 'churn')!, changeReason('northstar', 'churn'), 'Root cause'),
            {
              claim: 'Concentration makes this worse than the churn rate suggests',
              reason:
                'Three of Northstar\'s top ten accounts by commission are in the at-risk cohort, and the median time since a producer touched them is 112 days.',
              reason_label: 'Exposure',
              evidence_id: 'ev-north-concentration',
              tone: 'bad',
              company_id: 'northstar',
            },
          ],
        },
        {
          kind: 'actions',
          title: 'Recommended actions',
          items: [
            {
              title: 'Assign 64 untouched accounts to named producers',
              detail: 'Customer Agent has the assignment set built and is waiting on approval.',
              impact: '$480K of commission revenue defensible',
              effort: '2 weeks to launch',
              cta: 'Review approval',
              kind: 'approval',
              target: 'act-north-outreach',
            },
            opportunityAction(opportunities.find((o) => o.id === 'opp-north-churn')!),
          ],
        },
      ],
      systems: ['salesforce', 'hubspot', 'netsuite', 'zendesk'],
      entities: ['Customer', 'Metric', 'Employee'],
      period: 'Trailing 6 months',
      tools: ['score_churn_risk', 'rank_by_exposure', 'retrieve_contact_history'],
    };
  },
};

/* ── EBITDA / financial explanation ──────────────────────────────────────── */

const ebitdaResolver: Resolver = {
  id: 'ebitda',
  score: (q) => {
    const n = hits(q.lower, 'ebitda', 'margin', 'profit', 'profitability', 'why did earnings');
    if (!n) return 0;
    return 80 + n * 3;
  },
  build: (_q, scope) => {
    const bridge = [
      { id: 'clearline', delta: 700_000 },
      { id: 'atlas', delta: 400_000 },
      { id: 'beacon', delta: 200_000 },
      { id: 'summit', delta: 100_000 },
      { id: 'northstar', delta: -600_000 },
    ].filter((b) => !scope || b.id === scope);

    return {
      blocks: [
        {
          kind: 'headline',
          text: scope
            ? `${companyName(scope)} EBITDA moved ${money(bridge[0]?.delta ?? 0, { sign: true })}.`
            : `Portfolio EBITDA is ${money(portfolioTotals.ebitda)}, up 4.7%. Northstar is the entire drag.`,
          sub: 'Trailing twelve months against the prior year, eliminations applied at the holding level.',
        },
        {
          kind: 'ledger',
          title: 'EBITDA bridge',
          items: bridge.map((b) => ({
            label: companyName(b.id),
            value: money(b.delta, { sign: true }),
            note: companyById[b.id].major_change,
            evidence_id: 'ev-portfolio-ebitda',
          })),
          total: { label: 'Net change', value: money(bridge.reduce((s, b) => s + b.delta, 0), { sign: true }) },
        },
        {
          kind: 'findings',
          title: 'What is driving it',
          items: [
            {
              company_id: 'northstar',
              claim: 'Northstar gave back $600K',
              reason:
                'Revenue fell 3% while the cost base held flat. Retention is the mechanism: $1.58M of premium left the book in six months and new business did not replace it.',
              reason_label: 'Primary reason',
              evidence_id: 'ev-north-churn',
              tone: 'bad',
            },
            metricFinding(findMetric('atlas', 'overtime_hours')!, changeReason('atlas', 'overtime_hours'), 'Emerging pressure'),
            metricFinding(findMetric('summit', 'gross_margin')!, changeReason('summit', 'gross_margin'), 'Emerging pressure'),
          ],
        },
        {
          kind: 'actions',
          title: 'Recommended actions',
          items: [
            opportunityAction(opportunities.find((o) => o.id === 'opp-north-churn')!),
            opportunityAction(opportunities.find((o) => o.id === 'opp-summit-margin')!),
          ],
        },
      ],
      systems: ['quickbooks', 'netsuite', 'salesforce', 'rippling'],
      entities: ['Metric', 'Transaction', 'Company'],
      period: 'Trailing 12 months',
      tools: ['build_ebitda_bridge', 'attribute_variance', 'rank_by_impact'],
    };
  },
};

/* ── Automation / headcount ──────────────────────────────────────────────── */

const automationResolver: Resolver = {
  id: 'automation',
  score: (q) => {
    const n = hits(q.lower, 'automate', 'automation', 'ai reduce', 'reduce headcount', 'headcount', 'manual work', 'standardize');
    if (!n) return 0;
    return 82 + n * 3;
  },
  build: () => {
    const auto = opportunities.filter((o) => o.category === 'automation' || o.category === 'cross-company');
    return {
      blocks: [
        {
          kind: 'headline',
          text: `${money(auto.reduce((s, o) => s + o.impact, 0))} of work is running on people where rules would do.`,
          sub: 'Framed as capacity redeployed, not headcount removed — every estimate below assumes the hours move to higher-value work.',
        },
        {
          kind: 'findings',
          items: auto.map((o) => ({
            company_id: o.affected_company_ids.length === 1 ? o.affected_company_ids[0] : undefined,
            claim: o.title,
            reason: o.thesis,
            reason_label: 'Mechanism',
            evidence_id: o.evidence_ids[0],
            facts: [{ label: 'Annual impact', value: money(o.impact), evidence_id: o.evidence_ids[0] }],
          })),
        },
        {
          kind: 'callout',
          label: 'What Company Brain will not claim',
          text: 'None of these estimates model layoffs. Clearline needs 6 dispatchers on an exception desk, and Beacon converts recovered coding hours into advisory work that bills at more than twice the rate. Presenting automation as headcount reduction would overstate the savings and understate the risk.',
        },
        { kind: 'actions', title: 'Recommended actions', items: auto.slice(0, 2).map(opportunityAction) },
      ],
      systems: ['netsuite', 'quickbooks', 'hubspot', 'salesforce'],
      entities: ['Workflow', 'Employee', 'Department', 'Opportunity'],
      period: 'Trailing 12 months',
      tools: ['sample_manual_work', 'classify_rules_eligible', 'model_redeployment'],
    };
  },
};

/* ── Two-company comparison ──────────────────────────────────────────────── */

const compareResolver: Resolver = {
  id: 'compare',
  score: (q) => {
    if (q.mentions.length < 2) return 0;
    const n = hits(q.lower, 'compare', 'versus', ' vs', 'against', 'difference between', 'better');
    if (!n) return 0;
    return 83 + n * 3;
  },
  build: (q) => {
    const [a, b] = q.mentions.map((id) => companyById[id]);
    const keys = ['rev_per_seller', 'inbound_conversion', 'gross_margin'];

    const rows: Cell[][] = keys.flatMap((key) => {
      const ma = findMetric(a.id, key);
      const mb = findMetric(b.id, key);
      if (!ma || !mb) return [];
      const aWins = ma.polarity === 'lower-better' ? ma.value < mb.value : ma.value > mb.value;
      return [
        [
          cell(ma.label),
          cell(metricValue(ma), { evidence_id: ma.evidence_id, emphasis: aWins, tone: aWins ? 'good' : undefined }),
          cell(metricValue(mb), { evidence_id: mb.evidence_id, emphasis: !aWins, tone: !aWins ? 'good' : undefined }),
          cell(gapLabel(ma, mb)),
        ] as Cell[],
      ];
    });

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${a.name} vs. ${b.name}`,
          sub: `${q.period ?? 'Trailing 12 months'} · normalized to comparable definitions across ${a.source === b.source ? 'one system' : 'two different systems'}.`,
        },
        {
          kind: 'table',
          columns: [
            { key: 'metric', label: 'Metric' },
            { key: 'a', label: a.handle, align: 'right' },
            { key: 'b', label: b.handle, align: 'right' },
            { key: 'gap', label: 'Gap', align: 'right' },
          ],
          rows,
          note: `${a.name} reports from ${a.source}; ${b.name} reports from ${b.source}. Definitions were mapped to the canonical metric layer before comparison.`,
        },
        {
          kind: 'stats',
          items: [
            { label: `${a.handle} revenue`, value: money(a.revenue) },
            { label: `${b.handle} revenue`, value: money(b.revenue) },
            { label: `${a.handle} EBITDA margin`, value: percent(a.ebitda / a.revenue) },
            { label: `${b.handle} EBITDA margin`, value: percent(b.ebitda / b.revenue) },
          ],
        },
        {
          kind: 'prose',
          text: `${a.summary} ${b.summary}`,
        },
        {
          kind: 'followups',
          items: [
            'Which company has the best sales operation?',
            `What changed at ${a.handle} this month?`,
            'Where can I save $500K across the portfolio?',
          ],
        },
      ],
      systems: [a.source, b.source],
      entities: ['Metric', 'Company'],
      period: q.period ?? 'Trailing 12 months',
      tools: ['normalize_metric_definitions', 'compare_pair'],
    };
  },
};

/** How much better or worse the first company is on this metric. */
function gapLabel(a: Metric, b: Metric): string {
  return signedPercent(change(a.value, b.value));
}

/* ── Vendor lookup ───────────────────────────────────────────────────────── */

const vendorLookupResolver: Resolver = {
  id: 'vendor-lookup',
  score: (q) => {
    const match = vendorRollups().find((r) => q.lower.includes(r.name.toLowerCase()));
    return match ? 70 : 0;
  },
  build: (q) => {
    const roll = vendorRollups().find((r) => q.lower.includes(r.name.toLowerCase()))!;
    return {
      blocks: [
        {
          kind: 'headline',
          text: `${roll.name} — ${money(roll.total_spend)} annual portfolio spend`,
          sub: `${roll.category} · used by ${roll.companies.length} of ${companies.length} companies`,
        },
        {
          kind: 'table',
          columns: [
            { key: 'company', label: 'Company' },
            { key: 'spend', label: 'Annual spend', align: 'right' },
            { key: 'seats', label: 'Seats', align: 'right' },
            { key: 'util', label: 'Utilization', align: 'right' },
            { key: 'end', label: 'Contract end', muted: true },
          ],
          rows: roll.records.map((r) => [
            cell(companyName(r.company_id), { href: `/company/${r.company_id}` }),
            cell(money(r.annual_spend)),
            cell(r.seats ? String(r.seats) : '—'),
            cell(r.utilization !== undefined ? percent(r.utilization, 0) : '—', {
              tone: r.utilization !== undefined && r.utilization < 0.2 ? 'bad' : undefined,
            }),
            cell(r.contract_end),
          ]),
        },
        ...(roll.companies.length > 1
          ? ([
              {
                kind: 'callout',
                label: 'Cross-company observation',
                text: `${roll.companies.length} separate agreements with the same vendor. Combined volume has never been presented to ${roll.name} as one account.`,
              },
            ] as Block[])
          : []),
      ],
      systems: [...new Set(roll.records.map((r) => r.source))],
      entities: ['Vendor', 'Transaction'],
      period: 'Trailing 12 months',
      tools: ['lookup_vendor', 'rollup_across_companies'],
    };
  },
};

/* ── Company brief (scoped fallback) ─────────────────────────────────────── */

const companyBriefResolver: Resolver = {
  id: 'company-brief',
  score: (q, scope) => {
    const target = q.mentions[0] ?? scope;
    return target ? 40 : 0;
  },
  build: (q, scope) => {
    const c = companyById[q.mentions[0] ?? scope!];
    const moved = metricsFor(c.id)
      .map((m) => ({ m, delta: change(m.value, m.prior_value) }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3);

    return {
      blocks: [
        {
          kind: 'headline',
          text: `${c.name} — ${money(c.revenue)} revenue, ${money(c.ebitda)} EBITDA, ${signedPercent(c.growth)} YoY`,
          sub: `${c.sector} · ${c.hq} · ${c.employees} employees · acquired ${c.acquired}`,
        },
        { kind: 'prose', text: c.summary },
        { kind: 'findings', title: 'What moved', items: moved.map(({ m }) => metricFinding(m, changeReason(c.id, m.key), 'What is behind it')) },
        {
          kind: 'stats',
          items: [
            { label: 'EBITDA margin', value: percent(c.ebitda / c.revenue) },
            { label: 'Revenue / employee', value: money(c.revenue / c.employees) },
            { label: 'Customers tracked', value: String(customersFor(c.id).length) },
            { label: 'Vendors tracked', value: String(vendors.filter((v) => v.company_id === c.id).length) },
          ],
        },
        {
          kind: 'actions',
          title: 'Open items',
          items: [
            { title: `Open the ${c.name} company page`, cta: 'Open company', kind: 'route', target: `/company/${c.id}` },
            ...opportunities
              .filter((o) => o.company_id === c.id || o.affected_company_ids.includes(c.id))
              .slice(0, 2)
              .map(opportunityAction),
          ],
        },
      ],
      systems: [c.source],
      entities: ['Company', 'Metric', 'Customer', 'Vendor'],
      period: q.period ?? PRIMARY_PERIOD,
      tools: ['load_company_context', 'diff_metrics', 'list_opportunities'],
    };
  },
};

/* ── Fallback ────────────────────────────────────────────────────────────── */

const fallbackResolver: Resolver = {
  id: 'fallback',
  score: () => 1,
  build: (q, scope) => {
    const scopedOpps = opportunities.filter(
      (o) => !scope || o.company_id === scope || o.affected_company_ids.includes(scope),
    );
    return {
      blocks: [
        {
          kind: 'headline',
          text: 'Company Brain does not have a grounded answer to that yet.',
          sub: `It will not guess. Here is what is connected for ${scope ? companyName(scope) : 'the portfolio'}, and what it can answer from that.`,
        },
        {
          kind: 'stats',
          items: [
            { label: 'Companies', value: String(scope ? 1 : companies.length) },
            { label: 'Evidence records', value: String(evidence.length) },
            { label: 'Open opportunities', value: String(scopedOpps.length) },
            { label: 'Pending approvals', value: String(pendingActions(scope).length) },
          ],
        },
        {
          kind: 'prose',
          text: `The question "${q.raw.trim()}" did not map to a metric, entity or system Company Brain has normalized. That usually means the source data is not connected yet — or the question needs a company scope. Both are fixable.`,
        },
        {
          kind: 'followups',
          items: [
            'What needs my attention today?',
            'Where can I save $500K across the portfolio?',
            'Which company has the best sales operation?',
            'Find duplicate vendors.',
            'Which customers are at risk?',
          ],
        },
        {
          kind: 'actions',
          title: 'Or connect more data',
          items: [
            {
              title: 'Review data connections',
              detail: 'One system is in an error state and one is not connected.',
              cta: 'Open connections',
              kind: 'route',
              target: '/settings',
            },
          ],
        },
      ],
      systems: [],
      entities: [],
      period: q.period ?? PRIMARY_PERIOD,
      tools: ['classify_intent'],
    };
  },
};

const RESOLVERS: Resolver[] = [
  deployWorkflowResolver,
  attentionResolver,
  savingsResolver,
  vendorDuplicateResolver,
  salesComparisonResolver,
  targetsResolver,
  changedResolver,
  churnResolver,
  compareResolver,
  ebitdaResolver,
  automationResolver,
  vendorLookupResolver,
  companyBriefResolver,
  fallbackResolver,
];

/* ────────────────────────────────────────────────────────────────────────────
 * Public entry point
 * ──────────────────────────────────────────────────────────────────────────── */

let counter = 0;

/**
 * Resolves a natural-language question into a structured response.
 *
 * Swapping this for a real model call is a single-function change: the resolver
 * contract already assembles the retrieval context that would be sent as the
 * prompt, and the `Block[]` output is the schema the model would be asked for.
 */
export function resolve(rawQuery: string, scopeCompanyId: string | null, userName = 'Alex'): AIResponse {
  const q = parseQuery(rawQuery);
  // An explicit @mention overrides the sidebar scope.
  const scope = q.mentions.length === 1 ? q.mentions[0] : q.mentions.length > 1 ? null : scopeCompanyId;

  const best = RESOLVERS.map((r) => ({ r, score: r.score(q, scope) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  const out = best.r.build(q, scope);
  const evidenceCount = countEvidence(out.blocks);

  counter += 1;
  return {
    id: `res-${counter}`,
    query: rawQuery,
    scope_company_id: scope,
    resolver: best.r.id,
    blocks: out.blocks,
    latency_ms: 620 + (rawQuery.length % 7) * 90,
    created_at: new Date().toISOString(),
    context: {
      user: userName,
      scope: scope ? companyName(scope) : 'Entire portfolio',
      question: rawQuery.trim(),
      systems: out.systems ?? [],
      entities: out.entities ?? [],
      period: out.period ?? PRIMARY_PERIOD,
      evidence_count: evidenceCount,
      tools: out.tools ?? [],
    },
  };
}

function countEvidence(blocks: Block[]): number {
  const ids = new Set<string>();
  const add = (id?: string) => {
    if (id) ids.add(id);
  };
  for (const b of blocks) {
    switch (b.kind) {
      case 'prose':
      case 'callout':
        add(b.evidence_id);
        break;
      case 'findings':
        for (const f of b.items) {
          add(f.evidence_id);
          f.facts?.forEach((x) => add(x.evidence_id));
        }
        break;
      case 'table':
        for (const row of b.rows) for (const c of row) add(c.evidence_id);
        break;
      case 'stats':
      case 'ledger':
        for (const i of b.items) add(i.evidence_id);
        break;
      default:
        break;
    }
  }
  return ids.size;
}

/** Suggested prompts shown under the command bar. */
export const SUGGESTED_QUERIES = [
  'What needs my attention today?',
  'Where can I save $500K across the portfolio?',
  'Which company has the best sales operation?',
  'What changed this week?',
  'Find duplicate vendors.',
  'Which customers are at risk?',
  'Which companies are missing targets?',
  'Where could automation reduce manual work?',
];
