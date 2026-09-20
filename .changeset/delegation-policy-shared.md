---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
---

Move the signed off-chain delegation-policy flow into
`@naculus/connect-appkit-core` (`createDelegationPolicyFlow`,
`buildDelegationPolicyMessage`, `sameExecutionIntent`, the policy/adapter
types). The React `useDelegationPolicy` keeps every export and behaviour and
now only wires React state and provider hooks to the shared flow.
