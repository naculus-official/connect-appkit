---
"@naculus/connect-appkit-core": minor
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-vue": minor
---

Add `usePaymentFetch` (React and Vue) for agentic payments: pass the paying
fetch your app built with `createX402Fetch` (`@naculus/payments-x402`) or
`createMppFetch` (`@naculus/payments-mpp`), and the hook returns `payFetch` and tracks
`isPending`, `error` and `lastPayment` (every completed payment is recorded). appkit-core adds `describePayment`, which reads
either protocol's result into one `PaymentRecord` shape. appkit takes no
dependency on the payments packages; what may be paid stays with them and
the session key's policy.
