---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-vue": patch
---

Fail closed in three places found in review. `sameExecutionIntent` no longer
treats a field the caller omitted as a wildcard, so an execution adapter
cannot add a target, calldata, value or chain to what the session key signs.
Vue `useSmartAccount` writes address and deployment state only if the
account, chain and manager that started the operation are still current.
`useSendUserOperation` (React and Vue) keeps its single-flight lock across
`reset()` until the in-flight UserOperation settles, so a reset cannot start
a second on-chain submission alongside the first.
