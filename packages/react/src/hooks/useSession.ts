/**
 * useSession Hook
 *
 * Provides access to the complete session state from SessionManager,
 * including all active chain sessions, the active chain ID, and
 * connection status.
 *
 * @see SRS-009 §7.2
 */

import { useSyncExternalStore, useCallback } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import type { ChainSession, ActiveSessionBundle } from "@naculus/connect-core";

export interface UseSessionReturn {
  /** The raw wallet session (from the active bundle) */
  session: ActiveSessionBundle["walletSession"] | null;
  /** All chain sessions within the active bundle */
  chainSessions: ChainSession[];
  /** The currently active chain ID */
  activeChainId: string | null;
  /** Whether a wallet is connected */
  isConnected: boolean;
  /** The connector/wallet type (e.g., "eip6963", "walletconnect") */
  connectorId: string | null;
}

function subscribeToSessionManager(
  sm: import("@naculus/connect-core").SessionManager | null,
  callback: () => void,
): () => void {
  if (!sm) return () => {};

  const handler = () => callback();
  sm.on("sessionConnected", handler);
  sm.on("sessionDisconnected", handler);
  sm.on("chainChanged", handler);

  return () => {
    sm.off("sessionConnected", handler);
    sm.off("sessionDisconnected", handler);
    sm.off("chainChanged", handler);
  };
}

function getSessionSnapshot(
  sm: import("@naculus/connect-core").SessionManager | null,
): UseSessionReturn {
  if (!sm) {
    return {
      session: null,
      chainSessions: [],
      activeChainId: null,
      isConnected: false,
      connectorId: null,
    };
  }

  const bundle = sm.getActiveBundle();
  if (!bundle) {
    return {
      session: null,
      chainSessions: [],
      activeChainId: null,
      isConnected: false,
      connectorId: null,
    };
  }

  return {
    session: bundle.walletSession,
    chainSessions: Array.from(bundle.chainSessions.values()),
    activeChainId: bundle.activeChainId,
    isConnected: true,
    connectorId: bundle.walletSession.walletType,
  };
}

export function useSession(
  sessionManager?: import("@naculus/connect-core").SessionManager | null,
): UseSessionReturn {
  const web3 = useWeb3();
  const sm = sessionManager ?? web3.sessionManager ?? null;

  const subscribe = useCallback(
    (callback: () => void) => subscribeToSessionManager(sm, callback),
    [sm],
  );

  const getSnapshot = useCallback(
    () => getSessionSnapshot(sm),
    [sm],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
