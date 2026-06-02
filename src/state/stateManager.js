/**
 * Central sales / game event bus for UI animations and trackers.
 * Mirrors the architecture expected by stateManager.ts consumers.
 */

const defaultState = {
  /** Increments on each closed policy — CrusaderSprite listens for changes */
  closedDeal: 0,
  lastEventType: null,
  lastEventAt: null,
};

let state = { ...defaultState };
/** @type {Set<() => void>} */
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export const salesState = {
  getState() {
    return state;
  },

  /**
   * @param {() => void} listener
   * @returns {() => void} unsubscribe
   */
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * @param {Partial<typeof defaultState>} patch
   */
  patch(patch) {
    state = { ...state, ...patch };
    notify();
  },

  /** Fire after insurance/closed_policy webhook succeeds */
  triggerClosedDeal() {
    state = {
      ...state,
      closedDeal: state.closedDeal + 1,
      lastEventType: 'insurance/closed_policy',
      lastEventAt: Date.now(),
    };
    notify();
  },

  /** Victory strike — the crusader swings on a level-up / rank-up. */
  celebrate() {
    state = {
      ...state,
      closedDeal: state.closedDeal + 1,
      lastEventType: 'level_up',
      lastEventAt: Date.now(),
    };
    notify();
  },

  /**
   * @param {string} eventType
   */
  recordEvent(eventType) {
    state = {
      ...state,
      lastEventType: eventType,
      lastEventAt: Date.now(),
    };
    notify();
  },

  reset() {
    state = { ...defaultState };
    notify();
  },
};

/** @deprecated Use salesState — alias for imports expecting stateManager export */
export const stateManager = salesState;
