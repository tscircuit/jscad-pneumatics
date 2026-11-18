import {
  diaphragmPumpModelPropsSchema,
  type DiaphragmPumpModelPropsInput,
} from "@tscircuit/modelprinter"
import { jscad } from "tscircuit"
import {
  AxialSolid,
  Bore,
  Dark,
  Metallic,
  type PneumaticPort,
  type Vec3,
} from "../../geometry"

export function getDiaphragmPumpDimensions(
  input: DiaphragmPumpModelPropsInput,
) {
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
  const mountPitchX = p.mountPitchX
  const mountPitchY = p.mountPitchY
  const mountHoles =
    mountPitchX !== undefined &&
    mountPitchY !== undefined &&
    mountPitchX < baseLength
      ? {
          diameter: Math.min(
            (w - mountPitchY) * 0.7,
            (baseLength - mountPitchX) * 0.7,
            3.4,
          ),
          centers: [-mountPitchX / 2, mountPitchX / 2].flatMap((x) =>
            [-mountPitchY / 2, mountPitchY / 2].map(
              (y): Vec3 => [baseCenter + x, y, baseHeight],
            ),
          ),
        }
      : undefined
  const ports: Extract<PneumaticPort, { kind: "barb" }>[] = [
    -p.barbPitch / 2,
    p.barbPitch / 2,
  ].map((y, index) => ({
    name: index === 0 ? "outlet" : "inlet",
    center: [-l / 2, y, portZ],
    direction: "-x",
    kind: "barb",
    hoseInnerDiameter: p.hoseInnerDiameter,
  }))
  return {
    l,
    w,
    h,
    headLength,
    barbLength,
    motorDiameter,
    headX,
    headBack,
    motorLength,
    motorZ,
    baseHeight,
    baseLength,
    baseCenter,
    mountHoles,
    ports,
    motorCover: motorLength * (p.motor === "brusheddc" ? 0.15 : 0.23),
  }
}

/** Horizontal motor with a vertical molded pump head and two -X barbs. */
export function DiaphragmPump({
  dimensions,
}: {
  dimensions: ReturnType<typeof getDiaphragmPumpDimensions>
}) {
  const {
    l,
    w,
    h,
    headLength,
    barbLength,
    motorDiameter,
    headX,
    headBack,
    motorLength,
    motorZ,
    baseHeight,
    baseLength,
    baseCenter,
    mountHoles,
    ports,
    motorCover,
  } = dimensions
  const capDepth = h * 0.13
  const headHeight = h - capDepth - baseHeight
  const screwOD = Math.min(headLength, w, capDepth) * 0.63
  const screwH = capDepth * 0.21
  const screwCenters: Vec3[] = [-headLength * 0.32, headLength * 0.32].flatMap(
    (x) => [-w * 0.34, w * 0.34].map((y): Vec3 => [headX + x, y, h]),
  )
  return (
    <>
      <Dark>
        <jscad.subtract>
          <jscad.cuboid
            size={[baseLength, w, baseHeight]}
            center={[baseCenter, 0, baseHeight / 2]}
          />
          {mountHoles?.centers.map((center) => (
            <Bore
              key={center.join(",")}
              diameter={mountHoles.diameter}
              depth={baseHeight + 0.03}
              port={{ center, direction: "+z" }}
            />
          ))}
        </jscad.subtract>
        <jscad.roundedCuboid
          size={[headLength, w * 0.95, headHeight]}
          center={[headX, 0, baseHeight + headHeight / 2]}
          roundRadius={Math.min(headLength, w, headHeight) * 0.065}
        />
      </Dark>
      <Metallic>
        <jscad.roundedCuboid
          size={[headLength, w, capDepth]}
          center={[headX, 0, h - capDepth * 0.61]}
          roundRadius={Math.min(headLength, w, capDepth) * 0.14}
        />
        <AxialSolid
          diameter={motorDiameter}
          length={motorLength - motorCover}
          center={[headBack + (motorLength - motorCover) / 2, 0, motorZ]}
          direction="+x"
        />
      </Metallic>
      <Dark>
        <AxialSolid
          diameter={motorDiameter * 0.96}
          length={motorCover}
          center={[l / 2 - motorCover / 2, 0, motorZ]}
          direction="+x"
        />
        {screwCenters.map(([x, y, z]) => (
          <jscad.subtract key={`${x},${y}`}>
            <AxialSolid
              diameter={screwOD}
              length={screwH}
              center={[x, y, z - screwH / 2]}
              segments={20}
            />
            <Bore
              diameter={screwOD * 0.48}
              depth={screwH * 0.7}
              port={{ center: [x, y, z], direction: "+z" }}
            />
          </jscad.subtract>
        ))}
        {ports.map((port) => (
          <PumpBarb key={port.name} port={port} length={barbLength} />
        ))}
      </Dark>
    </>
  )
}

function PumpBarb({
  port,
  length,
}: {
  port: Extract<PneumaticPort, { kind: "barb" }>
  length: number
}) {
  const [x, y, z] = port.center
  const diameter = port.hoseInnerDiameter
  return (
    <>
      <jscad.subtract>
        <AxialSolid
          diameter={diameter * 1.04}
          length={length}
          center={[x + length / 2, y, z]}
          direction="+x"
        />
        <Bore diameter={diameter * 0.64} depth={length * 0.83} port={port} />
      </jscad.subtract>
      {[0.26, 0.52, 0.78].map((fraction) => (
        <AxialSolid
          key={fraction}
          diameter={diameter * 1.15}
          length={length * 0.09}
          center={[x + length * fraction, y, z]}
          direction="+x"
        />
      ))}
    </>
  )
}
