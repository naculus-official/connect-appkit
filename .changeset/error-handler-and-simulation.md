---
"@naculus/connect-appkit-react": patch
---

`useWeb3ErrorHandler`'s `wrapAsync` no longer destroys the error it wraps.

It built a fresh `Error` from the friendly description and threw that, discarding the wallet's own message, any `details`, the stack, and — the part callers notice — the class, so `err instanceof WalletError` stopped matching the moment they adopted the wrapper meant to help them. The friendly title and description are now attached to the original error, which is re-thrown as-is. A code the error already carries is left alone rather than being replaced by one this module inferred from message text; a non-`Error` rejection is still reachable through `cause`.

`useSimulateTransfer` now forwards the RPC URL it computes. `actualRpcUrl` was assigned and never used, so a caller's per-call endpoint did nothing and the simulation ran against whichever URL happened to be baked into the engine's manager on first use.

Both hooks were entirely untested.
