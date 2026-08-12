import { companyName, integrationCounts, integrations } from '@/data';
import type { SourceSystem } from '@/data/types';
import { SOURCE_LABELS } from '@/lib/sources';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { EmptyState, PageHeader, PulseDot, SourceBadge } from '@/components/primitives';

/** Connectors the MVP surfaces, whether or not the workspace has enabled them. */
const CONNECTOR_CATALOG: { system: SourceSystem; category: string }[] = [
  { system: 'quickbooks', category: 'Accounting' },
  { system: 'netsuite', category: 'ERP' },
  { system: 'hubspot', category: 'CRM' },
  { system: 'salesforce', category: 'CRM' },
  { system: 'ramp', category: 'Spend management' },
  { system: 'stripe', category: 'Payments' },
  { system: 'google-workspace', category: 'Identity' },
  { system: 'microsoft-365', category: 'Identity' },
  { system: 'slack', category: 'Collaboration' },
  { system: 'rippling', category: 'Payroll & HRIS' },
  { system: 'gusto', category: 'Payroll & HRIS' },
  { system: 'zendesk', category: 'Support' },
  { system: 'intercom', category: 'Support' },
];

export function SettingsPage() {
  const { user, holding, resetOnboarding } = useApp();
  const counts = integrationCounts();

  return (
    <div className="mx-auto max-w-[980px] px-8 py-10">
      <PageHeader
        eyebrow="Settings"
        title="Workspace"
        description="Data connections, people and permissions for this holding company."
      />

      <section className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-5">
        <Figure label="Holding company" value={holding.name} />
        <Figure label="Signed in as" value={`${user.name} · ${user.role}`} />
        <Figure label="Active connections" value={String(counts.total_active)} />
        <Figure label="Needing attention" value={String(counts.error)} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Data connections</h2>
        <p className="mt-1.5 max-w-2xl text-base text-muted">
          Company Brain reads from these systems and normalizes everything into one canonical layer.
          It never writes without an approved action.
        </p>

        <div className="scroll-thin mt-5 overflow-x-auto">
          <table className="grid-table min-w-[760px]">
            <thead>
              <tr>
                <th>System</th>
                <th>Category</th>
                <th>Scope</th>
                <th>Status</th>
                <th className="text-right">Records</th>
                <th>Last synced</th>
              </tr>
            </thead>
            <tbody>
              {integrations
                .filter((i) => i.status !== 'not-connected')
                .map((i) => (
                  <tr key={i.id}>
                    <td>
                      <SourceBadge source={i.system} />
                    </td>
                    <td className="text-base text-muted">{i.category}</td>
                    <td className="text-base text-muted">{companyName(i.company_id)}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <PulseDot
                          tone={
                            i.status === 'connected' ? 'good' : i.status === 'error' ? 'bad' : 'neutral'
                          }
                        />
                        <span
                          className={cn(
                            'text-base',
                            i.status === 'error' ? 'text-risk' : i.status === 'syncing' ? 'text-watch' : 'text-ink-2',
                          )}
                        >
                          {i.status}
                        </span>
                      </span>
                      {i.error && <span className="mt-1 block text-sm text-muted">{i.error}</span>}
                    </td>
                    <td className="tnum text-right text-base text-muted">
                      {i.record_count?.toLocaleString() ?? '—'}
                    </td>
                    <td className="text-base text-muted">{i.last_synced ?? '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="eyebrow mb-3">Available connectors</h2>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTOR_CATALOG.map((c) => {
            const live = integrations.filter(
              (i) => i.system === c.system && i.status !== 'not-connected',
            );
            return (
              <div key={c.system} className="flex items-center gap-3 bg-paper px-3.5 py-3">
                <SourceBadge source={c.system} showLabel={false} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base">{SOURCE_LABELS[c.system]}</span>
                  <span className="block text-sm text-muted">{c.category}</span>
                </span>
                {live.length > 0 ? (
                  <span className="shrink-0 text-sm text-strong">
                    {live.length > 1 ? `${live.length} entities` : 'Connected'}
                  </span>
                ) : (
                  <button type="button" className="btn-ghost shrink-0">
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="eyebrow mb-3">Roles</h2>
        <table className="grid-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Can approve</th>
              <th>Scope</th>
            </tr>
          </thead>
          <tbody>
            {[
              { role: 'Owner', approve: 'All levels, including financial systems', scope: 'Entire portfolio' },
              { role: 'Admin', approve: 'Levels 1–3 except permission changes', scope: 'Entire portfolio' },
              { role: 'Operator', approve: 'Levels 1–2', scope: 'Assigned companies' },
              { role: 'Viewer', approve: 'Nothing', scope: 'Assigned companies, read-only' },
            ].map((r) => (
              <tr key={r.role}>
                <td className="text-base">
                  {r.role}
                  {r.role === 'Owner' && <span className="chip ml-2">you</span>}
                </td>
                <td className="text-base text-muted">{r.approve}</td>
                <td className="text-base text-muted">{r.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2.5 text-sm text-muted">
          Company-level permissions arrive after authentication lands. Today every role's scope is
          enforced in the UI only.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="eyebrow mb-3">Prototype controls</h2>
        <EmptyState
          title="Replay the first-time experience"
          body="Company Brain's onboarding generates the initial portfolio analysis. You can run it again to see what a new holding company sees on day one."
          action={
            <button type="button" className="btn-default" onClick={resetOnboarding}>
              Reset onboarding
            </button>
          }
        />
      </section>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 text-lg font-medium">{value}</p>
    </div>
  );
}
