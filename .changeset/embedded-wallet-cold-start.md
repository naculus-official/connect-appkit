---
"@naculus/connect-appkit-react": patch
---

Wait for the lazily loaded embedded connector before create, import, connect,
wipe, and account-backfill operations. This prevents cold-start actions from
failing with `Embedded wallet not enabled` while the enabled connector chunk is
still loading.
