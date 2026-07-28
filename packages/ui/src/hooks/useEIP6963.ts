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
