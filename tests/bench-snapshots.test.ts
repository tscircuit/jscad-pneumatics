import { expect, test } from "bun:test"
import jscad from "@jscad/modeling"
import type { Geom3, Vec3 } from "../lib/geometry"
import { createPneumaticModel } from "../lib/vanilla"
import { benchModels } from "./fixtures/bench-models"
import { expectPngSnapshot } from "./fixtures/expect-png-snapshot"
import {
  renderModelSnapshot,
  type SnapshotView,
} from "./fixtures/render-model-snapshot"

function triangleMesh(solid: Geom3) {
  const positions: number[] = []
  for (const { vertices } of jscad.geometries.geom3.toPolygons(solid)) {
    for (let i = 1; i < vertices.length - 1; i++)
      positions.push(...vertices[0]!, ...vertices[i]!, ...vertices[i + 1]!)
  }
  return {
    positions,
    indices: Array.from({ length: positions.length / 3 }, (_, index) => index),
  }
}

for (const [file, [title, modelString, footer]] of Object.entries(
  benchModels,
)) {
  test(`renders ${file} in four views`, async () => {
    const { solids } = createPneumaticModel(modelString)
    const bounds = solids.map((solid) =>
      jscad.measurements.measureBoundingBox(solid),
    )
    const lower = [0, 1, 2].map((axis) =>
      Math.min(...bounds.map((bound) => bound[0][axis]!)),
    ) as Vec3
    const upper = [0, 1, 2].map((axis) =>
      Math.max(...bounds.map((bound) => bound[1][axis]!)),
    ) as Vec3
    const target: Vec3 = [
      (upper[0] + lower[0]) / 2,
      (upper[1] + lower[1]) / 2,
      (upper[2] + lower[2]) / 2,
    ]
    const extent = Math.hypot(
      upper[0] - lower[0],
      upper[1] - lower[1],
      upper[2] - lower[2],
    )
    expect(extent).toBeGreaterThan(0)
    for (const solid of solids)
      expect(jscad.measurements.measureVolume(solid)).toBeGreaterThan(0)
    const view = (
      name: string,
      direction: Vec3,
      span: number,
    ): SnapshotView => ({
      name,
      detail: "",
      target,
      eye: [
        target[0] + direction[0] * extent * 7,
        target[1] + direction[1] * extent * 7,
        target[2] + direction[2] * extent * 7,
      ],
      span: extent * span,
    })
    const tinted = solids.map((solid) => {
      const [r, g, b, a = 1] = solid.color ?? [0.42, 0.49, 0.59]
      return {
        mesh: triangleMesh(solid),
        color: [r, g, b, a] as [number, number, number, number],
      }
    })
    const [first, ...additionalMeshes] = tinted
    const png = await renderModelSnapshot({
      ...first!,
      additionalMeshes,
      title,
      modelString,
      footer,
      views: [
        view("ISOMETRIC", [1, -1.45, 1.05], 1.07),
        view("TOP", [0, 0, 1], 1.12),
        view("FRONT", [0, -1, 0], 1.12),
        view("SIDE", [1, 0, 0], 1.12),
      ],
    })
    await expectPngSnapshot(png, `${import.meta.dir}/${file}.test.ts`)
  })
}
