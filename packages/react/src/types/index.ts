import type { UniversalWalletSession, Namespace, SessionNamespace } from "@naculus/connect-core";
import type { PocketConfig } from "@naculus/connector-embedded";
import type { Chain } from "viem";

export type WalletChain = {
  /**
   * CAIP-2, and the chain's identity.
   *
   * This was `id: number` alongside a separate `namespace`, which could only
   * ever describe an EIP-155 chain: a Solana reference is base58
   * (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`) and an XRPL one is an
   * unsigned network id. The registry structurally could not hold a non-EVM
   * chain, so every non-EVM path fell back to "unknown".
   *
   * `namespace` is gone rather than kept alongside: two fields that must
   * agree are two fields that eventually do not.
   */
  caip2: string;
  name: string;
  rpcUrl?: string;
  explorerUrl?: string;
  token?: string;
};

export type ConnectionStatus = "disconnected" | "connecting" | "authenticating" | "connected" | "reconnecting";

/** SIWx (Sign-In With X) CAIP-122 configuration */
export interface SIWxConfig {
  /** Called after wallet connects to build the message to sign */
  createMessage: (params: { address: string; chainId: string }) => Promise<string>;
  /** Called after the user signs the message */
  handleSignComplete?: (params: { message: string; signature: string }) => Promise<void>;
  /** Whether SIWx is required. If true, wallet disconnects on sign failure (default: true) */
  required?: boolean;
}

export interface Web3ConnectConfig {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  chains?: WalletChain[];
  /** SIWx (Sign-In With X) post-connection authentication */
  siwx?: SIWxConfig;
  storageKey?: string;
  /** Enable embedded self-custodial wallet */
  enableEmbedded?: boolean;
  /** Configuration forwarded to the embedded wallet engine. */
  embeddedConfig?: PocketConfig;
  /** Enable passkeys (WebAuthn) connector */
  enablePasskeys?: boolean;
  /** Enable Solana injected wallet connector (Phantom, Solflare) */
  enableSolana?: boolean;
  /** Default Solana chain for injected wallet connections (e.g. "solana:0"). */
  solanaDefaultChain?: string;
  /** Connection timeout in milliseconds (default: 30000) */
  connectionTimeout?: number;
  /** Max retry attempts for reconnection (default: 2) */
  maxRetries?: number;
  /** Refresh fee data after a chain switch (default: true). */
  autoRefreshFeeOnSwitch?: boolean;
  /**
   * Optional AES-256-GCM encryption key for session persistence.
   * When provided, session data is encrypted at rest in localStorage. This
   * key is frontend runtime data, not a secret boundary; never use a PaaS
   * root credential, signing key, or private API token here.
   * When omitted, existing backward-compatible plaintext storage is used.
   */
  encryptionKey?: string;
}

export interface Web3State {
  status: ConnectionStatus;
  session: UniversalWalletSession | null;
  accounts: string[];
  chainId: string | null;
  error: Error | null;
}

export interface Web3Actions {
  startPairing: () => Promise<string>;
  /**
   * Abandon an in-flight pairing.
   *
   * WalletConnect cannot withdraw a proposal once the URI is displayed, so
   * this refuses the resulting session and disconnects it if the wallet
   * approves anyway. A user who cancels must not end up connected.
   */
  cancelPairing: () => void;
  completePairing: () => Promise<UniversalWalletSession>;
  connect: () => Promise<void>;
  connectInjected: (walletId?: string) => Promise<void>;
  /** Connect via embedded self-custodial wallet */
  connectEmbedded: () => Promise<void>;
  /** Connect via passkeys (WebAuthn) */
  connectPasskeys: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
  /** Clear the current error state without triggering reconnection */
  clearError: () => void;
}

export interface UseWalletReturn extends Web3State, Web3Actions {}

export type EvmTransaction = {
  to: string;
  from?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  nonce?: string;
  chainId?: number;
};

export interface ChainInfo {
  namespace: Namespace;
  chainId: string;
  name: string;
  selected: boolean;
}
