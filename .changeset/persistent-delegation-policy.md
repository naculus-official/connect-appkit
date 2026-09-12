---
"@naculus/connect-appkit-react": minor
---

Add a signed, persistent off-chain delegation-policy lifecycle that combines
session-key scope enforcement, wallet authorization, on-chain delegation reads,
and execution preview without claiming an EIP-7702/AA broadcast path. Browser
session keys now use localStorage, embedded wallet state omits recovery secrets,
restore retries clear stale errors, and sequential call sends normalize real
transaction hashes from embedded connectors. Policy creation requires a
host-provided encryption key, and restored policies are cryptographically
revalidated against their persisted scope, signer, and origin before use. The
final digest-signing path repeats that verification inside the same locked
operation that consumes policy budget, preventing a cross-tab policy swap
between preview and signing.
