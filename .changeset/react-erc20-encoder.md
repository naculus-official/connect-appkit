---
"@naculus/connect-appkit-react": patch
---

Use shared ERC-20 calldata encoding for transfer, approval, and transfer previews. Transfer simulation now rejects malformed recipients and amounts with excess precision instead of previewing a different transaction than the send path, and hides stale results when inputs become invalid.
