import {
  airTubingModelPropsSchema,
  type AirTubingModelPropsInput,
} from "@tscircuit/modelprinter"
import { jscad } from "tscircuit"
import { AxialSolid, type Vec3 } from "../../geometry"

function unitDirection(start: Vec3, end: Vec3): Vec3 {
  const x = end[0] - start[0]
  const y = end[1] - start[1]
  const z = end[2] - start[2]
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

export function getAirTubingDimensions(input: AirTubingModelPropsInput) {
  const { outerDiameter, innerDiameter, length, path } =
    airTubingModelPropsSchema.parse(input)
  if (length !== undefined)
    return { kind: "straight", outerDiameter, innerDiameter, length } as const
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
    ) {
      throw new RangeError(
        "Tubing centerline cannot reverse direction at a point",
      )
    }
  }
  return { kind: "routed", outerDiameter, innerDiameter, points } as const
}

function EndCutter({
  end,
  next,
  diameter,
}: {
  end: Vec3
  next: Vec3
  diameter: number
}) {
  const [x, y, z] = unitDirection(next, end)
  const side = diameter * 2
  return (
    <jscad.translate
      offset={[
        end[0] + (x * side) / 2,
        end[1] + (y * side) / 2,
        end[2] + (z * side) / 2,
      ]}
    >
      <jscad.rotate
        angles={[0, Math.atan2(Math.hypot(x, y), z), Math.atan2(y, x)]}
      >
        <jscad.cuboid size={[side, side, side]} center={[0, 0, 0]} />
      </jscad.rotate>
    </jscad.translate>
  )
}

function CenterlineHull({
  points,
  diameter,
}: {
  points: Vec3[]
  diameter: number
}) {
  return (
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
}

/** Hollow tube built around a straight or sampled centerline. */
export function AirTubing({
  dimensions,
}: {
  dimensions: ReturnType<typeof getAirTubingDimensions>
}) {
  const { outerDiameter, innerDiameter } = dimensions
  if (dimensions.kind === "straight") {
    const { length } = dimensions
    const center: Vec3 = [length / 2, 0, 0]
    return (
      <jscad.colorize color={[0.13, 0.38, 0.72]}>
        <jscad.subtract>
          <AxialSolid
            diameter={outerDiameter}
            length={length}
            center={center}
            direction="+x"
          />
          <AxialSolid
            diameter={innerDiameter}
            length={length + 0.02}
            center={center}
            direction="+x"
          />
        </jscad.subtract>
      </jscad.colorize>
    )
  }

  const { points } = dimensions
  return (
    <jscad.colorize color={[0.13, 0.38, 0.72]}>
      <jscad.subtract>
        <CenterlineHull points={points} diameter={outerDiameter} />
        <CenterlineHull points={points} diameter={innerDiameter} />
        <EndCutter
          end={points[0]!}
          next={points[1]!}
          diameter={outerDiameter}
        />
        <EndCutter
          end={points.at(-1)!}
          next={points.at(-2)!}
          diameter={outerDiameter}
        />
      </jscad.subtract>
    </jscad.colorize>
  )
}
