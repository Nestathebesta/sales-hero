/**
 * index.js (Backend Entry Point)
 * 
 * Express server that acts as the "GameMaster" for LeadHero.
 * Exposes a /webhook route to receive events from Zapier.
 * Exposes /state and /player/customize routes for the React frontend.
 */
const express = require('express');
const cors = require('cors');
const { processEvent } = require('./xpCalculator');
const { readState, updatePlayer } = require('./state');

const app = express();
app.use(cors());
app.use(express.json());

// Zapier Webhook Endpoint
app.post('/webhook', (req, res) => {
  const { leadId, eventType, contactInfo } = req.body;
  if (!leadId || !eventType) {
    return res.status(400).json({ error: 'Missing leadId or eventType' });
  }

  const result = processEvent(leadId, eventType, contactInfo);
  res.json({ success: true, ...result });
});

app.get('/state', (req, res) => {
  const state = readState();
  res.json(state);
});

// Endpoint to customize character
app.post('/player/customize', (req, res) => {
  const { character, skin } = req.body;
  const player = readState().player;
  
  player.character = character || player.character;
  player.skin = skin || player.skin;
  
  updatePlayer(player);
  res.json({ success: true, player });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SalesDex GameMaster API running on port ${PORT}`);
});
