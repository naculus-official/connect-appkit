<template>
  <appkit-button :variant="variant" :size="size" :disabled="disabled" @click="$emit('click', $event)">
    <slot />
  </appkit-button>
</template>

<script setup lang="ts">
defineProps<{ variant?: string; size?: string; disabled?: boolean }>();
defineEmits<{ click: [e: Event] }>();
</script>
