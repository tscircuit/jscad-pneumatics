import {
  airDirectionalValveModelPropsSchema,
  type AirDirectionalValveModelPropsInput,
} from "@tscircuit/modelprinter"
import { jscad } from "tscircuit"
import {
  AxialSolid,
  Bore,
  Dark,
  Metallic,
  threaded,
  threadDiameter,
  type PneumaticPort,
  type Vec3,
} from "../../geometry"

export function getAirDirectionalValveDimensions(
  input: AirDirectionalValveModelPropsInput,
) {
  const p = airDirectionalValveModelPropsSchema.parse(input)
  const { length: l, width: w, height: h, mountPitch } = p
  const inlet = p.inletThread ?? p.portThread
  const work = p.workThread ?? p.portThread
  const exhaust = p.exhaustThread ?? p.portThread
  if (p.bodyStyle === "round") {
    // The outlet side has extra width for the radial cable boss.
    const diameter = p.coilDiameter ?? Math.min(w, l)
    const offset = p.radialLeads ? -(l - diameter) / 2 : 0
    const portZ = p.portHeight ?? h * 0.12
    const baseHeight = Math.max(h * 0.24, portZ + (h - portZ) * 0.1)
    const processL = Math.min(p.radialLeads ? l * 0.63 : l, diameter * 0.88)
    const capHeight = Math.min(h * 0.12, (h - baseHeight) * 0.23)
    const inletPort = threaded(
      "P",
      [offset - processL / 2, 0, portZ],
      "-x",
      inlet,
    )
    const workPort = threaded(
      "A",
      [offset + processL / 2, 0, portZ],
      "+x",
      work,
    )
    const ports: PneumaticPort[] = [inletPort, workPort]
    const exhaustCenter: Vec3 = [offset, 0, h]
    const exhaustPort =
      p.flow === "3/2"
        ? p.ventedCap
          ? ({
              name: "EA",
              center: exhaustCenter,
              direction: "+z",
              kind: "vent",
            } as const)
          : threaded("EA", exhaustCenter, "+z", exhaust)
        : undefined
    if (exhaustPort) ports.push(exhaustPort)
    return {
      bodyStyle: p.bodyStyle,
      l,
      h,
      diameter,
      offset,
      baseHeight,
      processL,
      capHeight,
      inletPort,
      workPort,
      exhaustPort,
      mountPitch,
      radialLeads: p.radialLeads,
      ports,
    }
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
  return {
    bodyStyle: p.bodyStyle,
    l,
    w,
    h,
    mountPitch,
    housingHeight,
    ports,
    actuator: p.actuator,
    doubleSolenoid: p.returnType === "doublesolenoid",
  }
}

type Dimensions = ReturnType<typeof getAirDirectionalValveDimensions>

function RoundValve({
  dimensions,
}: {
  dimensions: Extract<Dimensions, { bodyStyle: "round" }>
}) {
  const {
    l,
    h,
    diameter,
    offset,
    baseHeight,
    processL,
    capHeight,
    inletPort,
    workPort,
    exhaustPort,
    mountPitch,
    radialLeads,
  } = dimensions
  const coilHeight = h - baseHeight - capHeight
  const flatCutterSize: Vec3 = [
    diameter + 0.02,
    diameter + 0.02,
    baseHeight + 0.02,
  ]
  const flatCutterOffset = (processL + flatCutterSize[0]) / 2
  const bossStart = offset + diameter * 0.32
  const projection = l / 2 - bossStart
  const boss = projection * 0.72
  const terminal = projection - boss
  return (
    <>
      <Metallic>
        <jscad.subtract>
          <AxialSolid
            diameter={diameter * 0.91}
            length={baseHeight}
            center={[offset, 0, baseHeight / 2]}
          />
          <jscad.cuboid
            size={flatCutterSize}
            center={[offset - flatCutterOffset, 0, baseHeight / 2]}
          />
          <jscad.cuboid
            size={flatCutterSize}
            center={[offset + flatCutterOffset, 0, baseHeight / 2]}
          />
          <Bore
            diameter={threadDiameter(inletPort.thread) * 0.84}
            depth={processL * 0.27}
            port={inletPort}
            outlineName="inletBore"
          />
          <Bore
            diameter={threadDiameter(workPort.thread) * 0.84}
            depth={processL * 0.27}
            port={workPort}
            outlineName="workBore"
          />
          {mountPitch !== undefined &&
            [-mountPitch / 2, mountPitch / 2].map((y) => (
              <Bore
                key={y}
                diameter={diameter * 0.12}
                depth={baseHeight * 0.45}
                port={{ center: [offset, y, 0], direction: "-z" }}
              />
            ))}
        </jscad.subtract>
        <AxialSolid
          diameter={diameter}
          length={capHeight * 1.6}
          center={[offset, 0, baseHeight + capHeight * 0.8]}
        />
      </Metallic>
      <Dark>
        <AxialSolid
          diameter={diameter * 0.9}
          length={coilHeight}
          center={[offset, 0, baseHeight + coilHeight / 2]}
        />
      </Dark>
      <Metallic>
        <AxialSolid
          diameter={diameter}
          length={capHeight * 0.62}
          center={[offset, 0, h - capHeight * 0.69]}
        />
        <jscad.subtract>
          <AxialSolid
            diameter={diameter * 0.64}
            length={capHeight * 0.38}
            center={[offset, 0, h - capHeight * 0.19]}
          />
          {exhaustPort?.kind === "vent" &&
            Array.from({ length: 5 }, (_, index) => {
              const angle = (index * Math.PI * 2) / 5
              return (
                <Bore
                  key={index}
                  diameter={diameter * 0.054}
                  depth={capHeight * 0.5}
                  port={{
                    center: [
                      offset + diameter * 0.23 * Math.cos(angle),
                      diameter * 0.23 * Math.sin(angle),
                      h,
                    ],
                    direction: "+z",
                  }}
                />
              )
            })}
          {exhaustPort?.kind === "thread" && (
            <Bore
              diameter={Math.min(
                diameter * 0.5,
                threadDiameter(exhaustPort.thread) * 0.84,
              )}
              depth={capHeight * 0.92}
              port={exhaustPort}
            />
          )}
        </jscad.subtract>
      </Metallic>
      {radialLeads && (
        <>
          <Dark>
            <jscad.cuboid
              size={[boss, diameter * 0.38, capHeight]}
              center={[bossStart + boss / 2, 0, h * 0.81]}
            />
          </Dark>
          <Metallic>
            {[-diameter * 0.057, diameter * 0.057].map((y) => (
              <AxialSolid
                key={y}
                diameter={diameter * 0.042}
                length={terminal}
                center={[l / 2 - terminal / 2, y, h * 0.81]}
                direction="+x"
                segments={16}
              />
            ))}
          </Metallic>
        </>
      )}
    </>
  )
}

function BlockValve({
  dimensions,
}: {
  dimensions: Extract<Dimensions, { bodyStyle: "block" }>
}) {
  const {
    l,
    w,
    h,
    mountPitch,
    housingHeight,
    ports,
    actuator,
    doubleSolenoid,
  } = dimensions
  const operatorHeight = h - housingHeight
  const operatorZ = h - operatorHeight / 2
  const operators = doubleSolenoid ? [-l / 3, l / 3] : [-l / 3]
  return (
    <>
      <Metallic>
        <jscad.subtract>
          <jscad.cuboid
            size={[l, w, housingHeight]}
            center={[0, 0, housingHeight / 2]}
          />
          {ports.map((port) => (
            <Bore
              key={port.name}
              diameter={Math.min(
                housingHeight * 0.68,
                threadDiameter(port.thread) * 0.85,
              )}
              depth={w / 5}
              port={port}
            />
          ))}
          {mountPitch !== undefined &&
            [-mountPitch / 2, mountPitch / 2].map((x) => (
              <Bore
                key={x}
                diameter={Math.min(w / 5, (l - mountPitch) / 2)}
                depth={housingHeight + 0.1}
                port={{ center: [x, 0, housingHeight], direction: "+z" }}
              />
            ))}
        </jscad.subtract>
      </Metallic>
      {operators.map((x) =>
        actuator === "solenoid" ? (
          <Dark key={x}>
            <jscad.cuboid
              size={[l * 0.28, w * 0.88, operatorHeight]}
              center={[x, 0, operatorZ]}
            />
          </Dark>
        ) : (
          <Metallic key={x}>
            <AxialSolid
              diameter={w * 0.36}
              length={operatorHeight}
              center={[x, 0, operatorZ]}
            />
          </Metallic>
        ),
      )}
    </>
  )
}

export function AirDirectionalValve({
  dimensions,
}: {
  dimensions: Dimensions
}) {
  return dimensions.bodyStyle === "round" ? (
    <RoundValve dimensions={dimensions} />
  ) : (
    <BlockValve dimensions={dimensions} />
  )
}
