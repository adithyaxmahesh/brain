import { companyName, getEvidence } from '@/data';
import { count } from '@/lib/format';
import { sourceLabel } from '@/lib/sources';
import { Drawer, DrawerSection, Field, FieldGroup } from './Drawer';
import { PulseDot, SourceBadge } from './primitives';

/**
 * Answers one question and only that question: why does Company Brain believe
 * this? Source, company, report, period, the data itself, how it was derived,
 * what would make it wrong, and when it was last synced.
 */
export function EvidenceDrawer({ id, depth }: { id: string; depth: number }) {
  const e = getEvidence(id);

  if (!e) {
    return (
      <Drawer eyebrow="Evidence" title="This claim has no evidence record" depth={depth}>
        <p className="text-base text-muted">
          Company Brain could not resolve evidence <code className="font-mono text-sm">{id}</code>.
          Treat the claim as unverified — it should not have been presented as fact.
        </p>
      </Drawer>
    );
  }

  return (
    <Drawer
      eyebrow="Evidence"
      title={e.report}
      depth={depth}
      meta={
        <>
          <SourceBadge source={e.source} />
          <span className="text-sm text-faint">·</span>
          <span className="text-sm text-muted">{companyName(e.company_id)}</span>
          <span className="text-sm text-faint">·</span>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <PulseDot tone="good" />
            Synced {e.last_synced.toLowerCase()}
          </span>
        </>
      }
    >
      <div className="border border-line bg-canvas px-4 py-3.5">
        <p className="eyebrow">What the data shows</p>
        <p className="tnum mt-2 text-xl font-semibold leading-snug">{e.data}</p>
      </div>

      <DrawerSection title="Provenance" className="mt-6">
        <FieldGroup>
          <Field label="Source">{sourceLabel(e.source)}</Field>
          <Field label="Company">{companyName(e.company_id)}</Field>
          <Field label="Report">{e.report}</Field>
          <Field label="Time period">{e.period}</Field>
          {e.record_count !== undefined && (
            <Field label="Records">{count(e.record_count)} underlying records</Field>
          )}
          <Field label="Last synced">{e.last_synced}</Field>
        </FieldGroup>
      </DrawerSection>

      {e.rows && e.rows.length > 0 && (
        <DrawerSection title="Underlying data">
          <table className="grid-table">
            <tbody>
              {e.rows.map((r) => (
                <tr key={r.label}>
                  <td className="text-base text-ink-2">{r.label}</td>
                  <td className="tnum whitespace-nowrap text-right text-base font-medium">
                    {r.value}
                  </td>
                  <td className="w-[45%] text-sm text-muted">{r.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DrawerSection>
      )}

      {e.method && (
        <DrawerSection title="How it was calculated">
          <p className="text-base leading-relaxed text-ink-2">{e.method}</p>
        </DrawerSection>
      )}

      {e.caveats && e.caveats.length > 0 && (
        <DrawerSection title="What would make this wrong">
          <ul className="space-y-2">
            {e.caveats.map((c) => (
              <li key={c} className="flex gap-2.5 text-base leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[9px] size-[3px] shrink-0 rounded-full bg-watch" />
                {c}
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}
    </Drawer>
  );
}
