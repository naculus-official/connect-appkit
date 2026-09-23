---
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-vue": minor
---

Add `useDelegate` (React and Vue): the EIP-7702 owner path for the embedded
wallet — `delegate(address)` sends a type-4 transaction delegating the
connected account to an allowlisted implementation, `revoke()` clears it.
Thin shells over connect-core's `delegateAccount`; the allowlist is required
and empty by default, and other wallets fail with `method_unsupported`.
Requires `@naculus/connect-core` 0.2.7 (peer minimum raised with that
release).
