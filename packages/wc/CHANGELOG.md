# @naculus/connect-appkit-wc

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
