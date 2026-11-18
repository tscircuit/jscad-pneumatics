import jscad from "@jscad/modeling"
import {
  airTubingModelPropsSchema,
  type AirTubingModelPropsInput,
} from "@tscircuit/modelprinter"
import type { PneumaticGeometry, Vec3 } from "../../geometry"

const { vec3 } = jscad.maths
const sides = 24

/** Hollow tubing swept around a millimeter centerline. Sample curves at the desired resolution. */
export function createAirTubingGeom(
  input: AirTubingModelPropsInput,
): PneumaticGeometry {
  const props = airTubingModelPropsSchema.parse(input)
  const path = props.path ?? [
    [0, 0, 0],
    [props.length!, 0, 0],
  ]
  const directions = path
    .slice(1)
    .map((point, index) =>
      vec3.normalize(
        vec3.create(),
        vec3.subtract(vec3.create(), point, path[index]!),
      ),
    )
  const faces: Vec3[][] = []
  let previousU: Vec3 | undefined
  const rings = path.map((point, index) => {
    const before = directions[Math.max(0, index - 1)]!
    const after = directions[Math.min(directions.length - 1, index)]!
    const bisector = vec3.add(vec3.create(), before, after)
    if (vec3.length(bisector) < 1e-8)
      throw new RangeError(
        "Tubing centerline cannot reverse direction at a point",
      )
    const tangent = vec3.normalize(vec3.create(), bisector)
    const seed =
      previousU ?? (Math.abs(tangent[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])
    const projected = vec3.subtract(
      vec3.create(),
      seed,
      vec3.scale(vec3.create(), tangent, vec3.dot(seed, tangent)),
    )
    const u =
      vec3.length(projected) < 1e-8
        ? vec3.normalize(
            vec3.create(),
            vec3.cross(vec3.create(), before, after),
          )
        : vec3.normalize(vec3.create(), projected)
    const v = vec3.cross(vec3.create(), tangent, u)
    previousU = u
    return [props.outerDiameter, props.innerDiameter].map((diameter) =>
      Array.from({ length: sides }, (_, index): Vec3 => {
        const theta = (2 * Math.PI * index) / sides
        const radius = diameter / 2
        const x = radius * Math.cos(theta)
        const y = radius * Math.sin(theta)
        return [
          point[0] + u[0] * x + v[0] * y,
          point[1] + u[1] * x + v[1] * y,
          point[2] + u[2] * x + v[2] * y,
        ]
      }),
    ) as [Vec3[], Vec3[]]
  })

  function quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3) {
    faces.push([a, b, c], [a, c, d])
  }
  for (let index = 1; index < rings.length; index++) {
    const [outer0, inner0] = rings[index - 1]!
    const [outer1, inner1] = rings[index]!
    for (let side = 0; side < sides; side++) {
      const next = (side + 1) % sides
      quad(outer0[side]!, outer0[next]!, outer1[next]!, outer1[side]!)
      quad(inner0[next]!, inner0[side]!, inner1[side]!, inner1[next]!)
    }
  }
  const [outerStart, innerStart] = rings[0]!
  const [outerEnd, innerEnd] = rings.at(-1)!
  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides
    quad(
      outerStart[next]!,
      outerStart[side]!,
      innerStart[side]!,
      innerStart[next]!,
    )
    quad(outerEnd[side]!, outerEnd[next]!, innerEnd[next]!, innerEnd[side]!)
  }
  const tube = jscad.geometries.geom3.fromPoints(faces)
  return {
    solids: [jscad.colors.colorize([0.13, 0.38, 0.72, 1], tube)],
    ports: [],
  }
}
