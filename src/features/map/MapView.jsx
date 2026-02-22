import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import VehicleMarker from './VehicleMarker'
import MapThemeToggle from './MapThemeToggle'
import MapLegend from './MapLegend'
import usePlaybackStore from '../../store/playbackStore'
import { DEFAULT_MAP_THEME, MAP_ZOOM_LIMITS, TILE_THEMES } from './tileProviders'
import {
  BENGALURU_CITY_CONFIG,
  getCityBounds,
} from '../../app/cityConfig'
import { BENGALURU_OFFICE_CONFIG } from '../../app/officeConfig'
import useDashboardUiStore from '../../store/dashboardUiStore'
import useFleetStore from '../../store/fleetStore'
import { TRIP_HISTORY } from '../../features/trips/mockTripHistory'
import { PLANNED_ROUTES } from '../../features/trips/mockPlannedRoutes'
import { getDistanceMeters } from '../../utils/geofence'
import { findNearestRouteIndex } from '../../utils/routeSnapping'
import { getHeadingDegrees } from '../../utils/heading'
import '../../styles/map.css'

const DEFAULT_MAP_CENTER = BENGALURU_CITY_CONFIG.center
const DEFAULT_MAP_ZOOM = BENGALURU_CITY_CONFIG.defaultZoom
const MARKER_INTERPOLATION_MS = 2600
const PLAYBACK_INTERVAL_MS = 3000
const CITY_BOUNDS = getCityBounds(BENGALURU_CITY_CONFIG)

function MapResizeSync() {
  const map = useMap()

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })

    observer.observe(map.getContainer())

    return () => observer.disconnect()
  }, [map])

  return null
}

function MapSelectionSync({ selectedVehicleId, focusRequestKey, vehicles }) {
  const map = useMap()
  const vehiclesRef = useRef(vehicles)

  useEffect(() => {
    vehiclesRef.current = vehicles
  }, [vehicles])

  useEffect(() => {
    if (!selectedVehicleId) {
      return
    }

    const targetVehicle = vehiclesRef.current.find((vehicle) => vehicle.id === selectedVehicleId)
    if (!targetVehicle) {
      return
    }

    const currentZoom = map.getZoom()
    const focusZoom = Math.max(currentZoom, BENGALURU_CITY_CONFIG.focusZoom)
    map.flyTo(targetVehicle.position, focusZoom, { animate: true, duration: 0.9 })
  }, [focusRequestKey, map, selectedVehicleId])

  return null
}

function MapView({
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_MAP_ZOOM,
  showVehicleStatusPanel = true,
  showTripPlaybackPanel = true,
  topRightControls = null,
}) {
  const [mapTheme, setMapTheme] = useState(DEFAULT_MAP_THEME)
  const [showGeofences, setShowGeofences] = useState(true)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [playbackPosition, setPlaybackPosition] = useState(null)
  const vehicles = useFleetStore((state) => state.vehicles)
  const updateVehicles = useFleetStore((state) => state.updateVehicles)
  const recentlyEnteredVehicleIds = useFleetStore((state) => state.recentlyEnteredVehicleIds)
  const isGeofenceHighlighted = useFleetStore((state) => state.isGeofenceHighlighted)
  const pickupNotification = useFleetStore((state) => state.pickupNotification)
  const pickupPulseVehicleId = useFleetStore((state) => state.pickupPulseVehicleId)
  const selectedVehicleId = useDashboardUiStore((state) => state.selectedVehicleId)
  const mapFocusRequestKey = useDashboardUiStore((state) => state.mapFocusRequestKey)
  const isPlaybackActive = usePlaybackStore((state) => state.isPlaybackActive)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const speedMultiplier = usePlaybackStore((state) => state.speedMultiplier)
  const playbackVehicleId = usePlaybackStore((state) => state.playbackVehicleId)
  const startPlayback = usePlaybackStore((state) => state.startPlayback)
  const stopPlayback = usePlaybackStore((state) => state.stopPlayback)
  const togglePlay = usePlaybackStore((state) => state.togglePlay)
  const setSpeedMultiplier = usePlaybackStore((state) => state.setSpeedMultiplier)
  const setPlaybackVehicleId = usePlaybackStore((state) => state.setPlaybackVehicleId)

  const playbackPath = useMemo(() => {
    if (!playbackVehicleId) {
      return []
    }

    return TRIP_HISTORY[playbackVehicleId] ?? []
  }, [playbackVehicleId])

  useEffect(() => {
    if (!playbackVehicleId && vehicles.length > 0) {
      setPlaybackVehicleId(selectedVehicleId ?? vehicles[0].id)
    }
  }, [playbackVehicleId, selectedVehicleId, setPlaybackVehicleId, vehicles])

  useEffect(() => {
    if (!isPlaybackActive || !playbackVehicleId) {
      setPlaybackPosition(null)
      return
    }

    if (playbackPath.length === 0) {
      setPlaybackPosition(null)
      return
    }

    setPlaybackIndex(0)
    setPlaybackPosition(playbackPath[0])
  }, [isPlaybackActive, playbackPath, playbackVehicleId])

  useEffect(() => {
    if (!isPlaybackActive || !isPlaying || !playbackVehicleId) {
      return
    }

    const intervalId = window.setInterval(() => {
      setPlaybackIndex((currentIndex) => {
        const nextIndex = currentIndex + 1

        if (nextIndex >= playbackPath.length) {
          stopPlayback()
          return currentIndex
        }

        setPlaybackPosition(playbackPath[nextIndex])
        return nextIndex
      })
    }, PLAYBACK_INTERVAL_MS / speedMultiplier)

    return () => window.clearInterval(intervalId)
  }, [isPlaybackActive, isPlaying, playbackPath, speedMultiplier, stopPlayback])

  const playbackHeading = useMemo(() => {
    if (!playbackVehicleId || playbackPath.length === 0) {
      return null
    }

    const currentPoint = playbackPath[playbackIndex] ?? playbackPath[0]
    const previousPoint = playbackPath[Math.max(playbackIndex - 1, 0)] ?? currentPoint
    if (!currentPoint || !previousPoint) {
      return null
    }

    if (
      currentPoint[0] === previousPoint[0] &&
      currentPoint[1] === previousPoint[1]
    ) {
      return null
    }

    return getHeadingDegrees(previousPoint, currentPoint)
  }, [playbackIndex, playbackPath, playbackVehicleId])

  useEffect(() => {
    if (!playbackVehicleId || playbackPath.length === 0) {
      return
    }

    updateVehicles((previousVehicles) =>
      previousVehicles.map((vehicle) => {
        if (vehicle.id !== playbackVehicleId) {
          return vehicle
        }

        const nextHeading = playbackHeading ?? vehicle.heading ?? 0

        return {
          ...vehicle,
          heading: nextHeading,
        }
      }),
    )
  }, [playbackHeading, playbackPath, playbackVehicleId, updateVehicles])

  const activeTheme = TILE_THEMES[mapTheme]

  const selectedRoute = selectedVehicleId ? PLANNED_ROUTES[selectedVehicleId] : null
  const activeVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
  )

  const routeSplitIndex = useMemo(() => {
    if (!selectedRoute || !activeVehicle) {
      return null
    }

    const { route } = selectedRoute
    if (!route || route.length === 0) {
      return null
    }

    if (activeVehicle.isFollowingRoute) {
      return Math.min(activeVehicle.routeIndex ?? 0, route.length - 1)
    }

    return findNearestRouteIndex(activeVehicle.position, route)
  }, [activeVehicle, selectedRoute])

  const snappedSelectedPosition = useMemo(() => {
    if (!activeVehicle || !selectedRoute) {
      return null
    }

    if (activeVehicle.isFollowingRoute) {
      const index = Math.min(activeVehicle.routeIndex ?? 0, selectedRoute.route.length - 1)
      return selectedRoute.route[index]
    }

    const nearestIndex = findNearestRouteIndex(activeVehicle.position, selectedRoute.route)
    return selectedRoute.route[nearestIndex]
  }, [activeVehicle, selectedRoute])

  const handleThemeToggle = useCallback(() => {
    setMapTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }, [])

  const markerNodes = useMemo(
    () =>
      vehicles.map((vehicle) => (
        <VehicleMarker
          key={vehicle.id}
          id={vehicle.id}
          vehicleNumber={vehicle.vehicleNumber}
          driverName={vehicle.driverName}
          speedKmph={vehicle.speedKmph}
          etaMinutes={vehicle.etaMinutes}
          heading={
            isPlaybackActive && playbackVehicleId === vehicle.id && playbackHeading !== null
              ? playbackHeading
              : vehicle.heading ?? 0
          }
          position={
            isPlaybackActive && playbackVehicleId === vehicle.id && playbackPosition
              ? playbackPosition
              : selectedVehicleId === vehicle.id && snappedSelectedPosition
                ? snappedSelectedPosition
                : vehicle.position
          }
          status={vehicle.status}
          isSelected={vehicle.id === selectedVehicleId}
          isRecentlyEntered={recentlyEnteredVehicleIds.includes(vehicle.id)}
          isPickupActive={vehicle.id === pickupPulseVehicleId}
          animationDuration={MARKER_INTERPOLATION_MS}
        />
      )),
    [
      isPlaybackActive,
      playbackHeading,
      playbackPosition,
      playbackVehicleId,
      recentlyEnteredVehicleIds,
      selectedVehicleId,
      vehicles,
    ],
  )

  return (
    <section className="map-view relative h-full max-h-full min-h-[320px] overflow-hidden rounded-lg border border-slate-700 bg-slate-900/70 lg:min-h-0">
      <aside className="pointer-events-none absolute right-4 top-4 z-[980] flex flex-col gap-2">
        <MapThemeToggle theme={mapTheme} onToggle={handleThemeToggle} inStack />
        {topRightControls}
      </aside>
      {showVehicleStatusPanel || showTripPlaybackPanel ? (
        <aside className="absolute bottom-40 left-3 z-[600] w-[min(72vw,17rem)] rounded-md border border-slate-700/80 bg-slate-950/85 p-3 text-xs text-slate-100 shadow-lg backdrop-blur md:bottom-3 md:w-[17rem]">
          {showVehicleStatusPanel ? <MapLegend theme={mapTheme} inline className="w-full" /> : null}

          {showTripPlaybackPanel ? (
            <>
              <div className={`${showVehicleStatusPanel ? 'mt-2 border-t border-slate-700/80 pt-2' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Trip Playback</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      isPlaybackActive && playbackVehicleId
                        ? togglePlay()
                        : playbackVehicleId
                          ? startPlayback(playbackVehicleId)
                          : null
                    }
                    className="rounded-md border border-slate-600 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-100 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    {isPlaybackActive ? (isPlaying ? 'Pause' : 'Play') : 'Play'}
                  </button>
                  <label className="flex items-center gap-2 rounded-md border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-slate-100">
                    Speed
                    <select
                      value={speedMultiplier}
                      onChange={(event) => setSpeedMultiplier(Number(event.target.value))}
                      className="rounded border border-slate-600 bg-slate-950/80 px-1.5 py-0.5 text-xs text-slate-100"
                    >
                      <option value={1}>1x</option>
                      <option value={5}>5x</option>
                      <option value={10}>10x</option>
                    </select>
                  </label>
                </div>
                {playbackPath.length > 0 ? (
                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(playbackPath.length - 1, 0)}
                      value={playbackIndex}
                      onChange={(event) => {
                        const nextIndex = Number(event.target.value)
                        setPlaybackIndex(nextIndex)
                        setPlaybackPosition(playbackPath[nextIndex])
                      }}
                      className="w-full"
                    />
                  </div>
                ) : null}
              </div>

              <label className="mt-2 flex items-center gap-2 border-t border-slate-700/80 pt-2 text-xs text-slate-100">
                <input
                  type="checkbox"
                  checked={showGeofences}
                  onChange={(event) => setShowGeofences(event.target.checked)}
                />
                Show Geofences
              </label>
            </>
          ) : null}
        </aside>
      ) : null}
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={Math.max(MAP_ZOOM_LIMITS.min, BENGALURU_CITY_CONFIG.zoomLimits.min)}
        maxZoom={Math.min(MAP_ZOOM_LIMITS.max, BENGALURU_CITY_CONFIG.zoomLimits.max)}
        maxBounds={CITY_BOUNDS}
        maxBoundsViscosity={0.8}
        scrollWheelZoom={false}
        preferCanvas
        zoomAnimation
        markerZoomAnimation
        zoomSnap={0.1}
        zoomDelta={0.25}
        wheelPxPerZoomLevel={160}
        className={`vehicle-map vehicle-map--${mapTheme} h-full w-full`}
      >
        <MapResizeSync />
        <MapSelectionSync
          selectedVehicleId={selectedVehicleId}
          focusRequestKey={mapFocusRequestKey}
          vehicles={vehicles}
        />
        <TileLayer
          attribution={activeTheme.attribution}
          url={activeTheme.url}
          detectRetina
          minZoom={Math.max(MAP_ZOOM_LIMITS.min, BENGALURU_CITY_CONFIG.zoomLimits.min)}
          maxZoom={Math.min(MAP_ZOOM_LIMITS.max, BENGALURU_CITY_CONFIG.zoomLimits.max)}
        />
        {showGeofences ? (
          <Circle
            center={BENGALURU_OFFICE_CONFIG.coordinates}
            radius={BENGALURU_OFFICE_CONFIG.geofenceRadiusMeters}
            pathOptions={{
              className: `office-geofence ${isGeofenceHighlighted ? 'office-geofence--active' : ''}`,
              color: mapTheme === 'dark' ? '#a855f7' : '#7c3aed',
              weight: 2,
              fillColor: mapTheme === 'dark' ? '#a855f7' : '#8b5cf6',
              fillOpacity: 0.12,
            }}
          />
        ) : null}
        <CircleMarker
          center={BENGALURU_OFFICE_CONFIG.coordinates}
          radius={8}
          pathOptions={{
            className: 'office-marker',
            color: '#f8fafc',
            weight: 2,
            fillColor: '#8b5cf6',
            fillOpacity: 0.95,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} permanent>
            {BENGALURU_OFFICE_CONFIG.name}
          </Tooltip>
        </CircleMarker>
        {selectedRoute ? (
          <>
            <Polyline
              positions={selectedRoute.route}
              pathOptions={{
                color: mapTheme === 'dark' ? '#64748b' : '#94a3b8',
                weight: 4,
              }}
            />
            {routeSplitIndex !== null ? (
              <>
                <Polyline
                  positions={selectedRoute.route.slice(0, routeSplitIndex + 1)}
                  pathOptions={{
                    color: mapTheme === 'dark' ? '#1e293b' : '#334155',
                    weight: 5,
                  }}
                />
                <Polyline
                  positions={selectedRoute.route.slice(routeSplitIndex)}
                  pathOptions={{
                    color: mapTheme === 'dark' ? '#94a3b8' : '#cbd5f5',
                    weight: 4,
                    dashArray: '6 8',
                  }}
                />
              </>
            ) : null}
            {showGeofences
              ? selectedRoute.pickups.map((pickup, index) => (
                  <Circle
                    key={`pickup-${index}`}
                    center={pickup.position}
                    radius={pickup.radiusMeters}
                    pathOptions={{
                      color: mapTheme === 'dark' ? '#fb923c' : '#f97316',
                      weight: 2,
                      fillColor: mapTheme === 'dark' ? '#fb923c' : '#f97316',
                      fillOpacity: 0.12,
                      dashArray: '4 6',
                    }}
                  />
                ))
              : null}
            {selectedRoute.pickups.map((pickup, index) => (
              <CircleMarker
                key={`pickup-marker-${index}`}
                center={pickup.position}
                radius={4}
                pathOptions={{
                  color: mapTheme === 'dark' ? '#e2e8f0' : '#1e293b',
                  weight: 1.5,
                  fillColor: mapTheme === 'dark' ? '#38bdf8' : '#0ea5e9',
                  fillOpacity: 0.9,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  {pickup.name}
                </Tooltip>
              </CircleMarker>
            ))}
          </>
        ) : null}
        {markerNodes}
      </MapContainer>
      {pickupNotification ? (
        <aside className="absolute top-4 left-1/2 z-[700] w-[min(90%,22rem)] -translate-x-1/2 rounded-md border border-sky-400/60 bg-slate-950/85 px-4 py-3 text-sm text-sky-100 shadow-lg backdrop-blur">
          {pickupNotification.message}
        </aside>
      ) : null}
    </section>
  )
}

export default MapView