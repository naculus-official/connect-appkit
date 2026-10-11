# Changelog

All notable changes are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.12.1] - 2026-10-11

- `@naculus/connect-appkit-react`: remove the unused optional UI dependency, so React consumers do not install UI assets automatically. Users who need UI components must explicitly install `@naculus/connect-appkit-ui`.
- `@naculus/connect-appkit-ui`: update lucide-react to 1.52.0.
- Development tooling: align Storybook and its React/Vite adapter at 10.6.1; update jscpd to 5.4.0.
- `@naculus/connect-appkit-core`, `@naculus/connect-appkit-vue`, `@naculus/connect-appkit-wc`, and `@naculus/connect-native`: version bump only.
- All six packages release in lockstep at 0.12.1; connect-lib dependency ranges remain ^0.12.0.
