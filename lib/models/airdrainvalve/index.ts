import jscad from "@jscad/modeling"
import {
  airDrainValveModelPropsSchema,
  type AirDrainValveModelPropsInput,
} from "@tscircuit/modelprinter"
import {
  bore,
  brass,
  metallic,
  round,
  threaded,
  threadDiameter,
  type PneumaticGeometry,
} from "../../geometry"

/** Male threaded inlet below the body, with a stamped wing operator. */
export function createAirDrainValveGeom(
  input: AirDrainValveModelPropsInput,
): PneumaticGeometry {
  const p = airDrainValveModelPropsSchema.parse(input)
  const l = p.length
  const diameter = threadDiameter(p.thread)
  const hexOD = p.hexAcrossFlats / Math.cos(Math.PI / 6)
  const port = threaded("inlet", [0, 0, 0], "-z", p.thread, "male")
  const solids = [
    brass(
      bore(
        round(diameter, l * 0.385, [0, 0, l * 0.193]),
        diameter * 0.45,
        l * 0.29,
        port,
      ),
    ),
    brass(round(hexOD, l * 0.19, [0, 0, l * 0.472], "z", 6)),
    brass(round(hexOD * 0.72, l * 0.21, [0, 0, l * 0.671])),
    metallic(round(hexOD * 0.48, l * 0.23, [0, 0, l * 0.885])),
  ]
  if (p.wing) {
    const x = p.wingWidth / 2
    const profile = jscad.primitives.polygon({
      points: [
        [-x, l],
        [-x * 0.91, l * 0.81],
        [-x * 0.34, l * 0.72],
        [x * 0.34, l * 0.72],
        [x * 0.91, l * 0.81],
        [x, l],
        [x * 0.48, l],
        [0, l * 0.89],
        [-x * 0.48, l],
      ],
    })
    const thickness = hexOD * 0.117
    const wing = jscad.extrusions.extrudeLinear({ height: thickness }, profile)
    solids.push(
      metallic(
        jscad.transforms.translate(
          [0, thickness / 2, 0],
          jscad.transforms.rotateX(Math.PI / 2, wing),
        ),
      ),
    )
  }
  return {
    solids,
    ports: [
      port,
      {
        name: "vent",
        center: [hexOD * 0.36, 0, l * 0.69],
        direction: "+x",
        kind: "vent",
      },
    ],
  }
}
