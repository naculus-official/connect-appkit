---
"@naculus/connect-appkit-react": minor
---

`useExecuteCalls` — route calls to whatever can honour the requirement, and
refuse when nothing can.

`useSendCalls` already chooses between an EIP-5792 batch and a sequential
fallback, but it chooses silently and always sends something. A caller could
not tell "these landed together" from "the approve landed and the swap did
not".

```ts
const { preview, execute } = useExecuteCalls({
  atomicity: "required",
  userOperation: sendUserOp,   // optional, from useSendUserOperation
});

preview(2);  // → { route, atomic, reason } — nothing sent
await execute(calls);
```

`preview` is the query EIP-5792 exists for: an application can show "these two
will land together" or "these will be sent one by one" before the user commits.
Every plan carries a reason, because an application that refuses to send has to
tell the user something better than "failed".

Three routes. A wallet batch when the wallet reports it can; a UserOperation
when it cannot but a smart account is available, since a UserOperation executes
its calls in one transaction and is atomic by construction; sequential only
when the caller has said a partial outcome is acceptable. When atomicity is
required and none of them applies, `execute` throws before sending anything.
