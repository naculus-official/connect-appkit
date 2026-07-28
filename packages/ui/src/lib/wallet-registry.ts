/**
 * Wallet Registry — curated list of popular wallets with metadata
 *
 * Used by the ConnectButton to show a rich wallet picker alongside
 * EIP-6963 detected wallets.
 *
 * Sources:
 * - https://registry.walletconnect.com (WC official registry)
 * - https://github.com/WalletConnect/walletconnect-registry
 * - Manual curation for non-WC wallets
 */

export type WalletPlatform = "extension" | "mobile" | "desktop"

export interface WalletEntry {
  /** Unique wallet ID (rdns for EIP-6963, or custom id) */
  id: string
  /** Display name */
  name: string
  /** Short description for wallet list */
  description: string
  /** Platform badges */
  platforms: WalletPlatform[]
  /** WalletConnect pairing URL (deep link) */
  mobileLink?: string
  /** Desktop deep link scheme */
  desktopLink?: string
  /** EIP-6963 rdns for auto-detection matching */
  rdns?: string
  /** Wallet homepage URL */
  homepage?: string
  /** SVG icon (inline) — base64-encoded data URI or inline SVG string */
  icon: string
  /** WC registry ID (optional, for lookup) */
  wcRegistryId?: string
  /** Theme colors for wallet badge */
  colors?: {
    primary: string
    background?: string
  }
}

// ── Inline SVG Icons (mini 24×24) ────────────────────────────────

const META_ICON = `<svg viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32.9582 1L19.8241 10.6193L22.4183 5.00004L32.9582 1Z" fill="#E17726" stroke="#E17726" stroke-width=".25" stroke-linejoin="round"/><path d="M2.04175 1L15.0594 10.6936L12.5817 5.00004L2.04175 1Z" fill="#E27625" stroke="#E27625" stroke-width=".25" stroke-linejoin="round"/><path d="M28.1188 23.3506L24.9963 27.9413L32.2307 29.9139L34.285 23.4709L28.1188 23.3506Z" fill="#E27625" stroke="#E27625" stroke-width=".25" stroke-linejoin="round"/><path d="M0.714844 23.4709L2.75781 29.9139L9.98084 27.9413L6.86968 23.3506L0.714844 23.4709Z" fill="#E27625" stroke="#E27625" stroke-width=".25" stroke-linejoin="round"/><path d="M9.61912 14.5817L7.71149 17.4162L14.8701 17.7553L14.6354 9.97925L9.61912 14.5817Z" fill="#D7BFEF" stroke="#D7BFEF" stroke-width=".25" stroke-linejoin="round"/><path d="M25.3809 14.5818L20.3069 9.90503L20.1299 17.7554L27.2885 17.4163L25.3809 14.5818Z" fill="#D7BFEF" stroke="#D7BFEF" stroke-width=".25" stroke-linejoin="round"/><path d="M9.98086 27.9414L14.6317 25.5524L10.5197 22.3433L9.98086 27.9414Z" fill="#233447" stroke="#233447" stroke-width=".25" stroke-linejoin="round"/><path d="M20.3683 25.5524L24.9967 27.9414L24.4803 22.3433L20.3683 25.5524Z" fill="#233447" stroke="#233447" stroke-width=".25" stroke-linejoin="round"/><path d="M24.9967 27.9414L20.3683 25.5524L20.7423 28.6273L20.708 29.9739L24.9967 27.9414Z" fill="#CC6228" stroke="#CC6228" stroke-width=".25" stroke-linejoin="round"/><path d="M9.98086 27.9414L14.2809 29.9739L14.258 28.6273L14.6317 25.5524L9.98086 27.9414Z" fill="#CC6228" stroke="#CC6228" stroke-width=".25" stroke-linejoin="round"/><path d="M14.8257 20.2966L10.875 19.098L13.655 17.647L14.8257 20.2966Z" fill="#CC6228" stroke="#CC6228" stroke-width=".25" stroke-linejoin="round"/><path d="M20.1743 20.2966L21.345 17.647L24.1364 19.098L20.1743 20.2966Z" fill="#CC6228" stroke="#CC6228" stroke-width=".25" stroke-linejoin="round"/><path d="M20.1743 20.2966L21.345 17.647L24.1364 19.098L20.1743 20.2966Z" fill="#F5841F" stroke="#F5841F" stroke-width=".25" stroke-linejoin="round"/><path d="M10.875 19.098L14.8257 20.2966L14.6317 25.5524L14.258 28.6273L9.98086 27.9414L10.5197 22.3433L10.875 19.098Z" fill="#C0ACD7" stroke="#C0ACD7" stroke-width=".25" stroke-linejoin="round"/><path d="M20.1743 20.2966L24.1364 19.098L24.4803 22.3433L24.9967 27.9414L20.708 29.9739L20.7423 28.6273L20.3683 25.5524L20.1743 20.2966Z" fill="#C0ACD7" stroke="#C0ACD7" stroke-width=".25" stroke-linejoin="round"/><path d="M27.2885 17.4163L20.1299 17.7554L20.1743 20.2966L24.1364 19.098L27.2885 17.4163Z" fill="#F5841F" stroke="#F5841F" stroke-width=".25" stroke-linejoin="round"/><path d="M14.8701 17.7554L7.71149 17.4163L10.875 19.098L14.8257 20.2966L14.8701 17.7554Z" fill="#F5841F" stroke="#F5841F" stroke-width=".25" stroke-linejoin="round"/><path d="M14.8701 17.7554L14.8257 20.2966L14.6317 25.5524L20.1299 25.5524L20.3683 25.5524L20.1743 20.2966L20.1299 17.7554L14.8701 17.7554Z" fill="#C0ACD7" stroke="#C0ACD7" stroke-width=".25" stroke-linejoin="round"/><path d="M34.285 23.4709L32.2307 29.9139L24.9967 27.9414L20.708 29.9739L24.4803 22.3433L34.285 23.4709Z" fill="#F5841F" stroke="#F5841F" stroke-width=".25" stroke-linejoin="round"/><path d="M9.98086 27.9414L14.2809 29.9739L10.5197 22.3433L0.714844 23.4709L2.75781 29.9139L9.98086 27.9414Z" fill="#F5841F" stroke="#F5841F" stroke-width=".25" stroke-linejoin="round"/><path d="M0.714844 23.4709L10.5197 22.3433L14.6354 9.97925L2.04175 1L0.714844 23.4709Z" fill="#F5841F" stroke="#F5841F" stroke-width=".25" stroke-linejoin="round"/><path d="M20.3069 9.90503L25.3809 14.5818L34.285 23.4709L32.9582 1L20.3069 9.90503Z" fill="#F5841F" stroke="#F5841F" stroke-width=".25" stroke-linejoin="round"/><path d="M32.9582 1L22.4183 5.00004L20.3069 9.90503L32.9582 1Z" fill="#C0ACD7" stroke="#C0ACD7" stroke-width=".25" stroke-linejoin="round"/><path d="M2.04175 1L12.5817 5.00004L14.6354 9.97925L10.5197 22.3433L0.714844 23.4709L2.04175 1Z" fill="#C0ACD7" stroke="#C0ACD7" stroke-width=".25" stroke-linejoin="round"/><path d="M14.6354 9.97925L14.8701 17.7554L20.1299 17.7554L20.3069 9.90503L18.39 5.17856L14.6354 9.97925Z" fill="#F5841F" stroke="#F5841F" stroke-width=".25" stroke-linejoin="round"/></svg>`

const RAINBOW_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="12" fill="#001B3B"/><path d="M20 8C13.3726 8 8 13.3726 8 20C8 26.6274 13.3726 32 20 32C26.6274 32 32 26.6274 32 20C32 13.3726 26.6274 8 20 8Z" fill="url(#rainbow-grad)"/><defs><linearGradient id="rainbow-grad" x1="20" y1="8" x2="20" y2="32" gradientUnits="userSpaceOnUse"><stop stop-color="#FFB347"/><stop offset="0.25" stop-color="#FF7B2B"/><stop offset="0.5" stop-color="#E64040"/><stop offset="0.75" stop-color="#9B59B6"/><stop offset="1" stop-color="#3498DB"/></linearGradient></defs></svg>`

const TRUST_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#3375BB"/><path d="M20 8L28 12V19C28 24.5 24.5 29.5 20 31C15.5 29.5 12 24.5 12 19V12L20 8Z" fill="white"/></svg>`

const OKX_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="black"/><path d="M14 10H10V14H14V10ZM18 18H14V22H18V18ZM22 18V14H18V10H22V14H26V18H22ZM22 22V18H18V22H22ZM26 14H30V10H26V14ZM14 26H10V30H14V26ZM18 26H14V22H18V26ZM22 26V30H18V26H22ZM26 26H30V30H26V26Z" fill="white"/></svg>`

const RABBY_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#302C2C"/><path d="M18 8H22V12H18V8ZM8 12V16H12V12H8ZM16 16H12V20H16V16ZM16 28H12V32H16V28ZM8 20V24H12V20H8ZM28 12H32V16H28V12ZM20 16H24V20H20V16ZM20 28H24V32H20V28ZM28 20H32V24H28V20ZM28 28H32V32H28V28ZM12 24H16V28H12V24ZM24 24H28V28H24V24Z" fill="white"/></svg>`

const LEDGER_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#0B1121"/><path d="M8 10V16H14V10H8ZM16 10V30H22V10H16ZM24 10V30H30V10H24Z" fill="white"/></svg>`

const COINBASE_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#0052FF"/><circle cx="20" cy="20" r="8" fill="white"/></svg>`

const PHANTOM_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#AB9FF2"/><path d="M12 14C12 12.8954 12.8954 12 14 12H18C19.1046 12 20 12.8954 20 14V26C20 27.1046 19.1046 28 18 28H14C12.8954 28 12 27.1046 12 26V14Z" fill="white"/><path d="M20 14C20 12.8954 20.8954 12 22 12H26C27.1046 12 28 12.8954 28 14V18C28 19.1046 27.1046 20 26 20H22C20.8954 20 20 19.1046 20 18V14Z" fill="white"/></svg>`

const BACKPACK_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#E8E3D7"/><path d="M12 12H28V28H12V12ZM14 14V18H26V14H14Z" fill="#2D2A20"/></svg>`

const WALLETCONNECT_ICON = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#3396FF"/><circle cx="20" cy="20" r="6" fill="white"/><circle cx="20" cy="20" r="3" fill="#3396FF"/></svg>`

// ── Registry ──────────────────────────────────────────────────────

export const WALLET_REGISTRY: WalletEntry[] = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Popular web3 browser wallet",
    platforms: ["extension", "mobile"],
    rdns: "io.metamask",
    mobileLink: "https://metamask.app.link/wc?uri=",
    desktopLink: "https://metamask.app.link/wc?uri=",
    homepage: "https://metamask.io",
    icon: META_ICON,
    wcRegistryId: "metamask",
    colors: { primary: "#F5841F", background: "#E27625" },
  },
  {
    id: "rainbow",
    name: "Rainbow",
    description: "Fun & simple Ethereum wallet",
    platforms: ["mobile", "extension"],
    rdns: "me.rainbow",
    mobileLink: "https://rainbow.me/wc?uri=",
    homepage: "https://rainbow.me",
    icon: RAINBOW_ICON,
    wcRegistryId: "rainbow",
    colors: { primary: "#001B3B" },
  },
  {
    id: "trust",
    name: "Trust Wallet",
    description: "Multi-chain self-custody wallet",
    platforms: ["mobile", "extension"],
    rdns: "com.trustwallet",
    mobileLink: "https://link.trustwallet.com/wc?uri=",
    homepage: "https://trustwallet.com",
    icon: TRUST_ICON,
    wcRegistryId: "trust",
    colors: { primary: "#3375BB" },
  },
  {
    id: "okx",
    name: "OKX Wallet",
    description: "Web3 wallet by OKX exchange",
    platforms: ["extension", "mobile"],
    rdns: "com.okex.wallet",
    mobileLink: "https://www.okx.com/download?uri=",
    homepage: "https://www.okx.com/web3",
    icon: OKX_ICON,
    wcRegistryId: "okx",
    colors: { primary: "#000000" },
  },
  {
    id: "rabby",
    name: "Rabby",
    description: "Open-source browser wallet",
    platforms: ["extension"],
    rdns: "com.rabby",
    homepage: "https://rabby.io",
    icon: RABBY_ICON,
    wcRegistryId: "rabby",
    colors: { primary: "#302C2C" },
  },
  {
    id: "ledger",
    name: "Ledger Live",
    description: "Hardware wallet companion app",
    platforms: ["mobile", "desktop"],
    mobileLink: "https://app.ledger.com/wc?uri=",
    desktopLink: "ledgerlive://wc?uri=",
    homepage: "https://ledger.com",
    icon: LEDGER_ICON,
    wcRegistryId: "ledger",
    colors: { primary: "#0B1121" },
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Self-custody wallet by Coinbase",
    platforms: ["extension", "mobile"],
    rdns: "com.coinbase.wallet",
    mobileLink: "https://go.cb-w.com/wc?uri=",
    homepage: "https://coinbase.com/wallet",
    icon: COINBASE_ICON,
    wcRegistryId: "coinbase",
    colors: { primary: "#0052FF" },
  },
  {
    id: "phantom",
    name: "Phantom",
    description: "Multi-chain wallet (Solana & EVM)",
    platforms: ["extension", "mobile"],
    rdns: "app.phantom",
    mobileLink: "https://phantom.app/ul/wc?uri=",
    homepage: "https://phantom.app",
    icon: PHANTOM_ICON,
    wcRegistryId: "phantom",
    colors: { primary: "#AB9FF2" },
  },
  {
    id: "backpack",
    name: "Backpack",
    description: "Solana & EVM wallet",
    platforms: ["extension", "mobile"],
    rdns: "xyz.backpack",
    mobileLink: "https://backpack.app/wc?uri=",
    homepage: "https://backpack.app",
    icon: BACKPACK_ICON,
    wcRegistryId: "backpack",
    colors: { primary: "#2D2A20", background: "#E8E3D7" },
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Scan QR with any WC-compatible wallet",
    platforms: ["mobile"],
    homepage: "https://walletconnect.com",
    icon: WALLETCONNECT_ICON,
    wcRegistryId: "walletconnect",
    colors: { primary: "#3396FF" },
  },
]

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Get a wallet entry by its EIP-6963 rdns identifier
 */
export function getWalletByRdns(rdns: string): WalletEntry | undefined {
  return WALLET_REGISTRY.find((w) => w.rdns === rdns)
}

/**
 * Get a wallet entry by its id (custom or rdns)
 */
export function getWalletById(id: string): WalletEntry | undefined {
  return WALLET_REGISTRY.find((w) => w.id === id || w.rdns === id)
}

/**
 * Get wallets supporting a specific platform
 */
export function getWalletsByPlatform(platform: WalletPlatform): WalletEntry[] {
  return WALLET_REGISTRY.filter((w) => w.platforms.includes(platform))
}

/**
 * Merge EIP-6963 detected wallets with registry entries for display.
 * Detected wallets take priority (appear first), duplicates are removed.
 *
 * @param detected - Wallets discovered via EIP-6963
 * @param platform - Target platform filter
 */
export function mergeWallets(
  detected: Array<{ id: string; name: string; icon?: string; rdns: string }>,
  platform: WalletPlatform = "extension",
): Array<(typeof detected[0]) & { registryEntry?: WalletEntry }> {
  const seen = new Set<string>()
  const result: Array<(typeof detected[0]) & { registryEntry?: WalletEntry }> = []

  // EIP-6963 detected wallets first
  for (const d of detected) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    const entry = getWalletByRdns(d.rdns)
    result.push({ ...d, registryEntry: entry })
  }

  // Registry wallets not detected
  for (const w of WALLET_REGISTRY) {
    if (!w.platforms.includes(platform)) continue
    if (w.rdns && seen.has(w.rdns)) continue
    if (seen.has(w.id)) continue
    seen.add(w.id)
    result.push({
      id: w.id,
      name: w.name,
      icon: w.icon,
      rdns: w.rdns ?? w.id,
      registryEntry: w,
    })
  }

  return result
}

/**
 * Build a WalletConnect deep link URI for a specific wallet
 */
export function buildDeepLink(
  wallet: WalletEntry,
  wcUri: string,
): string | null {
  const link = wallet.mobileLink ?? wallet.desktopLink
  if (!link) return null
  return `${link}${encodeURIComponent(wcUri)}`
}
