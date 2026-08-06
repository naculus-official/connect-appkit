import { Component, Prop, State, h, Host, Element, Event, EventEmitter } from "@stencil/core"

interface TokenBalance { symbol: string; formatted: string | null; name?: string }
interface DiscoveredWallet { id: string; name: string; rdns?: string; icon?: string }

export type ConnectView = "menu" | "loading-qr" | "qr-ready" | "qr-error"

@Component({
  tag: "appkit-connect-button",
  styleUrl: "connect-button.css",
  shadow: true,
})
export class AppkitConnectButton {
  @Element() el!: HTMLElement

  // ── Data props (from adapter) ──────────────────────────────────
  @Prop() connected = false
  @Prop() connecting = false
  @Prop() address = ""
  @Prop() balance: string | null = null
  @Prop() balanceSymbol = "ETH"
  @Prop() isBalanceLoading = false
  @Prop() tokenBalancesJson = "[]"
  @Prop() explorerUrl = ""
  @Prop() walletsJson = "[]"
  @Prop() qrUri: string | null = null
  @Prop() qrLoading = false
  @Prop({ mutable: true }) qrError: string | null = null
  @Prop() logoUrl = "https://static.naculus.com/static/logo.svg"
  @Prop({ mutable: true }) locale: string = "en"

  // ── i18n ──────────────────────────────────────────────────────────
  private readonly t = {
    en: { connectWallet: "Connect a wallet", scanQR: "Scan QR Code", noWallets: "No wallets detected", walletConnect: "WalletConnect", scanDesc: "Scan QR with any wallet", browserExt: "Browser extension", waiting: "Waiting for connection...", copyLink: "Copy link", copied: "✓ Copied", retry: "Retry", close: "Close", back: "← Back", search: "Search wallets...", connFailed: "Connection failed" },
    zh: { connectWallet: "連接錢包", scanQR: "掃描 QR 碼", noWallets: "未檢測到錢包", walletConnect: "WalletConnect", scanDesc: "掃描 QR 碼連接任何錢包", browserExt: "瀏覽器擴充", waiting: "等待連接...", copyLink: "複製連結", copied: "✓ 已複製", retry: "重試", close: "關閉", back: "← 返回", search: "搜尋錢包...", connFailed: "連接失敗" },
    ja: { connectWallet: "ウォレット接続", scanQR: "QRコード読み取り", noWallets: "ウォレットが見つかりません", walletConnect: "WalletConnect", scanDesc: "QRコードで接続", browserExt: "ブラウザ拡張", waiting: "接続待機中...", copyLink: "リンクをコピー", copied: "✓ コピー済み", retry: "再試行", close: "閉じる", back: "← 戻る", search: "ウォレット検索...", connFailed: "接続失敗" }
  }
  private _(key: string): string {
    return (this.t as any)[this.locale]?.[key] || (this.t as any)["en"]?.[key] || key
  }

  // ── Events ─────────────────────────────────────────────────────
  @Event() appkitConnect!: EventEmitter<{ kind: string; walletId?: string }>
  @Event() appkitDisconnect!: EventEmitter<void>
  @Event() appkitStartPairing!: EventEmitter<void>
  @Event() appkitRetry!: EventEmitter<void>
  @Event() appkitMobileDeepLink!: EventEmitter<void>
  @Event() appkitCopyAddress!: EventEmitter<string>

  // ── Internal state ───────────────────────────────────────────── 
  @State() modalOpen = false
  @State() view: ConnectView = "menu"
  @State() search = ""
  @State() selectedWalletId = ""
  @State() dropdownOpen = false
  @State() uriCopied = false
  @State() addressCopied = false

  private dialogEl?: HTMLDialogElement
  private canvasEl?: HTMLCanvasElement
  private qrRendered = false

  // ── Computed ───────────────────────────────────────────────────
  private get wallets(): DiscoveredWallet[] {
    try { return JSON.parse(this.walletsJson) } catch { return [] }
  }
  private get tokenBalances(): TokenBalance[] {
    try { return JSON.parse(this.tokenBalancesJson) } catch { return [] }
  }
  private get filteredWallets() {
    if (!this.search) return this.wallets
    return this.wallets.filter(w => w.name.toLowerCase().includes(this.search.toLowerCase()))
  }
  private get shortAddr() {
    const raw = this.address.includes(":") ? this.address.split(":").pop()! : this.address
    if (raw.length <= 12) return raw
    return raw.slice(0, 6) + "..." + raw.slice(-4)
  }
  private get fullAddr() {
    return this.address.includes(":") ? this.address.split(":").pop()! : this.address
  }
  private get fmtBalance(): string | null {
    if (this.balance === null || this.balance === undefined) return null
    return parseFloat(this.balance).toLocaleString(undefined, { maximumFractionDigits: 4 }) + " " + this.balanceSymbol
  }

  // ── Modal methods ──────────────────────────────────────────────
  private openModal() {
    this.view = "menu"; this.search = ""; this.qrError = null
    if (!this.locale && typeof navigator !== "undefined") this.locale = navigator.language.slice(0, 2)
    this.modalOpen = true
    setTimeout(() => this.dialogEl?.showModal(), 0)
  }
  private closeModal() { this.modalOpen = false; this.dialogEl?.close() }

  private goToWC() {
    this.view = "loading-qr"; this.qrError = null
    this.appkitStartPairing.emit()
  }

  private selectWallet(id: string) {
    this.search = ""
    this.selectedWalletId = id
    this.appkitConnect.emit({ kind: "injected", walletId: id })
  }

  private copyAddress() {
    navigator.clipboard.writeText(this.fullAddr).then(() => {
      this.addressCopied = true
      setTimeout(() => (this.addressCopied = false), 2000)
    })
  }

  private copyUri() {
    if (!this.qrUri) return
    navigator.clipboard.writeText(this.qrUri).then(() => {
      this.uriCopied = true
      setTimeout(() => (this.uriCopied = false), 2000)
    })
  }

  private get selectedWallet() {
    return this.wallets.find(w => w.id === this.selectedWalletId)
  }

  // ── QR rendering ───────────────────────────────────────────────
  componentDidUpdate() {
    if (this.view === "qr-ready" && this.qrUri && this.canvasEl && !this.qrRendered) {
      this.renderQR()
    }
  }

  private async renderQR() {
    if (!this.canvasEl || !this.qrUri) return
    try {
      const qrcode = await import("qrcode")
      await (qrcode.default || qrcode).toCanvas(this.canvasEl, this.qrUri, { width: 200, margin: 2 })
      this.qrRendered = true
    } catch { /* qrcode load failed */ }
  }

  // ── Watch qrUri changes from adapter ───────────────────────────
  componentWillRender() {
    if (this.qrLoading && this.view !== "loading-qr") {
      this.view = "loading-qr"
    }
    if (this.qrUri && this.view === "loading-qr") {
      this.view = "qr-ready"
      this.qrRendered = false
      this.qrError = null
    }
  }

  disconnectedCallback() {
    this.dialogEl?.close()
  }

  // ── Render ─────────────────────────────────────────────────────
  render() {
    // Connected state
    if (this.connected && this.address) {
      return (
        <Host>
          <appkit-button
            variant="ghost"
            size="sm"
            class="wallet-badge"
            onClick={() => (this.dropdownOpen = !this.dropdownOpen)}
          >
            <span class="dot" slot="" />
            <span class="addr-text">{this.shortAddr}</span>
            {this.isBalanceLoading ? (
              <span class="load-skel" />
            ) : this.fmtBalance ? (
              <span class="bal-text">{this.fmtBalance}</span>
            ) : null}
          </appkit-button>
          {this.dropdownOpen && (
            <div class="dropdown" role="region" aria-label="Wallet details" ref={(el: any) => this.setupDropdownClose(el)}>
              <div class="dd-status"><span class="dot" /> Connected</div>
              <div class="dd-addr-row">
                <span class="dd-addr">{this.fullAddr.slice(0, 8)}...{this.fullAddr.slice(-6)}</span>
                <appkit-button variant="ghost" size="sm" onClick={() => this.copyAddress()}>
                  {this.addressCopied ? "✓" : "📋"}
                </appkit-button>
                {this.explorerUrl && (
                  <a href={`${this.explorerUrl}/address/${this.fullAddr}`} target="_blank" class="expl-link">↗</a>
                )}
              </div>
              <div class="dd-balance">
                <div class="dd-label">Balance</div>
                {this.isBalanceLoading ? (
                  <div class="load-skel-lg" />
                ) : this.fmtBalance ? (
                  <div class="dd-bal-val">{this.fmtBalance}</div>
                ) : <div class="dd-bal-val">—</div>}
              </div>
              {this.tokenBalances.length > 0 && (
                <div class="dd-tokens">
                  <div class="dd-label">Tokens</div>
                  {this.tokenBalances.map(tb => (
                    <div class="dd-token-row">
                      <span>{tb.name || tb.symbol}</span>
                      <span>{tb.formatted ?? "—"}</span>
                    </div>
                  ))}
                </div>
              )}
              <appkit-button variant="ghost" class="dd-disconnect" onClick={() => { this.appkitDisconnect.emit(); this.dropdownOpen = false }}>
                Disconnect
              </appkit-button>
            </div>
          )}
        </Host>
      )
    }

    // Disconnected
    return (
      <Host>
        <appkit-button
          onClick={() => this.openModal()}
          disabled={this.connecting}
          ariaLabel={this.connecting ? "Connecting" : "Connect Wallet"}
        >
          {this.connecting ? "Connecting..." : "Connect Wallet"}
        </appkit-button>

        {this.modalOpen && (
          <dialog ref={el => (this.dialogEl = el as HTMLDialogElement)} onClose={() => this.closeModal()}>
            <div class="modal">
              <div class="modal-header">
                <div class="modal-title">
                  {this.view === "menu" ? this._("connectWallet") : this._("scanQR")}
                </div>
              </div>

              {/* Menu view */}
              {this.view === "menu" && (
                <div class="menu-body">
                  {this.wallets.length > 3 && (
                    <appkit-input placeholder={this._("search")} value={this.search} onAppkitChange={(e: CustomEvent) => this.search = e.detail} />
                  )}
                  {this.filteredWallets.length === 0 ? (
                    <div class="no-wallets">{this._("noWallets")}</div>
                  ) : (
                    this.filteredWallets.map(w => (
                      <appkit-button variant="outline" class="wc-opt" onClick={() => this.selectWallet(w.id)}>
                        <span class="wc-name">{w.name}</span>
                        <span class="wc-desc">{this._("browserExt")}</span>
                      </appkit-button>
                    ))
                  )}
                  <div class="divider"><span>{this._("walletConnect")}</span></div>
                  <button class="wc-btn" onClick={() => this.goToWC()}>
                    <span class="wc-name">{this._("walletConnect")}</span>
                    <span class="wc-desc">{this._("scanDesc")}</span>
                  </button>
                </div>
              )}

              {/* QR views */}
              {this.view === "loading-qr" && (
                <div class="qr-center">
                  <div class="qr-spinner" />
                  <div>{this._("waiting")}</div>
                </div>
              )}
              {this.view === "qr-ready" && (
                <div class="qr-center">
                  {this.selectedWallet && (
                    <div class="qr-wallet-name">{this.selectedWallet.name}</div>
                  )}
                  <canvas ref={el => (this.canvasEl = el as HTMLCanvasElement)} width="200" height="200" class="qr-canvas" />
                  <appkit-button variant="outline" size="sm" onClick={() => this.copyUri()}>
                    {this.uriCopied ? this._("copied") : this._("copyLink")}
                  </appkit-button>
                </div>
              )}
              {this.view === "qr-error" && (
                <div class="qr-center">
                  <div class="qr-error-text">{this.qrError || this._("connFailed")}</div>
                  <appkit-button variant="default" size="sm" onClick={() => this.appkitRetry.emit()}>{this._("retry")}</appkit-button>
                </div>
              )}
            </div>
            <div class="modal-footer">
              <img src={this.logoUrl} alt="Naculus" class="footer-logo" onError={(e) => (e.target as HTMLImageElement).style.display = "none"} />
              <div class="footer-lang">
                <appkit-button variant="ghost" size="sm" onClick={() => this.locale = this.locale === "en" ? "zh" : this.locale === "zh" ? "ja" : "en"}>
                  {this.locale.toUpperCase()}
                </appkit-button>
              </div>
              <div class="footer-nav">
                {this.view !== "menu" && (
                  <appkit-button variant="ghost" size="sm" onClick={() => { this.view = "menu"; this.qrError = null }}>
                    {this._("back")}
                  </appkit-button>
                )}
                <appkit-button variant="ghost" size="sm" onClick={() => this.closeModal()}>
                  {this._("close")}
                </appkit-button>
              </div>
            </div>
          </dialog>
        )}
      </Host>
    )
  }

  private setupDropdownClose(el: HTMLElement | null) {
    if (!el) return
    const handler = (e: MouseEvent) => {
      if (!el.contains(e.target as Node) && !this.el.contains(e.target as Node)) {
        this.dropdownOpen = false
        document.removeEventListener("click", handler)
      }
    }
    requestAnimationFrame(() => document.addEventListener("click", handler))
  }
}
