"use client"

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react"
import { useAccount, useWallet, useChain, useEmbeddedWallet, useDisconnect, useBalance } from "@naculus/connect-appkit-react"
import type { Web3ConnectConfig } from "@naculus/connect-appkit-react"
import { Web3ConnectUI, type Web3ConnectUIProps } from "./Web3ConnectUI"
import { ConnectButton } from "./ConnectButton"
import { ChainSelector } from "./ChainSelector"
import { SeedPhraseBackup } from "./SeedPhraseBackup"
import { useEIP6963 } from "../hooks/useEIP6963"
import type { DiscoveredWallet } from "../hooks/useEIP6963"
import { cn } from "../lib/cn"

export interface AppKitProps {
  projectId: string
  metadata: {
    name: string
    description: string
    url: string
    icons: string[]
  }
  enableEmbedded?: boolean
  enablePasskeys?: boolean
  children?: React.ReactNode
  className?: string
  autoConnect?: boolean
  theme?: Web3ConnectUIProps["theme"]
  defaultDark?: boolean
  themePriority?: Web3ConnectUIProps["themePriority"]
  detectionMode?: Web3ConnectUIProps["detectionMode"]
}

export interface AppKitContextValue {
  connect: () => void
  disconnect: () => Promise<void>
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  balance: string | null
  balanceSymbol: string
  chainName: string | null
  availableChains: Array<{ id: number; namespace: string; name: string; token?: string }>
  switchChain: (chainId: string) => Promise<void>
  wallets: DiscoveredWallet[]
  hasWallets: boolean
  /** Embedded wallet backup state */
  backupPending: boolean
  seedPhrase: string | null
  confirmBackup: () => void
  skipBackup: () => void
  open: boolean
  setOpen: (open: boolean) => void
}

const AppKitContext = createContext<AppKitContextValue | null>(null)

export function useAppKit(): AppKitContextValue {
  const ctx = useContext(AppKitContext)
  if (!ctx) {
    throw new Error("useAppKit must be used within an <AppKit> component")
  }
  return ctx
}

export function AppKit({
  projectId,
  metadata,
  enableEmbedded = false,
  enablePasskeys = false,
  children,
  className,
  autoConnect = false,
  theme,
  defaultDark = false,
  themePriority = "computed",
  detectionMode = "auto",
}: AppKitProps) {
  const [open, setOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)

  const config = useMemo<Web3ConnectConfig>(
    () => ({
      projectId,
      metadata,
      enableEmbedded,
      enablePasskeys,
    }),
    [projectId, metadata, enableEmbedded, enablePasskeys]
  )

  return (
    <Web3ConnectUI
      config={config}
      autoConnect={autoConnect}
      detectionMode={detectionMode}
      theme={theme}
      defaultDark={defaultDark}
      themePriority={themePriority}
    >
      <AppKitInner
        className={className}
        open={open}
        setOpen={setOpen}
        backupOpen={backupOpen}
        setBackupOpen={setBackupOpen}
      >
        {children}
      </AppKitInner>
    </Web3ConnectUI>
  )
}

interface AppKitInnerProps {
  children: React.ReactNode
  className?: string
  open: boolean
  setOpen: (open: boolean) => void
  backupOpen: boolean
  setBackupOpen: (open: boolean) => void
}

function AppKitInner({
  children,
  className,
  open,
  setOpen,
  backupOpen,
  setBackupOpen,
}: AppKitInnerProps) {
  const { isConnected, isConnecting } = useWallet()
  const { primaryAccount } = useAccount()
  const { currentChain, availableChains, switchChain } = useChain()
  const embedded = useEmbeddedWallet()
  const { disconnect } = useDisconnect()
  const { wallets, hasWallets } = useEIP6963()
  const { formatted: balanceRaw } = useBalance()
  const balance = balanceRaw ?? null

  const handleDisconnect = useCallback(async () => {
    await disconnect()
  }, [disconnect])

  const handleConfirmBackup = useCallback(() => {
    embedded.confirmBackup()
    setBackupOpen(false)
  }, [embedded])

  const handleSkipBackup = useCallback(() => {
    setBackupOpen(false)
  }, [])

  const handleExportPrivateKey = useCallback((): string | null => {
    return embedded.wallet?.privateKey ?? null
  }, [embedded.wallet])

  const value = useMemo<AppKitContextValue>(
    () => ({
      connect: () => setOpen(true),
      disconnect: handleDisconnect,
      isConnected,
      isConnecting,
      address: primaryAccount,
      balance,
      balanceSymbol: currentChain?.token ?? "ETH",
      chainName: currentChain?.name ?? null,
      availableChains: availableChains.map((c) => ({
        id: c.id,
        namespace: c.namespace,
        name: c.name,
        token: c.token,
      })),
      switchChain,
      wallets,
      hasWallets,
      backupPending: embedded.backupPending,
      seedPhrase: embedded.seedPhrase,
      confirmBackup: handleConfirmBackup,
      skipBackup: handleSkipBackup,
      open,
      setOpen,
    }),
    [
      isConnected,
      isConnecting,
      primaryAccount,
      balance,
      currentChain,
      availableChains,
      switchChain,
      wallets,
      hasWallets,
      embedded.backupPending,
      embedded.seedPhrase,
      handleConfirmBackup,
      handleSkipBackup,
      handleDisconnect,
      open,
      setOpen,
    ]
  )

  // Open backup dialog when embedded wallet generates a seed phrase
  useEffect(() => {
    if (embedded.seedPhrase && embedded.backupPending) {
      setBackupOpen(true)
    }
  }, [embedded.seedPhrase, embedded.backupPending, setBackupOpen])

  return (
    <AppKitContext.Provider value={value}>
      {children}

      {embedded.seedPhrase && backupOpen && (
        <SeedPhraseBackup
          seedPhrase={embedded.seedPhrase}
          onConfirm={handleConfirmBackup}
          onSkip={handleSkipBackup}
          onExportPrivateKey={handleExportPrivateKey}
          open={backupOpen}
          onOpenChange={setBackupOpen}
        />
      )}
    </AppKitContext.Provider>
  )
}

// ── Convenience sub-components ──────────────────────────────────────

export interface AppKitButtonProps {
  className?: string
}

export function AppKitButton({ className }: AppKitButtonProps) {
  const ctx = useAppKit()
  const { primaryAccount } = useAccount()
  const { disconnect } = useDisconnect()

  if (ctx.isConnected && primaryAccount) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <ChainSelector variant="minimal" />
        <ConnectButton
          isConnected={ctx.isConnected}
          address={primaryAccount}
          balance={ctx.balance}
          balanceSymbol={ctx.balanceSymbol}
          onDisconnect={disconnect}
          className={className}
        />
      </div>
    )
  }

  return (
    <ConnectButton
      isConnected={ctx.isConnected}
      isConnecting={ctx.isConnecting}
      address={primaryAccount}
      balance={ctx.balance}
      balanceSymbol={ctx.balanceSymbol}
      onDisconnect={disconnect}
      className={className}
    />
  )
}

export interface AppKitChainSelectorProps {
  className?: string
  variant?: "dropdown" | "buttons" | "minimal"
}

export function AppKitChainSelector({ className, variant = "dropdown" }: AppKitChainSelectorProps) {
  return <ChainSelector className={className} variant={variant} />
}
