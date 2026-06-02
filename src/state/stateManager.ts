/**
 * Type surface for salesState — implementation lives in stateManager.js
 * so the Vite app stays JS-first without a TypeScript build step.
 */

export interface SalesState {
  /** Monotonic counter; CrusaderSprite subscribes via useSalesState */
  closedDeal: number;
  lastEventType: string | null;
  lastEventAt: number | null;
}

export interface SalesStateAPI {
  getState: () => SalesState;
  subscribe: (listener: () => void) => () => void;
  patch: (patch: Partial<SalesState>) => void;
  triggerClosedDeal: () => void;
  recordEvent: (eventType: string) => void;
  reset: () => void;
}

export { salesState, stateManager } from './stateManager.js';
