import {
  pushFittingModelPropsSchema,
  type PushFittingModelPropsInput,
} from "@tscircuit/modelprinter"
import {
  along,
  axialSolid,
  bore,
  dark,
  metallic,
  threaded,
  threadDiameter,
  type Direction,
  type Solid,
  type PneumaticGeometry,
  type PneumaticPort,
  type Vec3,
} from "../../geometry"

/** The tube run is on X. Branches point along +Y. The model rests on Z=0. */
export function createPushFittingGeom(
  input: PushFittingModelPropsInput,
): PneumaticGeometry {
  const props = pushFittingModelPropsSchema.parse(input)
  const tube = props.tubeOuterDiameter
  const diameter = props.bodyDiameter ?? tube * 2.1
  const length = props.length ?? tube * (props.shape === "straight" ? 3.5 : 6)
  const branchLength = props.branchLength ?? tube * 3.6
  const thread = props.thread
  const threadOD = thread ? threadDiameter(thread) : 0
  const threadLength =
    props.threadLength ?? Math.min(length / 4, threadOD * 0.65)
  const hexDiameter = props.hexAcrossFlats
    ? props.hexAcrossFlats / Math.cos(Math.PI / 6)
    : diameter
  const noseDiameter =
    props.threadGender === "female"
      ? Math.max(diameter, threadOD * 1.3)
      : threadOD
  const z = Math.max(diameter, hexDiameter, noseDiameter) / 2
  const tee = props.shape === "tee"
  const barrelMaterial = tee ? dark : metallic
  const solids: Solid[] = []
  const ports: PneumaticPort[] = []

  function tubeEnd(
    name: string,
    center: Vec3,
    direction: Direction,
    reach: number,
  ) {
    const port = {
      name,
      center,
      direction,
      kind: "push",
      tubeOuterDiameter: tube,
    } as const
    const collar = Math.min(reach * 0.28, tube * 0.55)
    const barrel = axialSolid(
      diameter,
      reach - collar,
      along(center, direction, -(reach + collar) / 2),
      direction,
    )
    const ring = axialSolid(
      diameter * 0.88,
      collar,
      along(center, direction, -collar / 2),
      direction,
      48,
    )
    solids.push(
      barrelMaterial(
        bore(barrel, tube * 1.02, (reach - collar) * 0.65, {
          center: along(center, direction, -collar),
          direction,
        }),
      ),
    )
    solids.push(
      dark(bore(ring, tube * 1.02, collar + 0.1, port, `${name}Bore`)),
    )
    ports.push(port)
  }

  function threadEnd(
    center: Vec3,
    direction: Direction,
    reach: number,
    designation: string,
    gender: "male" | "female",
  ) {
    const port = threaded("thread", center, direction, designation, gender)
    const tip = Math.min(reach * 0.78, threadLength)
    const hex = axialSolid(
      hexDiameter,
      reach - tip,
      along(center, direction, -(reach + tip) / 2),
      direction,
      6,
    )
    const nose = axialSolid(
      noseDiameter,
      tip,
      along(center, direction, -tip / 2),
      direction,
    )
    const boreDiameter =
      gender === "male"
        ? Math.min(tube * 0.64, threadOD * 0.65)
        : threadOD * 0.85
    solids.push(
      barrelMaterial(hex),
      metallic(bore(nose, boreDiameter, tip + 0.01, port)),
    )
    ports.push(port)
  }

  const runReach = tee ? length * 0.36 : length / 2
  if (tee) {
    solids.push(
      dark(axialSolid(diameter * 0.78, length - 2 * runReach, [0, 0, z], "+x")),
    )
    if (thread) {
      for (const x of [-length * 0.23, length * 0.23]) {
        const lugOD = diameter * 0.4
        const lug = axialSolid(
          lugOD,
          diameter * 0.81,
          [x, -diameter * 0.28, z],
          "+z",
        )
        solids.push(
          dark(
            bore(lug, lugOD * 0.57, diameter * 0.82, {
              center: [x, -diameter * 0.28, z + diameter * 0.405],
              direction: "+z",
            }),
          ),
        )
      }
    }
  }
  tubeEnd("tube1", [length / 2, 0, z], "+x", runReach)
  if (props.shape === "straight" || props.shape === "tee") {
    const end: Vec3 = [-length / 2, 0, z]
    if (props.shape === "straight" && thread && props.threadGender) {
      threadEnd(end, "-x", length / 2, thread, props.threadGender)
    } else {
      tubeEnd("tube2", end, "-x", runReach)
    }
  }
  if (props.shape !== "straight") {
    const end: Vec3 = [0, branchLength, z]
    if (thread && props.threadGender)
      threadEnd(end, "+y", branchLength, thread, props.threadGender)
    else
      tubeEnd(
        props.shape === "tee" ? "tube3" : "tube2",
        end,
        "+y",
        branchLength,
      )
  }
  return { solids, ports }
}
