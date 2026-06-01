# SalesDex — Setup Guide

Extended setup notes beyond the [README](../README.md).

## First-time checklist

- [ ] Node.js 18+ installed
- [ ] `npm install` in project root
- [ ] `npm install` in `server/`
- [ ] Copied `.env.example` → `.env`
- [ ] Copied `server/.env.example` → `server/.env`
- [ ] Copied `server/data.json.example` → `server/data.json`
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Action Lab triggers update Battle Log

## Troubleshooting

### "Cannot reach GameMaster server"

The React app cannot reach the API. Confirm:

1. `cd server && npm start` is running.
2. `VITE_API_URL` in `.env` matches the backend URL (default `http://localhost:3001`).
3. No firewall blocking localhost.

### Empty encounters after actions

Check `server/data.json` is writable. On first run, copy from `data.json.example`.

### Avatars not showing

Sprites live in `public/avatars/` as SVG files named `{character}_{skin}.svg`.

## Production considerations

| Topic | Recommendation |
|-------|----------------|
| State storage | Replace `data.json` with Postgres before multi-user production |
| CORS | Restrict `cors()` to your Vercel domain |
| HTTPS | Required for Zapier webhooks in production |
| Env vars | Never commit `.env`; use platform secret managers |

## GitHub repository setup

If you cloned without git history:

```bash
git init
git add .
git commit -m "Initial commit: SalesDex gamified sales MVP"
git branch -M main
gh repo create sales-hero --public --source=. --remote=origin --push
```

Or create the repo on GitHub manually, then:

```bash
git remote add origin https://github.com/YOUR_USER/sales-hero.git
git push -u origin main
```

## Vercel + API pairing

1. Deploy `server/` to Railway/Render (example).
2. Note the public API URL, e.g. `https://salesdex-api.onrender.com`.
3. In Vercel project settings → Environment Variables, set `VITE_API_URL` to that URL.
4. Redeploy the frontend so the build picks up the variable.
