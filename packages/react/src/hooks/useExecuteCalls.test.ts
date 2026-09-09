/// <reference types="vitest" />
/// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseCapabilities = vi.fn();
vi.mock("./useCapabilities", () => ({
  useCapabilities: () => mockUseCapabilities(),
}));
const mockSendCalls = vi.fn(async () => "0xbatch");
vi.mock("./useSendCalls", () => ({
  useSendCalls: () => ({ sendCalls: mockSendCalls }),
}));

import { useExecuteCalls } from "./useExecuteCalls";

function withAtomic(atomic: string, maxBatchSize?: number) {
  mockUseCapabilities.mockReturnValue({
    atomic,
    current: maxBatchSize === undefined ? null : { maxBatchSize },
  });
}

const CALLS = [{ to: "0x1" as const }, { to: "0x2" as const }];

beforeEach(() => {
  vi.clearAllMocks();
  mockSendCalls.mockResolvedValue("0xbatch");
});

describe("useExecuteCalls — preview", () => {
  it("says the calls will land together when the wallet batches", () => {
    withAtomic("supported");
    const { result } = renderHook(() => useExecuteCalls());
    const plan = result.current.preview(2, "required");
    expect(plan.route).toBe("wallet-batch");
    expect(plan.atomic).toBe(true);
  });

  it("says they will be sent one by one when it cannot", () => {
    withAtomic("unsupported");
    const { result } = renderHook(() => useExecuteCalls());
    const plan = result.current.preview(2, "preferred");
    expect(plan.route).toBe("sequential");
    expect(plan.atomic).toBe(false);
    expect(plan.reason).toMatch(/one by one/);
  });

  // The whole point: an approve batched with the swap it pays for, sent
  // separately, leaves an approval standing to a contract the user never
  // transacted with.
  it("has no route at all when atomicity is required and impossible", () => {
    withAtomic("unsupported");
    const { result } = renderHook(() => useExecuteCalls());
    expect(result.current.preview(2, "required").route).toBeNull();
  });

  it("routes to a UserOperation rather than refusing when one is available", () => {
    withAtomic("unsupported");
    const { result } = renderHook(() =>
      useExecuteCalls({ userOperation: async () => "0xuserop" }),
    );
    const plan = result.current.preview(2, "required");
    expect(plan.route).toBe("user-operation");
    expect(plan.atomic).toBe(true);
  });

  it("leaves a single call alone — it is atomic by itself", () => {
    withAtomic("unsupported");
    const { result } = renderHook(() => useExecuteCalls());
    const plan = result.current.preview(1, "required");
    expect(plan.route).toBe("sequential");
    expect(plan.atomic).toBe(true);
  });

  // An older wallet may batch atomically without being able to advertise it,
  // and a flagged batch is rejected cleanly if it cannot.
  it("still tries a batch when the wallet never answered the query", () => {
    withAtomic("unknown");
    const { result } = renderHook(() => useExecuteCalls());
    expect(result.current.preview(2, "required").route).toBe("wallet-batch");
  });

  it("refuses a batch larger than the wallet accepts", () => {
    withAtomic("supported", 3);
    const { result } = renderHook(() => useExecuteCalls());
    expect(result.current.preview(5, "required").route).toBeNull();
  });

  it("never returns a plan without a reason", () => {
    for (const atomic of ["supported", "unsupported", "unknown"]) {
      withAtomic(atomic);
      const { result } = renderHook(() => useExecuteCalls());
      for (const req of ["required", "preferred", "any"] as const) {
        expect(result.current.preview(2, req).reason.length).toBeGreaterThan(20);
      }
    }
  });
});

describe("useExecuteCalls — execute", () => {
  it("sends through the wallet batch when that is the route", async () => {
    withAtomic("supported");
    const { result } = renderHook(() => useExecuteCalls());
    await act(async () => {
      await result.current.execute(CALLS, "required");
    });
    expect(mockSendCalls).toHaveBeenCalledWith(CALLS);
    expect(result.current.lastRoute).toBe("wallet-batch");
  });

  it("sends nothing at all when the requirement cannot be met", async () => {
    withAtomic("unsupported");
    const { result } = renderHook(() => useExecuteCalls());
    await act(async () => {
      await expect(
        result.current.execute(CALLS, "required"),
      ).rejects.toThrow(/cannot execute several calls atomically/);
    });
    expect(mockSendCalls).not.toHaveBeenCalled();
    expect(result.current.lastRoute).toBeNull();
  });

  it("uses the smart account when the wallet cannot batch", async () => {
    withAtomic("unsupported");
    const userOperation = vi.fn(async () => "0xuserop");
    const { result } = renderHook(() => useExecuteCalls({ userOperation }));
    let hash = "";
    await act(async () => {
      hash = await result.current.execute(CALLS, "required");
    });
    expect(userOperation).toHaveBeenCalledWith(CALLS);
    expect(mockSendCalls).not.toHaveBeenCalled();
    expect(hash).toBe("0xuserop");
  });

  it("falls back to sequential when the caller accepts it", async () => {
    withAtomic("unsupported");
    const { result } = renderHook(() => useExecuteCalls());
    await act(async () => {
      await result.current.execute(CALLS, "preferred");
    });
    expect(mockSendCalls).toHaveBeenCalled();
    expect(result.current.lastRoute).toBe("sequential");
  });

  it("surfaces an executor failure rather than swallowing it", async () => {
    withAtomic("supported");
    mockSendCalls.mockRejectedValue(new Error("user rejected"));
    const { result } = renderHook(() => useExecuteCalls());
    await act(async () => {
      await expect(result.current.execute(CALLS)).rejects.toThrow(
        "user rejected",
      );
    });
    expect(result.current.error?.message).toBe("user rejected");
  });
});
