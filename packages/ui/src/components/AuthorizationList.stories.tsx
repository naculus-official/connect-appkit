import type { Meta, StoryObj } from "@storybook/react";
import type {
  ListedAuthorization,
  RevokeListedAuthorizationResult,
} from "@naculus/connect-core";
import { AuthorizationList } from "./AuthorizationList";

const base = {
  keyId: "senderpay-coffee",
  status: "active",
  enforcer: "evm-session",
  principal: "owner",
  expiresAt: 2_000_000_000,
  grants: [
    {
      asset: "token",
      recipients: ["0x209693Bc6afc0C5328bA36FaF03C514EF312287C"],
      maxPerPayment: 25_000_000n,
      maxTotal: 250_000_000n,
      maxCount: 10,
      rails: ["x402-exact"],
    },
  ],
  spent: { token: 75_000_000n },
  flags: [],
  raw: {},
} as unknown as ListedAuthorization;
const meta = {
  title: "Payments/AuthorizationList",
  component: AuthorizationList,
  tags: ["autodocs"],
  args: {
    entries: [base],
    assets: { token: { symbol: "USDC", decimals: 6 } },
    onRevoke: async (): Promise<RevokeListedAuthorizationResult> => ({
      onChainRevocationRequired: false,
    }),
  },
} satisfies Meta<typeof AuthorizationList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Active: Story = {};
export const EveryStatus: Story = {
  args: {
    entries: (["active", "pending", "revoked", "expired"] as const).map(
      (status, index) => ({
        ...base,
        keyId: `${status}-${index}`,
        status,
        spent: index === 1 ? undefined : base.spent,
      }),
    ),
  },
};
export const WarningAndOnChainRevoke: Story = {
  args: {
    entries: [
      {
        ...base,
        flags: ["unrestricted-recipient-legacy", "not-expressible"],
        grants: [
          {
            ...base.grants[0],
            recipients: [
              "0x1111111111111111111111111111111111111111",
              "0x2222222222222222222222222222222222222222",
              "0x3333333333333333333333333333333333333333",
            ],
          },
        ],
      } as ListedAuthorization,
    ],
    onRevoke: async () => ({ onChainRevocationRequired: true }),
  },
};
export const Revoking: Story = { args: { revokingId: "senderpay-coffee" } };
export const Empty: Story = { args: { entries: [] } };
export const MissingMetadataDark360: Story = {
  args: { ...WarningAndOnChainRevoke.args, assets: {} },
  decorators: [
    (Story) => (
      <div className="dark w-[360px] bg-background p-3 text-foreground">
        <Story />
      </div>
    ),
  ],
};
