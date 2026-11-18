import { mp, type ModelDefinition } from "@tscircuit/modelprinter"
import type { PneumaticGeometry } from "./geometry"
import {
  AirDirectionalValve,
  getAirDirectionalValveDimensions,
} from "./models/airdirectionalvalve"
import {
  AirDrainValve,
  getAirDrainValveDimensions,
} from "./models/airdrainvalve"
import { AirRegulator, getAirRegulatorDimensions } from "./models/airregulator"
import {
  AirReliefValve,
  getAirReliefValveDimensions,
} from "./models/airreliefvalve"
import { AirTubing, getAirTubingDimensions } from "./models/airtubing"
import {
  DiaphragmPump,
  getDiaphragmPumpDimensions,
} from "./models/diaphragmpump"
import {
  PressureGauge,
  getPressureGaugeDimensions,
} from "./models/pressuregauge"
import { PushFitting, getPushFittingDimensions } from "./models/pushfitting"

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

/** Select the TSX part and its mating ports from a ModelPrinter string or definition. */
export function createPneumaticModel(
  model: string | PneumaticModelDefinition,
): PneumaticGeometry {
  const definition = typeof model === "string" ? mp.string(model).json() : model
  switch (definition.fn) {
    case "airdirectionalvalve": {
      const { fn, ...props } = definition
      const dimensions = getAirDirectionalValveDimensions(props)
      return {
        geometry: <AirDirectionalValve dimensions={dimensions} />,
        ports: dimensions.ports,
      }
    }
    case "airdrainvalve": {
      const { fn, ...props } = definition
      const dimensions = getAirDrainValveDimensions(props)
      return {
        geometry: <AirDrainValve dimensions={dimensions} />,
        ports: [dimensions.inlet, dimensions.vent],
      }
    }
    case "airregulator": {
      const { fn, ...props } = definition
      const dimensions = getAirRegulatorDimensions(props)
      return {
        geometry: <AirRegulator dimensions={dimensions} />,
        ports: dimensions.ports,
      }
    }
    case "airreliefvalve": {
      const { fn, ...props } = definition
      const dimensions = getAirReliefValveDimensions(props)
      return {
        geometry: <AirReliefValve dimensions={dimensions} />,
        ports: dimensions.ports,
      }
    }
    case "airtubing": {
      const { fn, ...props } = definition
      const dimensions = getAirTubingDimensions(props)
      return { geometry: <AirTubing dimensions={dimensions} />, ports: [] }
    }
    case "diaphragmpump": {
      const { fn, ...props } = definition
      const dimensions = getDiaphragmPumpDimensions(props)
      return {
        geometry: <DiaphragmPump dimensions={dimensions} />,
        ports: dimensions.ports,
      }
    }
    case "pressuregauge": {
      const { fn, ...props } = definition
      const dimensions = getPressureGaugeDimensions(props)
      return {
        geometry: <PressureGauge dimensions={dimensions} />,
        ports: [dimensions.port],
      }
    }
    case "pushfitting": {
      const { fn, ...props } = definition
      const dimensions = getPushFittingDimensions(props)
      return {
        geometry: <PushFitting dimensions={dimensions} />,
        ports: dimensions.ends.map(({ port }) => port),
      }
    }
    default:
      throw new Error(`No pneumatic renderer for "${definition.fn}"`)
  }
}
