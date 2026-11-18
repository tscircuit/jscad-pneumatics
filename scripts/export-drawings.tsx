import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { renderBenchDrawings } from "./render-bench-drawings"

const outputPath = process.argv[2] ?? "dist/drawings"
const { circuitJson, svgByName } = await renderBenchDrawings()
await mkdir(outputPath, { recursive: true })
await Bun.write(
  join(outputPath, "circuit.json"),
  JSON.stringify(circuitJson, null, 2),
)
for (const [name, svg] of svgByName) {
  await Bun.write(join(outputPath, `${name}.svg`), svg)
}
console.log(
  `Wrote ${svgByName.size} drawing SVGs and circuit.json to ${outputPath}`,
)
