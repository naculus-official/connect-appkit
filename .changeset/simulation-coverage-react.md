---
"@naculus/connect-appkit-react": patch
---

`useTransactionSimulation` reports simulation coverage.

The hook runs an `eth_call`, so it learns whether a transaction reverts, not what it moves. Its results now carry `coverage` saying so, which keeps a consumer's UI from presenting an empty `balanceChanges` as "no changes".
