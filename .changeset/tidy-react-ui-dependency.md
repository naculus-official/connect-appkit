---
"@naculus/connect-appkit-react": patch
---

Remove the unused optional dependency on `@naculus/connect-appkit-ui`. The React package never imports the UI package; applications that use the UI components must install `@naculus/connect-appkit-ui` explicitly.
