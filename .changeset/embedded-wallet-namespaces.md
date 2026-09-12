---
"@naculus/connect-appkit-react": minor
---

`useEmbeddedWallet` exposes the wallet's accounts, one per namespace.

The engine gained a Solana account alongside the EVM one, but this hook still
returned a single `address`, so nothing built on appkit could reach it. It now
returns `accounts`, `activeNamespace`, `setActiveNamespace` and
`backfillAccounts`.

`setActiveNamespace` publishes a new wallet object rather than relying on the
mutation the connector performs. Without that React keeps rendering the
previous address while signing happens on the new account — a mismatch a user
acts on before anyone notices. It rejects a namespace the wallet holds no
account for, which is the ordinary case for a wallet imported from a raw key.

`backfillAccounts` derives the accounts a stored phrase produces but an older
record does not yet hold. Those accounts already exist — the same phrase in
Phantom shows the balance — so this makes them visible here rather than leaving
funds reachable everywhere except in this app. It leaves the active namespace
alone: someone who had an Ethereum wallet yesterday should not find themselves
on Solana today.

`importFromPrivateKey` widens from `` `0x${string}` `` to `string`, so the
base58 and JSON forms Phantom and `solana-keygen` export can be pasted in. The
engine detects which chain the key belongs to and enables only that one.
