import { jscad } from "tscircuit"
import {
  diaphragmPumpModelPropsSchema,
  type DiaphragmPumpModelPropsInput,
} from "@tscircuit/modelprinter"
import {
  bore,
  box,
  dark,
  metallic,
  round,
  type PneumaticGeometry,
  type PneumaticPort,
} from "../../geometry"

/** Horizontal motor with a vertical molded pump head and two -X barbs. */
export function createDiaphragmPumpGeom(
  input: DiaphragmPumpModelPropsInput,
): PneumaticGeometry {
  const p = diaphragmPumpModelPropsSchema.parse(input)
  const {
    length: l,
    width: w,
    height: h,
    headLength,
    barbLength,
    motorDiameter,
  } = p
  const headX = -l / 2 + barbLength + headLength / 2
  const headBack = headX + headLength / 2
  const portZ = h - Math.min(h * 0.17, p.hoseInnerDiameter * 1.05)
  const motorLength = l / 2 - headBack
  const motorZ = Math.min(
    h - motorDiameter / 2,
    Math.max(motorDiameter / 2, h * 0.35),
  )
  const baseHeight = h * 0.12
  const baseLength =
    p.mountPitchX === undefined
      ? headLength
      : Math.min(l - barbLength, Math.max(headLength, p.mountPitchX * 1.18))
  const baseCenter = -l / 2 + barbLength + baseLength / 2
  let base = box([baseLength, w, baseHeight], [baseCenter, 0, baseHeight / 2])
  if (
    p.mountPitchX !== undefined &&
    p.mountPitchY !== undefined &&
    p.mountPitchX < baseLength
  ) {
    const diameter = Math.min(
      (w - p.mountPitchY) * 0.7,
      (baseLength - p.mountPitchX) * 0.7,
      3.4,
    )
    for (const x of [-p.mountPitchX / 2, p.mountPitchX / 2]) {
      for (const y of [-p.mountPitchY / 2, p.mountPitchY / 2]) {
        base = bore(base, diameter, baseHeight + 0.03, {
          center: [baseCenter + x, y, baseHeight],
          direction: "+z",
        })
      }
    }
  }
  const motorCover = motorLength * (p.motor === "brusheddc" ? 0.15 : 0.23)
  const capDepth = h * 0.13
  const cap = (
    <jscad.roundedCuboid
      size={[headLength, w, capDepth]}
      center={[headX, 0, h - capDepth * 0.61]}
      roundRadius={Math.min(headLength, w, capDepth) * 0.14}
    />
  )
  const headHeight = h - capDepth - baseHeight
  const head = (
    <jscad.roundedCuboid
      size={[headLength, w * 0.95, headHeight]}
      center={[headX, 0, baseHeight + headHeight / 2]}
      roundRadius={Math.min(headLength, w, headHeight) * 0.065}
    />
  )
  const solids = [
    dark(base),
    dark(head),
    metallic(cap),
    metallic(
      round(
        motorDiameter,
        motorLength - motorCover,
        [headBack + (motorLength - motorCover) / 2, 0, motorZ],
        "x",
      ),
    ),
    dark(
      round(
        motorDiameter * 0.96,
        motorCover,
        [l / 2 - motorCover / 2, 0, motorZ],
        "x",
      ),
    ),
  ]
  for (const x of [-headLength * 0.32, headLength * 0.32]) {
    for (const y of [-w * 0.34, w * 0.34]) {
      const screwOD = Math.min(headLength, w, capDepth) * 0.63
      const screwH = capDepth * 0.21
      const screw = round(
        screwOD,
        screwH,
        [headX + x, y, h - screwH / 2],
        "z",
        20,
      )
      solids.push(
        dark(
          bore(screw, screwOD * 0.48, screwH * 0.7, {
            center: [headX + x, y, h],
            direction: "+z",
          }),
        ),
      )
    }
  }
  const ports: PneumaticPort[] = []
  for (const [index, y] of [-p.barbPitch / 2, p.barbPitch / 2].entries()) {
    const port: Extract<PneumaticPort, { kind: "barb" }> = {
      name: index === 0 ? "outlet" : "inlet",
      center: [-l / 2, y, portZ],
      direction: "-x",
      kind: "barb",
      hoseInnerDiameter: p.hoseInnerDiameter,
    }
    const diameter = p.hoseInnerDiameter
    const barb = bore(
      round(
        diameter * 1.04,
        barbLength,
        [-l / 2 + barbLength / 2, y, portZ],
        "x",
      ),
      diameter * 0.64,
      barbLength * 0.83,
      port,
    )
    solids.push(dark(barb))
    for (const fraction of [0.26, 0.52, 0.78]) {
      solids.push(
        dark(
          round(
            diameter * 1.15,
            barbLength * 0.09,
            [-l / 2 + barbLength * fraction, y, portZ],
            "x",
          ),
        ),
      )
    }
    ports.push(port)
  }
  return { solids, ports }
}
