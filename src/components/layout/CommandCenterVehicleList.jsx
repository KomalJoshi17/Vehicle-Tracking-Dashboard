import { useEffect, useState } from 'react'
import { BENGALURU_CITY_CONFIG } from '../../app/cityConfig'
import { VEHICLE_STATUS_STYLES } from '../../features/map/vehicleStatusConfig'
import useAlertsStore from '../../store/alertsStore'
import useDashboardUiStore from '../../store/dashboardUiStore'
import useFleetStore from '../../store/fleetStore'

function CommandCenterVehicleList() {
  const selectedVehicleId = useDashboardUiStore((state) => state.selectedVehicleId)
  const requestVehicleFocus = useDashboardUiStore((state) => state.requestVehicleFocus)
  const addAlert = useAlertsStore((state) => state.addAlert)
  const vehicles = useFleetStore((state) => state.vehicles)
  const [operatorMessage, setOperatorMessage] = useState('')

  useEffect(() => {
    if (!operatorMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setOperatorMessage('')
    }, 2600)

    return () => window.clearTimeout(timeoutId)
  }, [operatorMessage])

  const handleCallDriver = (vehicle) => {
    const message = `Calling driver ${vehicle.driverName} (${vehicle.vehicleNumber})`
    setOperatorMessage(message)
    addAlert({
      type: 'manual',
      message,
      vehicleId: vehicle.id,
    })
  }

  return (
    <section
      className="command-center-vehicles rounded-lg border border-slate-700 bg-slate-800/60 p-3"
      role="region"
      aria-labelledby="command-center-title"
    >
      <h2 id="command-center-title" className="text-sm font-semibold tracking-wide text-slate-100">
        {BENGALURU_CITY_CONFIG.name} Fleet
      </h2>
      <p className="mt-1 text-xs text-slate-400">Click a vehicle to focus it on the map.</p>

      {operatorMessage ? (
        <p className="mt-2 rounded-md border border-sky-400/60 bg-sky-900/25 px-2.5 py-1.5 text-xs text-sky-100">
          {operatorMessage}
        </p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {vehicles.map((vehicle) => {
          const statusConfig = VEHICLE_STATUS_STYLES[vehicle.status] ?? VEHICLE_STATUS_STYLES.idle
          const isSelected = selectedVehicleId === vehicle.id

          return (
            <li key={vehicle.id}>
              <div
                className={`rounded-md border px-3 py-2 transition ${
                  isSelected
                    ? 'border-sky-500 bg-sky-950/40 text-sky-100'
                    : 'border-slate-700 bg-slate-900/50 text-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => requestVehicleFocus(vehicle.id, false)}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <p className="text-sm font-medium">{vehicle.label}</p>
                  <p className="text-xs opacity-80">
                    {vehicle.vehicleNumber} · {vehicle.driverName}
                  </p>
                  <p className="mt-1 text-xs opacity-85">{vehicle.phone}</p>
                  <p className="mt-1 text-xs opacity-85">ETA: {vehicle.etaMinutes ?? 0} min</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: statusConfig.color }}
                      aria-hidden="true"
                    />
                    {statusConfig.label}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleCallDriver(vehicle)}
                  className="mt-2 rounded-md border border-slate-600 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-100 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  Call Driver
                </button>
              </div>
            </li>
          )
        })}

        {vehicles.length === 0 ? (
          <li className="rounded-md border border-slate-700/80 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
            Waiting for simulated backend stream...
          </li>
        ) : null}
      </ul>
    </section>
  )
}

export default CommandCenterVehicleList