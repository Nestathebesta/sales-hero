/**
 * Express app for the SalesDex GameMaster API.
 *
 * Routes live under /api so the same app works in two places:
 *   - locally:   server/index.js calls app.listen() (vite dev proxies /api here)
 *   - on Vercel: api/index.js exports this app as a serverless function
 *                (vercel.json rewrites /api/* to it)
 */
// Load server/.env locally (no-op in serverless, where env comes from the host).
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { processEvent } = require('./xpCalculator');
const { readState, writeState } = require('./state');
const { generateBriefing } = require('./ai');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Zapier webhook endpoint
app.post('/api/webhook', async (req, res) => {
  try {
    const { leadId, eventType, contactInfo } = req.body || {};
    if (!leadId || !eventType) {
      return res.status(400).json({ error: 'Missing leadId or eventType' });
    }
    const result = await processEvent(leadId, eventType, contactInfo);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Webhook failed:', err.message);
    return res.status(500).json({ error: 'Failed to process event' });
  }
});

app.get('/api/state', async (req, res) => {
  try {
    const state = await readState();
    res.json(state);
  } catch (err) {
    console.error('State load failed:', err.message);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

// Customize the crusader's character / skin
app.post('/api/player/customize', async (req, res) => {
  try {
    const { character, skin } = req.body || {};
    const state = await readState();
    if (character) state.player.character = character;
    if (skin) state.player.skin = skin;
    await writeState(state);
    res.json({ success: true, player: state.player });
  } catch (err) {
    console.error('Customize failed:', err.message);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// War Council — AI coaching briefing (key stays server-side; falls back gracefully)
app.get('/api/ai/briefing', async (req, res) => {
  try {
    const result = await generateBriefing();
    res.json(result);
  } catch (err) {
    console.error('Briefing failed:', err.message);
    res.status(500).json({ error: 'Briefing unavailable' });
  }
});

module.exports = app;
