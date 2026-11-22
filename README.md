# revohri monorepo

Personal projects, one repo.

| Path | What | Stack |
| --- | --- | --- |
| [`apps/resume`](apps/resume) | Resume site, deployed to GitHub Pages | Jekyll |
| [`apps/tour-guide`](apps/tour-guide) | Shared AI walking-tour guide — see [PLAN.md](apps/tour-guide/PLAN.md) | TypeScript (Vite/React PWA + Node/Hono + LiveKit) |
| [`packages/tour-shared`](packages/tour-shared) | Tour types, event protocol, curated routes (Kyoto) | TypeScript |

## Layout

- `apps/*` — deployable things. Each app picks the stack that suits it and owns its own toolchain.
- `packages/*` — shared libraries used by JS/TS apps, wired up through pnpm workspaces.
- `.github/workflows/` — one workflow per app, filtered by path so apps deploy independently.

## Common commands

```sh
pnpm resume:install   # bundle install for the resume
pnpm resume:dev       # jekyll serve on localhost:4000
```

## Deploys

The resume deploys via `.github/workflows/resume-pages.yml` on pushes to `gh-pages`
that touch `apps/resume/**`. GitHub Pages must be set to **Settings → Pages → Source: GitHub Actions**
(it no longer builds from the branch root).
