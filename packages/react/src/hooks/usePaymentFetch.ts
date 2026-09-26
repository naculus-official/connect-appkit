import {
  describePayment,
  type PaymentFetch,
  type PaymentRecord,
} from "@naculus/connect-appkit-core";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UsePaymentFetchReturn {
  /** Fetch through the paying fetch; resolves to its full result. */
  payFetch: PaymentFetch;
  /** True while any request is in flight. */
  isPending: boolean;
  /**
   * The most recently completed payment. Every paid request is recorded, in
   * completion order, until `reset()`.
   */
  lastPayment: PaymentRecord | null;
  error: Error | null;
  reset: () => void;
}

/**
 * State around a caller-owned paying fetch — `createX402Fetch`
 * (`@naculus/payments-x402`) or `createMppFetch` (`@naculus/payments-mpp`),
 * built with the session key and limits the app chooses. What may be paid is
 * decided there and by the session key's policy, not here.
 */
export function usePaymentFetch(pay: PaymentFetch): UsePaymentFetchReturn {
  const [inFlight, setInFlight] = useState(0);
  const [lastPayment, setLastPayment] = useState<PaymentRecord | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // Newest request publishes errors; any paid request records its payment
  // (money was spent) until reset() or unmount bumps the epoch.
  const generationRef = useRef(0);
  const epochRef = useRef(0);
  const payRef = useRef(pay);
  payRef.current = pay;

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      epochRef.current += 1;
    };
  }, []);

  const payFetch = useCallback<PaymentFetch>(async (input, init) => {
    const own = ++generationRef.current;
    const epoch = epochRef.current;
    setInFlight((n) => n + 1);
    setError(null);
    try {
      const result = await payRef.current(input, init);
      const payment = describePayment(input, result);
      if (payment && epoch === epochRef.current) setLastPayment(payment);
      return result;
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("Paid request failed");
      if (own === generationRef.current) setError(normalized);
      throw normalized;
    } finally {
      setInFlight((n) => n - 1);
    }
  }, []);

  const reset = useCallback(() => {
    generationRef.current += 1;
    epochRef.current += 1;
    setLastPayment(null);
    setError(null);
  }, []);

  return { payFetch, isPending: inFlight > 0, lastPayment, error, reset };
}
