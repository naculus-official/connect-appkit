"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface DiscoveredWallet {
  id: string
  name: string
  icon?: string
  rdns: string
  provider?: unknown
}

export interface UseEIP6963Result {
  wallets: DiscoveredWallet[]
  isDetecting: boolean
  hasWallets: boolean
}

/**
 * Hook to discover EIP-6963 wallets (browser extensions like MetaMask, Phantom, etc.)
 * Uses the eip6963:announceProvider / requestProvider protocol.
 */
export function useEIP6963(): UseEIP6963Result {
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([])
  const [isDetecting, setIsDetecting] = useState(true)
  const seenRef = useRef(new Set<string>())

  useEffect(() => {
    seenRef.current.clear()
    setIsDetecting(true)

    const handleAnnounce = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const info = detail?.info
      const provider = detail?.provider

      if (!info?.rdns || seenRef.current.has(info.rdns)) return
      seenRef.current.add(info.rdns)

      setWallets(prev => {
        if (prev.find(w => w.id === info.rdns)) return prev
        return [...prev, {
          id: info.rdns,
          name: info.name || info.rdns,
          icon: info.icon || "",
          rdns: info.rdns,
          provider,
        }]
      })
    }

    window.addEventListener("eip6963:announceProvider", handleAnnounce)

    // Fallback: EIP-6963 announcements race React's useEffect — a wallet can
    // announce (or only inject a provider, never announcing) before we listen,
    // so it is silently missed. Catch injected providers directly.
    const addFallback = (id: string, name: string, provider: unknown) => {
      if (seenRef.current.has(id)) return
      seenRef.current.add(id)
      setWallets((prev) =>
        prev.some((w) => w.id === id)
          ? prev
          : [...prev, { id, name, icon: "", rdns: id, provider }],
      )
    }

    const win = window as unknown as {
      ethereum?: { isMetaMask?: boolean }
      phantom?: unknown
      solana?: { isPhantom?: boolean }
    }
    if (win.ethereum?.isMetaMask) {
      addFallback("io.metamask", "MetaMask", win.ethereum)
    }
    // Phantom injects window.phantom (and window.solana.isPhantom) but does NOT
    // EIP-6963 announce on non-secure (http://) origins — its phantom.js has a
    // protocol check. Catch the injected provider so it is still detected.
    if (win.phantom) {
      addFallback("app.phantom", "Phantom", win.phantom)
    } else if (win.solana?.isPhantom) {
      addFallback("app.phantom", "Phantom", win.solana)
    }

    window.dispatchEvent(new Event("eip6963:requestProvider"))

    // Give wallets time to announce, then mark done
    const timer = setTimeout(() => setIsDetecting(false), 500)

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce)
      clearTimeout(timer)
    }
  }, [])

  return {
    wallets,
    isDetecting,
    hasWallets: wallets.length > 0,
  }
}
