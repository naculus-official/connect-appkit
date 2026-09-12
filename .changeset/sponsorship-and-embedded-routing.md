---
"@naculus/connect-appkit-react": minor
"@naculus/connect-appkit-ui": patch
---
<!-- cspell:ignore appkit -->

Add explicit ERC-7677 paymaster routing to call execution and fail closed when
an application requires sponsorship but has no app-controlled sponsored
UserOperation path.

Embedded and passkey sessions now use their own connector when a chain switch
falls back outside SessionManager, instead of being sent to WalletConnect. The
chain selector also logs the underlying connector cause when a switch fails.
An embedded wallet now retains its confirmed storage-security tier after a
session disconnects instead of being misreported as plaintext localStorage.
