---
"@naculus/connect-appkit-react": major
"@naculus/connect-appkit-ui": major
---

**Breaking:** `WalletChain` is keyed by CAIP-2, and `useBalance().symbol` can
be null.

`WalletChain` was `{ id: number; namespace: Namespace; ... }`. A number can
only ever describe an EIP-155 chain: a Solana reference is base58
(`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`) and an XRPL one is an unsigned
network id. The chain registry structurally could not hold a non-EVM chain, so
every non-EVM path fell out to "unknown" — and every lookup had to reconstruct
`` `${namespace}:${id}` `` or pull an integer back out of a CAIP-2 string.

```diff
- { id: 137, namespace: "eip155", name: "Polygon", token: "MATIC" }
+ { caip2: "eip155:137", name: "Polygon", token: "MATIC" }
```

`namespace` is gone rather than kept alongside: two fields that must agree are
two fields that eventually do not. Read it with `chainNamespace(chain)`, and
get the EIP-155 number with `chainNumber(chain)` — which returns null for a
chain that has none, because there is no number that means "Solana" and any
stand-in addresses a real EVM chain.

**`useBalance().symbol` is `string | null`.** It was `currentChain?.token ??
"ETH"`, rendered directly beside the amount. On Polygon that labelled MATIC as
ether; connected to Solana it labelled SOL as ether. The same fallback is
removed from `AppKit`'s `balanceSymbol`. Show the amount without a unit rather
than naming the wrong one.

`useViemClient` and `useTokenBalance` now build no client at all for a non-EVM
chain instead of passing a fabricated chain number to viem.

Three more hand-rolled CAIP-2 parsers are gone — `useBalance`,
`useTokenBalance` and `getChainById` each had their own copy of
`startsWith("eip155:")` plus `parseInt(split(":")[1])`. All of them now go
through `@naculus/connect-core`.
