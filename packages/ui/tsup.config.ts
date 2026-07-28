import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: [
    /^@naculus\//,
    "lucide-react",
    "react",
  ],
});
