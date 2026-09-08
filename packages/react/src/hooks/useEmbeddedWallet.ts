import { WalletError } from "@naculus/connect-core";
import type {
  StorageSecurityReport,
  WalletAccount,
  WalletData,
  WalletNamespace,
} from "@naculus/connector-embedded";
import { useCallback, useRef, useState } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { resolveClient } from "./client-resolver";

export interface UseEmbeddedWalletReturn {
  connectEmbedded: () => Promise<void>;
  generateWallet: () => Promise<WalletData | null>;
  importFromMnemonic: (mnemonic: string) => Promise<WalletData | null>;
  /**
   * Import a raw key in whatever form the user has it.
   *
   * Accepts the forms MetaMask, Phantom and `solana-keygen` export, and works
   * out which chain it belongs to rather than asking. Only that namespace is
   * enabled: a key is on exactly one curve, so an account for the other would
   * be an address the key cannot control and the user cannot recover.
   */
  importFromPrivateKey: (pk: string) => Promise<WalletData | null>;
  wipe: () => Promise<void>;
  wallet: WalletData | null;
  hasWallet: boolean;
  /** The active account's address. See `accounts` for the rest. */
  address: string | null;
  /**
   * Every account this wallet holds, one per namespace.
   *
   * A phrase derives an independent key per BIP-44 coin type, so a wallet
   * created from one holds both an EVM and a Solana account. They are not
   * variants of one key — holding one does not reveal the other.
   */
  accounts: WalletAccount[];
  /** Which account signs when no namespace is named. */
  activeNamespace: WalletNamespace | null;
  /**
   * Choose which account signs.
   *
   * Rejects a namespace this wallet holds no account for, rather than leaving
   * it pointing at nothing — a wallet imported from a raw key has only the
   * namespace that key belongs to.
   */
  setActiveNamespace: (namespace: WalletNamespace) => void;
  /**
   * Derive accounts the phrase produces but this record does not yet hold.
   *
   * A wallet created before multi-namespace support already owns its Solana
   * account — the same phrase in Phantom shows the balance — so this makes it
   * visible here rather than leaving funds reachable everywhere except in this
   * app. Leaves the active namespace alone: someone who had an Ethereum wallet
   * yesterday should not find themselves on Solana today.
   */
  backfillAccounts: () => Promise<WalletAccount[]>;
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
  /**
   * The same tier as a score with the findings behind it, or null before a
   * wallet exists.
   *
   * Null rather than a worst-case report: the storage backend is chosen when
   * the wallet is created, so warning about it beforehand would describe a
   * state that has not happened.
   */
  securityReport: StorageSecurityReport | null;
}

export function useEmbeddedWallet(): UseEmbeddedWalletReturn {
  const { connectEmbedded: providerConnectEmbedded, client } = useWeb3();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const seedPhraseRef = useRef<string | null>(null);
  // The connector builds a fresh report object on every call, so returning it
  // straight through would hand consumers a new identity each render and make
  // it unusable as an effect dependency. Reuse the previous object while the
  // content is unchanged.
  const reportRef = useRef<{ json: string; value: StorageSecurityReport } | null>(
    null,
  );
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
    const activeClient = resolveClient(client);
    if (!activeClient?.embeddedConnector) {
      throw new WalletError(
        "wallet_unavailable",
        "Embedded wallet not enabled.",
      );
    }
    return activeClient.embeddedConnector;
  };

  const getPassphraseGate = () => {
    try {
      return resolveClient(client)?.passphraseGate ?? null;
    } catch {
      return null;
    }
  };

  /**
   * Drop a passphrase that did not open the wallet.
   *
   * Without this the gate keeps handing the same wrong value to every retry:
   * the user is told their passphrase is wrong and is never asked for a
   * different one, which reads as a wallet that will not open at all.
   */
  const forgetOnDecryptionFailure = (err: unknown) => {
    const code = (err as { code?: unknown } | null)?.code;
    if (code !== "decryption_failed") return;
    getPassphraseGate()?.forget("That passphrase did not open the wallet.");
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
      forgetOnDecryptionFailure(err);
      setError(
        err instanceof Error
          ? err
          : new Error("Embedded wallet connection failed"),
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleGenerateWallet = async (): Promise<WalletData | null> => {
    setIsBusy(true);
    setError(null);
    try {
      const connector = getEmbeddedConnector();
      // The first save will ask for a passphrase. Say which question to put
      // to the user: prompting "enter your passphrase" for a wallet that does
      // not exist yet has no right answer.
      getPassphraseGate()?.expect("create");
      const w = await connector.generateWallet();
      setWallet(w);
      seedPhraseRef.current = w.mnemonic;
      setBackupPending(true);
      return w;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to generate wallet"),
      );
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const handleImportFromMnemonic = async (
    mnemonic: string,
  ): Promise<WalletData | null> => {
    setIsBusy(true);
    setError(null);
    try {
      const connector = getEmbeddedConnector();
      // The first save will ask for a passphrase. Say which question to put
      // to the user: prompting "enter your passphrase" for a wallet that does
      // not exist yet has no right answer.
      getPassphraseGate()?.expect("create");
      const w = await connector.importFromMnemonic(mnemonic);
      setWallet(w);
      seedPhraseRef.current = null;
      setBackupPending(false);
      return w;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to import wallet"),
      );
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const handleImportFromPrivateKey = async (
    pk: string,
  ): Promise<WalletData | null> => {
    setIsBusy(true);
    setError(null);
    try {
      const connector = getEmbeddedConnector();
      getPassphraseGate()?.expect("create");
      const w = await connector.importFromPrivateKey(pk);
      setWallet(w);
      seedPhraseRef.current = null;
      setBackupPending(false);
      return w;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to import wallet"),
      );
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const handleWipe = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const connector = getEmbeddedConnector();
      await connector.wipe();
      setWallet(null);
      seedPhraseRef.current = null;
      setBackupPending(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to wipe wallet"));
    } finally {
      setIsBusy(false);
    }
  };

  /**
   * Switch namespaces and re-render.
   *
   * The wallet record is mutated in place by the connector, so a new object
   * has to be published for React to notice — without it the switch happens
   * and the UI keeps showing the previous address, which is the kind of
   * mismatch a user acts on before anyone notices.
   */
  const handleSetActiveNamespace = useCallback((namespace: WalletNamespace) => {
    const connector = getEmbeddedConnector();
    connector.setActiveNamespace(namespace);
    const next = connector.getWallet();
    setWallet(next ? ({ ...next } as WalletData) : null);
  }, []);

  const handleBackfillAccounts = useCallback(async () => {
    const connector = getEmbeddedConnector();
    // The connector persists what it adds, so this only has to publish it.
    const added = await connector.backfillAccounts();
    if (added.length > 0) {
      const next = connector.getWallet();
      setWallet(next ? ({ ...next } as WalletData) : null);
    }
    return added;
  }, []);

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
    accounts: wallet?.accounts ?? [],
    activeNamespace: wallet?.activeNamespace ?? null,
    setActiveNamespace: handleSetActiveNamespace,
    backfillAccounts: handleBackfillAccounts,
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
    securityReport: (() => {
      let next: StorageSecurityReport | null = null;
      try {
        next = getEmbeddedConnector().getStorageSecurityReport?.() ?? null;
      } catch {
        next = null;
      }
      if (!next) {
        reportRef.current = null;
        return null;
      }
      const json = JSON.stringify(next);
      if (reportRef.current?.json === json) return reportRef.current.value;
      reportRef.current = { json, value: next };
      return next;
    })(),
  };
}
