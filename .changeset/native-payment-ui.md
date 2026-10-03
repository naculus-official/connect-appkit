---
"@naculus/connect-native": minor
---

Payment UI for React Native: `AuthorizationConsentNative`, `AuthorizationListNative` and `PaymentReceiptNative`, the native counterparts of the web `AuthorizationConsent`, `AuthorizationList` and `PaymentReceipt`. They render the same `@naculus/connect-appkit-core` view models (`describeAuthorization`, `explainSpend`, `formatAuthorizationAmount`, `PaymentRecord`) with plain `react-native` primitives, themed by `NativePaymentTheme` (light and dark palettes from the appkit tokens). Copy actions call the app's `onCopy(text)`; no clipboard dependency is added. `@naculus/connect-appkit-core` is now a peer dependency.
