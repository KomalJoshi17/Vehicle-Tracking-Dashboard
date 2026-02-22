import { BENGALURU_VEHICLES } from '../app/cityConfig'
import { BENGALURU_OFFICE_CONFIG } from '../app/officeConfig'
import { PLANNED_ROUTES } from '../features/trips/mockPlannedRoutes'

describe('PLANNED_ROUTES', () => {
  it('provides a unique route for every vehicle', () => {
    const routeSignatures = new Set()

    BENGALURU_VEHICLES.forEach((vehicle) => {
      const routeData = PLANNED_ROUTES[vehicle.id]

      expect(routeData).toBeDefined()
      expect(Array.isArray(routeData.route)).toBe(true)
      expect(routeData.route.length).toBeGreaterThanOrEqual(6)
      expect(routeData.route.length).toBeLessThanOrEqual(10)

      expect(routeData.route[0]).toEqual(vehicle.position)
      expect(routeData.route[routeData.route.length - 1]).toEqual(BENGALURU_OFFICE_CONFIG.coordinates)

      expect(Array.isArray(routeData.pickups)).toBe(true)
      expect(routeData.pickups.length).toBeGreaterThan(0)
      routeData.pickups.forEach((pickup) => {
        expect(Array.isArray(pickup.position)).toBe(true)
        expect(pickup.radiusMeters).toBeGreaterThan(0)
      })

      const signature = routeData.route.map((point) => point.join(',')).join('|')
      expect(routeSignatures.has(signature)).toBe(false)
      routeSignatures.add(signature)
    })
  })
})
