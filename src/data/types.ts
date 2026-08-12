/**
 * Canonical data layer.
 *
 * Every integration normalizes into these entities, so portfolio-wide analysis
 * never has to know how a given subsidiary's system stores things. The shape is
 * deliberately API-ready: each record carries the provenance fields
 * (`company_id`, `source`, timestamps) that the evidence system and the AI
 * context builder rely on.
 */

/** Systems we can normalize data out of. `manual` covers uploads and overrides. */
export type SourceSystem =
  | 'quickbooks'
  | 'netsuite'
  | 'hubspot'
  | 'salesforce'
  | 'ramp'
  | 'stripe'
  | 'google-workspace'
  | 'microsoft-365'
  | 'slack'
  | 'rippling'
  | 'gusto'
  | 'zendesk'
  | 'intercom'
  | 'manual'
  | 'company-brain';

export type IntegrationStatus = 'connected' | 'syncing' | 'error' | 'not-connected';

export type Health = 'strong' | 'watch' | 'risk';

export type Confidence = 'high' | 'medium' | 'low';

export type Trend = 'up' | 'down' | 'flat';

/** Whether a higher value is good, bad, or neither. Drives delta coloring. */
export type Polarity = 'higher-better' | 'lower-better' | 'neutral';

/** Fields shared by every canonical record. */
export interface BaseEntity {
  id: string;
  company_id: string | null;
  holding_company_id?: string;
  created_at: string;
  updated_at: string;
  source: SourceSystem;
}

export interface HoldingCompany {
  id: string;
  name: string;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

export interface Company extends BaseEntity {
  company_id: string;
  holding_company_id: string;
  name: string;
  /** Short handle used for `@mentions` in the command bar. */
  handle: string;
  sector: string;
  hq: string;
  acquired: string;
  revenue: number;
  ebitda: number;
  revenue_prior: number;
  ebitda_prior: number;
  growth: number;
  employees: number;
  health: Health;
  major_change: string;
  open_issues: number;
  summary: string;
  /** Trailing twelve months of revenue, oldest first — drives sparklines. */
  revenue_trend: number[];
}

export interface Department extends BaseEntity {
  company_id: string;
  name: string;
  headcount: number;
  cost: number;
  lead: string;
}

export interface Employee extends BaseEntity {
  company_id: string;
  name: string;
  title: string;
  department: string;
  comp: number;
  tenure_years: number;
  /** Present for quota-carrying roles. */
  revenue_attributed?: number;
}

export interface Customer extends BaseEntity {
  company_id: string;
  name: string;
  arr: number;
  since: string;
  health: Health;
  /** 0–1 modeled probability of churn in the next two quarters. */
  churn_risk: number;
  churn_reason?: string;
  owner: string;
}

export interface Vendor extends BaseEntity {
  /** Null when the vendor record is a rolled-up portfolio view. */
  company_id: string;
  name: string;
  category: string;
  annual_spend: number;
  contract_end: string;
  seats?: number;
  utilization?: number;
  status: 'active' | 'under-review' | 'cancellation-pending';
}

export interface Transaction extends BaseEntity {
  company_id: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  memo: string;
}

export interface Invoice extends BaseEntity {
  company_id: string;
  customer: string;
  amount: number;
  issued: string;
  due: string;
  status: 'paid' | 'open' | 'overdue';
}

export interface Metric extends BaseEntity {
  company_id: string;
  key: string;
  label: string;
  value: number;
  prior_value: number;
  unit: 'currency' | 'percent' | 'number' | 'minutes' | 'days' | 'ratio';
  polarity: Polarity;
  period: string;
  /** Points to the evidence record that substantiates this metric. */
  evidence_id: string;
  /** Optional history, oldest first. */
  history?: number[];
}

export interface Evidence {
  id: string;
  company_id: string | null;
  source: SourceSystem;
  /** The named report or object inside the source system. */
  report: string;
  period: string;
  /** Human-readable statement of what the data shows. */
  data: string;
  /** Optional supporting rows rendered as a small table in the drawer. */
  rows?: { label: string; value: string; note?: string }[];
  last_synced: string;
  /** How the number was derived, when it isn't a raw field. */
  method?: string;
  /** Caveats that keep the user honest about the conclusion. */
  caveats?: string[];
  record_count?: number;
}

export type OpportunityCategory =
  | 'revenue'
  | 'cost-reduction'
  | 'cross-company'
  | 'automation'
  | 'vendor-consolidation'
  | 'people'
  | 'customer-retention'
  | 'operational-risk';

export interface Opportunity extends BaseEntity {
  title: string;
  category: OpportunityCategory;
  /** Annualized dollar impact. Negative values are avoided cost. */
  impact: number;
  impact_note: string;
  confidence: Confidence;
  affected_company_ids: string[];
  detected: string;
  thesis: string;
  detection: { label: string; value: string }[];
  steps: string[];
  evidence_ids: string[];
  effort: string;
  status: 'open' | 'in-project' | 'dismissed';
}

export type ActionLevel = 1 | 2 | 3;

export type ActionStatus = 'automatic' | 'pending-approval' | 'approved' | 'rejected' | 'executed';

export interface Action extends BaseEntity {
  title: string;
  agent_id: string;
  /** 1: read/analyze. 2: draft/prepare. 3: execute/send/cancel/purchase. */
  level: ActionLevel;
  verb: string;
  status: ActionStatus;
  summary: string;
  rationale: string;
  impact: string;
  /** Systems the action will touch when executed. */
  systems: SourceSystem[];
  reversible: string;
  evidence_ids: string[];
  requested: string;
  /** Set once a human has decided. */
  decided_by?: string;
  decided_at?: string;
}

export interface Agent extends BaseEntity {
  name: string;
  function: string;
  objective: string;
  /** `null` scope means the whole portfolio. */
  scope_company_ids: string[] | null;
  systems: SourceSystem[];
  max_level: ActionLevel;
  status: 'active' | 'paused';
  performance: { label: string; value: string }[];
  recent_action_ids: string[];
  runs_last_30d: number;
  value_identified: number;
}

export interface ActivityEvent extends BaseEntity {
  /** ISO timestamp; the feed groups by day. */
  at: string;
  actor: string;
  actor_kind: 'agent' | 'human' | 'system';
  verb: string;
  object: string;
  detail?: string;
  level?: ActionLevel;
  link?: string;
}

export interface Alert extends BaseEntity {
  title: string;
  severity: 'critical' | 'material' | 'informational';
  body: string;
  metric_key?: string;
  evidence_ids: string[];
  cta: { label: string; to: string };
}

export interface Integration extends BaseEntity {
  system: SourceSystem;
  name: string;
  category: string;
  status: IntegrationStatus;
  last_synced?: string;
  record_count?: number;
  error?: string;
}

export interface Workflow extends BaseEntity {
  name: string;
  origin_company_id: string;
  description: string;
  steps: { name: string; detail: string; system: SourceSystem }[];
  /** Measured result at the company that originated it. */
  proof: string;
  deployed_company_ids: string[];
}

export interface Doc extends BaseEntity {
  title: string;
  kind: string;
  size: string;
}
