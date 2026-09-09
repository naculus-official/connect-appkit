import {
  caip2ToHexChain,
  readAtomicSupport,
  type WalletCapabilities,
} from "@naculus/connect-core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { resolveClient } from "./client-resolver";

/**
 * Whether a wallet can execute a batch atomically.
 *
 * Three values, not two. A wallet that does not implement
 * `wallet_getCapabilities` has not said no — it has said nothing, and EIP-5792
 * is explicit that absence is not a denial. Collapsing that into `false` sends
 * every such wallet down the sequential path, which is the one where an
 * approve can land and the swap it was for can fail.
 */
export type AtomicSupport = "supported" | "unsupported" | "unknown";

export interface ChainCapabilities {
  /** CAIP-2 chain this describes. */
  chainId: string;
  atomic: AtomicSupport;
  /** Largest batch the wallet will accept, when it says. */
  maxBatchSize?: number;
  /** The raw entry, for capabilities this SDK does not model. */
  raw: WalletCapabilities;
}

export interface UseCapabilitiesReturn {
  /** Per-chain, keyed by CAIP-2. Null until a query has actually returned. */
  capabilities: Record<string, ChainCapabilities> | null;
  /** The connected chain's entry, for the common case. */
  current: ChainCapabilities | null;
  /**
   * Atomic support on the connected chain.
   *
   * `"unknown"` while loading, when the wallet does not implement the method,
   * and when the query failed — all three are "we have not been told", and a
   * caller deciding between an atomic and a sequential path needs to know that
   * rather than be handed a confident `false`.
   */
  atomic: AtomicSupport;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * What the connected wallet says it can do — EIP-5792
 * `wallet_getCapabilities`.
 *
 * This is the query a dApp makes *before* choosing how to execute: ask whether
 * the wallet batches atomically, then send one batch or a sequence, rather
 * than sending a batch and discovering the answer from a rejection.
 */
export function useCapabilities(): UseCapabilitiesReturn {
  const { client, session, chainId } = useWeb3();
  const [capabilities, setCapabilities] = useState<Record<
    string,
    ChainCapabilities
  > | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Guards a slow answer for a previous session overwriting a newer one.
  const generationRef = useRef(0);

  const refetch = useCallback(async () => {
    const activeClient = resolveClient(client);
    if (!activeClient?.getCapabilities || !session) {
      setCapabilities(null);
      return;
    }
    const generation = ++generationRef.current;
    setIsFetching(true);
    setError(null);
    try {
      const raw = await activeClient.getCapabilities(session);
      if (generation !== generationRef.current) return;
      const next: Record<string, ChainCapabilities> = {};
      for (const [key, entry] of Object.entries(raw ?? {})) {
        if (!entry || typeof entry !== "object") continue;
        const { supported, maxBatchSize } = readAtomicSupport(
          entry as Record<string, unknown>,
        );
        next[key] = {
          chainId: key,
          atomic: supported ? "supported" : "unsupported",
          ...(maxBatchSize === undefined ? {} : { maxBatchSize }),
          raw: entry as WalletCapabilities,
        };
      }
      setCapabilities(next);
    } catch (err) {
      if (generation !== generationRef.current) return;
      // Cleared rather than left stale. A capability map from a previous
      // wallet is a worse answer than no answer.
      setCapabilities(null);
      setError(
        err instanceof Error ? err : new Error("Capability query failed"),
      );
    } finally {
      if (generation === generationRef.current) setIsFetching(false);
    }
  }, [client, session]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // The connector normalizes keys to CAIP-2, but a wallet answering in raw hex
  // through a custom connector should still be found rather than reported as
  // "unknown" next to an entry that is right there.
  const hexKey = chainId ? caip2ToHexChain(chainId) : undefined;
  const current =
    (chainId ? capabilities?.[chainId] : undefined) ??
    (hexKey ? capabilities?.[hexKey] : undefined) ??
    null;

  return {
    capabilities,
    current,
    atomic: current?.atomic ?? "unknown",
    isFetching,
    error,
    refetch,
  };
}
