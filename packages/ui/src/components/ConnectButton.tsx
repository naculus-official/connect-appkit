"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Wallet, QrCode, LogOut, PlugZap, Smartphone, Copy, Check, ExternalLink, Search, X } from "lucide-react"
import { useComponentRegistry } from "../contexts/ComponentRegistry"
import { useWalletConnectOptional } from "../contexts/WalletConnectContext"
import { DefaultDialog } from "../lib/ui-defaults"
import { useIsMobile } from "../hooks/useIsMobile"
import { useEIP6963 } from "../hooks/useEIP6963"
import { cn } from "../lib/cn"
import { WALLET_REGISTRY, getWalletById, buildDeepLink } from "../lib/wallet-registry"
import type { WalletEntry } from "../lib/wallet-registry"

export interface ConnectButtonProps {
  className?: string
  isConnected?: boolean
  isConnecting?: boolean
  onConnect?: (walletKind: "injected" | "walletconnect", closeModal: () => void, walletId?: string) => void
  onDisconnect?: () => void
  onMobileDeepLink?: () => void
  mobileWalletName?: string
  startPairing?: () => Promise<string>
  completePairing?: () => Promise<any>
/** Current wallet address (CAIP-10 or raw) for display when connected */
  address?: string
  /** Formatted native balance (e.g. "1.234") — null while loading */
  balance?: string | null
  /** Native token symbol (e.g. "ETH") */
  balanceSymbol?: string
  /** Optional ERC-20 token balances for wallet view */
  tokenBalances?: Array<{ symbol: string; formatted: string | null; name?: string }>
  /** Whether native balance is currently being fetched - shows skeleton when true */
  isBalanceLoading?: boolean
  /** Chain-specific explorer URL (e.g. "https://etherscan.io", "https://polygonscan.com").
   * If not provided, the Etherscan link is omitted. */
  explorerUrl?: string
  /** Current chain label (e.g. "Ethereum", "Polygon") for the explorer link text */
  explorerLabel?: string
}




// Icon components — minimal inline style only for theme-dependent colors
function ConnectSvg() { return <PlugZap size={18} className="shrink-0" /> }
function WalletIcon() { return <Wallet size={28} className="text-muted-foreground" /> }
function QrIcon() { return <QrCode size={28} className="text-muted-foreground" /> }
function PhoneIcon() { return <Smartphone size={28} className="text-muted-foreground" /> }

type ConnectView = "menu" | "loading-qr" | "qr-ready" | "qr-error";

function QRCanvas({ uri }: { uri: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    if (!uri || !canvasRef.current) return;
    import("qrcode").then((mod) => {
      (mod.default || mod).toCanvas(canvasRef.current, uri, { width: 230, margin: 2 }, () => {});
    }).catch(() => {});
  }, [uri]);
  return <canvas ref={canvasRef} width={230} height={230}
    className="rounded-lg border border-border" />;
}

function QRSkeleton() {
  return (
    <div className="text-center">
      <div className="text-base font-semibold mb-2">Scan with your wallet app</div>
      <div className="text-sm text-muted-foreground mb-4">Waiting for connection...</div>
      <div className="mx-auto mb-3 flex h-[230px] w-[230px] items-center justify-center rounded-lg bg-muted">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
      <div className="mb-2 h-9 w-full rounded-lg bg-muted" />
      <div className="mx-auto h-9 w-[30%] rounded-lg bg-muted" />
    </div>
  );
}

/** Clickable wallet badge shown when connected */
function WalletBadge({
  address,
  balance,
  balanceSymbol,
  isBalanceLoading,
  onClick,
}: {
  address: string
  balance?: string | null
  balanceSymbol?: string
  isBalanceLoading?: boolean
  onClick: () => void
}) {
  const registry = useComponentRegistry()
  const Button = registry.Button as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <Button
      data-testid="wallet-badge"
      onClick={onClick}
      aria-label="Wallet Badge"
      variant="ghost"
      size="sm"
      className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-3 py-[0.375rem] text-sm text-foreground shadow-sm cursor-pointer font-inherit transition-all duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
      <span className="font-mono font-medium">{shortAddress}</span>
      {isBalanceLoading ? (
        <span className="h-4 w-[60px] rounded bg-muted animate-pulse" />
      ) : balance !== undefined && balance !== null ? (
        <>
          <span className="text-muted-foreground font-normal">·</span>
          <span className="font-medium">
            {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            {balanceSymbol ? ` ${balanceSymbol}` : ""}
          </span>
        </>
      ) : null}
    </Button>
  );
}

function WalletDropdown({
  address,
  balance,
  balanceSymbol,
  isBalanceLoading,
  tokenBalances,
  onDisconnect,
  onClose,
  explorerUrl,
  explorerLabel,
}: {
  address: string
  balance?: string | null
  balanceSymbol?: string
  isBalanceLoading?: boolean
  tokenBalances?: Array<{ symbol: string; formatted: string | null; name?: string }>
  onDisconnect: () => void
  onClose: () => void
  /** Chain-specific explorer URL; omit to hide the explorer link */
  explorerUrl?: string
  /** Chain name for the explorer link text (default: "Etherscan") */
  explorerLabel?: string
}) {
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const registry = useComponentRegistry();
  const Button =
    (registry.Button as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>) ||
    (({ children, className, ...rest }: any) => <button className={className} {...rest}>{children}</button>);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [address]);

  // Close on click outside (M10: replaced setTimeout(0) with requestAnimationFrame)
  React.useEffect(() => {
    let rafId: number;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use requestAnimationFrame to delay listener until after current frame
    rafId = requestAnimationFrame(() => {
      document.addEventListener("mousedown", handler);
    });
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fullAddress = address.includes(":") ? address.split(":").pop()! : address;

  return (
    <div ref={dropdownRef}
      className="absolute right-0 top-full z-[100] mt-2 w-[320px] max-w-[90vw] rounded-xl border border-border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
      {/* Header with status */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
        <span className="text-sm font-medium text-[#22c55e]">Connected</span>
      </div>

      {/* Address row with copy */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
        <span className="font-mono text-sm text-foreground">
          {fullAddress.slice(0, 8)}...{fullAddress.slice(-6)}
        </span>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy address">
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
          </Button>
          {explorerUrl && (
            <a href={`${explorerUrl}/address/${fullAddress}`} target="_blank" rel="noopener noreferrer"
              title={`View on ${explorerLabel ?? "Explorer"}`}
              className="cursor-pointer border-none bg-transparent p-1 text-muted-foreground transition-all duration-200 hover:text-foreground">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Native balance */}
      <div className={cn(tokenBalances && tokenBalances.length > 0 ? "mb-3" : "mb-4")}>
        <div className="mb-1 text-xs text-muted-foreground">Balance</div>
        <div className="font-mono text-xl font-bold">
          {isBalanceLoading ? (
            <span className="block h-6 w-32 rounded bg-muted animate-pulse" />
          ) : balance !== null && balance !== undefined
            ? `${parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${balanceSymbol ?? "ETH"}`
            : "—"}
        </div>
      </div>

      {/* Token balances */}
      {tokenBalances && tokenBalances.length > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 text-xs text-muted-foreground">Tokens</div>
          {isBalanceLoading ? (
            <>
              <div className="flex items-center justify-between rounded-sm px-2 py-[0.375rem] text-sm">
                <span className="block h-4 w-16 rounded bg-muted animate-pulse" />
                <span className="block h-4 w-12 rounded bg-muted animate-pulse" />
              </div>
              <div className="flex items-center justify-between rounded-sm px-2 py-[0.375rem] text-sm">
                <span className="block h-4 w-20 rounded bg-muted animate-pulse" />
                <span className="block h-4 w-10 rounded bg-muted animate-pulse" />
              </div>
            </>
          ) : (
            tokenBalances.map((tb, i) => (
              <div key={i}
                className="flex items-center justify-between rounded-sm px-2 py-[0.375rem] text-sm">
                <span className="font-medium">{tb.name || tb.symbol}</span>
                <span className="font-mono text-muted-foreground">
                  {tb.formatted !== null ? tb.formatted : "—"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10"
        onClick={() => { onDisconnect(); onClose(); }}>
        <LogOut size={16} /> Disconnect
      </Button>
    </div>
  );
}

export function ConnectButton({
  className, isConnected: externalConnected, isConnecting: externalConnecting,
  onConnect, onDisconnect, onMobileDeepLink, mobileWalletName,
  startPairing, completePairing,
  address, balance, balanceSymbol, tokenBalances, isBalanceLoading,
  explorerUrl, explorerLabel,
}: ConnectButtonProps) {
  const walletConnectContext = useWalletConnectOptional()
  const registry = useComponentRegistry()
  const [isOpen, setIsOpen] = useState(false)
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
  const [view, setView] = useState<ConnectView>("menu")
  const [qrUri, setQrUri] = useState<string | null>(null)
  const [pairingErr, setPairingErr] = useState<string | null>(null)
  const [uriCopied, setUriCopied] = useState(false)
  const [walletSearch, setWalletSearch] = useState("")
  const [selectedWallet, setSelectedWallet] = useState<WalletEntry | null>(null)
  const { wallets } = useEIP6963()
  const filteredWallets = useMemo(
    () => walletSearch
      ? wallets.filter(w => w.name.toLowerCase().includes(walletSearch.toLowerCase()))
      : wallets,
    [wallets, walletSearch]
  )
  const isConnecting = externalConnecting ?? false
  const isMobile = useIsMobile()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const Button = registry.Button as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>
  const Dialog = registry.Dialog as React.ComponentType<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }> | undefined
  const DialogContent = registry.DialogContent as React.ComponentType<{ children: React.ReactNode }> | undefined
  const DialogHeader = registry.DialogHeader as React.ComponentType<{ children: React.ReactNode }> | undefined
  const DialogTitle = registry.DialogTitle as React.ComponentType<{ children: React.ReactNode }> | undefined



  useEffect(() => { if (isOpen) { setView("menu"); setQrUri(null); setPairingErr(null); setSelectedWallet(null); } }, [isOpen]);

  useEffect(() => {
    if (!walletConnectContext) return;
    const { qrStatus, qrUri: contextUri, error } = walletConnectContext.state;
    
    if (qrStatus === "loading" && view !== "loading-qr") {
      setView("loading-qr");
    } else if (qrStatus === "ready" && contextUri) {
      setQrUri(contextUri);
      setView("qr-ready");
    } else if (qrStatus === "error") {
      setView("qr-error");
      setPairingErr(error);
    }
    
    if (qrStatus === "idle" && view !== "menu") {
      setView("menu");
    }
  }, [walletConnectContext?.state]);

  // Auto-open deep link when QR is ready for a specific wallet
  useEffect(() => {
    if (view === "qr-ready" && qrUri && selectedWallet && isMobile) {
      const link = buildDeepLink(selectedWallet, qrUri)
      if (link) {
        // Use location.href for same-tab navigation
        window.open(link, "_blank", "noopener")
      }
    }
  }, [view, qrUri, selectedWallet, isMobile]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowWalletDropdown(false);
    setWalletSearch("");
    setSelectedWallet(null);
  }, [])

  const handleDisconnect = useCallback(() => {
    onDisconnect?.();
    setShowWalletDropdown(false);
  }, [onDisconnect])

  const handleConnectClick = useCallback(() => {
    if (isMobile && onMobileDeepLink) { onMobileDeepLink() }
    else { setIsOpen(true) }
  }, [isMobile, onMobileDeepLink])

  const handleWalletConnect = useCallback(() => {
    if (walletConnectContext) {
      setView("loading-qr"); setPairingErr(null); setQrUri(null);
      walletConnectContext.connectWalletConnect();
      return;
    }
    if (startPairing && completePairing) {
      setView("loading-qr"); setPairingErr(null); setQrUri(null);
      (async () => {
        try {
          const uri = await startPairing(); setQrUri(uri); setView("qr-ready");
          await completePairing(); setTimeout(() => setIsOpen(false), 1000);
        } catch (err) {
          setView("qr-error");
          setPairingErr(err instanceof Error ? err.message : "Connection failed");
        }
      })();
      return;
    }
    if (onConnect) { onConnect("walletconnect", () => setIsOpen(false)); }
  }, [walletConnectContext, startPairing, completePairing, onConnect]);

  const handleRetry = useCallback(() => { setQrUri(null); setPairingErr(null); handleWalletConnect(); }, [handleWalletConnect]);

  const handleInjectedSelect = useCallback((walletId: string) => {
    if (onConnect) onConnect("injected", () => setIsOpen(false), walletId);
  }, [onConnect]);

  const btn = (opt: { id: string; name: string; desc: string; icon: React.ReactNode; badge?: string }, onSel: () => void) => (
    <Button key={opt.id} onClick={onSel} disabled={isConnecting} variant="outline"
      className="flex w-full items-center gap-3 rounded-lg px-4 py-[0.875rem] text-left h-auto [&>span]:flex-1">
      {opt.icon}
      <span>
        <div className="text-base font-medium">{opt.name}</div>
        <div className="text-sm text-muted-foreground">{opt.desc}</div>
      </span>
      {opt.badge && <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{opt.badge}</span>}
    </Button>
  )

  const walletItems = (
    <>
      {/* Wallet search */}
      {view === "menu" && wallets.length > 3 && (
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search wallets..."
            value={walletSearch}
            onChange={(e) => setWalletSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
          />
        </div>
      )}
      {filteredWallets.length === 0 && wallets.length > 0 ? (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No wallets match "{walletSearch}"
        </div>
      ) : wallets.length === 0 ? (
        <Button disabled variant="outline"
          className="flex w-full items-center gap-3 rounded-lg px-4 py-[0.875rem] text-left h-auto opacity-50 cursor-not-allowed">
          <WalletIcon />
          <span className="flex-1">
            <div className="text-base font-medium">Injected Wallet</div>
            <div className="text-sm text-muted-foreground">No browser wallet detected</div>
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Extension</span>
        </Button>
      ) : (
        filteredWallets.map(w => btn(
          { id: w.id, name: w.name, desc: "Browser extension", icon: <WalletIcon /> },
          () => { setWalletSearch(""); handleInjectedSelect(w.id) }
        ))
      )}
      {/* Registry wallets (not detected via EIP-6963) */}
      {view === "menu" && (
        <>
          <div className="mt-1 mb-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground font-medium">More wallets</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {WALLET_REGISTRY
            .filter(w => w.id !== "walletconnect")
            .filter(w => !wallets.some(d => d.rdns === w.rdns) && (isMobile ? w.platforms.includes("mobile") : w.platforms.includes("extension")))
            .slice(0, 5)
            .map(w => btn(
              {
                id: w.id,
                name: w.name,
                desc: w.description,
                icon: <img src={`data:image/svg+xml,${encodeURIComponent(w.icon)}`} alt={w.name} className="h-7 w-7 rounded-full" />,
                badge: w.platforms.includes("mobile") ? "Mobile" : "Extension",
              },
              () => {
                setWalletSearch("")
                setSelectedWallet(w)
                handleWalletConnect()
              }
            ))}
        </>
      )}
      {isMobile && onMobileDeepLink
        ? btn({ id: "mobile-wallet", name: mobileWalletName ?? "Wallet App", desc: "Launch wallet to connect", icon: <PhoneIcon />, badge: "Mobile" }, () => { onMobileDeepLink?.(); setIsOpen(false); })
        : btn({ id: "walletconnect", name: "WalletConnect", desc: "Scan QR with any wallet", icon: <QrIcon />, badge: "QR" }, handleWalletConnect)
      }

    </> 
  )

  const qrContent = (() => {
    switch (view) {
      case "loading-qr": return <QRSkeleton />;
      case "qr-ready": return qrUri ? (
        <div className="text-center">
          {selectedWallet ? (
            <>
              <div className="mb-1 flex items-center justify-center gap-2">
                <img
                  src={`data:image/svg+xml,${encodeURIComponent(selectedWallet.icon)}`}
                  alt={selectedWallet.name}
                  className="h-6 w-6 rounded-full"
                />
                <span className="text-base font-semibold">{selectedWallet.name}</span>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                Open {selectedWallet.name} to connect
              </div>
              {isMobile && selectedWallet.mobileLink && (
                <button
                  onClick={() => {
                    const link = buildDeepLink(selectedWallet, qrUri)
                    if (link) window.open(link, "_blank", "noopener")
                  }}
                  className="mb-3 inline-flex w-full items-center justify-center gap-2 cursor-pointer rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90"
                >
                  <Smartphone size={16} />
                  Open {selectedWallet.name}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="mb-3 text-base font-semibold">Scan with WalletConnect</div>
              <div className="mb-4 text-sm text-muted-foreground">Open your wallet app and scan this QR code to connect.</div>
            </>
          )}
          <div className="mb-3 flex justify-center"><QRCanvas uri={qrUri} /></div>
          <Button variant="outline" className="w-full mb-2" onClick={() => {
            navigator.clipboard.writeText(qrUri).then(() => {
              setUriCopied(true);
              setTimeout(() => setUriCopied(false), 2000);
            }).catch(() => {});
          }}
            data-wc-uri={qrUri}>
            {uriCopied ? <><Check size={14} color="#22c55e" /> URI copied</> : <><Copy size={14} /> Copy link</>}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => { setView("menu"); setQrUri(null); setSelectedWallet(null); }}>Back</Button>
        </div>
      ) : null;
      case "qr-error": return (
        <div className="px-2 py-2 text-center">
          <div className="mb-2 text-sm text-destructive">{pairingErr || "Connection failed"}</div>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={handleRetry}>Retry</Button>
            <Button variant="outline" onClick={() => { setView("menu"); setQrUri(null); setPairingErr(null); setSelectedWallet(null); }}>Back</Button>
          </div>
        </div>
      );
      default: return null;
    }
  })();

  const getTitle = (v: ConnectView): string => {
    switch (v) {
      case "menu": return "Connect a wallet";
      case "loading-qr": case "qr-ready": case "qr-error": return "Scan QR Code";
      default: return "Connect a wallet";
    }
  };

  const getBody = (v: ConnectView): React.ReactNode => {
    switch (v) {
      case "menu": return walletItems;
      case "loading-qr": case "qr-ready": case "qr-error": return qrContent;
      default: return walletItems;
    }
  };

  const title = getTitle(view);
  const body = getBody(view);

  // Connected state: show wallet badge + optional dropdown
  if (externalConnected && address) {
    return (
      <div ref={wrapperRef} className="relative inline-block">
        <WalletBadge
          address={address}
          balance={balance}
          balanceSymbol={balanceSymbol}
          isBalanceLoading={isBalanceLoading}
          onClick={() => setShowWalletDropdown(prev => !prev)}
        />
        {showWalletDropdown && (
          <WalletDropdown
            address={address}
            balance={balance}
            balanceSymbol={balanceSymbol}
            isBalanceLoading={isBalanceLoading}
            tokenBalances={tokenBalances}
            onDisconnect={handleDisconnect}
            onClose={() => setShowWalletDropdown(false)}
            explorerUrl={explorerUrl}
            explorerLabel={explorerLabel}
          />
        )}
      </div>
    );
  }

  // Connected without address: show disconnect button (backward compat)
  if (externalConnected) {
    return (
      <Button onClick={handleDisconnect} className={className}>
        <span className="inline-flex items-center gap-2">
          <LogOut size={18} className="shrink-0 text-destructive" />
          Disconnect
        </span>
      </Button>
    )
  }

  // Disconnected / connecting state
  return (
    <>
      <Button onClick={handleConnectClick}
        className={className} disabled={isConnecting}
        aria-label={isConnecting ? "Connecting" : "Connect Wallet"}>
        <span className="inline-flex items-center gap-2">
          <ConnectSvg />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </span>
      </Button>

      {!(isMobile && onMobileDeepLink) && isOpen && (Dialog && DialogContent ? (
        <Dialog open={true} onOpenChange={(open: boolean) => { if (!open) setIsOpen(false); }}>
          <DialogContent>
            {DialogHeader && DialogTitle
              ? <><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><div className="mt-2">{body}</div></>
              : <><div className="mb-3 text-lg font-semibold">{title}</div>{body}</>
            }
          </DialogContent>
        </Dialog>
      ) : (
        isOpen && (
          <DefaultDialog open={true} onClose={handleClose}>
            <div className="mb-3 flex items-center justify-between">
              {view !== "menu" ? <Button variant="ghost" size="sm" onClick={() => { setView("menu"); setQrUri(null); }}>← Back</Button> : <div />}
              <div className="text-lg font-semibold">{title}</div>
              <Button variant="ghost" size="icon" onClick={handleClose}><X size={16} /></Button>
            </div>
            {body}
          </DefaultDialog>
        )
      ))}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
