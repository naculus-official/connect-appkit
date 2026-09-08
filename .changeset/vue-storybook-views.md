---
"@naculus/connect-appkit-ui": minor
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-vue": minor
---

A Vue binding for the passphrase gate, and stories for the wallet components.

`usePassphraseGate` is now available as a Vue composable. The gate itself moved
to `@naculus/connect-core`, because the problem it solves — an encrypted
storage adapter asking for a passphrase from inside code that has never heard
of a component — is the same in both frameworks and deserved one
implementation rather than two.

`AccountSelector`, `WalletSecurityPanel`, `PassphraseDialog` and `PasskeySetup`
each gained a presentational `*View` export, with the existing component a thin
wrapper that supplies the data. Every interesting state in these — a passkey
that cannot unlock, a record awaiting re-seal, a retry after a failed decrypt,
a wallet imported from a raw key — is otherwise reachable only by arranging a
real authenticator or a real failure. The views are exported because Storybook
is a second consumer and so is any application holding its own state.

`.storybook/main.ts` only globbed `packages/wc`, so the three story files in
`packages/ui` had never been loaded by Storybook at all. They are now, along
with 22 new stories.

The embedded connector reports account changes, so `client.onAccountsChanged`
now routes `embedded` to it instead of returning a no-op.
