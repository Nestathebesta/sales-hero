/**
 * Local entry point — starts the GameMaster API for development.
 * (In production the same app is served as a Vercel serverless function; see
 *  api/index.js.) Routes are defined in server/app.js under /api.
 */
const app = require('./app');
const { startStructuredPoller } = require('./structuredPoller');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SalesDex GameMaster API running on http://localhost:${PORT} (routes under /api)`);
  // App-native Structured planner sync (no-op until STRUCTURED_MCP_URL is set).
  startStructuredPoller();
});
