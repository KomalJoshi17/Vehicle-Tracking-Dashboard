import { create } from 'zustand'

const usePlaybackStore = create((set) => ({
  isPlaybackActive: false,
  isPlaying: false,
  speedMultiplier: 1,
  playbackVehicleId: null,
  startPlayback: (vehicleId) =>
    set((state) => ({
      ...state,
      isPlaybackActive: true,
      isPlaying: true,
      playbackVehicleId: vehicleId,
    })),
  stopPlayback: () =>
    set((state) => ({
      ...state,
      isPlaybackActive: false,
      isPlaying: false,
    })),
  togglePlay: () =>
    set((state) => ({
      ...state,
      isPlaying: !state.isPlaying,
    })),
  setSpeedMultiplier: (speedMultiplier) =>
    set((state) => ({
      ...state,
      speedMultiplier,
    })),
  setPlaybackVehicleId: (vehicleId) =>
    set((state) => ({
      ...state,
      playbackVehicleId: vehicleId,
    })),
}))

export default usePlaybackStore