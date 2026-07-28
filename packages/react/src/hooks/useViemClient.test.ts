/// <reference types="vitest" />
/// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseAccount = vi.fn();
vi.mock("./useAccount", () => ({
  useAccount: () => mockUseAccount(),
}));

const mockUseChain = vi.fn();
vi.mock("./useChain", () => ({
  useChain: () => mockUseChain(),
}));

vi.mock("../utils/chains", () => ({
  getDefaultChains: () => [
    { id: 1, namespace: "eip155", name: "Ethereum", rpcUrl: "https://eth.llamarpc.com", token: "ETH" },
  ],
}));

import { useViemClient } from "./useViemClient";

describe("useViemClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null clients when not connected", () => {
    mockUseAccount.mockReturnValue({
      evmAccount: null,
      isConnected: false,
    });
    mockUseChain.mockReturnValue({
      currentChain: null,
      chains: [{ id: 1, namespace: "eip155", name: "Ethereum", rpcUrl: "https://eth.llamarpc.com", token: "ETH" }],
    });

    const { result } = renderHook(() => useViemClient());

    expect(result.current.publicClient).toBeNull();
    expect(result.current.walletClient).toBeNull();
    expect(result.current.chains).toHaveLength(1);
  });

  it("should create public client when chain has rpcUrl", () => {
    mockUseAccount.mockReturnValue({
      evmAccount: null,
      isConnected: false,
    });
    mockUseChain.mockReturnValue({
      currentChain: {
        id: 1,
        namespace: "eip155",
        name: "Ethereum",
        rpcUrl: "https://eth.llamarpc.com",
        token: "ETH",
      },
    });

    const { result } = renderHook(() => useViemClient());

    expect(result.current.publicClient).not.toBeNull();
    expect(result.current.publicClient?.chain?.id).toBe(1);
    // walletClient should still be null since not connected
    expect(result.current.walletClient).toBeNull();
  });

  it("should create both public and wallet client when connected with evm account", () => {
    mockUseAccount.mockReturnValue({
      evmAccount: "eip155:1:0x1234567890123456789012345678901234567890",
      isConnected: true,
    });
    mockUseChain.mockReturnValue({
      currentChain: {
        id: 1,
        namespace: "eip155",
        name: "Ethereum",
        rpcUrl: "https://eth.llamarpc.com",
        token: "ETH",
      },
    });

    const { result } = renderHook(() => useViemClient());

    expect(result.current.publicClient).not.toBeNull();
    expect(result.current.walletClient).not.toBeNull();
    expect(result.current.walletClient?.account?.address).toBe("0x1234567890123456789012345678901234567890");
  });

  it("should handle plain address format (without eip155 prefix)", () => {
    mockUseAccount.mockReturnValue({
      evmAccount: "0xabcdef1234567890abcdef1234567890abcdef12",
      isConnected: true,
    });
    mockUseChain.mockReturnValue({
      currentChain: {
        id: 137,
        namespace: "eip155",
        name: "Polygon",
        rpcUrl: "https://polygon-rpc.com",
        token: "MATIC",
      },
    });

    const { result } = renderHook(() => useViemClient());

    expect(result.current.publicClient).not.toBeNull();
    expect(result.current.walletClient).not.toBeNull();
    expect(result.current.walletClient?.account?.address).toBe("0xabcdef1234567890abcdef1234567890abcdef12");
  });

  it("should return null wallet client when not connected", () => {
    mockUseAccount.mockReturnValue({
      evmAccount: null,
      isConnected: true,
    });
    mockUseChain.mockReturnValue({
      currentChain: {
        id: 1,
        namespace: "eip155",
        name: "Ethereum",
        rpcUrl: "https://eth.llamarpc.com",
        token: "ETH",
      },
    });

    const { result } = renderHook(() => useViemClient());

    expect(result.current.publicClient).not.toBeNull();
    expect(result.current.walletClient).toBeNull();
  });

  it("should return null clients when no rpcUrl", () => {
    mockUseAccount.mockReturnValue({
      evmAccount: null,
      isConnected: false,
    });
    mockUseChain.mockReturnValue({
      currentChain: {
        id: 1,
        namespace: "eip155",
        name: "Ethereum",
        rpcUrl: undefined,
        token: "ETH",
      },
    });

    const { result } = renderHook(() => useViemClient());

    expect(result.current.publicClient).toBeNull();
    expect(result.current.walletClient).toBeNull();
  });
});
