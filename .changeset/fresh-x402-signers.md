---
"@naculus/connect-appkit-core": minor
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-vue": minor
---

Add `useX402Signer` for React and Vue so a connected external EVM wallet can pay through `createX402Fetch`. `findX402Provider` (appkit-core) picks the provider for a session by its wallet type, shared by both frameworks; the resolver reports why no signer is available and supports injected EIP-6963 sessions plus WalletConnect when its EIP-1193 request facade is available.

Raise every connect-lib dependency and peer range from `^0.8.0` to `^0.9.0`; React and Vue now depend on `@naculus/payments-x402` at `^0.9.0`.
