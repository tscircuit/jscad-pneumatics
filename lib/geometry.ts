import jscad from "@jscad/modeling"
import type { Geom3 } from "@jscad/modeling/src/geometries/types"
import type { Vec3 } from "@jscad/modeling/src/maths/types"

const { colorize } = jscad.colors
const { subtract } = jscad.booleans
const { cylinder, cuboid } = jscad.primitives
const { rotateX, rotateY, translate } = jscad.transforms

export type { Geom3, Vec3 }
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
  solids: Geom3[]
  ports: PneumaticPort[]
}

export const metallic = (geometry: Geom3) =>
  colorize([0.61, 0.64, 0.69, 1], geometry)
export const dark = (geometry: Geom3) =>
  colorize([0.15, 0.17, 0.19, 1], geometry)
export const brass = (geometry: Geom3) =>
  colorize([0.74, 0.54, 0.26, 1], geometry)

export function box(size: Vec3, center: Vec3): Geom3 {
  return cuboid({ size, center })
}

export function round(
  diameter: number,
  length: number,
  center: Vec3,
  axis: "x" | "y" | "z" = "z",
  segments = 48,
): Geom3 {
  const solid = cylinder({ radius: diameter / 2, height: length, segments })
  const aligned =
    axis === "x"
      ? rotateY(Math.PI / 2, solid)
      : axis === "y"
        ? rotateX(Math.PI / 2, solid)
        : solid
  return translate(center, aligned)
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
): Geom3 {
  return round(
    diameter,
    length,
    center,
    direction[1] as "x" | "y" | "z",
    segments,
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
  geometry: Geom3,
  diameter: number,
  depth: number,
  port: Pick<PneumaticPort, "center" | "direction">,
): Geom3 {
  const cutter = axialSolid(
    diameter,
    depth + 0.02,
    along(port.center, port.direction, -depth / 2),
    port.direction,
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
