# @naculus/connect-native

## 0.8.1

### Patch Changes

- @naculus/connect-appkit-react@0.8.1

## 0.8.0

### Patch Changes

- 5ab74ff: Depend on and accept connect-lib 0.8.0 (`^0.8.0` dependency and peer ranges), which provides the authorization model and settlement verifiers the authorization consent, listing and payment-verification features use.
- Updated dependencies [561b126]
- Updated dependencies [5ab74ff]
  - @naculus/connect-appkit-react@0.8.0

## 0.7.0

### Patch Changes

- Depend on and accept connect-lib 0.7.0 (`^0.7.0` dependency and peer ranges). A `^0.6.0` range does not admit 0.7.0, so 0.6.x ranges would have pulled a second copy of connect-core or failed peer resolution next to connect-lib 0.7.0.
- Updated dependencies
- Updated dependencies [9a3b14d]
- Updated dependencies [36f0aa5]
  - @naculus/connect-appkit-react@0.7.0

## 0.6.0

### Minor Changes

- 1d13406: Requires connect-lib 0.6.0: every connect-lib dependency and peer range moves
  to `^0.6.0` (a `^0.5` range does not admit 0.6.0).

### Patch Changes

- daa8e45: README: load Solana Mobile Wallet Adapter only on Android. The previous
  example imported `@solana-mobile/mobile-wallet-adapter-protocol-kit` at the
  top of `App.tsx`, which throws on iOS at startup (the native module does not
  exist there) and leaves a blank screen. The package itself never imports it.
- Updated dependencies [1d13406]
- Updated dependencies [48c1f45]
- Updated dependencies [7c079ed]
  - @naculus/connect-appkit-react@0.6.0

## 0.5.0

### Minor Changes

- 2520d0f: New package `@naculus/connect-native` for React Native: AsyncStorage
  session persistence, WalletConnect deep links through `Linking`, Solana
  Mobile Wallet Adapter as a Wallet Standard wallet, Coinbase Mobile Wallet
  Protocol as an injected wallet, and a Keystore-sealed embedded wallet
  storage. `Web3ConnectProvider` gains optional `sessionStorage`,
  `walletConnect`, `solanaWallets` and `injectedProviders` config (web
  behavior unchanged). Requires the connect-lib release with the React
  Native hooks.

### Patch Changes

- Updated dependencies [2520d0f]
- Updated dependencies [3e51807]
  - @naculus/connect-appkit-react@0.5.0
