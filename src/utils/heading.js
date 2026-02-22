export const getHeadingDegrees = (previousLatLng, nextLatLng) => {
  if (!previousLatLng || !nextLatLng) {
    return 0
  }

  const deltaLat = nextLatLng[0] - previousLatLng[0]
  const deltaLng = nextLatLng[1] - previousLatLng[1]

  if (deltaLat === 0 && deltaLng === 0) {
    return 0
  }

  const radians = Math.atan2(deltaLng, deltaLat)
  const degrees = (radians * 180) / Math.PI

  return (degrees + 360) % 360
}
