import {
  airReliefValveModelPropsSchema,
  type AirReliefValveModelPropsInput,
} from "@tscircuit/modelprinter"
import { jscad } from "tscircuit"
import {
  AxialSolid,
  Bore,
  Dark,
  Metallic,
  threaded,
  threadDiameter,
} from "../../geometry"
import { PressureGauge, getPressureGaugeDimensions } from "../pressuregauge"

export function getAirReliefValveDimensions(
  input: AirReliefValveModelPropsInput,
) {
  const p = airReliefValveModelPropsSchema.parse(input)
  const { length: l, width: w, height: h, portThread } = p
  const od = Math.min(w, l)
  const z = Math.min(h * 0.23, od * 0.37)
  const processDiameter = Math.min(z * 1.9, od * 0.55)
  const gaugeThread = p.gaugePortThread ?? portThread
  const gaugeDiameter = p.gaugeDiameter ?? od
  const ports = [
    threaded("inlet", [-l / 2, 0, z], "-x", portThread),
    threaded("relief", [l / 2, 0, z], "+x", portThread),
    threaded("gauge", [0, -w / 2, z], "-y", gaugeThread),
    threaded("auxgauge", [0, w / 2, z], "+y", gaugeThread),
  ]
  const gauge = p.gauge
    ? getPressureGaugeDimensions({
        outerDiameter: gaugeDiameter,
        caseDepth: gaugeDiameter * 0.58,
        stemLength: gaugeDiameter * 0.21,
        range: 100,
        portThread: gaugeThread,
      })
    : undefined
  return {
    l,
    w,
    h,
    od,
    z,
    processDiameter,
    knobDiameter: p.knobDiameter,
    ports,
    gauge,
  }
}

/** Relief valve with opposing X process ports and optional gauge on -Y. */
export function AirReliefValve({
  dimensions,
}: {
  dimensions: ReturnType<typeof getAirReliefValveDimensions>
}) {
  const { l, w, h, od, z, processDiameter, knobDiameter, ports, gauge } =
    dimensions
  return (
    <>
      <Dark>
        <AxialSolid
          diameter={od * 0.75}
          length={h * 0.27}
          center={[0, 0, h * 0.135]}
        />
        {ports.map((port) => {
          const axis = port.direction[1] === "x" ? "+x" : "+y"
          const depth = (axis === "+x" ? l : w) / 2
          return (
            <jscad.subtract key={port.name}>
              <AxialSolid
                diameter={processDiameter}
                length={depth}
                center={[port.center[0] / 2, port.center[1] / 2, z]}
                direction={axis}
              />
              <Bore
                diameter={Math.min(
                  processDiameter * 0.73,
                  threadDiameter(port.thread) * 0.85,
                )}
                depth={depth * 0.44}
                port={port}
              />
            </jscad.subtract>
          )
        })}
        <AxialSolid
          diameter={od}
          length={h * 0.16}
          center={[0, 0, h * 0.35]}
          segments={8}
        />
        <AxialSolid
          diameter={od * 0.78}
          length={h * 0.18}
          center={[0, 0, h * 0.52]}
        />
      </Dark>
      <Metallic>
        <AxialSolid
          diameter={knobDiameter}
          length={h * 0.39}
          center={[0, 0, h * 0.805]}
          segments={32}
        />
        {Array.from({ length: 16 }, (_, index) => {
          const angle = (index * Math.PI) / 8
          const radius = knobDiameter * 0.48
          return (
            <AxialSolid
              key={index}
              diameter={knobDiameter * 0.055}
              length={h * 0.29}
              center={[
                radius * Math.cos(angle),
                radius * Math.sin(angle),
                h * 0.805,
              ]}
              segments={10}
            />
          )
        })}
      </Metallic>
      {gauge && (
        <jscad.translate offset={[0, -w / 2, z]}>
          <jscad.rotate angles={[Math.PI / 2, 0, 0]}>
            <PressureGauge dimensions={gauge} />
          </jscad.rotate>
        </jscad.translate>
      )}
    </>
  )
}
