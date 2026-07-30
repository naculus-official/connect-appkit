/// <reference types="vite/client" />

import type { Preview } from "@storybook/react";
import "../packages/ui/src/styles/tokens.css";

// Stencil runtime: provide h() for WC component JSX runtime
(window as any).h = (window as any).h || function(tag: string, props: any, ...children: any[]) {
  const el = typeof tag === "function" ? new tag() : document.createElement(tag);
  if (props) {
    Object.entries(props).forEach(([k, v]) => {
      if (k === "className") (el as any).className = v;
      else if (k === "style") Object.assign((el as any).style, v);
      else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v as any);
      else el.setAttribute(k, v as any);
    });
  }
  children.flat().forEach(c => {
    if (c == null || c === false) return;
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  });
  return el;
};

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
