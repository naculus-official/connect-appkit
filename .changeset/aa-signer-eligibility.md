---
"@naculus/connect-appkit-react": minor
---

`useSendUserOperation` now signs with an embedded wallet, and explains precisely why a passkey cannot.

Both used to receive the same "raw UserOperation signing is not available" refusal, but they are not the same situation. An embedded wallet holds a secp256k1 key and only lacked a primitive that signs a digest rather than text — now provided by `@naculus/connector-embedded`'s `signHash`. A passkey signs with P-256 (COSE alg -7), which a SimpleAccount cannot verify at all; that needs an account implementation with a WebAuthn validator, or the RIP-7212 precompile where it exists. The error now says which case the caller is in, because one is a version bump and the other is a different smart account.
