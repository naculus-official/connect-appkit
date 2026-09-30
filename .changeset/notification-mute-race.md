---
"@naculus/connect-appkit-react": patch
---

`useNotification`: `muteChain` / `unmuteChain` compute the muted list from
the latest state. Several calls in one tick (mute A, mute B) started from the
same captured list, so the later call dropped the earlier chain. The Vue
composable was not affected (its settings ref updates synchronously).
