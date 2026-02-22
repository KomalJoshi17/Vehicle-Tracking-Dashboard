import { create } from 'zustand'

const useFleetStore = create((set) => ({
  vehicles: [],
  recentlyEnteredVehicleIds: [],
  isGeofenceHighlighted: false,
  isConnecting: true,
  connectionAttempt: 0,
  pickupNotification: null,
  pickupPulseVehicleId: null,
  setVehicles: (vehicles) => set((state) => ({ ...state, vehicles })),
  updateVehicles: (updater) =>
    set((state) => ({
      ...state,
      vehicles: typeof updater === 'function' ? updater(state.vehicles) : updater,
    })),
  addRecentGeofenceEntry: (vehicleId) =>
    set((state) => ({
      ...state,
      recentlyEnteredVehicleIds: [...new Set([...state.recentlyEnteredVehicleIds, vehicleId])],
      isGeofenceHighlighted: true,
    })),
  clearRecentGeofenceEntry: (vehicleId) =>
    set((state) => ({
      ...state,
      recentlyEnteredVehicleIds: state.recentlyEnteredVehicleIds.filter((id) => id !== vehicleId),
    })),
  setGeofenceHighlighted: (isHighlighted) =>
    set((state) => ({ ...state, isGeofenceHighlighted: isHighlighted })),
  setPickupNotification: (notification) =>
    set((state) => ({ ...state, pickupNotification: notification })),
  clearPickupNotification: () =>
    set((state) => ({ ...state, pickupNotification: null })),
  setPickupPulseVehicleId: (vehicleId) =>
    set((state) => ({ ...state, pickupPulseVehicleId: vehicleId })),
  setIsConnecting: (isConnecting) =>
    set((state) => ({ ...state, isConnecting })),
  requestReconnect: () =>
    set((state) => ({
      ...state,
      isConnecting: true,
      connectionAttempt: state.connectionAttempt + 1,
    })),
}))

export default useFleetStore