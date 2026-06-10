You are implementing GitHub issue #<N> for the acdc-poc full-stack template.

## Working directory
You are in a dedicated git worktree at <WORKTREE_PATH>, on branch
`run/issue-<N>`, branched from the latest `main`. Work ONLY here.

## Steps
1. `gh issue view <N>` — read the issue's acceptance criteria + scope.
2. Read `CLAUDE.md` for project conventions and the security/quality bar.
3. `npm ci` in the worktree (worktrees don't share node_modules), then
   `npm exec --workspace e2e -- playwright install chromium` (no `--with-deps` —
   that's a Linux/apt step CI uses; locally the browser binary is enough).
4. Implement the feature within the stated scope. Follow CLAUDE.md.
5. Add a Playwright e2e under `e2e/tests/` covering the feature (the config already
   records video — a passing e2e produces the proof-of-work artifact in CI).
6. Run the local green bar — mirror exactly what CI gates on, so a local pass
   predicts a CI pass:
   `npm run lint && npm run build && npm run test:cov --workspace server && npm run test:cov --workspace web && npm run test:e2e`
7. Commit with Conventional Commits; `git push -u origin run/issue-<N>`.
8. Open a PR to `main` that closes the issue:
   `gh pr create --base main --title "..." --body "Closes #<N> ..."`.
9. Report the PR number/URL and a summary of what you built + the green-bar results.

Do NOT merge. Do NOT touch unrelated code. Report BLOCKED if you cannot meet the
green bar.
