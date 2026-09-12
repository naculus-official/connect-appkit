---
"@naculus/connect-appkit-react": minor
---

`useSendCalls` exposes `showCallsStatus`.

Asks the wallet to display the bundle. It resolves to whether the wallet showed it rather than throwing, because a refusal is cosmetic — the bundle is unaffected — and a caller should not surface a transaction error for something that is not one. It declines for a sequential send, where the stored handle is a transaction hash and there is no bundle to look up.

`Web3Client` gains a matching optional `showCallsStatus`, dispatched to the connector that sent the bundle.
