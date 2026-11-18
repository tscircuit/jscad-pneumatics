import type { ReactElement } from "react"
import { jscad } from "tscircuit"

export type Solid = ReactElement
export type Vec3 = [number, number, number]
export type Direction = "-x" | "+x" | "-y" | "+y" | "-z" | "+z"
export type PneumaticPort = {
  name: string
  center: Vec3
  direction: Direction
} & (
  | {
      kind: "thread"
      thread: string
      gender: "male" | "female"
      innerThread?: string
    }
  | { kind: "push"; tubeOuterDiameter: number }
  | { kind: "barb"; hoseInnerDiameter: number }
  | { kind: "vent" }
)

export interface PneumaticGeometry {
  solids: Solid[]
  ports: PneumaticPort[]
}

export function paint(color: [number, number, number], solid: Solid) {
  return <jscad.colorize color={color}>{solid}</jscad.colorize>
}

export const metallic = (solid: Solid) => paint([0.61, 0.64, 0.69], solid)
export const dark = (solid: Solid) => paint([0.15, 0.17, 0.19], solid)
export const brass = (solid: Solid) => paint([0.74, 0.54, 0.26], solid)

export function box(size: Vec3, center: Vec3): Solid {
  return <jscad.cuboid size={size} center={center} />
}

export function rotate(angles: Vec3, solid: Solid): Solid {
  return <jscad.rotate angles={angles}>{solid}</jscad.rotate>
}

export function translate(offset: Vec3, solid: Solid): Solid {
  return <jscad.translate offset={offset}>{solid}</jscad.translate>
}

export function subtract(solid: Solid, ...cutters: Solid[]): Solid {
  return (
    <jscad.subtract>
      {solid}
      {cutters.map((cutter, index) => (
        <jscad.translate key={index} offset={[0, 0, 0]}>
          {cutter}
        </jscad.translate>
      ))}
    </jscad.subtract>
  )
}

const outwardAngles: Record<Direction, Vec3> = {
  "+x": [0, Math.PI / 2, 0],
  "-x": [0, -Math.PI / 2, 0],
  "+y": [-Math.PI / 2, 0, 0],
  "-y": [Math.PI / 2, 0, 0],
  "+z": [0, 0, 0],
  "-z": [Math.PI, 0, 0],
}

export function round(
  diameter: number,
  length: number,
  center: Vec3,
  axis: "x" | "y" | "z" = "z",
  segments = 48,
): Solid {
  return axialSolid(diameter, length, center, `+${axis}`, segments)
}

const unitVectors: Record<Direction, Vec3> = {
  "-x": [-1, 0, 0],
  "+x": [1, 0, 0],
  "-y": [0, -1, 0],
  "+y": [0, 1, 0],
  "-z": [0, 0, -1],
  "+z": [0, 0, 1],
}

export function along(
  center: Vec3,
  direction: Direction,
  distance: number,
): Vec3 {
  const axis = unitVectors[direction]
  return [
    center[0] + distance * axis[0],
    center[1] + distance * axis[1],
    center[2] + distance * axis[2],
  ]
}

export function axialSolid(
  diameter: number,
  length: number,
  center: Vec3,
  direction: Direction,
  segments = 48,
  topOutlineName?: string,
): Solid {
  const points = Array.from(
    { length: segments },
    (_, index): [number, number] => {
      const angle = (index * 2 * Math.PI) / segments
      return [
        (diameter / 2) * Math.cos(angle),
        (diameter / 2) * Math.sin(angle),
      ]
    },
  )
  return (
    <jscad.translate offset={along(center, direction, -length / 2)}>
      <jscad.rotate angles={outwardAngles[direction]}>
        <jscad.extrudeLinear height={length} topOutlineName={topOutlineName}>
          <jscad.polygon points={points} />
        </jscad.extrudeLinear>
      </jscad.rotate>
    </jscad.translate>
  )
}

/** Make two planar flats on opposite ends of an X-axis barrel. */
export function flatEnds(
  solid: Solid,
  centerX: number,
  diameter: number,
  retainedLength: number,
  height: number,
) {
  const size: Vec3 = [diameter + 0.02, diameter + 0.02, height + 0.02]
  return subtract(
    solid,
    box(size, [centerX - (retainedLength + size[0]) / 2, 0, height / 2]),
    box(size, [centerX + (retainedLength + size[0]) / 2, 0, height / 2]),
  )
}

// Nominal pipe sizes are not the major diameters. These are visual envelopes,
// not thread profiles or machining dimensions.
const pipeInchOD: Record<string, number> = {
  "1/16": 0.3125,
  "1/8": 0.405,
  "1/4": 0.54,
  "3/8": 0.675,
  "1/2": 0.84,
  "3/4": 1.05,
  "1": 1.315,
  "3/2": 1.9,
  "2": 2.375,
}
const bspMajor: Record<string, number> = {
  "1/16": 7.723,
  "1/8": 9.728,
  "1/4": 13.157,
  "3/8": 16.662,
  "1/2": 20.955,
  "3/4": 26.441,
  "1": 33.249,
  "2": 59.614,
}
export function threadDiameter(thread: string): number {
  const metric = /^m([\d.]+)/.exec(thread)
  if (metric) return Number(metric[1])
  const numbered = /^(\d+)-/.exec(thread)
  if (numbered) return (0.06 + 0.013 * Number(numbered[1])) * 25.4
  const size = thread.match(/\d+(?:\/\d+)?/)?.[0] ?? "1/8"
  const [n, d = 1] = size.split("/").map(Number)
  const nominal = (n! / d) * 25.4
  return /^(?:g|r)|bsp/.test(thread)
    ? (bspMajor[size] ?? nominal)
    : (pipeInchOD[size] ?? nominal / 25.4) * 25.4
}

export function bore(
  geometry: Solid,
  diameter: number,
  depth: number,
  port: Pick<PneumaticPort, "center" | "direction">,
  outlineName?: string,
): Solid {
  const cutter = axialSolid(
    diameter,
    depth + 0.02,
    along(port.center, port.direction, -depth / 2),
    port.direction,
    48,
    outlineName,
  )
  return subtract(geometry, cutter)
}

export function threaded(
  name: string,
  center: Vec3,
  direction: Direction,
  thread: string,
  gender: "male" | "female" = "female",
): Extract<PneumaticPort, { kind: "thread" }> {
  return { name, center, direction, kind: "thread", thread, gender }
}
