import {
  airDirectionalValveModelPropsSchema,
  type AirDirectionalValveModelPropsInput,
} from "@tscircuit/modelprinter"
import {
  box,
  flatEnds,
  bore,
  dark,
  metallic,
  round,
  threaded,
  threadDiameter,
  type PneumaticGeometry,
  type PneumaticPort,
  type Vec3,
} from "../../geometry"

/** Round inline bodies use opposite X process ports and a top exhaust. */
export function createAirDirectionalValveGeom(
  input: AirDirectionalValveModelPropsInput,
): PneumaticGeometry {
  const p = airDirectionalValveModelPropsSchema.parse(input)
  const { length: l, width: w, height: h } = p
  const inlet = p.inletThread ?? p.portThread
  const work = p.workThread ?? p.portThread
  const exhaust = p.exhaustThread ?? p.portThread
  if (p.bodyStyle === "round") {
    // The round coil is centered in Y. Its position in X accounts for the
    // longer cable boss on the outlet side on radial-lead bodies.
    const diameter = p.coilDiameter ?? Math.min(w, l)
    const offset = p.radialLeads ? -(l - diameter) / 2 : 0
    const portZ = p.portHeight ?? h * 0.12
    const baseHeight = Math.max(h * 0.24, portZ + (h - portZ) * 0.1)
    const processL = Math.min(p.radialLeads ? l * 0.63 : l, diameter * 0.88)
    const capHeight = Math.min(h * 0.12, (h - baseHeight) * 0.23)
    const ports: PneumaticPort[] = [
      threaded("P", [offset - processL / 2, 0, portZ], "-x", inlet),
      threaded("A", [offset + processL / 2, 0, portZ], "+x", work),
    ]
    let base = flatEnds(
      round(diameter * 0.91, baseHeight, [offset, 0, baseHeight / 2]),
      offset,
      diameter,
      processL,
      baseHeight,
    )
    for (const port of ports)
      base = bore(
        base,
        threadDiameter(port.name === "P" ? inlet : work) * 0.84,
        processL * 0.27,
        port,
        port.name === "P" ? "inletBore" : "workBore",
      )
    if (p.mountPitch !== undefined) {
      for (const y of [-p.mountPitch / 2, p.mountPitch / 2]) {
        base = bore(base, diameter * 0.12, baseHeight * 0.45, {
          center: [offset, y, 0],
          direction: "-z",
        })
      }
    }
    const coilHeight = h - baseHeight - capHeight
    let cap = round(diameter * 0.64, capHeight * 0.38, [
      offset,
      0,
      h - capHeight * 0.19,
    ])
    if (p.flow === "3/2") {
      const center: Vec3 = [offset, 0, h]
      const port = p.ventedCap
        ? ({ name: "EA", center, direction: "+z", kind: "vent" } as const)
        : threaded("EA", center, "+z", exhaust)
      if (p.ventedCap) {
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5
          cap = bore(cap, diameter * 0.054, capHeight * 0.5, {
            center: [
              offset + diameter * 0.23 * Math.cos(angle),
              diameter * 0.23 * Math.sin(angle),
              h,
            ],
            direction: "+z",
          })
        }
      } else {
        cap = bore(
          cap,
          Math.min(diameter * 0.5, threadDiameter(exhaust) * 0.84),
          capHeight * 0.92,
          port,
        )
      }
      ports.push(port)
    }
    const solids = [
      metallic(base),
      metallic(
        round(diameter, capHeight * 1.6, [
          offset,
          0,
          baseHeight + capHeight * 0.8,
        ]),
      ),
      dark(
        round(diameter * 0.9, coilHeight, [
          offset,
          0,
          baseHeight + coilHeight / 2,
        ]),
      ),
      metallic(
        round(diameter, capHeight * 0.62, [offset, 0, h - capHeight * 0.69]),
      ),
      metallic(cap),
    ]
    if (p.radialLeads) {
      const bossStart = offset + diameter * 0.32
      const projection = l / 2 - bossStart
      const boss = projection * 0.72
      solids.push(
        dark(
          box(
            [boss, diameter * 0.38, capHeight],
            [bossStart + boss / 2, 0, h * 0.81],
          ),
        ),
      )
      const terminal = projection - boss
      for (const y of [-diameter * 0.057, diameter * 0.057]) {
        solids.push(
          metallic(
            round(
              diameter * 0.042,
              terminal,
              [l / 2 - terminal / 2, y, h * 0.81],
              "x",
              16,
            ),
          ),
        )
      }
    }
    return { solids, ports }
  }
  const housingHeight = Math.max(h * 0.76, (h + (p.portHeight ?? 0)) / 2)
  const portZ = p.portHeight ?? housingHeight / 2
  const five = p.flow === "5/2" || p.flow === "5/3"
  const ports = [
    threaded("P", [0, -w / 2, portZ], "-y", inlet),
    threaded("A", [five ? -l / 5 : 0, w / 2, portZ], "+y", work),
    ...(five
      ? [
          threaded("B", [l / 5, w / 2, portZ], "+y", work),
          threaded("EA", [-l / 3, -w / 2, portZ], "-y", exhaust),
          threaded("EB", [l / 3, -w / 2, portZ], "-y", exhaust),
        ]
      : p.flow === "3/2"
        ? [threaded("EA", [l / 3, -w / 2, portZ], "-y", exhaust)]
        : []),
  ]
  let housing = box([l, w, housingHeight], [0, 0, housingHeight / 2])
  for (const port of ports)
    housing = bore(
      housing,
      Math.min(housingHeight * 0.68, threadDiameter(port.thread) * 0.85),
      w / 5,
      port,
    )
  if (p.mountPitch !== undefined) {
    for (const x of [-p.mountPitch / 2, p.mountPitch / 2]) {
      housing = bore(
        housing,
        Math.min(w / 5, (l - p.mountPitch) / 2),
        housingHeight + 0.1,
        { center: [x, 0, housingHeight], direction: "+z" },
      )
    }
  }
  const operatorHeight = h - housingHeight
  const operator = (x: number) =>
    p.actuator === "solenoid"
      ? dark(
          box(
            [l * 0.28, w * 0.88, operatorHeight],
            [x, 0, h - operatorHeight / 2],
          ),
        )
      : metallic(
          round(w * 0.36, operatorHeight, [x, 0, h - operatorHeight / 2]),
        )
  const solids = [metallic(housing), operator(-l / 3)]
  if (p.returnType === "doublesolenoid") solids.push(operator(l / 3))
  return { solids, ports }
}
