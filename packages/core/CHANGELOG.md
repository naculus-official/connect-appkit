# @naculus/connect-appkit-core

## 0.2.5

### Patch Changes

- 8ce3204: Move destination-address validation and the CAIP-10 → bare address split into
  `@naculus/connect-appkit-core` (`validateDestination`, `isBurnDestination`,
  `bareEvmAddress`). The React `validateDestination` / `useValidateDestination`
  keep their public shape and strings and now delegate to it; the Vue balance and
  delegation composables use the shared split instead of local copies.
- 4b0024a: Move the chain-abstraction (routing) domain types and decisions into
  `@naculus/connect-appkit-core`: `RouteQuote`, `CostComparison`,
  `ExecutableQuote` and friends, plus `isQuotableInput`, `compareCostsKey`,
  `validateRouteRecipient` and `toExecuteRouteError`. The React `useRouteQuote`,
  `useCompareCosts` and `useExecuteRoute` keep their exported names and behaviour
  and delegate to them.
- e4b85d9: Move notification settings persistence and in-app notification actions into
  framework-neutral AppKit core while preserving the React hook behavior, and
  expose the corresponding Vue `useNotification` composable.

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
- f1bd4f2: Finish removing the fabricated currency symbol, and stop building the viem
  chain three times.
  
  Making `useBalance().symbol` nullable was undone one layer down:
  `AccountButton` rendered `balanceSymbol ?? "ETH"` and `ConnectButtonAdapter`
  passed the same fallback into the web component. Those are the two places a
  user actually reads it, so the label said "ETH" beside a MATIC or SOL amount
  regardless. Both now render no unit rather than the wrong one.
  
  `toViemChain` replaces three identical inline blocks in `useBalance`,
  `useTokenBalance` and `useViemClient` — three copies of the same `?? "ETH"`,
  which is three places for it to be wrong. The native symbol now comes from the
  chain's own `token`, then the shared chain registry, and only then a fallback
  that is reached solely for an EVM chain nobody has a record of. viem requires
  a string there and does not render it; the symbol a user reads stays null when
  unknown.
  
  The extraction introduced a render loop on the way — a freshly built chain
  object every render changed the memo key of the client effects, which never
  settled. It is memoised, and a test now pins the clients holding still across
  renders.

### Patch Changes

- 1d8b979: Preserve preflight execution guarantees through the actual send. Required
  atomic batches no longer get silently replanned as sequential sends when
  capability discovery is unavailable, sponsorship support is read from the
  wallet response, and a UserOperation fallback cannot bypass a required-gas
  sponsorship refusal.
  
  Capability and EIP-7702 delegation hooks now discard slow responses from a
  wallet or account that disconnected while the request was in flight. Unknown
  EVM chains also remain unlabeled instead of being presented as ETH.
