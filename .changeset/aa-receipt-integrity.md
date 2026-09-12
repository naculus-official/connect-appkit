---
"@naculus/connect-appkit-react": patch
---

Prevent UserOperation status polling from confirming stale, mismatched, or malformed bundler receipts. Missing bundler configuration and exhausted HTTP or JSON-RPC failures now reach an explicit terminal error.
