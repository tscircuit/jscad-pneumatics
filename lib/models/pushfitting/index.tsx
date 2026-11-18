import {
  pushFittingModelPropsSchema,
  type PushFittingModelPropsInput,
} from "@tscircuit/modelprinter"
import { jscad } from "tscircuit"
import {
  along,
  AxialSolid,
  Bore,
  Dark,
  Metallic,
  threaded,
  threadDiameter,
  type Direction,
  type PneumaticPort,
  type Vec3,
} from "../../geometry"

type TubePort = Extract<PneumaticPort, { kind: "push" }>
type ThreadPort = Extract<PneumaticPort, { kind: "thread" }>
type End<P extends TubePort | ThreadPort> = { port: P; reach: number }

export function getPushFittingDimensions(input: PushFittingModelPropsInput) {
  const props = pushFittingModelPropsSchema.parse(input)
  const tube = props.tubeOuterDiameter
  const diameter = props.bodyDiameter ?? tube * 2.1
  const length = props.length ?? tube * (props.shape === "straight" ? 3.5 : 6)
  const branchLength = props.branchLength ?? tube * 3.6
  const { thread, threadGender } = props
  const threadOD = thread ? threadDiameter(thread) : 0
  const threadLength =
    props.threadLength ?? Math.min(length / 4, threadOD * 0.65)
  const hexDiameter = props.hexAcrossFlats
    ? props.hexAcrossFlats / Math.cos(Math.PI / 6)
    : diameter
  const noseDiameter =
    threadGender === "female" ? Math.max(diameter, threadOD * 1.3) : threadOD
  const z = Math.max(diameter, hexDiameter, noseDiameter) / 2
  const tee = props.shape === "tee"
  const runReach = tee ? length * 0.36 : length / 2

  function tubeEnd(
    name: string,
    center: Vec3,
    direction: Direction,
    reach: number,
  ): End<TubePort> {
    return {
      port: { name, center, direction, kind: "push", tubeOuterDiameter: tube },
      reach,
    }
  }

  const ends: End<TubePort | ThreadPort>[] = [
    tubeEnd("tube1", [length / 2, 0, z], "+x", runReach),
  ]
  if (props.shape !== "elbow") {
    const center: Vec3 = [-length / 2, 0, z]
    ends.push(
      props.shape === "straight" && thread && threadGender
        ? {
            port: threaded("thread", center, "-x", thread, threadGender),
            reach: runReach,
          }
        : tubeEnd("tube2", center, "-x", runReach),
    )
  }
  if (props.shape !== "straight") {
    const center: Vec3 = [0, branchLength, z]
    ends.push(
      thread && threadGender
        ? {
            port: threaded("thread", center, "+y", thread, threadGender),
            reach: branchLength,
          }
        : tubeEnd(tee ? "tube3" : "tube2", center, "+y", branchLength),
    )
  }
  return {
    tube,
    diameter,
    length,
    thread,
    threadOD,
    threadLength,
    hexDiameter,
    noseDiameter,
    z,
    tee,
    runReach,
    ends,
  }
}

type Dimensions = ReturnType<typeof getPushFittingDimensions>

function TubeEnd({
  port,
  reach,
  dimensions,
}: End<TubePort> & { dimensions: Dimensions }) {
  const { diameter, tube, tee } = dimensions
  const { name, center, direction } = port
  const collar = Math.min(reach * 0.28, tube * 0.55)
  const Material = tee ? Dark : Metallic
  return (
    <>
      <Material>
        <jscad.subtract>
          <AxialSolid
            diameter={diameter}
            length={reach - collar}
            center={along(center, direction, -(reach + collar) / 2)}
            direction={direction}
          />
          <Bore
            diameter={tube * 1.02}
            depth={(reach - collar) * 0.65}
            port={{ center: along(center, direction, -collar), direction }}
          />
        </jscad.subtract>
      </Material>
      <Dark>
        <jscad.subtract>
          <AxialSolid
            diameter={diameter * 0.88}
            length={collar}
            center={along(center, direction, -collar / 2)}
            direction={direction}
          />
          <Bore
            diameter={tube * 1.02}
            depth={collar + 0.1}
            port={port}
            outlineName={`${name}Bore`}
          />
        </jscad.subtract>
      </Dark>
    </>
  )
}

function ThreadEnd({
  port,
  reach,
  dimensions,
}: End<ThreadPort> & { dimensions: Dimensions }) {
  const { center, direction, gender } = port
  const { hexDiameter, noseDiameter, threadLength, threadOD, tube, tee } =
    dimensions
  const tip = Math.min(reach * 0.78, threadLength)
  const boreDiameter =
    gender === "male" ? Math.min(tube * 0.64, threadOD * 0.65) : threadOD * 0.85
  const Material = tee ? Dark : Metallic
  return (
    <>
      <Material>
        <AxialSolid
          diameter={hexDiameter}
          length={reach - tip}
          center={along(center, direction, -(reach + tip) / 2)}
          direction={direction}
          segments={6}
        />
      </Material>
      <Metallic>
        <jscad.subtract>
          <AxialSolid
            diameter={noseDiameter}
            length={tip}
            center={along(center, direction, -tip / 2)}
            direction={direction}
          />
          <Bore diameter={boreDiameter} depth={tip + 0.01} port={port} />
        </jscad.subtract>
      </Metallic>
    </>
  )
}

/** The tube run is on X. Branches point along +Y. The model rests on Z=0. */
export function PushFitting({ dimensions }: { dimensions: Dimensions }) {
  const { diameter, length, z, tee, thread, runReach, ends } = dimensions
  const lugOD = diameter * 0.4
  return (
    <>
      {tee && (
        <Dark>
          <AxialSolid
            diameter={diameter * 0.78}
            length={length - 2 * runReach}
            center={[0, 0, z]}
            direction="+x"
          />
          {thread &&
            [-length * 0.23, length * 0.23].map((x) => (
              <jscad.subtract key={x}>
                <AxialSolid
                  diameter={lugOD}
                  length={diameter * 0.81}
                  center={[x, -diameter * 0.28, z]}
                />
                <Bore
                  diameter={lugOD * 0.57}
                  depth={diameter * 0.82}
                  port={{
                    center: [x, -diameter * 0.28, z + diameter * 0.405],
                    direction: "+z",
                  }}
                />
              </jscad.subtract>
            ))}
        </Dark>
      )}
      {ends.map(({ port, reach }) =>
        port.kind === "push" ? (
          <TubeEnd
            key={port.name}
            port={port}
            reach={reach}
            dimensions={dimensions}
          />
        ) : (
          <ThreadEnd
            key={port.name}
            port={port}
            reach={reach}
            dimensions={dimensions}
          />
        ),
      )}
    </>
  )
}
