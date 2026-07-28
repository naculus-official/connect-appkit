import { defineComponent, h } from "vue";

export const AppKitButton = defineComponent({
  name: "AppKitButton",
  props: {
    variant: { type: String, default: "default" },
    size: { type: String, default: "md" },
    disabled: Boolean,
  },
  emits: ["click"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "appkit-button",
        {
          variant: props.variant,
          size: props.size,
          disabled: props.disabled !== false,
          onClick: (e: Event) => emit("click", e),
        },
        slots.default?.(),
      );
  },
});
