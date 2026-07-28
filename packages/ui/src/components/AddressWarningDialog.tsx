"use client"

import React from "react"
import { AlertTriangle, CheckCircle, ShieldAlert, X } from "lucide-react"
import { cn } from "../lib/cn"
import { useComponentRegistry } from "../contexts/ComponentRegistry"
import { useValidateDestination } from "@naculus/connect-appkit-react"
import type { AddressValidationLevel } from "@naculus/connect-appkit-react"

export interface AddressWarningDialogProps {
  address: string
  open: boolean
  onClose: () => void
  onProceed?: () => void
}

const LEVEL_CONFIG: Record<
  AddressValidationLevel,
  { icon: React.ReactNode; label: string; colorClass: string; bgClass: string; buttonVariant: string }
> = {
  safe: {
    icon: <CheckCircle size={20} />,
    label: "Safe",
    colorClass: "text-[hsl(var(--safe,142_76%_36%))]",
    bgClass: "bg-[hsl(var(--safe)/0.1)]",
    buttonVariant: "default",
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    label: "Warning",
    colorClass: "text-[hsl(var(--warning,38_92%_50%))]",
    bgClass: "bg-[hsl(var(--warning)/0.1)]",
    buttonVariant: "default",
  },
  blocked: {
    icon: <ShieldAlert size={20} />,
    label: "Blocked",
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
    buttonVariant: "destructive",
  },
}

export function AddressWarningDialog({
  address,
  open,
  onClose,
  onProceed,
}: AddressWarningDialogProps) {
  const registry = useComponentRegistry()
  const Button = registry.Button as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string; disabled?: boolean; className?: string; children?: React.ReactNode }> | undefined
  const Dialog = registry.Dialog as React.ComponentType<{ open: boolean; onOpenChange?: (v: boolean) => void; children?: React.ReactNode }> | undefined
  const DialogContent = registry.DialogContent as React.ComponentType<{ className?: string; children?: React.ReactNode }> | undefined
  const DialogHeader = registry.DialogHeader as React.ComponentType<{ className?: string; children?: React.ReactNode }> | undefined
  const DialogTitle = registry.DialogTitle as React.ComponentType<{ className?: string; children?: React.ReactNode }> | undefined

  const { validation } = useValidateDestination({ address })
  const { level, warning } = validation
  const config = LEVEL_CONFIG[level]
  const isBlocked = level === "blocked"

  const shortAddress = address.length > 12
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address

  const buttonClass = (variant: string) =>
    cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg",
      "text-sm font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "h-10 px-4 py-2",
      variant === "outline" && "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    )

  const body = (
    <div className="flex flex-col gap-4">
      <div className={cn("flex items-center gap-3 rounded-lg p-4", config.bgClass)}>
        <span className={config.colorClass}>{config.icon}</span>
        <div className="flex flex-col gap-0.5">
          <span className={cn("text-sm font-semibold", config.colorClass)}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground break-all font-mono">
            {shortAddress}
          </span>
        </div>
      </div>

      {warning && (
        <p className="text-sm text-muted-foreground m-0">{warning}</p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        {Button ? (
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        ) : (
          <button type="button" onClick={onClose} className={cn(buttonClass("outline"), "w-full sm:w-auto")}>
            Cancel
          </button>
        )}
        {onProceed && (Button ? (
          <Button
            onClick={onProceed}
            variant={isBlocked ? "destructive" : "default"}
            disabled={isBlocked}
            className="w-full sm:w-auto"
          >
            Proceed anyway
          </Button>
        ) : (
          <button
            type="button"
            onClick={onProceed}
            disabled={isBlocked}
            className={cn(buttonClass(isBlocked ? "destructive" : "default"), "w-full sm:w-auto")}
          >
            Proceed anyway
          </button>
        ))}
      </div>
    </div>
  )

  if (Dialog && DialogContent && DialogHeader && DialogTitle) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Address Warning</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold m-0">Address Warning</h2>
          <button
            onClick={onClose}
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {body}
      </div>
    </div>
  )
}
