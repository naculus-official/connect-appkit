---
"@naculus/connect-appkit-react": minor
---

`useCapabilities` — ask what the wallet can do before choosing how to execute.

EIP-5792's four methods were all implemented at the connector layer, and
`useSendCalls` could send a batch, but there was no way for an application to
run the query the standard exists for: find out whether this wallet batches
atomically, *then* pick an execution path. The only route was reaching through
`useWeb3().client.getCapabilities(session)`, which is neither documented nor
obvious.

```ts
const { atomic, current, capabilities } = useCapabilities();
```

`atomic` has three values. A wallet that does not implement
`wallet_getCapabilities` has not said no — it has said nothing, and EIP-5792 is
explicit that absence is not a denial. Collapsing that to `false` would send
every silent wallet down the sequential path, which is the one where an approve
lands and the swap it was for fails. `"unknown"` also covers a query still in
flight and a query that failed; a stale capability map from a previous wallet
is a worse answer than no answer, so a failure clears it.

Both wire shapes are read: `atomic: { status }` from 2.0.0, where `"ready"`
counts as a yes, and the still-deployed `atomicBatch: { supported }` draft.
Hex chain keys are matched as well as CAIP-2 ones, so a wallet reached through
a custom connector is not reported as unknown next to an entry that is right
there.
