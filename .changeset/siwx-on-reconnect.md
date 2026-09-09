---
"@naculus/connect-appkit-react": major
"@naculus/connect-appkit-ui": major
---

**Breaking:** SIWx runs on reconnect, and `validateDestination` no longer
calls an address "safe".

**`required: true` was enforced once and skipped on every refresh.** Every
entry point — `connect`, `connectInjected`, `connectEmbedded`,
`connectPasskeys`, `completePairing` — ran the SIWx flow before reporting
`connected`. `reconnect` did not, and `autoConnect` defaults to true, so
reconnect is the path taken on every page load. An application configured with
the strongest setting got it applied at first connect and bypassed from then
on: a restored session reported `connected` with no signature produced in that
session at all.

Reconnect now re-authenticates when SIWx is required. To avoid a prompt on
every reload, supply `siwx.hasValidSession` — return true from your own
session check, which is what `useSIWxSession`'s expiry tracking is for. Absent
means unknown, and unknown re-authenticates: a signature prompt is a nuisance,
treating an unverified session as signed in is not. A check that throws also
re-authenticates rather than being read as a yes.

Optional SIWx (`required: false`) is left alone on reconnect. Prompting on
every reload for something the application said it can live without is the
wrong trade.

**`AddressValidationLevel` renames `"safe"` to `"ok"`**, and the dialog reads
"No problem found" instead of "Safe". The function checks four things: that an
address is non-empty, well formed, and not the zero or a burn address. It
cannot see an address-poisoning lookalike, a contract that will not release the
funds, or a known-malicious destination. A green tick reading "Safe" beside a
scammer's address is worse than no badge at all.

The provider's test double for session storage was three bare spies whose
`load` returned undefined, so every reconnect in that file took the
"nothing saved" early return and the whole path was untested. It is now an
actual store.
