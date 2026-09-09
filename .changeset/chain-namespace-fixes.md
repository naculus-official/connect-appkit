---
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-vue": minor
---

Stop offering chains a connected wallet cannot switch to.

`useChain().availableChains` returned every configured chain regardless of
what was connected. A Solana wallet was shown Ethereum and Polygon in the
switcher, and clicking one asked a wallet with no concept of EIP-155 to switch
to chain 137 — an action the interface presented as available and that could
never work. It now filters to the connected namespace, and offers everything
only when nothing is connected yet, since nothing has been ruled out then.

`chainInfo` returned null for any namespace other than EIP-155, so a connected
Solana wallet had no chain to display and the interface fell back to "Unknown
Chain". It now describes every namespace, and names an unconfigured chain by
its CAIP-2 reference rather than inventing "Chain 5" for a Solana cluster.

`getChainById` and `useChain` both stop parsing CAIP-2 by hand and use
`@naculus/connect-core`.

`useAccount` reads each account's namespace from its CAIP-10 form instead of
guessing from address shape, and falls back to shape only for a bare address —
a bare `0x`-40-hex value is unambiguously EVM, a bare base58 string is not
unambiguously anything.

Vue gains `useAccounts`, applying the same rules from the same core functions.
The two bindings differ in `computed` versus `useMemo` and nothing else.
