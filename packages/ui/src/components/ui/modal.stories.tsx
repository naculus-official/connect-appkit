import type { StoryDefault, Story } from "@ladle/react"
import { useState } from "react"
import { Modal } from "./modal"
import { Button } from "./button"

export default {
  title: "UI/Modal",
} satisfies StoryDefault

export const Default: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Modal Title</h3>
          <p className="text-sm text-muted-foreground">
            This is a basic modal with a close button in the top-right corner.
            Click the overlay or the X button to close.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export const WithTitle: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Accessible Title">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            The <code>title</code> prop sets <code>aria-label</code> on the dialog
            and an <code>aria-live="polite"</code> region for screen readers.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export const LongContent: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Open Long Content</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Terms of Service</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i}>
                Section {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setOpen(false)}>Accept</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export const BottomSheet: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Open Bottom Sheet</Button>
      <Modal open={open} onClose={() => setOpen(false)} mobileVariant="bottom-sheet">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Bottom Sheet</h3>
          <p className="text-sm text-muted-foreground">
            On mobile viewports this renders from the bottom edge with rounded top corners.
            On desktop (&ge;640px) it falls back to the centered modal layout.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export const NonDismissable: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Open Non-dismissable</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closable={false}
        dismissOnOverlay={false}
        title="Important"
      >
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            This modal has no close button and the overlay click is disabled.
            Click the button below to close it.
          </p>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => setOpen(false)}>Acknowledge</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export const Fullscreen: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Open Fullscreen</Button>
      <Modal open={open} onClose={() => setOpen(false)} mobileVariant="fullscreen">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Fullscreen Modal</h3>
          <p className="text-sm text-muted-foreground">
            On mobile this covers the full screen. On desktop it centers like a normal modal.
          </p>
        </div>
      </Modal>
    </div>
  )
}
