import { isInsideGeofence } from './geofence'

export const normalizeArrivedVehicle = (vehicle, officeConfig) => {
  if (vehicle.status !== 'arrived') {
    return { ...vehicle }
  }

  const isInsideOffice = isInsideGeofence(
    vehicle.position,
    officeConfig.coordinates,
    officeConfig.geofenceRadiusMeters,
  )

  if (!isInsideOffice) {
    return {
      ...vehicle,
      speedKmph: 0,
      etaMinutes: 0,
      status: 'in_progress',
    }
  }

  return {
    ...vehicle,
    position: officeConfig.coordinates,
    speedKmph: 0,
    etaMinutes: 0,
  }
}