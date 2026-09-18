---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-vue": patch
---

Share simulation chain and RPC decisions between React and Vue, and add Vue `useSimulateTransfer` and `useTransactionSimulation` composables. Simulation remains a basic revert check with no asset-change or risk coverage. Simulation now rejects a chain override that would reuse another chain's RPC or client; pass a matching RPC URL when overriding the chain.
