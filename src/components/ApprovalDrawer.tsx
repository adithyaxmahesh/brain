import { useState } from 'react';
import { Link } from 'react-router-dom';
import { agentById, companyName, LEVEL_DESCRIPTIONS } from '@/data';
import { clockTime } from '@/lib/format';
import { sourceLabel } from '@/lib/sources';
import { useApp } from '@/state/AppContext';
import { Claim } from './Claim';
import { Drawer, DrawerSection, Field, FieldGroup } from './Drawer';
import { SourceBadge } from './primitives';

/**
 * The approval layer. A Level 3 action never executes without a decision here,
 * and the drawer's job is to make the decision cheap: what changes, what it is
 * worth, why the agent believes it, and how reversible it is.
 */
export function ApprovalDrawer({ id, depth }: { id: string; depth: number }) {
  const { actions, decide, openDrawer } = useApp();
  const action = actions.find((a) => a.id === id);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<string | null>(null);

  if (!action) {
    return (
      <Drawer eyebrow="Approval" title="Action not found" depth={depth}>
        <p className="text-base text-muted">This action is no longer in the queue.</p>
      </Drawer>
    );
  }

  const agent = agentById[action.agent_id];
  const level = LEVEL_DESCRIPTIONS[action.level];
  const decided = action.status !== 'pending-approval';

  return (
    <Drawer
      eyebrow={`${level.name} · ${level.verbs.split(' · ')[0]}`}
      title={action.title}
      depth={depth}
      meta={
        <>
          <Link
            to={`/agents/${agent.id}`}
            className="text-sm text-ink underline decoration-line-strong decoration-1 underline-offset-2 hover:decoration-ink"
          >
            {agent.name}
          </Link>
          <span className="text-sm text-faint">·</span>
          <span className="text-sm text-muted">{companyName(action.company_id)}</span>
          <span className="text-sm text-faint">·</span>
          <span className="text-sm text-muted">Requested {clockTime(action.requested)}</span>
        </>
      }
      footer={
        decided ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {action.status === 'rejected' ? 'Rejected' : 'Approved and executed'} by{' '}
              {action.decided_by ?? 'you'}. Recorded in Activity.
            </p>
            <Link to="/activity" className="btn-default">
              View in Activity
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={() => decide(action.id, 'approved')}>
              Approve
            </button>
            <button type="button" className="btn-danger" onClick={() => decide(action.id, 'rejected')}>
              Reject
            </button>
            <button type="button" className="btn-ghost" onClick={() => setAsking((v) => !v)}>
              Ask Agent
            </button>
            <p className="ml-auto text-sm text-muted">
              {action.level === 3 ? 'Nothing runs until you approve.' : 'Prepared — no systems touched yet.'}
            </p>
          </div>
        )
      }
    >
      <div className="border border-line bg-canvas px-4 py-3.5">
        <p className="eyebrow">{action.level === 3 ? 'What will happen' : 'What has been prepared'}</p>
        <p className="mt-2 text-lg font-medium leading-snug">{action.summary}</p>
        <p className="tnum mt-3 text-base font-semibold text-ink">{action.impact}</p>
      </div>

      <DrawerSection title="Why the agent believes this" className="mt-6">
        <p className="text-base leading-relaxed text-ink-2">{action.rationale}</p>
        {action.evidence_ids.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {action.evidence_ids.map((eid) => (
              <button
                key={eid}
                type="button"
                onClick={() => openDrawer({ kind: 'evidence', id: eid })}
                className="btn-default"
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                  <rect x="0.5" y="0.5" width="8" height="8" stroke="currentColor" />
                  <path d="M2.5 4.5h4M2.5 6.2h2.6M2.5 2.8h4" stroke="currentColor" strokeWidth="0.9" />
                </svg>
                Evidence
              </button>
            ))}
          </div>
        )}
      </DrawerSection>

      <DrawerSection title="Scope of the change">
        <FieldGroup>
          <Field label="Approval level">
            {level.name} — {level.rule}
          </Field>
          <Field label="Verbs">{level.verbs}</Field>
          <Field label="Company">{companyName(action.company_id)}</Field>
          <Field label="Systems">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {action.systems.map((s) => (
                <SourceBadge key={s} source={s} />
              ))}
            </span>
          </Field>
          <Field label="Reversible">{action.reversible}</Field>
        </FieldGroup>
      </DrawerSection>

      {asking && (
        <DrawerSection title={`Ask ${agent.name}`}>
          <div className="flex gap-2">
            <input
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && question.trim()) {
                  setAsked(question.trim());
                  setQuestion('');
                }
              }}
              placeholder="e.g. What happens to the message history?"
              className="flex-1 border border-line-strong bg-paper px-2.5 py-1.5 text-base placeholder:text-faint focus:border-accent"
              data-focus-ring=""
            />
            <button
              type="button"
              className="btn-default"
              onClick={() => {
                if (question.trim()) {
                  setAsked(question.trim());
                  setQuestion('');
                }
              }}
            >
              Send
            </button>
          </div>
          {asked && (
            <div className="mt-4 border-l-2 border-line-strong pl-3.5">
              <p className="text-sm text-muted">You asked</p>
              <p className="mt-1 text-base text-ink-2">{asked}</p>
              <p className="mt-3 text-sm text-muted">{agent.name}</p>
              <p className="mt-1 text-base leading-relaxed text-ink-2">
                {action.reversible} Beyond that, I can only answer from{' '}
                {action.systems.map(sourceLabel).join(', ')} — if the answer needs data outside
                those systems, I will tell you rather than estimate it.
              </p>
            </div>
          )}
        </DrawerSection>
      )}

      <DrawerSection title="Trail">
        <ul className="space-y-2.5">
          <li className="flex gap-3 text-base">
            <span className="tnum w-[68px] shrink-0 text-sm text-muted">
              {clockTime(action.requested)}
            </span>
            <span className="text-ink-2">
              {agent.name} requested approval ·{' '}
              <Claim evidenceId={action.evidence_ids[0]}>{action.impact}</Claim>
            </span>
          </li>
          {action.decided_at && (
            <li className="flex gap-3 text-base">
              <span className="tnum w-[68px] shrink-0 text-sm text-muted">
                {clockTime(action.decided_at)}
              </span>
              <span className="text-ink-2">
                {action.decided_by} {action.status === 'rejected' ? 'rejected' : 'approved'} the action
              </span>
            </li>
          )}
        </ul>
      </DrawerSection>
    </Drawer>
  );
}
