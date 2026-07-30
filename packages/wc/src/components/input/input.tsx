import { Component, Prop, h, Host } from "@stencil/core"

@Component({
  tag: "appkit-input",
  styleUrl: "input.css",
  shadow: true,
})
export class AppkitInput {
  /** Input type */
  @Prop() type = "text"

  /** Placeholder text */
  @Prop() placeholder = ""

  /** Current value */
  @Prop({ mutable: true }) value = ""

  /** Disable input */
  @Prop() disabled = false

  /** Invalid state */
  @Prop() invalid = false

  /** Name attribute (for forms) */
  @Prop() name = ""

  /** Autocomplete hint */
  @Prop() autocomplete = "off"

  private handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    this.value = target.value
  }

  render() {
    return (
      <Host>
        <input
          class="input"
          type={this.type}
          placeholder={this.placeholder}
          value={this.value}
          disabled={this.disabled}
          aria-invalid={this.invalid ? "true" : undefined}
          name={this.name}
          autocomplete={this.autocomplete}
          onInput={this.handleInput}
        />
      </Host>
    )
  }
}
