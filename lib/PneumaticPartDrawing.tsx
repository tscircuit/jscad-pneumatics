import type { ReactNode } from "react"
import { assembly } from "tscircuit"

export interface PneumaticPartDrawingProps {
  name: string
  title: string
  partRef: string
  notes?: readonly string[]
  frontAnnotations?: ReactNode
  endAnnotations?: ReactNode
}

/** An A4 component sheet with physical dimensions resolved from its CAD model. */
export function PneumaticPartDrawing({
  name,
  title,
  partRef,
  notes = [],
  frontAnnotations,
  endAnnotations,
}: PneumaticPartDrawingProps) {
  return (
    <assembly.drawing.page name={name} size="iso_a4">
      <assembly.drawing.titleblock
        title={title}
        sheetNumber={1}
        numberOfSheets={1}
      />
      <assembly.drawing.partview
        name="plan"
        displayName="TOP"
        partRef={partRef}
        direction="z+"
        centerX={-72}
        centerY={55}
        width={128}
        height={56}
      >
        <assembly.drawing.dimension name="overall-depth" heightOfView />
      </assembly.drawing.partview>
      <assembly.drawing.partview
        name="isometric"
        displayName="ISOMETRIC"
        partRef={partRef}
        direction="isometric"
        centerX={72}
        centerY={55}
        width={128}
        height={56}
      />
      <assembly.drawing.partview
        name="front"
        displayName="FRONT"
        partRef={partRef}
        direction="y-"
        centerX={-72}
        centerY={-20}
        width={128}
        height={56}
      >
        <assembly.drawing.dimension name="overall-length" widthOfView />
        <assembly.drawing.dimension name="overall-height" heightOfView />
        {frontAnnotations}
      </assembly.drawing.partview>
      <assembly.drawing.partview
        name="end"
        displayName="RIGHT END"
        partRef={partRef}
        direction="x+"
        centerX={72}
        centerY={-20}
        width={128}
        height={56}
      >
        {endAnnotations}
      </assembly.drawing.partview>
      {notes.map((text, index) => (
        <assembly.drawing.note
          key={text}
          text={text}
          paperX={-136}
          paperY={-70 - 5 * index}
          fontSize={2.7}
        />
      ))}
    </assembly.drawing.page>
  )
}
