/**
 * Structured planner -> SalesDex quest sync.
 *
 * The Structured daily planner is reached over MCP, which lives in the agent
 * session (not in this server process). A poller (Claude loop or scheduled
 * routine) pulls the user's tasks via MCP and POSTs a snapshot to
 * /api/structured/sync; this module reconciles that snapshot into the game.
 *
 * Rules (see docs/integrations.md):
 *  - Every Structured task becomes a quest (state.tasks[id]).
 *  - Completion is the trigger for XP, and is awarded EXACTLY ONCE per task
 *    (idempotent: re-syncing the same completed task never double-awards).
 *  - A task whose title classifies as a pipeline activity (call/quote/close)
 *    runs through the normal XP engine: it feeds player stats + medals AND
 *    creates/enriches a pipeline lead attributed to the task's contact.
 *  - Any other completed task earns a flat FLAT_TASK_XP (no stat/medal effect).
 */
const { applyEvent } = require('./xpCalculator');
const { classifyEventTitle, deriveEntity, slug } = require('./classify');
const { syncPlayerProgression } = require('./xpEngine');
const { pushGlobalEvent } = require('./state');

// Flat reward for completing a non-sales task (habits, admin, personal todos).
const FLAT_TASK_XP = 20;

/**
 * Classify a Structured task into a pipeline activity. Layers two planner-
 * specific conventions on top of the shared keyword classifier:
 *  - "A List <name>" is a call-sheet prospect (notes say "FOLLOW-UP CALL").
 *  - "Follow-up …" is a follow-up CALL even when the title mentions a proposal
 *    (the shared classifier would otherwise score "proposal" as a quote).
 * Falls back to classifyEventTitle (close > quote > call) for everything else.
 */
function classifyTask(title = '') {
  const t = String(title).toLowerCase();
  if (/\ba[\s-]*list\b/.test(t)) return 'insurance/call';
  if (/\bfollow[\s-]?up\b/.test(t)) return 'insurance/call';
  return classifyEventTitle(title);
}

// Title prefixes Structured/CRM bolt on that aren't part of the person's name.
const NAME_PREFIXES = [/^a[\s-]*list\s+/i, /^call\s+/i, /^follow[\s-]*up:?\s*/i];

/** Best-effort contact name from a task title for lead attribution. */
function taskLeadName(title = '') {
  let t = String(title).trim();
  for (const re of NAME_PREFIXES) t = t.replace(re, '');
  // "Call with Gordon …" -> "Gordon …": drop a leading connector left behind.
  t = t.replace(/^(with|w\/|to|for)\s+/i, '');
  // Cut trailing qualifiers: " — Insurance Proposal", " re: Insurance".
  t = t.split(/\s+[–—-]\s+/)[0];
  t = t.split(/\s+re:?\s+/i)[0];
  t = t.trim();
  if (!t) t = deriveEntity(title);
  return t.slice(0, 48) || 'Structured Lead';
}

function nowISO() {
  return new Date().toISOString();
}

/**
 * Reconcile an incoming snapshot of Structured tasks into `state` (mutates it
 * in memory — caller persists via writeState). Returns a summary for the API.
 *
 * @param {object} state  loaded game state (already normalized)
 * @param {Array}  incoming  [{ id, title, note, day, start_time|startTime,
 *                              symbol, completed, completed_at|completedAt }]
 */
function syncStructuredTasks(state, incoming = []) {
  if (!state.tasks || typeof state.tasks !== 'object') state.tasks = {};
  const list = Array.isArray(incoming) ? incoming : [];
  const summary = { received: list.length, created: 0, completed: 0, xpAwarded: 0, skipped: 0 };

  for (const raw of list) {
    if (!raw || raw.id == null) {
      summary.skipped += 1;
      continue;
    }
    const id = String(raw.id);
    const title = String(raw.title || 'Untitled task').slice(0, 120);
    const day = raw.day ?? null;
    const startTime = raw.start_time ?? raw.startTime ?? null;
    const symbol = raw.symbol ?? null;
    const completed = Boolean(raw.completed ?? raw.completed_at ?? raw.completedAt);
    const completedAt = raw.completed_at ?? raw.completedAt ?? null;
    const eventType = classifyTask(title);

    let task = state.tasks[id];
    if (!task) {
      task = {
        id,
        title,
        day,
        startTime,
        symbol,
        source: 'structured',
        eventType, // call/quote/close classification, or null
        completed: false,
        completedAt: null,
        awardedXP: 0,
        leadId: null,
        ingestedAt: nowISO(),
      };
      state.tasks[id] = task;
      summary.created += 1;
      pushGlobalEvent(state, `New quest from Structured: ${title}`);
    } else {
      // Keep light, non-award fields fresh on every sync (titles get edited).
      task.title = title;
      task.day = day;
      task.startTime = startTime;
      task.symbol = symbol;
      task.eventType = eventType;
    }

    // Completion is the one-way XP trigger. Award only on the false->true edge.
    if (completed && !task.completed) {
      let earned = 0;
      if (eventType) {
        const leadName = taskLeadName(title);
        const leadId = `struct_${slug(leadName)}`;
        const result = applyEvent(state, leadId, eventType, { displayName: leadName }, 1);
        earned = result.earnedXP;
        task.leadId = leadId;
      } else {
        earned = FLAT_TASK_XP;
        state.player.totalXP += earned;
        Object.assign(state.player, syncPlayerProgression(state.player));
        pushGlobalEvent(state, `${state.player.name} completed "${title}" (+${earned} EXP)`);
      }
      task.completed = true;
      task.completedAt = completedAt || nowISO();
      task.awardedXP = earned;
      summary.completed += 1;
      summary.xpAwarded += earned;
    }
  }

  return summary;
}

module.exports = { syncStructuredTasks, taskLeadName, FLAT_TASK_XP };
