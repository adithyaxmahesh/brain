import { useEffect, useState } from 'react';
import {
  alerts,
  companies,
  holdingCompany,
  integrationCounts,
  opportunities,
  portfolioTotals,
} from '@/data';
import { totalIdentifiedSavings } from '@/data/opportunities';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';

const STEPS = [
  {
    n: 1,
    title: 'Create holding company',
    detail: 'Redwood Holdings · owner Alex Mahesh',
    work: 'Workspace created',
  },
  {
    n: 2,
    title: 'Add operating companies',
    detail: 'Atlas HVAC, Beacon Accounting, Northstar Insurance, Summit Plumbing, Clearline Logistics',
    work: '5 companies added',
  },
  {
    n: 3,
    title: 'Connect systems',
    detail: 'Accounting, ERP, CRM, spend, payroll, payments, identity and support',
    work: '18 connections authorized',
  },
  {
    n: 4,
    title: 'Generate initial portfolio analysis',
    detail: 'Normalize entities, diff metrics against prior periods, detect cross-company patterns',
    work: '4.1M records normalized',
  },
];

/**
 * The first-time experience. It earns the "magical" moment by doing real work in
 * front of the user: the numbers on the summary screen are computed from the
 * same data layer the rest of the product reads.
 */
export function OnboardingPage() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // Walk the four steps, then reveal the analysis.
  useEffect(() => {
    if (done) return;
    if (step >= STEPS.length) {
      const t = window.setTimeout(() => setDone(true), 700);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 700 : 1000);
    return () => window.clearTimeout(t);
  }, [step, done]);

  const counts = integrationCounts();
  const risks = alerts.filter((a) => a.severity === 'critical' || a.severity === 'material').length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-[560px]">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-[18px] items-center justify-center rounded-sm bg-ink font-mono text-[9px] font-bold text-white"
          >
            CB
          </span>
          <span className="text-sm font-semibold tracking-[-0.01em]">Company Brain</span>
        </div>

        {!done ? (
          <>
            <h1 className="mt-8 text-3xl font-semibold tracking-[-0.025em]">
              Welcome to Company Brain.
            </h1>
            <p className="mt-2.5 text-lg text-muted">
              Connect the companies you operate. Everything after this is one question box.
            </p>

            <ol className="mt-9 divide-y divide-line border-y border-line">
              {STEPS.map((s) => {
                const state = step > s.n ? 'done' : step === s.n ? 'active' : 'waiting';
                return (
                  <li
                    key={s.n}
                    className={cn(
                      'flex gap-4 py-3.5 transition-opacity',
                      state === 'waiting' && 'opacity-40',
                    )}
                  >
                    <span className="mt-1 shrink-0">
                      {state === 'done' ? (
                        <span className="flex size-[15px] items-center justify-center rounded-full bg-ink">
                          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                            <path
                              d="M1 4.2l2 2L7 1.8"
                              stroke="white"
                              strokeWidth="1.4"
                              fill="none"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      ) : state === 'active' ? (
                        <span className="block size-[15px] animate-pulse-dot rounded-full border-2 border-ink" />
                      ) : (
                        <span className="block size-[15px] rounded-full border border-line-strong" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium">
                        Step {s.n} — {s.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                        {s.detail}
                      </span>
                    </span>
                    <span className="shrink-0 pt-px text-sm text-faint">
                      {state === 'done' ? s.work : state === 'active' ? 'Working…' : ''}
                    </span>
                  </li>
                );
              })}
            </ol>

            <button
              type="button"
              onClick={() => setDone(true)}
              className="btn-ghost mt-5"
            >
              Skip
            </button>
          </>
        ) : (
          <div className="animate-rise">
            <h1 className="mt-8 text-3xl font-semibold tracking-[-0.025em]">
              We've analyzed your portfolio.
            </h1>
            <p className="mt-2.5 text-lg text-muted">
              {holdingCompany.name} · {companies.length} operating companies
            </p>

            <dl className="mt-8 divide-y divide-line border-y border-line">
              <Row label="Systems connected" value={String(counts.total_active)} />
              <Row label="Companies" value={String(companies.length)} />
              <Row label="Portfolio revenue" value={money(portfolioTotals.revenue)} />
              <Row label="Opportunities found" value={String(opportunities.length)} />
              <Row label="Risks detected" value={String(risks)} />
            </dl>

            <div className="mt-7 border border-line bg-paper px-4 py-4 shadow-subtle">
              <p className="eyebrow">Potential identified savings</p>
              <p className="tnum mt-1.5 text-5xl font-semibold tracking-[-0.03em]">
                {money(totalIdentifiedSavings())}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Annualized, across vendor consolidation, duplicate software, labor and automation.
                Every figure is traceable to the system it came from.
              </p>
            </div>

            <button type="button" onClick={completeOnboarding} className="btn-primary mt-7 px-4 py-2">
              Enter Company Brain
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-base text-muted">{label}</dt>
      <dd className="tnum text-lg font-medium">{value}</dd>
    </div>
  );
}
