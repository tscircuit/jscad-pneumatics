import jscad from "@jscad/modeling"
import {
  airRegulatorModelPropsSchema,
  type AirRegulatorModelPropsInput,
} from "@tscircuit/modelprinter"
import {
  bore,
  box,
  brass,
  dark,
  metallic,
  round,
  threaded,
  threadDiameter,
  type PneumaticGeometry,
  type PneumaticPort,
} from "../../geometry"

/** Ports are fixed to the body. The model rests on Z=0. */
export function createAirRegulatorGeom(
  input: AirRegulatorModelPropsInput,
): PneumaticGeometry {
  const p = airRegulatorModelPropsSchema.parse(input)
  const { length: l, width: w, height: h } = p
  const inlet = p.inletThread ?? p.portThread
  const outlet = p.outletThread ?? p.portThread
  if (p.layout === "axialradial") {
    const od = Math.min(w, h)
    const z = od / 2
    const knobLength = p.knobLength ?? l * 0.19
    const inletLength = Math.min(l * 0.12, (l - knobLength) * 0.22)
    const bodyLength = l - knobLength - inletLength
    const bodyLeft = -l / 2 + inletLength
    const portX = bodyLeft + bodyLength * 0.176
    const outletY = -od * 0.45
    const ports: PneumaticPort[] = [
      threaded("inlet", [-l / 2, 0, z], "-x", inlet),
      threaded("outlet", [portX, outletY, z], "-y", outlet),
    ]
    const nose = round(
      od * 0.63,
      inletLength,
      [-l / 2 + inletLength / 2, 0, z],
      "x",
      6,
    )
    const nutZone = Math.min(bodyLength * 0.33, od * 0.77)
    const barrelLength = bodyLength - nutZone
    const barrel = jscad.booleans.intersect(
      round(od, barrelLength, [bodyLeft + barrelLength / 2, 0, z], "x"),
      box(
        [barrelLength + 0.01, od * 0.95, od],
        [bodyLeft + barrelLength / 2, od * 0.025, z],
      ),
    )
    const postX = bodyLeft + barrelLength
    const panelStem = round(od * 0.8, nutZone, [postX + nutZone / 2, 0, z], "x")
    const adjuster = p.knobDiameter ?? od * 0.62
    const stem = round(
      adjuster * 0.67,
      knobLength * 0.48,
      [l / 2 - knobLength * 0.76, 0, z],
      "x",
    )
    const knob = round(
      adjuster,
      knobLength * 0.52,
      [l / 2 - knobLength * 0.26, 0, z],
      "x",
      36,
    )
    const inletPort = ports[0]!
    const outletPort = ports[1]!
    const solids = [
      brass(
        bore(
          nose,
          Math.min(od * 0.47, threadDiameter(inlet) * 0.83),
          inletLength * 0.85,
          inletPort,
        ),
      ),
      brass(
        bore(
          barrel,
          Math.min(od * 0.58, threadDiameter(outlet) * 0.83),
          od * 0.42,
          outletPort,
        ),
      ),
      brass(panelStem),
      metallic(
        round(od * 0.89, nutZone * 0.05, [postX + nutZone * 0.05, 0, z], "x"),
      ),
      brass(
        round(
          od * 0.96,
          nutZone * 0.18,
          [postX + nutZone * 0.28, 0, z],
          "x",
          6,
        ),
      ),
      brass(round(od, nutZone * 0.22, [postX + nutZone * 0.72, 0, z], "x", 6)),
      metallic(stem),
      dark(knob),
    ]
    if (p.relieving) {
      ports.push({
        name: "vent",
        center: [bodyLeft + bodyLength * 0.72, 0, od],
        direction: "+z",
        kind: "vent",
      })
      solids[1] = brass(bore(solids[1]!, od * 0.1, od * 0.18, ports[2]!))
    }
    return { solids, ports }
  }

  const knobLength = p.knobLength ?? h * 0.26
  const headHeight = (h - knobLength) * (p.filterBowl ? 0.31 : 1)
  const headTop = h - knobLength
  const portZ = headTop - headHeight / 2
  const ports: PneumaticPort[] = [
    threaded("inlet", [-l / 2, 0, portZ], "-x", inlet),
    threaded("outlet", [l / 2, 0, portZ], "+x", outlet),
  ]
  let head = box([l, w, headHeight], [0, 0, portZ])
  head = bore(
    head,
    Math.min(headHeight * 0.72, threadDiameter(inlet) * 0.85),
    l * 0.24,
    ports[0]!,
  )
  head = bore(
    head,
    Math.min(headHeight * 0.72, threadDiameter(outlet) * 0.85),
    l * 0.24,
    ports[1]!,
  )
  const solids = [
    metallic(head),
    dark(
      round(p.knobDiameter ?? Math.min(w, l) * 0.68, knobLength, [
        0,
        0,
        h - knobLength / 2,
      ]),
    ),
  ]
  if (p.filterBowl) {
    const bowlHeight = headTop - headHeight
    solids.push(
      dark(
        round(Math.min(l, w) * 0.74, bowlHeight * 0.9, [
          0,
          0,
          bowlHeight * 0.55,
        ]),
      ),
    )
    solids.push(
      metallic(
        round(Math.min(l, w) * 0.21, bowlHeight * 0.1, [
          0,
          0,
          bowlHeight * 0.05,
        ]),
      ),
    )
  }
  if (p.gauge) {
    const dial = Math.min(l, h) * 0.55
    const depth = dial * 0.36
    solids.push(dark(round(dial, depth, [0, -w / 2 - depth / 2, portZ], "y")))
    solids.push(
      metallic(
        round(dial * 0.88, depth * 0.04, [0, -w / 2 - depth, portZ], "y"),
      ),
    )
  }
  if (p.relieving)
    ports.push({
      name: "vent",
      center: [0, w / 2, portZ],
      direction: "+y",
      kind: "vent",
    })
  return { solids, ports }
}
