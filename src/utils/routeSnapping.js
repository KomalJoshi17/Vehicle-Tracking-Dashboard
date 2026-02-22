export const findNearestRouteIndex = (vehicleLatLng, routeLatLngs) => {
  if (!vehicleLatLng || !Array.isArray(routeLatLngs) || routeLatLngs.length === 0) {
    return 0
  }

  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  routeLatLngs.forEach((point, index) => {
    const distance = Math.hypot(vehicleLatLng[0] - point[0], vehicleLatLng[1] - point[1])
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  return closestIndex
}
