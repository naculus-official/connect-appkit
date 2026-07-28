"use client";

import { useCallback, useMemo } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import {
  getUserFriendlyError,
  isRetryableError,
} from "../utils/errorMessages";

export interface UserFriendlyError {
  title: string;
  description: string;
  code?: string;
}

export interface UseWeb3ErrorHandlerReturn {
  /** Current error from the provider */
  error: Error | null;
  /** User-friendly representation of the current error */
  friendlyError: UserFriendlyError | null;
  /** Clear the current error */
  clearError: () => void;
  /** Check if current error is retryable */
  isRetryable: boolean;
  /** Get a user-friendly version of any error */
  formatError: (error: unknown) => UserFriendlyError;
  /** Wraps an async function with error formatting */
  wrapAsync: <T>(fn: () => Promise<T>) => () => Promise<T>;
}

/**
 * Hook that provides user-friendly error handling for web3 operations.
 *
 * Features:
 * - Maps WalletError codes to human-readable messages
 * - Provides retry detection for transient errors
 * - Wraps async operations with consistent error formatting
 * - Exposes the current error state from Web3ConnectProvider
 *
 * @example
 * ```tsx
 * const { friendlyError, clearError, isRetryable, wrapAsync } = useWeb3ErrorHandler();
 *
 * // Show error in UI
 * if (friendlyError) {
 *   return <ErrorDisplay title={friendlyError.title} message={friendlyError.description} />;
 * }
 *
 * // Wrap an operation
 * const safeConnect = wrapAsync(() => connect());
 * await safeConnect();
 * ```
 */
export function useWeb3ErrorHandler(): UseWeb3ErrorHandlerReturn {
  const { error, clearError: providerClearError } = useWeb3();

  const friendlyError: UserFriendlyError | null = useMemo(
    () => (error ? getUserFriendlyError(error) : null),
    [error]
  );

  const isRetryable = useMemo(
    () => (error ? isRetryableError(error) : false),
    [error]
  );

  const clearError = useCallback(() => {
    providerClearError();
  }, [providerClearError]);

  const formatError = useCallback(
    (err: unknown): UserFriendlyError => getUserFriendlyError(err),
    []
  );

  const wrapAsync = useCallback(
    <T,>(fn: () => Promise<T>): (() => Promise<T>) => {
      return async () => {
        try {
          return await fn();
        } catch (err) {
          // Re-throw with user-friendly information attached
          const friendly = getUserFriendlyError(err);
          const enhanced = new Error(friendly.description) as unknown as Record<string, unknown>;
          enhanced.title = friendly.title;
          enhanced.code = friendly.code;
          throw enhanced;
        }
      };
    },
    []
  );

  return {
    error,
    friendlyError,
    clearError,
    isRetryable,
    formatError,
    wrapAsync,
  };
}
