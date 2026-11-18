import { expect, test } from "bun:test"
import jscad from "@jscad/modeling"
import { renderToJscadModel } from "jscad-fiber/model"
import { PneumaticModel, createPneumaticModel } from "../lib"
import { benchModels } from "./fixtures/bench-models"

test("React and vanilla supply the same colored solids to JSCAD", () => {
  const model = benchModels["straight-fitting"][1]
  const rendered = renderToJscadModel(<PneumaticModel model={model} />, jscad)
  const { solids } = createPneumaticModel(model)
  expect(rendered.geometries).toHaveLength(solids.length)
  expect(rendered.geometries.map((geometry) => geometry.color)).toEqual(
    solids.map((solid) => solid.color),
  )
})
