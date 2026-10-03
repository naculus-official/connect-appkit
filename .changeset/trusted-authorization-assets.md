---
"@naculus/connect-appkit-core": minor
---

Trusted assets: `describeAuthorization` and `explainSpend` accept `trustedAssets` (CAIP-19 IDs; EVM token addresses compared case-insensitively). Each grant reports `assetTrust` (`trusted`, `unverified`, or `unchecked` when no list is given, which keeps the previous output). An unverified asset never shows caller-supplied metadata: its label is the token address and amounts are in base units, so a token that merely calls itself "USDC" cannot read as USDC. The web and React Native consent and listing components take `trustedAssets` and show "Unverified token — not on the trusted list".

Amounts are grouped without `toLocaleString`, so React Native (Hermes, which ignores the locale for BigInt) shows "2,000,000" like the web does.
