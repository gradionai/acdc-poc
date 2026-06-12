# Agent Statistics — Autonomous Feature Run

> Living telemetry log for the Phase-2 parallel autonomous run on `gradionai/acdc-poc`.
> Each row = one subagent invocation. Backfilled for the run; appended going forward.

## Methodology & caveats

- **out_tokens** = `subagent_tokens` (tokens the agent *generated*). **Input tokens (context,
  file reads, tool results) are NOT captured per-agent** and are usually several× larger, so true
  billed cost is higher than the output-only figure here.
- **duration** = agent wall-clock. Agents run ≤5 in parallel, so the sum is NOT elapsed time.
- **out_cost** = out_tokens × $15/M (Claude Sonnet 4.x output). All agents ran on Sonnet (the
  orchestrator runs on Opus and is not counted).
- **All-in estimate** ≈ 2–4× out_cost (input:output ~5–15:1 at $3/M input).

## Suggested metrics (what this answers)
- **Cost per merged PR**, **iterations per PR** (churn), **CI-pass-first-try rate**, **role mix**,
  **parallel speedup**, **reliability** (stalls), **tokens/min**.

## Per-agent log

| # | Task | Role | PR | Duration (min) | out_tokens | tool_calls | out_cost ($) |
|---|------|------|----|---------------:|-----------:|-----------:|-------------:|
| 1 | Sync PR #59 onto main | sync | #59 | 9.0 | 83,598 | 54 | 1.25 |
| 2 | Foundation: e2e determinism (#62) | foundation | #62 | 5.5 | 50,775 | 60 | 0.76 |
| 3 | Recover #37 toasts | recover | #63 | 3.5 | 43,285 | 35 | 0.65 |
| 4 | Recover #36 loading states | recover | #64 | 4.8 | 53,130 | 36 | 0.80 |
| 5 | Impl #54 delete attachment | impl | #65 | 5.8 | 74,877 | 49 | 1.12 |
| 6 | Impl #44 sort options | impl | #67 | 8.3 | 92,117 | 64 | 1.38 |
| 7 | Finish #61 responsive (merge+findings) | sync | #61 | 12.1 | 91,803 | 88 | 1.38 |
| 8 | Impl #41 markdown body | impl | #66 | 4.3 | 48,148 | 36 | 0.72 |
| 9 | Impl #47 word/char count | impl | #68 | 4.1 | 51,684 | 34 | 0.78 |
| 10 | Impl #46 color labels | impl | #69 | 8.2 | 100,530 | 78 | 1.51 |
| 11 | Impl #45 duplicate note | impl | #70 | 5.3 | 68,778 | 44 | 1.03 |
| 12 | Impl #40 confirm dialog | impl | #73 | 6.6 | 67,283 | 49 | 1.01 |
| 13 | Impl #48 tag management | impl | #72 | 8.2 | 103,139 | 53 | 1.55 |
| 14 | Impl #38 keyboard shortcuts | impl | #75 | 7.2 | 71,957 | 53 | 1.08 |
| 15 | Impl #42 archive/unarchive | impl | #74 | 10.5 | 112,026 | 69 | 1.68 |
| 16 | Impl #52 multi-file upload | impl | #71 | 7.8 | 86,561 | 49 | 1.30 |
| 17 | Resolve #65 prettier CI | resolve | #65 | 3.2 | 22,540 | 24 | 0.34 |
| 18 | Resolve #66 markdown CI (ARIA/list) | resolve | #66 | 9.6 | 55,158 | 66 | 0.83 |
| 19 | Resolve #64 loading sonar+gitar | resolve | #64 | 7.1 | 78,720 | 52 | 1.18 |
| 20 | Resolve #67 sort CI+gitar | resolve | #67 | 12.8 | 103,065 | 101 | 1.55 |
| 21 | Resolve #61 responsive CI (commitlint) | resolve | #61 | 7.5 | 47,035 | 57 | 0.71 |
| 22 | Resolve #69 color CI+gitar | resolve | #69 | 4.2 | 67,918 | 35 | 1.02 |
| 23 | Resolve #73 confirm sync+gitar | resolve | #73 | 4.7 | 48,719 | 45 | 0.73 |
| 24 | Resolve #71 multi-upload sync+gitar | resolve | #71 | 4.9 | 62,990 | 46 | 0.94 |
| 25 | Resolve #74 archive sync+gitar | resolve | #74 | 10.1 | 109,544 | 72 | 1.64 |
| 26 | Fix-forward #76 nav (from #67) | resolve | #76 | 4.8 | 62,350 | 29 | 0.94 |
| 27 | Resolve #65 delete-button ambiguity | resolve | #65 | 4.2 | 55,504 | 32 | 0.83 |
| 28 | Resolve #72 tag CI (strict-mode) | resolve | #72 | 2.7 | 30,626 | 24 | 0.46 |
| 29 | Resolve #76 gitar findings | resolve | #76 | 4.0 | 36,953 | 34 | 0.55 |
| 30 | Resolve #75 keyboard sync+gitar | resolve | #75 | 5.5 | 49,637 | 49 | 0.74 |
| 31 | Sync #64 onto main | resync | #64 | 4.6 | 44,529 | 26 | 0.67 |
| 32 | Perfect #76 canonical nav | resolve | #76 | 4.6 | 64,571 | 26 | 0.97 |
| 33 | Re-sync #61 (canonical nav) | resync | #61 | 2.8 | 25,099 | 21 | 0.38 |
| 34 | Re-sync #71 + memory cap | resync | #71 | 4.4 | 51,852 | 36 | 0.78 |
| 35 | Re-sync #72 (nav) | resync | #72 | 4.3 | 49,287 | 35 | 0.74 |
| 36 | Re-sync #73 (nav) | resync | #73 | 4.4 | 45,710 | 44 | 0.69 |
| 37 | Re-sync #69 (nav) | resync | #69 | 6.8 | 93,601 | 47 | 1.40 |
| 38 | Re-sync #74 (nav) | resync | #74 | 6.0 | 75,848 | 42 | 1.14 |
| 39 | Re-sync #75 (nav) | resync | #75 | 2.4 | 42,862 | 21 | 0.64 |
| 40 | Re-sync+fix #61 (WCAG 44px) | resync | #61 | 3.9 | 49,669 | 36 | 0.75 |
| 41 | Re-sync+fix #73 (delete specs) | resync | #73 | 6.9 | 65,716 | 57 | 0.99 |
| 42 | Re-sync #74 onto new main | resync | #74 | 15.2 | 78,567 | 98 | 1.18 |
| 43 | Re-sync #75 onto new main | resync | #75 | 5.8 | 42,018 | 49 | 0.63 |
| 44 | Re-sync+fix #75 sonar coverage | resync | #75 | 10.6 | 67,977 | 88 | 1.02 |
| 45 | Resolve #73 sonar reliability+a11y | resolve | #73 | 24.9 | 120,010 | 166 | 1.80 |
| 46 | Fix #75 mobile 320px overflow | resync | #75 | 4.9 | 49,634 | 32 | 0.74 |
| 47 | Final re-sync #75 onto main | resync | #75 | 3.6 | 34,539 | 27 | 0.52 |
| 48 | Fix #75 flaky title-sort nav test | resolve | #75 | 4.3 | 31,517 | 34 | 0.47 |
| 49 | Fix #75 Escape/dialog focus bug | resolve | #75 | 3.0 | 66,064 | 28 | 0.99 |

## Aggregates (full feature run — COMPLETE)

- **Agents logged:** 49 (+4 killed by a network drop on 2026-06-11, no telemetry; work recovered from disk)
- **Total output tokens:** 3,129,520
- **Total agent-minutes:** 320 (5.3 agent-hours) — wall-clock far less (≤5 parallel)
- **Output-only cost:** $46.94 → **all-in estimate ≈ $94–$188**
- **Avg/agent:** 63,868 out_tokens, 6.5 min
- **Outcome:** 20 backlog features + 4 foundation/fix PRs merged; **24 issues Done**, 0 open PRs.
- **Cost per merged PR** (≈24 PRs merged, output-only): **$1.96** (~$6 all-in)

### By role

| Role | Agents | out_tokens | avg out_tokens | total min | avg min | out_cost ($) |
|------|-------:|-----------:|---------------:|----------:|--------:|-------------:|
| impl | 11 | 877,100 | 79,736 | 76 | 6.9 | 13.16 |
| resolve | 18 | 1,112,921 | 61,829 | 122 | 6.8 | 16.69 |
| resync | 15 | 816,908 | 54,461 | 87 | 5.8 | 12.25 |
| sync | 2 | 175,401 | 87,700 | 21 | 10.5 | 2.63 |
| recover | 2 | 96,415 | 48,208 | 8 | 4.1 | 1.45 |
| foundation | 1 | 50,775 | 50,775 | 5 | 5.5 | 0.76 |

### Iterations per PR (passes until merge — the churn metric)

| PR/branch | agent passes |
|-----------|-------------:|
| #75 | 9 |
| #73 | 5 |
| #61 | 4 |
| #74 | 4 |
| #64 | 3 |
| #65 | 3 |
| #69 | 3 |
| #72 | 3 |
| #71 | 3 |
| #76 | 3 |
| #67 | 2 |
| #66 | 2 |
| #59 | 1 |
| #62 | 1 |
| #63 | 1 |
| #68 | 1 |
| #70 | 1 |

### Observations

- **Re-sync + resolve dominated** over first-pass implementation — the `App.tsx` monolith forced
  every merge to re-sync the rest (the cascade). PR **#75** (keyboard shortcuts) alone took the most
  passes: it touched global key handling, the header layout, nav tests, the confirm-dialog
  interaction, and a flaky-timeout test. **#77 (decompose App.tsx)** is the direct mitigation for
  the UI phase.
- **CI-pass-first-try was low for UI PRs**: most needed ≥1 resolver (Prettier on new e2e specs,
  Playwright strict-mode locator collisions, SonarCloud new-code coverage <80%, Gitar edge cases).
  Server-only PRs fared best.
- **Layered verification repeatedly paid off**: CI e2e + Gitar caught real bugs unit tests missed —
  WCAG 44px touch targets, ARIA list roles, rate-limiter throttling the suite, multi-file upload
  memory cap, sort/duplicate nav edge cases, and the Escape/confirm-dialog focus race.

_Generation-side, approximate; maintained going forward (UI phase #77–#82 next)._

---

## Phase 2 — UI redesign + deferred features (summary)

After the 49-agent Phase-1 feature drain (precise per-agent rows above), Phase 2
delivered the **Clean & minimal UI redesign** (decompose App.tsx, design tokens +
per-component CSS modules, icon cards, composer/toolbar, state polish, full mobile
responsiveness) and the **deferred features** (trash/restore, tag colors, multi-tag
filter, tag autocomplete, image thumbnails, accessibility pass + axe-core gate).

**Outcome:** board 36/36 Done, 0 open PRs.

**Phase-2 telemetry is summarized, not per-agent backfilled** (~45 subagent
invocations: implementers + a high proportion of resolver / re-sync / recovery
agents). Order-of-magnitude: comparable to Phase 1 (~3M output tokens, ~$45
output-only / ~$135–270 all-in for the phase). The dominant cost was again
**re-sync + resolve**, not first-pass implementation.

### What drove Phase-2 cost (the lessons)
- **Overlapping feature PRs** (shared `App.tsx`/`store.ts`/`FilterBar`) forced an
  O(n) serial-merge-with-resync drain. The App.tsx decompose removed the cascade for
  CSS-only UI restyles (separate modules) but features still share logic files.
- **A chronic flaky test** (a structurally-racy full-App navigation integration test)
  cost many re-runs across PRs until root-fixed by extracting a pure `pageOfNoteById`
  helper + unit test + relying on e2e (PR #95). Lesson: fix flaky-test *design*, not
  timeouts.
- **Reviewer false positives**: Gitar flagged `lucide-react@1.x` and `typescript@6.x`
  as "non-canonical" (both are the genuine npm `latest`, post its knowledge cutoff).
  Handled via a `.gitar/rules` rule + verified documented overrides. A human/
  orchestrator check is needed to separate real findings from stale-knowledge noise.
- **Network drops** (laptop lock / lunch) killed in-flight agents repeatedly; work was
  always recoverable from worktrees (committed or uncommitted). Mitigation: an
  always-on host (the dark-factory direction).

### Headline ROI
Full PoC = 36 backlog issues shipped autonomously (generate → verify → review →
resolve → merge) across ~95 subagent invocations, est. low-hundreds of USD all-in.
Layered verification (CI e2e + SonarCloud + Gitar/CodeRabbit) repeatedly caught real
bugs unit tests missed (WCAG contrast/touch-targets, ARIA roles, rate-limiter
throttling, memory cap, nav edge cases, menu-dismissal a11y) — the core AC/DC thesis.
