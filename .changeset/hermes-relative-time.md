---
"@naculus/connect-appkit-core": patch
---

`describeAuthorization` no longer crashes on React Native: Hermes ships no `Intl.RelativeTimeFormat`, so the relative expiry ("in 3 days", "2 hours ago") now falls back to the English form instead of throwing `undefined cannot be used as a constructor`.
