const fs = require('fs');
const path = require('path');
const { syncPlayerProgression } = require('./xpEngine');

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultState = {
  player: {
    name: "Agent",
    character: "boy",
    skin: "default",
    totalXP: 0,
    level: 1,
    title: "Squire",
    rewards: [],
    badges: [],
    stats: {
      calls: 0,
      quotes: 0,
      policies: 0
    }
  },
  leads: {},
  globalEvents: ["Welcome to the Sales Crusade! Open Action Lab and log your first pipeline activity."]
};

function normalizePlayer(player) {
  return syncPlayerProgression({
    ...defaultState.player,
    ...player,
    stats: { ...defaultState.player.stats, ...player.stats },
    badges: player.badges ?? [],
    rewards: player.rewards ?? [],
  });
}

function readState() {
  if (!fs.existsSync(DATA_FILE)) {
    writeState(defaultState);
    return defaultState;
  }
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(data);
    if (!parsed.globalEvents) parsed.globalEvents = defaultState.globalEvents;
    parsed.player = normalizePlayer(parsed.player ?? defaultState.player);
    if (parsed.leads) {
      const { calculateLevel } = require('./xpEngine');
      for (const id of Object.keys(parsed.leads)) {
        parsed.leads[id].level = calculateLevel(parsed.leads[id].xp ?? 0);
      }
    }
    return parsed;
  } catch(e) {
    return defaultState;
  }
}

function writeState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function getLead(id) {
  const state = readState();
  return state.leads[id] || null;
}

function saveLead(id, leadData) {
  const state = readState();
  state.leads[id] = leadData;
  writeState(state);
}

function getPlayer() {
  const state = readState();
  return state.player;
}

function updatePlayer(playerData) {
  const state = readState();
  state.player = { ...state.player, ...playerData };
  writeState(state);
}

function addGlobalEvent(text) {
  const state = readState();
  state.globalEvents.unshift(text);
  if (state.globalEvents.length > 5) state.globalEvents.pop();
  writeState(state);
}

module.exports = {
  readState,
  writeState,
  getLead,
  saveLead,
  getPlayer,
  updatePlayer,
  addGlobalEvent
};
