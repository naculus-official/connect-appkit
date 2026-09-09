/// <reference types="vitest" />
/// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUserOpStatus } from "./useUserOpStatus";

/**
 * Polling for a UserOperation receipt, previously 0% covered.
 *
 * The no-receipt path gave up after maxRetries and set a terminal state. The
 * network-error path had the same retry budget but no terminal branch: once
 * exhausted it simply stopped scheduling, leaving isPolling true, status
 * "pending", no error, and the elapsed-time interval still counting. A caller
 * watched a spinner for a result that was never coming.
 */

const HASH = `0x${"ab".repeat(32)}` as `0x${string}`;
const bundlerUrl = "https://bundler.example/rpc";

const receipt = (success: boolean) => ({
  userOpHash: HASH,
  entryPoint: `0x${"11".repeat(20)}`,
  sender: `0x${"22".repeat(20)}`,
  nonce: "1",
  actualGasUsed: "21000",
  actualGasCost: "1000000000",
  success,
  transactionHash: HASH,
  logs: [],
});

function respondWith(impl: () => Promise<unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const result = await impl();
      return { ok: true, status: 200, json: async () => result } as Response;
    }),
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("useUserOpStatus", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useUserOpStatus({ bundlerUrl }));
    expect(result.current.status).toBe("idle");
    expect(result.current.isPolling).toBe(false);
    expect(result.current.attempts).toBe(0);
  });

  it("reports a confirmed receipt", async () => {
    respondWith(async () => ({ result: receipt(true) }));
    const { result } = renderHook(() => useUserOpStatus({ bundlerUrl }));
    act(() => result.current.start(HASH));
    await waitFor(() => expect(result.current.isPolling).toBe(false));
    expect(result.current.status).toBe("confirmed");
    expect(result.current.error).toBeNull();
  });

  it("reports a failed operation", async () => {
    respondWith(async () => ({ result: receipt(false) }));
    const { result } = renderHook(() => useUserOpStatus({ bundlerUrl }));
    act(() => result.current.start(HASH));
    await waitFor(() => expect(result.current.isPolling).toBe(false));
    expect(result.current.status).toBe("failed");
  });

  it("reaches a terminal state when the bundler is unreachable", async () => {
    // The defect in one assertion: this used to hang on "pending" forever.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const { result } = renderHook(() =>
      useUserOpStatus({ bundlerUrl, pollInterval: 1, maxRetries: 0 }),
    );
    act(() => result.current.start(HASH));
    await waitFor(() => expect(result.current.isPolling).toBe(false));
    expect(result.current.status).toBe("not_found");
    expect(result.current.error?.message).toMatch(/unavailable/);
  });

  it("names the underlying network failure in the error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const { result } = renderHook(() =>
      useUserOpStatus({ bundlerUrl, pollInterval: 1, maxRetries: 0 }),
    );
    act(() => result.current.start(HASH));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toMatch(/ECONNREFUSED/);
  });

  it("gives up when the operation never lands", async () => {
    respondWith(async () => ({ result: null }));
    const { result } = renderHook(() =>
      useUserOpStatus({ bundlerUrl, pollInterval: 1, maxRetries: 0 }),
    );
    act(() => result.current.start(HASH));
    await waitFor(() => expect(result.current.isPolling).toBe(false));
    expect(result.current.status).toBe("not_found");
    expect(result.current.error).not.toBeNull();
  });

  it("stop() halts polling", async () => {
    respondWith(async () => ({ result: null }));
    const { result } = renderHook(() =>
      useUserOpStatus({ bundlerUrl, pollInterval: 50 }),
    );
    act(() => result.current.start(HASH));
    act(() => result.current.stop());
    expect(result.current.isPolling).toBe(false);
  });

  it("reset() returns to the initial state", async () => {
    respondWith(async () => ({ result: null }));
    const { result } = renderHook(() =>
      useUserOpStatus({ bundlerUrl, pollInterval: 50 }),
    );
    act(() => result.current.start(HASH));
    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
    expect(result.current.userOpHash).toBeNull();
    expect(result.current.attempts).toBe(0);
  });

  it("does nothing without a bundler URL", () => {
    const { result } = renderHook(() => useUserOpStatus({}));
    act(() => result.current.start(HASH));
    expect(result.current.status).not.toBe("confirmed");
  });
});
