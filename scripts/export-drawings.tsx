import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { convertCircuitJsonToDrawingPages } from "@tscircuit/circuit-json-to-drawing"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { createSceneFromGLTF, loadGLTFWithResourcesFromURL } from "poppygl"
import { Circuit } from "tscircuit"
import BenchDrawings from "../examples/bench-drawings"
import { benchModels } from "../examples/bench-models"

const outputPath = process.argv[2] ?? "dist/drawings"
const circuit = new Circuit()
circuit.add(<BenchDrawings />)
await circuit.renderUntilSettled()
const circuitJson = circuit.getCircuitJson()
const drawingPages = circuitJson.filter(
  (element) => element.type === "drawing_page",
)
const geometry = circuitJson.filter(
  (element) =>
    element.type === "source_component" || element.type === "cad_component",
)

const scenes = new Map<
  string,
  Promise<ReturnType<typeof createSceneFromGLTF>>
>()
async function loadPartScene(ids: string[]) {
  const glb = await convertCircuitJsonToGltf(
    geometry.filter((element) => ids.includes(element.source_component_id)),
    { format: "glb", includeModels: true, showBoundingBoxes: false },
  )
  const url = `data:model/gltf-binary;base64,${Buffer.from(glb as ArrayBuffer).toString("base64")}`
  const { gltf, resources } = await loadGLTFWithResourcesFromURL(url)
  return createSceneFromGLTF(gltf, resources)
}

const sheets = await convertCircuitJsonToDrawingPages(circuitJson, {
  async resolveScene(view) {
    const ids = view.source_component_ids
    if (!ids?.length)
      throw new Error("Expected a part selection for every drawing view")
    const key = JSON.stringify(ids)
    let scene = scenes.get(key)
    if (!scene) {
      scene = loadPartScene(ids)
      scenes.set(key, scene)
    }
    return scene
  },
})
if (sheets.length !== Object.keys(benchModels).length)
  throw new Error("Incomplete drawing catalog")
await mkdir(outputPath, { recursive: true })
await Bun.write(
  join(outputPath, "circuit.json"),
  JSON.stringify(circuitJson, null, 2),
)
for (const { drawingPageId, svg } of sheets) {
  const name = drawingPages.find(
    (page) => page.drawing_page_id === drawingPageId,
  )?.name
  if (!name || !Object.hasOwn(benchModels, name))
    throw new Error(`Unexpected drawing page "${name}"`)
  await Bun.write(join(outputPath, `${name}.svg`), svg)
}
console.log(
  `Wrote ${sheets.length} drawing SVGs and circuit.json to ${outputPath}`,
)
