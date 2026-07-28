const template = document.createElement("template");
template.innerHTML = `
<style>
:host { display: inline-flex; }
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: calc(var(--radius, 0.5rem) - 2px);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  outline: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 150ms;
}
button:focus-visible { box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5); }
button:active:not(:has([aria-haspopup])) { translate: 0 1px; }
button:disabled { pointer-events: none; opacity: 0.5; }

button.variant-default {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
button.variant-default:hover { background: hsl(var(--primary) / 0.8); }

button.variant-outline {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
}
button.variant-outline:hover { background: hsl(var(--muted)); }

button.variant-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}
button.variant-secondary:hover { background: hsl(var(--secondary) / 0.8); }

button.variant-ghost:hover { background: hsl(var(--muted)); }

button.variant-destructive {
  background: hsl(var(--destructive) / 0.1);
  color: hsl(var(--destructive));
}
button.variant-destructive:hover { background: hsl(var(--destructive) / 0.2); }

button.variant-link {
  color: hsl(var(--primary));
  text-decoration: underline;
  text-underline-offset: 4px;
}

button.size-default { height: 2.25rem; padding: 0 0.625rem; }
button.size-sm { height: 2rem; padding: 0 0.5rem; font-size: 0.8125rem; }
button.size-lg { height: 2.5rem; padding: 0 0.625rem; }
button.size-icon { width: 2.25rem; height: 2.25rem; padding: 0; }
</style>
<button part="button"><slot></slot></button>
`;

export class AppKitButton extends HTMLElement {
  static observedAttributes = ["variant", "size", "disabled"];

  private btn!: HTMLButtonElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.btn = this.shadowRoot!.querySelector("button")!;
  }

  connectedCallback() {
    this.btn.className = `variant-${this.getAttribute("variant") || "default"} size-${this.getAttribute("size") || "default"}`;
    this.btn.disabled = this.hasAttribute("disabled");
    this.btn.addEventListener("click", (e) => {
      if (this.btn.disabled) { e.stopPropagation(); return; }
      this.dispatchEvent(new CustomEvent("appkit-click", { bubbles: true, composed: true }));
    });
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === "variant") this.btn.className = `variant-${value || "default"} size-${this.getAttribute("size") || "default"}`;
    if (name === "size") this.btn.className = `variant-${this.getAttribute("variant") || "default"} size-${value || "default"}`;
    if (name === "disabled") this.btn.disabled = value !== null;
  }
}

customElements.define("appkit-button", AppKitButton);
