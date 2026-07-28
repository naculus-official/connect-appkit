import type { StoryDefault, Story } from "@ladle/react"
import { QRCodeModal } from "./QRCodeModal"

export default {
  title: "QRCodeModal",
} satisfies StoryDefault

export const Closed: Story = () => (
  <QRCodeModal key="closed" uri={null} open={false} onClose={() => {}} />
)

export const Pending: Story = () => (
  <QRCodeModal key="pending" uri="wc:abc123" open onClose={() => {}} />
)

export const Scanned: Story = () => (
  <QRCodeModal
    key="scanned"
    uri="wc:abc123"
    open
    onClose={() => {}}
    status="scanned"
  />
)

export const Expired: Story = () => (
  <QRCodeModal
    key="expired"
    uri="wc:abc123"
    open
    onClose={() => {}}
    status="expired"
    onRetry={() => {}}
  />
)

export const WithDeepLink: Story = () => (
  <QRCodeModal
    key="with-deep-link"
    uri="wc:abc123"
    open
    onClose={() => {}}
    onDeepLink={(uri) => alert(`Deep link: ${uri}`)}
    showDeepLink
  />
)

export const CustomTitle: Story = () => (
  <QRCodeModal
    key="custom-title"
    uri="wc:abc123"
    open
    onClose={() => {}}
    title="Connect with MetaMask"
    description="Open MetaMask and scan the QR code"
  />
)
