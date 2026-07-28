/// <reference types="vitest" />
/// @vitest-environment jsdom

import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"

import { AccountButton } from "./AccountButton"

// Minimal button component for tests (replaces the removed DefaultButton fallback)
function TestButton({ children, className, onClick, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) {
  return <button className={className} onClick={onClick} disabled={disabled} {...rest}>{children}</button>
}

const TEST_ADDRESS = "eip155:1:0x1234567890123456789012345678901234567890"

describe("AccountButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mock("../contexts/ComponentRegistry", () => ({
      useComponentRegistry: () => ({ Button: TestButton }),
    }))
  })

  afterEach(() => {
    cleanup()
  })

  it("renders account button with truncated address", () => {
    render(<AccountButton address={TEST_ADDRESS} />)
    expect(screen.getByText("0x1234...7890")).toBeDefined()
  })

  it("renders as a button element", () => {
    render(<AccountButton address={TEST_ADDRESS} />)
    const btn = screen.getByRole("button")
    expect(btn).toBeDefined()
  })

  it("applies className", () => {
    render(<AccountButton address={TEST_ADDRESS} className="custom-account" />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("custom-account")
  })

  it("shows Connect Wallet button when no address", () => {
    render(<AccountButton />)
    expect(screen.getByText("Connect Wallet")).toBeDefined()
  })

  it("shows wallet icon when no address", () => {
    render(<AccountButton />)
    const svg = document.querySelector("svg")
    expect(svg).not.toBeNull()
  })

  it("calls onConnect when clicked without address", () => {
    const onConnect = vi.fn()
    render(<AccountButton onConnect={onConnect} />)
    fireEvent.click(screen.getByText("Connect Wallet"))
    expect(onConnect).toHaveBeenCalledOnce()
  })

  it("applies className to connect button when no address", () => {
    render(<AccountButton className="wallet-btn" />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("wallet-btn")
  })

  it("renders avatar with initial letter", () => {
    render(<AccountButton address={TEST_ADDRESS} />)
    expect(screen.getByText("W")).toBeDefined()
  })

  it("does not show address when showAddress is false", () => {
    render(<AccountButton address={TEST_ADDRESS} showAddress={false} />)
    expect(screen.queryByText(/0x/)).toBeNull()
  })

  it("shows balance when showBalance is true", () => {
    render(<AccountButton address={TEST_ADDRESS} showBalance={true} balance="1.5" balanceSymbol="ETH" />)
    expect(screen.getByText(/1\.5/)).toBeDefined()
    expect(screen.getByText(/ETH/)).toBeDefined()
  })

  it("shows Loading... when balance is null and showBalance is true", () => {
    render(<AccountButton address={TEST_ADDRESS} showBalance={true} balance={null} />)
    expect(screen.getByText("Loading...")).toBeDefined()
  })
})
