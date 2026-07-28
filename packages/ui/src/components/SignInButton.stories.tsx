import type { StoryDefault, Story } from "@ladle/react"
import { SignInButton } from "./SignInButton"

export default {
  title: "SignInButton",
} satisfies StoryDefault

export const Default: Story = () => <SignInButton key="default" />

export const SigningIn: Story = () => <SignInButton key="signing-in" isSigningIn />

export const SignedIn: Story = () => (
  <SignInButton
    key="signed-in"
    isSignedIn
    result={{ message: { raw: "Signed in!", domain: "example.com", address: "0x1234", uri: "https://example.com", version: 1, statement: "Sign in", nonce: "abc", issuedAt: new Date().toISOString(), chainId: "eip155:1", expirationTime: null, notBefore: null, resources: [], requestId: null, blockchain: "Ethereum" }, signature: "0x..." }}
  />
)

export const WithError: Story = () => (
  <SignInButton
    key="with-error"
    error={new Error("Signature rejected by user")}
    onClearError={() => {}}
  />
)

export const CustomChildren: Story = () => (
  <SignInButton key="custom-children">
    <span>Custom Button Text</span>
  </SignInButton>
)
