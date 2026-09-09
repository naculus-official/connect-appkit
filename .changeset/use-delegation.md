---
"@naculus/connect-appkit-react": minor
---

`useDelegation`, and sponsorship in `useExecuteCalls`.

`useDelegation` reports whether the connected EOA delegates under EIP-7702 and
to what. `delegated` stays null until the code has been read and when the read
fails — never false, because that is the answer that misroutes an account which
can in fact batch.

`useExecuteCalls` takes a `sponsorship` requirement alongside `atomicity`, and
refuses before sending when sponsored gas was required and the wallet has said
no paymaster covers it.

Delegation appears in the plan's reason but never changes the route. It is
evidence about the account, not about the wallet's RPC surface: a delegated EOA
behind a wallet that does not expose `wallet_sendCalls` still cannot be asked
to batch. Saying so is the difference between "this cannot work" and "this
wallet has not wired it up", which is the difference between telling a user to
give up and telling them to switch wallets.
