import { resolveSimulationEndpoint } from "@naculus/connect-appkit-core";
import {
  SimulationManager,
  type SimulationResult,
} from "@naculus/connect-core";
import type { MaybeRef, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, unref } from "vue";

export interface UseSimulateTransferOptions {
  rpcUrl?: MaybeRef<string | undefined>;
  chainId?: MaybeRef<number | undefined>;
}

export interface UseSimulateTransferReturn {
  result: ShallowRef<SimulationResult | null>;
  loading: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  simulate: (
    tokenAddress: `0x${string}`,
    from: `0x${string}`,
    to: `0x${string}`,
    amount: string,
    options?: { chainId?: number; rpcUrl?: string; decimals?: number },
  ) => Promise<SimulationResult>;
  reset: () => void;
}

/** Vue state shell around the canonical connect-core ERC-20 simulator. */
export function useSimulateTransfer(
  options: UseSimulateTransferOptions = {},
): UseSimulateTransferReturn {
  const result = shallowRef<SimulationResult | null>(null);
  const loading = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let manager: SimulationManager | undefined;
  let generation = 0;
  let disposed = false;

  const simulate: UseSimulateTransferReturn["simulate"] = async (
    tokenAddress,
    from,
    to,
    amount,
    callOptions,
  ) => {
    const own = ++generation;
    loading.value = true;
    error.value = null;
    try {
      const fallbackRpcUrl = unref(options.rpcUrl);
      const endpoint = resolveSimulationEndpoint(
        callOptions?.chainId,
        unref(options.chainId),
        callOptions?.rpcUrl,
        fallbackRpcUrl,
      );
      manager ??= new SimulationManager({
        enabled: true,
        rpcUrl: fallbackRpcUrl,
        autoSimulate: false,
      });
      const value = await manager.simulateERC20Transfer(
        tokenAddress,
        from,
        to,
        amount,
        endpoint.chainId,
        callOptions?.decimals,
        endpoint.rpcUrl,
      );
      if (!disposed && own === generation) result.value = value;
      return value;
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error(String(cause));
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      if (!disposed && own === generation) loading.value = false;
    }
  };

  const reset = (): void => {
    generation++;
    result.value = null;
    error.value = null;
    loading.value = false;
  };

  onScopeDispose(() => {
    disposed = true;
    generation++;
  });

  return { result, loading, error, simulate, reset };
}
