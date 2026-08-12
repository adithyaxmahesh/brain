import type { Opportunity, OpportunityCategory } from './types';
import { NOW } from './portfolio';

const stamp = { created_at: '2026-06-01T00:00:00Z', updated_at: NOW };

type Seed = Omit<Opportunity, 'created_at' | 'updated_at' | 'holding_company_id'>;

const o = (seed: Seed): Opportunity => ({ ...seed, holding_company_id: 'redwood', ...stamp });

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  revenue: 'Revenue',
  'cost-reduction': 'Cost reduction',
  'cross-company': 'Cross-company leverage',
  automation: 'Automation',
  'vendor-consolidation': 'Vendor consolidation',
  people: 'People',
  'customer-retention': 'Customer retention',
  'operational-risk': 'Operational risk',
};

/** Categories whose impact is a cost the portfolio stops paying. */
export const SAVINGS_CATEGORIES: OpportunityCategory[] = [
  'cost-reduction',
  'vendor-consolidation',
  'automation',
];

export const opportunities: Opportunity[] = [
  o({
    id: 'opp-payroll',
    company_id: null,
    source: 'ramp',
    title: 'Duplicate payroll vendors',
    category: 'vendor-consolidation',
    impact: 186_000,
    impact_note: 'Annual savings at the best rate already held inside the portfolio',
    confidence: 'high',
    affected_company_ids: ['atlas', 'beacon', 'northstar', 'summit'],
    detected: '11 days ago',
    thesis:
      'Four payroll providers serve five companies at four different per-employee rates. Clearline pays $846 per employee; Beacon pays $1,919 for the same function. Consolidating onto a single portfolio-level contract reduces payroll administration cost by roughly 23%.',
    detection: [
      { label: 'Atlas HVAC', value: 'ADP · $194K/yr' },
      { label: 'Beacon Accounting', value: 'Rippling · $142K/yr' },
      { label: 'Northstar Insurance', value: 'Paylocity · $168K/yr' },
      { label: 'Summit Plumbing', value: 'ADP · $121K/yr' },
      { label: 'Clearline Logistics', value: 'Rippling · $181K/yr' },
    ],
    steps: [
      'Confirm contract end dates and termination terms for all four providers',
      'Request portfolio-volume quotes from ADP and Rippling (both already in use)',
      'Sequence migrations to the two Dec 31, 2026 renewals first',
      'Hold Northstar until the Paylocity term expires in Mar 2027',
    ],
    evidence_ids: ['ev-portfolio-payroll'],
    effort: '6–10 weeks, staged by renewal date',
    status: 'open',
  }),
  o({
    id: 'opp-software',
    company_id: null,
    source: 'ramp',
    title: 'Redundant software licenses',
    category: 'cost-reduction',
    impact: 94_000,
    impact_note: 'Annual spend on duplicate or effectively unused subscriptions',
    confidence: 'high',
    affected_company_ids: ['atlas', 'beacon', 'summit', 'clearline'],
    detected: '3 days ago',
    thesis:
      'Five subscriptions are either functionally duplicated at the same company or running below 15% seat utilization. The Beacon Slack contract is the clearest case: the company completed a Teams migration 41 days ago and 3 of 74 seats remain active.',
    detection: [
      { label: 'Beacon — Slack', value: '$18.4K · 3 of 74 seats active' },
      { label: 'Portfolio — DocuSign ×3', value: '$27.6K · consolidation available' },
      { label: 'Summit — Jobber', value: '$21.0K · superseded by ServiceTitan' },
      { label: 'Clearline — Zoom', value: '$14.9K · 61% overlap with Teams' },
      { label: 'Atlas — Asana', value: '$12.1K · 9 of 84 seats active' },
    ],
    steps: [
      'Cancel Beacon Slack before the Oct 1 renewal',
      'Consolidate three DocuSign accounts onto one enterprise agreement',
      'Complete the Summit Jobber → ServiceTitan cutover and let Jobber lapse Oct 31',
      'Reduce Clearline Zoom to the 39% of seats with genuine external-meeting need',
    ],
    evidence_ids: ['ev-portfolio-software', 'ev-beacon-slack', 'ev-portfolio-docusign', 'ev-summit-field-software'],
    effort: '2–4 weeks',
    status: 'open',
  }),
  o({
    id: 'opp-lead-routing',
    company_id: null,
    source: 'company-brain',
    title: 'Standardize lead routing across the portfolio',
    category: 'revenue',
    impact: 410_000,
    impact_note: 'Modeled annual revenue uplift, discounted 35% for market mix',
    confidence: 'medium',
    affected_company_ids: ['beacon', 'northstar', 'summit'],
    detected: '6 days ago',
    thesis:
      'Atlas converts inbound leads to booked work at 41.2% against a portfolio average of 31.4%. The difference is not sales talent — it is a 15-minute response SLA with automatic round-robin assignment. Three companies have the lead volume to benefit and no routing rules at all.',
    detection: [
      { label: 'Atlas conversion', value: '41.2% · 15-min SLA' },
      { label: 'Portfolio average', value: '31.4%' },
      { label: 'Addressable leads / yr', value: '4,210 uncontacted or slow' },
      { label: 'Modeled uplift', value: '$410K after discount' },
    ],
    steps: [
      'Export the Atlas routing rules and response SLA definition from HubSpot',
      'Map to Salesforce (Northstar) and NetSuite CRM (Beacon) equivalents',
      'Pilot at Northstar for 30 days against a holdout',
      'Roll out to Beacon and Summit if the pilot holds above +6 points',
    ],
    evidence_ids: ['ev-portfolio-lead-routing', 'ev-atlas-lead-workflow', 'ev-north-uncontacted'],
    effort: '30-day pilot, then 3 weeks per company',
    status: 'open',
  }),
  o({
    id: 'opp-atlas-workflow',
    company_id: null,
    source: 'company-brain',
    title: "Deploy Atlas's lead follow-up workflow to Northstar",
    category: 'cross-company',
    impact: 220_000,
    impact_note: 'Estimated first-year new business recovered at Northstar',
    confidence: 'high',
    affected_company_ids: ['northstar'],
    detected: '6 days ago',
    thesis:
      'Northstar has 498 inbound leads with no logged contact attempt after 72 hours, up 42%. Atlas runs an 11-month-proven 5-touch sequence against the same class of inbound demand. The workflow is portable: both are first-party web and phone leads with a named owner at assignment.',
    detection: [
      { label: 'Northstar uncontacted leads', value: '498 in 90 days' },
      { label: 'Atlas sequence lift', value: '+31% vs. holdout control' },
      { label: 'Northstar close rate on contacted', value: '26.4%' },
      { label: 'Recoverable new business', value: '$220K year one' },
    ],
    steps: [
      'Replicate the 5-touch cadence as a Salesforce flow',
      'Enable round-robin assignment across 22 producers',
      'Backfill the 498 uncontacted leads as a one-time campaign',
      'Report weekly on first-response time against the 15-minute SLA',
    ],
    evidence_ids: ['ev-atlas-workflow-proof', 'ev-north-uncontacted', 'ev-atlas-lead-workflow'],
    effort: '2 days to configure, 30 days to measure',
    status: 'open',
  }),
  o({
    id: 'opp-overtime',
    company_id: 'atlas',
    source: 'rippling',
    title: 'Atlas technician overtime run-rate',
    category: 'cost-reduction',
    impact: 180_000,
    impact_note: 'Annualized EBITDA exposure if the current trend holds',
    confidence: 'high',
    affected_company_ids: ['atlas'],
    detected: '2 days ago',
    thesis:
      'Overtime hours rose 17% month-over-month while headcount was flat. Two dispatcher departures in June pushed scheduling onto the field, and the same gap explains the lead-response deterioration. Backfilling dispatch is cheaper than paying the overtime premium.',
    detection: [
      { label: 'OT hours, July', value: '2,504 · was 2,140' },
      { label: 'Incremental monthly cost', value: '$15.1K' },
      { label: 'Annualized', value: '$181K' },
      { label: 'Dispatch vacancies', value: '2 since June' },
    ],
    steps: [
      'Backfill two dispatcher roles at a loaded cost of roughly $124K',
      'Re-enable the capacity-based scheduling rules disabled in June',
      'Cap discretionary OT approval at the department-lead level',
    ],
    evidence_ids: ['ev-atlas-overtime', 'ev-atlas-lead-response'],
    effort: '4–6 weeks to hire',
    status: 'open',
  }),
  o({
    id: 'opp-dispatch-automation',
    company_id: 'clearline',
    source: 'netsuite',
    title: 'Automate rules-eligible dispatch at Clearline',
    category: 'automation',
    impact: 265_000,
    impact_note: 'Annual labor cost redeployed, net of software',
    confidence: 'medium',
    affected_company_ids: ['clearline'],
    detected: '9 days ago',
    thesis:
      '84% of 41,208 load assignments are touched manually, and 61% of those match a deterministic rule set already encoded in the TMS. Automating the rules-eligible share redeploys roughly 6 dispatcher FTE toward exception handling rather than requiring layoffs.',
    detection: [
      { label: 'Load assignments / quarter', value: '41,208' },
      { label: 'Manually touched', value: '84%' },
      { label: 'Rules-eligible', value: '61% of manual' },
      { label: 'Dispatcher cost', value: '$2.18M/yr · 26 FTE' },
    ],
    steps: [
      'Validate the rule set against a 2,000-load replay',
      'Enable auto-assignment for the 4 highest-volume lanes',
      'Redeploy 6 FTE to exception desk and customer escalation',
      'Expand lane coverage monthly against an error-rate ceiling',
    ],
    evidence_ids: ['ev-clear-dispatch'],
    effort: '8–12 weeks',
    status: 'open',
  }),
  o({
    id: 'opp-cyber',
    company_id: null,
    source: 'ramp',
    title: 'Cybersecurity vendor consolidation',
    category: 'vendor-consolidation',
    impact: 128_000,
    impact_note: 'Annual savings on a single-vendor portfolio agreement',
    confidence: 'medium',
    affected_company_ids: ['atlas', 'beacon', 'northstar', 'summit', 'clearline'],
    detected: '14 days ago',
    thesis:
      'Five companies run five different endpoint security vendors at per-endpoint rates ranging from $418 to $742. Consolidated volume across 652 endpoints qualifies for enterprise pricing, and a single vendor also collapses five separate audit and cyber-insurance evidence workflows into one.',
    detection: [
      { label: 'Atlas — CrowdStrike', value: '$611/endpoint' },
      { label: 'Beacon — SentinelOne', value: '$728/endpoint' },
      { label: 'Northstar — Sophos', value: '$742/endpoint' },
      { label: 'Summit — Malwarebytes', value: '$418/endpoint' },
      { label: 'Clearline — Defender', value: '$570/endpoint' },
    ],
    steps: [
      'Run a security review of the two finalist platforms',
      'Validate Northstar cyber-insurance requirements against both',
      'Negotiate a 652-endpoint portfolio agreement',
      'Migrate at renewal, starting with Northstar in Nov 2026',
    ],
    evidence_ids: ['ev-portfolio-cyber'],
    effort: '1–2 quarters, staged by renewal',
    status: 'open',
  }),
  o({
    id: 'opp-north-churn',
    company_id: 'northstar',
    source: 'salesforce',
    title: 'Northstar mid-market retention intervention',
    category: 'customer-retention',
    impact: 480_000,
    impact_note: 'Commission revenue defensible in the next two renewal cycles',
    confidence: 'medium',
    affected_company_ids: ['northstar'],
    detected: '1 day ago',
    thesis:
      'Annualized churn moved from 9.4% to 11.1% and the cause is coverage, not price: 64 of 212 mid-market accounts have had no producer contact in 90 days, and three of the top ten accounts are among them. A structured touch program on the at-risk cohort addresses the majority of modeled loss.',
    detection: [
      { label: 'Annualized churn', value: '11.1% · was 9.4%' },
      { label: 'Accounts untouched 90 days', value: '64 of 212' },
      { label: 'At-risk premium in top 10', value: '$2.1M' },
      { label: 'Lost premium, 6 months', value: '$1.58M' },
    ],
    steps: [
      'Assign the 64 untouched accounts to named producers with a 10-day contact deadline',
      'Pre-build remarketing packets for the 3 at-risk top-10 accounts',
      'Start renewal outreach 120 days out instead of 45',
      'Escalate the two open claims disputes at Carolina Freight',
    ],
    evidence_ids: ['ev-north-churn', 'ev-north-concentration'],
    effort: '2 weeks to launch',
    status: 'open',
  }),
  o({
    id: 'opp-contractor',
    company_id: 'clearline',
    source: 'ramp',
    title: 'Clearline contractor spend on four lanes',
    category: 'cost-reduction',
    impact: 142_000,
    impact_note: 'Annual savings from converting contracted capacity to company drivers',
    confidence: 'high',
    affected_company_ids: ['clearline'],
    detected: '9 days ago',
    thesis:
      'Contractor spend grew 31% while volume grew 9%. Four lanes account for 68% of the increase and each carries a $0.41 per-mile premium over company drivers. Those lanes have stable, forecastable volume — the profile that justifies permanent capacity.',
    detection: [
      { label: 'Contractor spend, 6 months', value: '$3.42M · ↑31%' },
      { label: 'Volume growth', value: '+9%' },
      { label: 'Top 4 lanes', value: '68% of the increase' },
      { label: 'Rate premium', value: '$0.41/mi' },
    ],
    steps: [
      'Model 8 company-driver adds against the four lanes',
      'Hold spot capacity for seasonal peaks only',
      'Renegotiate the Redline owner-operator agreement at lower committed volume',
    ],
    evidence_ids: ['ev-clear-contractor'],
    effort: '1 quarter',
    status: 'open',
  }),
  o({
    id: 'opp-beacon-pricing',
    company_id: 'beacon',
    source: 'netsuite',
    title: 'Beacon realized-rate realignment',
    category: 'revenue',
    impact: 310_000,
    impact_note: 'Annual fee uplift at 60% client adoption',
    confidence: 'medium',
    affected_company_ids: ['beacon'],
    detected: '16 days ago',
    thesis:
      'Beacon bills $118/hr realized on small-client CAS work and $147/hr on mid-market clients running the identical scope template. The gap is legacy pricing that never followed scope changes, not a difference in delivery cost.',
    detection: [
      { label: 'CAS small realized rate', value: '$118/hr · 212 clients' },
      { label: 'CAS mid realized rate', value: '$147/hr · same scope' },
      { label: 'Uplift at 60% adoption', value: '$310K/yr' },
      { label: 'Historical repricing churn', value: '6%' },
    ],
    steps: [
      'Segment the 212 small-CAS clients by scope creep since onboarding',
      'Issue scope-anchored price adjustments at the next engagement letter',
      'Grandfather the top decile by tenure to hold churn under 6%',
    ],
    evidence_ids: ['ev-beacon-pricing'],
    effort: '1 quarter, at engagement-letter renewal',
    status: 'open',
  }),
  o({
    id: 'opp-beacon-ap',
    company_id: 'beacon',
    source: 'netsuite',
    title: 'Automate transaction coding at Beacon',
    category: 'automation',
    impact: 88_000,
    impact_note: 'Annual delivery cost recoverable at a 38% automation rate',
    confidence: 'medium',
    affected_company_ids: ['beacon'],
    detected: '21 days ago',
    thesis:
      'Beacon spends 11,400 half-year hours on transaction coding and bank reconciliation. A 400-entry sample shows 38% follow rules stable enough to automate. Recovered hours convert directly into advisory capacity, which bills at more than twice the rate.',
    detection: [
      { label: 'Delivery hours, 6 months', value: '11,400' },
      { label: 'Blended cost', value: '$46/hr' },
      { label: 'Rules-automatable', value: '38% of sampled entries' },
      { label: 'Annualized recoverable', value: '$88K' },
    ],
    steps: [
      'Codify the top 20 recurring coding rules per client template',
      'Run in shadow mode for one close cycle',
      'Shift reviewed hours to advisory engagements',
    ],
    evidence_ids: ['ev-beacon-ap-hours'],
    effort: '6–8 weeks',
    status: 'open',
  }),
  o({
    id: 'opp-benefits',
    company_id: null,
    source: 'quickbooks',
    title: 'Benefits brokerage consolidation',
    category: 'cost-reduction',
    impact: 112_000,
    impact_note: 'Annual fee savings at the best in-portfolio fee load',
    confidence: 'medium',
    affected_company_ids: ['atlas', 'beacon', 'northstar', 'clearline'],
    detected: '18 days ago',
    thesis:
      'Three brokers collect $412K on $9.8M of funded premium — a 4.2% blended load against 3.1% at Clearline. Consolidating to one broker at the best existing load saves $112K without changing plan design.',
    detection: [
      { label: 'Total broker fees', value: '$412K on $9.8M premium' },
      { label: 'Blended fee load', value: '4.2%' },
      { label: 'Best in-portfolio load', value: '3.1% · Clearline' },
      { label: 'Brokers in use', value: '3 across 5 companies' },
    ],
    steps: [
      'Issue one RFP covering all five entities',
      'Hold plan design constant to isolate the fee comparison',
      'Align renewal dates to a common Jan 1 cycle',
    ],
    evidence_ids: ['ev-portfolio-benefits'],
    effort: '1 quarter, ahead of Jan 1 renewals',
    status: 'open',
  }),
  o({
    id: 'opp-summit-margin',
    company_id: 'summit',
    source: 'quickbooks',
    title: 'Summit new-construction bid discipline',
    category: 'operational-risk',
    impact: 240_000,
    impact_note: 'Margin recoverable by holding the 25% gross-margin floor',
    confidence: 'high',
    affected_company_ids: ['summit'],
    detected: '5 days ago',
    thesis:
      'New-construction work is running at 18.2% gross margin against 34.6% on service, and 11 of the last 19 bids went out below the 25% portfolio floor. Summit is buying revenue growth with margin — the growth is real but it is dilutive to portfolio EBITDA.',
    detection: [
      { label: 'New construction margin', value: '18.2% · was 24.1%' },
      { label: 'Service margin', value: '34.6%' },
      { label: 'Bids below floor', value: '11 of 19' },
      { label: 'Revenue at risk', value: '$4.9M at current mix' },
    ],
    steps: [
      'Require holding-level sign-off on bids under 25% gross margin',
      'Re-price the Reno Commons change orders in dispute',
      'Shift estimating capacity toward service and tenant-improvement work',
    ],
    evidence_ids: ['ev-summit-margin'],
    effort: 'Immediate — policy change',
    status: 'open',
  }),
  o({
    id: 'opp-stripe',
    company_id: null,
    source: 'stripe',
    title: 'Payment processing rate parity',
    category: 'vendor-consolidation',
    impact: 43_000,
    impact_note: 'Annual fee savings at a single negotiated portfolio rate',
    confidence: 'high',
    affected_company_ids: ['atlas', 'beacon', 'summit', 'clearline'],
    detected: '4 days ago',
    thesis:
      'Four companies process $9.2M through Stripe on four separately negotiated rates between 2.30% and 2.83%. Combined volume qualifies for one rate; nobody has ever asked, because no single company saw the aggregate.',
    detection: [
      { label: 'Combined volume', value: '$9.2M/yr' },
      { label: 'Fee range', value: '2.30% – 2.83%' },
      { label: 'Total fees', value: '$241K/yr' },
      { label: 'At parity', value: '$198K/yr' },
    ],
    steps: [
      'Consolidate under one Stripe organization with per-entity accounts',
      'Request volume pricing at the aggregate tier',
      'Keep separate settlement accounts for entity-level books',
    ],
    evidence_ids: ['ev-portfolio-stripe'],
    effort: '3 weeks',
    status: 'open',
  }),
];

export function opportunitiesFor(companyId: string | null): Opportunity[] {
  if (!companyId) return opportunities;
  return opportunities.filter(
    (x) => x.company_id === companyId || x.affected_company_ids.includes(companyId),
  );
}

export function opportunityById(id: string) {
  return opportunities.find((x) => x.id === id);
}

export function totalIdentifiedSavings(): number {
  return opportunities
    .filter((x) => SAVINGS_CATEGORIES.includes(x.category))
    .reduce((s, x) => s + x.impact, 0);
}

export function totalIdentifiedImpact(): number {
  return opportunities.reduce((s, x) => s + x.impact, 0);
}
