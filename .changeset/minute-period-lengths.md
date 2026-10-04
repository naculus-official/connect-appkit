---
"@naculus/connect-appkit-core": patch
---

Describe grant periods that are whole minutes in minutes: a 1800-second period reads "every 30 minutes" instead of "every 1800 seconds". Periods that are not a whole number of minutes stay in seconds, and weeks, days, and hours read as before.
