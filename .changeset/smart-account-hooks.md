<!-- cspell:ignore appkit -->

---
"@naculus/connect-appkit-react": minor
---

Fix smart-account lifecycle and UserOperation hooks to derive the connected
owner, use the active wallet for deployment and raw-hash signing, and reject
unsafe chain or concurrent-operation states.
