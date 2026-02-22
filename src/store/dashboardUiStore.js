import { create } from 'zustand'

const useDashboardUiStore = create((set) => ({
  selectedVehicleId: null,
  mapFocusRequestKey: 0,

  requestVehicleFocus: (vehicleId, force = false) =>
    set((state) =>
      state.selectedVehicleId === vehicleId && !force
        ? state
        : {
            ...state,
            selectedVehicleId: vehicleId,
            mapFocusRequestKey: state.mapFocusRequestKey + 1,
          },
    ),
  setSelectedVehicleId: (vehicleId) =>
    set((state) =>
      state.selectedVehicleId === vehicleId
        ? state
        : {
            ...state,
            selectedVehicleId: vehicleId,
            mapFocusRequestKey: state.mapFocusRequestKey + 1,
          },
    ),
}))

export default useDashboardUiStore