import useFleetStore from '../store/fleetStore'
import { BENGALURU_OFFICE_CONFIG } from '../app/officeConfig'
import { normalizeArrivedVehicle } from '../utils/vehicleNormalization'

describe('Arrived vehicle locking', () => {
  it('snaps arrived vehicles inside geofence and resets outside ones', () => {
    const outsideArrived = {
      id: 'VH-X',
      status: 'arrived',
      position: [12.8, 77.4],
    }
    const insideArrived = {
      id: 'VH-Y',
      status: 'arrived',
      position: BENGALURU_OFFICE_CONFIG.coordinates,
    }

    useFleetStore.setState({ vehicles: [outsideArrived, insideArrived] })

    useFleetStore.getState().updateVehicles((vehicles) =>
      vehicles.map((vehicle) => normalizeArrivedVehicle(vehicle, BENGALURU_OFFICE_CONFIG)),
    )

    const [normalizedOutside, normalizedInside] = useFleetStore.getState().vehicles

    expect(normalizedOutside.status).toBe('in_progress')
    expect(normalizedInside.position).toEqual(BENGALURU_OFFICE_CONFIG.coordinates)
  })
})