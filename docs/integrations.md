# Data inputs — manual, Google Calendar & AgencyZoom

Real prospects and activities enter the game via the Action Lab (manual) and via
Zapier from Google Calendar and AgencyZoom. The in-app "Existing prospect" picker
shows only **real** leads that have been ingested (no demo data).

## 1) Manual input (Action Lab)

In the app: **Action Lab** tab → choose an existing prospect *or* type a new
prospect name → set a **quantity** → click **Dialed Lead / Sent Quote / Closed
Policy**. Each click logs that many activities and awards EXP. Typed names are
kept verbatim; quantity is capped at 50 per click.

Under the hood it POSTs to the API:

```
POST /api/webhook
{ "leadId": "manual_acme_roofing", "eventType": "insurance/call",
  "contactInfo": { "displayName": "Acme Roofing" }, "count": 5 }
```

`count` (1–100) is also honored on the normal Zapier webhook.

## 2) Google Calendar → Zapier

The app exposes a calendar endpoint that classifies an event **by keywords in
the title** and logs the matching activity. No OAuth lives in the app — Google
Calendar connects through Zapier (matching the original Zapier-driven design).

**Endpoint**

```
POST /api/calendar/event
{ "title": "Discovery call with Bob Vance", "name": "Bob Vance", "count": 1 }
```

- `title` (required) is classified into an activity. `name` (optional) is the
  prospect; if omitted, the entity is extracted from the title
  (`"Send quote to Dunder Mifflin"` → `Dunder Mifflin`).
- Unmatched titles return `{ skipped: true }` (200) and log nothing.

**Title keyword → activity**

| Keywords in the event title | Logged as |
|---|---|
| close, closed, bind, bound, sold, won, signed, policy issued | Closed Policy (+100 EXP) |
| quote, proposal, estimate, pricing | Sent Quote (+30 EXP) |
| call, dial, phone, follow up, meeting, consult, appointment, intro | Dialed Lead (+30 EXP) |

(Most-specific first, so "close call" counts as a close. Edit `server/classify.js` to tune.)

**Zap setup**

1. **Trigger:** Google Calendar → *Event Start* (or *New Event Matching Search*).
   Tip: use a search term or a dedicated "Sales" calendar to avoid personal events.
2. **Action:** Webhooks by Zapier → *POST*
   - **URL:** `https://<your-vercel-domain>/api/calendar/event`
   - **Payload type:** JSON
   - **Data:** `title` → Event Title; `name` → an attendee/guest (optional)
3. Turn the Zap on. Matching events now log activities automatically.

> Requires the backend deployed with the Supabase env vars set (see
> `docs/PROGRESS.md` → Sprint 6). Locally, point the Zap at a tunnel (e.g. ngrok)
> to `http://localhost:3001`, or just use the Action Lab.

## 3) AgencyZoom → Zapier (real prospects + activities)

This is what makes the "Existing prospect" picker show your real book of business.

### a) Ingest prospects

```
POST /api/lead
{ "name": "Acme Roofing", "productLine": "commercial", "externalId": "AZ-12345" }
```

- Creates (or updates) a **New**-stage prospect — it appears in the pipeline and
  the Action Lab picker immediately, before any activity.
- `externalId` (the AgencyZoom lead id) is used to dedupe, so re-syncs update the
  same prospect. `productLine` (auto/home/umbrella/commercial/life) drives the icon.

**Zap:** Trigger *AgencyZoom → New Lead* → Action *Webhooks by Zapier → POST* to
`https://<your-vercel-domain>/api/lead`, mapping `name`, `productLine`, and the
AgencyZoom lead id → `externalId`.

### b) Log activities against those prospects

Point AgencyZoom activity triggers at `/api/webhook`, reusing the **same**
`externalId` so the activity lands on the right prospect:

```
POST /api/webhook
{ "leadId": "az_AZ-12345", "eventType": "insurance/quote",
  "contactInfo": { "displayName": "Acme Roofing" } }
```

| AgencyZoom trigger | eventType |
|---|---|
| Call / dial logged | `insurance/call` |
| Quote / proposal sent | `insurance/quote` |
| Policy bound / sold | `insurance/closed_policy` |

> `leadId` must be `az_` + the slugified `externalId` (lowercase, non-alphanumerics
> → `_`) so it matches the prospect created in (a). RingCentral call logs can use
> the same `/api/webhook` pattern.

## 4) Structured planner → quests + XP (MCP-driven)

The [Structured](https://structured.app) daily planner is the agent's to-do list.
Completing a task there should award XP in SalesDex. Structured is reached over
**MCP**, which lives in the Claude agent session — not in this server. So a poller
(a Claude loop or scheduled routine) pulls the tasks via MCP and POSTs a snapshot;
the server reconciles it into quests and XP.

```
   Structured  ──MCP──▶  Claude (poller)  ──HTTP──▶  /api/structured/sync
   (planner)             pull + transform           create quests, award XP
```

### Endpoint

```
POST /api/structured/sync
{ "tasks": [
    { "id": "<structured task id>", "title": "A List  David Dean",
      "start_time": 9.08, "completed": true,
      "completed_at": "2026-06-03T15:16:48Z" },
    ...
] }
→ { success, received, created, completed, xpAwarded, skipped }
```

Field notes: `start_time` is the Structured decimal hour (9.5 = 9:30); `completed`
is truthy when the task is done (a `completed_at` alone also counts). Only `id` and
`title` are required.

### Rules

- **Every task becomes a quest** (`state.tasks[id]`), shown in the **Quests** tab.
- **XP is awarded exactly once**, on the not-completed → completed edge. Re-POSTing
  the same snapshot is a no-op for already-awarded tasks (**idempotent** — safe to
  loop). XP is never clawed back if a task is later un-completed.
- A task whose title classifies as a pipeline activity earns the matching activity
  XP, feeds player stats + medals, **and creates/enriches a pipeline lead**
  attributed to the task's contact. Everything else earns a flat **20 EXP**.

**Structured title → activity** (layered on `server/classify.js` via
`classifyTask` in `server/structured.js`):

| Title pattern | Logged as |
|---|---|
| `A List <name>` (your call-sheet convention) | Dialed Lead (+30) → lead `<name>` |
| `Follow-up …` (even if it mentions a proposal) | Dialed Lead (+30) → lead `<name>` |
| else → shared keyword classifier (close > quote > call) | per keyword |
| no keyword match (habits, admin, personal) | flat quest (+20) |

Lead names are cleaned from the title: `A List David Dean` → `David Dean`,
`Call with Gordon re: Insurance` → `Gordon`, `Follow-up: David Dean — Proposal`
→ `David Dean`. The same person's tasks merge onto one `struct_<name>` lead.

### The sync loop (poller runbook)

Run hourly (≤ every 30 min) while you want live sync. Each tick:

1. **Pull** from Structured MCP: `get_today` (today's schedule) and `get_inbox`
   (unscheduled todos), in the user's timezone (`America/Chicago`).
2. **Transform** each task to `{ id, title, start_time, completed, completed_at }`.
   Skip recurring instances with a `null` id (no stable key).
3. **POST** the `{ tasks: [...] }` array to `…/api/structured/sync`.
4. Report `completed` / `xpAwarded` from the response.

Hourly is the recommended cadence (lighter on the system than 30 min and the sync
is idempotent, so nothing is missed between ticks).

> **MCP availability:** the Structured MCP connection is OAuth-bound to the live
> agent session. An **in-session Claude loop** always has it. A **headless/cron
> routine** may not — verify on the first scheduled run before relying on it.
>
> Target URL: local dev = `http://localhost:3001/api/structured/sync` (Vite proxy);
> production = `https://<your-vercel-domain>/api/structured/sync` (needs the
> Supabase env vars set so XP persists).

