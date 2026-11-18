import {
  pressureGaugeModelPropsSchema,
  type PressureGaugeModelPropsInput,
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
  type Vec3,
} from "../../geometry"

export function getPressureGaugeDimensions(
  input: PressureGaugeModelPropsInput,
) {
  const p = pressureGaugeModelPropsSchema.parse(input)
  const bottom = p.mount === "bottommount"
  const portCenter: Vec3 = bottom ? [0, -p.caseDepth / 2, 0] : [0, 0, 0]
  const port = {
    ...threaded("pressure", portCenter, "-z", p.portThread, "male"),
    ...(p.innerPortThread ? { innerThread: p.innerPortThread } : {}),
  }
  const studOD = threadDiameter(p.portThread)
  const boreOD = p.innerPortThread
    ? threadDiameter(p.innerPortThread) * 0.85
    : studOD * 0.35
  return { ...p, bottom, port, studOD, boreOD }
}

type Dimensions = ReturnType<typeof getPressureGaugeDimensions>

function GaugeFace({ dimensions }: { dimensions: Dimensions }) {
  const {
    caseDepth,
    stemLength,
    bottom,
    outerDiameter: d,
    reading,
    range,
  } = dimensions
  const bodyBase = bottom ? 0 : stemLength
  const dialZ = bodyBase + caseDepth
  const collar = Math.min(d * 0.035, caseDepth * 0.18)
  const detailZ = dialZ - collar * 0.74
  const readingAngle = ((225 - (270 * reading) / range) * Math.PI) / 180
  return (
    <>
      <Dark>
        <AxialSolid
          diameter={d * 0.98}
          length={caseDepth - collar}
          center={[0, 0, (bodyBase + dialZ - collar) / 2]}
        />
        <jscad.subtract>
          <AxialSolid
            diameter={d}
            length={collar}
            center={[0, 0, dialZ - collar / 2]}
          />
          <Bore
            diameter={d * 0.875}
            depth={collar + 0.02}
            port={{ center: [0, 0, dialZ], direction: "+z" }}
          />
        </jscad.subtract>
      </Dark>
      <jscad.colorize color={[0.96, 0.96, 0.92]}>
        <AxialSolid
          diameter={d * 0.86}
          length={collar * 0.14}
          center={[0, 0, dialZ - collar * 0.87]}
        />
      </jscad.colorize>
      <Dark>
        {Array.from({ length: 21 }, (_, index) => {
          const angle = (Math.PI * (225 - (270 * index) / 20)) / 180
          const length = d * (index % 5 === 0 ? 0.061 : 0.03)
          return (
            <jscad.rotate key={index} angles={[0, 0, angle]}>
              <jscad.cuboid
                size={[length, d * 0.008, collar * 0.06]}
                center={[d * 0.385 - length / 2, 0, detailZ]}
              />
            </jscad.rotate>
          )
        })}
      </Dark>
      <jscad.colorize color={[0.65, 0.12, 0.12]}>
        <jscad.rotate angles={[0, 0, readingAngle]}>
          <jscad.cuboid
            size={[d * 0.35, d * 0.021, collar * 0.075]}
            center={[d * 0.112, 0, detailZ + collar * 0.08]}
          />
        </jscad.rotate>
      </jscad.colorize>
      <Metallic>
        <AxialSolid
          diameter={d * 0.075}
          length={collar * 0.12}
          center={[0, 0, detailZ + collar * 0.12]}
        />
      </Metallic>
    </>
  )
}

/** The dial faces +Z for back mounts and -Y for bottom mounts. */
export function PressureGauge({ dimensions }: { dimensions: Dimensions }) {
  const { bottom, outerDiameter, stemLength, studOD, boreOD, port } = dimensions
  return (
    <>
      {bottom ? (
        <jscad.translate offset={[0, 0, outerDiameter / 2 + stemLength]}>
          <jscad.rotate angles={[Math.PI / 2, 0, 0]}>
            <GaugeFace dimensions={dimensions} />
          </jscad.rotate>
        </jscad.translate>
      ) : (
        <GaugeFace dimensions={dimensions} />
      )}
      <Brass>
        <jscad.subtract>
          <AxialSolid
            diameter={studOD}
            length={stemLength}
            center={[port.center[0], port.center[1], stemLength / 2]}
          />
          <Bore diameter={boreOD} depth={stemLength * 0.95} port={port} />
        </jscad.subtract>
      </Brass>
    </>
  )
}
