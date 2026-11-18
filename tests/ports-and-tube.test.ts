import { expect, test } from "bun:test"
import { mp } from "@tscircuit/modelprinter"
import { createPneumaticModel } from "../lib"
import { benchModels } from "../examples/bench-models"

test("bench valve mates in place using manufacturer port axes and measured offset", () => {
  const definition = mp.string(benchModels.solenoid[1]).json()
  if (definition.fn !== "airdirectionalvalve")
    throw new Error("Expected a valve definition")
  const { ports } = createPneumaticModel(definition)
  expect(ports).toMatchObject([
    {
      name: "P",
      center: [expect.closeTo(-11.5, 1), 0, 4.78],
      direction: "-x",
      kind: "thread",
      thread: "10-32",
    },
    {
      name: "A",
      center: [expect.closeTo(5.98, 1), 0, 4.78],
      direction: "+x",
      kind: "thread",
      thread: "10-32",
    },
    {
      name: "EA",
      center: [expect.closeTo(-2.76, 1), 0, 39.6],
      direction: "+z",
      kind: "vent",
    },
  ])
})

test("branch tee exposes two tube connections and the nominal male pipe thread", () => {
  const { ports } = createPneumaticModel(benchModels["branch-tee"][1])
  expect(ports).toMatchObject([
    { name: "tube1", direction: "+x", kind: "push", tubeOuterDiameter: 6.35 },
    { name: "tube2", direction: "-x", kind: "push", tubeOuterDiameter: 6.35 },
    {
      name: "thread",
      direction: "+y",
      kind: "thread",
      gender: "male",
      thread: "1/4npt",
    },
  ])
})

test("bench gauge preserves the inner connection in the threaded rear stud", () => {
  const { ports } = createPneumaticModel(benchModels.gauge[1])
  expect(ports).toEqual([
    {
      name: "pressure",
      center: [0, 0, 0],
      direction: "-z",
      kind: "thread",
      gender: "male",
      thread: "1/8npt",
      innerThread: "10-32",
    },
  ])
})

test("a tubing centerline cannot reverse through the same point", () => {
  expect(() =>
    createPneumaticModel("airtubing_od6mm_id4mm_path(0,0,0|10,0,0|0,0,0)"),
  ).toThrow(/reverse/)
})
