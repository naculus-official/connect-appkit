---
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-ui": patch
---

Stop assuming Ethereum mainnet when no chain is known.

Seven call sites resolved a chain as `requested ?? connected ?? "eip155:1"` (or `?? 1`). Each now refuses instead:

- `useSIWxLogin` and `useSignInWithX` fed that value into the `Chain ID:` field of the CAIP-122 message. With no connected chain the user signed an assertion about mainnet regardless of where the wallet actually was. They now throw `invalid_chain`.
- `Web3ConnectProvider`'s `accountsChanged` handler re-keyed every account to `eip155:1:` CAIP-10 and saved the session, so a session on another chain came back from storage claiming addresses it never had there. It now leaves accounts untouched when the namespace has no EVM chain. The `namespace?.` access before the `if (!namespace) return` guard was also reordered.
- `useTransactionSimulation`, `useSimulateTransfer`, and `useERC20TransferSimulation` previewed against mainnet, describing a transaction that would not be sent. They now throw rather than simulate on a guessed chain.
- `useSmartAccount` and `useSendUserOperation` built UserOperations against mainnet's EntryPoint. The chain ID is part of the UserOperation hash, so this was a signed commitment to a chain the user was never shown. Chain resolution moved to a shared `resolveEvmChainId`, which also adds the CAIP-2 validation `useSmartAccount` never had.

Callers that relied on the implicit mainnet default must now pass an explicit `chainId`.

Also replaces `Math.random` with `crypto.getRandomValues` in the seed-phrase backup shuffle and the SIWx session record ID, matching the CSPRNG used everywhere else in the SDK.
