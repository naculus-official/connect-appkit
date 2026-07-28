/// <reference types="vitest" />
/// @vitest-environment jsdom

import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import {
  FallbackDialog,
  FallbackDialogHeader,
  FallbackDialogContent,
  FallbackOverlay,
} from "./FallbackDialog"

describe("FallbackDialog", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <FallbackDialog isOpen={false}>
        <p>Content</p>
      </FallbackDialog>
    )
    expect(container.innerHTML).toBe("")
  })

  it("renders content when isOpen is true", () => {
    render(
      <FallbackDialog isOpen={true}>
        <p>Dialog Content</p>
      </FallbackDialog>
    )
    expect(screen.getByText("Dialog Content")).toBeDefined()
  })

  it("sets role=dialog and aria-modal=true", () => {
    render(
      <FallbackDialog isOpen={true}>
        <p>Content</p>
      </FallbackDialog>
    )
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeDefined()
    expect(dialog.getAttribute("aria-modal")).toBe("true")
  })

  it("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn()
    render(
      <FallbackDialog isOpen={true} onClose={onClose}>
        <p>Content</p>
      </FallbackDialog>
    )
    // The overlay is the FallbackOverlay
    const overlays = document.querySelectorAll('[class*="bg-black/80"]')
    // Fire click on the backdrop overlay (first fixed div)
    const backdrop = document.querySelector('[class*="bg-black/80"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("does not crash without onClose", () => {
    render(
      <FallbackDialog isOpen={true}>
        <p>No close handler</p>
      </FallbackDialog>
    )
    expect(screen.getByText("No close handler")).toBeDefined()
  })
})

describe("FallbackDialogHeader", () => {
  it("renders the title", () => {
    render(<FallbackDialogHeader title="Connect Wallet" />)
    expect(screen.getByText("Connect Wallet")).toBeDefined()
  })

  it("renders close button by default", () => {
    const onClose = vi.fn()
    render(<FallbackDialogHeader title="Title" onClose={onClose} />)
    const closeBtn = screen.getByLabelText("Close")
    expect(closeBtn).toBeDefined()
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("hides close button when showCloseButton is false", () => {
    render(
      <FallbackDialogHeader title="Title" showCloseButton={false} />
    )
    expect(screen.queryByLabelText("Close")).toBeNull()
  })

  it("renders h2 element for title", () => {
    render(<FallbackDialogHeader title="Dialog Title" />)
    const heading = screen.getByText("Dialog Title")
    expect(heading.tagName).toBe("H2")
  })
})

describe("FallbackDialogContent", () => {
  it("renders children", () => {
    render(
      <FallbackDialogContent>
        <span>Child Element</span>
      </FallbackDialogContent>
    )
    expect(screen.getByText("Child Element")).toBeDefined()
  })

  it("applies className", () => {
    const { container } = render(
      <FallbackDialogContent className="custom-content">
        <p>Styled</p>
      </FallbackDialogContent>
    )
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain("custom-content")
  })
})

describe("FallbackOverlay", () => {
  it("renders a fixed overlay", () => {
    render(<FallbackOverlay />)
    const overlay = document.querySelector('[class*="bg-black/80"]')
    expect(overlay).not.toBeNull()
  })

  it("calls onClick when clicked", () => {
    const onClick = vi.fn()
    render(<FallbackOverlay onClick={onClick} />)
    const overlay = document.querySelector('[class*="bg-black/80"]')
    expect(overlay).not.toBeNull()
    fireEvent.click(overlay!)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
