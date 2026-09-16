---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-vue": patch
---

Move destination-address validation and the CAIP-10 → bare address split into
`@naculus/connect-appkit-core` (`validateDestination`, `isBurnDestination`,
`bareEvmAddress`). The React `validateDestination` / `useValidateDestination`
keep their public shape and strings and now delegate to it; the Vue balance and
delegation composables use the shared split instead of local copies.
