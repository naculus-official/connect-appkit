---
"@naculus/connect-appkit-ui": patch
---

`ThemeProvider` drops theme values containing `;`, `{`, `}`, `<`, `>`, a
backslash or a line break instead of writing them into its `<style>` element,
and renders that element's text as a child rather than through
`dangerouslySetInnerHTML`. A theme taken from outside the app (a URL parameter,
a stored preference) could otherwise inject arbitrary CSS.
