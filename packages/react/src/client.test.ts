// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Need vi.hoisted because vi.mock is hoisted above variable declarations
const { mockWalletConnectConnector, mockEmbeddedConnector, mockSolanaConnector } = vi.hoisted(() => {
  const wc = {
    id: "walletconnect",
    name: "WalletConnect",
    kind: "walletconnect",
    connect: vi.fn().mockResolvedValue({ id: "wc-session" }),
    disconnect: vi.fn().mockResolvedValue(undefined),
    reconnect: vi.fn().mockResolvedValue({ id: "wc-session" }),
    startPairing: vi.fn().mockResolvedValue("wc://uri?key=test"),
    completePairing: vi.fn().mockResolvedValue({ id: "wc-session" }),
    switchChain: vi.fn().mockResolvedValue(undefined),
    getAccounts: vi.fn().mockResolvedValue([]),
    signMessage: vi.fn(),
  };

  const embedded = {
    id: "embedded",
    name: "Embedded Wallet",
    kind: "embedded",
    connect: vi.fn().mockResolvedValue({ id: "embedded-session", walletType: "embedded" }),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getAccounts: vi.fn().mockResolvedValue([]),
  };

  const solana = {
    id: "solana",
    name: "Solana",
    kind: "solana" as const,
    connect: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
    reconnect: vi.fn(),
    startPairing: vi.fn(),
    completePairing: vi.fn(),
    switchChain: vi.fn(),
    getAccounts: vi.fn().mockResolvedValue([]),
    signMessage: vi.fn().mockResolvedValue("signed-message"),
    sendTransaction: vi.fn().mockResolvedValue("tx-hash"),
  };

  return { mockWalletConnectConnector: wc, mockEmbeddedConnector: embedded, mockSolanaConnector: solana };
});

vi.mock("@naculus/connector-walletconnect", () => ({
  createWalletConnectConnector: vi.fn(() => mockWalletConnectConnector),
  WalletConnectConnector: vi.fn(),
}));

vi.mock("@naculus/connector-embedded", () => ({
  createPocketConnector: vi.fn(() => mockEmbeddedConnector),
}));

vi.mock("@naculus/connector-solana", () => ({
  solanaConnector: mockSolanaConnector,
}));

import {
  createClient,
  clearClient,
  getClient,
} from "./client";

const defaultConfig = {
  projectId: "test-project-id",
  metadata: {
    name: "Test App",
    description: "Test Description",
    url: "https://test.com",
    icons: ["https://test.com/icon.png"],
  },
};

describe("createClient", () => {
  beforeEach(() => {
    clearClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearClient();
  });

  describe("basic client", () => {
    it("should create a client", () => {
      const client = createClient(defaultConfig);
      expect(client).toBeDefined();
      expect(client.connector).toBeDefined();
    });

    it("should return singleton", () => {
      const client1 = createClient(defaultConfig);
      const client2 = createClient(defaultConfig);
      expect(client1).toBe(client2);
    });

    it("getClient should return null before creation", () => {
      expect(getClient()).toBeNull();
    });

    it("getClient should return instance after creation", () => {
      const client = createClient(defaultConfig);
      expect(getClient()).toBe(client);
    });

    it("clearClient allows fresh instance", () => {
      const client1 = createClient(defaultConfig);
      clearClient();
      expect(getClient()).toBeNull();
      const client2 = createClient(defaultConfig);
      expect(client2).not.toBe(client1);
    });

    it("should delegate connect() to WalletConnect", async () => {
      const client = createClient(defaultConfig);
      const session = await client.connect();
      expect(mockWalletConnectConnector.connect).toHaveBeenCalledOnce();
      expect(session).toEqual({ id: "wc-session" });
    });

    it("should delegate disconnect()", async () => {
      const client = createClient(defaultConfig);
      const session = { id: "test" } as any;
      await client.disconnect(session);
      expect(mockWalletConnectConnector.disconnect).toHaveBeenCalledWith(session);
    });

    it("should delegate reconnect()", async () => {
      const client = createClient(defaultConfig);
      const session = { id: "test" } as any;
      const result = await client.reconnect(session);
      expect(mockWalletConnectConnector.reconnect).toHaveBeenCalledWith(session);
      expect(result).toEqual({ id: "wc-session" });
    });

    it("should delegate startPairing/completePairing", async () => {
      const client = createClient(defaultConfig);
      const uri = await client.startPairing();
      expect(uri).toBe("wc://uri?key=test");
      expect(await client.completePairing()).toEqual({ id: "wc-session" });
    });

    it("should throw on connectEmbedded when not enabled", async () => {
      const client = createClient(defaultConfig);
      await expect(client.connectEmbedded()).rejects.toThrow("not enabled");
    });

    it("should return 1 connector from getAllConnectors", () => {
      const client = createClient(defaultConfig);
      expect(client.getAllConnectors()).toHaveLength(1);
    });
  });

  describe("with Embedded Wallet enabled", () => {
    it("should connect embedded wallet", async () => {
      const client = createClient({ ...defaultConfig, enableEmbedded: true });
      const session = await client.connectEmbedded();
      expect(session).toEqual({ id: "embedded-session", walletType: "embedded" });
    });

    it("should set embeddedConnector after connect", async () => {
      const client = createClient({ ...defaultConfig, enableEmbedded: true });
      await client.connectEmbedded();
      expect(client.embeddedConnector).not.toBeNull();
      expect(client.embeddedConnector!.id).toBe("embedded");
    });

    it("should include embedded in getAllConnectors", async () => {
      const client = createClient({ ...defaultConfig, enableEmbedded: true });
      await client.connectEmbedded();
      const connectors = client.getAllConnectors();
      expect(connectors.find((c) => c.kind === "embedded")).toBeDefined();
    });
  });

  describe("with Solana enabled", () => {
    it("signMessage routes to solana connector", async () => {
      const client = createClient({ ...defaultConfig, enableSolana: false });
      client._setSolanaConnector(mockSolanaConnector as any);

      const session = { walletType: "solana", id: "sol-session", namespaces: {} } as any;
      const result = await client.signMessage(session, { message: "hello" });

      expect(mockSolanaConnector.signMessage).toHaveBeenCalledWith(session, { message: "hello" });
      expect(result).toBe("signed-message");
    });

    it("signMessage awaits solanaInit before routing", async () => {
      const client = createClient({ ...defaultConfig, enableSolana: true });

      const session = { walletType: "solana", id: "sol-session", namespaces: {} } as any;
      const result = await client.signMessage(session, { message: "hello" });

      expect(mockSolanaConnector.signMessage).toHaveBeenCalled();
      expect(result).toBe("signed-message");
      expect(client.solanaConnector).toBe(mockSolanaConnector);
    });

    it("signMessage with no solana connector throws WalletError", async () => {
      const client = createClient(defaultConfig);

      const session = { walletType: "solana", id: "sol-session", namespaces: {} } as any;
      await expect(
        client.signMessage(session, { message: "hello" })
      ).rejects.toThrow("Solana connector not available");
    });

    it("sendTransaction routes to solana connector", async () => {
      const client = createClient({ ...defaultConfig, enableSolana: false });
      client._setSolanaConnector(mockSolanaConnector as any);

      const session = { walletType: "solana", id: "sol-session", namespaces: {} } as any;
      const tx = { transaction: { from: "abc" } };
      const result = await client.sendTransaction(session, tx);

      expect(mockSolanaConnector.sendTransaction).toHaveBeenCalledWith(session, tx);
      expect(result).toBe("tx-hash");
    });

    it("disconnect routes to solana connector", async () => {
      const client = createClient({ ...defaultConfig, enableSolana: false });
      client._setSolanaConnector(mockSolanaConnector as any);

      const session = { walletType: "solana", id: "sol-session", namespaces: {} } as any;
      await client.disconnect(session);

      expect(mockSolanaConnector.disconnect).toHaveBeenCalledWith(session);
    });

    it("reconnect with solana walletType returns session as-is", async () => {
      const client = createClient({ ...defaultConfig, enableSolana: false });
      client._setSolanaConnector(mockSolanaConnector as any);

      const session = { walletType: "solana", id: "sol-session", namespaces: {} } as any;
      const result = await client.reconnect(session);

      expect(result).toBe(session);
    });
  });
});
