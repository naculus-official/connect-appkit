export {
  AppkitAccordion,
  AppkitAccountButton,
  AppkitAlertDialog,
  AppkitAvatar,
  AppkitBadge,
  AppkitButton,
  AppkitCard,
  AppkitCardContent,
  AppkitCardDescription,
  AppkitCardFooter,
  AppkitCardHeader,
  AppkitCardTitle,
  AppkitCheckbox,
  AppkitCollapsible,
  AppkitConnectButton,
  AppkitDialog,
  AppkitDropdownMenu,
  AppkitInput,
  AppkitPopover,
  AppkitProgress,
  AppkitScrollArea,
  AppkitSelect,
  AppkitSeparator,
  AppkitSkeleton,
  AppkitSwitch,
  AppkitTabs,
  AppkitToggleGroup,
  AppkitTooltip,
} from "./wc-generated/proxies"

// ── Composables ───────────────────────────────────────────────────
export { useAccounts } from "./useAccounts";
export { useAccount } from "./useAccount";
export type { UseAccountReturn } from "./useAccount";
export { useSession } from "./useSession";
export type { UseSessionReturn } from "./useSession";
export { useConnect } from "./useConnect";
export type { UseConnectReturn } from "./useConnect";
export { useDisconnect } from "./useDisconnect";
export type { UseDisconnectReturn } from "./useDisconnect";
export { useSwitchChain } from "./useSwitchChain";
export type { UseSwitchChainReturn } from "./useSwitchChain";
export { useDelegation } from "./useDelegation";
export type { DelegationCodeReader, UseDelegationReturn } from "./useDelegation";
export { useResolveName } from "./useResolveName";
export type { UseResolveNameReturn } from "./useResolveName";
export { useLookupAddress } from "./useLookupAddress";
export type { UseLookupAddressReturn } from "./useLookupAddress";
export { useSolanaAccount } from "./useSolanaAccount";
export type { UseSolanaAccountReturn } from "./useSolanaAccount";
export { useChain } from "./useChain";
export type { UseChainReturn } from "./useChain";
export type { AccountEntry, UseAccountsReturn } from "./useAccounts";
export { usePassphraseGate } from "./usePassphraseGate";
export { useSolanaBalance } from "./useSolanaBalance";
export { useLastTx } from "./useLastTx";
export type { UseLastTxReturn } from "./useLastTx";
export { useTxHistory } from "./useTxHistory";
export type { UseTxHistoryReturn } from "./useTxHistory";
export { useTxMonitor } from "./useTxMonitor";
export type {
  TxMonitorLike,
  TxStatus,
  TxStatusEntry,
  UseTxMonitorReturn,
} from "./useTxMonitor";
export type { UseSolanaBalanceReturn as UseSolanaBalanceVueReturn } from "./useSolanaBalance";
export type { UsePassphraseGateReturn } from "./usePassphraseGate";
export { useCapabilities, type AtomicSupport, type CapabilityClient, type ChainCapabilities, type UseCapabilitiesReturn } from "./useCapabilities";
export {
  useSolanaRoles,
  type SolanaIdentity,
  type SolanaPayer,
  type SolanaRoles,
  type SolanaRolesAbsence,
  type SolanaRolesSource,
  type SolanaSigner,
  type SolanaWalletFeatures,
  type UseSolanaRolesReturn,
} from "./useSolanaRoles";
