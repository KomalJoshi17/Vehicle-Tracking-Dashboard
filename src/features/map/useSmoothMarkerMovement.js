import { useEffect, useRef, useState } from 'react'

const lerp = (start, end, amount) => start + (end - start) * amount
const easeOutCubic = (t) => 1 - (1 - t) ** 3

function useSmoothMarkerMovement(targetPosition, durationMs = 1600) {
  const [animatedPosition, setAnimatedPosition] = useState(targetPosition)
  const frameRef = useRef(null)
  const startTimeRef = useRef(0)
  const startPositionRef = useRef(targetPosition)

  useEffect(() => {
    if (!targetPosition) {
      return
    }

    startTimeRef.current = performance.now()
    startPositionRef.current = animatedPosition

    const animate = (timestamp) => {
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOutCubic(progress)

      const nextLat = lerp(startPositionRef.current[0], targetPosition[0], easedProgress)
      const nextLng = lerp(startPositionRef.current[1], targetPosition[1], easedProgress)

      setAnimatedPosition([nextLat, nextLng])

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [targetPosition, durationMs])

  return animatedPosition
}

export default useSmoothMarkerMovement