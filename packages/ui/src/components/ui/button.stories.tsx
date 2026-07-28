import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: "Connect Wallet", variant: "default" },
};

export const Destructive: Story = {
  args: { children: "Disconnect", variant: "destructive" },
};

export const Outline: Story = {
  args: { children: "Cancel", variant: "outline" },
};

export const Secondary: Story = {
  args: { children: "Learn More", variant: "secondary" },
};

export const Ghost: Story = {
  args: { children: "Dismiss", variant: "ghost" },
};

export const Link: Story = {
  args: { children: "Terms of Service", variant: "link" },
};

export const Small: Story = {
  args: { children: "OK", variant: "default", size: "sm" },
};

export const Large: Story = {
  args: { children: "Create Account", variant: "default", size: "lg" },
};

export const Disabled: Story = {
  args: { children: "Processing...", variant: "default", disabled: true },
};
