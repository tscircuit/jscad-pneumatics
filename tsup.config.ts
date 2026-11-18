import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["lib/index.tsx"],
  format: ["esm"],
  clean: true,
  dts: true,
  external: ["@tscircuit/modelprinter", "react", "tscircuit"],
})
