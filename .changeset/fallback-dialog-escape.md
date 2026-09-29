---
"@naculus/connect-appkit-ui": patch
---

`FallbackDialog` closes on Escape while open (WAI-ARIA modal dialog pattern);
a keyboard user whose dialog hid its close button could not leave it. Its
backdrop is hidden from assistive technology, and decorative icons in the UI
and Web Components carry `aria-hidden`.
