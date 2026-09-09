---
"@naculus/connect-appkit-ui": patch
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-core": minor
---

Finish removing the fabricated currency symbol, and stop building the viem
chain three times.

Making `useBalance().symbol` nullable was undone one layer down:
`AccountButton` rendered `balanceSymbol ?? "ETH"` and `ConnectButtonAdapter`
passed the same fallback into the web component. Those are the two places a
user actually reads it, so the label said "ETH" beside a MATIC or SOL amount
regardless. Both now render no unit rather than the wrong one.

`toViemChain` replaces three identical inline blocks in `useBalance`,
`useTokenBalance` and `useViemClient` — three copies of the same `?? "ETH"`,
which is three places for it to be wrong. The native symbol now comes from the
chain's own `token`, then the shared chain registry, and only then a fallback
that is reached solely for an EVM chain nobody has a record of. viem requires
a string there and does not render it; the symbol a user reads stays null when
unknown.

The extraction introduced a render loop on the way — a freshly built chain
object every render changed the memo key of the client effects, which never
settled. It is memoised, and a test now pins the clients holding still across
renders.
