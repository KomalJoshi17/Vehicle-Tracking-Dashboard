export const BENGALURU_CITY_CONFIG = {
  name: 'Bengaluru',
  center: [12.9716, 77.5946],
  defaultZoom: 12,
  focusZoom: 14,
  bounds: {
    southWest: [12.734, 77.379],
    northEast: [13.173, 77.836],
  },
  zoomLimits: {
    min: 11,
    max: 17,
  },
}
export const BENGALURU_VEHICLES = [
  {
    id: 'VH-001',
    label: 'Van 001',
    vehicleNumber: 'KA-01-TR-1101',
    driverName: 'Ravi Kumar',
    phone: '+91 98765 11001',
    position: [12.9703, 77.6352],
    status: 'arrived',
    speedKmph: 0,
    etaMinutes: 0,
  },
  {
    id: 'VH-002',
    label: 'Truck 002',
    vehicleNumber: 'KA-03-TR-2202',
    driverName: 'Naveen R',
    phone: '+91 98765 22002',
    position: [12.9588, 77.6461],
    status: 'arrived',
    speedKmph: 0,
    etaMinutes: 0,
  },
  {
    id: 'VH-003',
    label: 'Bike 003',
    vehicleNumber: 'KA-05-BK-3303',
    driverName: 'Farah A',
    phone: '+91 98765 33003',
    position: [12.9279, 77.5835],
    status: 'delayed',
    speedKmph: 24,
    etaMinutes: 22,
  },
  {
    id: 'VH-004',
    label: 'Car 004',
    vehicleNumber: 'KA-02-CR-4404',
    driverName: 'Sanjay M',
    phone: '+91 98765 44004',
    position: [13.0121, 77.6512],
    status: 'delayed',
    speedKmph: 22,
    etaMinutes: 24,
  },
  {
    id: 'VH-005',
    label: 'Van 005',
    vehicleNumber: 'KA-04-TR-5505',
    driverName: 'Neha P',
    phone: '+91 98765 55005',
    position: [12.8926, 77.6112],
    status: 'in_progress',
    speedKmph: 30,
    etaMinutes: 18,
  },
  {
    id: 'VH-006',
    label: 'Truck 006',
    vehicleNumber: 'KA-06-TR-6606',
    driverName: 'Arun V',
    phone: '+91 98765 66006',
    position: [13.0618, 77.5797],
    status: 'in_progress',
    speedKmph: 28,
    etaMinutes: 20,
  },
]

export const getCityBounds = (cityConfig) => [
  cityConfig.bounds.southWest,
  cityConfig.bounds.northEast,
]

export const clampPositionToCityBounds = (position, cityConfig) => {
  const [lat, lng] = position
  const [minLat, minLng] = cityConfig.bounds.southWest
  const [maxLat, maxLng] = cityConfig.bounds.northEast

  const clampedLat = Math.min(Math.max(lat, minLat), maxLat)
  const clampedLng = Math.min(Math.max(lng, minLng), maxLng)

  return [clampedLat, clampedLng]
}