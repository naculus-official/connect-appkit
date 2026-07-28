/// <reference types="vitest" />

// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { validateDestination, useValidateDestination } from "./useValidateDestination";
import { renderHook } from "@testing-library/react";

describe("validateDestination", () => {
  // Valid addresses
  it("accepts valid EVM addresses", () => {
    expect(validateDestination("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045").isValid).toBe(true);
    expect(validateDestination("0x1234567890abcdef1234567890abcdef12345678").isValid).toBe(true);
  });

  it("rejects empty address", () => {
    expect(validateDestination("").isValid).toBe(false);
    expect(validateDestination("").level).toBe("blocked");
  });

  it("rejects zero address", () => {
    expect(validateDestination("0x0000000000000000000000000000000000000000").isValid).toBe(false);
    expect(validateDestination("0x0000000000000000000000000000000000000000").level).toBe("blocked");
  });

  it("rejects burn addresses", () => {
    expect(validateDestination("0x000000000000000000000000000000000000dead").isValid).toBe(false);
    expect(validateDestination("0x0000000000000000000000000000000000000001").isValid).toBe(false);
  });

  it("rejects invalid format", () => {
    expect(validateDestination("not-an-address").isValid).toBe(false);
    expect(validateDestination("0x123").isValid).toBe(false);
    expect(validateDestination("0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG").isValid).toBe(false);
  });

  // Property-based: fuzz variant with many generated addresses
  it("correctly validates 50 random-like hex strings", () => {
    for (let i = 0; i < 50; i++) {
      // Generate random 40-char hex
      const hex = "0x" + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      const result = validateDestination(hex);

      // All properly formatted EVM addresses should be valid unless they're zero/burn
      if (hex === "0x0000000000000000000000000000000000000000" ||
          hex.toLowerCase().includes("dead") && hex.length === 42) {
        expect(result.isValid).toBe(false);
      } else {
        expect(result.isValid).toBe(true);
        expect(result.level).toBe("safe");
      }
    }
  });

  // Edge cases
  it("handles uppercase addresses", () => {
    expect(validateDestination("0xABCDEF1234567890ABCDEF1234567890ABCDEF12").isValid).toBe(true);
  });

  it("handles mixed case checksum addresses", () => {
    expect(validateDestination("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045").isValid).toBe(true);
  });
});

describe("useValidateDestination", () => {
  it("returns safe validation for valid address", () => {
    const { result } = renderHook(() =>
      useValidateDestination({ address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" })
    );
    expect(result.current.validation.isValid).toBe(true);
    expect(result.current.validation.level).toBe("safe");
    expect(result.current.validation.warning).toBe(null);
  });

  it("returns blocked for zero address", () => {
    const { result } = renderHook(() =>
      useValidateDestination({ address: "0x0000000000000000000000000000000000000000" })
    );
    expect(result.current.validation.isValid).toBe(false);
    expect(result.current.validation.level).toBe("blocked");
    expect(result.current.validation.warning).toBeTruthy();
  });

  it("updates when address changes", () => {
    const { result, rerender } = renderHook(
      ({ address }) => useValidateDestination({ address }),
      { initialProps: { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" } }
    );
    expect(result.current.validation.isValid).toBe(true);

    rerender({ address: "0x0000000000000000000000000000000000000000" });
    expect(result.current.validation.isValid).toBe(false);
  });
});
