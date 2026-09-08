---
"@naculus/connect-appkit-ui": minor
"@naculus/connect-appkit-react": minor
---

Add the passphrase prompt and passkey registration UI.

Encrypted storage and passkey unlock existed, but nothing could ask the user
anything: `PocketWallet` takes `encryptionPassphrase` as a callback invoked
from inside the storage adapter, before React has rendered, so a dialog could
not be that callback. Every app had to build the bridge itself, which is the
same as the feature not being there.

`PassphraseGate` is that bridge. The callback resolves a promise a dialog
fulfils. Set `passphrasePrompt: true` on the client and mount
`<PassphraseDialog />`; the gate is created, wired in, and exposed as
`client.passphraseGate`. A callback you supply yourself still wins.

Details that decide whether this works rather than merely runs:

- The passphrase is held for the session. Prompting on every save is how a
  user ends up turning encryption off.
- Concurrent loads and saves share one prompt instead of stacking two dialogs
  asking the same question.
- `useEmbeddedWallet` drops the held passphrase when a load fails to decrypt.
  Without that the gate hands the same wrong value to every retry, and the
  user is told their passphrase is wrong while never being asked for a
  different one.
- The dialog knows whether it is asking for a new passphrase or an existing
  one, and defaults to existing. Showing "choose a passphrase" during an
  unlock invites someone to invent a new one and conclude the wallet is
  broken.
- Cancelling rejects the operation that asked, rather than resolving with
  something unreadable.

`PasskeySetup` registers a credential and re-seals the stored record under it.
It reports the outcome honestly instead of as a generic success: PRF cannot be
added to an existing credential, so a passkey that cannot unlock has to say so
and say that a new one is needed. "Not checked yet" is shown as its own state
rather than as failure. It states at the point of enabling that a passkey
protects the local copy and is not a backup.

When both `enablePasskeys` and encryption are on, `prfUnlock` is wired
automatically — the platform supporting it is the enable step. Where the
authenticator cannot answer it returns null and the record stays
passphrase-only, so wiring it without asking cannot break anything.

There is no strength meter. A colour computed from character classes rates
`P@ssw0rd!` above four ordinary words, which is backwards; the dialog enforces
the NIST SP 800-63B minimum of 8 and says that length beats symbols.
