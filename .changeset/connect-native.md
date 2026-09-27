---
"@naculus/connect-native": minor
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-core": minor
"@naculus/connect-appkit-vue": minor
---

New package `@naculus/connect-native` for React Native: AsyncStorage
session persistence, WalletConnect deep links through `Linking`, Solana
Mobile Wallet Adapter as a Wallet Standard wallet, Coinbase Mobile Wallet
Protocol as an injected wallet, and a Keystore-sealed embedded wallet
storage. `Web3ConnectProvider` gains optional `sessionStorage`,
`walletConnect`, `solanaWallets` and `injectedProviders` config (web
behavior unchanged). Requires the connect-lib release with the React
Native hooks.
