# @naculus/connect-appkit-core

## 0.3.0

### Minor Changes

- Require connect-lib 0.3.0. The `@naculus/connect-core` peer ranges of appkit-core and appkit-ui move from `^0.2.x` to `^0.3.0` (a `^0.2` range does not admit 0.3.0), and the React and Vue dependencies on connect-lib packages follow. No appkit API change: this release keeps the two SDKs in lockstep. connect-lib 0.3.0 is breaking only for apps that use `@naculus/wallet-engine` session keys directly — see its CHANGELOG.

## 0.2.8

### Patch Changes

- Require connect-lib 0.2.8, which binds session-key recipient limits to what is signed. `createDelegationPolicyFlow().createPolicy` now refuses a scope with `allowedRecipients`: this flow's executions sign raw digests, which connect-core 0.2.8 refuses while recipients are limited, so such a policy could be created and previewed as valid yet never sign.

## 0.2.7

### Patch Changes

- 2250cd2: Consume connect-lib 0.2.6's CAIP-25 session lifecycle: `useSession` (React
  and Vue) and the React provider react to `sessionScopeChanged` and
  `sessionRevoked`, so a wallet narrowing or ending a session updates app state
  on every connector, not only WalletConnect. `isBurnDestination` now delegates
  to connect-core's unified `isBurnAddress`. Peer minimum for `@naculus/*` is
  `^0.2.6`.

## 0.2.6

### Patch Changes

- a5c0f58: Move the signed off-chain delegation-policy flow into
  `@naculus/connect-appkit-core` (`createDelegationPolicyFlow`,
  `buildDelegationPolicyMessage`, `sameExecutionIntent`, the policy/adapter
  types). The React `useDelegationPolicy` keeps every export and behaviour and
  now only wires React state and provider hooks to the shared flow.
- 11a4fd8: Expose strict ERC-20 transfer, approve, and transferFrom calldata encoders for shared React/Vue use. Encoding rejects invalid EVM address casing and out-of-range uint256 amounts.
- 531cbc2: Fail closed in three places found in review. `sameExecutionIntent` no longer
  treats a field the caller omitted as a wildcard, so an execution adapter
  cannot add a target, calldata, value or chain to what the session key signs.
  Vue `useSmartAccount` writes address and deployment state only if the
  account, chain and manager that started the operation are still current.
  `useSendUserOperation` (React and Vue) keeps its single-flight lock across
  `reset()` until the in-flight UserOperation settles, so a reset cannot start
  a second on-chain submission alongside the first.
- ef9ac4f: Move the process-wide `SessionKeyManager` registry and its spending-config
  guard into `@naculus/connect-appkit-core` (`getSharedSessionKeyManager`,
  `resetSharedSessionKeyManager`, `sessionKeyConfigFingerprint`). The React
  session-key hooks keep their exports and delegate to it.
- 1c42c23: Fail closed when persisted SIWX authentication contains malformed `expirationTime` or `notBefore` claims instead of treating it as currently valid.
- 1ba2f9b: Centralize SIWX browser defaults, temporal validity checks, and result-to-session mapping in appkit-core while preserving React behavior.
- 88f72c9: Move the smart-account decisions shared by React and Vue into
  `@naculus/connect-appkit-core`: `resolveUserOpChain` (fail-closed chain
  selection and mismatch check), `buildSmartAccountConfig` and
  `assertHexSignature`. React `useSmartAccount` / `useSendUserOperation`
  delegate to them and use the shared `bareEvmAddress`.
- 36f2ccc: Move ERC-4337 receipt validation and the `eth_getUserOperationReceipt` call
  into `@naculus/connect-appkit-core` (`parseUserOperationReceipt`,
  `fetchUserOperationReceipt`, `InvalidUserOperationReceiptError`). React
  `useUserOpStatus` keeps its behaviour and delegates to them.
- a8ebb69: Share simulation chain and RPC decisions between React and Vue, and add Vue `useSimulateTransfer` and `useTransactionSimulation` composables. Simulation remains a basic revert check with no asset-change or risk coverage. Simulation now rejects a chain override that would reuse another chain's RPC or client; pass a matching RPC URL when overriding the chain.

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
