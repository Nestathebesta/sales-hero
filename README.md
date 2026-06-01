# SalesDex

**Level up your production.** — A gamified sales progression app for P&C insurance agents. Log calls, send quotes, and close policies to earn XP, rank up in the Sales Guild, unlock agent appearances, and collect guild medals—all wrapped in a retro RPG interface.

![Stack](https://img.shields.io/badge/React-19-61DAFB) ![Vite](https://img.shields.io/badge/Vite-8-646CFF) ![Express](https://img.shields.io/badge/Express-5-000000)

## How to Play

1. **Start both servers** (see [Local setup](#local-setup) below).
2. Open the app at `http://localhost:5173`.
3. Read the **Activity Feed** at the top—it narrates your sales journey.
4. Open the **Action Lab** tab, pick a prospect, and trigger an action:
   - **Dialed Lead** (+30 EXP) — simulates a RingCentral call
   - **Sent Quote** (+30 EXP) — simulates AgencyZoom quote
   - **Closed Policy** (+100 EXP) — simulates a closed policy
5. Switch to **Pipeline** to see prospects level up as you work them.
6. Watch your **Guild Agent Card** XP bar and unlock new ranks at levels 2–4.
7. Earn **Guild Medals**: Dialer Badge (25 calls), Quote Master (10 quotes), Closer Badge (1 policy).

## Features

| Feature | Description |
|---------|-------------|
| P&C XP Engine | 30 XP calls/quotes, 100 XP closed policies |
| Agent leveling | Levels 1–6 based on total XP |
| Lead pipeline | Each prospect has its own XP and level |
| Activity feed | Typewriter-style feed for recent events |
| Rank unlocks | Rookie through Guild Elite appearances at higher levels |
| Zapier-ready API | `POST /webhook` for real automation (simulator included) |

## Architecture

```
┌──────────────────┐     POST /webhook      ┌─────────────────┐
│  Zapier / Action │ ─────────────────────► │ Express API     │
│  Lab (frontend)  │                        │ server/         │
└──────────────────┘                        │ data.json state │
┌──────────────────┐     GET /state         └────────┬────────┘
│  Vite + React    │ ◄────────────────────────────────┘
│  src/            │
└──────────────────┘
```

See [docs/PRD.md](docs/PRD.md) for the full product requirements document.

## Local Setup

### Prerequisites

- Node.js 18+
- npm

### 1. Install dependencies

```bash
npm install
cd server && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
cp server/.env.example server/.env
cp server/data.json.example server/data.json
```

| Variable | Location | Default | Purpose |
|----------|----------|---------|---------|
| `VITE_API_URL` | `.env` | `http://localhost:3001` | Backend URL for the React app |
| `PORT` | `server/.env` | `3001` | Express server port |

### 3. Start the backend

```bash
cd server
npm start
```

API runs at **http://localhost:3001**.

### 4. Start the frontend

From the project root:

```bash
npm run dev
```

App runs at **http://localhost:5173**.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Zapier Webhook

Point your Zapier Webhook action to:

```
POST https://YOUR-API-HOST/webhook
```

**JSON body:**

```json
{
  "leadId": "unique_lead_id_123",
  "eventType": "insurance/quote",
  "contactInfo": {
    "firstName": "John",
    "lastName": "Smith"
  }
}
```

**Supported `eventType` values:** `insurance/call`, `insurance/quote`, `insurance/closed_policy`.

## Deploy on Vercel

SalesDex is a **split deployment**: static frontend on Vercel, Node API on a separate host.

### Frontend (Vercel)

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable:
   - `VITE_API_URL` = `https://your-api-host.example.com` (no trailing slash)
7. Deploy.

`vercel.json` is included for SPA routing.

### Backend (Railway, Render, Fly.io, etc.)

1. Deploy the `server/` folder as a Node service.
2. Set `PORT` from the platform (usually injected automatically).
3. Use a **persistent volume** or external DB if you need durable `data.json` across restarts.
4. Enable CORS for your Vercel domain (update `server/index.js` for production).
5. Point `VITE_API_URL` on Vercel to this API URL.

> **Note:** File-based `data.json` does not persist on ephemeral serverless instances. For production, plan a database migration (see [docs/PRD.md](docs/PRD.md)).

## Project Structure

```
sales-hero/
├── docs/
│   ├── PRD.md           # Product requirements
│   └── setup.md         # Extended setup notes
├── public/avatars/      # Pixel SVG agent sprites
├── server/              # Express GameMaster API
├── src/
│   ├── App.jsx
│   ├── api/index.js
│   └── components/
├── vercel.json
└── .env.example
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

ISC (see package.json files).
