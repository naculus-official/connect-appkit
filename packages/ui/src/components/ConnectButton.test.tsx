/// <reference types="vitest" />
/// @vitest-environment jsdom

import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react"

// Minimal button component for tests (replaces the removed DefaultButton fallback)
function TestButton({ children, className, onClick, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) {
  return <button className={className} onClick={onClick} disabled={disabled} {...rest}>{children}</button>
}

// Mock useIsMobile
const mockUseIsMobile = vi.fn().mockReturnValue(false)
vi.mock("../hooks/useIsMobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

// Mock ComponentRegistry
const mockUseComponentRegistry = vi.fn()
vi.mock("../contexts/ComponentRegistry", () => ({
  useComponentRegistry: () => mockUseComponentRegistry(),
}))

// Mock @naculus/connect-appkit-react — just export a plain object for Web3Context
// The component uses useContext(Web3Context) which returns default value (null).
// Tests that need WalletConnect flow will not test with real Provider.
// Instead they test via onConnect prop.
vi.mock("@naculus/connect-appkit-react", () => ({
  Web3Context: { Provider: ({ children }: any) => children },
}))

// Mock EIP-6963 wallet detection
vi.mock("../hooks/useEIP6963", () => ({
  useEIP6963: () => ({ wallets: [], isDetecting: false, hasWallets: false }),
}))

// Mock qrcode
vi.mock("qrcode", () => ({
  default: { toCanvas: vi.fn((_: any, __: string, _opts: any, cb: (e: null) => void) => cb(null)) },
  toCanvas: vi.fn((_: any, __: string, _opts: any, cb: (e: null) => void) => cb(null)),
}))

import { ConnectButton } from "./ConnectButton"

describe("ConnectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false)
    mockUseComponentRegistry.mockReturnValue({ Button: TestButton })
  })

  afterEach(() => {
    window.dispatchEvent(new Event("eip6963:announceProvider"))
    cleanup()
  })

  it("renders Connect Wallet button when disconnected", () => {
    render(<ConnectButton />)
    expect(screen.getByText("Connect Wallet")).toBeDefined()
  })

  it("renders Disconnect button when connected", () => {
    render(<ConnectButton isConnected={true} />)
    expect(screen.getByText("Disconnect")).toBeDefined()
  })

  it("renders Connecting... when connecting", () => {
    render(<ConnectButton isConnecting={true} />)
    expect(screen.getByText("Connecting...")).toBeDefined()
  })

  it("opens modal when Connect Wallet is clicked", async () => {
    render(<ConnectButton />)
    fireEvent.click(screen.getByText("Connect Wallet"))
    await waitFor(() => { expect(screen.getByText("Connect a wallet")).toBeDefined() })
  })

  it("shows WalletConnect option in modal", async () => {
    render(<ConnectButton />)
    fireEvent.click(screen.getByText("Connect Wallet"))
    await waitFor(() => { expect(screen.getByText("WalletConnect")).toBeDefined() })
  })

  it("calls onConnect when WalletConnect clicked with onConnect prop", async () => {
    const onConnect = vi.fn()
    render(<ConnectButton onConnect={onConnect} />)
    fireEvent.click(screen.getByText("Connect Wallet"))
    await waitFor(() => { expect(screen.getByText("WalletConnect")).toBeDefined() })
    fireEvent.click(screen.getAllByText("WalletConnect")[0])
    expect(onConnect).toHaveBeenCalledWith("walletconnect", expect.any(Function))
  })

  it("calls onDisconnect when Disconnect is clicked", () => {
    const onDisconnect = vi.fn()
    render(<ConnectButton isConnected={true} onDisconnect={onDisconnect} />)
    fireEvent.click(screen.getByText("Disconnect"))
    expect(onDisconnect).toHaveBeenCalledOnce()
  })

  it("shows No browser wallet detected when no injected wallets", async () => {
    render(<ConnectButton />)
    fireEvent.click(screen.getByText("Connect Wallet"))
    expect(await screen.findByText("No browser wallet detected", {}, { timeout: 3000 })).toBeDefined()
  })

  it("applies custom className to the outer button", () => {
    const { container } = render(<ConnectButton className="my-custom-class" />)
    const button = container.querySelector("button")
    expect(button?.className).toContain("my-custom-class")
  })

  describe("mobile deep link", () => {
    it("on mobile with onMobileDeepLink, calls deep link directly", () => {
      mockUseIsMobile.mockReturnValue(true)
      const onMobileDeepLink = vi.fn()
      render(<ConnectButton onMobileDeepLink={onMobileDeepLink} />)
      fireEvent.click(screen.getByText("Connect Wallet"))
      expect(onMobileDeepLink).toHaveBeenCalledOnce()
    })
  })
})
