import {
  airDrainValveModelPropsSchema,
  type AirDrainValveModelPropsInput,
} from "@tscircuit/modelprinter"
import { jscad } from "tscircuit"
import {
  AxialSolid,
  Bore,
  Brass,
  Metallic,
  threaded,
  threadDiameter,
  type PneumaticPort,
} from "../../geometry"

export function getAirDrainValveDimensions(
  input: AirDrainValveModelPropsInput,
) {
  const { length, wing, wingWidth, hexAcrossFlats, thread } =
    airDrainValveModelPropsSchema.parse(input)
  const hexOD = hexAcrossFlats / Math.cos(Math.PI / 6)
  const inlet = threaded("inlet", [0, 0, 0], "-z", thread, "male")
  const vent: PneumaticPort = {
    name: "vent",
    center: [hexOD * 0.36, 0, length * 0.69],
    direction: "+x",
    kind: "vent",
  }
  return {
    length,
    wing,
    wingWidth,
    hexOD,
    diameter: threadDiameter(thread),
    inlet,
    vent,
  }
}

/** Male threaded inlet below the body, with a stamped wing operator. */
export function AirDrainValve({
  dimensions,
}: {
  dimensions: ReturnType<typeof getAirDrainValveDimensions>
}) {
  const { length: l, diameter, hexOD, inlet, wing, wingWidth } = dimensions
  const x = wingWidth / 2
  const thickness = hexOD * 0.117
  const wingOutline: [number, number][] = [
    [-x, l],
    [-x * 0.91, l * 0.81],
    [-x * 0.34, l * 0.72],
    [x * 0.34, l * 0.72],
    [x * 0.91, l * 0.81],
    [x, l],
    [x * 0.48, l],
    [0, l * 0.89],
    [-x * 0.48, l],
  ]
  return (
    <>
      <Brass>
        <jscad.subtract>
          <AxialSolid
            diameter={diameter}
            length={l * 0.385}
            center={[0, 0, l * 0.193]}
          />
          <Bore diameter={diameter * 0.45} depth={l * 0.29} port={inlet} />
        </jscad.subtract>
        <AxialSolid
          diameter={hexOD}
          length={l * 0.19}
          center={[0, 0, l * 0.472]}
          segments={6}
        />
        <AxialSolid
          diameter={hexOD * 0.72}
          length={l * 0.21}
          center={[0, 0, l * 0.671]}
        />
      </Brass>
      <Metallic>
        <AxialSolid
          diameter={hexOD * 0.48}
          length={l * 0.23}
          center={[0, 0, l * 0.885]}
        />
        {wing && (
          <jscad.translate offset={[0, thickness / 2, 0]}>
            <jscad.rotate angles={[Math.PI / 2, 0, 0]}>
              <jscad.extrudeLinear height={thickness}>
                <jscad.polygon points={wingOutline} />
              </jscad.extrudeLinear>
            </jscad.rotate>
          </jscad.translate>
        )}
      </Metallic>
    </>
  )
}
