# @naculus/connect-appkit-react

**React bindings for Naculus Connect** — 54 hooks plus auto-generated React
wrappers for all 28 Stencil components.

The components are the smaller half. Two files in this package contain JSX; the
rest is connection state, capability negotiation, session keys, simulation and
transaction lifecycle, reachable as hooks.

> **🔗 Wraps `@naculus/connect-appkit-wc`. If you need the raw Web Components or another framework, see the table below.**

| Framework | Package | Version |
|-----------|---------|---------|
| Web Components (base) | `@naculus/connect-appkit-wc` | `0.2.x` |
| **React** | `@naculus/connect-appkit-react` | `0.2.x` |
| Vue | `@naculus/connect-appkit-vue` | `0.2.x` |
| UI (shared styles) | `@naculus/connect-appkit-ui` | `0.2.x` |

## Install

```bash
npm install @naculus/connect-appkit-react
# or
pnpm add @naculus/connect-appkit-react
```

## Usage

See [Storybook](https://naculus-official.github.io/connect-appkit) for all components.

```tsx
import { ConnectButton } from "@naculus/connect-appkit-react";

function App() {
  return <ConnectButton />;
}
```

## Hooks

<!-- This list is the point of the package and was missing from the README that
     npm renders, so people reading the npm page concluded the capability layer
     did not exist. Keep it in step with `src/index.ts`. -->

**Connection** — `useAccount`, `useConnect`, `useDisconnect`, `useWallet`,
`useSession`, `useChain`, `useSwitchChain`, `useWeb3`, `useWeb3ErrorHandler`

**Capabilities and batched calls (EIP-5792)** — `useCapabilities`,
`useSendCalls`, `useExecuteCalls`

**Smart accounts and delegation (ERC-4337, EIP-7702)** — `useSmartAccount`,
`useSendUserOperation`, `useUserOpStatus`, `useDelegation`,
`useDelegationPolicy`

**Session keys** — `useCreateSessionKey`, `useSessionKeys`,
`useSendWithSession`, `useRevokeSession`

**Sign-in (EIP-4361 / CAIP-122)** — `useSIWxLogin`, `useSIWxSession`,
`useSiwxAuthSession`, `useSignInWithEthereum`, `useSignInWithX`,
`useSignMessage`

**Transactions** — `useSendTransaction`, `useTxMonitor`, `useTxHistory`,
`useLastTx`, `useSimulateTransfer`, `useTransactionSimulation`,
`useValidateDestination`

**Tokens and balances** — `useBalance`, `useTokenBalance`, `useTokenList`,
`useTokenSearch`, `useERC20Allowance`, `useERC20Approve`, `useERC20Transfer`,
`useERC20TransferSimulation`

**Routing** — `useRouteQuote`, `useExecuteRoute`, `useCompareCosts`

**Solana** — `useSolanaAccount`, `useSolanaBalance`, `useSolanaTransaction`

**Embedded wallet** — `useEmbeddedWallet`, `usePassphraseGate`

**Names** — `useResolveName`, `useLookupAddress`

**Other** — `useViemClient`, `useNotification`

### Ask before executing

```tsx
const { atomic } = useCapabilities();

if (atomic === "supported") {
  await sendCalls(calls);        // one batch, all or nothing
}
```

`atomic` is `"supported" | "unsupported" | "unknown"`. A wallet that does not
implement `wallet_getCapabilities` has not said no — EIP-5792 is explicit that
absence is not a denial, and `"unknown"` also covers a query that failed or is
still in flight.

## License

MIT
