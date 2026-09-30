---
"@naculus/connect-appkit-wc": patch
---

appkit-dropdown-menu and appkit-popover: `aria-haspopup` / `aria-expanded` now
sit on the slotted trigger element, where screen readers read them, instead of
a role-less wrapper. The dropdown menu moves real focus between items
(ArrowUp/ArrowDown/Home/End, skipping separators and disabled items), no
longer swallows Enter/Space on its trigger, and returns focus to the trigger
on Escape or selection. The popover's Escape now actually returns focus to the
trigger.
