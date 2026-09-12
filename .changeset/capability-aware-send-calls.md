---
"@naculus/connect-appkit-react": minor
---

`useSendCalls` now asks the wallet what the account can do before assuming it can batch.

Previously the hook called `sendCalls` unconditionally, so a wallet without EIP-5792 support simply failed. It now queries capabilities, and:

- batches when the wallet advertises atomic execution, passing `atomicRequired: true` so the wallet must honour it or reject rather than silently splitting the batch;
- falls back to sequential `sendTransaction` calls otherwise, including when the wallet cannot be asked at all;
- exposes `execution` (`"atomic-batch" | "sequential" | null`) so a caller can tell which guarantee it received, and refuses `getCallsStatus` after a sequential send, where the stored handle is a transaction hash rather than a bundle ID.

A sequential send is not atomic: an earlier call can land while a later one fails, and the thrown error now names how many already landed. Callers that require all-or-nothing should check `execution` or query capabilities directly.

`Web3Client` gains an optional `getCapabilities`, and `sendCalls` gains an optional fourth `options` argument. Both are additive.
