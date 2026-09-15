---
"@naculus/connect-appkit-core": minor
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-vue": minor
---

Expose Solana signer roles. `useSolanaRoles` (React hook and Vue composable)
wraps `@naculus/connector-solana`'s `getRoles`, splitting the connected
account into `identity`, `signer` and `payer`, each `null` when the wallet
declared it cannot fill that role — so a co-signing or relayer-submitted flow
finds out before it opens a dialog that cannot succeed.

The reasoning lives once, in `@naculus/connect-appkit-core` as
`readSolanaRoles`, and adds the part a UI has to decide before it can show
anything: `absence` is `no_session`, `not_solana` or `unreported`, so a
connector that predates the roles API (`@naculus/connector-solana` < 0.2.4)
reads as "has not said" rather than "cannot sign".
