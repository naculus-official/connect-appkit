"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  /** Whether to show close button, default true */
  closable?: boolean;
  /** Whether clicking overlay dismisses, default true */
  dismissOnOverlay?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Mobile variant: fullscreen / bottom-sheet */
  mobileVariant?: "fullscreen" | "bottom-sheet";
}

  /**
   * Modal — shared base modal component, unifies overlay / close / scroll / focus trap logic.
   *
   * - Close button fixed at top-right (position: absolute, top-4 right-4)
   * - Semi-transparent black overlay, optional dismissOnOverlay
   * - Content area capped at max-h-[85vh] overflow-y-auto to prevent overflow
   * - mobileVariant supports bottom-sheet and fullscreen mobile layouts
   * - Escape key closes
   * - Basic focus trap (focuses modal itself on open, Tab cycles within content)
   */
export function Modal({
  open,
  onClose,
  closable = true,
  dismissOnOverlay = true,
  title,
  children,
  className,
  mobileVariant,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ── Escape key ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // ── Body scroll lock ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── Focus trap (basic) ────────────────────────────────────────
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      // minor delay to let the DOM render before focusing
      requestAnimationFrame(() => contentRef.current?.focus());
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [open]);

  const handleOverlayClick = useCallback(() => {
    if (dismissOnOverlay && onClose) onClose();
  }, [dismissOnOverlay, onClose]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!open) return null;

  // ── Determine mobile layout classes ───────────────────────────
  const desktopLayout = "items-center justify-center p-4";
  const mobileLayout = mobileVariant === "bottom-sheet"
    ? "items-end justify-center"
    : "items-center justify-center p-4";
  const mobileBackdropClasses = mobileVariant === "bottom-sheet"
    ? "sm:items-center sm:justify-center" : "";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        desktopLayout,
        mobileBackdropClasses,
      )}
    >
      {/* Overlay */}
      <div
        onClick={handleOverlayClick}
        className={cn(
          "absolute inset-0 bg-black/80 animate-in fade-in duration-200",
          dismissOnOverlay && onClose ? "cursor-pointer" : "",
        )}
        aria-hidden="true"
      />

      {/* Content panel */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={handleContentClick}
        onKeyDown={(e) => {
          // Basic focus trap: Tab cycles through focusable elements inside content
          if (e.key === "Tab" && contentRef.current) {
            const focusable = contentRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            if (focusable.length === 1) {
              e.preventDefault();
              focusable[0].focus();
              return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
        className={cn(
          // ── Base styles ────────────────────────────────────────
          "relative z-10 w-full rounded-xl border bg-card text-card-foreground shadow-2xl outline-none max-h-[85vh] overflow-y-auto",
          "animate-in fade-in zoom-in-95 duration-200",
          // ── Mobile variants ────────────────────────────────────
          mobileVariant === "bottom-sheet"
            ? "max-w-sm rounded-b-none rounded-t-xl sm:rounded-b-xl"
            : "max-w-sm",
          // ── Padding — let consumers add px-6 py-6 or whatever ──
          className,
        )}
      >
        {/* Close button (fixed top-right in the content area) */}
        {closable && onClose && (
          <button
            onClick={onClose}
            type="button"
            aria-label="Close modal"
            className="absolute right-4 top-4 z-20 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {title && (
          <div className="sr-only" aria-live="polite">{title}</div>
        )}

        {children}
      </div>
    </div>
  );
}
