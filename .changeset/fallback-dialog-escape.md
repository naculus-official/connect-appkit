---
"@naculus/connect-appkit-ui": patch
---

Decorative icons in the UI and Web Components (chevrons, checks, chain marks)
carry `aria-hidden`, so screen readers skip them. (The internal
`FallbackDialog`, not exported, also closes on Escape now.)
