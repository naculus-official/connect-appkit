import type { StoryDefault, Story } from "@ladle/react"

export default {
  title: "Design Tokens",
} satisfies StoryDefault

function swatch(cssVar: string, label: string) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div
        className="h-10 w-10 rounded-md shrink-0"
        style={{ background: `hsl(${cssVar})` }}
      />
      <div className="text-sm">
        <div className="font-medium text-[hsl(var(--foreground))]">{label}</div>
        <code className="text-xs text-[hsl(var(--muted-foreground))]">{cssVar}</code>
      </div>
    </div>
  )
}

function spaceToken(name: string, value: string) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-[hsl(var(--border))]">
      <div
        className="h-6 shrink-0 rounded bg-[hsl(var(--primary))]"
        style={{ width: value }}
      />
      <div className="text-sm">
        <code className="font-medium text-[hsl(var(--foreground))]">{name}</code>
        <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">{value}</span>
      </div>
    </div>
  )
}

export const Colors: Story = () => (
  <div className="p-6 space-y-8">
    <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Color Tokens</h1>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {swatch("var(--background)", "Background")}
      {swatch("var(--foreground)", "Foreground")}
      {swatch("var(--card)", "Card")}
      {swatch("var(--card-foreground)", "Card Foreground")}
      {swatch("var(--primary)", "Primary")}
      {swatch("var(--primary-foreground)", "Primary Foreground")}
      {swatch("var(--secondary)", "Secondary")}
      {swatch("var(--secondary-foreground)", "Secondary Foreground")}
      {swatch("var(--muted)", "Muted")}
      {swatch("var(--muted-foreground)", "Muted Foreground")}
      {swatch("var(--accent)", "Accent")}
      {swatch("var(--accent-foreground)", "Accent Foreground")}
      {swatch("var(--destructive)", "Destructive")}
      {swatch("var(--destructive-foreground)", "Destructive Foreground")}
      {swatch("var(--border)", "Border")}
      {swatch("var(--input)", "Input")}
      {swatch("var(--ring)", "Ring")}
    </div>
  </div>
)

export const Spacing: Story = () => (
  <div className="p-6 space-y-8">
    <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Spacing Scale</h1>
    <div className="space-y-3 max-w-md">
      {spaceToken("--w3c-space-1", "4px")}
      {spaceToken("--w3c-space-2", "8px")}
      {spaceToken("--w3c-space-3", "12px")}
      {spaceToken("--w3c-space-4", "16px")}
      {spaceToken("--w3c-space-5", "20px")}
      {spaceToken("--w3c-space-6", "24px")}
      {spaceToken("--w3c-space-8", "32px")}
      {spaceToken("--w3c-space-10", "40px")}
      {spaceToken("--w3c-space-12", "48px")}
      {spaceToken("--w3c-space-16", "64px")}
    </div>
  </div>
)

export const Typography: Story = () => (
  <div className="p-6 space-y-8">
    <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Typography</h1>
    <div className="space-y-4">
      <div>
        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">--w3c-font-size-xs (12px)</div>
        <div className="text-xs text-[hsl(var(--foreground))]">The quick brown fox jumps over the lazy dog</div>
      </div>
      <div>
        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">--w3c-font-size-sm (13px)</div>
        <div className="text-sm text-[hsl(var(--foreground))]">The quick brown fox jumps over the lazy dog</div>
      </div>
      <div>
        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">--w3c-font-size-base (14px)</div>
        <div className="text-base text-[hsl(var(--foreground))]">The quick brown fox jumps over the lazy dog</div>
      </div>
      <div>
        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">--w3c-font-size-lg (16px)</div>
        <div className="text-lg text-[hsl(var(--foreground))]">The quick brown fox jumps over the lazy dog</div>
      </div>
      <div>
        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">--w3c-font-size-xl (18px)</div>
        <div className="text-xl text-[hsl(var(--foreground))]">The quick brown fox jumps over the lazy dog</div>
      </div>
    </div>
  </div>
)

export const Shadows: Story = () => (
  <div className="p-6 space-y-8">
    <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Shadows</h1>
    <div className="grid grid-cols-2 gap-4">
      {[
        ["sm", "var(--w3c-shadow-sm)"],
        ["md", "var(--w3c-shadow-md)"],
        ["lg", "var(--w3c-shadow-lg)"],
        ["xl", "var(--w3c-shadow-xl)"],
      ].map(([name, cssVar]) => (
        <div
          key={name}
          className="rounded-xl p-6 text-center text-sm font-medium text-[hsl(var(--foreground))]"
          style={{
            boxShadow: `var(${cssVar})`,
            background: "hsl(var(--card))",
          }}
        >
          --w3c-shadow-{name}
        </div>
      ))}
    </div>
  </div>
)

export const BorderRadius: Story = () => (
  <div className="p-6 space-y-8">
    <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Border Radius</h1>
    <div className="flex flex-wrap gap-4">
      {[
        ["sm", "6px"],
        ["md", "8px"],
        ["lg", "12px"],
        ["xl", "16px"],
        ["full", "9999px"],
      ].map(([name, value]) => (
        <div
          key={name}
          className="h-20 w-32 flex items-center justify-center text-xs font-medium text-[hsl(var(--foreground))]"
          style={{
            borderRadius: `var(--w3c-radius-${name})`,
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          {name} ({value})
        </div>
      ))}
    </div>
  </div>
)
