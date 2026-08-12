import type { Customer, Employee, Invoice } from './types';
import { NOW } from './portfolio';

const stamp = { created_at: '2026-01-02T00:00:00Z', updated_at: NOW };

export const employees: Employee[] = [
  { id: 'emp-1', company_id: 'atlas', source: 'rippling', ...stamp, name: 'Dana Whitfield', title: 'VP Sales', department: 'Sales', comp: 214_000, tenure_years: 4.2, revenue_attributed: 5_850_000 },
  { id: 'emp-2', company_id: 'atlas', source: 'rippling', ...stamp, name: 'Ray Okafor', title: 'Director of Field Operations', department: 'Service & Install', comp: 198_000, tenure_years: 6.8 },
  { id: 'emp-3', company_id: 'atlas', source: 'rippling', ...stamp, name: 'Marcus Bell', title: 'Dispatch Manager', department: 'Dispatch & CX', comp: 112_000, tenure_years: 2.1 },
  { id: 'emp-4', company_id: 'atlas', source: 'rippling', ...stamp, name: 'Yolanda Reyes', title: 'Senior Account Executive', department: 'Sales', comp: 168_000, tenure_years: 3.4, revenue_attributed: 1_240_000 },
  { id: 'emp-5', company_id: 'atlas', source: 'rippling', ...stamp, name: 'Kevin Trang', title: 'Lead Service Technician', department: 'Service & Install', comp: 118_000, tenure_years: 8.1 },

  { id: 'emp-6', company_id: 'beacon', source: 'gusto', ...stamp, name: 'Tomás Herrera', title: 'Managing Partner', department: 'Client Accounting', comp: 288_000, tenure_years: 11.2 },
  { id: 'emp-7', company_id: 'beacon', source: 'gusto', ...stamp, name: 'Ellen Chu', title: 'Tax Partner', department: 'Tax', comp: 264_000, tenure_years: 9.5 },
  { id: 'emp-8', company_id: 'beacon', source: 'gusto', ...stamp, name: 'Nate Brody', title: 'Head of Growth', department: 'Growth', comp: 182_000, tenure_years: 1.6, revenue_attributed: 2_180_000 },
  { id: 'emp-9', company_id: 'beacon', source: 'gusto', ...stamp, name: 'Sasha Kim', title: 'CAS Manager', department: 'Client Accounting', comp: 134_000, tenure_years: 4.9 },

  { id: 'emp-10', company_id: 'northstar', source: 'rippling', ...stamp, name: 'Curtis Vane', title: 'President', department: 'Producers', comp: 342_000, tenure_years: 14.1 },
  { id: 'emp-11', company_id: 'northstar', source: 'rippling', ...stamp, name: 'Lourdes Pina', title: 'Director of Account Service', department: 'Account Service', comp: 176_000, tenure_years: 7.3 },
  { id: 'emp-12', company_id: 'northstar', source: 'rippling', ...stamp, name: 'Dale Ferris', title: 'Senior Producer', department: 'Producers', comp: 298_000, tenure_years: 12.4, revenue_attributed: 3_120_000 },
  { id: 'emp-13', company_id: 'northstar', source: 'rippling', ...stamp, name: 'Ben Ortiz', title: 'Claims Advocacy Lead', department: 'Claims Advocacy', comp: 148_000, tenure_years: 5.2 },

  { id: 'emp-14', company_id: 'summit', source: 'quickbooks', ...stamp, name: 'Hank Meyer', title: 'General Manager', department: 'Field Operations', comp: 226_000, tenure_years: 16.7 },
  { id: 'emp-15', company_id: 'summit', source: 'quickbooks', ...stamp, name: 'Rosa Delgado', title: 'Chief Estimator', department: 'Estimating', comp: 158_000, tenure_years: 6.1, revenue_attributed: 4_900_000 },

  { id: 'emp-16', company_id: 'clearline', source: 'netsuite', ...stamp, name: 'Joe Kowalski', title: 'VP Operations', department: 'Linehaul & Dock', comp: 248_000, tenure_years: 9.8 },
  { id: 'emp-17', company_id: 'clearline', source: 'netsuite', ...stamp, name: 'Alicia Ferrer', title: 'Dispatch Director', department: 'Dispatch', comp: 164_000, tenure_years: 5.5 },
  { id: 'emp-18', company_id: 'clearline', source: 'netsuite', ...stamp, name: 'Wes Tanaka', title: 'VP Sales', department: 'Sales', comp: 232_000, tenure_years: 3.9, revenue_attributed: 19_600_000 },

  { id: 'emp-19', company_id: 'atlas', source: 'manual', ...stamp, name: 'Priya Raman', title: 'Portfolio CFO (shared services)', department: 'G&A', comp: 312_000, tenure_years: 2.8 },
  { id: 'emp-20', company_id: 'northstar', source: 'manual', ...stamp, name: 'Sarah Lindqvist', title: 'Portfolio COO (shared services)', department: 'G&A', comp: 336_000, tenure_years: 3.6 },
];

export const customers: Customer[] = [
  { id: 'cus-1', company_id: 'northstar', source: 'salesforce', ...stamp, name: 'Piedmont Manufacturing Group', arr: 842_000, since: '2016', health: 'risk', churn_risk: 0.72, churn_reason: 'No producer contact in 128 days; renewal in 46 days', owner: 'Dale Ferris' },
  { id: 'cus-2', company_id: 'northstar', source: 'salesforce', ...stamp, name: 'Carolina Freight Systems', arr: 664_000, since: '2018', health: 'risk', churn_risk: 0.68, churn_reason: 'Two open claims escalations; competitor quote requested', owner: 'Dale Ferris' },
  { id: 'cus-3', company_id: 'northstar', source: 'salesforce', ...stamp, name: 'Aldridge Construction', arr: 598_000, since: '2014', health: 'risk', churn_risk: 0.61, churn_reason: 'Premium up 22% at renewal without a remarketing review', owner: 'Curtis Vane' },
  { id: 'cus-4', company_id: 'northstar', source: 'salesforce', ...stamp, name: 'Tidewater Hospitality', arr: 412_000, since: '2020', health: 'watch', churn_risk: 0.44, owner: 'Lourdes Pina' },
  { id: 'cus-5', company_id: 'northstar', source: 'salesforce', ...stamp, name: 'Brightline Health Partners', arr: 388_000, since: '2019', health: 'strong', churn_risk: 0.12, owner: 'Curtis Vane' },

  { id: 'cus-6', company_id: 'beacon', source: 'netsuite', ...stamp, name: 'Halcyon Ventures', arr: 486_000, since: '2021', health: 'strong', churn_risk: 0.08, owner: 'Tomás Herrera' },
  { id: 'cus-7', company_id: 'beacon', source: 'netsuite', ...stamp, name: 'Verity Dental Partners', arr: 344_000, since: '2022', health: 'watch', churn_risk: 0.38, churn_reason: 'Two missed close deadlines in Q2', owner: 'Sasha Kim' },
  { id: 'cus-8', company_id: 'beacon', source: 'netsuite', ...stamp, name: 'Longview Restaurant Group', arr: 268_000, since: '2020', health: 'strong', churn_risk: 0.11, owner: 'Sasha Kim' },
  { id: 'cus-9', company_id: 'beacon', source: 'netsuite', ...stamp, name: 'Ironwood Property Mgmt', arr: 212_000, since: '2023', health: 'strong', churn_risk: 0.09, owner: 'Ellen Chu' },

  { id: 'cus-10', company_id: 'clearline', source: 'netsuite', ...stamp, name: 'Great Plains Grocers', arr: 4_820_000, since: '2017', health: 'strong', churn_risk: 0.14, owner: 'Wes Tanaka' },
  { id: 'cus-11', company_id: 'clearline', source: 'netsuite', ...stamp, name: 'Midway Industrial Supply', arr: 3_110_000, since: '2019', health: 'watch', churn_risk: 0.41, churn_reason: 'On-time delivery fell to 88% on two contracted lanes', owner: 'Wes Tanaka' },
  { id: 'cus-12', company_id: 'clearline', source: 'netsuite', ...stamp, name: 'Overland Retail Distribution', arr: 2_640_000, since: '2021', health: 'strong', churn_risk: 0.1, owner: 'Wes Tanaka' },

  { id: 'cus-13', company_id: 'atlas', source: 'hubspot', ...stamp, name: 'Sierra Property Trust', arr: 1_240_000, since: '2019', health: 'strong', churn_risk: 0.09, owner: 'Yolanda Reyes' },
  { id: 'cus-14', company_id: 'atlas', source: 'hubspot', ...stamp, name: 'Capital Valley Schools', arr: 684_000, since: '2022', health: 'strong', churn_risk: 0.13, owner: 'Yolanda Reyes' },
  { id: 'cus-15', company_id: 'atlas', source: 'hubspot', ...stamp, name: 'Delta Ridge Apartments', arr: 412_000, since: '2023', health: 'watch', churn_risk: 0.36, churn_reason: 'Three repeat callbacks on the same rooftop unit', owner: 'Dana Whitfield' },

  { id: 'cus-16', company_id: 'summit', source: 'quickbooks', ...stamp, name: 'Reno Commons Development', arr: 2_180_000, since: '2024', health: 'watch', churn_risk: 0.29, churn_reason: 'Job margin 11 pts below bid; change orders disputed', owner: 'Rosa Delgado' },
  { id: 'cus-17', company_id: 'summit', source: 'quickbooks', ...stamp, name: 'Highland Medical Campus', arr: 1_120_000, since: '2023', health: 'strong', churn_risk: 0.12, owner: 'Hank Meyer' },
];

export function customersFor(companyId: string | null): Customer[] {
  const list = companyId ? customers.filter((x) => x.company_id === companyId) : customers;
  return [...list].sort((a, b) => b.arr - a.arr);
}

export function employeesFor(companyId: string | null): Employee[] {
  return companyId ? employees.filter((x) => x.company_id === companyId) : employees;
}

export function atRiskCustomers(companyId: string | null = null, threshold = 0.35): Customer[] {
  return customersFor(companyId)
    .filter((x) => x.churn_risk >= threshold)
    .sort((a, b) => b.churn_risk * b.arr - a.churn_risk * a.arr);
}

export const invoices: Invoice[] = [
  { id: 'inv-1', company_id: 'northstar', source: 'salesforce', ...stamp, customer: 'Piedmont Manufacturing Group', amount: 210_500, issued: '2026-07-01', due: '2026-07-31', status: 'overdue' },
  { id: 'inv-2', company_id: 'clearline', source: 'netsuite', ...stamp, customer: 'Great Plains Grocers', amount: 401_600, issued: '2026-07-15', due: '2026-08-14', status: 'open' },
  { id: 'inv-3', company_id: 'atlas', source: 'quickbooks', ...stamp, customer: 'Sierra Property Trust', amount: 103_300, issued: '2026-07-20', due: '2026-08-19', status: 'open' },
  { id: 'inv-4', company_id: 'summit', source: 'quickbooks', ...stamp, customer: 'Reno Commons Development', amount: 544_000, issued: '2026-06-30', due: '2026-07-30', status: 'overdue' },
  { id: 'inv-5', company_id: 'beacon', source: 'netsuite', ...stamp, customer: 'Halcyon Ventures', amount: 40_500, issued: '2026-08-01', due: '2026-08-31', status: 'open' },
];
