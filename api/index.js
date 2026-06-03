/**
 * Vercel serverless entry point.
 *
 * The repo root package.json is `"type": "module"`, so THIS file is ESM and must
 * use import/export (not module.exports). The Express app lives in server/app.js,
 * which is CommonJS (server/package.json has no "type", i.e. commonjs) — importing
 * it here yields its module.exports (the Express app). Vercel invokes the default
 * export as the request handler, and vercel.json rewrites every /api/* request to
 * this function so the app's /api/* routes match.
 *
 * Required env vars in production (any one key name per row works — see db.js):
 *   SUPABASE_URL | NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY | SUPABASE_SECRET_KEY | SUPABASE_KEY  (server secret)
 *   AI_GATEWAY_API_KEY  (War Council AI; optional)
 */
import app from '../server/app.js';

export default app;
