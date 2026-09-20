---
"@naculus/connect-appkit-core": patch
"@naculus/connect-appkit-react": patch
---

Move the smart-account decisions shared by React and Vue into
`@naculus/connect-appkit-core`: `resolveUserOpChain` (fail-closed chain
selection and mismatch check), `buildSmartAccountConfig` and
`assertHexSignature`. React `useSmartAccount` / `useSendUserOperation`
delegate to them and use the shared `bareEvmAddress`.
