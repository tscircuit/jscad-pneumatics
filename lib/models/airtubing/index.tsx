import {
  airTubingModelPropsSchema,
  type AirTubingModelPropsInput,
} from "@tscircuit/modelprinter"
import { jscad } from "tscircuit"
import {
  box,
  paint,
  rotate,
  round,
  subtract,
  type PneumaticGeometry,
  type Vec3,
} from "../../geometry"

function unitDirection(start: Vec3, end: Vec3): Vec3 {
  const x = end[0] - start[0]
  const y = end[1] - start[1]
  const z = end[2] - start[2]
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

function endCutter(end: Vec3, next: Vec3, diameter: number) {
  const [x, y, z] = unitDirection(next, end)
  const side = diameter * 2
  const center: Vec3 = [
    end[0] + (x * side) / 2,
    end[1] + (y * side) / 2,
    end[2] + (z * side) / 2,
  ]
  return (
    <jscad.translate offset={center}>
      {rotate(
        [0, Math.atan2(Math.hypot(x, y), z), Math.atan2(y, x)],
        box([side, side, side], [0, 0, 0]),
      )}
    </jscad.translate>
  )
}

/** Hollow tube built around a straight or sampled centerline using TSX solids. */
export function createAirTubingGeom(
  input: AirTubingModelPropsInput,
): PneumaticGeometry {
  const { outerDiameter, innerDiameter, length, path } =
    airTubingModelPropsSchema.parse(input)
  if (length !== undefined) {
    const center: Vec3 = [length / 2, 0, 0]
    const tube = subtract(
      round(outerDiameter, length, center, "x"),
      round(innerDiameter, length + 0.02, center, "x"),
    )
    return { solids: [paint([0.13, 0.38, 0.72], tube)], ports: [] }
  }

  const points = path!
  for (let i = 1; i < points.length - 1; i++) {
    const before = unitDirection(points[i - 1]!, points[i]!)
    const after = unitDirection(points[i]!, points[i + 1]!)
    if (
      Math.hypot(
        before[0] + after[0],
        before[1] + after[1],
        before[2] + after[2],
      ) < 1e-8
    )
      throw new RangeError(
        "Tubing centerline cannot reverse direction at a point",
      )
  }
  const sweep = (diameter: number) => (
    <jscad.hullChain>
      {points.map((point, index) => (
        <jscad.sphere
          key={index}
          radius={diameter / 2}
          center={point}
          segments={16}
        />
      ))}
    </jscad.hullChain>
  )
  const tube = subtract(
    sweep(outerDiameter),
    sweep(innerDiameter),
    endCutter(points[0]!, points[1]!, outerDiameter),
    endCutter(points.at(-1)!, points.at(-2)!, outerDiameter),
  )
  return { solids: [paint([0.13, 0.38, 0.72], tube)], ports: [] }
}
