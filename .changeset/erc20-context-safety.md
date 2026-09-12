---
"@naculus/connect-appkit-react": patch
---

Bind ERC-20 allowance, approval, and transfer operations to their token, chain,
account, spender, and client context. Changing context clears displayed allowance
and prevents pending reads from restoring stale state. Stale refetches return
null, and pending decimals lookups or simulations stop before requesting a
signature after a context change.

Check the token chain before reading approval decimals. Surface allowance RPC
errors, preserve unknown precision instead of guessing 18 decimals, and use the
shared amount formatter. The previously added refetchAllowance return value
remains bigint or null so hasAllowance can use the first awaited result.
