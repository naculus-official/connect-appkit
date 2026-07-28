import React, { createContext, useContext, useMemo } from 'react'

// ── Layer 1: Base UI components (from local shadcn (vendor)) ─────
import { Button as ShadcnButton } from '../components/ui/button'
import {
  Dialog as ShadcnDialog,
  DialogContent as ShadcnDialogContent,
  DialogHeader as ShadcnDialogHeader,
  DialogTitle as ShadcnDialogTitle,
} from '../components/ui/dialog'

// Components only available via local shadcn (vendor)
import { Card as ShadcnCard } from '../components/ui/card'
import { Badge as ShadcnBadge } from '../components/ui/badge'
import { Switch as ShadcnSwitch } from '../components/ui/switch'
import { Checkbox as ShadcnCheckbox } from '../components/ui/checkbox'
import { Tabs as ShadcnTabs, TabsContent as ShadcnTabsContent, TabsList as ShadcnTabsList, TabsTrigger as ShadcnTabsTrigger } from '../components/ui/tabs'
import { DropdownMenu as ShadcnDropdownMenu } from '../components/ui/dropdown-menu'
import { Avatar as ShadcnAvatar } from '../components/ui/avatar'
import { Skeleton as ShadcnSkeleton } from '../components/ui/skeleton'
import { Tooltip as ShadcnTooltip } from '../components/ui/tooltip'
import { Popover as ShadcnPopover } from '../components/ui/popover'
import { Progress as ShadcnProgress } from '../components/ui/progress'
import { Separator as ShadcnSeparator } from '../components/ui/separator'
import { ScrollArea as ShadcnScrollArea } from '../components/ui/scroll-area'
import { Input as ShadcnInput } from '../components/ui/input'
import { Select as ShadcnSelect } from '../components/ui/select'
import { Label as ShadcnLabel } from '../components/ui/label'
import { Sheet as ShadcnSheet } from '../components/ui/sheet'

// ── Layer 2: Business components (from connect-react) ─────────────
import { ConnectButton as BizConnectButton } from '../components/ConnectButton'
import { AccountButton as BizAccountButton } from '../components/AccountButton'
import { ChainSelector as BizChainSelector } from '../components/ChainSelector'
import { QRCodeModal as BizQRCodeModal } from '../components/QRCodeModal'

import { SignInButton as BizSignInButton } from '../components/SignInButton'
import { SeedPhraseBackup as BizSeedPhraseBackup } from '../components/SeedPhraseBackup'
import { ErrorBoundary as BizErrorBoundary } from '../components/ErrorBoundary'
import { AppKit as BizAppKit, AppKitButton as BizAppKitButton, AppKitChainSelector as BizAppKitChainSelector } from '../components/AppKit'
import { Web3ConnectUI as BizWeb3ConnectUI } from '../components/Web3ConnectUI'

/* ------------------------------------------------------------------ */
/*  ComponentRegistry interface                                        */
/*                                                                     */
/*  Layer 1 (~20 entries): shadcn base UI components                */
/*  Layer 2 (~15 entries): connect-react business components           */
/* ------------------------------------------------------------------ */
export interface ComponentRegistry {
  // ── Layer 1: Base UI ─────────────────────────────────────────────
  Button?: React.ComponentType<any>
  Card?: React.ComponentType<any>
  Badge?: React.ComponentType<any>
  Switch?: React.ComponentType<any>
  Checkbox?: React.ComponentType<any>
  Tabs?: React.ComponentType<any>
  TabsContent?: React.ComponentType<any>
  TabsList?: React.ComponentType<any>
  TabsTrigger?: React.ComponentType<any>
  DropdownMenu?: React.ComponentType<any>
  Avatar?: React.ComponentType<any>
  Skeleton?: React.ComponentType<any>
  Tooltip?: React.ComponentType<any>
  Popover?: React.ComponentType<any>
  Progress?: React.ComponentType<any>
  Separator?: React.ComponentType<any>
  ScrollArea?: React.ComponentType<any>
  Input?: React.ComponentType<any>
  Select?: React.ComponentType<any>
  Label?: React.ComponentType<any>
  Sheet?: React.ComponentType<any>
  Modal?: React.ComponentType<any>
  Dialog?: React.ComponentType<any>
  DialogContent?: React.ComponentType<any>
  DialogHeader?: React.ComponentType<any>
  DialogTitle?: React.ComponentType<any>

  // ── Layer 2: Business ───────────────────────────────────────────
  ConnectButton?: React.ComponentType<any>
  AccountButton?: React.ComponentType<any>
  ChainSelector?: React.ComponentType<any>
  QRCodeModal?: React.ComponentType<any>

  SignInButton?: React.ComponentType<any>
  SeedPhraseBackup?: React.ComponentType<any>
  ErrorBoundary?: React.ComponentType<any>
  AppKit?: React.ComponentType<any>
  AppKitButton?: React.ComponentType<any>
  AppKitChainSelector?: React.ComponentType<any>
  Web3ConnectUI?: React.ComponentType<any>
}

export const DEFAULT_COMPONENTS: ComponentRegistry = {
  // ── Layer 1: Base UI defaults from shadcn ─────────────────────
  Button: ShadcnButton,
  Dialog: ShadcnDialog,
  DialogContent: ShadcnDialogContent,
  DialogHeader: ShadcnDialogHeader,
  DialogTitle: ShadcnDialogTitle,
  Card: ShadcnCard,
  Badge: ShadcnBadge,
  Switch: ShadcnSwitch,
  Checkbox: ShadcnCheckbox,
  Tabs: ShadcnTabs,
  TabsContent: ShadcnTabsContent,
  TabsList: ShadcnTabsList,
  TabsTrigger: ShadcnTabsTrigger,
  DropdownMenu: ShadcnDropdownMenu,
  Avatar: ShadcnAvatar,
  Skeleton: ShadcnSkeleton,
  Tooltip: ShadcnTooltip,
  Popover: ShadcnPopover,
  Progress: ShadcnProgress,
  Separator: ShadcnSeparator,
  ScrollArea: ShadcnScrollArea,
  Input: ShadcnInput,
  Select: ShadcnSelect,
  Label: ShadcnLabel,
  Sheet: ShadcnSheet,

  // ── Layer 2: Business defaults from connect-react ────────────────
  ConnectButton: BizConnectButton,
  AccountButton: BizAccountButton,
  ChainSelector: BizChainSelector,
  QRCodeModal: BizQRCodeModal,

  SignInButton: BizSignInButton,
  SeedPhraseBackup: BizSeedPhraseBackup,
  ErrorBoundary: BizErrorBoundary,
  AppKit: BizAppKit,
  AppKitButton: BizAppKitButton,
  AppKitChainSelector: BizAppKitChainSelector,
  Web3ConnectUI: BizWeb3ConnectUI,
}

const ComponentRegistryContext = createContext<ComponentRegistry>({})

export interface Web3ComponentProviderProps {
  children: React.ReactNode
  components?: ComponentRegistry
}

export function Web3ComponentProvider({
  children,
  components = {},
}: Web3ComponentProviderProps) {
  const value = useMemo(
    () => ({ ...DEFAULT_COMPONENTS, ...components }),
    [components]
  )

  return (
    <ComponentRegistryContext.Provider value={value}>
      {children}
    </ComponentRegistryContext.Provider>
  )
}

export function useComponentRegistry(): ComponentRegistry {
  return useContext(ComponentRegistryContext)
}

export function useComponent<K extends keyof ComponentRegistry>(
  name: K
): ComponentRegistry[K] | undefined {
  const registry = useComponentRegistry()
  return registry[name]
}
