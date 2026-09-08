---
"@naculus/connect-appkit-ui": minor
"@naculus/connect-appkit-react": minor
---

Add `AccountSelector` and `WalletSecurityPanel`.

`useEmbeddedWallet` already returned the wallet's accounts, but nothing
rendered them — the capability existed and no user could reach it.
`AccountSelector` lists every account the wallet holds and lets the user choose
which one signs.

The EVM row is labelled "Ethereum & EVM" rather than "Ethereum", because that
one address is the user's account on Polygon, Arbitrum and every other EVM
chain. Calling it Ethereum would tell someone their Polygon funds live
somewhere else. Addresses are shown from both ends, never a prefix alone, which
is all an address-poisoning attack needs to look right.

The derive-missing-accounts affordance appears only when a stored phrase can
actually produce another account. A wallet imported from a raw private key has
no phrase and its key is on exactly one curve, so offering it there would
promise a key that cannot exist.

`WalletSecurityPanel` renders the new storage security report: a score with
every lost point attached to the sentence explaining it. It says plainly that
the rubric is this SDK's own rather than an external standard, and it keeps the
hot-wallet signing exposure visible even though it costs no points — that one
is the item users most need to read.

`useEmbeddedWallet` gains `securityReport`. The connector builds a fresh object
per call, so the hook reuses the previous object while the content is
unchanged; returning a new identity every render would make it unusable as an
effect dependency. It is null before a wallet exists rather than a fabricated
worst case, because the storage backend is not chosen until then.

`@naculus/connect-appkit-react` also re-exports `WalletAccount`,
`WalletNamespace`, `WalletData`, `StorageSecurityReport` and
`StorageSecurityFinding`, so a UI package can name what the hook returns
without depending on the connector layer directly.
