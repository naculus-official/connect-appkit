---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
---

Move the process-wide `SessionKeyManager` registry and its spending-config
guard into `@naculus/connect-appkit-core` (`getSharedSessionKeyManager`,
`resetSharedSessionKeyManager`, `sessionKeyConfigFingerprint`). The React
session-key hooks keep their exports and delegate to it.
