import { useId, useMemo } from 'react'

interface SparklineProps {
  data: number[]
  color?: string
  fill?: boolean
  height?: number
  width?: number
}

export function Sparkline({ data, color = 'var(--mantine-color-mycelium-5)', fill = true, height = 36, width = 200 }: SparklineProps) {
  const gradId = useId()

  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) return { areaPath: '', linePath: '' }
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 4) - 2
      return [x, y] as [number, number]
    })
    const d = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
    return {
      areaPath: `${d} L${width},${height} L0,${height} Z`,
      linePath: d,
    }
  }, [data, width, height])

  if (data.length < 2) return null

  return (
    <svg
      aria-hidden='true'
      height={height}
      preserveAspectRatio='none'
      style={{ display: 'block', width: '100%' }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1='0'
          x2='0'
          y1='0'
          y2='1'
        >
          <stop
            offset='0%'
            stopColor={color}
            stopOpacity={0.35}
          />
          <stop
            offset='100%'
            stopColor={color}
            stopOpacity={0}
          />
        </linearGradient>
      </defs>
      {fill && (
        <path
          d={areaPath}
          fill={`url(#${gradId})`}
        />
      )}
      <path
        d={linePath}
        fill='none'
        stroke={color}
        strokeWidth={1.6}
      />
    </svg>
  )
}
