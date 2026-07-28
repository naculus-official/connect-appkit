# API Reference

> Hand-written high-level overview. For the full type-level API surface, see TypeScript declarations in each package.

---

## @naculus/connect-react — Hooks & Provider

### Provider

| Export | Description |
|--------|-------------|
| `Web3ConnectProvider` | Core provider. Initializes ConnectorManager, manages session state, provides React context. |
| `NaculusProvider` | Convenience alias for `Web3ConnectProvider` with sensible defaults. |
| `useWeb3` | Access the raw Web3 context (session, manager, connectors). Low-level escape hatch. |

### Wallet

| Export | Description |
|--------|-------------|
| `useWallet` | Full wallet state — `address`, `isConnected`, `isConnecting`, `walletType`, `chainId`, `disconnect` |
| `useConnect` | Connect flow — `connect(opts)`, `connectors[]`, `isConnecting`, `error` |
| `useDisconnect` | Disconnect with optional cleanup — `disconnect()`, `disconnectAndClear()` |
| `useAccount` | Account info — `address`, `domain` (ENS/SNS), `avatar`, `displayName` |
| `useChain` | Chain management — `chain`, `chainId`, `switchChain(id)`, `availableChains[]` |

### Transactions

| Export | Description |
|--------|-------------|
| `useSendTransaction` | Single EVM transaction — `sendTransaction(tx)`, `status`, `hash`, `error` |
| `useSendCalls` | Batch calls (EIP-5792) — `sendCalls(calls)`, `status`, `error` |
| `useSignMessage` | Message signing — `signMessage(msg)`, `signature`, `error` |

### ERC-20

| Export | Description |
|--------|-------------|
| `useERC20Transfer` | Token transfer — `transfer(to, amount, tokenAddress)`, `status`, `hash` |
| `useERC20Approve` | Token approval — `approve(spender, amount, tokenAddress)`, `status` |
| `useERC20Allowance` | Allowance query — `allowance`, `refetch()`, `isLoading` |

### SIWx (Sign-In With X)

| Export | Description |
|--------|-------------|
| `useSignInWithEthereum` | EVM CAIP-122 sign-in — `signIn(opts)`, `isLoading`, `error` |
| `useSignInWithSolana` | Solana CAIP-122 sign-in — `signIn(opts)`, `isLoading`, `error` |
| `useSignInWithXrpl` | XRPL CAIP-122 sign-in — `signIn(opts)`, `isLoading`, `error` |
| `useSIWxSession` | Session persistence — `session`, `isSignedIn`, `signOut()` |

### Session Keys

| Export | Description |
|--------|-------------|
| `useSessionKeys` | Session key management — `keys[]`, `createKey(opts)`, `revokeKey(id)` |
| `useCreateSessionKey` | Single-key creation flow — `create(opts)`, `isCreating`, `key` |

### Account Abstraction

| Export | Description |
|--------|-------------|
| `useSmartAccount` | Smart account lifecycle — `isDeployed`, `deploy()`, `address`, `entryPoint` |
| `useSendUserOperation` | ERC-4337 userOp — `sendUserOp(op)`, `userOpHash`, `status` |

### Chain Abstraction

| Export | Description |
|--------|-------------|
| `useRouteQuote` | Cross-chain route quotes — `quote(amount, fromChain, toChain)`, `routes[]`, `isLoading` |
| `useExecuteRoute` | Route execution — `execute(route)`, `status`, `txHash` |
| `useCompareCosts` | Multi-route cost comparison — `costs[]`, `bestRoute`, `isLoading` |

### Token

| Export | Description |
|--------|-------------|
| `useTokenBalance` | Token balance — `balance`, `formatted`, `decimals`, `refetch()`, `isLoading` |
| `useTokenList` | Token metadata list — `tokens[]`, `search(query)`, `isLoading` |

### Utilities

| Export | Description |
|--------|-------------|
| `useValidateDestination` | Address validation — `validate(address)`, `isValid`, `warnings[]` |
| `useIsMobile` | Breakpoint detection — `isMobile` |

---

## @naculus/connect-ui — Components

### Core Buttons

| Export | Description |
|--------|-------------|
| `ConnectButton` | Primary entry point. Shows connect/disconnect, wallet modal, chain switch. |
| `AccountButton` | Address display with copy, explorer link, identity badge. |
| `ChainSelector` | Chain switching dropdown with network indicators. |
| `SignInButton` | SIWx sign-in button with session-aware UI. |

### Modals & Layouts

| Export | Description |
|--------|-------------|
| `AppKit` | Full-stack connection UI — wallet selector, QR, account view, settings. |
| `WalletModal` | Wallet selection dialog with connector list. |
| `TransactionPreview` | Pre-submit review — amount, gas, recipient. |
| `TokenSelector` | Token search and selection modal. |

### Smart Wallet

| Export | Description |
|--------|-------------|
| `SmartWalletToggle` | Deploy / upgrade toggle with status indicator. |
| `SmartWalletSettings` | Guardian management and settings form. |

### Theme & Registry

| Export | Description |
|--------|-------------|
| `ThemeProvider` | Theme context with three-mode priority system (fallback / computed / custom). |
| `ComponentRegistry` | Pluggable component overrides — swap any shadcn component for a custom one. |

### Utilities

| Export | Description |
|--------|-------------|
| `cn` | Tailwind class merge — `cn("px-4", className)` wraps `clsx` + `tailwind-merge`. |
| `t` | i18n translator function — `t("connect_wallet")`, static key-value map. |
