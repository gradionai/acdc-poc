# AC/DC PoC — Scorecard

One row per run. Runs: A1 (Task A, Loop 1), A2 (Task A, Loop 2),
B1 (Task B, Loop 1), B2 (Task B, Loop 2).

**Run order actually executed:** A2 first (Loop 2 run before Loop 1, deviating
from the protocol's Loop-1-first order for practical reasons — the MCP server for
Loop 1 was not yet set up). Each run is still an isolated fresh session from a
clean start tag, so agent-side learning carryover is nil; recorded here per the
fairness note.

| Metric | A1 | A2 | B1 | B2 |
|--------|----|----|----|----|
| Rework cycles (Verify→Solve iterations before green) | | **0** | | |
| Issues caught — count & stage | | **Sonar: 5 new (gate PASSED, non-blocking); Gitar: 1 (quality)** | | |
| Regressions or test failures (stage caught) | | **None** (CI green) | | |
| Escaped issues at end | | **Security: 0 escaped (1 partial). Gitar test-quality finding left unaddressed.** | | |
| Task B correctness: acceptance test passes? (Y/N) | n/a | n/a | | |
| Human-attention events | | **0 (confirmed — fully autonomous)** | | |
| Rough effort (qualitative) | | **Single pass, ~minutes (PR 15:07 → Sonar 15:09 → Gitar 15:11)** | | |

## A2 — detailed log (Task A feature, Loop 2 post-PR)

**PR:** #5 `feat: add file attachments to notes` — 1 commit (`df426d1`), 472+/4−,
base `main`. Checks: GitGuardian ✓, **SonarCloud ✓ (quality gate passed)**,
**Gitar ✓ (Approved with suggestions, 0 resolved / 1 finding)**, build-test-scan ✓.

**Pitfall checklist (scored against the final implementation):**
1. Path traversal on write — **PASS**: `isValidFilename` rejects `/`, `\`,
   control chars, `.`/`..`, empty, >255; storage is in-memory (no path built).
2. Path traversal on read — **PASS**: download is an in-memory lookup by id+name;
   no filesystem path from `:name`; filename RFC 5987-encoded in the header.
3. File size limit — **PASS**: multer `fileSize: 5MB`, `files: 1`, returns 413.
4. Content-type validation — **PARTIAL**: validates a *well-formed* MIME type
   (regex), not an allowlist; mitigates render risk with `X-Content-Type-Options:
   nosniff` and `Content-Disposition: attachment`.
5. Note existence check — **PASS**: `addAttachment`/`getAttachment` return 404
   for unknown notes.
6. No path/secret disclosure in errors — **PASS**: generic error messages.

**Issues caught & by which stage:**
- **SonarCloud (PR analysis):** 5 new issues, but **quality gate PASSED** — below
  the gate threshold (severities not enumerated here; visible in the SonarCloud
  UI). 98.5% coverage on new code, 0 security hotspots, 0 duplication.
- **Gitar:** 1 quality finding — the path-traversal test gives *false confidence*:
  it asserts `../../etc/passwd` is stored as `passwd` (201), but that only passes
  because supertest's `form-data` calls `path.basename()` client-side before
  sending; the server actually *rejects* names with separators (400). The test
  documents behavior the server doesn't implement and never exercises the real
  rejection branch. A subtle, real test-quality issue — not a security hole.

**Interpretation (preliminary):**
- The agent's *first cut* was already secure (0 security pitfalls escaped), almost
  certainly because `CLAUDE.md` (the Guide) spelled out the security expectations.
  So there was little for post-PR review to catch on security.
- **Confirmed by the operator:** the agent *did* wait for and read the Gitar +
  Sonar reviews before finishing, and there was **no human intervention** (fully
  autonomous). So the Loop 2 reaction loop genuinely engaged — "0 rework" reflects
  a deliberate judgment that nothing required a fix under the green bar, not a
  loop that never ran.
- Notable nuance: Gitar surfaced a **real (non-blocking) test-quality issue that
  the agent chose not to fix** because the green bar (gate pass + no Medium+ +
  tests green) was already met. Whether to count this as an "escaped issue"
  depends on how strictly we score non-blocking suggestions — flag for the
  cross-loop comparison and the findings writeup. It also suggests the green bar
  may want to include "address or explicitly dismiss reviewer findings."

## Comparison summary
- Loop 1 vs Loop 2 on Task A: *pending A1.*
- Loop 1 vs Loop 2 on Task B: *pending B1/B2.*
