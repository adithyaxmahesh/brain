import type { Company, Department, HoldingCompany } from './types';

export const NOW = '2026-08-12T09:12:00-07:00';

/** The period label most metrics in the seed set are measured over. */
export const PRIMARY_PERIOD = 'May 1 – Jul 31, 2026';

const stamp = { created_at: '2026-01-02T00:00:00Z', updated_at: NOW };

export const holdingCompany: HoldingCompany = {
  id: 'redwood',
  name: 'Redwood Holdings',
  owner_name: 'Alex Mahesh',
  ...stamp,
};

export const companies: Company[] = [
  {
    id: 'atlas',
    company_id: 'atlas',
    holding_company_id: 'redwood',
    source: 'quickbooks',
    ...stamp,
    name: 'Atlas HVAC',
    handle: 'Atlas',
    sector: 'Residential & light commercial HVAC',
    hq: 'Sacramento, CA',
    acquired: 'Mar 2021',
    revenue: 24_200_000,
    ebitda: 4_100_000,
    revenue_prior: 21_600_000,
    ebitda_prior: 3_700_000,
    growth: 0.12,
    employees: 128,
    health: 'strong',
    major_change: 'Lead velocity ↑',
    open_issues: 2,
    summary:
      'Best-performing demand engine in the portfolio. Field labor cost is the emerging pressure point.',
    revenue_trend: [1.72, 1.78, 1.81, 1.86, 1.94, 1.99, 2.02, 2.04, 2.09, 2.14, 2.18, 2.23],
  },
  {
    id: 'beacon',
    company_id: 'beacon',
    holding_company_id: 'redwood',
    source: 'netsuite',
    ...stamp,
    name: 'Beacon Accounting',
    handle: 'Beacon',
    sector: 'Outsourced accounting & tax',
    hq: 'Austin, TX',
    acquired: 'Aug 2022',
    revenue: 18_700_000,
    ebitda: 5_300_000,
    revenue_prior: 17_800_000,
    ebitda_prior: 5_100_000,
    growth: 0.05,
    employees: 74,
    health: 'watch',
    major_change: 'Conversion ↓',
    open_issues: 3,
    summary:
      'Highest-margin company in the portfolio, but new business has stalled at the proposal stage.',
    revenue_trend: [1.5, 1.52, 1.51, 1.55, 1.57, 1.56, 1.58, 1.55, 1.56, 1.54, 1.57, 1.58],
  },
  {
    id: 'northstar',
    company_id: 'northstar',
    holding_company_id: 'redwood',
    source: 'salesforce',
    ...stamp,
    name: 'Northstar Insurance',
    handle: 'Northstar',
    sector: 'Commercial P&C brokerage',
    hq: 'Charlotte, NC',
    acquired: 'Nov 2019',
    revenue: 31_100_000,
    ebitda: 7_800_000,
    revenue_prior: 32_060_000,
    ebitda_prior: 8_400_000,
    growth: -0.03,
    employees: 91,
    health: 'risk',
    major_change: 'Churn ↑',
    open_issues: 5,
    summary:
      'Retention has broken down in the mid-market book while inbound leads go uncontacted.',
    revenue_trend: [2.72, 2.7, 2.68, 2.65, 2.63, 2.61, 2.58, 2.57, 2.55, 2.53, 2.56, 2.54],
  },
  {
    id: 'summit',
    company_id: 'summit',
    holding_company_id: 'redwood',
    source: 'quickbooks',
    ...stamp,
    name: 'Summit Plumbing',
    handle: 'Summit',
    sector: 'Commercial plumbing & mechanical',
    hq: 'Reno, NV',
    acquired: 'Jun 2023',
    revenue: 14_800_000,
    ebitda: 2_700_000,
    revenue_prior: 13_800_000,
    ebitda_prior: 2_600_000,
    growth: 0.07,
    employees: 83,
    health: 'watch',
    major_change: 'Margin ↓ on new construction',
    open_issues: 2,
    summary:
      'Growing steadily, but new-construction work is being bid below the portfolio margin floor.',
    revenue_trend: [1.1, 1.12, 1.15, 1.18, 1.2, 1.21, 1.22, 1.24, 1.25, 1.27, 1.29, 1.3],
  },
  {
    id: 'clearline',
    company_id: 'clearline',
    holding_company_id: 'redwood',
    source: 'netsuite',
    ...stamp,
    name: 'Clearline Logistics',
    handle: 'Clearline',
    sector: 'Regional LTL freight & 3PL',
    hq: 'Kansas City, MO',
    acquired: 'Feb 2020',
    revenue: 42_600_000,
    ebitda: 6_900_000,
    revenue_prior: 39_100_000,
    ebitda_prior: 6_200_000,
    growth: 0.09,
    employees: 214,
    health: 'strong',
    major_change: 'Contractor spend ↑',
    open_issues: 3,
    summary:
      'Largest company by revenue. Dispatch is still manual, which is showing up as contractor spend.',
    revenue_trend: [3.2, 3.28, 3.31, 3.4, 3.45, 3.51, 3.55, 3.58, 3.62, 3.68, 3.71, 3.75],
  },
];

export const companyById = Object.fromEntries(companies.map((c) => [c.id, c])) as Record<
  string,
  Company
>;

export function companyName(id: string | null | undefined): string {
  if (!id) return 'Portfolio';
  return companyById[id]?.name ?? 'Portfolio';
}

export const departments: Department[] = [
  { id: 'atlas-svc', company_id: 'atlas', name: 'Service & Install', headcount: 84, cost: 7_940_000, lead: 'Ray Okafor', source: 'rippling', ...stamp },
  { id: 'atlas-sales', company_id: 'atlas', name: 'Sales', headcount: 14, cost: 1_820_000, lead: 'Dana Whitfield', source: 'rippling', ...stamp },
  { id: 'atlas-disp', company_id: 'atlas', name: 'Dispatch & CX', headcount: 19, cost: 1_240_000, lead: 'Marcus Bell', source: 'rippling', ...stamp },
  { id: 'atlas-ga', company_id: 'atlas', name: 'G&A', headcount: 11, cost: 1_310_000, lead: 'Priya Raman', source: 'rippling', ...stamp },

  { id: 'beacon-cas', company_id: 'beacon', name: 'Client Accounting', headcount: 41, cost: 4_020_000, lead: 'Tomás Herrera', source: 'gusto', ...stamp },
  { id: 'beacon-tax', company_id: 'beacon', name: 'Tax', headcount: 16, cost: 2_240_000, lead: 'Ellen Chu', source: 'gusto', ...stamp },
  { id: 'beacon-sales', company_id: 'beacon', name: 'Growth', headcount: 9, cost: 1_180_000, lead: 'Nate Brody', source: 'gusto', ...stamp },
  { id: 'beacon-ga', company_id: 'beacon', name: 'G&A', headcount: 8, cost: 940_000, lead: 'Priya Raman', source: 'gusto', ...stamp },

  { id: 'north-prod', company_id: 'northstar', name: 'Producers', headcount: 22, cost: 4_180_000, lead: 'Curtis Vane', source: 'rippling', ...stamp },
  { id: 'north-svc', company_id: 'northstar', name: 'Account Service', headcount: 38, cost: 3_310_000, lead: 'Lourdes Pina', source: 'rippling', ...stamp },
  { id: 'north-claims', company_id: 'northstar', name: 'Claims Advocacy', headcount: 19, cost: 1_720_000, lead: 'Ben Ortiz', source: 'rippling', ...stamp },
  { id: 'north-ga', company_id: 'northstar', name: 'G&A', headcount: 12, cost: 1_490_000, lead: 'Priya Raman', source: 'rippling', ...stamp },

  { id: 'summit-field', company_id: 'summit', name: 'Field Operations', headcount: 61, cost: 5_120_000, lead: 'Hank Meyer', source: 'quickbooks', ...stamp },
  { id: 'summit-est', company_id: 'summit', name: 'Estimating', headcount: 9, cost: 1_040_000, lead: 'Rosa Delgado', source: 'quickbooks', ...stamp },
  { id: 'summit-ga', company_id: 'summit', name: 'G&A', headcount: 13, cost: 1_180_000, lead: 'Priya Raman', source: 'quickbooks', ...stamp },

  { id: 'clear-ops', company_id: 'clearline', name: 'Linehaul & Dock', headcount: 148, cost: 11_640_000, lead: 'Joe Kowalski', source: 'netsuite', ...stamp },
  { id: 'clear-disp', company_id: 'clearline', name: 'Dispatch', headcount: 26, cost: 2_180_000, lead: 'Alicia Ferrer', source: 'netsuite', ...stamp },
  { id: 'clear-sales', company_id: 'clearline', name: 'Sales', headcount: 18, cost: 2_460_000, lead: 'Wes Tanaka', source: 'netsuite', ...stamp },
  { id: 'clear-ga', company_id: 'clearline', name: 'G&A', headcount: 22, cost: 2_510_000, lead: 'Priya Raman', source: 'netsuite', ...stamp },
];

export const portfolioTotals = {
  revenue: companies.reduce((s, c) => s + c.revenue, 0),
  ebitda: companies.reduce((s, c) => s + c.ebitda, 0),
  revenue_prior: companies.reduce((s, c) => s + c.revenue_prior, 0),
  employees: companies.reduce((s, c) => s + c.employees, 0),
  companies: companies.length,
};

export const portfolioGrowth =
  (portfolioTotals.revenue - portfolioTotals.revenue_prior) / portfolioTotals.revenue_prior;
