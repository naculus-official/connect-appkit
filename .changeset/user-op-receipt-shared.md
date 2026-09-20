---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
---

Move ERC-4337 receipt validation and the `eth_getUserOperationReceipt` call
into `@naculus/connect-appkit-core` (`parseUserOperationReceipt`,
`fetchUserOperationReceipt`, `InvalidUserOperationReceiptError`). React
`useUserOpStatus` keeps its behaviour and delegates to them.
