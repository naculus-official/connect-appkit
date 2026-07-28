import path from "path";

/** Shared resolve aliases for Ladle + Vitest. Keeps both configs in sync. */
export function getAliases(root: string) {
  const r = (p: string) => path.resolve(root, p);
  const stub = r("test-utils/module-stub.js");
  return {
    "@naculus/connect-appkit-react": r("packages/react/src"),
    "@naculus/connect-appkit-ui": r("packages/ui/src"),
    // connect-lib — workspace links resolved at runtime
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
