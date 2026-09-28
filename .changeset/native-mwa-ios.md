---
"@naculus/connect-native": patch
---

README: load Solana Mobile Wallet Adapter only on Android. The previous
example imported `@solana-mobile/mobile-wallet-adapter-protocol-kit` at the
top of `App.tsx`, which throws on iOS at startup (the native module does not
exist there) and leaves a blank screen. The package itself never imports it.
