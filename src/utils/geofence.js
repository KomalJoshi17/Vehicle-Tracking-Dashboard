const EARTH_RADIUS_METERS = 6371000

const toRadians = (degrees) => (degrees * Math.PI) / 180

export const getDistanceMeters = (fromPosition, toPosition) => {
  const [fromLat, fromLng] = fromPosition
  const [toLat, toLng] = toPosition

  const deltaLat = toRadians(toLat - fromLat)
  const deltaLng = toRadians(toLng - fromLng)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(deltaLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

export const isInsideGeofence = (position, center, radiusMeters) => {
  return getDistanceMeters(position, center) <= radiusMeters
}