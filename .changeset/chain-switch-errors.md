---
"@naculus/connect-appkit-react": patch
---

`useSwitchChain` now distinguishes a declined switch from an unsupported chain.

Every failure was collapsed into `chain_unsupported`, so a user pressing Cancel was told the chain was unavailable. EIP-1193 code 4001 now maps to `chain_switch_rejected` and EIP-3326 code 4902 to `chain_unsupported` with a message saying the wallet does not have the chain configured — two outcomes a UI should treat differently, since only one is worth offering to retry.

Mapping lives in a new framework-agnostic `toChainSwitchError`, which also reads a code a wallet sent as a string or nested under `data.originalError`, as WalletConnect does.
