---
"@naculus/connect-appkit-react": minor
---

Wallet-initiated account and chain changes now work for every namespace, not just injected EVM wallets.

`Web3ConnectProvider` used to subscribe by importing `eip6963Connector` directly, calling `getDiscoveredWallets()`, and attaching to the raw EIP-1193 provider — gated on `walletType === "eip6963"`. A Solana or WalletConnect account switch was never noticed, and the provider re-implemented the CAIP-10 re-keying the connector already did.

`Web3Client` gains `onAccountsChanged` and `onChainChanged`, dispatched to the connector carrying the session like every other session-routed call. Both return an unsubscribe function, and both return a no-op rather than undefined when the connector cannot report, so the result is safe to pass straight to a `useEffect` cleanup.

`useERC20Context` now identifies a context by value rather than by object reference. It keyed on `publicClient`, `walletClient`, `session`, and `client` identity; `publicClient` is memoized on `currentChain`, which is memoized on `config.chains`, so a consumer passing an inline `config` object produced a new identity every render — work that was still current reported itself stale, and the callbacks keyed on the identity re-fired their effects. A stale context now throws `session_inactive` rather than `wallet_unavailable`, which pointed at the wrong thing.
