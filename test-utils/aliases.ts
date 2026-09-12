import path from "path";

/** Shared resolve aliases for Storybook + Vitest. Keeps both configs in sync. */
export function getAliases(root: string) {
  const r = (p: string) => path.resolve(root, p);
  const stub = r("test-utils/module-stub.js");
  return {
    "@naculus/connect-appkit-core": r("packages/core/src"),
    "@naculus/connect-appkit-react": r("packages/react/src"),
    "@naculus/connect-appkit-ui": r("packages/ui/src"),
    "@naculus/connect-appkit-wc": r("packages/wc/dist"),
    // Test the current sibling source. A gate installs packed tarballs later;
    // resolving a stale artifact here would let AppKit compile against an API
    // different from the one under review.
    "@naculus/connect-core": r("../connect-lib/packages/core/src"),
    // Connector packages that are not exercised by a test stay stubbed.
    starknet: stub,
    "@cosmjs/amino": stub,
    "@polkadot/api": stub,
    "@polkadot/keyring": stub,
    "@naculus/connector-solana": stub,
    "@naculus/connector-xrpl": stub,
    "@naculus/connector-coinbase": stub,
    "@naculus/connector-wagmi": stub,
    "@reown/appkit": stub,
  };
}
