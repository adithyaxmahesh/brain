import type { ActivityEvent, Alert, Integration, Workflow } from './types';
import { NOW } from './portfolio';

const stamp = { created_at: '2026-08-01T00:00:00Z', updated_at: NOW };

/** The audit ledger. Human and agent events share one stream by design. */
export const activity: ActivityEvent[] = [
  { id: 'ac-1', company_id: null, source: 'company-brain', ...stamp, at: '2026-08-12T11:42:00-07:00', actor: 'Vendor Agent', actor_kind: 'agent', verb: 'identified', object: 'duplicate DocuSign accounts', detail: 'Atlas, Northstar and Clearline — $7.7K annual savings available', level: 1, link: '/opportunities/opp-software' },
  { id: 'ac-2', company_id: 'atlas', source: 'company-brain', ...stamp, at: '2026-08-12T10:31:00-07:00', actor: 'Sarah Lindqvist', actor_kind: 'human', verb: 'approved', object: 'Atlas scheduling rule restoration', detail: 'Level 3 action executed in ServiceTitan', level: 3, link: '/agents/agent-ops' },
  { id: 'ac-3', company_id: 'northstar', source: 'company-brain', ...stamp, at: '2026-08-12T09:58:00-07:00', actor: 'Revenue Agent', actor_kind: 'agent', verb: 'updated', object: 'Northstar lead routing analysis', detail: '498 uncontacted leads mapped to 22 producers', level: 1, link: '/company/northstar' },
  { id: 'ac-4', company_id: 'northstar', source: 'company-brain', ...stamp, at: '2026-08-12T08:02:00-07:00', actor: 'Customer Agent', actor_kind: 'agent', verb: 'requested approval for', object: 'assigning 64 untouched accounts', detail: 'Level 3 — awaiting your decision', level: 3, link: '/agents/agent-customer' },
  { id: 'ac-5', company_id: 'beacon', source: 'company-brain', ...stamp, at: '2026-08-12T07:41:00-07:00', actor: 'Vendor Agent', actor_kind: 'agent', verb: 'requested approval for', object: 'Beacon Slack cancellation', detail: 'Level 3 — $18,400 annual savings', level: 3, link: '/agents/agent-vendor' },
  { id: 'ac-6', company_id: 'summit', source: 'company-brain', ...stamp, at: '2026-08-12T05:52:00-07:00', actor: 'Finance Agent', actor_kind: 'agent', verb: 'flagged', object: '11 bids below the margin floor', detail: 'Summit new construction, trailing two quarters', level: 1, link: '/company/summit' },
  { id: 'ac-7', company_id: null, source: 'quickbooks', ...stamp, at: '2026-08-12T04:15:00-07:00', actor: 'Integration Agent', actor_kind: 'system', verb: 'completed', object: 'QuickBooks sync', detail: '3 entities · 41,206 records normalized', link: '/settings' },

  { id: 'ac-8', company_id: 'clearline', source: 'company-brain', ...stamp, at: '2026-08-11T16:21:00-07:00', actor: 'Operations Agent', actor_kind: 'agent', verb: 'analyzed', object: 'Clearline dispatch cycle', detail: '41,208 loads · 84% manually touched', level: 1, link: '/opportunities/opp-dispatch-automation' },
  { id: 'ac-9', company_id: 'clearline', source: 'company-brain', ...stamp, at: '2026-08-11T15:09:00-07:00', actor: 'Vendor Agent', actor_kind: 'agent', verb: 'requested approval for', object: 'Zoom license reduction', detail: 'Level 3 — 110 of 180 seats inactive', level: 3, link: '/agents/agent-vendor' },
  { id: 'ac-10', company_id: 'northstar', source: 'salesforce', ...stamp, at: '2026-08-11T11:04:00-07:00', actor: 'Integration Agent', actor_kind: 'system', verb: 'reported', object: 'Salesforce sync warning', detail: 'Custom field `renewal_stage__c` returned nulls on 12 accounts', link: '/settings' },
  { id: 'ac-11', company_id: 'atlas', source: 'company-brain', ...stamp, at: '2026-08-11T09:33:00-07:00', actor: 'Alex Mahesh', actor_kind: 'human', verb: 'asked', object: '"Why did Atlas overtime increase?"', detail: 'Answered from Rippling and ServiceTitan data', link: '/' },
  { id: 'ac-12', company_id: 'beacon', source: 'company-brain', ...stamp, at: '2026-08-11T08:12:00-07:00', actor: 'Revenue Agent', actor_kind: 'agent', verb: 'detected', object: 'Beacon conversion deterioration', detail: 'Discovery → proposal down 8 points over 90 days', level: 1, link: '/company/beacon' },

  { id: 'ac-13', company_id: null, source: 'company-brain', ...stamp, at: '2026-08-10T16:40:00-07:00', actor: 'Priya Raman', actor_kind: 'human', verb: 'approved', object: 'payroll consolidation preparation', detail: 'Level 2 — negotiation package assembled', level: 2, link: '/opportunities/opp-payroll' },
  { id: 'ac-14', company_id: null, source: 'company-brain', ...stamp, at: '2026-08-10T14:22:00-07:00', actor: 'Vendor Agent', actor_kind: 'agent', verb: 'prepared', object: 'payroll rate comparison across 5 entities', detail: '$846 – $1,919 per employee', level: 2, link: '/opportunities/opp-payroll' },
  { id: 'ac-15', company_id: 'northstar', source: 'company-brain', ...stamp, at: '2026-08-10T10:07:00-07:00', actor: 'Customer Agent', actor_kind: 'agent', verb: 'escalated', object: 'Piedmont Manufacturing renewal risk', detail: '$842K premium · renewal in 46 days · no contact in 128 days', level: 1, link: '/company/northstar' },
  { id: 'ac-16', company_id: null, source: 'ramp', ...stamp, at: '2026-08-10T04:11:00-07:00', actor: 'Integration Agent', actor_kind: 'system', verb: 'completed', object: 'Ramp sync', detail: '5 entities · 8,412 transactions', link: '/settings' },
];

export function activityFor(companyId: string | null): ActivityEvent[] {
  if (!companyId) return activity;
  return activity.filter((x) => x.company_id === companyId || x.company_id === null);
}

export const alerts: Alert[] = [
  {
    id: 'al-north-churn',
    company_id: 'northstar',
    holding_company_id: 'redwood',
    source: 'salesforce',
    ...stamp,
    title: 'Customer churn increased 18%',
    severity: 'critical',
    body: 'Annualized book churn moved from 9.4% to 11.1% in the mid-market commercial book. 64 of 212 accounts have had no producer contact in 90 days, including three of the top ten by commission.',
    metric_key: 'churn',
    evidence_ids: ['ev-north-churn', 'ev-north-concentration'],
    cta: { label: 'Investigate', to: '/company/northstar' },
  },
  {
    id: 'al-beacon-pipeline',
    company_id: 'beacon',
    holding_company_id: 'redwood',
    source: 'netsuite',
    ...stamp,
    title: 'Sales pipeline is 13% below monthly target',
    severity: 'material',
    body: 'Weighted pipeline stands at $1.32M against a $1.52M monthly target. Discovery → proposal conversion fell 8 points over the last 90 days and the median lag from discovery to proposal went from 4 days to 11.',
    metric_key: 'target_attainment',
    evidence_ids: ['ev-beacon-pipeline', 'ev-beacon-conversion'],
    cta: { label: 'View', to: '/company/beacon' },
  },
  {
    id: 'al-portfolio-software',
    company_id: null,
    holding_company_id: 'redwood',
    source: 'ramp',
    ...stamp,
    title: 'Company Brain identified $94K in redundant software',
    severity: 'material',
    body: 'Five subscriptions across four companies are duplicated or running below 15% seat utilization. One contract auto-renews in 50 days.',
    evidence_ids: ['ev-portfolio-software'],
    cta: { label: 'Review opportunity', to: '/opportunities/opp-software' },
  },
  {
    id: 'al-atlas-overtime',
    company_id: 'atlas',
    holding_company_id: 'redwood',
    source: 'rippling',
    ...stamp,
    title: 'Technician overtime up 17% month-over-month',
    severity: 'material',
    body: 'Overtime hours rose from 2,140 to 2,504 with flat headcount — an annualized run-rate of $181K against $4.1M of EBITDA.',
    metric_key: 'overtime_hours',
    evidence_ids: ['ev-atlas-overtime'],
    cta: { label: 'Investigate', to: '/company/atlas' },
  },
  {
    id: 'al-summit-margin',
    company_id: 'summit',
    holding_company_id: 'redwood',
    source: 'quickbooks',
    ...stamp,
    title: 'New-construction margin below the portfolio floor',
    severity: 'material',
    body: '11 of the last 19 new-construction bids were submitted below the 25% gross-margin floor. Realized margin on that work is 18.2%.',
    metric_key: 'gross_margin',
    evidence_ids: ['ev-summit-margin'],
    cta: { label: 'Investigate', to: '/company/summit' },
  },
];

export function alertsFor(companyId: string | null): Alert[] {
  if (!companyId) return alerts;
  return alerts.filter((x) => x.company_id === companyId);
}

export const integrations: Integration[] = [
  { id: 'int-qb-atlas', company_id: 'atlas', source: 'quickbooks', ...stamp, system: 'quickbooks', name: 'QuickBooks', category: 'Accounting', status: 'connected', last_synced: '4 hours ago', record_count: 182_400 },
  { id: 'int-qb-summit', company_id: 'summit', source: 'quickbooks', ...stamp, system: 'quickbooks', name: 'QuickBooks', category: 'Accounting', status: 'connected', last_synced: '2 hours ago', record_count: 96_100 },
  { id: 'int-ns-beacon', company_id: 'beacon', source: 'netsuite', ...stamp, system: 'netsuite', name: 'NetSuite', category: 'ERP', status: 'connected', last_synced: '31 minutes ago', record_count: 241_800 },
  { id: 'int-ns-clear', company_id: 'clearline', source: 'netsuite', ...stamp, system: 'netsuite', name: 'NetSuite', category: 'ERP', status: 'connected', last_synced: '1 hour ago', record_count: 612_400 },
  { id: 'int-hs-atlas', company_id: 'atlas', source: 'hubspot', ...stamp, system: 'hubspot', name: 'HubSpot', category: 'CRM', status: 'connected', last_synced: '4 minutes ago', record_count: 88_200 },
  { id: 'int-sf-north', company_id: 'northstar', source: 'salesforce', ...stamp, system: 'salesforce', name: 'Salesforce', category: 'CRM', status: 'syncing', last_synced: '12 minutes ago', record_count: 141_600 },
  { id: 'int-ramp', company_id: null, source: 'ramp', ...stamp, system: 'ramp', name: 'Ramp', category: 'Spend management', status: 'connected', last_synced: '35 minutes ago', record_count: 68_400 },
  { id: 'int-stripe', company_id: null, source: 'stripe', ...stamp, system: 'stripe', name: 'Stripe', category: 'Payments', status: 'connected', last_synced: '9 minutes ago', record_count: 412_800 },
  { id: 'int-gw', company_id: null, source: 'google-workspace', ...stamp, system: 'google-workspace', name: 'Google Workspace', category: 'Identity & collaboration', status: 'connected', last_synced: '1 hour ago', record_count: 4_100 },
  { id: 'int-m365', company_id: null, source: 'microsoft-365', ...stamp, system: 'microsoft-365', name: 'Microsoft 365', category: 'Identity & collaboration', status: 'connected', last_synced: '1 hour ago', record_count: 3_200 },
  { id: 'int-slack', company_id: null, source: 'slack', ...stamp, system: 'slack', name: 'Slack', category: 'Collaboration', status: 'connected', last_synced: '18 minutes ago', record_count: 1_900 },
  { id: 'int-rippling', company_id: null, source: 'rippling', ...stamp, system: 'rippling', name: 'Rippling', category: 'Payroll & HRIS', status: 'connected', last_synced: '22 minutes ago', record_count: 12_400 },
  { id: 'int-gusto', company_id: 'beacon', source: 'gusto', ...stamp, system: 'gusto', name: 'Gusto', category: 'Payroll & HRIS', status: 'connected', last_synced: '3 hours ago', record_count: 2_800 },
  { id: 'int-zendesk', company_id: 'clearline', source: 'zendesk', ...stamp, system: 'zendesk', name: 'Zendesk', category: 'Support', status: 'error', last_synced: '2 days ago', error: 'OAuth token expired — reauthorization required', record_count: 34_100 },
  { id: 'int-intercom', company_id: null, source: 'intercom', ...stamp, system: 'intercom', name: 'Intercom', category: 'Support', status: 'not-connected' },
];

export function integrationCounts() {
  return {
    connected: integrations.filter((x) => x.status === 'connected').length,
    syncing: integrations.filter((x) => x.status === 'syncing').length,
    error: integrations.filter((x) => x.status === 'error').length,
    not_connected: integrations.filter((x) => x.status === 'not-connected').length,
    /** Distinct system-plus-entity connections, the number the owner cares about. */
    total_active: integrations.filter((x) => x.status !== 'not-connected').length,
  };
}

export const workflows: Workflow[] = [
  {
    id: 'wf-atlas-followup',
    company_id: 'atlas',
    holding_company_id: 'redwood',
    source: 'hubspot',
    ...stamp,
    name: 'Atlas inbound lead follow-up',
    origin_company_id: 'atlas',
    description:
      'Five-touch sequence over nine days with a 15-minute first-response SLA and automatic round-robin ownership.',
    steps: [
      { name: 'Assign owner', detail: 'Round-robin across available reps, weighted by open pipeline', system: 'hubspot' },
      { name: 'First response SLA', detail: 'Call within 15 minutes during business hours; SMS outside them', system: 'hubspot' },
      { name: 'Touch 2 — same day', detail: 'Templated email with scheduling link if no answer', system: 'hubspot' },
      { name: 'Touch 3 — day 2', detail: 'Second call attempt at a different hour of day', system: 'hubspot' },
      { name: 'Touch 4 — day 4', detail: 'SMS with direct booking link', system: 'hubspot' },
      { name: 'Touch 5 — day 9', detail: 'Final email, then move to nurture', system: 'hubspot' },
      { name: 'Escalate breaches', detail: 'Any lead past SLA appears on the sales manager dashboard hourly', system: 'hubspot' },
    ],
    proof: 'Booked 41.2% of sequenced leads against 31.4% for an 890-lead holdout control, over 11 months.',
    deployed_company_ids: ['atlas'],
  },
];
