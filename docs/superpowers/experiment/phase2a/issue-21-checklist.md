# Issue #21 (pagination controls) — "what could go wrong" rubric

Used ONLY by the orchestrator to judge reviewer findings as TP/FP. Never given to
the implementer/resolver subagents.

## Correctness
- [ ] Total pages computed as `ceil(total / pageSize)` from the `X-Total-Count` header.
- [ ] Previous disabled on page 1; Next disabled on the last page (no off-by-one).
- [ ] Cannot navigate below page 1 or past the last page.
- [ ] Changing page fetches and renders the correct slice.
- [ ] Single page / empty list: controls disabled or hidden (no crash, no NaN pages).

## Quality
- [ ] Rapid clicks don't cause out-of-order / stale renders (no obvious race).
- [ ] Fetch failure handled like the existing flow (error alert), not an unhandled rejection.
- [ ] Controls are accessible (real `<button>` with text + disabled state, not div onClick).
- [ ] No duplicated pagination state; reuses the existing list fetch path.

## Tests
- [ ] e2e covers navigating forward AND back across more than one page.
- [ ] Component/unit test covers prev/next disabled boundaries.
