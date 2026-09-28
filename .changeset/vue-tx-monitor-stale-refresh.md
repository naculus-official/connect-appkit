---
"@naculus/connect-appkit-vue": patch
---

`useTxMonitor` (Vue) no longer lets a superseded `refresh()` publish. Only the newest refresh for the current hash, chain and monitor may write `entry`, `error` or `isLoading`; changing those inputs, going idle, or disposing the scope drops any refresh still in flight (the monitor call itself still runs). An older refresh settling no longer turns `isLoading` off while a newer one is pending. Switching hashes clears the previous transaction's `entry` immediately instead of showing it until the new watch resolves, and a refresh that finds no status for the transaction clears `entry` rather than keeping stale data.
