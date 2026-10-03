---
"@naculus/connect-appkit-wc": patch
"@naculus/connect-appkit-ui": patch
---

Keep dialogs and payment authorization actions reachable in short, zoomed, and
foldable viewports, and enlarge compact copy and reveal controls' touch areas.

appkit-button never grows wider than its container, and the connected wallet badge truncates a long balance with an ellipsis instead of overflowing on very narrow screens (e.g. a 280 px foldable cover screen).
