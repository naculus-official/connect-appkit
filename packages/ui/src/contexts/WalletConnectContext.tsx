"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import { useWeb3 } from "@naculus/connect-appkit-react";

export type QRStatus = "idle" | "loading" | "ready" | "error" | "cancelled";

export interface WalletConnectState {
  qrUri: string | null;
  showQR: boolean;
  qrStatus: QRStatus;
  error: string | null;
}

export interface WalletConnectContextValue {
  state: WalletConnectState;
  connectWalletConnect: () => Promise<void>;
  cancelQR: () => void;
  retryQR: () => void;
}

const WalletConnectContext = createContext<WalletConnectContextValue | null>(null);

export interface WalletConnectProviderProps {
  children: React.ReactNode;
}

export function WalletConnectProvider({ children }: WalletConnectProviderProps) {
  const web3 = useWeb3();
  
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrStatus, setQrStatus] = useState<QRStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const cancelQR = useCallback(() => {
    setQrUri(null);
    setShowQR(false);
    setQrStatus("cancelled");
    setError(null);
  }, []);

  const connectRef = useRef<() => Promise<void>>(undefined)
  connectRef.current = async () => {
    if (!web3.startPairing || !web3.completePairing) {
      setError("WalletConnect pairing not available")
      setQrStatus("error")
      return
    }
    setQrStatus("loading")
    setError(null)
    setShowQR(true)
    console.log("[WalletConnect] calling startPairing...")
    try {
      const uri = await Promise.race([
        web3.startPairing(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error("WalletConnect pairing timed out after 15s")), 15000)),
      ])
      console.log("[WalletConnect] got URI:", uri?.slice(0, 20))
      setQrStatus("ready")
      try {
        await web3.completePairing()
        setTimeout(() => { setShowQR(false); setQrUri(null); setQrStatus("idle") }, 1000)
      } catch (err) {
        setQrStatus("error")
        setError(err instanceof Error ? err.message : "Connection failed")
      }
    } catch (err) {
        console.error("[WalletConnect] startPairing failed:", err)
        setQrStatus("error")
        setError(err instanceof Error ? err.message : "Failed to generate QR code")
    }
  }

  const connectWalletConnect = useCallback(async () => {
    connectRef.current?.()
  }, [])

  const retryQR = useCallback(() => {
    setQrUri(null)
    setError(null)
    setQrStatus("loading")
    connectRef.current?.()
  }, [])

  const state = useMemo<WalletConnectState>(
    () => ({
      qrUri,
      showQR,
      qrStatus,
      error,
    }),
    [qrUri, showQR, qrStatus, error]
  );

  const value = useMemo<WalletConnectContextValue>(
    () => ({
      state,
      connectWalletConnect,
      cancelQR,
      retryQR,
    }),
    [state, connectWalletConnect, cancelQR, retryQR]
  );

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect(): WalletConnectContextValue {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error("useWalletConnect must be used within a WalletConnectProvider");
  }
  return context;
}

export function useWalletConnectOptional(): WalletConnectContextValue | null {
  return useContext(WalletConnectContext);
}