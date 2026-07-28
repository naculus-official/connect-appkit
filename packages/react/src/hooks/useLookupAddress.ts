import { useState, useEffect, useCallback, useRef } from "react";
import { NameResolver } from "@naculus/connect-core";
import type { NameResult, NameResolverConfig } from "@naculus/connect-core";

/**
 * Options for the useLookupAddress hook.
 */
export interface UseLookupAddressOptions {
  /** Optional CAIP-2 chain ID to hint which provider to use. */
  chainId?: string;
  /** Whether to skip lookup. Default: false. */
  skip?: boolean;
  /** Custom resolver configuration (overrides default RPC URLs). */
  resolverConfig?: NameResolverConfig;
}

/**
 * Result of an address reverse-lookup query.
 */
export interface UseLookupAddressResult {
  /** Resolved name, or null if not found / not started. */
  data: NameResult | null;
  /** Whether the lookup is in progress. */
  isLoading: boolean;
  /** Error that occurred during lookup, if any. */
  error: Error | null;
  /** Manually trigger re-lookup of the current address. */
  refetch: () => void;
}

// Lazy singleton resolver to avoid creating one per component instance.
let sharedResolver: NameResolver | null = null;

function getResolver(config?: NameResolverConfig): NameResolver {
  if (config) {
    return new NameResolver(config);
  }
  if (!sharedResolver) {
    sharedResolver = new NameResolver();
  }
  return sharedResolver;
}

/**
 * React hook to reverse-lookup a blockchain address to find its human-readable name.
 *
 * Supports ENS (.eth) and SNS (.sol) names.
 * Auto-detects the name service from the address format or chainId hint.
 *
 * @example
 * ```tsx
 * function TransactionRow({ address }: { address: string }) {
 *   const { data, isLoading } = useLookupAddress(address);
 *   return <span>{data?.name ?? address}</span>;
 * }
 * ```
 */
export function useLookupAddress(
  address: string,
  options?: UseLookupAddressOptions,
): UseLookupAddressResult {
  const [data, setData] = useState<NameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const chainId = options?.chainId;
  const skip = options?.skip ?? false;
  const resolverRef = useRef<NameResolver | null>(null);
  const activeAddrRef = useRef<string>("");
  const mountedRef = useRef(true);

  // Keep mounted ref current
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resolver = resolverRef.current ?? getResolver(options?.resolverConfig);
  resolverRef.current = resolver;

  const lookup = useCallback(() => {
    const cleanAddr = address.trim();

    if (!cleanAddr || skip) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Avoid re-looking-up the same address
    if (activeAddrRef.current === cleanAddr && data) {
      return;
    }

    activeAddrRef.current = cleanAddr;
    setIsLoading(true);
    setError(null);

    resolver
      .lookupAddress(cleanAddr, chainId)
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          const resolutionError =
            err instanceof Error ? err : new Error(String(err));
          setError(resolutionError);
          setData(null);
          setIsLoading(false);
        }
      });
  }, [address, chainId, skip]);

  // Lookup when address or chainId changes
  useEffect(() => {
    lookup();
  }, [lookup]);

  const refetch = useCallback(() => {
    activeAddrRef.current = "";
    lookup();
  }, [lookup]);

  return { data, isLoading, error, refetch };
}
