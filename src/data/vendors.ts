import type { Transaction, Vendor } from './types';
import { NOW } from './portfolio';

const stamp = { created_at: '2026-01-02T00:00:00Z', updated_at: NOW };

type VendorSeed = Omit<Vendor, 'created_at' | 'updated_at'>;

const v = (seed: VendorSeed): Vendor => ({ ...seed, ...stamp });

/**
 * Vendor records stay company-scoped on purpose — duplication across the
 * portfolio is a finding, not a data-modeling problem to normalize away.
 */
export const vendors: Vendor[] = [
  // Payroll / HRIS
  v({ id: 'ven-atlas-adp', company_id: 'atlas', source: 'ramp', name: 'ADP', category: 'Payroll & HRIS', annual_spend: 194_000, contract_end: 'Dec 31, 2026', seats: 128, utilization: 1, status: 'under-review' }),
  v({ id: 'ven-beacon-rippling', company_id: 'beacon', source: 'ramp', name: 'Rippling', category: 'Payroll & HRIS', annual_spend: 142_000, contract_end: 'Jan 31, 2027', seats: 74, utilization: 1, status: 'under-review' }),
  v({ id: 'ven-north-paylocity', company_id: 'northstar', source: 'ramp', name: 'Paylocity', category: 'Payroll & HRIS', annual_spend: 168_000, contract_end: 'Mar 31, 2027', seats: 91, utilization: 1, status: 'under-review' }),
  v({ id: 'ven-summit-adp', company_id: 'summit', source: 'ramp', name: 'ADP', category: 'Payroll & HRIS', annual_spend: 121_000, contract_end: 'Dec 31, 2026', seats: 83, utilization: 1, status: 'under-review' }),
  v({ id: 'ven-clear-rippling', company_id: 'clearline', source: 'ramp', name: 'Rippling', category: 'Payroll & HRIS', annual_spend: 181_000, contract_end: 'Sep 30, 2027', seats: 214, utilization: 1, status: 'active' }),

  // Security
  v({ id: 'ven-atlas-crowdstrike', company_id: 'atlas', source: 'ramp', name: 'CrowdStrike', category: 'Security', annual_spend: 88_000, contract_end: 'Jun 30, 2027', seats: 144, utilization: 0.94, status: 'active' }),
  v({ id: 'ven-beacon-sentinelone', company_id: 'beacon', source: 'ramp', name: 'SentinelOne', category: 'Security', annual_spend: 61_000, contract_end: 'Feb 28, 2027', seats: 84, utilization: 0.91, status: 'active' }),
  v({ id: 'ven-north-sophos', company_id: 'northstar', source: 'ramp', name: 'Sophos', category: 'Security', annual_spend: 74_000, contract_end: 'Nov 30, 2026', seats: 100, utilization: 0.88, status: 'active' }),
  v({ id: 'ven-summit-malwarebytes', company_id: 'summit', source: 'ramp', name: 'Malwarebytes', category: 'Security', annual_spend: 38_000, contract_end: 'Apr 30, 2027', seats: 91, utilization: 0.79, status: 'active' }),
  v({ id: 'ven-clear-defender', company_id: 'clearline', source: 'ramp', name: 'Microsoft Defender for Business', category: 'Security', annual_spend: 133_000, contract_end: 'Jul 31, 2027', seats: 233, utilization: 0.97, status: 'active' }),

  // Software / collaboration
  v({ id: 'ven-beacon-slack', company_id: 'beacon', source: 'slack', name: 'Slack', category: 'Collaboration', annual_spend: 18_400, contract_end: 'Oct 1, 2026', seats: 74, utilization: 0.04, status: 'cancellation-pending' }),
  v({ id: 'ven-clear-zoom', company_id: 'clearline', source: 'ramp', name: 'Zoom', category: 'Collaboration', annual_spend: 24_400, contract_end: 'May 31, 2027', seats: 180, utilization: 0.39, status: 'under-review' }),
  v({ id: 'ven-atlas-asana', company_id: 'atlas', source: 'ramp', name: 'Asana', category: 'Work management', annual_spend: 12_100, contract_end: 'Feb 28, 2027', seats: 84, utilization: 0.11, status: 'under-review' }),
  v({ id: 'ven-atlas-docusign', company_id: 'atlas', source: 'ramp', name: 'DocuSign', category: 'E-signature', annual_spend: 11_400, contract_end: 'Jan 31, 2027', seats: 25, utilization: 0.72, status: 'under-review' }),
  v({ id: 'ven-north-docusign', company_id: 'northstar', source: 'ramp', name: 'DocuSign', category: 'E-signature', annual_spend: 9_800, contract_end: 'Aug 31, 2026', seats: 20, utilization: 0.65, status: 'under-review' }),
  v({ id: 'ven-clear-docusign', company_id: 'clearline', source: 'ramp', name: 'DocuSign', category: 'E-signature', annual_spend: 6_400, contract_end: 'Dec 31, 2026', seats: 12, utilization: 0.58, status: 'under-review' }),

  // Field / operational systems
  v({ id: 'ven-atlas-servicetitan', company_id: 'atlas', source: 'ramp', name: 'ServiceTitan', category: 'Field service management', annual_spend: 141_000, contract_end: 'Mar 31, 2028', seats: 128, utilization: 0.96, status: 'active' }),
  v({ id: 'ven-summit-servicetitan', company_id: 'summit', source: 'ramp', name: 'ServiceTitan', category: 'Field service management', annual_spend: 74_000, contract_end: 'Mar 31, 2028', seats: 83, utilization: 0.88, status: 'active' }),
  v({ id: 'ven-summit-jobber', company_id: 'summit', source: 'ramp', name: 'Jobber', category: 'Field service management', annual_spend: 56_000, contract_end: 'Oct 31, 2026', seats: 31, utilization: 0.06, status: 'under-review' }),
  v({ id: 'ven-clear-samsara', company_id: 'clearline', source: 'ramp', name: 'Samsara', category: 'Telematics', annual_spend: 218_000, contract_end: 'Aug 31, 2027', seats: 312, utilization: 0.98, status: 'active' }),

  // Payments
  v({ id: 'ven-atlas-stripe', company_id: 'atlas', source: 'stripe', name: 'Stripe', category: 'Payments', annual_spend: 96_400, contract_end: 'Month-to-month', status: 'under-review' }),
  v({ id: 'ven-summit-stripe', company_id: 'summit', source: 'stripe', name: 'Stripe', category: 'Payments', annual_spend: 41_200, contract_end: 'Month-to-month', status: 'under-review' }),
  v({ id: 'ven-beacon-stripe', company_id: 'beacon', source: 'stripe', name: 'Stripe', category: 'Payments', annual_spend: 38_900, contract_end: 'Month-to-month', status: 'under-review' }),
  v({ id: 'ven-clear-stripe', company_id: 'clearline', source: 'stripe', name: 'Stripe', category: 'Payments', annual_spend: 64_500, contract_end: 'Month-to-month', status: 'under-review' }),

  // Marketing / CRM
  v({ id: 'ven-atlas-hubspot', company_id: 'atlas', source: 'ramp', name: 'HubSpot', category: 'CRM & marketing', annual_spend: 62_000, contract_end: 'Jun 30, 2027', seats: 40, utilization: 0.92, status: 'active' }),
  v({ id: 'ven-north-salesforce', company_id: 'northstar', source: 'ramp', name: 'Salesforce', category: 'CRM', annual_spend: 118_000, contract_end: 'Dec 31, 2027', seats: 84, utilization: 0.81, status: 'active' }),
  v({ id: 'ven-atlas-google-ads', company_id: 'atlas', source: 'ramp', name: 'Google Ads', category: 'Advertising', annual_spend: 1_648_000, contract_end: 'Month-to-month', status: 'active' }),

  // Benefits & insurance brokerage
  v({ id: 'ven-atlas-benefits', company_id: 'atlas', source: 'quickbooks', name: 'Fairmont Benefits Group', category: 'Benefits brokerage', annual_spend: 148_000, contract_end: 'Dec 31, 2026', status: 'under-review' }),
  v({ id: 'ven-beacon-benefits', company_id: 'beacon', source: 'quickbooks', name: 'Fairmont Benefits Group', category: 'Benefits brokerage', annual_spend: 84_000, contract_end: 'Dec 31, 2026', status: 'under-review' }),
  v({ id: 'ven-north-benefits', company_id: 'northstar', source: 'quickbooks', name: 'Harbor Point Advisors', category: 'Benefits brokerage', annual_spend: 96_000, contract_end: 'Jun 30, 2027', status: 'active' }),
  v({ id: 'ven-clear-benefits', company_id: 'clearline', source: 'quickbooks', name: 'Merritt & Cole', category: 'Benefits brokerage', annual_spend: 84_000, contract_end: 'Dec 31, 2026', status: 'active' }),
];

export function vendorsFor(companyId: string | null): Vendor[] {
  if (!companyId) return vendors;
  return vendors.filter((x) => x.company_id === companyId);
}

export interface VendorRollup {
  name: string;
  category: string;
  companies: string[];
  total_spend: number;
  records: Vendor[];
}

/** Collapses vendor records by name — the cross-company view of a single vendor. */
export function vendorRollups(): VendorRollup[] {
  const map = new Map<string, VendorRollup>();
  for (const item of vendors) {
    const existing = map.get(item.name);
    if (existing) {
      existing.companies.push(item.company_id);
      existing.total_spend += item.annual_spend;
      existing.records.push(item);
    } else {
      map.set(item.name, {
        name: item.name,
        category: item.category,
        companies: [item.company_id],
        total_spend: item.annual_spend,
        records: [item],
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total_spend - a.total_spend);
}

/** Vendor categories where more than one provider is in use across the portfolio. */
export function fragmentedCategories() {
  const byCategory = new Map<string, Vendor[]>();
  for (const item of vendors) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  return [...byCategory.entries()]
    .map(([category, list]) => ({
      category,
      providers: [...new Set(list.map((x) => x.name))],
      companies: [...new Set(list.map((x) => x.company_id))],
      total_spend: list.reduce((s, x) => s + x.annual_spend, 0),
    }))
    .filter((x) => x.providers.length > 1)
    .sort((a, b) => b.total_spend - a.total_spend);
}

export const transactions: Transaction[] = [
  { id: 'tx-1', company_id: 'clearline', source: 'ramp', ...stamp, vendor: 'Redline Owner Operators LLC', category: 'Contract capacity', amount: 284_100, date: '2026-07-28', memo: 'Lane KC→DEN, 41 loads' },
  { id: 'tx-2', company_id: 'clearline', source: 'ramp', ...stamp, vendor: 'Brightway Freight Brokers', category: 'Contract capacity', amount: 196_400, date: '2026-07-24', memo: 'Spot coverage, 4 lanes' },
  { id: 'tx-3', company_id: 'atlas', source: 'ramp', ...stamp, vendor: 'Google Ads', category: 'Advertising', amount: 148_200, date: '2026-07-31', memo: 'July paid search' },
  { id: 'tx-4', company_id: 'atlas', source: 'rippling', ...stamp, vendor: 'Payroll — Service & Install', category: 'Labor', amount: 681_400, date: '2026-07-31', memo: 'Includes $146K overtime' },
  { id: 'tx-5', company_id: 'beacon', source: 'ramp', ...stamp, vendor: 'Slack', category: 'Collaboration', amount: 1_533, date: '2026-08-01', memo: 'Monthly, 74 seats' },
  { id: 'tx-6', company_id: 'northstar', source: 'ramp', ...stamp, vendor: 'Salesforce', category: 'CRM', amount: 9_833, date: '2026-08-01', memo: 'Monthly, 84 seats' },
  { id: 'tx-7', company_id: 'summit', source: 'ramp', ...stamp, vendor: 'Jobber', category: 'Field service management', amount: 4_667, date: '2026-08-01', memo: 'Monthly, 31 seats' },
  { id: 'tx-8', company_id: 'clearline', source: 'ramp', ...stamp, vendor: 'Samsara', category: 'Telematics', amount: 18_167, date: '2026-08-01', memo: 'Monthly, 312 assets' },
  { id: 'tx-9', company_id: 'summit', source: 'quickbooks', ...stamp, vendor: 'Cascade Supply Co.', category: 'Materials', amount: 312_800, date: '2026-07-19', memo: 'New construction — Reno Commons' },
  { id: 'tx-10', company_id: 'northstar', source: 'quickbooks', ...stamp, vendor: 'Harbor Point Advisors', category: 'Benefits brokerage', amount: 8_000, date: '2026-08-01', memo: 'Monthly broker fee' },
];
