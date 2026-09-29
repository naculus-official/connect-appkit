---
"@naculus/connect-appkit-react": patch
---

`useUserOpStatus` auto-starts tracking whenever `userOpHash` is provided,
including when it arrives after the first render (the usual case: the hash is
known only once the operation is sent). It used to check only on mount, so a
later hash was never tracked. `autoStart: false` still disables it.
