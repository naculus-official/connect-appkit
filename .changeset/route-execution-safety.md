---
"@naculus/connect-appkit-react": minor
---

Fix `useExecuteRoute` and `useCompareCosts`, both public exports that were entirely untested.

`useExecuteRoute` executes cross-chain transfers:

- It held a `mountedRef` initialised to `true` that nothing ever set to `false`, so every `if (mountedRef.current)` guard was dead code and the hook wrote state after unmount regardless. The unmount effect is now present.
- There was no concurrency guard, so a double-pressed button submitted the same route twice. It now refuses with `execution_in_progress`, matching `useSendUserOperation`. `reset()` deliberately does not release the guard: a request already handed to the executor is still outstanding.
- `execute` returned `Promise<void>`, so a caller awaiting it could not tell whether the funds moved — `result` belongs to a later render. It now resolves with the result, or `null` on failure. Existing callers ignoring the value are unaffected.
- Failing with no executor left the previous run's transaction hash in `result`, which reads as though something was sent. It is now cleared.

`useCompareCosts` decides which route is shown as cheapest:

- `chains` (an array) and `options` (an object) were dependencies by reference, so the natural call site — passing them inline — changed the callback identity every render and re-fired the effect: an unbounded loop against a cost API. Both are now keyed by value, with an order-independent options key that also survives a cyclic object rather than throwing during render.
- There was no request-generation guard, so a comparison for a chain set the user had moved on from could resolve last and become the displayed answer.
