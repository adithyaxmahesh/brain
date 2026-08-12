import type { SourceSystem } from '@/data/types';

export const SOURCE_LABELS: Record<SourceSystem, string> = {
  quickbooks: 'QuickBooks',
  netsuite: 'NetSuite',
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  ramp: 'Ramp',
  stripe: 'Stripe',
  'google-workspace': 'Google Workspace',
  'microsoft-365': 'Microsoft 365',
  slack: 'Slack',
  rippling: 'Rippling',
  gusto: 'Gusto',
  zendesk: 'Zendesk',
  intercom: 'Intercom',
  manual: 'Manual upload',
  'company-brain': 'Company Brain',
};

/** Two-letter mark used in the source badge, since we ship no vendor logos. */
export const SOURCE_MARKS: Record<SourceSystem, string> = {
  quickbooks: 'QB',
  netsuite: 'NS',
  hubspot: 'HS',
  salesforce: 'SF',
  ramp: 'RP',
  stripe: 'ST',
  'google-workspace': 'GW',
  'microsoft-365': 'M3',
  slack: 'SL',
  rippling: 'RI',
  gusto: 'GU',
  zendesk: 'ZD',
  intercom: 'IC',
  manual: 'MU',
  'company-brain': 'CB',
};

export function sourceLabel(s: SourceSystem): string {
  return SOURCE_LABELS[s] ?? s;
}
