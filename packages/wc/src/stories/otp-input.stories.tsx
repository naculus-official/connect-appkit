import type { Meta, StoryObj } from "@storybook/react"
import { AppkitInput } from "@naculus/connect-appkit-react"
import { useState, useRef, type KeyboardEvent } from "react"

const OtpDemo = ({ length = 4 }: { length?: number }) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(""))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return
    const next = [...values]
    next[idx] = val
    setValues(next)
    if (val && idx < length - 1) refs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
      {values.map((v, i) => (
        <AppkitInput
          key={i}
          ref={(el: any) => (refs.current[i] = el)}
          value={v}
          onChange={(e: any) => handleChange(i, String(e.target?.value ?? ""))}
          onKeyDown={(e: any) => handleKeyDown(i, e)}
          maxLength={1}
          style={{ width: "3rem", textAlign: "center", fontSize: "1.5rem" }}
        />
      ))}
    </div>
  )
}

const meta: Meta<typeof AppkitInput> = {
  title: "WC/OtpInput",
  component: AppkitInput,
  tags: ["autodocs"],
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { render: () => <OtpDemo /> }
export const SixDigits: Story = { render: () => <OtpDemo length={6} /> }
