---
"@naculus/connect-appkit-core": patch
---

`normalizeEip155ChainId` refuses chain 0 and chain IDs above
`Number.MAX_SAFE_INTEGER`; it accepted `0x0` / `eip155:0` before, which is not
an EIP-155 chain. Matches connect-core's reader of the same name.
