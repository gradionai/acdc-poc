# Professional OSS Template — Phase 1 Design

**Date:** 2026-06-09
**Status:** Approved (brainstorm) — pending spec review
**Author:** dung.nguyen@gradion.com (with Claude Code)

## Purpose

Evolve the AC/DC PoC repo (`gradionai/acdc-poc`) into a **professional,
reusable open-source template** for Gradion's future OSS projects, and the
foundation on which autonomous coding agents will later work tickets end-to-end.

This is **Phase 1 of two**:
- **Phase 1 (this spec):** the durable template foundation — a minimal full-stack
  app with Playwright e2e/video, complete OSS hygiene, and a GitHub-native task
  queue with automation.
- **Phase 2 (future spec):** autonomous agents taking GitHub issues to PRs with
  video proof-of-work, and a reviewer comparison (Gitar vs CodeRabbit vs Claude).

Phase 2 depends on Phase 1; building the foundation first de-risks it.

## Decisions locked during brainstorming
- **Repo:** evolve the existing `gradionai/acdc-poc` (reuse the wired SonarQube +
  Gitar + CI + Sonar MCP). Experiment artifacts stay on `experiment-control`.
- **Stack:** React + Vite SPA (TypeScript) on the existing Express + TS API.
- **App seed:** notes **CRUD UI** (list/paginated, create, view, delete). Richer
  features (edit, search, tags, attachments, pin) become seeded agent tickets.
- **Structure:** light **monorepo via npm workspaces** (`server/`, `web/`, `e2e/`).
- **License:** **Apache-2.0** (copyright holder: "Gradion" — confirm legal name).
- **Task management:** GitHub **Project (v2) board + agent-ready issue templates +
  seeded backlog + board automation** — automated issue/PR→board routing on top of
  a board that is bootstrapped once by an operator (not "fully" hands-off; see the
  build/operator split and the token fallback in Prereq #1).
- **Spec/plan docs** live on `experiment-control` (process docs), NOT in the
  shipped template on `main`.

## Scope

### In scope (Phase 1)
- Monorepo restructure (`server/` from current `src/`+`test/`; new `web/`, `e2e/`).
- Minimal React+Vite notes CRUD UI on the Express API (routes moved under `/api`).
- Playwright e2e (happy path) with **video + trace on**, artifacts in CI, PR comment.
- Full OSS hygiene file set (below).
- GitHub Project board, labels, issue/PR templates (incl. `agent_task`), seeded
  backlog (~6 tickets), and Actions automation for the board.
- Quality wiring: SonarQube monorepo paths, CI pipeline, ESLint+Prettier,
  commitlint/Conventional Commits.

### Out of scope (deferred to Phase 2 or YAGNI)
- Autonomous agent execution of tickets; reviewer comparison (Gitar/CodeRabbit/Claude).
- CodeRabbit / Claude reviewer installation (Phase 2).
- Heavy governance (MAINTAINERS/GOVERNANCE/CLA bot/all-contributors).
- Multiple e2e browsers (Chromium only).
- Permanent/hosted demo-video storage (CI artifacts suffice).
- Auth, database, multi-user — the app stays in-memory and minimal.

## Architecture & repo layout

```
/
├── server/            # Express + TS API (moved from src/ + test/)
│   ├── src/  test/  package.json  tsconfig.json
├── web/               # React + Vite + TS SPA
│   ├── src/  index.html  package.json  vite.config.ts  tsconfig.json
├── e2e/               # Playwright tests + config (recorded media = gitignored artifacts)
│   ├── tests/  playwright.config.ts  package.json
├── .github/           # workflows, ISSUE_TEMPLATE/, PR template, CODEOWNERS, dependabot.yml
├── package.json       # workspaces: ["server","web","e2e"] + orchestration scripts
├── eslint.config.js  .prettierrc  .editorconfig  .gitattributes  commitlint.config.js
├── LICENSE  NOTICE  README.md  CONTRIBUTING.md  CODE_OF_CONDUCT.md  SECURITY.md
├── SUPPORT.md  CHANGELOG.md
└── sonar-project.properties   # monorepo coverage paths
```

**How parts connect:**
- API routes move under `/api` (e.g. `/api/notes`) to coexist with the SPA.
- **Dev:** `npm run dev` runs Vite (proxying `/api` → Express) + Express together.
- **Prod/CI:** `npm run build` builds the SPA to `web/dist`; **Express serves it
  statically** with SPA fallback to `index.html`. One server, one URL.
  **Route precedence contract:** the `/api` router mounts **first**; the static +
  history-fallback middleware mounts **after** and the fallback **must exclude
  `/api/*`** (so the SPA catch-all never shadows the API). The server resolves the
  SPA build via a path relative to `server/` (e.g. `../web/dist`), guarded so a
  missing build yields a clear error rather than a silent 404.

**e2e serving:** `playwright.config.ts` `webServer` builds the SPA + boots Express,
`baseURL` points at it — Playwright drives the **real browser against the real
app**, so recorded video is genuine proof, not mocked.

**Test layers (each independently runnable):**
- `server/` — Vitest + supertest (moved/existing; routes re-pointed to `/api`).
- `web/` — Vitest + React Testing Library (one minimal component test).
- `e2e/` — Playwright happy path (create → list → delete).

## OSS hygiene set

| File | Purpose |
|---|---|
| README.md | Overview, badges (CI, Sonar gate, license), quickstart, dev, architecture |
| LICENSE | Apache-2.0 full text |
| NOTICE | Apache-2.0 attribution (copyright "Gradion") |
| CONTRIBUTING.md | Dev setup, workspace commands, branch/PR flow, Conventional Commits, the green bar |
| CODE_OF_CONDUCT.md | Contributor Covenant 2.1 |
| SECURITY.md | Private vulnerability reporting, supported versions |
| SUPPORT.md | Where to get help |
| CHANGELOG.md | Keep a Changelog format |
| .github/ISSUE_TEMPLATE/{bug_report,feature_request,agent_task}.yml + config.yml | Issue templates incl. the agent task spec |
| .github/PULL_REQUEST_TEMPLATE.md | Checklist: linked issue, tests, proof-of-work video link |
| .github/CODEOWNERS | Default ownership/reviewers |
| .github/dependabot.yml | npm + GitHub Actions updates (net-new committed file; Dependabot is currently enabled via defaults, no committed config yet) |
| .editorconfig, .gitattributes | Consistent formatting/line endings |
| ESLint + Prettier + commitlint configs | Tooling-as-policy (enforced in CI) |

Badges in README wired to live CI + SonarCloud quality gate + license.

## GitHub task management & automation

**Labels:** `agent-ready`, `needs-human`, `blocked`; `type:{feature,bug,chore,docs}`;
`area:{web,server,e2e}`; `priority:{high,med,low}`. Managed as code where practical.

**Project (v2) board:** status flow **Todo → In Progress → In Review → Done**;
custom fields `Priority` and `Agent` (records who/what handled it — feeds Phase 2).
Issues and PRs auto-added.

**`agent_task` issue template** (self-contained enough for unsupervised execution):
context, **acceptance criteria** (testable checklist), **scope boundaries**,
**proof-of-work required** (a Playwright e2e covering the feature + recorded video
attached to the PR), affected area, and Definition of Done (tests pass, Sonar gate
green, all review findings resolved).

**Seeded backlog (~6 `agent_task` tickets)** for Phase 2 agents: edit-note,
search/filter, tags, attachments upload/download UI, pin/favorite, and
pagination **controls** (next/prev UI — distinct from the base paginated list,
which already ships in the seed).

**Automation:**
- GitHub **Projects v2 built-in workflows**: item-added → Todo; PR linked & opened
  → In Review; issue closed / PR merged → Done.
- An **`actions/add-to-project` workflow** auto-adds new issues/PRs and covers
  status transitions the built-ins miss (assigned/reopened).
- **PR automation:** PR template requires a linked issue + proof-of-work checklist;
  a lightweight check enforces a linked issue.

**Build vs operator split:** templates, PR template, workflow YAML, labels-as-code,
configs = **build** (files). Creating the Project board, applying labels, seeding
issues, and provisioning the Projects PAT = **operator** (exact `gh` commands in
the plan).

## Playwright proof-of-work

- `use: { video: 'on', trace: 'on', screenshot: 'only-on-failure', baseURL }` —
  video on every run (passing included) = genuine proof-of-work.
- Chromium only; HTML reporter; dedicated `outputDir`.
- **`webServer`:** runs a dedicated `npm run start:prod` (builds the SPA then boots
  Express serving `web/dist`) and waits on its `url` (e.g. `http://localhost:3000`);
  `reuseExistingServer: !process.env.CI` (reuse a running dev server locally, always
  fresh in CI).
- **Generated media are artifacts, not committed:** `e2e/test-results/` and
  `e2e/playwright-report/` are **gitignored**. CI uploads them as workflow artifacts
  and **comments the report/artifact link on the PR** (even on failure). Nothing
  under `e2e/` holds checked-in videos — durable storage is explicitly out of scope.
- Convention documented in PR template + CONTRIBUTING: every feature PR carries a
  passing e2e and its recorded video (via the artifact link).

## Quality wiring & migration

- **Restructure:** move `src/`→`server/src/`, `test/`→`server/test/`; add
  `server/package.json`+`tsconfig.json`; add `web/` and `e2e/` workspaces; root
  `package.json` with workspaces + scripts (`dev`, `build`, `test`, `test:e2e`,
  `lint`). Re-point API routes to `/api/*` and update supertest tests.
- **TypeScript strategy:** a root `tsconfig.base.json` holds shared strict options;
  each workspace extends it. `server/` keeps the current ESM/NodeNext-style config
  (it already emits runnable ESM with `.js` import specifiers); `web/` uses Vite's
  bundler module resolution + JSX. No project-references requirement — each
  workspace typechecks independently via its own `tsconfig`.
- **SonarQube:** `sonar.sources=server/src,web/src`;
  `sonar.javascript.lcov.reportPaths=server/coverage/lcov.info,web/coverage/lcov.info`;
  exclude `e2e/` + config; same project key/org so the gate stays comparable.
  Each workspace's Vitest config **must emit its lcov into its own
  `<workspace>/coverage/` dir** (not a shared root `coverage/`), and the Sonar scan
  must run **after both** coverage steps — otherwise coverage merges to ~0 and the
  gate passes vacuously.
- **CI (one workflow, ordered):** `npm ci` → lint/typecheck → server tests (cov) →
  web tests (cov) → build SPA → Playwright e2e (upload artifacts; comment the
  report link on the PR **even on failure**) → Sonar scan (strictly after both
  coverage steps exist).
- **ESLint + Prettier** (shared root config) + **commitlint** (Conventional Commits).
- Tag **`v0.1.0`** + CHANGELOG entry when Phase 1 lands.

## Prerequisites & risks (resolve during planning)
1. **Projects v2 token scope (biggest setup unknown):** the current `gh` token lacks
   `project` scope; need `gh auth refresh -s project,read:project` and a
   **`PROJECTS_TOKEN`** PAT secret for the Actions workflow (default `GITHUB_TOKEN`
   cannot write user/org Projects). Confirm org permissions allow a PAT with
   `project` scope.
   **Fallback (if org policy forbids the PAT):** use only the Projects v2 *built-in*
   workflows (configured in the board UI) plus manual "add to project," and drop the
   `actions/add-to-project` workflow. The durable foundation (Steps 1–4 of the plan)
   must not depend on this, so a token failure can't block Phase 1 — only the board
   auto-routing is affected.
2. **SonarQube monorepo config:** verify coverage from two workspaces is merged
   correctly and the gate stays meaningful after the restructure.
3. **`main` churn:** this is a large, deliberate `main` change. Cleanup checklist
   (folded into the plan): close PRs #5–8, delete the `run/*` local+remote branches
   and the `pr1`–`pr8` local refs, and resolve/close the `dependabot/*` remote
   branch. The `experiment-control` branch and `baseline`/`task-b-bugged` tags are
   intentionally kept.
4. **Copyright legal name** for LICENSE/NOTICE — defaulting to "Gradion".
5. **SPDX headers:** decision deferred to the plan — default **no** per-file SPDX
   headers for Phase 1 (LICENSE+NOTICE suffice for a minimal template); revisit if
   the company standard requires them.
6. **Package version:** keep `package.json` at `0.1.0` (re-baselining the template)
   and add a `v0.1.0` git tag when Phase 1 lands; no version bump needed.

## Implementation phasing (guidance for the plan)

This is one coherent spec, but the plan should sequence it so a token/setup failure
late in the process can't block the durable foundation:
1. **Monorepo restructure** (`server/` move, root workspaces, `/api/*` routes,
   updated supertest tests) → green `server` tests + Sonar.
2. **Web SPA** (React+Vite, dev proxy, Express-serves-SPA with the precedence
   contract) + minimal web test.
3. **Playwright e2e** (happy path, video/trace, `start:prod` webServer) + CI
   artifacts + PR comment.
4. **OSS hygiene** files + ESLint/Prettier/commitlint + README badges.
5. **GitHub board/labels/templates/seeded issues + automation** — **last**, since
   it's operator- and token-gated (see Prereq #1 fallback).

## Deliverables
- Restructured monorepo on `main`: `server/` + `web/` + `e2e/`, all green
  (server tests, web test, e2e with video, build), tagged `v0.1.0`.
- Full OSS hygiene file set.
- GitHub Project board, labels, issue/PR templates, ~6 seeded `agent_task` issues,
  and board automation.
- Updated SonarQube config + green CI pipeline incl. Playwright artifacts + PR comment.

## Success criteria
Phase 1 succeeds when:
- A fresh clone runs `npm ci && npm run dev` to a working notes UI on the API, and
  `npm test` + `npm run test:e2e` pass with a recorded video produced.
- The repo presents as a professional OSS project (all hygiene files, badges, green
  CI, passing Sonar gate).
- The GitHub board, labels, templates, seeded `agent_task` issues, and automation
  are live — i.e. an autonomous agent in Phase 2 could pick an `agent-ready` issue
  and have everything it needs to execute and prove the work.
