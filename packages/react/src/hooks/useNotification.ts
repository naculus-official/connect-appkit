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
  InAppChannel,
  type NotificationItem,
  type NotificationSettings,
  type NotificationFrequency,
  type TxStatus,
} from "@naculus/connect-core";
import { createStorageAdapter } from "@naculus/connect-core";

// ─── Default settings ─────────────────────────────────────────────────

const DEFAULT_SETTINGS: NotificationSettings = {
  telegram: false,
  webpush: false,
  inapp: true,
  frequency: "final-only" as NotificationFrequency,
  mutedChains: [],
  mutedTypes: [],
};

const STORAGE_KEY_SETTINGS = "naculus_notif_react_settings";

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
  storage?: {
    getItem: <T>(key: string) => Promise<T | null>;
    setItem: <T>(key: string, value: T) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
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
    return DEFAULT_SETTINGS;
  });

  // ── Load persisted settings on mount ──────────────────────────────

  useEffect(() => {
    const storage = options?.storage ?? createReactStorage();
    storage.getItem<NotificationSettings>(STORAGE_KEY_SETTINGS).then((saved) => {
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

  const clearOne = useCallback((id: string) => {
    const updated = channel.getHistory().filter((n) => n.id !== id);
    // Mutate channel history in place (we recreate from the in-memory history)
    channel.clear();
    // Re-add the ones we want to keep
    Promise.all(
      updated.map((item) =>
        channel.send({
          id: item.id,
          userId: "",
          txHash: item.txHash,
          chainId: "",
          chainName: item.chainName,
          status: item.status,
          title: item.title,
          body: item.body,
          valueFormatted: item.valueFormatted,
          explorerUrl: item.explorerUrl,
          timestamp: item.timestamp,
        }),
      ),
    ).then(() => {
      // Force re-sync
      setNotifications(channel.getHistory());
    });
  }, [channel]);

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
      const full: NotificationItem = {
        ...item,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      };
      channel.send({
        id: full.id,
        userId: "",
        txHash: full.txHash,
        chainId: "",
        chainName: full.chainName,
        status: full.status,
        title: full.title,
        body: full.body,
        valueFormatted: full.valueFormatted,
        explorerUrl: full.explorerUrl,
        timestamp: full.timestamp,
      });
      // The onNotification callback will update state
    },
    [channel],
  );

  // ── Settings ──────────────────────────────────────────────────────

  const updateSettings = useCallback(
    (update: Partial<NotificationSettings>) => {
      setSettingsState((prev) => {
        const next = { ...prev, ...update };
        const storage = options?.storage ?? createReactStorage();
        storage.setItem(STORAGE_KEY_SETTINGS, next).catch(() => {});
        return next;
      });
    },
    [options?.storage],
  );

  const setChannels = useCallback(
    (channels: string[]) => {
      const update: Partial<NotificationSettings> = {};
      if (channels.includes("telegram")) update.telegram = true;
      if (channels.includes("webpush")) update.webpush = true;
      if (channels.includes("inapp")) update.inapp = true;
      updateSettings(update);
    },
    [updateSettings],
  );

  const muteChain = useCallback(
    (chainId: string) => {
      updateSettings({
        mutedChains: [...new Set([...settings.mutedChains, chainId])],
      });
    },
    [settings.mutedChains, updateSettings],
  );

  const unmuteChain = useCallback(
    (chainId: string) => {
      updateSettings({
        mutedChains: settings.mutedChains.filter((c) => c !== chainId),
      });
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

// ─── Storage helper ───────────────────────────────────────────────────

function createReactStorage() {
  const storage = createStorageAdapter("local", "naculus_notif_");

  return {
    getItem: async <T>(key: string): Promise<T | null> => {
      try {
        return await storage.get<T>(key);
      } catch (e) {
        console.warn("useNotification: failed to read from storage:", e);
        return null;
      }
    },
    setItem: async <T>(key: string, value: T): Promise<void> => {
      try {
        await storage.set(key, value);
      } catch (e) {
        console.warn("useNotification: failed to write to storage:", e);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await storage.remove(key);
      } catch (e) {
        console.warn("useNotification: failed to remove from storage:", e);
      }
    },
  };
}
