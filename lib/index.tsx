import { Fragment, type ComponentProps } from "react"
import { assembly } from "tscircuit"
import { createPneumaticModel, type PneumaticModelDefinition } from "./models"

export { createPneumaticModel }
export type { Direction, PneumaticGeometry, PneumaticPort } from "./geometry"
export type { PneumaticModelDefinition } from "./models"
export {
  PneumaticPartDrawing,
  type PneumaticPartDrawingProps,
} from "./PneumaticPartDrawing"

type ModelProp = { model: string | PneumaticModelDefinition }

export type PneumaticPartProps = Omit<
  ComponentProps<typeof assembly.printedpart>,
  "jscad" | "model" | "modelUrl" | "cadModel"
> &
  ModelProp

/** Parametric solid TSX for use inside a tscircuit CAD element. */
export function PneumaticModel({ model }: ModelProp) {
  const { solids } = createPneumaticModel(model)
  return (
    <>
      {solids.map((solid, index) => (
        <Fragment key={index}>{solid}</Fragment>
      ))}
    </>
  )
}

/** Add a pneumatic part to a tscircuit assembly. */
export function PneumaticPart({ model, ...partProps }: PneumaticPartProps) {
  return (
    <assembly.printedpart
      {...partProps}
      jscad={<PneumaticModel model={model} />}
    />
  )
}
