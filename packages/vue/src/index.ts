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
export { useChain } from "./useChain";
export type { UseChainReturn } from "./useChain";
export type { AccountEntry, UseAccountsReturn } from "./useAccounts";
export { usePassphraseGate } from "./usePassphraseGate";
export { useSolanaBalance } from "./useSolanaBalance";
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
