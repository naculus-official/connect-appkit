import fs from "fs";
import path from "path";

/** Shared resolve aliases for Storybook + Vitest. Keeps both configs in sync. */
export function getAliases(root: string) {
  const r = (p: string) => path.resolve(root, p);
  const stub = r("test-utils/module-stub.js");

  // connect-lib is a separate repository, so this one is the only alias that
  // reaches outside the checkout. When the sibling is present, test against its
  // current source: appkit and the SDK move together, and resolving the
  // installed copy would hide an API change until release.
  //
  // A clean clone and every CI runner have no sibling. An alias to a path that
  // does not exist is not an error — resolution falls through to Node, which
  // reports `Cannot find package '@naculus/connect-core'` from whichever file
  // imported it, naming the package instead of the missing directory. appkit's
  // test job had been red on dev and master since August for exactly that.
  //
  // Without the sibling the installed @naculus/connect-core is both the only
  // thing that can resolve and the copy a consumer actually gets, so that is
  // what the tests run against. Set NACULUS_IGNORE_SIBLING=1 to force that path
  // locally and reproduce what CI resolves.
  const siblingCore = r("../connect-lib/packages/core/src");
  const useSibling =
    !process.env.NACULUS_IGNORE_SIBLING && fs.existsSync(siblingCore);

  return {
    "@naculus/connect-appkit-core": r("packages/core/src"),
    "@naculus/connect-appkit-react": r("packages/react/src"),
    "@naculus/connect-appkit-ui": r("packages/ui/src"),
    "@naculus/connect-appkit-wc": r("packages/wc/dist"),
    ...(useSibling ? { "@naculus/connect-core": siblingCore } : {}),
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
