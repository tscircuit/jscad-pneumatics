# jscad-pneumatics

Parametric exterior geometry and named connection points for pneumatic CAD
assemblies. [ModelPrinter](https://github.com/tscircuit/modelprinter) owns the
string grammar, unit normalization, and parameter schemas. This library turns
those definitions into JSCAD solids.

## Usage

Use the vanilla entry point from a JSCAD script.

```ts
import { createPneumaticModel } from "jscad-pneumatics/vanilla"

const { solids, ports } = createPneumaticModel(
  "pushfitting_straight_male_tubeod0.25in_thread(10-32)_l22.38mm",
)
```

The same function accepts a parsed ModelPrinter definition. Use
`<PneumaticModel model={model} />` from the main entry point inside
jscad-fiber. Both entry points use the same geometry.

A port reports its center in local millimeters, an outward cardinal direction,
and its connection type. Threaded ports retain the nominal designation and
gender. Tube ports specify tubing OD and barb ports specify hose ID. For an
atmospheric cap such as the round solenoid valve's exhaust, the vent location
represents the center of its exhaust holes. A gauge with a dual-thread stud
reports the outer male designation and optional inner female designation at
the same center.

## Bench geometry

The fixtures in [tests/fixtures/bench-models.ts](tests/fixtures/bench-models.ts)
include the full model strings. The corresponding four-view renders are in [tests/**snapshots**](tests/__snapshots__). The
[pneumatic bench project](https://pneumatic-usbc-bench.seveibar.chatgpt.site/parts.html)
provides the assembly TSX, dimensions, and reference STEP files. The models here
are built from JSCAD primitives. The reference files were used for visual and
dimensional comparison and are not included in the package.

| Model                 | Bench reference                                                                                                          | Geometry represented                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `airdirectionalvalve` | [Clippard EV-3-12 and drawings](https://www.clippard.com/part/EV-3-12)                                                   | Round cap exhaust, inline process ports, radial wire boss, plus a generic block body for multiport valves |
| `airregulator`        | [Clippard MAR-1](https://www.clippard.com/part/MAR-1)                                                                    | Axial inlet, radial outlet, panel nuts, adjustment stem, plus an inline filter-bowl variant               |
| `pressuregauge`       | [Clippard PG-101-BK](https://www.clippard.com/part/PG-101-BK)                                                            | Case, bezel, positioning of the dial needle, and rear stud with an inner connection                       |
| `pushfitting`         | [Straight fitting](https://www.clippard.com/part/PQ-MC08N-PKG), [branch tee](https://www.clippard.com/part/PQ-BT08Q-PKG) | Collets, tube sockets, threaded nose, and the tee's mounting lugs                                         |
| `diaphragmpump`       | [KNF NMP 830](https://knf.com/en/us/solutions/pumps/series/diaphragm-gas-pump-nmp-830)                                   | Horizontal motor, pump head, paired hose barbs, and optional base hole pattern                            |
| `airreliefvalve`      | [Norgren V07 drawing](https://cdn.norgren.com/pdf/en_8_300_500_V07.pdf)                                                  | Cast body, adjustment knob, and optional gauge                                                            |
| `airdrainvalve`       | [Parker brass catalog](https://www.parker.com/Literature/Brass%20Products/3580-Core-Brass.pdf)                           | Body hex, threaded inlet, and wing handle                                                                 |
| `airtubing`           | [Bench tubing](https://www.clippard.com/part/URT1-0805-BLT-050)                                                          | Hollow cross section swept along a straight length or a supplied sampled centerline                       |

These models represent exterior packaging and connection locations. Threads use
simplified envelopes and detailed vendor fit work still calls for the vendor
STEP. The initial contracts come from [ModelPrinter PR #144](https://github.com/tscircuit/modelprinter/pull/144).
The initial package pins the ModelPrinter PR preview.

## Development

```sh
bun install --frozen-lockfile
bun run typecheck
bun run format:check
bun test
bun run build
```

Use `BUN_UPDATE_SNAPSHOTS=1 bun test tests/bench-snapshots.test.ts` after
intentional geometry changes. Inspect the four views before accepting them.
