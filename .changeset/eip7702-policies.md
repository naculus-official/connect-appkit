---
"@naculus/connect-appkit-core": minor
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-vue": minor
"@naculus/connect-appkit-ui": minor
"@naculus/connect-appkit-wc": minor
---

EIP-7702 delegation policies. `createDelegationPolicyFlow().createPolicy({ mode: "eip7702", … })` has the connected account — already delegated to MetaMask's EIP7702StatelessDeleGatorImpl — sign a Delegation to the session key (`signTypedData`, `chainId` inputs on `useDelegationPolicy` in React and Vue); connect-core checks the signature and caveats before attaching it. `createDelegationFrameworkAdapter({ manager, rpc, codec })` is the `eip7702` execution adapter: the session key redeems the delegation from its own address and the chain enforces the caveats; transaction encoding comes from the app (`codec`, e.g. viem). An `eip7702` policy signs only its redemptions (`signPolicyDigest` refuses it). Requires the connect-lib release that adds delegation-framework session keys.
