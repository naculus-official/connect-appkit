---
"@naculus/connect-appkit-react": minor
---

Add a fail-closed AA/EIP-7702 policy execution adapter to `useDelegationPolicy`.
The hook now reports on-chain authorization and sponsorship separately, signs
only the exact prepared digest after revalidating scope, and refuses broadcast
when an EIP-7702 delegate does not match the account's live delegation. An
adapter must also prove that it can submit without invoking the main wallet
again before the hook reports promptless broadcast readiness.
