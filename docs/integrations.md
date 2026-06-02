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

