---
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-ui": patch
---

Normalize both string hashes and embedded-wallet transaction result objects in
`useSendTransaction`, and fail closed when a connector returns no valid EVM
transaction hash. Restore a persisted embedded wallet on mount without
re-exposing its recovery phrase, expose a fail-closed explicit restore action,
and retry one transient empty IndexedDB read without creating a replacement.
Prevent circular EIP-6963 provider objects
from crossing the Web Component JSON boundary by serializing wallet display
metadata only.
