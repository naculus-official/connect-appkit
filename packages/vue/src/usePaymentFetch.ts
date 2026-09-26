import {
  describePayment,
  type PaymentFetch,
  type PaymentFetchResult,
  type PaymentRecord,
} from "@naculus/connect-appkit-core";
import type { MaybeRef, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, unref } from "vue";
import { useActionGuard } from "./internal/action-guard";

export interface UsePaymentFetchReturn {
  /** Fetch through the paying fetch; resolves to its full result. */
  payFetch: PaymentFetch;
  /** True while any request is in flight. */
  isPending: ShallowRef<boolean>;
  /**
   * The most recently completed payment. Every paid request is recorded, in
   * completion order, until `reset()`.
   */
  lastPayment: ShallowRef<PaymentRecord | null>;
  error: ShallowRef<Error | null>;
  reset: () => void;
}

/**
 * Reactive state around a caller-owned paying fetch — `createX402Fetch`
 * (`@naculus/payments-x402`) or `createMppFetch` (`@naculus/payments-mpp`),
 * built with the session key and limits the app chooses. What may be paid is
 * decided there and by the session key's policy, not here.
 */
export function usePaymentFetch(
  pay: MaybeRef<PaymentFetch>,
): UsePaymentFetchReturn {
  const guard = useActionGuard();
  const lastPayment = shallowRef<PaymentRecord | null>(null);
  // A payment is money spent: any paid request records it, not only the
  // newest. Only reset() and disposal stop older requests from recording.
  let epoch = 0;
  onScopeDispose(() => {
    epoch++;
  });

  const payFetch: PaymentFetch = (input, init) => {
    const invoke = unref(pay);
    const own = epoch;
    return guard.run(async (): Promise<PaymentFetchResult> => {
      const result = await invoke(input, init);
      const payment = describePayment(input, result);
      if (payment && own === epoch) lastPayment.value = payment;
      return result;
    }, "Paid request failed");
  };

  return {
    payFetch,
    isPending: guard.busy,
    lastPayment,
    error: guard.error,
    reset: () => {
      epoch++;
      guard.reset();
      lastPayment.value = null;
    },
  };
}
