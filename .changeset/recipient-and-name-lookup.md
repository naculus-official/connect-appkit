---
"@naculus/connect-appkit-react": minor
---

Validate the recipient before a cross-chain route executes, and fix the two name-resolution hooks.

`useExecuteRoute` could not check `recipient` because its own `Quote` type — a local shadow of core's `Route`, which has `toChain` — kept no field describing the destination. An EVM-shaped check would have rejected every legitimate Solana and XRPL address. `Quote` now carries an optional `toChain` (CAIP-2); when present the recipient is validated for that namespace with the same `isValidAddress` the connectors use, and when absent the executor decides as before. An empty recipient is rejected either way, since that is wrong on every chain. A rejection does not consume the concurrency guard.

Note that `Quote` as exported from the package root is `useRouteQuote`'s type, which has entirely different fields (`netReceiveFormatted`, `toTokenSymbol`). A quote from that hook satisfies `useExecuteRoute`'s structurally, so `totalCost` and `estimatedTimeMs` arrive undefined and `toChain` must be supplied by the caller. The two types are now documented rather than silently divergent.

`useResolveName` and `useLookupAddress` were near-identical copies and shared three defects, now fixed once in a common `useNameLookup`:

- No request-generation guard, so typing quickly left two lookups in flight and an earlier one resolving last overwrote the later result — pairing one address with a different address's name, which is what a user reads before deciding where to send.
- The resolver was captured into a ref on first render and never rebuilt, so changing `resolverConfig` had no effect.
- The de-duplication guard closed over `data` without listing it as a dependency, testing a value from an earlier render.

Clearing the input now also discards a lookup already in flight, so an abandoned query cannot fill the field back in.
