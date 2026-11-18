import { mp, type ModelDefinition } from "@tscircuit/modelprinter"
import type { PneumaticGeometry } from "./geometry"
import { createAirDirectionalValveGeom } from "./models/airdirectionalvalve"
import { createAirDrainValveGeom } from "./models/airdrainvalve"
import { createAirRegulatorGeom } from "./models/airregulator"
import { createAirReliefValveGeom } from "./models/airreliefvalve"
import { createAirTubingGeom } from "./models/airtubing"
import { createDiaphragmPumpGeom } from "./models/diaphragmpump"
import { createPressureGaugeGeom } from "./models/pressuregauge"
import { createPushFittingGeom } from "./models/pushfitting"

export type { Direction, PneumaticGeometry, PneumaticPort } from "./geometry"
export {
  createAirDirectionalValveGeom,
  createAirDrainValveGeom,
  createAirRegulatorGeom,
  createAirReliefValveGeom,
  createAirTubingGeom,
  createDiaphragmPumpGeom,
  createPressureGaugeGeom,
  createPushFittingGeom,
}

export type PneumaticModelDefinition = Extract<
  ModelDefinition,
  {
    fn:
      | "airdirectionalvalve"
      | "airdrainvalve"
      | "airregulator"
      | "airreliefvalve"
      | "airtubing"
      | "diaphragmpump"
      | "pressuregauge"
      | "pushfitting"
  }
>

/** Build colored JSCAD solids and pneumatic port locations from a ModelPrinter string or definition. */
export function createPneumaticModel(
  model: string | PneumaticModelDefinition,
): PneumaticGeometry {
  const definition = typeof model === "string" ? mp.string(model).json() : model
  switch (definition.fn) {
    case "airdirectionalvalve": {
      const { fn, ...props } = definition
      return createAirDirectionalValveGeom(props)
    }
    case "airdrainvalve": {
      const { fn, ...props } = definition
      return createAirDrainValveGeom(props)
    }
    case "airregulator": {
      const { fn, ...props } = definition
      return createAirRegulatorGeom(props)
    }
    case "airreliefvalve": {
      const { fn, ...props } = definition
      return createAirReliefValveGeom(props)
    }
    case "airtubing": {
      const { fn, ...props } = definition
      return createAirTubingGeom(props)
    }
    case "diaphragmpump": {
      const { fn, ...props } = definition
      return createDiaphragmPumpGeom(props)
    }
    case "pressuregauge": {
      const { fn, ...props } = definition
      return createPressureGaugeGeom(props)
    }
    case "pushfitting": {
      const { fn, ...props } = definition
      return createPushFittingGeom(props)
    }
    default:
      throw new Error(`No pneumatic renderer for "${definition.fn}"`)
  }
}
