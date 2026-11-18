import { expect, test } from "bun:test"
import { Circuit, assembly } from "tscircuit"
import BenchDrawings from "../examples/bench-drawings"
import { benchModels } from "../examples/bench-models"
import { PneumaticPart, PneumaticPartDrawing } from "../lib"

test("bench TSX emits one dimensioned drawing per isolated part", async () => {
  const circuit = new Circuit()
  circuit.add(<BenchDrawings />)
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  const pages = json.filter((element) => element.type === "drawing_page")
  const views = json.filter((element) => element.type === "drawing_part_view")
  const dimensions = json.filter(
    (element) => element.type === "drawing_dimension_line",
  )
  expect(pages).toHaveLength(Object.keys(benchModels).length)
  expect(views).toHaveLength(pages.length * 4)

  function dimensionsForPart(name: string) {
    const page = pages.find((page) => page.name === name)!
    const selected = views.filter(
      (view) => view.drawing_page_id === page.drawing_page_id,
    )
    const source = json.find(
      (element) =>
        element.type === "source_component" && element.name === `part-${name}`,
    )
    if (!source || source.type !== "source_component")
      throw new Error(`Missing part "${name}"`)
    for (const view of selected)
      expect(view.source_component_ids).toEqual([source.source_component_id])
    const viewIds = new Set(selected.map((view) => view.drawing_part_view_id))
    return Object.fromEntries(
      dimensions
        .filter(
          (line) =>
            line.drawing_part_view_id && viewIds.has(line.drawing_part_view_id),
        )
        .map((line) => [line.name, line.text]),
    )
  }
  expect(dimensionsForPart("solenoid")).toEqual({
    "overall-depth": "22.22 mm",
    "overall-length": "27.74 mm",
    "overall-height": "39.6 mm",
    "port-face-spacing": "17.476 mm",
  })
  expect(dimensionsForPart("straight-fitting")).toMatchObject({
    "overall-length": "22.38 mm",
    "socket-bore": "6.477 mm",
  })
  expect(dimensionsForPart("pump")).toEqual({
    "overall-depth": "30.5 mm",
    "overall-length": "84.45 mm",
    "overall-height": "50.77 mm",
  })
  expect(dimensionsForPart("tubing")["overall-length"]).toMatch(
    /^48\.[0-9]+ mm$/,
  )
  expect(
    json.some(
      (element) =>
        element.type === "drawing_page_note" &&
        element.text.includes("Cap exhaust"),
    ),
  ).toBe(true)
}, 30_000)

test("part dimensions update with the authored model", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device>
      <PneumaticPart
        name="fitting"
        model="pushfitting_straight_male_tubeod6mm_thread(m5x0.8)_l42mm"
      />
      <PneumaticPartDrawing
        name="sheet"
        title="Straight fitting"
        partRef=".fitting"
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(
    json.find(
      (element) =>
        element.type === "drawing_dimension_line" &&
        element.name === "overall-length",
    ),
  ).toMatchObject({ text: "42 mm" })
})
