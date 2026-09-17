import { describe, expect, it, vi } from "vitest";
import type { NotificationSettings } from "@naculus/connect-core";
import {
  channelsUpdate,
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  mutedChainSettings,
  NOTIFICATION_SETTINGS_KEY,
  saveNotificationSettings,
  type NotificationSettingsStorage,
  updateNotificationSettings,
} from "./notification";

describe("notification settings", () => {
  it("loads and saves through the same persisted key", async () => {
    const saved: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      telegram: true,
    };
    const getItem = vi.fn();
    const setItem = vi.fn();
    const storage: NotificationSettingsStorage = {
      getItem: async <T>(key: string) => {
        getItem(key);
        return saved as T;
      },
      setItem: async <T>(key: string, value: T) => {
        setItem(key, value);
      },
      removeItem: async () => {},
    };
    expect(await loadNotificationSettings(storage)).toEqual(saved);
    saveNotificationSettings(storage, saved);
    expect(getItem).toHaveBeenCalledWith(NOTIFICATION_SETTINGS_KEY);
    expect(setItem).toHaveBeenCalledWith(NOTIFICATION_SETTINGS_KEY, saved);
  });

  it("keeps the existing channel and mute update rules", () => {
    const channels = channelsUpdate(["telegram"]);
    expect(channels).toEqual({ telegram: true });
    const settings = updateNotificationSettings(
      DEFAULT_NOTIFICATION_SETTINGS,
      channels,
    );
    expect(settings.inapp).toBe(true);
    expect(mutedChainSettings(settings, "eip155:1", true)).toEqual({
      mutedChains: ["eip155:1"],
    });
    expect(
      mutedChainSettings(
        { ...settings, mutedChains: ["eip155:1", "eip155:137"] },
        "eip155:1",
        false,
      ),
    ).toEqual({ mutedChains: ["eip155:137"] });
  });
});
