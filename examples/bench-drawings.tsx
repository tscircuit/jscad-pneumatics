import { Fragment } from "react"
import { assembly, jscad } from "tscircuit"
import { PneumaticModel, PneumaticPartDrawing } from "../lib"
import { benchModels } from "./bench-models"

const notes: Partial<Record<keyof typeof benchModels, string>> = {
  solenoid: "P and A use 10-32 female threads. Cap exhaust.",
  "straight-fitting": "1/4 in tube OD. 10-32 male thread.",
  "branch-tee": "1/4 in tube OD on run. 1/4 NPT male branch.",
  regulator: "10-32 female axial inlet and radial outlet.",
  gauge: "1/8 NPT male rear stud with 10-32 female tap.",
  pump: "Two hose barbs for 4 mm hose ID.",
  relief: "1/4 PTF process ports. 1/8 PTF gauge ports.",
  drain: "1/8 NPT male inlet.",
  tubing: "6.35 mm tube OD. 4.064 mm tube ID. Sampled route.",
}

export default function BenchDrawings() {
  return (
    <assembly.device name="PneumaticBenchDrawingCatalog">
      {(Object.keys(benchModels) as (keyof typeof benchModels)[]).map(
        (key, index) => {
          const [title, model] = benchModels[key]
          const note = notes[key]
          const partName = `part-${key}`
          const partRef = `.${partName}`
          return (
            <Fragment key={key}>
              <assembly.printedpart
                name={partName}
                displayName={title}
                jscad={
                  <jscad.translate
                    offset={[
                      (index % 4) * 120,
                      -Math.floor(index / 4) * 120,
                      0,
                    ]}
                  >
                    <PneumaticModel model={model} />
                  </jscad.translate>
                }
              />
              <PneumaticPartDrawing
                name={key}
                partRef={partRef}
                title={title}
                notes={note ? [note] : []}
                frontAnnotations={
                  key === "solenoid" ? (
                    <assembly.drawing.dimension
                      name="port-face-spacing"
                      fromRef={`${partRef} > .inletBore`}
                      toRef={`${partRef} > .workBore`}
                      axis="x"
                    />
                  ) : undefined
                }
                endAnnotations={
                  key === "straight-fitting" ? (
                    <assembly.drawing.dimension
                      name="socket-bore"
                      edgeRef={`${partRef} > .tube1Bore`}
                    />
                  ) : undefined
                }
              />
            </Fragment>
          )
        },
      )}
    </assembly.device>
  )
}
