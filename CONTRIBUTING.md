# Contributing to SalesDex

Thanks for helping make insurance sales more fun!

## Development workflow

1. Fork and clone the repo.
2. Follow [README.md](README.md) local setup (`npm install` in root and `server/`).
3. Create a branch: `git checkout -b feat/your-feature`.
4. Make focused changes; match existing React + CSS patterns.
5. Run checks before opening a PR:

```bash
npm run lint
npm run build
```

6. Start both servers and manually test Action Lab → Encounters → Battle Log flow.

## Code style

- Use functional React components and hooks.
- Prefer CSS classes in `src/index.css` over large inline style blocks.
- Keep API calls in `src/api/index.js`.
- Backend business logic belongs in `server/xpCalculator.js`, not routes.

## What not to commit

- `.env` files or API keys
- `server/data.json` (local game progress)
- `node_modules/` or `dist/`

## Pull requests

- Link related issues if any.
- Describe gameplay or UX changes with screenshots when possible.
- Update `docs/PRD.md` if you change core mechanics or XP values.

## Questions

Open a GitHub issue with the `question` label or refer to [docs/setup.md](docs/setup.md).
