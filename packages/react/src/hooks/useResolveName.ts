import { useState, useEffect, useCallback, useRef } from "react";
import { NameResolver } from "@naculus/connect-core";
import type { AddressResult, NameResolverConfig } from "@naculus/connect-core";

/**
 * Options for the useResolveName hook.
 */
export interface UseResolveNameOptions {
  /** Whether to skip resolution (e.g. if input is invalid). Default: false. */
  skip?: boolean;
  /** Custom resolver configuration (overrides default RPC URLs). */
  resolverConfig?: NameResolverConfig;
}

/**
 * Result of a name resolution query.
 */
export interface UseResolveNameResult {
  /** Resolved address, or null if not found / not started. */
  data: AddressResult | null;
  /** Whether the resolution is in progress. */
  isLoading: boolean;
  /** Error that occurred during resolution, if any. */
  error: Error | null;
  /** Manually trigger re-resolution of the current name. */
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
 * React hook to resolve a human-readable name to a blockchain address.
 *
 * Supports ENS (.eth) and SNS (.sol) names.
 * Automatically detects the name service from the suffix.
 *
 * @example
 * ```tsx
 * function AddressInput() {
 *   const { data, isLoading, error } = useResolveName('vitalik.eth');
 *   return <div>{data?.address ?? 'Enter a name'}</div>;
 * }
 * ```
 */
export function useResolveName(
  name: string,
  options?: UseResolveNameOptions,
): UseResolveNameResult {
  const [data, setData] = useState<AddressResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const skip = options?.skip ?? false;
  const resolverRef = useRef<NameResolver | null>(null);
  const activeNameRef = useRef<string>("");
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

  const resolve = useCallback(() => {
    const cleanName = name.trim();

    if (!cleanName || skip) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Avoid re-resolving the same name
    if (activeNameRef.current === cleanName && data) {
      return;
    }

    activeNameRef.current = cleanName;
    setIsLoading(true);
    setError(null);

    resolver
      .resolveName(cleanName)
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
  }, [name, skip]);

  // Resolve when name changes
  useEffect(() => {
    resolve();
  }, [resolve]);

  const refetch = useCallback(() => {
    activeNameRef.current = "";
    resolve();
  }, [resolve]);

  return { data, isLoading, error, refetch };
}
