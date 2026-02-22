import { useMemo, useState } from 'react'
import useAlertsStore from '../../store/alertsStore'
import useDashboardUiStore from '../../store/dashboardUiStore'
import useFleetStore from '../../store/fleetStore'

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RealTimeAlertFeed() {
  const alerts = useAlertsStore((state) => state.alerts)
  const markAlertAsRead = useAlertsStore((state) => state.markAlertAsRead)
  const acknowledgeAlert = useAlertsStore((state) => state.acknowledgeAlert)
  const dismissAlert = useAlertsStore((state) => state.dismissAlert)
  const unreadCount = alerts.filter((alert) => !alert.read).length
  const requestVehicleFocus = useDashboardUiStore((state) => state.requestVehicleFocus)
  const vehicles = useFleetStore((state) => state.vehicles)
  const [operatorMessage, setOperatorMessage] = useState('')

  const vehiclesById = useMemo(
    () => Object.fromEntries(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles],
  )

  const handleAlertClick = (alert) => {
    markAlertAsRead(alert.id)
    if (alert.vehicleId) {
      requestVehicleFocus(alert.vehicleId, true)
    }
  }

  const handleCallDriver = (alert) => {
    const vehicle = vehiclesById[alert.vehicleId]
    if (!vehicle) {
      return
    }

    const message = `Calling driver ${vehicle.driverName} (${vehicle.vehicleNumber})`
    setOperatorMessage(message)
    window.setTimeout(() => setOperatorMessage(''), 2500)
  }

  return (
    <section
      className="real-time-alert-feed rounded-lg border border-slate-700 bg-slate-900/90 p-4 shadow-2xl backdrop-blur"
      role="region"
      aria-labelledby="alert-feed-title"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="alert-feed-title" className="text-base font-semibold text-slate-100">
          Live Alerts
        </h2>
        <span className="rounded-full bg-rose-600/85 px-2.5 py-1 text-xs font-semibold text-rose-100">
          {unreadCount} unread
        </span>
      </div>

      {operatorMessage ? (
        <p className="mt-3 rounded-md border border-sky-400/60 bg-sky-950/40 px-3 py-2 text-sm text-sky-100">
          {operatorMessage}
        </p>
      ) : null}

      <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <li className="rounded-md border border-slate-700/80 bg-slate-900/40 px-3 py-3 text-sm text-slate-400">
            No alerts yet
          </li>
        ) : (
          alerts.map((alert) => (
            <li key={alert.id}>
              <div
                className={`rounded-md border px-3 py-3 transition ${
                  alert.read
                    ? 'border-slate-700/80 bg-slate-900/35 text-slate-300'
                    : 'border-rose-500/70 bg-rose-950/25 text-rose-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleAlertClick(alert)}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <p className="text-xs font-medium uppercase tracking-wide opacity-90">{alert.type}</p>
                  <p className="mt-1 text-base leading-6">{alert.message}</p>
                  <p className="mt-2 text-xs opacity-75">{formatTime(alert.timestamp)}</p>
                </button>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCallDriver(alert)}
                    aria-label={`Call driver for ${alert.vehicleId ?? 'vehicle'}`}
                    className="rounded-md border border-slate-600 bg-slate-800/75 px-2.5 py-1 text-xs font-medium text-slate-100 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    Call Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => acknowledgeAlert(alert.id)}
                    aria-label={`Acknowledge alert ${alert.id}`}
                    className="rounded-md border border-emerald-600/60 bg-emerald-900/35 px-2.5 py-1 text-xs font-medium text-emerald-100 transition hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    aria-label={`Dismiss alert ${alert.id}`}
                    className="rounded-md border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

export default RealTimeAlertFeed