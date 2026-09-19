# @naculus/connect-appkit-vue

**Vue component wrappers for Naculus Connect Web Components** — auto-generated Vue proxies for all 28 Stencil components. Use `<connect-button>`, `<wallet-modal>`, etc. directly in Vue templates.

> **Components have parity with React. Composables do not.** All 28 components
> are generated from the same Stencil source, so anything visual works the same
> in both. The Vue logic layer currently covers 40 of 51 parity targets. Message
> signing and EVM/Solana transaction actions are available through caller-owned
> functions, and SIWX auth/session state is available through caller-owned
> actions. Session keys and parts of the transaction lifecycle remain
> React-only today.
>
> `useCapabilities` (the EIP-5792 query) and `useSolanaRoles` (which of
> `identity` / `signer` / `payer` the connected Solana wallet can fill) are not
> reimplementations: both bindings call the same functions in
> `@naculus/connect-appkit-core`, so "absence is not a denial" cannot mean one
> thing in React and another here.
>
> This is said here rather than discovered later. The table below lists both
> packages at the same version, which is true of the release and not of the
> surface.

> **🔗 Wraps `@naculus/connect-appkit-wc`. If you need the raw Web Components or another framework, see the table below.**

| Framework | Package | Version |
|-----------|---------|---------|
| Web Components (base) | `@naculus/connect-appkit-wc` | `0.2.x` |
| React | `@naculus/connect-appkit-react` | `0.2.x` |
| **Vue** | `@naculus/connect-appkit-vue` | `0.2.x` |
| UI (shared styles) | `@naculus/connect-appkit-ui` | `0.2.x` |

## Install

```bash
npm install @naculus/connect-appkit-vue
# or
pnpm add @naculus/connect-appkit-vue
```

## Usage

See [Storybook](https://naculus-official.github.io/connect-appkit) for all components.

```vue
<template>
  <connect-button />
</template>

<script setup>
import "@naculus/connect-appkit-vue";
</script>
```

### Restoring SIWX sessions

`useSIWxSession` and `useSiwxAuthSession` are reactive shells: they do not read
storage or validate session dates. Before exposing a persisted session or SIWX
result to either composable, the caller must apply the shared appkit-core
policy. This rejects expired sessions, not-yet-valid sessions, and malformed
date strings instead of restoring them.

```ts
import {
  isSiwxExpired,
  isSiwxNotBeforeValid,
  type SiwxResultLike,
} from "@naculus/connect-appkit-core";
import { shallowRef } from "vue";

const restoredResult = shallowRef<SiwxResultLike | null>(null);
const candidate = await loadPersistedSiwxResult();
const now = new Date();

if (
  candidate &&
  !isSiwxExpired(candidate, now) &&
  isSiwxNotBeforeValid(candidate, now)
) {
  restoredResult.value = candidate;
}

// Pass restoredResult to useSiwxAuthSession. For useSIWxSession, expose the
// corresponding session only after the same check and provide isExpired from
// your caller-owned session policy.
```

## License

MIT
