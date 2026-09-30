---
"@naculus/connect-appkit-ui": minor
---

The React components now ship their styles. `import "@naculus/connect-appkit-ui/styles"` loads tokens, the small reset and the compiled component utilities; no Tailwind setup is needed in the app. The component CSS writes values into each class and defines no `:root` variables, so it does not override an app's own Tailwind theme. Apps without a page reset of their own can also import the opt-in `@naculus/connect-appkit-ui/styles/preflight`. Components that read a base control from the registry (AccountButton, ChainSelector, ErrorBoundary, RouteSelector, SeedPhraseBackup, SignInButton, SmartWalletSettings, SmartWalletToggle) fall back to a native control instead of crashing when none is registered.
