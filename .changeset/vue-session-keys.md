---
"@naculus/connect-appkit-vue": patch
---

Add Vue `useSessionKeys`, `useCreateSessionKey`, `useRevokeSession` and
`useSendWithSession` over connect-core's `SessionKeyManager`, sharing the
process-wide instance and config guard with React or taking a caller-owned
manager.
