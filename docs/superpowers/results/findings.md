# AC/DC PoC — Findings

> Validating Sonar's Agent-Centric Development Cycle as the basis for a standard
> AI-assisted development setup for Gradion's upcoming open-source projects.

## Setup as run
- **Repo:** `github.com/gradionai/acdc-poc` (subject = a minimal Express + TypeScript
  notes API). Experiment design/control docs live on the `experiment-control` branch
  so the subject's `main` stays a clean app (no answer key reachable by run agents).
- **SonarQube Cloud:** org `gradion`, project `gradionai_acdc-poc`, **Team trial**,
  CI-based analysis (Automatic Analysis disabled), default quality profile/gate.
- **Tooling:** Claude Code (agent) · SonarQube Cloud quality gate in CI ·
  **Gitar** AI code review on every PR · GitHub Actions · GitGuardian (secrets).
- **Runs:** 2 tasks × 2 loops = 4 runs, each a fresh isolated Claude Code session
  from a clean start tag (`baseline` for Task A, `task-b-bugged` for Task B).
  - Loop 1 = pre-commit **self-verify** (SonarQube via MCP) before opening the PR.
  - Loop 2 = open PR immediately, react to **post-PR** SonarQube + Gitar review.
- **Run order actually executed:** A2 → A1 → B1 → B2 (Loop 2 ran before Loop 1 on
  Task A for practical reasons — MCP not yet set up). Runs are isolated, so no
  agent-side learning carryover.

## Results (scorecard summary)

| | A1 — feat / self-verify | A2 — feat / post-PR | B1 — bug / self-verify | B2 — bug / post-PR |
|---|---|---|---|---|
| Pre-PR self-verify (deterministic) | 0 issues | n/a | 0 issues | n/a |
| SonarCloud PR analysis | 0 new, gate ✓ | 5 new, gate ✓ | 0 new, gate ✓ | 0 new, gate ✓ |
| **Gitar (AI review)** | **4 findings** (bug, security, perf, quality) | 1 (test quality) | 1 (redundant tests) | 0 (approved) |
| Bug/security escaped to end | **2** (memory leak + missing `nosniff`) | 0 (1 partial) | 0 | 0 |
| Task correctness | feature works; 2 latent issues | feature works | ✅ fixed (acceptance test passes) | ✅ fixed (acceptance test passes) |
| Rework cycles / human events | 0 / 1 | 0 / 0 | 0 / 0 | 0 / 0 |

(Full per-run detail + the pitfall-checklist scoring is in `scorecard.md`.)

## Did pre-commit self-verify (Loop 1) beat post-PR review (Loop 2)?

**No — and the more important answer is that this was the wrong question.** The
distinction that mattered was not *when* verification ran, but *which kind* of
verification ran against *which class* of issue.

**1. Deterministic verification is necessary but not sufficient.**
In A1 the agent's pre-commit self-verify *and* SonarCloud's PR analysis both
reported "clean" (0 issues, gate passed, 100% coverage) — yet the code shipped a
real **memory-leak bug** (note deletion never freed attachment bytes) and a
**missing security header** (`X-Content-Type-Options: nosniff` on downloads). Both
were caught only by **Gitar's semantic AI review**. Rule-based analysis is blind to
this class of design/correctness/security-context issue.

**2. AI review and deterministic analysis are complementary, not redundant.**
SonarQube reliably enforces rule/coverage/duplication gates; Gitar reliably catches
bugs, design smells, and contextual security gaps. Each caught things the other did
not. The strongest setup uses **both**.

**3. The useful layer depends on the issue class.**
- *Latent design/security issues* (Task A): the **AI review layer was decisive** —
  it's what stood between a "green" PR and a shipped bug.
- *Clear-cut logic bug* (Task B): **both loops fixed it identically and correctly**
  (independent hidden acceptance test passes for both); deterministic checks were
  irrelevant, and correctness came from the **Guide + agent reasoning + a regression
  test**. Loop shape barely mattered.

**4. The Guide does the heavy lifting.**
Across all runs, the agents' first cuts were shaped far more by `CLAUDE.md` (which
encoded our standards and security expectations) than by the loop mechanics. A good
Guide is the highest-leverage, lowest-cost component.

**5. "Self-verify instead of review" is a trap.**
Our Loop 1, defined as *self-verify then open the PR*, let A1's two issues escape
**unfixed** because it stopped before incorporating post-PR review. Pre-commit
self-verify should *reduce* what reaches review, not *replace* it.

## Recommended setup for Gradion OSS repos

1. **Guide** — ship a `CLAUDE.md` per repo encoding coding standards, architecture,
   and explicit security expectations. Highest ROI; do this first.
2. **Generate** — Claude Code (or equivalent) as the implementing agent, hands-off
   (instruct it to open its own PR; don't pause for confirmation).
3. **Verify (layered, on every PR)** — keep **both**:
   - SonarQube Cloud **quality gate in CI** (deterministic: rules, coverage, hotspots).
   - **Gitar** AI code review (semantic: bugs, design, contextual security).
   Optional: pre-commit self-verify to cut review noise — a *complement*, not a gate.
4. **Solve** — require the agent to **address or explicitly dismiss every reviewer
   finding**, not stop at "gate green." (In A2 a real, non-blocking Gitar finding was
   left unaddressed because the gate already passed — tighten the done-criterion.)
5. **Govern** — humans set the standards and adjudicate; the loop runs autonomously
   between those checkpoints (3 of 4 runs needed zero human intervention).

## Caveats
- **Sample size:** 2 task types, n=1 per cell — this proves mechanics and yields a
  credible qualitative narrative, **not** statistics.
- **Agent-to-agent variance:** independent runs produced materially different code
  (e.g. A2's download had `nosniff`; A1's didn't), so part of the A1↔A2 delta is
  *which implementation the agent happened to produce*, not loop shape. The
  loop-independent lessons (above) are the robust ones.
- **Tooling fidelity:** the **Agentic Analysis add-on** (CI-context
  `run_advanced_code_analysis`) is **not in the Team trial**, so Loop 1 self-verified
  with the basic, snippet-level `analyze_code_snippet`. **Context Augmentation**
  (`get_guidelines`) was likewise unavailable (Beta + needs project history) — which
  actually *helped* comparability, since `CLAUDE.md` was then the single, constant
  Guide across both loops. A full evaluation of the add-on's CI-context precision is
  future work.
- **Run order:** Loop 2 ran before Loop 1 on Task A; mitigated by fresh isolated
  sessions (no carryover).
- **No tool substitutions:** Gitar worked on every human-authored PR (the earlier
  "failed to start review" was only on a Dependabot/bot PR — bad test subject).
