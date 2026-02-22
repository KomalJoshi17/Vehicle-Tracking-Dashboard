import { create } from 'zustand'

let alertSequence = 1

const makeAlert = ({ type, message, vehicleId }) => ({
  id: `ALERT-${alertSequence++}`,
  type,
  message,
  vehicleId,
  timestamp: Date.now(),
  read: false,
  acknowledged: false,
})

const useAlertsStore = create((set) => ({
  alerts: [],
  handledAlerts: [],
  addAlert: (payload) =>
    set((state) => ({
      ...state,
      alerts: [makeAlert(payload), ...state.alerts].slice(0, 60),
    })),
  markAlertAsRead: (alertId) =>
    set((state) => ({
      ...state,
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert,
      ),
    })),
  acknowledgeAlert: (alertId) =>
    set((state) => {
      const targetAlert = state.alerts.find((alert) => alert.id === alertId)
      if (!targetAlert) {
        return state
      }

      return {
        ...state,
        alerts: state.alerts.filter((alert) => alert.id !== alertId),
        handledAlerts: [
          {
            ...targetAlert,
            read: true,
            acknowledged: true,
            handledAt: Date.now(),
          },
          ...state.handledAlerts,
        ].slice(0, 200),
      }
    }),
  dismissAlert: (alertId) =>
    set((state) => ({
      ...state,
      alerts: state.alerts.filter((alert) => alert.id !== alertId),
    })),
  markAllAlertsAsRead: () =>
    set((state) => ({
      ...state,
      alerts: state.alerts.map((alert) => ({ ...alert, read: true })),
    })),
}))

export default useAlertsStore