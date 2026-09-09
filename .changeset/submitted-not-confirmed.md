---
"@naculus/connect-appkit-react": major
---

**Breaking:** `useSendTransaction` and `useSendCalls` report `"submitted"`
where they used to report `"confirmed"`.

Neither hook was in a position to say confirmed. `sendTransaction` resolves
with a transaction hash, and a hash means the wallet broadcast it — not that it
was mined, and not that it succeeded. `wallet_sendCalls` is a step further
away: it answers with a bundle identifier, and EIP-5792 explicitly allows a
wallet to accept the calls and send them later.

An interface branching on `status === "confirmed"` therefore told a user their
payment had gone through at the moment the wallet accepted it, while it could
still revert, be dropped, or never be included.

`useTxMonitor` and `useUserOpStatus` keep `"confirmed"`, because they poll for
a receipt and it is true there. `getCallsStatus` is what turns a bundle
identifier into an outcome.
