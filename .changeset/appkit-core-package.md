---
"@naculus/connect-appkit-core": minor
"@naculus/connect-appkit-react": major
"@naculus/connect-appkit-vue": minor
"@naculus/connect-appkit-ui": patch
---

New package: `@naculus/connect-appkit-core`, the half of appkit that is not
about React.

appkit's stated shape is "write the Stencil components once, generate the
React and Vue wrappers". That works for anything visual and never covered the
logic: the React package carried roughly 8,500 hand-written lines against
Vue's 280, and only two files in it contain JSX. The rest was logic wearing
React clothes, reachable from exactly one framework — so a Vue application got
components and no way to use them.

Moved, unchanged: the connection state machine, chain resolution, token chain
and decimals handling, provider error mapping, revert-reason decoding, the
name resolver, and the types they are built on. Every one of them already
imported no framework; they were simply in a package that did.

`@naculus/connect-appkit-react` re-exports all of it, so a React consumer sees
no change. **Breaking only for a consumer importing from a deep path** such as
`@naculus/connect-appkit-react/dist/core/...`.

`WalletChain`, `ChainInfo`, `ConnectionStatus` and `Web3State` are now defined
once, in the new package, and re-exported by React rather than declared twice.
Two structurally identical declarations typecheck fine and drift on the first
edit.

Vue gains `useChain`, which was not previously possible: `currentChain`,
`chainInfo`, `availableChains`, `currentChainNumber` and `namespace`. The file
contains no decision of its own — filtering the switcher to the connected
namespace, describing non-EVM chains, and refusing to invent a chain number
for Solana are all properties of the shared core, so both bindings get them or
neither does.
