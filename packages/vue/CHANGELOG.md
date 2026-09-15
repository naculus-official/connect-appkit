# @naculus/connect-appkit-vue

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
