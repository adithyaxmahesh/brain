import { useState } from 'react';
import { companyById, companyName, opportunityById } from '@/data';
import { CATEGORY_LABELS } from '@/data/opportunities';
import { money, moneyExact } from '@/lib/format';
import { useApp } from '@/state/AppContext';
import { Claim } from './Claim';
import { Drawer, DrawerSection, Field, FieldGroup } from './Drawer';
import { ConfidenceMark, SourceBadge } from './primitives';

export function OpportunityDrawer({ id, depth }: { id: string; depth: number }) {
  const { openDrawer, ask } = useApp();
  const [created, setCreated] = useState(false);
  const o = opportunityById(id);

  if (!o) {
    return (
      <Drawer eyebrow="Opportunity" title="Opportunity not found" depth={depth}>
        <p className="text-base text-muted">This opportunity is no longer open.</p>
      </Drawer>
    );
  }

  return (
    <Drawer
      eyebrow={CATEGORY_LABELS[o.category]}
      title={o.title}
      depth={depth}
      width="lg"
      meta={
        <>
          <SourceBadge source={o.source} />
          <span className="text-sm text-faint">·</span>
          <span className="text-sm text-muted">Detected {o.detected}</span>
          <span className="text-sm text-faint">·</span>
          <ConfidenceMark confidence={o.confidence} />
        </>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreated(true)}
            disabled={created}
          >
            {created ? 'Project created' : 'Create project'}
          </button>
          <button
            type="button"
            className="btn-default"
            onClick={() => ask(`Analyze ${o.title.toLowerCase()} in detail.`)}
          >
            Analyze
          </button>
          {created && (
            <p className="ml-auto text-sm text-muted">
              Assigned to Priya Raman · logged in Activity
            </p>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 border border-line bg-canvas px-4 py-3.5">
        <div>
          <p className="eyebrow">{o.impact >= 0 ? 'Potential annual impact' : 'Annual cost'}</p>
          <p className="tnum mt-1.5 text-3xl font-semibold tracking-[-0.02em]">
            <Claim evidenceId={o.evidence_ids[0]}>{moneyExact(o.impact)}</Claim>
          </p>
          <p className="mt-1 text-sm text-muted">{o.impact_note}</p>
        </div>
        <div className="ml-auto grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <p className="eyebrow">Affected companies</p>
            <p className="tnum mt-1.5 text-lg font-medium">{o.affected_company_ids.length}</p>
          </div>
          <div>
            <p className="eyebrow">Effort</p>
            <p className="mt-1.5 text-base font-medium">{o.effort}</p>
          </div>
        </div>
      </div>

      <DrawerSection title="Thesis" className="mt-6">
        <p className="text-base leading-relaxed text-ink-2">{o.thesis}</p>
      </DrawerSection>

      <DrawerSection title="How it was detected">
        <table className="grid-table">
          <tbody>
            {o.detection.map((d) => (
              <tr key={d.label}>
                <td className="text-base text-ink-2">{d.label}</td>
                <td className="tnum whitespace-nowrap text-right text-base font-medium">
                  <Claim evidenceId={o.evidence_ids[0]}>{d.value}</Claim>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DrawerSection>

      <DrawerSection title="Affected companies">
        <div className="flex flex-wrap gap-2">
          {o.affected_company_ids.map((cid) => {
            const c = companyById[cid];
            return (
              <button
                key={cid}
                type="button"
                onClick={() => openDrawer({ kind: 'company', id: cid })}
                className="btn-default"
              >
                {c.name}
                <span className="tnum text-muted">{money(c.revenue)}</span>
              </button>
            );
          })}
        </div>
      </DrawerSection>

      <DrawerSection title="Plan">
        <ol className="space-y-2.5">
          {o.steps.map((s, i) => (
            <li key={s} className="flex gap-3 text-base leading-relaxed text-ink-2">
              <span className="tnum mt-px w-4 shrink-0 text-sm text-faint">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </DrawerSection>

      <DrawerSection title="Evidence">
        <FieldGroup>
          <Field label="Records">
            <span className="flex flex-wrap gap-2">
              {o.evidence_ids.map((eid) => (
                <button
                  key={eid}
                  type="button"
                  className="btn-default"
                  onClick={() => openDrawer({ kind: 'evidence', id: eid })}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                    <rect x="0.5" y="0.5" width="8" height="8" stroke="currentColor" />
                    <path d="M2.5 4.5h4M2.5 6.2h2.6M2.5 2.8h4" stroke="currentColor" strokeWidth="0.9" />
                  </svg>
                  Evidence
                </button>
              ))}
            </span>
          </Field>
          <Field label="Scope">
            {o.company_id ? companyName(o.company_id) : 'Portfolio-wide'}
          </Field>
          <Field label="Confidence">
            <ConfidenceMark confidence={o.confidence} />
          </Field>
        </FieldGroup>
      </DrawerSection>
    </Drawer>
  );
}
