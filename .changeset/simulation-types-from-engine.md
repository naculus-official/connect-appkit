---
"@naculus/connect-appkit-react": minor
---

Simulation types now come from `@naculus/wallet-engine` instead of being copied.

`useTransactionSimulation` carried its own declarations of `SimulationResult`, `BalanceChange`, `ApprovalChange`, `RiskWarning` and friends — re-exported from the package root, so consumers were given the copy. It was not merely duplicated, it was systematically weakened: every constrained type had been widened to `string` or `number`. Address fields accepted any string, `RiskWarning.category` and `severity` accepted any string so a consumer's `switch` lost its exhaustiveness check, and `tokenDecimals` could not express "unknown" — which leaves a caller no option but to guess a precision.

The types are re-exported from the engine now, so a future divergence is a compile error rather than something found by diffing two files.

Also removes `getNativeSymbol`, which was never called and hardcoded chain ID lists including the sunset Goerli, duplicating the `token` field the chain registry already provides.
