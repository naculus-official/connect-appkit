import type { Meta, StoryObj } from "@storybook/react";
import { explainSpend } from "@naculus/connect-appkit-core";
import type { Authorization, ListedAuthorization } from "@naculus/connect-core";
import { AuthorizationConsent } from "./AuthorizationConsent";

const asset = "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const recipient = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";
const assets = { [asset]: { symbol: "USDC", decimals: 6 } };
const now = 1_999_827_200;
const authorization: Authorization = {
  version: 1,
  label: "SenderPay daily budget",
  principal: "eip155:8453:0xowner",
  grants: [
    {
      asset,
      recipients: [recipient],
      maxPerPayment: 25_000_000n,
      maxTotal: 250_000_000n,
      maxCount: 10,
      rails: ["x402-exact", "mpp-charge"],
    },
  ],
  expiresAt: 2_000_000_000,
};
const request = {
  asset,
  recipient,
  amount: 25_000_000n,
  rail: "x402-exact" as const,
  at: now,
  spentSoFar: 25_000_000n,
  countSoFar: 1,
};
const meta = {
  title: "Payments/AuthorizationConsent",
  component: AuthorizationConsent,
  tags: ["autodocs"],
  args: {
    authorization,
    assets,
    now,
    requester: { name: "SenderPay", origin: "https://pay.sender.example" },
    onApprove: () => undefined,
    onDecline: () => undefined,
  },
} satisfies Meta<typeof AuthorizationConsent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Allowed: Story = {
  args: { preview: explainSpend(authorization, request, { assets }) },
};
export const Blocked: Story = {
  args: {
    preview: explainSpend(authorization, {
      ...request,
      recipient: "0x1111111111111111111111111111111111111111",
    }),
  },
};
export const Busy: Story = { args: { busy: true } };
const warningAuthorization = {
  ...authorization,
  keyId: "legacy-key",
  status: "active",
  enforcer: "evm-session",
  grants: [
    {
      ...authorization.grants[0],
      recipients: [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222",
        "0x3333333333333333333333333333333333333333",
      ],
      maxPerPayment: 9_999_999_999_999_999_123_456n,
    },
  ],
  flags: ["unrestricted-recipient-legacy", "not-expressible"],
  raw: {},
} as unknown as ListedAuthorization;
export const WarningManyRecipients: Story = {
  args: { authorization: warningAuthorization },
};
export const MissingMetadata: Story = { args: { assets: {} } };
export const Dark360: Story = {
  args: WarningManyRecipients.args,
  decorators: [
    (Story) => (
      <div className="dark w-[360px] bg-background p-3 text-foreground">
        <Story />
      </div>
    ),
  ],
};
