import { beforeAll, expect, test } from "bun:test"
import { join } from "node:path"
import "bun-match-svg"
import { benchModels } from "../examples/bench-models"
import { renderBenchDrawings } from "../scripts/render-bench-drawings"

let svgByName: Map<string, string>
beforeAll(async () => {
  const rendered = await renderBenchDrawings()
  svgByName = rendered.svgByName
}, 90_000)

for (const name of Object.keys(benchModels)) {
  test(`TSX drawing sheet matches the ${name} SVG snapshot`, async () => {
    const svg = svgByName.get(name)
    if (!svg) throw new Error(`Export did not produce the "${name}" drawing`)
    const updating =
      process.argv.includes("--update-snapshots") ||
      process.argv.includes("-u") ||
      Boolean(process.env.BUN_UPDATE_SNAPSHOTS)
    const snapshot = Bun.file(
      join(
        import.meta.dir,
        "__snapshots__",
        `bench-drawing-snapshots-${name}.snap.svg`,
      ),
    )
    if (!updating && !(await snapshot.exists())) {
      throw new Error(`Missing checked-in drawing snapshot "${name}"`)
    }
    await expect(svg).toMatchSvgSnapshot(import.meta.path, name)
  }, 15_000)
}
