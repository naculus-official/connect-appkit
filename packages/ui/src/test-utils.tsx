import React from "react"
import { render } from "@testing-library/react"
import type { ComponentRegistry } from "./contexts/ComponentRegistry"
import { Web3ComponentProvider } from "./contexts/ComponentRegistry"
import { DefaultButton, DefaultDialog } from "./lib/ui-defaults"

/** Adapter: wraps DefaultDialog's onClose to match shadcn-style onOpenChange */
function DialogAdapter({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <DefaultDialog open={open} onClose={() => onOpenChange(false)} closable>
      {children}
    </DefaultDialog>
  )
}

/** Minimal mock registry providing a working Button and Dialog */
function createMockRegistry(): ComponentRegistry {
  return {
    Button: DefaultButton as React.ComponentType<
      React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }
    >,
    Dialog: DialogAdapter as React.ComponentType<{
      open: boolean
      onOpenChange: (open: boolean) => void
      children: React.ReactNode
    }>,
  } as ComponentRegistry
}

/**
 * Render a component wrapped in Web3ComponentProvider.
 * Use this instead of raw render() for components that use useComponentRegistry.
 */
export function renderWithRegistry(
  ui: React.ReactElement,
  options?: Parameters<typeof render>[1],
): ReturnType<typeof render> {
  return render(
    <Web3ComponentProvider components={createMockRegistry()}>
      {ui}
    </Web3ComponentProvider>,
    options,
  )
}
