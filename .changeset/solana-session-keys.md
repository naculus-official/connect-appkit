---
"@naculus/connect-appkit-core": minor
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-vue": minor
---

Add `useSolanaSessionKey` (React and Vue) and appkit-core
`createSolanaSessionKeyFlow`: create a Solana session key that the
connected wallet approves once as the SPL delegate of its token account
(then pays x402 / MPP Solana charges without a prompt through
`solana: { sessionKey: { manager, id }, rpc }`), list the owner's keys, and
revoke one (locally at once, then the wallet's on-chain `Revoke`). A key
whose approval is declined or cannot be broadcast is revoked locally; if the
broadcast outcome is unknown the error says so, and `revoke(id)` sends the
on-chain `Revoke`. Requires the
connect-lib release that adds `SolanaSessionKeyManager`.
