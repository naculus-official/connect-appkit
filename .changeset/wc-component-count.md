---
"@naculus/connect-appkit-wc": patch
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-vue": patch
---

Correct the published component count from 24 to 28. `packages/wc/src` defines
28 `@Component` tags and both the React and Vue wrappers generate 28 proxies,
so the number in the READMEs and in the `wc` package description — which npm
and market analyses read — was three releases stale.
