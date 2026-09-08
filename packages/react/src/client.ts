import type {
  BatchCall,
  CallsStatus,
  SendCallsOptions,
  UniversalConnector,
  UniversalWalletSession,
  WalletCapabilities,
} from "@naculus/connect-core";
import { logger, WalletError } from "@naculus/connect-core";
import type {
  PocketConnectorClass as EmbeddedWalletConnector,
  PocketConfig,
} from "@naculus/connector-embedded";
import { eip6963Connector } from "@naculus/connector-evm-injected";
import type PasskeysConnectorImpl from "@naculus/connector-passkeys";
import { PassphraseGate } from "@naculus/connect-core";
import {
  createWalletConnectConnector,
  type WalletConnectConnector,
} from "@naculus/connector-walletconnect";

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
  /** Configuration forwarded to the embedded wallet engine. */
  embeddedConfig?: PocketConfig;

  /**
   * Ask the user for the storage passphrase through the UI instead of
   * supplying `embeddedConfig.encryptionPassphrase` yourself.
   *
   * Creates a `PassphraseGate` on the client and wires it in. Mount
   * `<PassphraseDialog />` from `@naculus/connect-appkit-ui` — or drive
   * `usePassphraseGate()` yourself — and the wallet's encrypted storage has
   * somewhere to ask.
   *
   * A callback you supply in `embeddedConfig` wins: your own prompt is a
   * deliberate choice, not something to override.
   */
  passphrasePrompt?: boolean;

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
  /**
   * Where encrypted storage asks for a passphrase, when `passphrasePrompt` is
   * on. Null otherwise, including when the app supplies its own callback.
   */
  passphraseGate: PassphraseGate | null;
  /** The Solana injected wallet connector if enabled */
  solanaConnector: UniversalConnector | null;
  connect: () => Promise<UniversalWalletSession>;
  /** Connect via EIP-6963 injected wallet */
  connectInjected: (walletId?: string) => Promise<UniversalWalletSession>;
  connectEmbedded: () => Promise<UniversalWalletSession>;
  /** Connect via passkeys (WebAuthn) */
  connectPasskeys: () => Promise<UniversalWalletSession>;
  reconnect: (
    session: UniversalWalletSession,
  ) => Promise<UniversalWalletSession>;
  disconnect: (session: UniversalWalletSession) => Promise<void>;
  /** Sign a message via the appropriate connector for the session */
  signMessage: (
    session: UniversalWalletSession,
    input: { message: string; address?: string; chainId?: string },
  ) => Promise<unknown>;
  /** Send a transaction via the appropriate connector for the session */
  sendTransaction: (
    session: UniversalWalletSession,
    input: { transaction: Record<string, unknown>; chainId?: string },
  ) => Promise<unknown>;
  /** Send batched calls (EIP-5792 wallet_sendCalls) via the appropriate connector */
  sendCalls: (
    session: UniversalWalletSession,
    calls: BatchCall[],
    chainId?: string,
    options?: SendCallsOptions,
  ) => Promise<string>;
  /**
   * Ask the wallet what the account can do, keyed by CAIP-2 chain.
   *
   * Undefined when the active connector has no way to answer, which is a
   * different fact from "the account supports nothing" — see
   * getAccountCapabilities in @naculus/connect-core.
   */
  getCapabilities?: (
    session: UniversalWalletSession,
  ) => Promise<Record<string, WalletCapabilities>> | undefined;
  /**
   * Subscribe to in-wallet account switches, whatever the namespace.
   *
   * Dispatches to the connector carrying the session, so a consumer never has
   * to know whether the wallet reports EIP-1193 `accountsChanged`, Solana's
   * `accountChanged`, or a WalletConnect session update. Returns an
   * unsubscribe function; returns a no-op when the connector cannot report.
   */
  onAccountsChanged?: (
    session: UniversalWalletSession,
    handler: (accounts: string[]) => void,
  ) => () => void;
  /** Counterpart to onAccountsChanged for in-wallet chain switches. */
  onChainChanged?: (
    session: UniversalWalletSession,
    handler: (chainId: string) => void,
  ) => () => void;
  /**
   * EIP-5792 `wallet_showCallsStatus`: ask the wallet to display a bundle.
   *
   * Optional because most wallets do not implement it, and a refusal is
   * cosmetic — the bundle is unaffected.
   */
  showCallsStatus?: (
    session: UniversalWalletSession,
    bundleHash: string,
  ) => Promise<void>;
  getCallsStatus: (
    session: UniversalWalletSession,
    bundleHash: string,
  ) => Promise<CallsStatus>;
  startPairing: () => Promise<string>;
  completePairing: () => Promise<UniversalWalletSession>;
  /** Abandon an in-flight pairing; a session that still arrives is torn down. */
  cancelPairing: () => void;
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
  // A provider owns its client. Keeping a process-wide singleton here causes
  // the first provider's projectId, metadata, and feature flags to leak into
  // every later provider. `getClient()` remains as a legacy last-created
  // accessor; provider hooks use the client carried by context.
  let clientRef: Web3Client | null = null;

  const connector = createWalletConnectConnector({
    projectId: config.projectId,
    metadata: config.metadata,
  });

  let _embeddedConnector: EmbeddedWalletConnector | null = null;
  let embeddedInit: Promise<void> | null = null;

  // Declared before the passkeys connector exists, because the embedded
  // wallet is constructed from it and the two load independently.
  let _passkeysConnector: PasskeysConnectorImpl | null = null;
  let passkeysInit: Promise<void> | null = null;

  // Only when asked for, and never over a callback the app already supplied.
  const _passphraseGate =
    config.passphrasePrompt && config.enableEmbedded &&
    !config.embeddedConfig?.encryptionPassphrase
      ? new PassphraseGate()
      : null;

  if (config.enableEmbedded) {
    embeddedInit = import("@naculus/connector-embedded")
      .then((mod) => {
        const embeddedConfig: PocketConfig = { ...config.embeddedConfig };
        if (_passphraseGate) {
          embeddedConfig.encryptionPassphrase = _passphraseGate.request;
        }
        // Passkey unlock turns itself on where the platform supports it: a
        // protection that has to be switched on protects only the people who
        // already knew to look for it. Where the authenticator cannot answer
        // this returns null and the record stays passphrase-only, which is
        // why it is safe to wire without asking.
        //
        // Requires encryption to be on at all — there is no key to wrap
        // otherwise — and never replaces a provider the app supplied.
        if (
          config.enablePasskeys &&
          embeddedConfig.encryptionPassphrase &&
          !embeddedConfig.prfUnlock
        ) {
          embeddedConfig.prfUnlock = {
            async derive(salt: Uint8Array) {
              if (passkeysInit) await passkeysInit;
              const passkeys = _passkeysConnector;
              if (!passkeys?.hasCredential()) return null;
              return passkeys.derivePrfKey(salt);
            },
          };
        }
        const conn = mod.createPocketConnector(embeddedConfig);
        _embeddedConnector = conn;
        clientRef?._setEmbeddedConnector(_embeddedConnector);
      })
      .catch((err) => {
        logger.warn(
          "react/client",
          "Embedded wallet connector not available:",
          err,
        );
        _embeddedConnector = null;
      });
  }

  if (config.enablePasskeys) {
    passkeysInit = import("@naculus/connector-passkeys")
      .then((mod) => {
        const conn = mod.createPasskeysConnector();
        _passkeysConnector = conn;
        clientRef?._setPasskeysConnector(_passkeysConnector);
      })
      .catch((err) => {
        logger.warn("react/client", "Passkeys connector not available:", err);
        _passkeysConnector = null;
      });
  }

  let _solanaConnector: UniversalConnector | null = null;
  let solanaInit: Promise<void> | null = null;

  if (config.enableSolana) {
    solanaInit = import("@naculus/connector-solana")
      .then((mod: any) => {
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
        clientRef?._setSolanaConnector(_solanaConnector);
      })
      .catch((err) => {
        logger.warn("react/client", "Solana connector not available:", err);
        _solanaConnector = null;
      });
  }

  // Start EIP-6963 discovery eagerly so wallets are available when user clicks connect
  if (typeof window !== "undefined") {
    eip6963Connector.startDiscovery();
  }

  const client: Web3Client = {
    connector,
    get embeddedConnector() {
      return _embeddedConnector;
    },
    get passkeysConnector() {
      return _passkeysConnector;
    },
    passphraseGate: _passphraseGate,
    get solanaConnector() {
      return _solanaConnector;
    },
    connect: () => connector.connect(),
    connectInjected: async (walletId?: string) => {
      return eip6963Connector.connect(walletId);
    },
    connectEmbedded: async () => {
      if (embeddedInit) await embeddedInit;
      if (!_embeddedConnector) {
        throw new Error(
          "Embedded wallet not enabled. Set enableEmbedded: true in config.",
        );
      }
      return _embeddedConnector.connect();
    },
    connectPasskeys: async () => {
      if (passkeysInit) await passkeysInit;
      if (!_passkeysConnector) {
        throw new Error(
          "Passkeys connector not enabled. Set enablePasskeys: true in config.",
        );
      }
      return _passkeysConnector.connect();
    },
    startPairing: () => connector.startPairing(),
    completePairing: () => connector.completePairing(),
    cancelPairing: () => connector.cancelPairing?.(),
    signMessage: async (session, input) => {
      if (session.id?.startsWith("eip6963-")) {
        return eip6963Connector.signMessage(session as any, input);
      }
      if (session.walletType === "passkeys" && _passkeysConnector) {
        return _passkeysConnector.signMessage(session as any, input);
      }
      if (session.walletType === "embedded") {
        if (!_embeddedConnector) {
          throw new WalletError(
            "wallet_unavailable",
            "Embedded wallet connector not available.",
          );
        }
        return _embeddedConnector.signMessage(session as any, input);
      }
      if (session.walletType === "solana") {
        if (solanaInit) await solanaInit;
        if (_solanaConnector) {
          return (_solanaConnector as any).signMessage(session as any, input);
        }
        throw new WalletError(
          "wallet_unavailable",
          "Solana connector not available. Ensure enableSolana is true and @naculus/connector-solana is installed.",
        );
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
      if (session.walletType === "embedded") {
        if (!_embeddedConnector) {
          throw new WalletError(
            "wallet_unavailable",
            "Embedded wallet connector not available.",
          );
        }
        return _embeddedConnector.sendTransaction(session as any, input);
      }
      if (session.walletType === "solana") {
        if (solanaInit) await solanaInit;
        if (_solanaConnector) {
          return (_solanaConnector as any).sendTransaction(
            session as any,
            input,
          );
        }
        throw new WalletError(
          "wallet_unavailable",
          "Solana connector not available. Ensure enableSolana is true and @naculus/connector-solana is installed.",
        );
      }
      return connector.sendTransaction(session, input);
    },
    onAccountsChanged: (session, handler) => {
      // Same dispatch as every other session-routed call.
      const noop = () => {};
      if (session.id?.startsWith("eip6963-")) {
        return (
          eip6963Connector.onAccountsChanged?.(session as never, handler) ??
          noop
        );
      }
      if (session.walletType === "embedded") {
        // The embedded wallet does rotate its active account, through
        // `setActiveNamespace` and `backfillAccounts`. This used to return a
        // no-op on the reasoning that a local key "only rotates through an
        // explicit call" — which is exactly the case that now exists, and
        // left the provider publishing the connect-time account while a
        // different key signed.
        return (
          _embeddedConnector?.onAccountsChanged?.(session, handler) ?? noop
        );
      }
      if (session.walletType === "passkeys") {
        // A passkey connector holds no account to rotate: it cannot even
        // produce an address without a deployed smart account.
        return noop;
      }
      if (session.walletType === "solana") {
        return (
          (_solanaConnector as UniversalConnector | null)?.onAccountsChanged?.(
            session,
            handler,
          ) ?? noop
        );
      }
      return connector.onAccountsChanged?.(session, handler) ?? noop;
    },
    onChainChanged: (session, handler) => {
      const noop = () => {};
      if (session.id?.startsWith("eip6963-")) {
        return (
          eip6963Connector.onChainChanged?.(session as never, handler) ?? noop
        );
      }
      if (
        session.walletType === "passkeys" ||
        session.walletType === "embedded"
      ) {
        return noop;
      }
      if (session.walletType === "solana") {
        return (
          (_solanaConnector as UniversalConnector | null)?.onChainChanged?.(
            session,
            handler,
          ) ?? noop
        );
      }
      return connector.onChainChanged?.(session, handler) ?? noop;
    },
    getCapabilities: (session) => {
      // Same dispatch as sendCalls, so the capability answer always comes from
      // the connector that would carry out the send. Asking one connector and
      // sending through another is how a caller ends up promised atomicity
      // that the executing wallet never claimed.
      if (session.id?.startsWith("eip6963-")) {
        return eip6963Connector.getCapabilities?.(session as never);
      }
      if (session.walletType === "passkeys") {
        return _passkeysConnector?.getCapabilities?.(session as never);
      }
      if (session.walletType === "solana") {
        // The Solana connector answers nothing today. Returning undefined
        // reports that rather than a fabricated "no support".
        return (
          _solanaConnector as UniversalConnector | null
        )?.getCapabilities?.(session);
      }
      if (session.walletType === "embedded") {
        return _embeddedConnector?.getCapabilities?.(session as never);
      }
      // Undefined rather than an empty object: "cannot be asked" has to stay
      // distinguishable from "asked, and answered nothing".
      return connector.getCapabilities?.(session);
    },
    sendCalls: async (session, calls, chainId, options) => {
      if (session.id?.startsWith("eip6963-")) {
        return eip6963Connector.sendCalls!(
          session as any,
          calls,
          chainId,
          options,
        );
      }
      if (session.walletType === "passkeys" && _passkeysConnector) {
        return _passkeysConnector.sendCalls!(
          session as any,
          calls,
          chainId,
          options,
        );
      }
      if (session.walletType === "solana") {
        if (solanaInit) await solanaInit;
        if (_solanaConnector) {
          return (_solanaConnector as any).sendCalls(
            session as any,
            calls,
            chainId,
            options,
          );
        }
        throw new WalletError(
          "wallet_unavailable",
          "Solana connector not available. Ensure enableSolana is true and @naculus/connector-solana is installed.",
        );
      }
      if (session.walletType === "embedded") {
        if (!_embeddedConnector?.sendCalls) {
          throw new WalletError(
            "method_not_allowed",
            "Embedded wallet does not support sendCalls",
          );
        }
        return _embeddedConnector.sendCalls!(
          session as any,
          calls,
          chainId,
          options,
        );
      }
      if (!connector.sendCalls) {
        throw new WalletError(
          "method_not_allowed",
          "sendCalls not supported by this connector",
        );
      }
      return connector.sendCalls(session, calls, chainId, options);
    },
    showCallsStatus: async (session, bundleHash) => {
      // Same dispatch as sendCalls, so the wallet asked to display the bundle
      // is the one that sent it.
      if (session.id?.startsWith("eip6963-")) {
        return eip6963Connector.showCallsStatus!(session as never, bundleHash);
      }
      if (
        session.walletType === "passkeys" ||
        session.walletType === "embedded"
      ) {
        throw new WalletError(
          "method_unsupported",
          `${session.walletType} wallets have no UI to display a call bundle.`,
        );
      }
      if (!connector.showCallsStatus) {
        throw new WalletError(
          "method_unsupported",
          "This connector cannot display call status.",
        );
      }
      return connector.showCallsStatus(session, bundleHash);
    },
    getCallsStatus: async (session, bundleHash) => {
      if (
        session.id?.startsWith("eip6963-") &&
        eip6963Connector.getCallsStatus
      ) {
        return eip6963Connector.getCallsStatus(session as any, bundleHash);
      }
      if (
        session.walletType === "passkeys" &&
        _passkeysConnector?.getCallsStatus
      ) {
        return _passkeysConnector.getCallsStatus(session as any, bundleHash);
      }
      if (session.walletType === "embedded") {
        throw new WalletError(
          "method_not_allowed",
          "Embedded wallet does not support getCallsStatus",
        );
      }
      if (!connector.getCallsStatus) {
        throw new WalletError(
          "method_not_allowed",
          "getCallsStatus not supported by this connector",
        );
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
      if (
        session.id?.startsWith("eip6963-") ||
        session.walletType === "eip6963"
      ) {
        return eip6963Connector.disconnect(session as any);
      }
      if (session.walletType === "embedded" && _embeddedConnector) {
        return _embeddedConnector.disconnect();
      }
      if (session.walletType === "passkeys" && _passkeysConnector) {
        return _passkeysConnector.disconnect(session as any);
      }
      if (session.walletType === "solana") {
        if (solanaInit) await solanaInit;
        if (_solanaConnector) {
          return _solanaConnector.disconnect(session);
        }
        throw new WalletError(
          "wallet_unavailable",
          "Solana connector not available. Ensure enableSolana is true and @naculus/connector-solana is installed.",
        );
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
    _setEmbeddedConnector: (conn: EmbeddedWalletConnector) => {
      _embeddedConnector = conn;
    },
    _setPasskeysConnector: (conn: PasskeysConnectorImpl) => {
      _passkeysConnector = conn;
    },
    _setSolanaConnector: (conn: UniversalConnector) => {
      _solanaConnector = conn;
    },
  };

  clientRef = client;
  clientInstance = client;
  return client;
}

export function getClient(): Web3Client | null {
  return clientInstance;
}

export function clearClient(): void {
  clientInstance = null;
}
