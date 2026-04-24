import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/**
 * RefreshBus — a lightweight pub/sub for "the user just pulled to refresh this dashboard".
 *
 * The provider exposes a numeric `token` that increments on every refresh.
 * Children subscribe by reading the token in a useEffect dependency array.
 *
 * We keep this in-memory only (no realtime / no global store) because pull-to-refresh
 * is inherently a UI-local interaction.
 */
type RefreshBusValue = {
  token: number;
  trigger: () => void;
};

const RefreshBusContext = createContext<RefreshBusValue | null>(null);

export const RefreshBusProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(0);
  const trigger = useCallback(() => setToken((t) => t + 1), []);
  return (
    <RefreshBusContext.Provider value={{ token, trigger }}>
      {children}
    </RefreshBusContext.Provider>
  );
};

/**
 * useRefreshToken — returns the current refresh token. Add it to a useEffect dep array
 * to re-run a fetch whenever the user pulls to refresh.
 *
 * Returns 0 outside a provider (safe no-op).
 */
export const useRefreshToken = (): number => {
  return useContext(RefreshBusContext)?.token ?? 0;
};

/**
 * useTriggerRefresh — imperatively trigger a refresh (used by the pull-to-refresh gesture).
 */
export const useTriggerRefresh = (): (() => void) => {
  return useContext(RefreshBusContext)?.trigger ?? (() => {});
};
