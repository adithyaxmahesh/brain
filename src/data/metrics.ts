import type { Metric } from './types';
import { NOW, PRIMARY_PERIOD } from './portfolio';

type MetricSeed = Omit<Metric, 'created_at' | 'updated_at' | 'id'> & { id: string };

const m = (seed: MetricSeed): Metric => ({
  ...seed,
  created_at: '2026-01-02T00:00:00Z',
  updated_at: NOW,
});

/**
 * Operating metrics, normalized across source systems. `key` is stable across
 * companies so the portfolio can be compared column-wise without knowing which
 * CRM or ERP each subsidiary happens to run.
 */
export const metrics: Metric[] = [
  // ── Atlas ────────────────────────────────────────────────────────────────
  m({ id: 'atlas-rev-per-seller', company_id: 'atlas', source: 'hubspot', key: 'rev_per_seller', label: 'Revenue per salesperson', value: 418_000, prior_value: 486_000, unit: 'currency', polarity: 'higher-better', period: PRIMARY_PERIOD, evidence_id: 'ev-atlas-rev-per-seller', history: [486, 472, 455, 441, 418] }),
  m({ id: 'atlas-lead-response', company_id: 'atlas', source: 'hubspot', key: 'lead_response', label: 'Median lead response time', value: 31, prior_value: 8, unit: 'minutes', polarity: 'lower-better', period: PRIMARY_PERIOD, evidence_id: 'ev-atlas-lead-response', history: [8, 11, 19, 24, 31] }),
  m({ id: 'atlas-conversion', company_id: 'atlas', source: 'hubspot', key: 'inbound_conversion', label: 'Inbound → booked conversion', value: 0.412, prior_value: 0.418, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-atlas-lead-workflow' }),
  m({ id: 'atlas-overtime', company_id: 'atlas', source: 'rippling', key: 'overtime_hours', label: 'Technician overtime hours', value: 2_504, prior_value: 2_140, unit: 'number', polarity: 'lower-better', period: 'Jul 2026', evidence_id: 'ev-atlas-overtime', history: [1980, 2015, 2088, 2140, 2504] }),
  m({ id: 'atlas-cac', company_id: 'atlas', source: 'manual', key: 'cac', label: 'Blended CAC', value: 384, prior_value: 312, unit: 'currency', polarity: 'lower-better', period: 'Jul 2026', evidence_id: 'ev-atlas-cac', history: [312, 328, 341, 366, 384] }),
  m({ id: 'atlas-gm', company_id: 'atlas', source: 'quickbooks', key: 'gross_margin', label: 'Gross margin', value: 0.348, prior_value: 0.356, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-portfolio-ebitda' }),

  // ── Beacon ───────────────────────────────────────────────────────────────
  m({ id: 'beacon-rev-per-seller', company_id: 'beacon', source: 'netsuite', key: 'rev_per_seller', label: 'Revenue per salesperson', value: 680_000, prior_value: 712_000, unit: 'currency', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-north-rev-per-producer', history: [712, 706, 698, 688, 680] }),
  m({ id: 'beacon-conversion', company_id: 'beacon', source: 'netsuite', key: 'stage_conversion', label: 'Discovery → proposal conversion', value: 0.261, prior_value: 0.34, unit: 'percent', polarity: 'higher-better', period: PRIMARY_PERIOD, evidence_id: 'ev-beacon-conversion', history: [0.34, 0.33, 0.3, 0.28, 0.261] }),
  m({ id: 'beacon-pipeline', company_id: 'beacon', source: 'netsuite', key: 'target_attainment', label: 'Monthly target attainment', value: 0.87, prior_value: 1.02, unit: 'percent', polarity: 'higher-better', period: 'Aug 2026 MTD', evidence_id: 'ev-beacon-pipeline' }),
  m({ id: 'beacon-inbound-conversion', company_id: 'beacon', source: 'netsuite', key: 'inbound_conversion', label: 'Inbound → booked conversion', value: 0.291, prior_value: 0.303, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-atlas-lead-workflow' }),
  m({ id: 'beacon-rate', company_id: 'beacon', source: 'netsuite', key: 'realized_rate', label: 'Realized rate — CAS small', value: 118, prior_value: 121, unit: 'currency', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-beacon-pricing' }),
  m({ id: 'beacon-gm', company_id: 'beacon', source: 'netsuite', key: 'gross_margin', label: 'Gross margin', value: 0.512, prior_value: 0.508, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-portfolio-ebitda' }),

  // ── Northstar ────────────────────────────────────────────────────────────
  m({ id: 'north-rev-per-seller', company_id: 'northstar', source: 'salesforce', key: 'rev_per_seller', label: 'Revenue per producer', value: 1_413_000, prior_value: 1_457_000, unit: 'currency', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-north-rev-per-producer', history: [1457, 1448, 1432, 1420, 1413] }),
  m({ id: 'north-churn', company_id: 'northstar', source: 'salesforce', key: 'churn', label: 'Annualized book churn', value: 0.111, prior_value: 0.094, unit: 'percent', polarity: 'lower-better', period: 'Trailing 6 months', evidence_id: 'ev-north-churn', history: [0.094, 0.098, 0.101, 0.106, 0.111] }),
  m({ id: 'north-uncontacted', company_id: 'northstar', source: 'salesforce', key: 'uncontacted_leads', label: 'Uncontacted inbound leads', value: 498, prior_value: 351, unit: 'number', polarity: 'lower-better', period: PRIMARY_PERIOD, evidence_id: 'ev-north-uncontacted', history: [351, 388, 421, 455, 498] }),
  m({ id: 'north-new-business', company_id: 'northstar', source: 'salesforce', key: 'new_business', label: 'New business commission', value: 2_140_000, prior_value: 2_400_000, unit: 'currency', polarity: 'higher-better', period: PRIMARY_PERIOD, evidence_id: 'ev-north-new-business' }),
  m({ id: 'north-inbound-conversion', company_id: 'northstar', source: 'salesforce', key: 'inbound_conversion', label: 'Inbound → booked conversion', value: 0.264, prior_value: 0.281, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-atlas-lead-workflow' }),
  m({ id: 'north-gm', company_id: 'northstar', source: 'salesforce', key: 'gross_margin', label: 'Gross margin', value: 0.548, prior_value: 0.571, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-portfolio-ebitda' }),

  // ── Summit ───────────────────────────────────────────────────────────────
  m({ id: 'summit-rev-per-seller', company_id: 'summit', source: 'quickbooks', key: 'rev_per_seller', label: 'Revenue per estimator', value: 1_644_000, prior_value: 1_610_000, unit: 'currency', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-summit-margin' }),
  m({ id: 'summit-margin-nc', company_id: 'summit', source: 'quickbooks', key: 'gross_margin', label: 'Gross margin — new construction', value: 0.182, prior_value: 0.241, unit: 'percent', polarity: 'higher-better', period: 'Trailing 6 months', evidence_id: 'ev-summit-margin', history: [0.241, 0.228, 0.211, 0.196, 0.182] }),
  m({ id: 'summit-margin-svc', company_id: 'summit', source: 'quickbooks', key: 'service_margin', label: 'Gross margin — service', value: 0.346, prior_value: 0.339, unit: 'percent', polarity: 'higher-better', period: 'Trailing 6 months', evidence_id: 'ev-summit-margin' }),
  m({ id: 'summit-inbound-conversion', company_id: 'summit', source: 'quickbooks', key: 'inbound_conversion', label: 'Inbound → booked conversion', value: 0.302, prior_value: 0.298, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-atlas-lead-workflow' }),

  // ── Clearline ────────────────────────────────────────────────────────────
  m({ id: 'clear-rev-per-seller', company_id: 'clearline', source: 'netsuite', key: 'rev_per_seller', label: 'Revenue per salesperson', value: 1_089_000, prior_value: 1_021_000, unit: 'currency', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-north-rev-per-producer', history: [1021, 1038, 1052, 1074, 1089] }),
  m({ id: 'clear-contractor', company_id: 'clearline', source: 'ramp', key: 'contractor_spend', label: 'Contractor spend', value: 3_420_000, prior_value: 2_610_000, unit: 'currency', polarity: 'lower-better', period: 'Trailing 6 months', evidence_id: 'ev-clear-contractor', history: [2610, 2780, 2960, 3180, 3420] }),
  m({ id: 'clear-manual-dispatch', company_id: 'clearline', source: 'netsuite', key: 'manual_dispatch', label: 'Manually dispatched loads', value: 0.84, prior_value: 0.86, unit: 'percent', polarity: 'lower-better', period: 'Trailing 3 months', evidence_id: 'ev-clear-dispatch' }),
  m({ id: 'clear-inbound-conversion', company_id: 'clearline', source: 'netsuite', key: 'inbound_conversion', label: 'Inbound → booked conversion', value: 0.338, prior_value: 0.331, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-atlas-lead-workflow' }),
  m({ id: 'clear-gm', company_id: 'clearline', source: 'netsuite', key: 'gross_margin', label: 'Gross margin', value: 0.221, prior_value: 0.214, unit: 'percent', polarity: 'higher-better', period: 'Trailing 12 months', evidence_id: 'ev-portfolio-ebitda' }),
];

export function metricsFor(companyId: string | null): Metric[] {
  if (!companyId) return metrics;
  return metrics.filter((x) => x.company_id === companyId);
}

/** All companies' values for one normalized metric key, for portfolio comparison. */
export function metricAcrossPortfolio(key: string): Metric[] {
  return metrics.filter((x) => x.key === key);
}

export function findMetric(companyId: string, key: string): Metric | undefined {
  return metrics.find((x) => x.company_id === companyId && x.key === key);
}
