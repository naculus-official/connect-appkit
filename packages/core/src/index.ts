/**
 * `@naculus/connect-appkit-core` — the half of appkit that is not about React.
 *
 * appkit's shape is "write the Stencil components once, generate the React and
 * Vue wrappers", and that works for anything visual. It never covered the
 * logic: the React package carried ~8.5k hand-written lines against Vue's
 * ~280, and only two files in it contain JSX. The rest was logic wearing React
 * clothes, reachable from exactly one framework.
 *
 * Everything exported here imports no framework. A React hook and a Vue
 * composable over it are each about ten lines, and they share every decision
 * that took thought rather than each making it again.
 */

export * from "./types";

// ── EIP-5792 capabilities ─────────────────────────────────────────
export {
  atomicSupportFor,
  normalizeCapabilities,
  selectChainCapabilities,
  type AtomicSupport,
  type ChainCapabilities,
} from "./capabilities";

// ── Solana signer roles ───────────────────────────────────────────
export {
  readSolanaRoles,
  type SolanaIdentity,
  type SolanaPayer,
  type SolanaRoles,
  type SolanaRolesAbsence,
  type SolanaRolesSource,
  type SolanaRolesState,
  type SolanaSigner,
  type SolanaWalletFeatures,
} from "./solana-roles";

// ── Chains ────────────────────────────────────────────────────────
export {
  chainNamespace,
  chainNumber,
  chainsForNamespace,
  describeChain,
  resolveChain,
} from "./chain-selection";

export { toViemChain } from "./viem-chain";
export type { ViemChainShape } from "./viem-chain";

// ── Account abstraction ───────────────────────────────────────────
export * from "./aa-chain";

// ── Tokens ────────────────────────────────────────────────────────
export * from "./token-chain";
export * from "./token-decimals";

// ── Errors ────────────────────────────────────────────────────────
export * from "./provider-errors";
export * from "./revert-reason";

// ── Names ─────────────────────────────────────────────────────────
export * from "./name-resolver";

// ── Addresses ─────────────────────────────────────────────────────
export * from "./destination";

// ── Connection state machine ──────────────────────────────────────
export * from "./web3-store";
