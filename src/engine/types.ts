import type { SourceSystem } from '@/data/types';

/**
 * The response format the product speaks in. Answers are structured operating
 * documents, not prose — every block is a thing the UI knows how to render, and
 * anything asserting a number carries an `evidence_id`.
 */

export type Tone = 'good' | 'bad' | 'neutral';

export interface Finding {
  /** Company the finding belongs to; omitted for portfolio-level findings. */
  company_id?: string;
  /** The headline claim, e.g. "Revenue per salesperson ↓ 14%". */
  claim: string;
  /** Why it happened — the part a dashboard cannot give you. */
  reason?: string;
  reason_label?: string;
  evidence_id?: string;
  tone?: Tone;
  /** Optional secondary numbers shown inline. */
  facts?: { label: string; value: string; evidence_id?: string }[];
}

export interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right';
  /** Renders in a lighter weight — for context columns. */
  muted?: boolean;
}

export interface Cell {
  text: string;
  evidence_id?: string;
  tone?: Tone;
  /** Marks the winning row/value in a comparison. */
  emphasis?: boolean;
  href?: string;
}

export type SuggestedActionKind = 'route' | 'approval' | 'opportunity' | 'deploy' | 'query';

export interface SuggestedAction {
  title: string;
  detail?: string;
  impact?: string;
  effort?: string;
  cta: string;
  kind: SuggestedActionKind;
  /** Route path, opportunity id, action id, or follow-up query text. */
  target: string;
}

export type Block =
  | { kind: 'headline'; text: string; sub?: string }
  | { kind: 'prose'; text: string; evidence_id?: string }
  | { kind: 'findings'; title?: string; items: Finding[] }
  | { kind: 'table'; title?: string; columns: Column[]; rows: Cell[][]; note?: string }
  | { kind: 'stats'; items: { label: string; value: string; evidence_id?: string; tone?: Tone }[] }
  | { kind: 'ledger'; title?: string; items: { label: string; value: string; note?: string; evidence_id?: string }[]; total?: { label: string; value: string } }
  | { kind: 'actions'; title?: string; items: SuggestedAction[] }
  | { kind: 'workflow'; title?: string; workflow_id: string; target_company_id: string; systems: SourceSystem[]; impact: string; effort: string; action_id?: string }
  | { kind: 'callout'; label: string; text: string; evidence_id?: string; tone?: Tone }
  | { kind: 'followups'; items: string[] };

/** What the model was given before answering — surfaced in the UI for trust. */
export interface ContextTrace {
  user: string;
  scope: string;
  question: string;
  systems: SourceSystem[];
  entities: string[];
  period: string;
  evidence_count: number;
  tools: string[];
}

export interface AIResponse {
  id: string;
  query: string;
  scope_company_id: string | null;
  /** Which resolver produced this — useful for debugging and for analytics. */
  resolver: string;
  blocks: Block[];
  context: ContextTrace;
  /** Simulated retrieval + generation time, in ms. */
  latency_ms: number;
  created_at: string;
}
