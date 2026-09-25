---
"@naculus/connect-appkit-vue": patch
---

Invalid and changed inputs now supersede pending requests in `useRouteQuote`,
`useCompareCosts`, `useTransactionSimulation` and `useSolanaBalance`, so a
late result or error from an older request can no longer write state. When
the input no longer permits a request (empty or unquotable route input, no
chains, no transaction, no Solana address or endpoint, or no quote/compare
function), the loading flag turns false at once instead of staying true until
the next request. In `useRouteQuote`, changing to another valid input
invalidates the running quote immediately rather than when the debounced
replacement starts: its late quotes or error are dropped and `loading` stays
true until the replacement settles. Visible errors and the existing
clearing of quotes, comparisons and balances are unchanged.
