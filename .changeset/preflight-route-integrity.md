---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
---

Preserve preflight execution guarantees through the actual send. Required
atomic batches no longer get silently replanned as sequential sends when
capability discovery is unavailable, sponsorship support is read from the
wallet response, and a UserOperation fallback cannot bypass a required-gas
sponsorship refusal.

Capability and EIP-7702 delegation hooks now discard slow responses from a
wallet or account that disconnected while the request was in flight. Unknown
EVM chains also remain unlabeled instead of being presented as ETH.
