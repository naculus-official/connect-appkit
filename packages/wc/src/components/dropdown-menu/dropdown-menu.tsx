import { Component, Prop, h, Host, Element, Event, EventEmitter, Listen, State } from "@stencil/core"
import { computePosition, offset, flip, shift } from "@floating-ui/dom"

export interface MenuItem {
  id: string
  label: string
  destructive?: boolean
  disabled?: boolean
  separator?: boolean
}

@Component({
  tag: "appkit-dropdown-menu",
  styleUrl: "dropdown-menu.css",
  shadow: true,
})
export class AppkitDropdownMenu {
  @Element() el!: HTMLElement

  /** JSON string of MenuItem[] */
  @Prop() itemsJson = "[]"

  @State() open = false

  @State() focusIdx = -1

  @Event() appkitSelect!: EventEmitter<string>

  private triggerEl?: HTMLElement
  private menuEl?: HTMLElement

  private get items(): MenuItem[] {
    try { return JSON.parse(this.itemsJson) } catch { return [] }
  }

  @Listen("click", { target: "document" })
  onDocClick(e: MouseEvent) {
    if (!this.open) return
    if (!this.el.contains(e.target as Node)) this.open = false
  }

  private async toggle() {
    if (this.open) {
      this.open = false
      return
    }
    this.open = true
    this.focusIdx = 0
    await this.waitForRender()
    if (this.menuEl && this.triggerEl) {
      const { x, y } = await computePosition(this.triggerEl, this.menuEl, {
        placement: "bottom-start",
        middleware: [offset(4), flip(), shift({ padding: 8 })],
      })
      this.menuEl.style.left = `${x}px`
      this.menuEl.style.top = `${y}px`
    }
  }

  private select(id: string) {
    this.open = false
    this.appkitSelect.emit(id)
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); this.focusIdx = Math.min(this.focusIdx + 1, this.items.length - 1) }
    if (e.key === "ArrowUp") { e.preventDefault(); this.focusIdx = Math.max(this.focusIdx - 1, 0) }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (this.focusIdx >= 0) {
        const item = this.items[this.focusIdx]
        if (item && !item.disabled && !item.separator) this.select(item.id)
      }
    }
    if (e.key === "Escape") { this.open = false }
  }

  private waitForRender() {
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  }

  render() {
    return (
      <Host>
        <span
          ref={el => (this.triggerEl = el as HTMLElement)}
          onClick={() => this.toggle()}
          onKeyDown={(e) => this.handleKeyDown(e)}
          aria-haspopup="true"
          aria-expanded={this.open ? "true" : "false"}
        >
          <slot name="trigger" />
        </span>
        <div
          class={{ menu: true, open: this.open }}
          ref={el => (this.menuEl = el as HTMLElement)}
          role="menu"
        >
          {this.items.map((item, i) => {
            if (item.separator) return <div key={`s-${i}`} class="separator" role="separator" />
            return (
              <button
                key={item.id}
                class={{ item: true, focused: i === this.focusIdx, destructive: !!item.destructive }}
                role="menuitem"
                disabled={item.disabled}
                onMouseEnter={() => (this.focusIdx = i)}
                onClick={() => this.select(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </Host>
    )
  }
}
