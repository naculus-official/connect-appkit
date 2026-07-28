import { useCallback, useRef, useState } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { getClient } from "../client";
import type { WalletData } from "@naculus/connector-embedded";
import { WalletError } from "@naculus/connect-core";

export interface UseEmbeddedWalletReturn {
  connectEmbedded: () => Promise<void>;
  generateWallet: () => Promise<WalletData | null>;
  importFromMnemonic: (mnemonic: string) => Promise<WalletData | null>;
  importFromPrivateKey: (pk: `0x${string}`) => Promise<WalletData | null>;
  wipe: () => void;
  wallet: WalletData | null;
  hasWallet: boolean;
  address: string | null;
  /** @deprecated Use getSeedPhrase() instead. This field will be removed. */
  seedPhrase: string | null;
  /** Get seed phrase once and clear from memory. Returns mnemonic or null. */
  getSeedPhrase: () => string | null;
  backupPending: boolean;
  confirmBackup: () => void;
  isBusy: boolean;
  error: Error | null;
  clearError: () => void;
  /**
   * Storage security tier (1-4).
   *   1 = IndexedDB + AES-GCM,  2 = IndexedDB,
   *   3 = localStorage + AES-GCM, 4 = localStorage plaintext
   */
  storageSecurityLevel: number;
}

export function useEmbeddedWallet(): UseEmbeddedWalletReturn {
  const { connectEmbedded: providerConnectEmbedded } = useWeb3();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const seedPhraseRef = useRef<string | null>(null);
  const [backupPending, setBackupPending] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearError = () => setError(null);

  /** Get seed phrase once and immediately clear from memory */
  const getSeedPhrase = useCallback(() => {
    const phrase = seedPhraseRef.current;
    seedPhraseRef.current = null; // Clear immediately
    return phrase;
  }, []);

  const getEmbeddedConnector = () => {
    const client = getClient();
    if (!client?.embeddedConnector) {
      throw new WalletError("wallet_unavailable", "Embedded wallet not enabled.");
    }
    return client.embeddedConnector;
  };

  const handleConnectEmbedded = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const connector = getEmbeddedConnector();
      const loaded = await connector.load();
      const w = connector.getWallet();
      if (loaded && w) {
        setWallet(w);
        seedPhraseRef.current = w.mnemonic || null;
        setBackupPending(!w.mnemonic);
      }
      await providerConnectEmbedded();
      const w2 = connector.getWallet();
      if (w2) {
        setWallet(w2);
        if (w2.mnemonic && !loaded) {
          seedPhraseRef.current = w2.mnemonic;
          setBackupPending(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Embedded wallet connection failed"));
    } finally {
      setIsBusy(false);
    }
  };

  const handleGenerateWallet = async (): Promise<WalletData | null> => {
    setIsBusy(true);
    setError(null);
    try {
      const connector = getEmbeddedConnector();
      const w = await connector.generateWallet();
      setWallet(w);
      seedPhraseRef.current = w.mnemonic;
      setBackupPending(true);
      return w;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to generate wallet"));
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const handleImportFromMnemonic = async (mnemonic: string): Promise<WalletData | null> => {
    setIsBusy(true);
    setError(null);
    try {
      const connector = getEmbeddedConnector();
      const w = await connector.importFromMnemonic(mnemonic);
      setWallet(w);
      seedPhraseRef.current = null;
      setBackupPending(false);
      return w;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to import wallet"));
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const handleImportFromPrivateKey = async (pk: `0x${string}`): Promise<WalletData | null> => {
    setIsBusy(true);
    setError(null);
    try {
      const connector = getEmbeddedConnector();
      const w = await connector.importFromPrivateKey(pk);
      setWallet(w);
      seedPhraseRef.current = null;
      setBackupPending(false);
      return w;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to import wallet"));
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const handleWipe = () => {
    try {
      const connector = getEmbeddedConnector();
      connector.wipe();
      setWallet(null);
      seedPhraseRef.current = null;
      setBackupPending(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to wipe wallet"));
    }
  };

  const handleConfirmBackup = () => {
    seedPhraseRef.current = null;
    setBackupPending(false);
  };

  return {
    connectEmbedded: handleConnectEmbedded,
    generateWallet: handleGenerateWallet,
    importFromMnemonic: handleImportFromMnemonic,
    importFromPrivateKey: handleImportFromPrivateKey,
    wipe: handleWipe,
    wallet,
    hasWallet: wallet !== null,
    address: wallet?.address ?? null,
    seedPhrase: seedPhraseRef.current, // backward compat (deprecated)
    getSeedPhrase,
    backupPending,
    confirmBackup: handleConfirmBackup,
    isBusy,
    error,
    clearError,
    storageSecurityLevel: (() => {
      try {
        return getEmbeddedConnector().getStorageSecurityLevel?.() ?? 4;
      } catch {
        return 4;
      }
    })(),
  };
}
