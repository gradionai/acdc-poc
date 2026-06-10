You are resolving reviewer findings on PR #<PR> (branch `run/issue-<N>`) for acdc-poc.

## Working directory
The git worktree at <WORKTREE_PATH>, branch `run/issue-<N>`. `git pull` first.

## Inputs (provided below)
- The current findings from Gitar, CodeRabbit, and Claude Code review (verbatim).
- Current CI / SonarCloud status.

## Steps
1. For each finding: if it is a bug, a security issue, or Medium+ severity, FIX it
   in code. If it is a pure nit/style/false-positive, do NOT change code — instead
   note a one-line dismissal rationale in your report.
2. Keep changes minimal and within the PR's scope.
3. Re-run the same green bar CI gates on (run
   `npm exec --workspace e2e -- playwright install chromium` first if the browser
   isn't present):
   `npm run lint && npm run build && npm run test:cov --workspace server && npm run test:cov --workspace web && npm run test:e2e`
4. Commit (Conventional Commits) and push.
5. Report: which findings you fixed (with the commit), which you dismissed (with
   rationale), and the green-bar results.

Do NOT merge. Report BLOCKED if a finding requires a decision you can't make.
