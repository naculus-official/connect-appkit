import { WalletConnectConnector, createWalletConnectConnector } from "@naculus/connector-walletconnect";
import { eip6963Connector } from "@naculus/connector-evm-injected";
import { logger, WalletError } from "@naculus/connect-core";
import type { UniversalConnector, UniversalWalletSession, BatchCall, CallsStatus } from "@naculus/connect-core";
import type { PocketConnectorClass as EmbeddedWalletConnector } from "@naculus/connector-embedded";
import type PasskeysConnectorImpl from "@naculus/connector-passkeys";

export type ClientConfig = {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  /** Enable embedded (self-custodial) wallet */
  enableEmbedded?: boolean;

  /** Enable passkeys (WebAuthn) connector */
  enablePasskeys?: boolean;

  /** Enable Solana injected wallet connector (Phantom, Solflare) */
  enableSolana?: boolean;
  /** Default Solana chain (e.g. "solana:0"). Only used when enableSolana is true. */
  solanaDefaultChain?: string;
};

export interface Web3Client {
  connector: WalletConnectConnector;
  embeddedConnector: EmbeddedWalletConnector | null;
  /** The Passkeys connector if enabled */
  passkeysConnector: PasskeysConnectorImpl | null;
  /** The Solana injected wallet connector if enabled */
  solanaConnector: UniversalConnector | null;
  connect: () => Promise<UniversalWalletSession>;
  /** Connect via EIP-6963 injected wallet */
  connectInjected: (walletId?: string) => Promise<UniversalWalletSession>;
  connectEmbedded: () => Promise<UniversalWalletSession>;
  /** Connect via passkeys (WebAuthn) */
  connectPasskeys: () => Promise<UniversalWalletSession>;
  reconnect: (session: UniversalWalletSession) => Promise<UniversalWalletSession>;
  disconnect: (session: UniversalWalletSession) => Promise<void>;
  /** Sign a message via the appropriate connector for the session */
  signMessage: (session: UniversalWalletSession, input: { message: string; address?: string; chainId?: string }) => Promise<unknown>;
  /** Send a transaction via the appropriate connector for the session */
  sendTransaction: (session: UniversalWalletSession, input: { transaction: Record<string, unknown>; chainId?: string }) => Promise<unknown>;
  /** Send batched calls (EIP-5792 wallet_sendCalls) via the appropriate connector */
  sendCalls: (session: UniversalWalletSession, calls: BatchCall[], chainId?: string) => Promise<string>;
  getCallsStatus: (session: UniversalWalletSession, bundleHash: string) => Promise<CallsStatus>;
  startPairing: () => Promise<string>;
  completePairing: () => Promise<UniversalWalletSession>;
  getAllConnectors: () => UniversalConnector[];
  /** @internal set embedded connector after lazy init */
  _setEmbeddedConnector: (conn: EmbeddedWalletConnector) => void;
  /** @internal set passkeys connector after lazy init */
  _setPasskeysConnector: (conn: PasskeysConnectorImpl) => void;
  /** @internal set solana connector after lazy init */
  _setSolanaConnector: (conn: UniversalConnector) => void;
}

let clientInstance: Web3Client | null = null;

export function createClient(config: ClientConfig): Web3Client {
  if (clientInstance) return clientInstance;

  const connector = createWalletConnectConnector({
    projectId: config.projectId,
    metadata: config.metadata
  });

  let _embeddedConnector: EmbeddedWalletConnector | null = null;
  let embeddedInit: Promise<void> | null = null;

  if (config.enableEmbedded) {
      embeddedInit = import("@naculus/connector-embedded").then((mod) => {
        const conn = mod.createPocketConnector();
        _embeddedConnector = conn;
        if (clientInstance) clientInstance._setEmbeddedConnector(_embeddedConnector);
    }).catch((err) => {
      logger.warn("react/client", "Embedded wallet connector not available:", err);
      _embeddedConnector = null;
    });
  }

  let _passkeysConnector: PasskeysConnectorImpl | null = null;
  let passkeysInit: Promise<void> | null = null;

  if (config.enablePasskeys) {
      passkeysInit = import("@naculus/connector-passkeys").then((mod) => {
        const conn = mod.createPasskeysConnector();
        _passkeysConnector = conn;
        if (clientInstance) clientInstance._setPasskeysConnector(_passkeysConnector);
    }).catch((err) => {
      logger.warn("react/client", "Passkeys connector not available:", err);
      _passkeysConnector = null;
    });
  }

  let _solanaConnector: UniversalConnector | null = null;
  let solanaInit: Promise<void> | null = null;

  if (config.enableSolana) {
      solanaInit = import("@naculus/connector-solana").then((mod: any) => {
        // Use the singleton instance so hooks (useSolanaAccount, etc.) and
        // the client routing share the same activeSession state.
        const conn = mod.solanaConnector as UniversalConnector;
        if (config.solanaDefaultChain && "configure" in conn) {
          (conn as any).configure({ defaultChain: config.solanaDefaultChain });
        }
        _solanaConnector = conn;
        if (typeof window !== "undefined" && "startDiscovery" in conn) {
          (conn as any).startDiscovery();
        }
        if (clientInstance) clientInstance._setSolanaConnector(_solanaConnector);
    }).catch((err) => {
      logger.warn("react/client", "Solana connector not available:", err);
      _solanaConnector = null;
    });
  }

  // Start EIP-6963 discovery eagerly so wallets are available when user clicks connect
  if (typeof window !== "undefined") {
    eip6963Connector.startDiscovery();
  }

  clientInstance = {
    connector,
    get embeddedConnector() { return _embeddedConnector; },
    get passkeysConnector() { return _passkeysConnector; },
    get solanaConnector() { return _solanaConnector; },
    connect: () => connector.connect(),
    connectInjected: async (walletId?: string) => {
      return eip6963Connector.connect(walletId);
    },
    connectEmbedded: async () => {
      if (embeddedInit) await embeddedInit;
      if (!_embeddedConnector) {
        throw new Error("Embedded wallet not enabled. Set enableEmbedded: true in config.");
      }
      return _embeddedConnector.connect();
    },
    connectPasskeys: async () => {
      if (passkeysInit) await passkeysInit;
      if (!_passkeysConnector) {
        throw new Error("Passkeys connector not enabled. Set enablePasskeys: true in config.");
      }
      return _passkeysConnector.connect();
    },
    startPairing: () => connector.startPairing(),
    completePairing: () => connector.completePairing(),
    signMessage: async (session, input) => {
      if (session.id?.startsWith("eip6963-")) {
        return eip6963Connector.signMessage(session as any, input);
      }
      if (session.walletType === "passkeys" && _passkeysConnector) {
        return _passkeysConnector.signMessage(session as any, input);
      }
      if (session.walletType === "solana") {
        if (solanaInit) await solanaInit;
        if (_solanaConnector) {
          return (_solanaConnector as any).signMessage(session as any, input);
        }
        throw new WalletError("wallet_unavailable", "Solana connector not available. Ensure enableSolana is true and @naculus/connector-solana is installed.");
      }
      return connector.signMessage(session, input);
    },
    sendTransaction: async (session, input) => {
      if (session.id?.startsWith("eip6963-")) {
        return eip6963Connector.sendTransaction(session as any, input);
      }
      if (session.walletType === "passkeys" && _passkeysConnector) {
        return _passkeysConnector.sendTransaction(session as any, input);
      }
      if (session.walletType === "solana") {
        if (solanaInit) await solanaInit;
        if (_solanaConnector) {
          return (_solanaConnector as any).sendTransaction(session as any, input);
        }
        throw new WalletError("wallet_unavailable", "Solana connector not available. Ensure enableSolana is true and @naculus/connector-solana is installed.");
      }
      return connector.sendTransaction(session, input);
    },
    sendCalls: async (session, calls, chainId) => {
      if (session.id?.startsWith("eip6963-")) {
        return eip6963Connector.sendCalls!(session as any, calls, chainId);
      }
      if (session.walletType === "passkeys" && _passkeysConnector) {
        return _passkeysConnector.sendCalls(session as any, calls, chainId);
      }
      if (session.walletType === "solana") {
        if (solanaInit) await solanaInit;
        if (_solanaConnector) {
          return (_solanaConnector as any).sendCalls(session as any, calls, chainId);
        }
        throw new WalletError("wallet_unavailable", "Solana connector not available. Ensure enableSolana is true and @naculus/connector-solana is installed.");
      }
      if (session.walletType === "embedded" && _embeddedConnector && _embeddedConnector.sendCalls) {
        return _embeddedConnector.sendCalls(session as any, calls, chainId);
      }
      if (!connector.sendCalls) {
        throw new WalletError("method_not_allowed", "sendCalls not supported by this connector");
      }
      return connector.sendCalls(session, calls, chainId);
    },
    getCallsStatus: async (session, bundleHash) => {
      if (session.id?.startsWith("eip6963-") && eip6963Connector.getCallsStatus) {
        return eip6963Connector.getCallsStatus(session as any, bundleHash);
      }
      if (session.walletType === "passkeys" && _passkeysConnector?.getCallsStatus) {
        return _passkeysConnector.getCallsStatus(session as any, bundleHash);
      }
      if (!connector.getCallsStatus) {
        throw new WalletError("method_not_allowed", "getCallsStatus not supported by this connector");
      }
      return connector.getCallsStatus(session, bundleHash);
    },
    reconnect: async (session) => {
      if (session.walletType === "eip6963") {
        return eip6963Connector.reconnect(session);
      }
      if (session.walletType === "embedded") {
        if (_embeddedConnector) {
          return _embeddedConnector.reconnect(session);
        }
        return session;
      }
      if (session.walletType === "solana") {
        // Solana injected wallet doesn't support reconnect (no persisted session).
        // Return the saved session as-is; signing ops require wallet reconnection.
        return session;
      }
      return connector.reconnect(session);
    },
    disconnect: async (session) => {
      if (session.walletType === "solana") {
        if (solanaInit) await solanaInit;
        if (_solanaConnector) {
          return _solanaConnector.disconnect(session);
        }
        throw new WalletError("wallet_unavailable", "Solana connector not available. Ensure enableSolana is true and @naculus/connector-solana is installed.");
      }
      return connector.disconnect(session);
    },
    getAllConnectors: () => {
      const connectors: UniversalConnector[] = [connector];
      if (_embeddedConnector) connectors.push(_embeddedConnector);
      if (_passkeysConnector) connectors.push(_passkeysConnector);
      if (_solanaConnector) connectors.push(_solanaConnector);
      return connectors;
    },
    _setEmbeddedConnector: (conn: EmbeddedWalletConnector) => { _embeddedConnector = conn; },
    _setPasskeysConnector: (conn: PasskeysConnectorImpl) => { _passkeysConnector = conn; },
    _setSolanaConnector: (conn: UniversalConnector) => { _solanaConnector = conn; },
  };

  return clientInstance;
}

export function getClient(): Web3Client | null {
  return clientInstance;
}

export function clearClient(): void {
  clientInstance = null;
}
