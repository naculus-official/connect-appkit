/// <reference types="vitest" />
/// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useEmbeddedWallet } from "./useEmbeddedWallet";

// -- Mocks --

const mockUseWeb3 = vi.fn();
vi.mock("../provider/Web3ConnectProvider", () => ({
  useWeb3: () => mockUseWeb3(),
  Web3ConnectProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockGetClient = vi.fn();
vi.mock("../client", () => ({
  getClient: () => mockGetClient(),
}));

const mockConnector = {
  load: vi.fn(),
  getWallet: vi.fn(),
  generateWallet: vi.fn(),
  importFromMnemonic: vi.fn(),
  importFromPrivateKey: vi.fn(),
  wipe: vi.fn(),
};

function mockStandardEmbedded() {
  mockGetClient.mockReturnValue({ embeddedConnector: mockConnector });
}

describe("useEmbeddedWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardEmbedded();
  });

  it("should have initial idle state", () => {
    mockUseWeb3.mockReturnValue({
      connectEmbedded: vi.fn(),
      status: "disconnected",
    });

    const { result } = renderHook(() => useEmbeddedWallet());

    expect(result.current.hasWallet).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.seedPhrase).toBeNull();
    expect(result.current.backupPending).toBe(false);
    expect(result.current.isBusy).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("connectEmbedded should call provider and set wallet", async () => {
    const providerConnect = vi.fn().mockResolvedValue(undefined);
    mockUseWeb3.mockReturnValue({
      connectEmbedded: providerConnect,
      status: "disconnected",
    });

    const fakeWallet = {
      mnemonic: "test mnemonic phrase",
      privateKey: "0xfake",
      address: "0xfakeAddress",
    };

    mockConnector.load.mockReturnValue(false);
    mockConnector.getWallet.mockReturnValue(fakeWallet);

    const { result } = renderHook(() => useEmbeddedWallet());

    await act(async () => {
      await result.current.connectEmbedded();
    });

    expect(providerConnect).toHaveBeenCalled();
    expect(mockConnector.getWallet).toHaveBeenCalled();
    expect(result.current.wallet).toEqual(fakeWallet);
    expect(result.current.hasWallet).toBe(true);
    expect(result.current.address).toBe("0xfakeAddress");
    expect(result.current.isBusy).toBe(false);
  });

  it("generateWallet should create a new wallet and set backup pending", async () => {
    mockUseWeb3.mockReturnValue({
      connectEmbedded: vi.fn(),
      status: "disconnected",
    });

    const newWallet = {
      mnemonic: "actual random mnemonic",
      privateKey: "0xnewPrivateKey",
      address: "0xnewAddress",
    };

    mockConnector.generateWallet.mockResolvedValue({
      mnemonic: newWallet.mnemonic,
      privateKey: newWallet.privateKey,
      address: newWallet.address,
    });

    const { result } = renderHook(() => useEmbeddedWallet());

    await act(async () => {
      await result.current.generateWallet();
    });

    expect(mockConnector.generateWallet).toHaveBeenCalled();
    expect(result.current.wallet).toEqual(newWallet);
    expect(result.current.seedPhrase).toBe(newWallet.mnemonic);
    expect(result.current.backupPending).toBe(true);
    expect(result.current.isBusy).toBe(false);
  });

  it("importFromMnemonic should import from seed phrase", async () => {
    mockUseWeb3.mockReturnValue({
      connectEmbedded: vi.fn(),
      status: "disconnected",
    });

    const imported = {
      mnemonic: "",
      privateKey: "0ximportedKey",
      address: "0ximportedAddr",
    };

    mockConnector.importFromMnemonic.mockResolvedValue({
      mnemonic: imported.mnemonic,
      privateKey: imported.privateKey,
      address: imported.address,
    });

    const { result } = renderHook(() => useEmbeddedWallet());

    await act(async () => {
      await result.current.importFromMnemonic("my seed phrase");
    });

    expect(mockConnector.importFromMnemonic).toHaveBeenCalledWith("my seed phrase");
    expect(result.current.wallet).toEqual(imported);
    expect(result.current.seedPhrase).toBeNull();
    expect(result.current.backupPending).toBe(false);
  });

  it("wipe should clear wallet and seed phrase", () => {
    mockUseWeb3.mockReturnValue({
      connectEmbedded: vi.fn(),
      status: "disconnected",
    });

    mockConnector.getWallet.mockReturnValue({
      mnemonic: "some mnemonic",
      privateKey: "0xpk",
      address: "0xaddr",
    });

    const { result } = renderHook(() => useEmbeddedWallet());

    act(() => {
      result.current.wipe();
    });

    expect(mockConnector.wipe).toHaveBeenCalled();
    expect(result.current.hasWallet).toBe(false);
    expect(result.current.seedPhrase).toBeNull();
    expect(result.current.backupPending).toBe(false);
  });

  it("confirmBackup should clear seed phrase from react state", async () => {
    mockUseWeb3.mockReturnValue({
      connectEmbedded: vi.fn(),
      status: "disconnected",
    });

    mockConnector.getWallet.mockReturnValue({
      mnemonic: "some mnemonic",
      privateKey: "0xpk",
      address: "0xaddr",
    });

    const { result } = renderHook(() => useEmbeddedWallet());

    await act(async () => {
      await result.current.connectEmbedded();
    });

    act(() => {
      result.current.confirmBackup();
    });

    expect(result.current.seedPhrase).toBeNull();
    expect(result.current.backupPending).toBe(false);
  });

  it("should handle error when embedded not enabled", async () => {
    mockUseWeb3.mockReturnValue({
      connectEmbedded: vi.fn(),
      status: "disconnected",
    });

    mockGetClient.mockReturnValue({ embeddedConnector: null });

    const { result } = renderHook(() => useEmbeddedWallet());

    await act(async () => {
      await result.current.connectEmbedded();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isBusy).toBe(false);
  });

  it("clearError should reset error state", async () => {
    mockUseWeb3.mockReturnValue({
      connectEmbedded: vi.fn(),
      status: "disconnected",
    });

    mockGetClient.mockReturnValue({ embeddedConnector: null });

    const { result } = renderHook(() => useEmbeddedWallet());

    await act(async () => {
      await result.current.connectEmbedded();
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it("should set isBusy during operations", async () => {
    mockUseWeb3.mockReturnValue({
      connectEmbedded: vi.fn(),
      status: "disconnected",
    });

    let resolveGen: (value: any) => void;
    const genPromise = new Promise<any>((resolve) => { resolveGen = resolve; });
    mockConnector.generateWallet.mockReturnValue(genPromise);

    const { result } = renderHook(() => useEmbeddedWallet());

    let callPromise: Promise<any>;
    act(() => {
      callPromise = result.current.generateWallet();
    });

    expect(result.current.isBusy).toBe(true);

    await act(async () => {
      resolveGen!({
        mnemonic: "test",
        privateKey: "0xtest",
        address: "0xtest",
      });
      await callPromise!;
    });

    expect(result.current.isBusy).toBe(false);
  });
});
