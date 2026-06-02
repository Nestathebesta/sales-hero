/**
 * Campaign medals — server-side award definitions.
 * KEEP IN SYNC with the MEDALS array in shared/xp.js (the frontend display copy).
 * (The server is CommonJS and can't import the ESM shared module directly.)
 */
const MEDALS = [
  { name: 'First Dial', stat: 'calls', target: 1, xp: 50 },
  { name: 'Dialer Badge', stat: 'calls', target: 25, xp: 150 },
  { name: 'Centurion', stat: 'calls', target: 100, xp: 400 },
  { name: 'First Quote', stat: 'quotes', target: 1, xp: 50 },
  { name: 'Quote Master', stat: 'quotes', target: 10, xp: 300 },
  { name: 'Quote Sniper', stat: 'quotes', target: 50, xp: 600 },
  { name: 'Closer Badge', stat: 'policies', target: 1, xp: 500 },
  { name: 'Rainmaker', stat: 'policies', target: 10, xp: 1000 },
  { name: 'Conqueror', stat: 'policies', target: 50, xp: 2500 },
];

module.exports = { MEDALS };
