import { bareEvmAddress } from "@naculus/connect-appkit-core";
import {
  type DelegationStatus,
  readDelegation,
  UNKNOWN_DELEGATION,
} from "@naculus/connect-core";
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

/** Minimal read-only contract; a viem PublicClient can supply getCode. */
export interface DelegationCodeReader {
  getCode(args: { address: `0x${string}` }): Promise<`0x${string}` | undefined>;
}

export interface UseDelegationReturn {
  delegated: ComputedRef<boolean | null>;
  delegate: ComputedRef<`0x${string}` | null>;
  isFetching: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  refetch: () => Promise<void>;
}

/** Read current EIP-7702 delegation without treating an unread account as undelegated. */
export function useDelegation(
  account: MaybeRefOrGetter<string | null | undefined>,
  client: MaybeRefOrGetter<DelegationCodeReader | null | undefined>,
  chainId?: MaybeRefOrGetter<string | null | undefined>,
): UseDelegationReturn {
  const status = shallowRef<DelegationStatus>(UNKNOWN_DELEGATION);
  const isFetching = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let disposed = false;

  const refetch = async (): Promise<void> => {
    const mine = ++generation;
    const reader = toValue(client);
    const address = bareEvmAddress(toValue(account));
    status.value = UNKNOWN_DELEGATION;
    error.value = null;
    if (!reader || !address) {
      isFetching.value = false;
      return;
    }
    isFetching.value = true;
    try {
      const code = await reader.getCode({ address });
      if (!disposed && mine === generation) {
        status.value = readDelegation(code ?? "0x");
      }
    } catch (cause) {
      if (!disposed && mine === generation) {
        status.value = UNKNOWN_DELEGATION;
        error.value =
          cause instanceof Error ? cause : new Error("Code read failed");
      }
    } finally {
      if (!disposed && mine === generation) isFetching.value = false;
    }
  };

  watch(
    () => [toValue(account), toValue(client), toValue(chainId)] as const,
    () => {
      void refetch();
    },
    { immediate: true, flush: "sync" },
  );
  onScopeDispose(() => {
    disposed = true;
    generation++;
  });

  return {
    delegated: computed(() => status.value.delegated),
    delegate: computed(() => status.value.delegate),
    isFetching,
    error,
    refetch,
  };
}
