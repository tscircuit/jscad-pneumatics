import {
  airRegulatorModelPropsSchema,
  type AirRegulatorModelPropsInput,
} from "@tscircuit/modelprinter"
import { jscad } from "tscircuit"
import {
  AxialSolid,
  Bore,
  Brass,
  Dark,
  Metallic,
  threaded,
  threadDiameter,
  type PneumaticPort,
} from "../../geometry"

export function getAirRegulatorDimensions(input: AirRegulatorModelPropsInput) {
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
    const inletPort = threaded("inlet", [-l / 2, 0, z], "-x", inlet)
    const outletPort = threaded("outlet", [portX, outletY, z], "-y", outlet)
    const vent: PneumaticPort | undefined = p.relieving
      ? {
          name: "vent",
          center: [bodyLeft + bodyLength * 0.72, 0, od],
          direction: "+z",
          kind: "vent",
        }
      : undefined
    const ports = vent ? [inletPort, outletPort, vent] : [inletPort, outletPort]
    return {
      layout: p.layout,
      l,
      od,
      z,
      knobLength,
      inletLength,
      bodyLength,
      bodyLeft,
      outletY,
      inletPort,
      outletPort,
      vent,
      ports,
      knobDiameter: p.knobDiameter ?? od * 0.62,
    }
  }
  const knobLength = p.knobLength ?? h * 0.26
  const headHeight = (h - knobLength) * (p.filterBowl ? 0.31 : 1)
  const headTop = h - knobLength
  const portZ = headTop - headHeight / 2
  const inletPort = threaded("inlet", [-l / 2, 0, portZ], "-x", inlet)
  const outletPort = threaded("outlet", [l / 2, 0, portZ], "+x", outlet)
  const ports: PneumaticPort[] = [inletPort, outletPort]
  if (p.relieving)
    ports.push({
      name: "vent",
      center: [0, w / 2, portZ],
      direction: "+y",
      kind: "vent",
    })
  return {
    layout: p.layout,
    l,
    w,
    h,
    knobLength,
    headHeight,
    headTop,
    portZ,
    inletPort,
    outletPort,
    ports,
    knobDiameter: p.knobDiameter ?? Math.min(w, l) * 0.68,
    filterBowl: p.filterBowl,
    gauge: p.gauge,
  }
}

type Dimensions = ReturnType<typeof getAirRegulatorDimensions>

function AxialRadialRegulator({
  dimensions,
}: {
  dimensions: Extract<Dimensions, { layout: "axialradial" }>
}) {
  const {
    l,
    od,
    z,
    knobLength,
    inletLength,
    bodyLength,
    bodyLeft,
    outletY,
    inletPort,
    outletPort,
    vent,
    knobDiameter,
  } = dimensions
  const nutZone = Math.min(bodyLength * 0.33, od * 0.77)
  const barrelLength = bodyLength - nutZone
  const postX = bodyLeft + barrelLength
  return (
    <>
      <Brass>
        <jscad.subtract>
          <AxialSolid
            diameter={od * 0.63}
            length={inletLength}
            center={[-l / 2 + inletLength / 2, 0, z]}
            direction="+x"
            segments={6}
          />
          <Bore
            diameter={Math.min(
              od * 0.47,
              threadDiameter(inletPort.thread) * 0.83,
            )}
            depth={inletLength * 0.85}
            port={inletPort}
          />
        </jscad.subtract>
        <jscad.subtract>
          <AxialSolid
            diameter={od}
            length={barrelLength}
            center={[bodyLeft + barrelLength / 2, 0, z]}
            direction="+x"
          />
          <jscad.cuboid
            size={[barrelLength + 0.02, od, od + 0.02]}
            center={[bodyLeft + barrelLength / 2, outletY - od / 2, z]}
          />
          <Bore
            diameter={Math.min(
              od * 0.58,
              threadDiameter(outletPort.thread) * 0.83,
            )}
            depth={od * 0.42}
            port={outletPort}
          />
          {vent && <Bore diameter={od * 0.1} depth={od * 0.18} port={vent} />}
        </jscad.subtract>
        <AxialSolid
          diameter={od * 0.8}
          length={nutZone}
          center={[postX + nutZone / 2, 0, z]}
          direction="+x"
        />
      </Brass>
      <Metallic>
        <AxialSolid
          diameter={od * 0.89}
          length={nutZone * 0.05}
          center={[postX + nutZone * 0.05, 0, z]}
          direction="+x"
        />
      </Metallic>
      <Brass>
        <AxialSolid
          diameter={od * 0.96}
          length={nutZone * 0.18}
          center={[postX + nutZone * 0.28, 0, z]}
          direction="+x"
          segments={6}
        />
        <AxialSolid
          diameter={od}
          length={nutZone * 0.22}
          center={[postX + nutZone * 0.72, 0, z]}
          direction="+x"
          segments={6}
        />
      </Brass>
      <Metallic>
        <AxialSolid
          diameter={knobDiameter * 0.67}
          length={knobLength * 0.48}
          center={[l / 2 - knobLength * 0.76, 0, z]}
          direction="+x"
        />
      </Metallic>
      <Dark>
        <AxialSolid
          diameter={knobDiameter}
          length={knobLength * 0.52}
          center={[l / 2 - knobLength * 0.26, 0, z]}
          direction="+x"
          segments={36}
        />
      </Dark>
    </>
  )
}

function InlineRegulator({
  dimensions,
}: {
  dimensions: Extract<Dimensions, { layout: "inline" }>
}) {
  const {
    l,
    w,
    h,
    knobLength,
    headHeight,
    headTop,
    portZ,
    inletPort,
    outletPort,
    knobDiameter,
    filterBowl,
    gauge,
  } = dimensions
  const bowlHeight = headTop - headHeight
  const dial = Math.min(l, h) * 0.55
  const dialDepth = dial * 0.36
  return (
    <>
      <Metallic>
        <jscad.subtract>
          <jscad.cuboid size={[l, w, headHeight]} center={[0, 0, portZ]} />
          {[inletPort, outletPort].map((port) => (
            <Bore
              key={port.name}
              diameter={Math.min(
                headHeight * 0.72,
                threadDiameter(port.thread) * 0.85,
              )}
              depth={l * 0.24}
              port={port}
            />
          ))}
        </jscad.subtract>
      </Metallic>
      <Dark>
        <AxialSolid
          diameter={knobDiameter}
          length={knobLength}
          center={[0, 0, h - knobLength / 2]}
        />
      </Dark>
      {filterBowl && (
        <>
          <Dark>
            <AxialSolid
              diameter={Math.min(l, w) * 0.74}
              length={bowlHeight * 0.9}
              center={[0, 0, bowlHeight * 0.55]}
            />
          </Dark>
          <Metallic>
            <AxialSolid
              diameter={Math.min(l, w) * 0.21}
              length={bowlHeight * 0.1}
              center={[0, 0, bowlHeight * 0.05]}
            />
          </Metallic>
        </>
      )}
      {gauge && (
        <>
          <Dark>
            <AxialSolid
              diameter={dial}
              length={dialDepth}
              center={[0, -w / 2 - dialDepth / 2, portZ]}
              direction="+y"
            />
          </Dark>
          <Metallic>
            <AxialSolid
              diameter={dial * 0.88}
              length={dialDepth * 0.04}
              center={[0, -w / 2 - dialDepth, portZ]}
              direction="+y"
            />
          </Metallic>
        </>
      )}
    </>
  )
}

/** Ports are fixed to the body. The model rests on Z=0. */
export function AirRegulator({ dimensions }: { dimensions: Dimensions }) {
  return dimensions.layout === "axialradial" ? (
    <AxialRadialRegulator dimensions={dimensions} />
  ) : (
    <InlineRegulator dimensions={dimensions} />
  )
}
