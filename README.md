# tsx-pneumatics

Parametric pneumatic parts and dimensioned engineering drawings authored in
tscircuit TSX. [ModelPrinter](https://github.com/tscircuit/modelprinter) owns the
model strings and units. tscircuit compiles the solid JSX and
`assembly.drawing` elements into Circuit JSON, and
[circuit-json-to-drawing](https://github.com/tscircuit/circuit-json-to-drawing)
generates SVG sheets.

## Author a part and its drawing

```tsx
import { assembly } from "tscircuit"
import { PneumaticPart, PneumaticPartDrawing } from "tsx-pneumatics"

export default function FittingSheet() {
  return (
    <assembly.device>
      <PneumaticPart
        name="adapter"
        model="pushfitting_straight_male_tubeod0.25in_thread(10-32)_l22.38mm"
      />
      <PneumaticPartDrawing
        name="adapter-sheet"
        title="Straight push fitting"
        partRef=".adapter"
        notes={["1/4 in tube OD. 10-32 male thread."]}
        endAnnotations={
          <assembly.drawing.dimension edgeRef=".adapter > .tube1Bore" />
        }
      />
    </assembly.device>
  )
}
```

`PneumaticPartDrawing` supplies top, front, right-end, and isometric views.
Core measures the three overall dimensions from the generated solid. Add
`assembly.drawing.dimension` children for named CAD outlines or feature
spacing. The
[bench catalog](examples/bench-drawings.tsx) measures the fitting socket
and the distance between the solenoid's two named port faces.

`PneumaticModel` exposes the same solid JSX for direct use in
`assembly.printedpart`, including with transforms. It uses the primitives
exported by `tscircuit` under `jscad`. Part components declare their primitives,
transforms, and booleans as JSX. Material components such as `<Metallic>` wrap
the shapes they color.
`createPneumaticModel` returns the part's JSX in `geometry` and its mating
ports in `ports`. Port centers are in local millimeters and include an
outward direction and nominal connection designation.

## Bench references

The [bench parts catalog](https://pneumatic-usbc-bench.seveibar.chatgpt.site/parts.html)
provides the source TSX and vendor CAD used to compare exteriors and port locations.
View [all model strings and variants](examples/bench-models.ts).

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

These models support assembly layout. Thread profiles and fine housing details
are simplified, and routed tubing uses hulls along sampled centerlines.
The initial model contract dependency is pinned to the
[ModelPrinter #144 package preview](https://github.com/tscircuit/modelprinter/pull/144).

## Build

```sh
bun install --frozen-lockfile
bun run typecheck
bun run format:check
bun test
bun run build
bun run drawings
```

`bun run drawings` writes 12 SVG sheets and the Circuit JSON to
`dist/drawings/`. Pass a directory after `drawings` to choose another
destination. The exporter uses Circuit JSON Drawing 0.0.7 so authored notes
appear alongside the dimensions. It caches the resolved geometry for each part
across views. CI attaches the generated files to each successful run.

## Drawing snapshots

`bun test` renders the TSX drawing catalog through the same exporter as
`bun run drawings` and compares all 12 sheets visually against the checked-in
SVGs in [tests/**snapshots**](tests/__snapshots__). Review the rendered sheets
before updating the baselines.

```sh
bun test --update-snapshots tests/bench-drawing-snapshots.test.tsx
```
