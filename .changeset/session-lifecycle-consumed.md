---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-vue": patch
"@naculus/connect-appkit-ui": patch
---

Consume connect-lib 0.2.6's CAIP-25 session lifecycle: `useSession` (React
and Vue) and the React provider react to `sessionScopeChanged` and
`sessionRevoked`, so a wallet narrowing or ending a session updates app state
on every connector, not only WalletConnect. `isBurnDestination` now delegates
to connect-core's unified `isBurnAddress`. Peer minimum for `@naculus/*` is
`^0.2.6`.
