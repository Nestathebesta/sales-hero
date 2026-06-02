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
const { readState, writeState, pushGlobalEvent } = require('./state');
const { generateBriefing, generateNextAction, generateDailyRecap } = require('./ai');
const { classifyEventTitle, deriveEntity, slug } = require('./classify');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Zapier / manual webhook endpoint. `count` (1..100) logs a batch in one go.
app.post('/api/webhook', async (req, res) => {
  try {
    const { leadId, eventType, contactInfo, count } = req.body || {};
    if (!leadId || !eventType) {
      return res.status(400).json({ error: 'Missing leadId or eventType' });
    }
    const result = await processEvent(leadId, eventType, contactInfo, count);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Webhook failed:', err.message);
    return res.status(500).json({ error: 'Failed to process event' });
  }
});

// Upsert a real prospect (e.g. AgencyZoom "New Lead" -> Zapier -> here).
// Creates a "New"-stage lead (no activity yet) so it shows in the pipeline/picker.
app.post('/api/lead', async (req, res) => {
  try {
    const { name, productLine, externalId, source } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Missing name' });

    const state = await readState();
    const id = externalId
      ? `az_${slug(String(externalId))}`
      : `lead_${slug(String(name))}`;
    const existing = state.leads[id];
    state.leads[id] = {
      id,
      name: String(name).trim().slice(0, 60),
      xp: existing?.xp ?? 0,
      level: existing?.level ?? 1,
      events: existing?.events ?? [],
      type: 'Prospect',
      productLine: (productLine && String(productLine).toLowerCase()) || existing?.productLine || null,
      source: source || existing?.source || 'agencyzoom',
    };
    if (!existing) {
      pushGlobalEvent(state, `New prospect ${state.leads[id].name} entered the pipeline!`);
    }
    await writeState(state);
    res.json({ success: true, lead: state.leads[id], created: !existing });
  } catch (err) {
    console.error('Lead upsert failed:', err.message);
    res.status(500).json({ error: 'Failed to upsert lead' });
  }
});

// Google Calendar -> Zapier -> here. Classifies the event title into an activity
// (call/quote/close) by keyword and logs it. Unmatched titles are skipped (200).
app.post('/api/calendar/event', async (req, res) => {
  try {
    const { title, name, count } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Missing title' });

    const eventType = classifyEventTitle(title);
    if (!eventType) {
      return res.json({ success: true, skipped: true, reason: 'no_keyword_match', title });
    }

    const leadName = (name && String(name).trim()) || deriveEntity(title);
    const leadId = `cal_${slug(leadName)}`;
    const result = await processEvent(leadId, eventType, { displayName: leadName }, count);
    return res.json({ success: true, classifiedAs: eventType, ...result });
  } catch (err) {
    console.error('Calendar event failed:', err.message);
    return res.status(500).json({ error: 'Failed to process calendar event' });
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

// AI next-best-action for a single prospect
app.get('/api/ai/next-action', async (req, res) => {
  try {
    const leadId = req.query.leadId;
    if (!leadId) return res.status(400).json({ error: 'Missing leadId' });
    const result = await generateNextAction(leadId);
    res.json(result);
  } catch (err) {
    console.error('Next-action failed:', err.message);
    res.status(500).json({ error: 'Advice unavailable' });
  }
});

// AI end-of-day recap
app.get('/api/ai/recap', async (req, res) => {
  try {
    const result = await generateDailyRecap();
    res.json(result);
  } catch (err) {
    console.error('Recap failed:', err.message);
    res.status(500).json({ error: 'Recap unavailable' });
  }
});

module.exports = app;
