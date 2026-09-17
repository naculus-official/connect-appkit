/**
 * useNotification — React hook for push notification state.
 *
 * Provides notifications, settings, and control methods for the
 * in-app notification center.
 *
 * @example
 * ```tsx
 * import { useNotification } from "@naculus/connect-appkit-react";
 *
 * function NotificationCenter() {
 *   const { notifications, unreadCount, clear, markAsRead } = useNotification();
 *   return (
 *     <div>
 *       <span>Unread: {unreadCount}</span>
 *       <ul>
 *         {notifications.map(n => (
 *           <li key={n.id} onClick={() => markAsRead(n.id)}>
 *             {n.title} — {n.body}
 *           </li>
 *         ))}
 *       </ul>
 *       <button onClick={clear}>Clear all</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  addInAppNotification,
  channelsUpdate,
  clearOneInAppNotification,
  createNotificationSettingsStorage,
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  mutedChainSettings,
  saveNotificationSettings,
  updateNotificationSettings,
  type NotificationSettingsStorage,
} from "@naculus/connect-appkit-core";
import {
  InAppChannel,
  type NotificationItem,
  type NotificationSettings,
} from "@naculus/connect-core";

// ─── Hook ──────────────────────────────────────────────────────────────

/**
 * Hook for consuming in-app notifications in React components.
 *
 * Uses InAppChannel internally to manage the notification queue.
 * All persistent state is stored via localStorage.
 */
export function useNotification(options?: {
  /** External InAppChannel instance (for sharing between hooks). If omitted, creates one. */
  channel?: InAppChannel;
  /** Custom storage for settings (defaults to localStorage) */
  storage?: NotificationSettingsStorage;
}) {
  // ── Channel ──────────────────────────────────────────────────────

  const channelRef = useRef<InAppChannel | null>(null);

  if (!channelRef.current) {
    channelRef.current = options?.channel ?? new InAppChannel();
  }

  const channel = channelRef.current;

  // ── State ────────────────────────────────────────────────────────

  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    channel.getHistory(),
  );

  const [settings, setSettingsState] = useState<NotificationSettings>(() => {
    // Try to load from storage, fall back to default
    return DEFAULT_NOTIFICATION_SETTINGS;
  });

  // ── Load persisted settings on mount ──────────────────────────────

  useEffect(() => {
    const storage = options?.storage ?? createNotificationSettingsStorage();
    loadNotificationSettings(storage).then((saved) => {
      if (saved) {
        setSettingsState(saved);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync notifications with channel ──────────────────────────────

  useEffect(() => {
    // Set up callback to reactively update state when new notifications arrive
    channel.onNotification = (item) => {
      setNotifications((prev) => [...prev, item]);
    };

    // Restore persisted history
    channel.restore().then(() => {
      setNotifications(channel.getHistory());
    });

    return () => {
      // Cleanup: deregister callback on unmount
      channel.onNotification = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Computed ─────────────────────────────────────────────────────

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // ── Actions ──────────────────────────────────────────────────────

  const clear = useCallback(() => {
    channel.clear();
    setNotifications([]);
  }, [channel]);

  const clearOne = useCallback(
    (id: string) => {
      clearOneInAppNotification(channel, id).then(() => {
        // Force re-sync
        setNotifications(channel.getHistory());
      });
    },
    [channel],
  );

  const markAsRead = useCallback(
    (id: string) => {
      channel.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    [channel],
  );

  const markAllAsRead = useCallback(() => {
    channel.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [channel]);

  // ── Add single notification ──────────────────────────────────────

  const addNotification = useCallback(
    (item: Omit<NotificationItem, "id" | "timestamp">) => {
      addInAppNotification(channel, item);
      // The onNotification callback will update state
    },
    [channel],
  );

  // ── Settings ──────────────────────────────────────────────────────

  const updateSettings = useCallback(
    (update: Partial<NotificationSettings>) => {
      setSettingsState((prev) => {
        const next = updateNotificationSettings(prev, update);
        const storage = options?.storage ?? createNotificationSettingsStorage();
        saveNotificationSettings(storage, next);
        return next;
      });
    },
    [options?.storage],
  );

  const setChannels = useCallback(
    (channels: string[]) => {
      updateSettings(channelsUpdate(channels));
    },
    [updateSettings],
  );

  const muteChain = useCallback(
    (chainId: string) => {
      updateSettings(mutedChainSettings(settings, chainId, true));
    },
    [settings.mutedChains, updateSettings],
  );

  const unmuteChain = useCallback(
    (chainId: string) => {
      updateSettings(mutedChainSettings(settings, chainId, false));
    },
    [settings.mutedChains, updateSettings],
  );

  // ── Return ───────────────────────────────────────────────────────

  return {
    /** All in-app notifications (newest last) */
    notifications,
    /** Number of unread notifications */
    unreadCount,
    /** Add a single notification manually */
    addNotification,
    /** Clear all in-app notifications */
    clear,
    /** Clear a single notification */
    clearOne,
    /** Mark a notification as read */
    markAsRead,
    /** Mark all as read */
    markAllAsRead,
    /** Current notification settings */
    settings,
    /** Update notification settings */
    updateSettings,
    /** Set active channels by id */
    setChannels,
    /** Mute a chain */
    muteChain,
    /** Unmute a chain */
    unmuteChain,
  };
}
