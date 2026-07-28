"use client"

import React from "react"
import { cn } from "../lib/cn"
import { X } from "lucide-react"

export interface FallbackOverlayProps {
  onClick?: () => void
}

export function FallbackOverlay({ onClick }: FallbackOverlayProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 w3c-overlay",
        onClick ? "cursor-pointer" : ""
      )}
    />
  )
}

export interface FallbackDialogProps {
  children: React.ReactNode
  isOpen: boolean
  onClose?: () => void
  className?: string
}

export function FallbackDialog({
  children,
  isOpen,
  onClose,
  className = "",
}: FallbackDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <FallbackOverlay onClick={onClose} />
      <div
        className={cn(
          "relative z-50 mx-auto w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-2xl p-6 max-h-[90vh] overflow-y-auto",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export interface FallbackDialogHeaderProps {
  title: string
  onClose?: () => void
  showCloseButton?: boolean
}

export function FallbackDialogHeader({
  title,
  onClose,
  showCloseButton = true,
}: FallbackDialogHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold m-0">
        {title}
      </h2>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          type="button"
          className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export interface FallbackDialogContentProps {
  children: React.ReactNode
  className?: string
}

export function FallbackDialogContent({
  children,
  className = "",
}: FallbackDialogContentProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {children}
    </div>
  )
}
