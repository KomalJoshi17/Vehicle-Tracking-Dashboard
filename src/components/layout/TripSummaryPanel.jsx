import { useMemo, useState } from 'react'
import { BENGALURU_OFFICE_CONFIG } from '../../app/officeConfig'
import { PLANNED_ROUTES } from '../../features/trips/mockPlannedRoutes'
import useDashboardUiStore from '../../store/dashboardUiStore'
import useFleetStore from '../../store/fleetStore'
import { getDistanceMeters, isInsideGeofence } from '../../utils/geofence'

const TIME_FILTERS = [
  { id: '15m', label: 'Last 15 min' },
  { id: '1h', label: 'Last 1 hr' },
  { id: 'today', label: 'Today' },
]

const STATUS_FILTERS = ['all', 'in_progress', 'delayed', 'arrived', 'alert']

const isApproachingPickup = (vehicle, pickupPoints) => {
  if (!pickupPoints || pickupPoints.length === 0) {
    return false
  }

  const closestDistance = pickupPoints.reduce((closest, pickup) => {
    const distance = getDistanceMeters(vehicle.position, pickup.position)
    return Math.min(closest, distance)
  }, Number.POSITIVE_INFINITY)

  return closestDistance <= 350
}

function TripSummaryPanel() {
  const vehicles = useFleetStore((state) => state.vehicles)
  const selectedVehicleId = useDashboardUiStore((state) => state.selectedVehicleId)
  const requestVehicleFocus = useDashboardUiStore((state) => state.requestVehicleFocus)
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('1h')

  const stats = useMemo(() => {
    const activeTrips = vehicles.filter((vehicle) => vehicle.status === 'in_progress').length
    const delayedTrips = vehicles.filter((vehicle) => vehicle.status === 'delayed').length
    const insideOffice = vehicles.filter((vehicle) =>
      isInsideGeofence(
        vehicle.position,
        BENGALURU_OFFICE_CONFIG.coordinates,
        BENGALURU_OFFICE_CONFIG.geofenceRadiusMeters,
      ),
    ).length

    const approachingPickup = vehicles.filter((vehicle) => {
      const routeData = PLANNED_ROUTES[vehicle.id]
      return routeData ? isApproachingPickup(vehicle, routeData.pickups) : false
    }).length

    return { activeTrips, delayedTrips, insideOffice, approachingPickup }
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    const timeFiltered = vehicles.filter((vehicle, index) => {
      if (timeFilter === '15m') {
        return index % 2 === 0
      }
      if (timeFilter === '1h') {
        return true
      }
      return index % 3 !== 0
    })

    if (statusFilter === 'all') {
      return timeFiltered
    }

    return timeFiltered.filter((vehicle) => vehicle.status === statusFilter)
  }, [statusFilter, timeFilter, vehicles])

  const selectedTrip = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
  )

  return (
    <section className="trip-summary-panel rounded-lg border border-slate-700 bg-slate-800/60 p-4">
      <h2 className="text-sm font-semibold tracking-wide text-slate-100">Trip Summary</h2>
      <p className="mt-1 text-xs text-slate-400">High-level stats for active operations.</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-200">
        <div className="rounded-md border border-slate-700 bg-slate-900/40 p-2">
          <p className="text-slate-400">Active</p>
          <p className="text-lg font-semibold text-slate-100">{stats.activeTrips}</p>
        </div>
        <div className="rounded-md border border-slate-700 bg-slate-900/40 p-2">
          <p className="text-slate-400">Delayed</p>
          <p className="text-lg font-semibold text-amber-200">{stats.delayedTrips}</p>
        </div>
        <div className="rounded-md border border-slate-700 bg-slate-900/40 p-2">
          <p className="text-slate-400">Inside Office</p>
          <p className="text-lg font-semibold text-violet-200">{stats.insideOffice}</p>
        </div>
        <div className="rounded-md border border-slate-700 bg-slate-900/40 p-2">
          <p className="text-slate-400">Approaching Pickup</p>
          <p className="text-lg font-semibold text-sky-200">{stats.approachingPickup}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-100"
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              Status: {status.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={timeFilter}
          onChange={(event) => setTimeFilter(event.target.value)}
          className="rounded-md border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-100"
        >
          {TIME_FILTERS.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="mt-4 space-y-2">
        {filteredVehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id
          return (
            <li key={vehicle.id}>
              <button
                type="button"
                onClick={() => requestVehicleFocus(vehicle.id, true)}
                className={`w-full rounded-md border px-3 py-2 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-950/40 text-sky-100'
                    : 'border-slate-700 bg-slate-900/40 text-slate-200'
                }`}
              >
                <p className="text-sm font-semibold">{vehicle.label}</p>
                <p className="mt-1 text-xs opacity-80">
                  {vehicle.vehicleNumber} · {vehicle.driverName}
                </p>
                <p className="mt-1 text-xs opacity-80">Trip: {vehicle.id} · ETA {vehicle.etaMinutes ?? 0} min</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide opacity-70">{vehicle.status}</p>
              </button>
            </li>
          )
        })}

        {filteredVehicles.length === 0 ? (
          <li className="rounded-md border border-slate-700/80 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
            No trips match the current filters.
          </li>
        ) : null}
      </ul>

      {selectedTrip ? (
        <div className="mt-4 rounded-md border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Selected Trip</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{selectedTrip.label}</p>
          <p className="mt-1">Driver: {selectedTrip.driverName}</p>
          <p className="mt-1">Vehicle: {selectedTrip.vehicleNumber}</p>
          <p className="mt-1">ETA: {selectedTrip.etaMinutes ?? 0} min</p>
          <p className="mt-1 uppercase tracking-wide text-slate-300">{selectedTrip.status}</p>
        </div>
      ) : null}
    </section>
  )
}

export default TripSummaryPanel