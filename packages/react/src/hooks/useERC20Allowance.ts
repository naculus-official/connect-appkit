import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useViemClient } from "./useViemClient";
import { ERC20_MIN_ABI } from "@naculus/connect-core";
import type { TokenConfig } from "@naculus/connect-core";
import type { Address } from "viem";

// ── Types ─────────────────────────────────────────────────────────

export interface UseERC20AllowanceOptions {
  token: TokenConfig;
  owner: Address;
  spender: Address;
  refreshInterval?: number;
}

export interface UseERC20AllowanceReturn {
  allowance: string | null;
  allowanceRaw: bigint | null;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useERC20Allowance(
  options: UseERC20AllowanceOptions,
): UseERC20AllowanceReturn {
  const { publicClient } = useViemClient();
  const [allowanceRaw, setAllowanceRaw] = useState<bigint | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAllowance = useCallback(async () => {
    if (!publicClient) return;

    setIsFetching(true);
    setError(null);

    try {
      const raw = await publicClient.readContract({
        address: options.token.address,
        abi: ERC20_MIN_ABI,
        functionName: "allowance",
        args: [options.owner, options.spender],
      });
      setAllowanceRaw(raw as bigint);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch allowance"));
      setAllowanceRaw(null);
    } finally {
      setIsFetching(false);
    }
  }, [publicClient, options.token.address, options.owner, options.spender]);

  // Initial fetch
  useEffect(() => {
    fetchAllowance().catch((e) => console.warn("useERC20Allowance: initial fetch failed:", e));
  }, [fetchAllowance]);

  // Auto-refresh interval
  useEffect(() => {
    if (options.refreshInterval && options.refreshInterval > 0) {
      intervalRef.current = setInterval(fetchAllowance, options.refreshInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [options.refreshInterval, fetchAllowance]);

  const allowance = useMemo(() => {
    if (allowanceRaw === null) return null;
    const decimals = options.token.decimals ?? 18;
    const str = allowanceRaw.toString();
    const padded = str.padStart(decimals + 1, "0");
    const dotPos = padded.length - decimals;
    let intPart = padded.slice(0, dotPos).replace(/^0+/, "") || "0";
    let fracPart = padded.slice(dotPos).replace(/0+$/, "");
    return fracPart ? `${intPart}.${fracPart}` : intPart;
  }, [allowanceRaw, options.token.decimals]);

  return {
    allowance,
    allowanceRaw,
    isFetching,
    error,
    refetch: fetchAllowance,
  };
}
