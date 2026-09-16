---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
---

Move the chain-abstraction (routing) domain types and decisions into
`@naculus/connect-appkit-core`: `RouteQuote`, `CostComparison`,
`ExecutableQuote` and friends, plus `isQuotableInput`, `compareCostsKey`,
`validateRouteRecipient` and `toExecuteRouteError`. The React `useRouteQuote`,
`useCompareCosts` and `useExecuteRoute` keep their exported names and behaviour
and delegate to them.
