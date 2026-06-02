/**
 * Vercel serverless entry point.
 *
 * Exports the Express app (server/app.js) as the handler. vercel.json rewrites
 * every /api/* request to this function, and the app's /api/* routes match the
 * original path. Required env vars in production:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (persistence)
 *   AI_GATEWAY_API_KEY                        (War Council AI; optional)
 */
module.exports = require('../server/app');
