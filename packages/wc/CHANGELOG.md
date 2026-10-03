# @naculus/connect-appkit-wc

## 0.8.0

No changes in this release.

## 0.7.0

### Patch Changes

- bf0c026: appkit-dropdown-menu and appkit-popover: `aria-haspopup` / `aria-expanded` now
  sit on the slotted trigger element, where screen readers read them, instead of
  a role-less wrapper. The dropdown menu moves real focus between items
  (ArrowUp/ArrowDown/Home/End, skipping separators and disabled items), no
  longer swallows Enter/Space on its trigger, and returns focus to the trigger
  on Escape or selection. The popover's Escape now actually returns focus to the
  trigger.
- 5204dcb: Improve destructive badge contrast in light and dark themes.

## 0.6.0

### Minor Changes

- 1d13406: Requires connect-lib 0.6.0: every connect-lib dependency and peer range moves
  to `^0.6.0` (a `^0.5` range does not admit 0.6.0).

## 0.5.0

No changes in this release.

## 0.4.0

### Minor Changes

- 4f99028: EIP-7702 delegation policies. `createDelegationPolicyFlow().createPolicy({ mode: "eip7702", … })` has the connected account — already delegated to MetaMask's EIP7702StatelessDeleGatorImpl — sign a Delegation to the session key (`signTypedData`, `chainId` inputs on `useDelegationPolicy` in React and Vue); connect-core checks the signature and caveats before attaching it. `createDelegationFrameworkAdapter({ manager, rpc, codec })` is the `eip7702` execution adapter: the session key redeems the delegation from its own address and the chain enforces the caveats; transaction encoding comes from the app (`codec`, e.g. viem). An `eip7702` policy signs only its redemptions (`signPolicyDigest` refuses it). Requires connect-lib 0.4.0: every connect-lib peer and dependency range moves to `^0.4.0` (a `^0.3` range does not admit 0.4.0).

## 0.3.0

### Minor Changes

- Require connect-lib 0.3.0. The `@naculus/connect-core` peer ranges of appkit-core and appkit-ui move from `^0.2.x` to `^0.3.0` (a `^0.2` range does not admit 0.3.0), and the React and Vue dependencies on connect-lib packages follow. No appkit API change: this release keeps the two SDKs in lockstep. connect-lib 0.3.0 is breaking only for apps that use `@naculus/wallet-engine` session keys directly — see its CHANGELOG.

## 0.2.8

### Patch Changes

- Require connect-lib 0.2.8, which binds session-key recipient limits to what is signed. `createDelegationPolicyFlow().createPolicy` now refuses a scope with `allowedRecipients`: this flow's executions sign raw digests, which connect-core 0.2.8 refuses while recipients are limited, so such a policy could be created and previewed as valid yet never sign.

## 0.2.7

No changes in this release.

## 0.2.6

No changes in this release.

## 0.2.5

### Patch Changes

- 46e710d: Detect MetaMask and Phantom providers that were injected before EIP-6963 discovery or do not announce. Apply theme tokens inside the Web Component shadow root.

## 0.2.4

### Patch Changes

- 9cd817d: Correct the published component count from 24 to 28. `packages/wc/src` defines
  28 `@Component` tags and both the React and Vue wrappers generate 28 proxies,
  so the number in the READMEs and in the `wc` package description — which npm
  and market analyses read — was three releases stale.

## 0.2.2

> These entries were written as changesets during 0.2.0 and 0.2.1 but never
> consumed at those releases, so they accumulated. They describe work shipped
> across 0.2.0, 0.2.1 and 0.2.2 rather than 0.2.2 alone, and are collected here
> because deleting them would have thrown away the only written record of what
> those releases contained.

No changes in this release.
