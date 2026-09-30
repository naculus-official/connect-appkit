---
"@naculus/connect-appkit-core": minor
"@naculus/connect-appkit-react": patch
"@naculus/connect-appkit-vue": patch
---

Notification settings changed before the persisted settings finish loading
are no longer lost: the late load used to overwrite them (a chain muted during
the first render came back). Such changes are now replayed, in order, on top
of what was persisted. appkit-core adds `replayNotificationSettings` and the
`NotificationSettingsUpdate` type, used by both the React hook and the Vue
composable.
