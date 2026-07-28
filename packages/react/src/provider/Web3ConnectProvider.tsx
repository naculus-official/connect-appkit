"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from "react";
import type { UniversalWalletSession } from "@naculus/connect-core";
import type { Web3State, Web3Actions, Web3ConnectConfig, ConnectionStatus, WalletChain } from "../types";
import { createClient } from "../client";
import { eip6963Connector } from "@naculus/connector-evm-injected";
import {
  LocalStorageSessionStorage,
  WalletError,
  logger,
  SessionManager,
  createSessionManager,
  ConnectorManager,
  createConnectorManager,
} from "@naculus/connect-core";
import type { PocketConnectorClass as EmbeddedWalletConnectorClass } from "@naculus/connector-embedded";
import { getDefaultChains } from "../utils/chains";

// ── Timeout Helper ────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string = "Operation"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ── Retry Helper ──────────────────────────────────────────────────

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  label?: string;
}

async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < options.maxRetries) {
        const delay = options.baseDelay * (2 ** attempt);
        logger.warn("react/provider", `Retry attempt ${attempt + 1}/${options.maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

type Web3Action =
  | { type: "SET_STATUS"; payload: ConnectionStatus }
  | { type: "SET_SESSION"; payload: Web3State["session"] }
  | { type: "SET_ACCOUNTS"; payload: string[] }
  | { type: "SET_CHAIN"; payload: string | null }
  | { type: "SET_ERROR"; payload: Error | null }
  | { type: "RESET" };

export interface Web3ContextValue extends Web3State, Web3Actions {
  isConnected: boolean;
  chains: WalletChain[];
  /** SessionManager instance for multi-chain session management */
  sessionManager: SessionManager | null;
}

const initialState: Web3State = {
  status: "disconnected",
  session: null,
  accounts: [],
  chainId: null,
  error: null
};

function web3Reducer(state: Web3State, action: Web3Action): Web3State {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "SET_SESSION":
      return { ...state, session: action.payload };
    case "SET_ACCOUNTS":
      return { ...state, accounts: action.payload };
    case "SET_CHAIN":
      return { ...state, chainId: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export const Web3Context = createContext<Web3ContextValue | null>(null);

export interface Web3ConnectProviderProps {
  children: React.ReactNode;
  config: Web3ConnectConfig;
  autoConnect?: boolean;
}

export function Web3ConnectProvider({
  children,
  config,
  autoConnect = true
}: Web3ConnectProviderProps) {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  const chains = useMemo(() => config.chains ?? getDefaultChains(), [config.chains]);

  const connectionTimeout = config.connectionTimeout ?? 30000;
  const maxRetries = config.maxRetries ?? 2;

  const storage = useMemo(
    () => new LocalStorageSessionStorage(config.storageKey ?? "naculus_web3_session"),
    [config.storageKey]
  );

  const client = useMemo(() => {
    return createClient({
      projectId: config.projectId,
      metadata: config.metadata,
      enableEmbedded: config.enableEmbedded,
      enablePasskeys: config.enablePasskeys,
      enableSolana: config.enableSolana,
      solanaDefaultChain: config.solanaDefaultChain,
    });
  }, [config.projectId, config.metadata, config.enableEmbedded, config.enablePasskeys, config.enableSolana, config.solanaDefaultChain]);

  // ── SessionManager ───────────────────────────────────────────────

  const sessionManagerRef = useRef<SessionManager | null>(null);

  const sessionManager = useMemo(() => {
    // Build a connector manager that shares the client's connectors
    const cm = createConnectorManager();
    cm.register(client.connector.id, client.connector);

    // Build default RPC/currency configs from the configured chains
    const defaultRpcUrls: Record<string, string> = {};
    const defaultCurrencies: Record<string, { name: string; symbol: string; decimals: number }> = {};

    for (const chain of chains) {
      const caip2Id = `${chain.namespace}:${chain.id}`;
      if (chain.rpcUrl) {
        defaultRpcUrls[caip2Id] = chain.rpcUrl;
      }
      if (chain.token) {
        defaultCurrencies[caip2Id] = {
          name: chain.name,
          symbol: chain.token,
          decimals: 18,
        };
      }
    }

    const sm = createSessionManager(cm, {
      autoRefreshFeeOnSwitch: true,
      defaultRpcUrls,
      defaultCurrencies,
      encryptionKey: config.encryptionKey,
    });

    sessionManagerRef.current = sm;
    return sm;
  }, [client, chains]);

  // Sync SessionManager events to provider state
  useEffect(() => {
    const onConnected = (payload: { bundle: any }) => {
      const { walletSession } = payload.bundle;
      dispatch({ type: "SET_SESSION", payload: walletSession });

      const accounts: string[] = [];
      Object.values(walletSession.namespaces).forEach((ns: any) => {
        accounts.push(...ns.accounts);
      });
      dispatch({ type: "SET_ACCOUNTS", payload: accounts });
      dispatch({ type: "SET_CHAIN", payload: payload.bundle.activeChainId });
      dispatch({ type: "SET_STATUS", payload: "connected" });
    };

    const onDisconnected = () => {
      dispatch({ type: "RESET" });
    };

    const onChainChanged = (payload: { newChainId: string }) => {
      dispatch({ type: "SET_CHAIN", payload: payload.newChainId });
    };

    sessionManager.on("sessionConnected", onConnected);
    sessionManager.on("sessionDisconnected", onDisconnected);
    sessionManager.on("chainChanged", onChainChanged);

    return () => {
      sessionManager.off("sessionConnected", onConnected);
      sessionManager.off("sessionDisconnected", onDisconnected);
      sessionManager.off("chainChanged", onChainChanged);
    };
  }, [sessionManager]);

  useEffect(() => {
    const handler = () => {
      storage.clear();
      dispatch({ type: "RESET" });
    };
    client.connector.onSessionExpiry(handler);
  }, [client, storage]);

  const updateStateFromSession = useCallback((session: typeof state.session) => {
    dispatch({ type: "SET_SESSION", payload: session });

    if (session) {
      const accounts: string[] = [];
      Object.values(session.namespaces).forEach((ns) => {
        accounts.push(...ns.accounts);
      });
      dispatch({ type: "SET_ACCOUNTS", payload: accounts });

      const evmChain = session.namespaces["eip155"]?.chains?.[0];
      const solChain = session.namespaces["solana"]?.chains?.[0];
      const xrplChain = session.namespaces["xrpl"]?.chains?.[0];
      dispatch({ type: "SET_CHAIN", payload: evmChain ?? solChain ?? xrplChain ?? null });
    } else {
      dispatch({ type: "SET_ACCOUNTS", payload: [] });
      dispatch({ type: "SET_CHAIN", payload: null });
    }
  }, []);

  // ── SIWx post-connection helper ──────────────────────────────────
  // Run after any connect method succeeds.  Returns false if SIWx is
  // configured, required, and failed — the caller should abort without
  // setting status to "connected".
  const runSiwx = useCallback(async (session: UniversalWalletSession | null): Promise<boolean> => {
    if (!config.siwx || !session) return true;

    dispatch({ type: "SET_STATUS", payload: "authenticating" });

    try {
      const firstEvm = session.namespaces["eip155"]?.accounts?.[0];
      const firstSol = session.namespaces["solana"]?.accounts?.[0];
      const rawAddress = firstEvm ?? firstSol;
      if (!rawAddress) throw new WalletError("siwx_error", "No account found in session");

      const chainId = firstEvm
        ? session.namespaces["eip155"].chains?.[0] ?? "eip155:1"
        : session.namespaces["solana"].chains?.[0] ?? "solana:0";

      const address = rawAddress.includes(":") ? rawAddress.split(":").pop()! : rawAddress;

      const message = await config.siwx.createMessage({ address, chainId });
      const signature = (await client.signMessage(session, {
        message,
        address,
        chainId,
      })) as string;

      if (config.siwx.handleSignComplete) {
        await config.siwx.handleSignComplete({ message, signature });
      }

      return true;
    } catch (siwxError) {
      logger.error("react/provider", "SIWx authentication failed:", siwxError);

      if (config.siwx.required !== false) {
        await storage.clear();
        dispatch({ type: "RESET" });
        dispatch({
          type: "SET_ERROR",
          payload: siwxError instanceof Error ? siwxError : new Error("Wallet authentication failed"),
        });
        return false;
      }

      return true;
    }
  }, [config.siwx, client, storage]);

  const connect = useCallback(async (): Promise<void> => {
    dispatch({ type: "SET_STATUS", payload: "connecting" });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const session = await withTimeout(
        client.connect(),
        connectionTimeout,
        "Wallet connect"
      );
      await storage.save(session);
      updateStateFromSession(session);

      // Feed the session into SessionManager
      try {
        const sm = sessionManagerRef.current;
        if (sm && session.walletType) {
          const evmChain = session.namespaces["eip155"]?.chains?.[0];
          const chainId = evmChain ?? "eip155:1";
          // Trigger SessionManager to build bundle from this session
          sm.connect(session.walletType, chainId);
        }
      } catch (smError) {
        logger.warn("react/provider", "SessionManager sync error:", smError);
      }

      if (!await runSiwx(session)) return;
      dispatch({ type: "SET_STATUS", payload: "connected" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error : new Error(message) });
      dispatch({ type: "SET_STATUS", payload: "disconnected" });
    }
  }, [client, storage, updateStateFromSession, connectionTimeout, runSiwx]);

  const connectEmbedded = useCallback(async (): Promise<void> => {
    dispatch({ type: "SET_STATUS", payload: "connecting" });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const session = await client.connectEmbedded();
      await storage.save(session);
      updateStateFromSession(session);
      if (!await runSiwx(session)) return;
      dispatch({ type: "SET_STATUS", payload: "connected" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Embedded wallet connection failed";
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error : new Error(message) });
      dispatch({ type: "SET_STATUS", payload: "disconnected" });
    }
  }, [client, storage, updateStateFromSession, runSiwx]);

  const connectPasskeys = useCallback(async (): Promise<void> => {
    dispatch({ type: "SET_STATUS", payload: "connecting" });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const session = await client.connectPasskeys();
      await storage.save(session);
      updateStateFromSession(session);
      if (!await runSiwx(session)) return;
      dispatch({ type: "SET_STATUS", payload: "connected" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Passkeys connection failed";
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error : new Error(message) });
      dispatch({ type: "SET_STATUS", payload: "disconnected" });
    }
  }, [client, storage, updateStateFromSession, runSiwx]);

  const disconnect = useCallback(async () => {
    if (!state.session) {
      dispatch({ type: "RESET" });
      return;
    }

    try {
      await client.disconnect(state.session);
    } catch (error) {
      logger.error("react/provider", "Disconnect error:", error);
    }

    // Also disconnect via SessionManager
    try {
      const sm = sessionManagerRef.current;
      if (sm) {
        await sm.disconnect();
      }
    } catch (smError) {
      logger.warn("react/provider", "SessionManager disconnect error:", smError);
    }

    await storage.clear();
    dispatch({ type: "RESET" });
  }, [client, state.session, storage]);

  const connectInjected = useCallback(async (walletId?: string): Promise<void> => {
    dispatch({ type: "SET_STATUS", payload: "connecting" });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const session = await withTimeout(
        client.connectInjected(walletId),
        connectionTimeout,
        "Injected wallet connect"
      );
      await storage.save(session);
      updateStateFromSession(session);

      // Feed the session into SessionManager
      try {
        const sm = sessionManagerRef.current;
        if (sm) {
          const evmChain = session.namespaces["eip155"]?.chains?.[0];
          const chainId = evmChain ?? "eip155:1";
          sm.connect("eip6963", chainId);
        }
      } catch (smError) {
        logger.warn("react/provider", "SessionManager sync error:", smError);
      }

      if (!await runSiwx(session)) return;
      dispatch({ type: "SET_STATUS", payload: "connected" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error : new Error(message) });
      dispatch({ type: "SET_STATUS", payload: "disconnected" });
    }
  }, [client, storage, updateStateFromSession, connectionTimeout, runSiwx]);

  const startPairing = useCallback(async () => {
    return client.startPairing();
  }, [client]);

  const completePairing = useCallback(async () => {
    const session = await client.completePairing();
    await storage.save(session);
    updateStateFromSession(session);
    if (!await runSiwx(session)) return session;
    dispatch({ type: "SET_STATUS", payload: "connected" });
    return session;
  }, [client, storage, updateStateFromSession, runSiwx]);

  const reconnect = useCallback(async () => {
    const savedSession = await storage.load();
    if (!savedSession) {
      dispatch({ type: "SET_STATUS", payload: "disconnected" });
      return;
    }

    dispatch({ type: "SET_STATUS", payload: "reconnecting" });

    try {
      const session = await withRetry(
        () => client.reconnect(savedSession),
        { maxRetries, baseDelay: 1000, label: "reconnect" }
      );
      updateStateFromSession(session);

      // Restore SessionManager from persistence
      try {
        const sm = sessionManagerRef.current;
        if (sm) {
          await sm.restoreFromPersistence();
        }
      } catch (smError) {
        logger.warn("react/provider", "SessionManager restore error:", smError);
      }

      dispatch({ type: "SET_STATUS", payload: "connected" });
    } catch (error) {
      logger.error("react/provider", "Reconnect error:", error);
      await storage.clear();
      dispatch({ type: "SET_STATUS", payload: "disconnected" });
      dispatch({ type: "SET_SESSION", payload: null });
    }
  }, [client, storage, updateStateFromSession, maxRetries]);

  const switchChain = useCallback(async (chainId: string) => {
    const sm = sessionManagerRef.current;
    if (sm) {
      // Use SessionManager's switchChain which handles fee sync + events
      await sm.switchChain(chainId);
      dispatch({ type: "SET_CHAIN", payload: chainId });
      return;
    }

    // Fallback to direct connector switching (no SessionManager)
    if (!state.session) {
      throw new Error("No active session");
    }

    try {
      if (state.session.walletType === "eip6963" || state.session.id?.startsWith("eip6963-")) {
        await eip6963Connector.switchChain(state.session, chainId);
      } else if (state.session.walletType === "solana" && client.solanaConnector) {
        await client.solanaConnector.switchChain?.(state.session, chainId);
      } else {
        await client.connector.switchChain(state.session, chainId);
      }
      dispatch({ type: "SET_CHAIN", payload: chainId });
    } catch (error) {
      throw new WalletError("chain_unsupported", "Failed to switch chain", error);
    }
  }, [client, state.session]);

  useEffect(() => {
    if (autoConnect) {
      reconnect();
    }
  }, [autoConnect, reconnect]);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

const value = useMemo<Web3ContextValue>(
    () => ({
      ...state,
      connect,
      connectEmbedded,
      connectPasskeys,
      disconnect,
      reconnect,
      switchChain,
      startPairing,
      completePairing,
      connectInjected,
      clearError,
      isConnected: state.status === "connected",
      chains,
      sessionManager,
    }),
    [state, connect, connectEmbedded, connectPasskeys,
      disconnect, reconnect, switchChain,
      startPairing, completePairing, connectInjected, clearError, chains, sessionManager]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3(): Web3ContextValue {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3ConnectProvider");
  }
  return context;
}
