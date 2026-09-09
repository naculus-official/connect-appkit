---
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-vue": minor
---

Solana reaches the application layer.

The engine could hold a Solana account, sign with it and send a transaction,
but appkit had no Solana hook of any kind — an application could not read a
balance or submit anything.

`useSolanaAccount` reads the connected Solana account off the session's
namespaces, so an injected wallet and the embedded wallet answer the same way.
It matches on the `solana:` namespace and never on address shape, because base58
is not distinguishable by inspection and guessing would eventually call
something a Solana address that is not one.

`useSolanaBalance` leaves `balance` null until a read succeeds, and clears it
when one fails. A zero placeholder is a number a user reads as their balance,
and a stale figure beside an error is worse. `isConfigured` reports a missing
RPC endpoint as its own fact — the only one a caller can act on.

`useSolanaTransaction` signs and sends through whichever wallet is connected.

Two gaps in the client that this exposed:

- `sendTransaction` typed its input as `Record<string, unknown>`, which is an
  EVM transaction's shape. A Solana transaction is bytes the application has
  already serialized, so it could not be expressed at all even once the
  connector below knew how to handle it.
- There was no `signTransaction` on the client. A Solana application routinely
  signs a transaction it submits itself or hands to a relayer, and there was no
  way to ask for that.

The Vue package gains `useSolanaBalance` too. Everything that took thought
lives in `@naculus/connect-core`; what does not translate between the two
frameworks is only the reactivity.
