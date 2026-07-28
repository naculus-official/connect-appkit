/// <reference types="vitest" />
/// @vitest-environment jsdom

import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FallbackButton } from "./FallbackButton"

describe("FallbackButton", () => {
  it("renders children text", () => {
    render(<FallbackButton>Connect Wallet</FallbackButton>)
    expect(screen.getByText("Connect Wallet")).toBeDefined()
  })

  it("renders children elements", () => {
    render(
      <FallbackButton>
        <span data-testid="icon">🔗</span>
        <span>Connect</span>
      </FallbackButton>
    )
    expect(screen.getByTestId("icon")).toBeDefined()
    expect(screen.getByText("Connect")).toBeDefined()
  })

  it("calls onClick when clicked", () => {
    const onClick = vi.fn()
    render(<FallbackButton onClick={onClick}>Click Me</FallbackButton>)
    fireEvent.click(screen.getByText("Click Me"))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn()
    render(
      <FallbackButton onClick={onClick} disabled>
        Disabled
      </FallbackButton>
    )
    fireEvent.click(screen.getByText("Disabled"))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("sets disabled attribute on button", () => {
    render(<FallbackButton disabled>Disabled</FallbackButton>)
    const btn = screen.getByText("Disabled") as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("renders with default variant without crashing", () => {
    const { container } = render(
      <FallbackButton variant="default">Default</FallbackButton>
    )
    expect(container.firstChild).toBeDefined()
  })

  it("renders with destructive variant without crashing", () => {
    const { container } = render(
      <FallbackButton variant="destructive">Destructive</FallbackButton>
    )
    expect(container.firstChild).toBeDefined()
  })

  it("renders with large size without crashing", () => {
    const { container } = render(
      <FallbackButton size="lg">Large</FallbackButton>
    )
    expect(container.firstChild).toBeDefined()
  })

  it("applies additional className", () => {
    render(<FallbackButton className="custom-class">Styled</FallbackButton>)
    const btn = screen.getByText("Styled")
    expect(btn.className).toContain("custom-class")
  })

  it("renders as button type by default", () => {
    render(<FallbackButton>Default Type</FallbackButton>)
    const btn = screen.getByText("Default Type")
    expect(btn.getAttribute("type")).toBe("button")
  })
})
