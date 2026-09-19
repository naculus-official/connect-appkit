---
"@naculus/connect-appkit-vue": patch
---

Add Vue ERC-20 transfer, approval, and transfer simulation composables backed by the shared strict calldata encoders. Wallet reads and sends remain caller-owned, chain mismatches fail closed, and invalid transfer inputs cannot display a stale simulation result.
