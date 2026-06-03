/**
 * Persistence backend for the game state.
 *
 * Uses Supabase (a single `game_state` jsonb row) when SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set — required in serverless/production where
 * there is no writable filesystem. Otherwise falls back to a local data.json
 * file so local development works with zero configuration.
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const ROW_ID = 'singleton';

// Accept either the classic env names or the ones provisioned by the
// Supabase↔Vercel integration / newer key scheme. MUST be a server-side secret
// key (service_role or sb_secret_…) — it bypasses RLS. Never use a publishable/
// anon key here (RLS would block the single-row read/write).
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY;
const useSupabase = Boolean(SUPABASE_URL && SERVICE_KEY);

let supabase = null;
if (useSupabase) {
  // eslint-disable-next-line global-require
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Load the whole state blob. Seeds `defaultState` if nothing is stored yet. */
async function loadRaw(defaultState) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from('game_state')
      .select('data')
      .eq('id', ROW_ID)
      .maybeSingle();
    if (error) throw new Error(`Supabase load failed: ${error.message}`);
    if (!data) {
      await saveRaw(defaultState);
      return defaultState;
    }
    return data.data;
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), 'utf8');
    return defaultState;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

/** Persist the whole state blob. */
async function saveRaw(state) {
  if (useSupabase) {
    const { error } = await supabase
      .from('game_state')
      .upsert({ id: ROW_ID, data: state, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Supabase save failed: ${error.message}`);
    return;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

module.exports = { loadRaw, saveRaw, useSupabase };
