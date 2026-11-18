import {
  pressureGaugeModelPropsSchema,
  type PressureGaugeModelPropsInput,
} from "@tscircuit/modelprinter"
import {
  bore,
  box,
  brass,
  dark,
  metallic,
  paint,
  rotate,
  translate,
  round,
  threaded,
  threadDiameter,
  type PneumaticGeometry,
  type Vec3,
} from "../../geometry"

/** The dial faces +Z for back mounts and -Y for bottom mounts. */
export function createPressureGaugeGeom(
  input: PressureGaugeModelPropsInput,
): PneumaticGeometry {
  const p = pressureGaugeModelPropsSchema.parse(input)
  const d = p.outerDiameter
  const bottom = p.mount === "bottommount"
  const bodyBase = bottom ? 0 : p.stemLength
  const dialZ = bodyBase + p.caseDepth
  const studOD = threadDiameter(p.portThread)
  const portCenter: Vec3 = bottom ? [0, -p.caseDepth / 2, 0] : [0, 0, 0]
  const port = {
    ...threaded("pressure", portCenter, "-z", p.portThread, "male"),
    ...(p.innerPortThread ? { innerThread: p.innerPortThread } : {}),
  }
  const collar = Math.min(d * 0.035, p.caseDepth * 0.18)
  const dial = round(d * 0.86, collar * 0.14, [0, 0, dialZ - collar * 0.87])
  const bezel = bore(
    round(d, collar, [0, 0, dialZ - collar / 2]),
    d * 0.875,
    collar + 0.02,
    { center: [0, 0, dialZ], direction: "+z" },
  )
  const solids = [
    dark(
      round(d * 0.98, p.caseDepth - collar, [
        0,
        0,
        (bodyBase + dialZ - collar) / 2,
      ]),
    ),
    dark(bezel),
    paint([0.96, 0.96, 0.92], dial),
  ]
  const detailZ = dialZ - collar * 0.74
  for (let index = 0; index <= 20; index++) {
    const angle = (Math.PI * (225 - (270 * index) / 20)) / 180
    const len = d * (index % 5 === 0 ? 0.061 : 0.03)
    const tick = box(
      [len, d * 0.008, collar * 0.06],
      [d * 0.385 - len / 2, 0, detailZ],
    )
    solids.push(dark(rotate([0, 0, angle], tick)))
  }
  const readingAngle = ((225 - (270 * p.reading) / p.range) * Math.PI) / 180
  const needle = box(
    [d * 0.35, d * 0.021, collar * 0.075],
    [d * 0.112, 0, detailZ + collar * 0.08],
  )
  solids.push(paint([0.65, 0.12, 0.12], rotate([0, 0, readingAngle], needle)))
  solids.push(
    metallic(round(d * 0.075, collar * 0.12, [0, 0, detailZ + collar * 0.12])),
  )
  const body = bottom
    ? solids.map((solid) =>
        translate(
          [0, 0, d / 2 + p.stemLength],
          rotate([Math.PI / 2, 0, 0], solid),
        ),
      )
    : solids
  const boreOD = p.innerPortThread
    ? threadDiameter(p.innerPortThread) * 0.85
    : studOD * 0.35
  const stem = bore(
    round(studOD, p.stemLength, [
      portCenter[0],
      portCenter[1],
      p.stemLength / 2,
    ]),
    boreOD,
    p.stemLength * 0.95,
    port,
  )
  body.push(brass(stem))
  return { solids: body, ports: [port] }
}
