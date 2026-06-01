# SalesDex — Launch Progress

**Date:** June 1, 2026  
**Repo folder:** `sales-hero` (local git on `main`, 2 commits)

## Completed today

| Area | Item | Status |
|------|------|--------|
| PRD | `docs/PRD.md` v1.0 | Done (prior session) |
| UI | Game-style polish, PNG avatar sprites on agent card | Done |
| Git | Local repo initialized, clean working tree | Done |
| Tooling | GitHub CLI (`gh`) installed via winget v2.93.0 | Done |
| P1 — Env | `VITE_API_URL` in `src/api/index.js` + `.env.example` | Verified |
| P1 — Deploy docs | README Vercel + split backend section | Verified |
| P1 — UI polish | Responsive RPG dashboard | Shipped (prior session) |
| Verify | `npm run lint` | Pass |
| Verify | `npm run build` | Pass |
| Verify | API `npm start` on port 3001 | Pass |

## Blocked — needs you

### GitHub remote & push

`gh` is installed but **not authenticated** (non-interactive environment cannot complete login).

Run in PowerShell:

```powershell
gh auth login
# Choose: GitHub.com → HTTPS → Login with browser (or paste token)

cd C:\Users\Nesta\Downloads\sales-hero
gh repo create sales-hero --public --source=. --remote=origin --push
```

If the repo name is taken or you prefer a different name:

```powershell
gh repo create YOUR-USERNAME-sales-hero --public --source=. --remote=origin --push
```

**Without `gh`** (after creating an empty repo on github.com):

```powershell
cd C:\Users\Nesta\Downloads\sales-hero
git remote add origin https://github.com/YOUR-USERNAME/sales-hero.git
git push -u origin main
```

### Vercel — deployed

| Item | Value |
|------|--------|
| **Production URL** | https://sales-hero.vercel.app |
| **Project** | `nestastreet-3165s-projects/sales-hero` |
| **GitHub** | https://github.com/Nestathebesta/sales-hero (connected via `vercel link`) |
| **Method** | Vercel CLI (`npx vercel link --yes`, `npx vercel --yes`) |
| **Build** | `npm run build` → `dist` (Vite preset auto-detected) |
| **SPA routing** | `vercel.json` rewrites |

**Env vars on Vercel:** none set yet. The app falls back to `http://localhost:3001` when `VITE_API_URL` is unset — fine for static UI preview; set `VITE_API_URL` after deploying the API:

```powershell
npx vercel env add VITE_API_URL production preview development
# Value: https://your-api-host.example.com (no trailing slash)
npx vercel --prod
```

## PRD Phase 1 (MVP polish) — summary

All **P0** features were already shipped. **P1** items were verified complete in code/docs; no additional feature code required for minimal launch.

## Enhancement roadmap

| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | Sales Guild rebrand, original SVG avatars, copy refresh | **Done** (June 2026) |
| 2 | Proper XP curve + career titles | Pending |
| 3 | activityLog, daily goals, streaks | Pending |
| 4 | Performance dashboard + charts | Pending |
| 5 | Level-up UX, pipeline stages, expanded medals | Pending |
| 6 | Supabase + multi-agent | Pending |

## Next (post-push)

1. Deploy `server/` with persistent storage or plan DB migration.
2. Set production `VITE_API_URL` on Vercel.
3. Connect real Zapier webhooks (replace simulator for pilot agents).
4. Tighten CORS on the API for your Vercel domain.

## Local commands

```powershell
cd C:\Users\Nesta\Downloads\sales-hero
npm install
cd server; npm install; npm start

# New terminal
cd C:\Users\Nesta\Downloads\sales-hero
npm run dev
```

App: http://localhost:5173 — API: http://localhost:3001
