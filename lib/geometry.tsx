import type { ReactElement, ReactNode } from "react"
import { jscad } from "tscircuit"

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
  geometry: ReactElement
  ports: PneumaticPort[]
}

export function Metallic({ children }: { children: ReactNode }) {
  return <jscad.colorize color={[0.61, 0.64, 0.69]}>{children}</jscad.colorize>
}

export function Dark({ children }: { children: ReactNode }) {
  return <jscad.colorize color={[0.15, 0.17, 0.19]}>{children}</jscad.colorize>
}

export function Brass({ children }: { children: ReactNode }) {
  return <jscad.colorize color={[0.74, 0.54, 0.26]}>{children}</jscad.colorize>
}

const outwardAngles: Record<Direction, Vec3> = {
  "+x": [0, Math.PI / 2, 0],
  "-x": [0, -Math.PI / 2, 0],
  "+y": [-Math.PI / 2, 0, 0],
  "-y": [Math.PI / 2, 0, 0],
  "+z": [0, 0, 0],
  "-z": [Math.PI, 0, 0],
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

interface AxialSolidProps {
  diameter: number
  length: number
  center: Vec3
  direction?: Direction
  segments?: number
  topOutlineName?: string
}

/** An axial polygon extrusion, with an optional datum at its outward face. */
export function AxialSolid({
  diameter,
  length,
  center,
  direction = "+z",
  segments = 48,
  topOutlineName,
}: AxialSolidProps) {
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

/** Place a subtraction tool at a mating face. A named outline measures the actual face. */
export function Bore({
  diameter,
  depth,
  port,
  outlineName,
}: {
  diameter: number
  depth: number
  port: Pick<PneumaticPort, "center" | "direction">
  outlineName?: string
}) {
  const length = depth + 0.02
  const overrun = outlineName ? 0 : 0.01
  return (
    <AxialSolid
      diameter={diameter}
      length={length}
      center={along(port.center, port.direction, overrun - length / 2)}
      direction={port.direction}
      topOutlineName={outlineName}
    />
  )
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
