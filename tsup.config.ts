import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["lib/index.tsx", "lib/vanilla.ts"],
  format: ["esm"],
  clean: true,
  dts: true,
  external: [
    "@tscircuit/modelprinter",
    "@jscad/modeling",
    "react",
    "jscad-fiber",
    "zod",
  ],
})
