const { loadRaw, saveRaw } = require('./db');
const { syncPlayerProgression, calculateLevel } = require('./xpEngine');

const defaultState = {
  player: {
    name: 'Nesta',
    character: 'boy',
    skin: 'default',
    totalXP: 0,
    level: 1,
    title: 'Peon',
    rewards: [],
    badges: [],
    stats: { calls: 0, quotes: 0, policies: 0 },
  },
  leads: {},
  // Structured planner tasks ingested as quests, keyed by Structured task id.
  tasks: {},
  globalEvents: ['Welcome to the Sales Crusade! Open Action Lab and log your first pipeline activity.'],
};

/** Re-derive computed fields (player level/title/rewards, lead levels). */
function normalize(state) {
  const s = state && typeof state === 'object' ? state : {};
  s.globalEvents = Array.isArray(s.globalEvents) ? s.globalEvents : defaultState.globalEvents.slice();
  s.leads = s.leads && typeof s.leads === 'object' ? s.leads : {};
  s.tasks = s.tasks && typeof s.tasks === 'object' ? s.tasks : {};
  s.player = syncPlayerProgression({
    ...defaultState.player,
    ...(s.player || {}),
    stats: { ...defaultState.player.stats, ...(s.player?.stats || {}) },
    badges: s.player?.badges ?? [],
    rewards: s.player?.rewards ?? [],
  });
  for (const id of Object.keys(s.leads)) {
    s.leads[id].level = calculateLevel(s.leads[id].xp ?? 0);
  }
  return s;
}

/** Load + normalize the full game state (async — Supabase or file). */
async function readState() {
  const raw = await loadRaw(defaultState);
  return normalize(raw);
}

/** Persist the full game state. */
async function writeState(state) {
  await saveRaw(state);
}

/** Mutate the in-memory state's rolling event log (newest first, capped at 5). */
function pushGlobalEvent(state, text) {
  state.globalEvents.unshift(text);
  if (state.globalEvents.length > 5) state.globalEvents.pop();
}

module.exports = {
  readState,
  writeState,
  pushGlobalEvent,
  defaultState,
};
