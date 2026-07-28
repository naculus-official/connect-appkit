/// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";

// ── Hoisted mocks ──────────────────────────────────────────────────

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    connect: vi.fn(),
    connectEmbedded: vi.fn(),
    connectPasskeys: vi.fn(),
    completePairing: vi.fn(),
    signMessage: vi.fn(),
    startPairing: vi.fn(),
    connector: { onSessionExpiry: vi.fn() },
    solanaConnector: null,
    disconnect: vi.fn(),
    reconnect: vi.fn(),
    connectInjected: vi.fn(),
  },
}));

vi.mock("../client", () => ({
  createClient: vi.fn(() => mockClient),
}));

vi.mock("@naculus/connector-evm-injected", () => ({
  eip6963Connector: { startDiscovery: vi.fn(), switchChain: vi.fn() },
}));

const { MockStorage } = vi.hoisted(() => {
  return {
    MockStorage: class {
      save = vi.fn();
      load = vi.fn();
      clear = vi.fn();
    },
  };
});

vi.mock("@naculus/connect-core", () => ({
  LocalStorageSessionStorage: MockStorage,
  createConnectorManager: vi.fn(() => ({ register: vi.fn() })),
  createSessionManager: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    restoreFromPersistence: vi.fn(),
    switchChain: vi.fn(),
  })),
  SessionManager: class {},
  ConnectorManager: class {},
  WalletError: class WalletError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message ?? code);
      this.name = "WalletError";
      this.code = code;
    }
  },
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("../utils/chains", () => ({
  getDefaultChains: vi.fn(() => []),
}));

import { Web3ConnectProvider, useWeb3 } from "./Web3ConnectProvider";

// ── Fixtures ───────────────────────────────────────────────────────

const mockSession = {
  id: "test-session",
  walletType: "eip155",
  namespaces: {
    "eip155": {
      chains: ["eip155:1"],
      accounts: ["eip155:1:0x1234567890abcdef"],
    },
  },
};

const siwxConfig = {
  createMessage: vi.fn().mockResolvedValue("Sign this message"),
  handleSignComplete: vi.fn().mockResolvedValue(undefined),
  required: true,
};

const baseConfig = {
  projectId: "test-project-id",
  metadata: {
    name: "Test",
    description: "Test",
    url: "https://test.com",
    icons: ["https://test.com/icon.png"],
  },
};

function renderWithProvider(config: Record<string, unknown> = {}) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Web3ConnectProvider config={{ ...baseConfig, ...config } as any} autoConnect={false}>
      {children}
    </Web3ConnectProvider>
  );
  return renderHook(() => useWeb3(), { wrapper });
}

describe("Web3ConnectProvider — SIWx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.connect.mockReset().mockResolvedValue(mockSession);
    mockClient.completePairing.mockReset().mockResolvedValue(mockSession);
    mockClient.signMessage.mockReset().mockResolvedValue("0xsignature");
  });

  it("runSiwx is called after successful connection when config.siwx is set", async () => {
    const { result } = renderWithProvider({ siwx: siwxConfig });

    await act(async () => {
      await result.current.connect();
    });

    expect(siwxConfig.createMessage).toHaveBeenCalledWith({
      address: "0x1234567890abcdef",
      chainId: "eip155:1",
    });
    expect(mockClient.signMessage).toHaveBeenCalled();
  });

  it("status becomes connected when SIWx succeeds", async () => {
    const { result } = renderWithProvider({ siwx: siwxConfig });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe("connected");
  });

  it("status stays disconnected when SIWx is required and fails", async () => {
    mockClient.signMessage.mockRejectedValue(new Error("SIWx failed"));
    const { result } = renderWithProvider({ siwx: siwxConfig });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe("disconnected");
    expect(result.current.session).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it("status becomes connected normally when siwx is not configured", async () => {
    const { result } = renderWithProvider();

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe("connected");
  });

  it("completePairing returns the session even when SIWx fails", async () => {
    mockClient.signMessage.mockRejectedValue(new Error("SIWx failed"));
    const { result } = renderWithProvider({ siwx: siwxConfig });

    let session: unknown;
    await act(async () => {
      session = await result.current.completePairing();
    });

    expect(session).toBe(mockSession);
    expect(result.current.status).toBe("disconnected");
  });
});
