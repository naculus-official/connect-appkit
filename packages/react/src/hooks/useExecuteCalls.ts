import {
  type AtomicityRequirement,
  type BatchCall,
  type ExecutionPlan,
  planExecution,
  WalletError,
} from "@naculus/connect-core";
import { useCallback, useState } from "react";
import { useCapabilities } from "./useCapabilities";
import { useSendCalls } from "./useSendCalls";

/** Which executor actually runs the calls. */
export type ExecutionRoute = "wallet-batch" | "user-operation" | "sequential";

export interface ExecutionPreview extends ExecutionPlan {
  route: ExecutionRoute | null;
}

export interface UseExecuteCallsOptions {
  /** Default requirement for `execute`. Per-call override is also accepted. */
  atomicity?: AtomicityRequirement;
  /**
   * A smart-account executor, typically `sendUserOp` from
   * `useSendUserOperation`.
   *
   * A UserOperation carries its calls in one on-chain execution, so it is
   * atomic by construction. Supplying this gives a wallet that cannot batch a
   * route that still satisfies `"required"` instead of a refusal.
   */
  userOperation?: (calls: BatchCall[]) => Promise<string>;
}

export interface UseExecuteCallsReturn {
  /**
   * What would happen for this many calls, without sending anything.
   *
   * This is the query EIP-5792 exists for. An application can show "these two
   * will land together" or "these will be sent one by one" before the user
   * commits, rather than discovering it from a half-executed batch.
   */
  preview: (
    callCount: number,
    atomicity?: AtomicityRequirement,
  ) => ExecutionPreview;
  execute: (
    calls: BatchCall[],
    atomicity?: AtomicityRequirement,
  ) => Promise<string>;
  isExecuting: boolean;
  error: Error | null;
  /** The route the last `execute` took. */
  lastRoute: ExecutionRoute | null;
  reset: () => void;
}

/**
 * Route a set of calls to whichever executor can honour the caller's
 * atomicity requirement — and refuse when none can.
 *
 * `useSendCalls` already picks between an EIP-5792 batch and a sequential
 * fallback, but it picks silently and always sends something. A caller that
 * batched an approve with the swap it pays for cannot tell the difference
 * between "these landed together" and "the approve landed and the swap did
 * not", which is the outcome that leaves an approval standing to a contract
 * the user never transacted with.
 */
export function useExecuteCalls(
  options: UseExecuteCallsOptions = {},
): UseExecuteCallsReturn {
  const { current, atomic } = useCapabilities();
  const { sendCalls } = useSendCalls();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRoute, setLastRoute] = useState<ExecutionRoute | null>(null);

  const defaultAtomicity = options.atomicity ?? "preferred";
  const userOperation = options.userOperation;

  const preview = useCallback(
    (callCount: number, atomicity = defaultAtomicity): ExecutionPreview => {
      const plan = planExecution(
        {
          atomicBatch: atomic === "supported",
          // "The wallet said no" and "the wallet has no way to say" are
          // different facts, and the planner treats them differently.
          discovered: atomic !== "unknown",
          sponsoredTransactions: false,
          ...(current?.maxBatchSize === undefined
            ? {}
            : { maxBatchSize: current.maxBatchSize }),
        },
        callCount,
        atomicity,
      );

      if (plan.strategy === "atomic-batch") {
        return { ...plan, route: "wallet-batch" };
      }
      // A UserOperation executes its calls in one transaction, so it rescues
      // both a refusal and a non-atomic fallback the caller did not want.
      if (userOperation && atomicity !== "any" && !plan.atomic) {
        return {
          strategy: "atomic-batch",
          atomic: true,
          reason:
            "This wallet cannot batch, so the calls are executed as a single UserOperation through the smart account, which lands as one transaction.",
          route: "user-operation",
        };
      }
      if (plan.strategy === "refuse") return { ...plan, route: null };
      return { ...plan, route: "sequential" };
    },
    [atomic, current, userOperation, defaultAtomicity],
  );

  const execute = useCallback(
    async (calls: BatchCall[], atomicity = defaultAtomicity) => {
      setIsExecuting(true);
      setError(null);
      try {
        const chosen = preview(calls.length, atomicity);
        if (chosen.route === null) {
          // Refused before anything is sent. The alternative is a partial
          // execution the caller explicitly said it could not accept.
          throw new WalletError("method_not_allowed", chosen.reason);
        }
        setLastRoute(chosen.route);

        if (chosen.route === "user-operation") {
          return await userOperation!(calls);
        }
        return await sendCalls(calls);
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Execution failed");
        setError(e);
        throw e;
      } finally {
        setIsExecuting(false);
      }
    },
    [preview, sendCalls, userOperation, defaultAtomicity],
  );

  return {
    preview,
    execute,
    isExecuting,
    error,
    lastRoute,
    reset: () => {
      setError(null);
      setLastRoute(null);
    },
  };
}
