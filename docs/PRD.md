# SalesDex — Product Requirements Document

**Version:** 1.0  
**Last updated:** June 1, 2026  
**Status:** MVP in development

---

## 1. Vision & Summary

**SalesDex** (repo: `sales-hero`) is a gamified sales progression system for Property & Casualty (P&C) insurance agents. It wraps everyday CRM activity—calls, quotes, and closed policies—in a retro RPG experience inspired by classic monster-collection games.

**Tagline:** *Gotta close 'em all!*

Today the codebase is a working full-stack MVP:

| Layer | Stack | Role |
|-------|-------|------|
| Frontend | Vite + React 19 | Agent dashboard, encounters list, action simulator, battle log |
| Backend | Node.js + Express | Webhook receiver ("GameMaster"), XP engine, JSON persistence |
| Integrations | Zapier (mock UI today) | Ingest `insurance/call`, `insurance/quote`, `insurance/closed_policy` events |

Agents see their level, XP bar, unlockable avatars, gym-style badges, and a typing battle log that narrates each sale like an RPG encounter. Leads appear as "encounters" with their own XP and levels.

---

## 2. Target Users

| Persona | Needs | How SalesDex helps |
|---------|-------|-------------------|
| **P&C Insurance Agent** | Motivation during repetitive outreach | Instant XP, level-ups, and badge unlocks for every call/quote/close |
| **Sales Team Lead** | Visibility into activity without heavy CRM training | Simple encounter list + career stats |
| **Ops / RevOps** | Connect existing tools (RingCentral, AgencyZoom) via Zapier | Webhook API with documented event schema |
| **Demo / Onboarding** | Try the game without live integrations | Built-in Zapier Event Simulator tab |

---

## 3. Core Game Mechanics

### 3.1 XP & Leveling

| Action | Event type | XP |
|--------|------------|-----|
| Dialed lead | `insurance/call` | 30 |
| Sent quote | `insurance/quote` | 30 |
| Closed policy | `insurance/closed_policy` | 100 |

**Agent level thresholds** (total XP): 100 → L2, 500 → L3, 1,000 → L4, 5,000 → L5, 10,000 → L6.

**Lead levels** use the same curve on per-lead XP.

### 3.2 Badges (Gym-style achievements)

| Badge | Unlock condition | Bonus XP |
|-------|------------------|----------|
| Dialer Badge | 25 calls | +150 |
| Quote Master | 10 quotes | +300 |
| Closer Badge | 1 closed policy | +500 |

### 3.3 Avatar Unlocks

| Reward | Unlock at agent level |
|--------|----------------------|
| Trainer Girl | Level 2 |
| Champion Boy | Level 3 |
| Champion Girl | Level 4 |

### 3.4 Battle Log

The five most recent global events display in a typewriter-style dialogue box—level-ups, new prospects, badge earns, and action summaries.

### 3.5 Encounters (Leads)

Each webhook creates or updates a lead with privacy-safe names (e.g. "Jane D."). Leads accumulate XP and level independently from the agent.

---

## 4. Features — MVP vs Future

### MVP (current + near-term polish)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | Webhook ingestion + XP calculation | ✅ Shipped |
| P0 | Agent card (level, XP bar, skins) | ✅ Shipped |
| P0 | Encounters list | ✅ Shipped |
| P0 | Battle log | ✅ Shipped |
| P0 | Badge + career stats | ✅ Shipped |
| P0 | Zapier Event Simulator (manual triggers) | ✅ Shipped |
| P1 | Responsive game-style UI polish | 🔄 In progress |
| P1 | Env-based API URL for deployment | 🔄 In progress |
| P1 | README + Vercel deploy docs | 🔄 In progress |

### Future (post-MVP)

| Priority | Feature | Notes |
|----------|---------|-------|
| P2 | Real Zapier templates + ngrok/production URL | Replace simulator for live agents |
| P2 | Multi-agent leaderboard | Team competition |
| P2 | Sound effects + level-up animations | Dopamine hooks |
| P2 | Persistent DB (Postgres/Supabase) | Replace `data.json` |
| P3 | Mobile PWA | Field agents on the go |
| P3 | Custom badge rules per agency | Admin config UI |
| P3 | CRM two-way sync | Read pipeline stage from AgencyZoom |

---

## 5. User Stories

### Agent experience

1. **As an** insurance agent, **I want** to see my level and XP bar, **so that** I feel progress after every action.
2. **As an** agent, **I want** a battle log that narrates my wins, **so that** closing a policy feels like beating a boss.
3. **As an** agent, **I want** to unlock new avatars as I level up, **so that** I have a reason to keep grinding.
4. **As an** agent, **I want** to see my active encounters ranked by XP, **so that** I know which prospects are "strongest."

### Team & ops

5. **As a** team lead, **I want** career stats (calls, quotes, policies), **so that** I can spot activity patterns without opening the CRM.
6. **As an** ops admin, **I want** a documented webhook schema, **so that** I can wire RingCentral and AgencyZoom through Zapier.

### Demo & dev

7. **As a** new user, **I want** a simulator to trigger events without Zapier, **so that** I can learn the game in under a minute.
8. **As a** developer, **I want** separate frontend/backend env config, **so that** I can deploy the UI on Vercel and the API elsewhere.

---

## 6. Success Metrics

| Metric | Target (90 days post-launch) | Measurement |
|--------|------------------------------|-------------|
| Daily active agents | 10+ on pilot team | Unique webhook `player.name` or auth ID |
| Events per agent per day | ≥ 5 | Webhook volume |
| Badge earn rate | 50% earn Closer Badge in first week | `player.badges` |
| Simulator → live Zapier conversion | 30% of demo users connect a Zap | Integration flag |
| Session engagement | Avg. 3+ page loads per session | Frontend analytics |
| Level-up retention | 70% return within 48h of first level-up | Cohort analysis |

---

## 7. Technical Constraints

| Constraint | Detail |
|------------|--------|
| **Stack** | Vite + React (frontend), Express (backend)—no Next.js today |
| **Persistence** | File-based `server/data.json`—not suitable for multi-instance serverless without external storage |
| **Deployment split** | Frontend → Vercel static; Backend → Node host (Railway, Render, Fly.io) or future serverless refactor |
| **CORS** | Backend allows all origins today—tighten for production |
| **Secrets** | No API keys in repo; use `VITE_API_URL` and `PORT` env vars |
| **Privacy** | Lead names stored as first name + last initial only |
| **Polling** | Frontend refreshes state every 5s—consider WebSockets later |

---

## 8. Development Timeline

Assuming start **June 1, 2026** (today).

| Phase | Dates | Deliverables |
|-------|-------|--------------|
| **Sprint 0 — Foundation** | Jun 1–7, 2026 | PRD, git repo, README, UI polish, env config, Vercel frontend deploy |
| **Sprint 1 — Production API** | Jun 8–21, 2026 | Deploy Express backend, `VITE_API_URL` in prod, CORS lockdown, sample Zapier Zap |
| **Sprint 2 — Engagement** | Jun 22 – Jul 5, 2026 | Level-up toasts, badge progress bars, sound toggle |
| **Sprint 3 — Team features** | Jul 6–19, 2026 | Leaderboard MVP, Postgres migration spike |
| **Sprint 4 — Pilot** | Jul 20 – Aug 2, 2026 | 5–10 agent pilot, metrics dashboard, feedback loop |

---

## 9. Appendix — Current Architecture

```
┌─────────────────┐     POST /webhook      ┌──────────────────┐
│  Zapier / Mock  │ ─────────────────────► │  Express Server  │
│  Event Simulator│                        │  (port 3001)     │
└─────────────────┘                        │  xpCalculator.js │
                                           │  state.js        │
┌─────────────────┐     GET /state         └────────┬─────────┘
│  React App      │ ◄───────────────────────────────┘
│  (Vite :5173)   │     POST /player/customize
└─────────────────┘
```

**Key files:** `src/App.jsx`, `server/index.js`, `server/xpCalculator.js`, `server/state.js`

---

## 10. Open Questions

1. Should agent names be editable in UI or synced from CRM?
2. Single-tenant (one agency) vs multi-tenant SaaS?
3. Is `data.json` acceptable for pilot, or is Postgres required before any external user?
