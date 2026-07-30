export { Web3ConnectProvider, useWeb3 } from "./provider/Web3ConnectProvider";
export type { Web3ConnectProviderProps } from "./provider/Web3ConnectProvider";

export { useWallet } from "./hooks/useWallet";
export { useConnect } from "./hooks/useConnect";
export { useDisconnect } from "./hooks/useDisconnect";
export { useAccount } from "./hooks/useAccount";
export { useChain } from "./hooks/useChain";
export { useSignMessage } from "./hooks/useSignMessage";
export { useSendTransaction } from "./hooks/useSendTransaction";
export { useSendCalls } from "./hooks/useSendCalls";
export type { SendCallsStatus } from "./hooks/useSendCalls";
export { useBalance } from "./hooks/useBalance";
export { useTokenBalance } from "./hooks/useTokenBalance";
export type { TokenInfo, UseTokenBalanceOptions, TokenBalanceResult } from "./hooks/useTokenBalance";
export { useERC20Transfer } from "./hooks/useERC20Transfer";
export type { UseERC20TransferOptions, UseERC20TransferReturn } from "./hooks/useERC20Transfer";
export { useERC20Approve } from "./hooks/useERC20Approve";
export type { UseERC20ApproveOptions, UseERC20ApproveReturn } from "./hooks/useERC20Approve";
export { useERC20Allowance } from "./hooks/useERC20Allowance";
export type { UseERC20AllowanceOptions, UseERC20AllowanceReturn } from "./hooks/useERC20Allowance";
export { useViemClient } from "./hooks/useViemClient";
export { useEmbeddedWallet } from "./hooks/useEmbeddedWallet";
export type { UseEmbeddedWalletReturn } from "./hooks/useEmbeddedWallet";
export { useValidateDestination, validateDestination } from "./hooks/useValidateDestination";
export type { UseValidateDestinationOptions, UseValidateDestinationReturn, AddressValidationLevel, AddressValidationResult } from "./hooks/useValidateDestination";
export { t, setLocale, getLocale } from "./utils/i18n";
export type { Locale } from "./utils/i18n";
export { useSignInWithX } from "./hooks/useSignInWithX";
export type { UseSignInWithXOptions, UseSignInWithXReturn } from "./hooks/useSignInWithX";
export { useSignInWithEthereum } from "./hooks/useSignInWithEthereum";
export type { UseSignInWithEthereumOptions, UseSignInWithEthereumReturn } from "./hooks/useSignInWithEthereum";
export { useSiwxAuthSession } from "./hooks/useSiwxAuthSession";
export type { UseSiwxAuthSessionOptions, UseSiwxAuthSessionReturn } from "./hooks/useSiwxAuthSession";
export { useSIWxLogin } from "./hooks/useSIWxLogin";
export type { UseSIWxLoginOptions, UseSIWxLoginReturn } from "./hooks/useSIWxLogin";
export { useSIWxSession } from "./hooks/useSIWxSession";
export type { UseSIWxSessionOptions, UseSIWxSessionReturn } from "./hooks/useSIWxSession";
export { useSessionKeys, useCreateSessionKey, useRevokeSession, useSendWithSession, resetSessionKeyManager } from "./hooks/useSessionKeys";
export type { UseSessionKeysReturn, UseCreateSessionKeyReturn, UseRevokeSessionReturn, UseSendWithSessionReturn } from "./hooks/useSessionKeys";
export { useResolveName } from "./hooks/useResolveName";
export type { UseResolveNameOptions, UseResolveNameResult } from "./hooks/useResolveName";
export { useLookupAddress } from "./hooks/useLookupAddress";
export type { UseLookupAddressOptions, UseLookupAddressResult } from "./hooks/useLookupAddress";
export { useSession } from "./hooks/useSession";
export type { UseSessionReturn } from "./hooks/useSession";
export { useSwitchChain } from "./hooks/useSwitchChain";
export type { UseSwitchChainReturn } from "./hooks/useSwitchChain";
export { createClient, getClient, clearClient } from "./client";
export type { ClientConfig, Web3Client } from "./client";
export { DEFAULT_EVM_CHAINS, getDefaultChains, getChainById } from "./utils/chains";
export type {
  WalletChain,
  ConnectionStatus,
  Web3ConnectConfig,
  Web3State,
  Web3Actions,
  UseWalletReturn,
  EvmTransaction,
  ChainInfo,
  SIWxConfig,
} from "./types";
export { Web3Context } from "./provider/Web3ConnectProvider";
export { useWeb3ErrorHandler } from "./hooks/useWeb3ErrorHandler";
export { useTxMonitor, TxMonitorContext } from "./hooks/useTxMonitor";
export type { UseTxMonitorResult, TxMonitorLike, TxStatus, TxStatusEntry } from "./hooks/useTxMonitor";
export { useTxHistory } from "./hooks/useTxHistory";
export type { UseTxHistoryResult } from "./hooks/useTxHistory";
export { useTransactionSimulation } from "./hooks/useTransactionSimulation";
export type {
  UseTransactionSimulationReturn,
  SimulationResult,
  SimulationStatus,
  RiskLevel,
  BalanceChange,
  ApprovalChange,
  RiskAssessment,
  RiskWarning,
  GasInfo,
} from "./hooks/useTransactionSimulation";
export { useERC20TransferSimulation } from "./hooks/useERC20TransferSimulation";
export type { UseERC20TransferSimulationOptions, UseERC20TransferSimulationReturn } from "./hooks/useERC20TransferSimulation";
export { useLastTx } from "./hooks/useLastTx";
export type { UseLastTxResult } from "./hooks/useLastTx";
export type { UseWeb3ErrorHandlerReturn, UserFriendlyError } from "./hooks/useWeb3ErrorHandler";
export {
  getUserFriendlyError,
  isRetryableError,
  WALLET_ERROR_TITLES,
  WALLET_ERROR_DESCRIPTIONS,
} from "./utils/errorMessages";
export { useSmartAccount } from "./hooks/useSmartAccount";
export type { UseSmartAccountOptions, UseSmartAccountReturn } from "./hooks/useSmartAccount";
export { useSendUserOperation } from "./hooks/useSendUserOperation";
export type { UseSendUserOperationOptions, UseSendUserOperationReturn } from "./hooks/useSendUserOperation";
export { useUserOpStatus } from "./hooks/useUserOpStatus";
export type { UseUserOpStatusOptions, UseUserOpStatusReturn, UserOpStatus } from "./hooks/useUserOpStatus";
export { useTokenList, useTokenSearch, TokenSelector } from "./token-list";
export type { UseTokenListOptions, UseTokenListReturn } from "./token-list";
export type { UseTokenSearchReturn } from "./token-list";
export type { TokenSelectorProps } from "./token-list";
export { useNotification } from "./hooks/useNotification";
export { useSimulateTransfer } from "./hooks/useSimulateTransfer";
export type {
  UseSimulateTransferOptions,
  UseSimulateTransferReturn,
} from "./hooks/useSimulateTransfer";
export { useRouteQuote, useExecuteRoute, useCompareCosts } from "./chain-abstraction";
export type {
  UseRouteQuoteInput,
  UseRouteQuoteReturn,
  Quote,
  QuoteOptions,
  UseExecuteRouteReturn,
  ExecuteError,
  ExecuteRouteResult,
  ExecuteOptions,
  UseCompareCostsInput,
  UseCompareCostsReturn,
  CostComparison,
  CostComparisonOperation,
  CostComparisonOptions,
} from "./chain-abstraction";

// ── Stencil WC React wrappers ───────────────────────────────────

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
} from "./wc-generated/components"
export type {
  AppkitAccordionEvents,
  AppkitAccountButtonEvents,
  AppkitAlertDialogEvents,
  AppkitAvatarEvents,
  AppkitBadgeEvents,
  AppkitButtonEvents,
  AppkitCardEvents,
  AppkitCardContentEvents,
  AppkitCardDescriptionEvents,
  AppkitCardFooterEvents,
  AppkitCardHeaderEvents,
  AppkitCardTitleEvents,
  AppkitCheckboxEvents,
  AppkitCollapsibleEvents,
  AppkitConnectButtonEvents,
  AppkitDialogEvents,
  AppkitDropdownMenuEvents,
  AppkitInputEvents,
  AppkitPopoverEvents,
  AppkitProgressEvents,
  AppkitScrollAreaEvents,
  AppkitSelectEvents,
  AppkitSeparatorEvents,
  AppkitSkeletonEvents,
  AppkitSwitchEvents,
  AppkitTabsEvents,
  AppkitToggleGroupEvents,
  AppkitTooltipEvents,
} from "./wc-generated/components"
