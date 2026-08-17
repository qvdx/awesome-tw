import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

type QrCodeProps = {
  value: string
  size?: number
}

const QUIET_ZONE = 4

export function QrCode({ value, size = 176 }: QrCodeProps) {
  const modules = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(value)
    qr.make()

    const count = qr.getModuleCount()
    const cells: boolean[][] = []
    for (let row = 0; row < count; row++) {
      const line: boolean[] = []
      for (let col = 0; col < count; col++) {
        line.push(qr.isDark(row, col))
      }
      cells.push(line)
    }
    return cells
  }, [value])

  const count = modules.length
  const viewBoxSize = count + QUIET_ZONE * 2

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      <rect x={0} y={0} width={viewBoxSize} height={viewBoxSize} fill="#050505" />
      {modules.map((line, row) =>
        line.map((isDark, col) =>
          isDark ? (
            <rect
              key={`${row}-${col}`}
              x={col + QUIET_ZONE}
              y={row + QUIET_ZONE}
              width={1}
              height={1}
              fill="#00ffc8"
            />
          ) : null,
        ),
      )}
    </svg>
  )
}
