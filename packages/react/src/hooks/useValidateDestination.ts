/**
 * useValidateDestination — address blackhole prevention hook.
 *
 * Validates that a destination address is not a known burn/zero address
 * before sending a transaction. Returns { isValid, warning, level }.
 *
 * Level: "safe" | "warning" | "blocked"
 */

import { useMemo } from "react";
import { t } from "../utils/i18n";

// ── Known burn / zero addresses ─────────────────────────────────

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEAD_ADDRESSES = new Set([
  ZERO_ADDRESS,
  "0x0000000000000000000000000000000000000001",
  "0x000000000000000000000000000000000000dead",
  "0x000000000000000000000000000000000000dEaD",
]);

function isBurnAddress(addr: string): boolean {
  const lower = addr.toLowerCase();
  if (DEAD_ADDRESSES.has(lower)) return true;
  return lower.includes("dead") && lower.length >= 40;
}

function isZeroAddress(addr: string): boolean {
  return addr === ZERO_ADDRESS;
}

function isValidFormat(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export type AddressValidationLevel = "safe" | "warning" | "blocked";

export interface AddressValidationResult {
  isValid: boolean;
  level: AddressValidationLevel;
  warning: string | null;
}

export function validateDestination(address: string): AddressValidationResult {
  if (!address) {
    return { isValid: false, level: "blocked", warning: t("address.empty") };
  }
  if (!isValidFormat(address)) {
    return { isValid: false, level: "blocked", warning: t("address.invalid_format") };
  }
  if (isZeroAddress(address)) {
    return { isValid: false, level: "blocked", warning: t("address.zero_address") };
  }
  if (isBurnAddress(address)) {
    return { isValid: false, level: "blocked", warning: t("address.burn_address") };
  }
  return { isValid: true, level: "safe", warning: null };
}

export interface UseValidateDestinationOptions {
  address: string;
}

export interface UseValidateDestinationReturn {
  validation: AddressValidationResult;
}

export function useValidateDestination({ address }: UseValidateDestinationOptions): UseValidateDestinationReturn {
  const validation = useMemo(() => validateDestination(address), [address]);
  return { validation };
}
