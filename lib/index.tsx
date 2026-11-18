import { Colorize, Custom } from "jscad-fiber/model"
import { createPneumaticModel, type PneumaticModelDefinition } from "./vanilla"

export * from "./vanilla"

/** Render a ModelPrinter pneumatic model in jscad-fiber. */
export function PneumaticModel({
  model,
}: {
  model: string | PneumaticModelDefinition
}) {
  const { solids } = createPneumaticModel(model)
  return (
    <>
      {solids.map((solid, index) => {
        const [r, g, b] = solid.color ?? [0.61, 0.64, 0.69]
        return (
          <Colorize key={index} color={[r, g, b]}>
            <Custom geometry={solid} />
          </Colorize>
        )
      })}
    </>
  )
}
