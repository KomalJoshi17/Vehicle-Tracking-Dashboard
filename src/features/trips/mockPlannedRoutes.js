import { BENGALURU_VEHICLES } from '../../app/cityConfig'
import { BENGALURU_OFFICE_CONFIG } from '../../app/officeConfig'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const buildSeed = (vehicleId) =>
  Array.from(vehicleId).reduce((acc, char) => acc + char.charCodeAt(0), 0)

const buildVehicleRoute = (vehicle, vehicleIndex) => {
  const [startLat, startLng] = vehicle.position
  const [officeLat, officeLng] = BENGALURU_OFFICE_CONFIG.coordinates
  const seed = buildSeed(vehicle.id) + vehicleIndex * 31
  const pointCount = 6 + (seed % 5)
  const route = []

  for (let index = 0; index < pointCount; index += 1) {
    const progress = index / (pointCount - 1)
    const wobbleFactor = (1 - progress) * 0.006
    const latWave = Math.sin(seed * 0.11 + index * 0.8) * wobbleFactor
    const lngWave = Math.cos(seed * 0.09 + index * 0.7) * wobbleFactor

    const lat = startLat + (officeLat - startLat) * progress + latWave
    const lng = startLng + (officeLng - startLng) * progress + lngWave

    route.push([clamp(lat, 12.734, 13.173), clamp(lng, 77.379, 77.836)])
  }

  route[0] = [startLat, startLng]
  route[route.length - 1] = [officeLat, officeLng]

  const pickupSteps = [
    Math.max(1, Math.floor((pointCount - 1) * 0.3)),
    Math.max(2, Math.floor((pointCount - 1) * 0.55)),
    Math.max(3, Math.floor((pointCount - 1) * 0.8)),
  ]

  const pickups = Array.from(new Set(pickupSteps))
    .filter((step) => step > 0 && step < route.length - 1)
    .map((step, pickupIndex) => ({
      name: `${vehicle.driverName} Pickup ${pickupIndex + 1}`,
      position: route[step],
      radiusMeters: 180,
    }))

  return {
    route,
    pickups,
  }
}

export const PLANNED_ROUTES = Object.fromEntries(
  BENGALURU_VEHICLES.map((vehicle, vehicleIndex) => [
    vehicle.id,
    buildVehicleRoute(vehicle, vehicleIndex),
  ]),
)