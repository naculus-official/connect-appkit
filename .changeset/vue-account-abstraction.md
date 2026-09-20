---
"@naculus/connect-appkit-vue": patch
---

Add Vue `useSmartAccount`, `useSendUserOperation` and `useUserOpStatus` over
connect-core's `SmartAccountManager` and the shared appkit-core decisions.
Deployment goes through the caller's transaction sender and the
UserOperation signer is caller-supplied.
