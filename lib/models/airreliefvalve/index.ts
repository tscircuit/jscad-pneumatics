import {
  airReliefValveModelPropsSchema,
  type AirReliefValveModelPropsInput,
} from "@tscircuit/modelprinter"
import {
  bore,
  dark,
  metallic,
  rotate,
  translate,
  round,
  threaded,
  threadDiameter,
  type Solid,
  type PneumaticGeometry,
  type PneumaticPort,
  type Vec3,
} from "../../geometry"
import { createPressureGaugeGeom } from "../pressuregauge"

/** Relief valve with opposing X process ports and optional gauge on -Y. */
export function createAirReliefValveGeom(
  input: AirReliefValveModelPropsInput,
): PneumaticGeometry {
  const p = airReliefValveModelPropsSchema.parse(input)
  const { length: l, width: w, height: h } = p
  const od = Math.min(w, l)
  const z = Math.min(h * 0.23, od * 0.37)
  const processDiameter = Math.min(z * 1.9, od * 0.55)
  const portThread = p.portThread
  const gaugeThread = p.gaugePortThread ?? portThread
  const ports: PneumaticPort[] = [
    threaded("inlet", [-l / 2, 0, z], "-x", portThread),
    threaded("relief", [l / 2, 0, z], "+x", portThread),
    threaded("gauge", [0, -w / 2, z], "-y", gaugeThread),
    threaded("auxgauge", [0, w / 2, z], "+y", gaugeThread),
  ]
  const solids: Solid[] = [dark(round(od * 0.75, h * 0.27, [0, 0, h * 0.135]))]
  for (const port of ports) {
    if (port.kind !== "thread") continue
    const axis = port.direction[1] as "x" | "y"
    const depth = (axis === "x" ? l : w) / 2
    const center: Vec3 = [port.center[0] / 2, port.center[1] / 2, z]
    const boss = round(processDiameter, depth, center, axis)
    solids.push(
      dark(
        bore(
          boss,
          Math.min(processDiameter * 0.73, threadDiameter(port.thread) * 0.85),
          depth * 0.44,
          port,
        ),
      ),
    )
  }

  solids.push(
    dark(round(od, h * 0.16, [0, 0, h * 0.35], "z", 8)),
    dark(round(od * 0.78, h * 0.18, [0, 0, h * 0.52])),
    metallic(round(p.knobDiameter, h * 0.39, [0, 0, h * 0.805], "z", 32)),
  )
  for (let index = 0; index < 16; index++) {
    const angle = (index * Math.PI) / 8
    const r = p.knobDiameter * 0.48
    solids.push(
      metallic(
        round(
          p.knobDiameter * 0.055,
          h * 0.29,
          [r * Math.cos(angle), r * Math.sin(angle), h * 0.805],
          "z",
          10,
        ),
      ),
    )
  }
  if (p.gauge) {
    const diameter = p.gaugeDiameter ?? od
    const gauge = createPressureGaugeGeom({
      outerDiameter: diameter,
      caseDepth: diameter * 0.58,
      stemLength: diameter * 0.21,
      range: 100,
      portThread: gaugeThread,
    })
    for (const solid of gauge.solids) {
      solids.push(translate([0, -w / 2, z], rotate([Math.PI / 2, 0, 0], solid)))
    }
  }
  return { solids, ports }
}
