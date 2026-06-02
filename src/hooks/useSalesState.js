import { useSyncExternalStore } from 'react';
import { salesState } from '../state/stateManager';

/**
 * Subscribe to salesState with minimal re-renders (flash-tracker friendly).
 * @template T
 * @param {(state: ReturnType<typeof salesState.getState>) => T} [selector]
 */
export function useSalesState(selector = (s) => s) {
  return useSyncExternalStore(
    salesState.subscribe,
    () => selector(salesState.getState()),
    () => selector(salesState.getState())
  );
}
