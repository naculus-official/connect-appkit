import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    client: "src/client.ts"
  },
  format: ["esm", "cjs"],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ["react", "viem", "@walletconnect/sign-client", "@noble/hashes", "@noble/curves", /^@naculus\//],
  onSuccess: () => {
    console.log("React SDK built successfully");
  }
});
