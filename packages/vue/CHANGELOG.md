# @naculus/connect-appkit-vue

## 0.2.6

### Patch Changes

- 531cbc2: Fail closed in three places found in review. `sameExecutionIntent` no longer
  treats a field the caller omitted as a wildcard, so an execution adapter
  cannot add a target, calldata, value or chain to what the session key signs.
  Vue `useSmartAccount` writes address and deployment state only if the
  account, chain and manager that started the operation are still current.
  `useSendUserOperation` (React and Vue) keeps its single-flight lock across
  `reset()` until the in-flight UserOperation settles, so a reset cannot start
  a second on-chain submission alongside the first.
- ce39294: Add Vue `useSmartAccount`, `useSendUserOperation` and `useUserOpStatus` over
  connect-core's `SmartAccountManager` and the shared appkit-core decisions.
  Deployment goes through the caller's transaction sender and the
  UserOperation signer is caller-supplied.
- 6cef78b: Add Vue `useDelegationPolicy` over appkit-core's shared delegation-policy
  flow, with caller-supplied signer, signature verifier, execution planner and
  delegation state.
- 3084748: Add Vue `useExecuteCalls` and `useSendCalls` composables around caller-owned EIP-5792 actions and policy state.
- 9b982bc: Add a Vue `useEmbeddedWallet` composable around caller-owned wallet state and actions.
- bf47ae4: Add Vue ERC-20 transfer, approval, and transfer simulation composables backed by the shared strict calldata encoders. Wallet reads and sends remain caller-owned, chain mismatches fail closed, and invalid transfer inputs cannot display a stale simulation result.
- 5129ba5: Add Vue `useSessionKeys`, `useCreateSessionKey`, `useRevokeSession` and
  `useSendWithSession` over connect-core's `SessionKeyManager`, sharing the
  process-wide instance and config guard with React or taking a caller-owned
  manager.
- a39097c: Add a Vue `useSignInWithEthereum` composable around a caller-owned SIWX sign-in action.
- e90d340: Add Vue composables for message signing, EVM transaction sending, and Solana transaction signing, sending, and status reads. Each composable wraps caller-owned actions without changing message or transaction payloads.
- a8ebb69: Share simulation chain and RPC decisions between React and Vue, and add Vue `useSimulateTransfer` and `useTransactionSimulation` composables. Simulation remains a basic revert check with no asset-change or risk coverage. Simulation now rejects a chain override that would reuse another chain's RPC or client; pass a matching RPC URL when overriding the chain.
- ff3f4c1: Add Vue SIWX login and session composables around caller-owned signing, persistence, and temporal-policy state.
- Updated dependencies [a5c0f58]
- Updated dependencies [11a4fd8]
- Updated dependencies [531cbc2]
- Updated dependencies [ef9ac4f]
- Updated dependencies [1c42c23]
- Updated dependencies [1ba2f9b]
- Updated dependencies [88f72c9]
- Updated dependencies [36f2ccc]
- Updated dependencies [a8ebb69]
  - @naculus/connect-appkit-core@0.2.6
  - @naculus/connect-appkit-wc@0.2.6

## 0.2.5

### Patch Changes

- 890f38d: Expose Vue account and Solana account composables with connected-state semantics matching the React hooks.
- 8ce3204: Move destination-address validation and the CAIP-10 → bare address split into
  `@naculus/connect-appkit-core` (`validateDestination`, `isBurnDestination`,
  `bareEvmAddress`). The React `validateDestination` / `useValidateDestination`
  keep their public shape and strings and now delegate to it; the Vue balance and
  delegation composables use the shared split instead of local copies.
- 2d93f50: Add Vue composables for transaction monitoring, transaction history, and the
  most recent terminal transaction. They take a caller-owned monitor and mirror
  the React lifecycle without introducing a Vue provider.
- ca530e7: Add Vue `useBalance` and `useTokenBalance` composables that read native and
  ERC-20 balances through a caller-owned client, with optional auto-refresh.
- 327eb9e: Add Vue connection and disconnection lifecycle composables.
- e90097c: Add a read-only Vue EIP-7702 delegation status composable.
- b0874b0: Add reactive Vue name and reverse-address lookup composables with stale-result protection.
- e4b85d9: Move notification settings persistence and in-app notification actions into
  framework-neutral AppKit core while preserving the React hook behavior, and
  expose the corresponding Vue `useNotification` composable.
- b30a35a: Add Vue `useRouteQuote`, `useCompareCosts` and `useExecuteRoute` composables
  over the shared routing core.
- 830edc9: Add a reactive Vue useSession composable for active wallet and chain sessions.
- 5a70723: Add a Vue chain-switch lifecycle composable with provider error classification.
- 1fff014: Add Vue `useTokenList` and `useTokenSearch` composables over connect-core's
  `TokenListManager`, with CAIP-2 chain filtering and debounced search.
- 2790e75: Add Vue `useValidateDestination`, returning the shared core's verdict with a
  machine-readable `issue` for the caller to localise.
- Updated dependencies [8ce3204]
- Updated dependencies [46e710d]
- Updated dependencies [4b0024a]
- Updated dependencies [e4b85d9]
  - @naculus/connect-appkit-core@0.2.5
  - @naculus/connect-appkit-wc@0.2.5

## 0.2.4

### Patch Changes

- f012e61: Expose Solana signer roles. `useSolanaRoles` (React hook and Vue composable)
  wraps `@naculus/connector-solana`'s `getRoles`, splitting the connected
  account into `identity`, `signer` and `payer`, each `null` when the wallet
  declared it cannot fill that role — so a co-signing or relayer-submitted flow
  finds out before it opens a dialog that cannot succeed.
  
  The reasoning lives once, in `@naculus/connect-appkit-core` as
  `readSolanaRoles`, and adds the part a UI has to decide before it can show
  anything: `absence` is `no_session`, `not_solana` or `unreported`, so a
  connector that predates the roles API (`@naculus/connector-solana` < 0.2.4)
  reads as "has not said" rather than "cannot sign".
- 9cd817d: Correct the published component count from 24 to 28. `packages/wc/src` defines
  28 `@Component` tags and both the React and Vue wrappers generate 28 proxies,
  so the number in the READMEs and in the `wc` package description — which npm
  and market analyses read — was three releases stale.
- Updated dependencies [f012e61]
- Updated dependencies [9cd817d]
  - @naculus/connect-appkit-core@0.2.4
  - @naculus/connect-appkit-wc@0.2.4

## 0.2.2

> These entries were written as changesets during 0.2.0 and 0.2.1 but never
> consumed at those releases, so they accumulated. They describe work shipped
> across 0.2.0, 0.2.1 and 0.2.2 rather than 0.2.2 alone, and are collected here
> because deleting them would have thrown away the only written record of what
> those releases contained.

### Minor Changes

- b995e99: New package: `@naculus/connect-appkit-core`, the half of appkit that is not
  about React.
  
  appkit's stated shape is "write the Stencil components once, generate the
  React and Vue wrappers". That works for anything visual and never covered the
  logic: the React package carried roughly 8,500 hand-written lines against
  Vue's 280, and only two files in it contain JSX. The rest was logic wearing
  React clothes, reachable from exactly one framework — so a Vue application got
  components and no way to use them.
  
  Moved, unchanged: the connection state machine, chain resolution, token chain
  and decimals handling, provider error mapping, revert-reason decoding, the
  name resolver, and the types they are built on. Every one of them already
  imported no framework; they were simply in a package that did.
  
  `@naculus/connect-appkit-react` re-exports all of it, so a React consumer sees
  no change. **Breaking only for a consumer importing from a deep path** such as
  `@naculus/connect-appkit-react/dist/core/...`.
  
  `WalletChain`, `ChainInfo`, `ConnectionStatus` and `Web3State` are now defined
  once, in the new package, and re-exported by React rather than declared twice.
  Two structurally identical declarations typecheck fine and drift on the first
  edit.
  
  Vue gains `useChain`, which was not previously possible: `currentChain`,
  `chainInfo`, `availableChains`, `currentChainNumber` and `namespace`. The file
  contains no decision of its own — filtering the switcher to the connected
  namespace, describing non-EVM chains, and refusing to invent a chain number
  for Solana are all properties of the shared core, so both bindings get them or
  neither does.
- aec3be4: Stop offering chains a connected wallet cannot switch to.
  
  `useChain().availableChains` returned every configured chain regardless of
  what was connected. A Solana wallet was shown Ethereum and Polygon in the
  switcher, and clicking one asked a wallet with no concept of EIP-155 to switch
  to chain 137 — an action the interface presented as available and that could
  never work. It now filters to the connected namespace, and offers everything
  only when nothing is connected yet, since nothing has been ruled out then.
  
  `chainInfo` returned null for any namespace other than EIP-155, so a connected
  Solana wallet had no chain to display and the interface fell back to "Unknown
  Chain". It now describes every namespace, and names an unconfigured chain by
  its CAIP-2 reference rather than inventing "Chain 5" for a Solana cluster.
  
  `getChainById` and `useChain` both stop parsing CAIP-2 by hand and use
  `@naculus/connect-core`.
  
  `useAccount` reads each account's namespace from its CAIP-10 form instead of
  guessing from address shape, and falls back to shape only for a bare address —
  a bare `0x`-40-hex value is unambiguously EVM, a bare base58 string is not
  unambiguously anything.
  
  Vue gains `useAccounts`, applying the same rules from the same core functions.
  The two bindings differ in `computed` versus `useMemo` and nothing else.
- 388674e: Solana reaches the application layer.
  
  The engine could hold a Solana account, sign with it and send a transaction,
  but appkit had no Solana hook of any kind — an application could not read a
  balance or submit anything.
  
  `useSolanaAccount` reads the connected Solana account off the session's
  namespaces, so an injected wallet and the embedded wallet answer the same way.
  It matches on the `solana:` namespace and never on address shape, because base58
  is not distinguishable by inspection and guessing would eventually call
  something a Solana address that is not one.
  
  `useSolanaBalance` leaves `balance` null until a read succeeds, and clears it
  when one fails. A zero placeholder is a number a user reads as their balance,
  and a stale figure beside an error is worse. `isConfigured` reports a missing
  RPC endpoint as its own fact — the only one a caller can act on.
  
  `useSolanaTransaction` signs and sends through whichever wallet is connected.
  
  Two gaps in the client that this exposed:
  
  - `sendTransaction` typed its input as `Record<string, unknown>`, which is an
    EVM transaction's shape. A Solana transaction is bytes the application has
    already serialized, so it could not be expressed at all even once the
    connector below knew how to handle it.
  - There was no `signTransaction` on the client. A Solana application routinely
    signs a transaction it submits itself or hands to a relayer, and there was no
    way to ask for that.
  
  The Vue package gains `useSolanaBalance` too. Everything that took thought
  lives in `@naculus/connect-core`; what does not translate between the two
  frameworks is only the reactivity.
- c5ca02f: A Vue binding for the passphrase gate, and stories for the wallet components.
  
  `usePassphraseGate` is now available as a Vue composable. The gate itself moved
  to `@naculus/connect-core`, because the problem it solves — an encrypted
  storage adapter asking for a passphrase from inside code that has never heard
  of a component — is the same in both frameworks and deserved one
  implementation rather than two.
  
  `AccountSelector`, `WalletSecurityPanel`, `PassphraseDialog` and `PasskeySetup`
  each gained a presentational `*View` export, with the existing component a thin
  wrapper that supplies the data. Every interesting state in these — a passkey
  that cannot unlock, a record awaiting re-seal, a retry after a failed decrypt,
  a wallet imported from a raw key — is otherwise reachable only by arranging a
  real authenticator or a real failure. The views are exported because Storybook
  is a second consumer and so is any application holding its own state.
  
  `.storybook/main.ts` only globbed `packages/wc`, so the three story files in
  `packages/ui` had never been loaded by Storybook at all. They are now, along
  with 22 new stories.
  
  The embedded connector reports account changes, so `client.onAccountsChanged`
  now routes `embedded` to it instead of returning a no-op.

### Patch Changes

- Updated dependencies [b995e99]
- Updated dependencies [1d8b979]
- Updated dependencies [f1bd4f2]
  - @naculus/connect-appkit-core@1.0.0
  - @naculus/connect-appkit-wc@1.0.0
