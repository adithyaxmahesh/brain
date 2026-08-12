# Company Brain

An AI operating layer for multi-company holding companies. One command surface
that understands every operating company independently and collectively, finds
things no single subsidiary's software can see, and takes approved action across
the portfolio.

The product is command-first, not dashboard-first. The interface exists to
provide context, trust and control around the intelligence.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle
npm run typecheck
```

Seeded with **Redwood Holdings** — five operating companies, $131.4M combined
revenue, running on different accounting, ERP, CRM and support systems.

---

## Demo script

Everything below works against the seed data.

| Ask | What happens |
| --- | --- |
| *What needs my attention today?* | Alerts and pending Level 3 approvals, ranked by dollar exposure, each with a cause and evidence |
| *Where can I save $500K across the portfolio?* | $1.24M across nine areas — vendor consolidation, duplicate software, overtime, contractor spend, automation — with the row where the target is cleared marked |
| *Which company has the best sales operation?* | Ranked comparison across five companies, the mechanism behind the winner, and one caveat the ranking hides |
| *Deploy Atlas's lead follow-up process to Northstar.* | The workflow, the systems it touches, the estimated impact, the translation risk, and a Level 3 action that requires approval |
| **Click any dotted-underlined number** | Evidence drawer: source system, company, report, period, underlying rows, how it was derived, and what would make it wrong |

Also worth trying: `⌘K` → type `Stripe` for the cross-company vendor view ·
`Compare @Atlas and @Beacon sales efficiency over the last 90 days` ·
*Find duplicate vendors.* · asking something the data cannot answer, which
returns "no grounded answer" rather than a guess.

The first-run experience shows on first load. Replay it from **Settings →
Reset onboarding**.

---

## Architecture

```
src/
  data/        Canonical data layer — the entity set, and the seed portfolio
  engine/      Query resolution: natural language → structured response blocks
  state/       Scope, drawer stack, approvals, conversation
  components/  Reusable UI; pages compose these rather than inlining markup
  pages/       One file per route
  lib/         Formatting, search index, source-system metadata
```

### Canonical data layer (`src/data`)

Every integration normalizes into the entities in `data/types.ts`
(`Company`, `Employee`, `Customer`, `Vendor`, `Transaction`, `Metric`,
`Opportunity`, `Agent`, `Action`, `Evidence`, `Workflow`, `Integration`,
`Alert`, …). Every record carries `company_id`, `created_at`, `updated_at` and
`source`; portfolio-scoped records carry `holding_company_id`.

That provenance is not decoration — it is what makes portfolio-wide analysis
possible without the UI knowing which CRM a given subsidiary runs. `Metric.key`
is stable across companies, so `metricAcrossPortfolio('inbound_conversion')`
compares five companies that report from four different systems.

Vendor records stay company-scoped on purpose. Duplication across the portfolio
is a finding, not a modeling problem to normalize away — `vendorRollups()` and
`fragmentedCategories()` derive the cross-company view on read.

### Evidence system (`src/data/evidence.ts`)

Nothing the product asserts exists without a record here. Each one carries the
source system, the named report, the period, the underlying rows, the derivation
method, the record count, and the caveats that would make the conclusion wrong.

The UI contract is a single component: `<Claim evidenceId="…">`. If a number has
the dotted underline, you can see where it came from. If it does not, Company
Brain is not claiming it as fact. A missing `evidence_id` renders as an explicit
"this claim has no evidence record" rather than silently passing.

### Query engine (`src/engine`)

`resolve(query, scope)` returns an `AIResponse`: an ordered `Block[]` plus the
retrieval context that produced it.

Blocks are `headline`, `prose`, `findings`, `table`, `stats`, `ledger`,
`actions`, `workflow`, `callout`, `followups`. Anything asserting a number
carries an `evidence_id`, which is how the evidence drawer works uniformly
across every answer shape.

Resolution today is a scored rule engine: each resolver reports how strongly it
matches, highest score wins. An explicit `@mention` overrides the sidebar scope;
two mentions route to a pairwise comparison; unmatched questions fall through to
a resolver that says so plainly.

Each resolver also declares what it retrieved — systems, entities, period,
tools — which the UI surfaces under every answer as "answered from N evidence
records across M systems."

**Swapping in a real model** is a single-function change. `resolve()` already
assembles the retrieval context that would become the prompt, and `Block[]` is
the response schema the model would be asked to fill. The rule engine becomes
the fallback for when the model returns nothing groundable.

### Approval layer

Actions are classified before they run:

- **Level 1** — read, analyze, recommend. Automatic.
- **Level 2** — draft, prepare, configure. Reviewed before execution.
- **Level 3** — execute, send, cancel, purchase, change permissions, modify
  financial systems. Always requires approval.

The approval drawer shows what changes, what it is worth, the agent's reasoning
with links to evidence, the systems touched, and how reversible it is. Deciding
writes through to the activity ledger with the deciding user — the audit trail
is the same stream for humans and agents.

### Drawer stack

Drawers stack rather than replace, so evidence can open on top of an approval and
return. `Escape` unwinds one level. Full pages are for companies, agents and
investigations; drawers are for evidence, approvals, opportunities and quick
company views.

---

## Design system

Tokens live in `src/index.css` as RGB triples, mapped to Tailwind names in
`tailwind.config.js`. Off-white canvas, hairline borders, 2–4px radii,
tabular numerals on every figure, 140ms transitions. Typography carries the
hierarchy; the accent color is reserved for interaction.

The structural devices are `.eyebrow` (small uppercase label), `.grid-table`
(dense institutional table) and the hairline rule. No KPI card grids, no
gradients, no glows.

---

## Status against the spec

**Built (P0):** command homepage with daily brief · portfolio overview ·
company pages · structured query responses · evidence drawer · opportunities ·
agents and agent detail · approval flows · activity ledger · company switcher ·
command palette · seed data · cross-company intelligence · first-run experience.

**Not built (P1/P2), and where it plugs in:**

- **Real LLM** — replace `resolve()` in `src/engine/query.ts`; the block schema
  and context assembly are already the contract.
- **Supabase / persistence** — the data modules export plain typed arrays behind
  accessor functions (`metricsFor`, `opportunitiesFor`, `vendorsFor`, …).
  Swapping those for queries does not touch the components.
- **Authentication** — roles and their approval ceilings are modeled and shown
  in Settings; enforcement is UI-only today.
- **Real integrations** — `SourceSystem` and the `Integration` entity define the
  connector surface. Adding a provider means a normalizer that emits canonical
  entities; nothing in the UI changes.
- **Notifications, document upload, custom agent builder, forecasting.**

Session state (approvals, conversation, scope) lives in React state and resets
on reload, except the onboarding flag which persists to `localStorage`.
