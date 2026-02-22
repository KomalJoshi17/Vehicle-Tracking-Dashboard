import { useEffect, useRef } from 'react'
import { BENGALURU_VEHICLES, clampPositionToCityBounds, BENGALURU_CITY_CONFIG } from '../app/cityConfig'
import { BENGALURU_OFFICE_CONFIG } from '../app/officeConfig'
import useAlertsStore from '../store/alertsStore'
import useFleetStore from '../store/fleetStore'
import usePlaybackStore from '../store/playbackStore'
import { isInsideGeofence } from '../utils/geofence'
import { normalizeArrivedVehicle } from '../utils/vehicleNormalization'
import { findNearestRouteIndex } from '../utils/routeSnapping'
import { getHeadingDegrees } from '../utils/heading'
import useDashboardUiStore from '../store/dashboardUiStore'
import { PLANNED_ROUTES } from '../features/trips/mockPlannedRoutes'

const UPDATE_INTERVAL_MS = 4000
const ENTRY_HIGHLIGHT_MS = 2800
const MOVE_RATIO = 0.05
const ALERT_DEBOUNCE_MS = 5000
const PICKUP_NOTIFICATION_MS = 30000
const PICKUP_PULSE_MS = 2000

const ARRIVAL_DELAY_MS = {
  'VH-003': 12000,
  'VH-004': 18000,
  'VH-005': 24000,
  'VH-006': 32000,
}

const moveTowardOffice = (position) => {
  const [lat, lng] = position
  const [officeLat, officeLng] = BENGALURU_OFFICE_CONFIG.coordinates

  return [lat + (officeLat - lat) * MOVE_RATIO, lng + (officeLng - lng) * MOVE_RATIO]
}

function useMockWebSocket() {
  const setVehicles = useFleetStore((state) => state.setVehicles)
  const updateVehicles = useFleetStore((state) => state.updateVehicles)
  const addRecentGeofenceEntry = useFleetStore((state) => state.addRecentGeofenceEntry)
  const clearRecentGeofenceEntry = useFleetStore((state) => state.clearRecentGeofenceEntry)
  const setGeofenceHighlighted = useFleetStore((state) => state.setGeofenceHighlighted)
  const setIsConnecting = useFleetStore((state) => state.setIsConnecting)
  const connectionAttempt = useFleetStore((state) => state.connectionAttempt)
  const setPickupNotification = useFleetStore((state) => state.setPickupNotification)
  const clearPickupNotification = useFleetStore((state) => state.clearPickupNotification)
  const setPickupPulseVehicleId = useFleetStore((state) => state.setPickupPulseVehicleId)
  const addAlert = useAlertsStore((state) => state.addAlert)
  const isPlaybackActive = usePlaybackStore((state) => state.isPlaybackActive)
  const selectedVehicleId = useDashboardUiStore((state) => state.selectedVehicleId)

  const enteredVehicleIdsRef = useRef(new Set())
  const geofencePulseTimeoutRef = useRef(null)
  const entryClearTimeoutsRef = useRef(new Set())
  const isPlaybackActiveRef = useRef(isPlaybackActive)
  const hasConnectedRef = useRef(false)
  const simulationStartRef = useRef(Date.now())
  const lastAlertAtRef = useRef(0)
  const selectedVehicleIdRef = useRef(selectedVehicleId)
  const previousSelectedIdRef = useRef(selectedVehicleId)
  const pickupTriggeredRef = useRef(new Map())
  const pickupNotificationTimeoutRef = useRef(null)
  const pickupPulseTimeoutRef = useRef(null)

  useEffect(() => {
    isPlaybackActiveRef.current = isPlaybackActive
  }, [isPlaybackActive])

  useEffect(() => {
    selectedVehicleIdRef.current = selectedVehicleId
  }, [selectedVehicleId])

  useEffect(() => {
    const previousSelectedId = previousSelectedIdRef.current

    if (previousSelectedId === selectedVehicleId) {
      return
    }

    updateVehicles((previousVehicles) =>
      previousVehicles.map((vehicle) => {
        if (previousSelectedId && vehicle.id === previousSelectedId && vehicle.status !== 'arrived') {
          return {
            ...vehicle,
            isFollowingRoute: false,
          }
        }

        if (!selectedVehicleId || vehicle.id !== selectedVehicleId) {
          return vehicle
        }

        const routeData = PLANNED_ROUTES[selectedVehicleId]
        const routePoints = routeData?.route ?? []
        if (routePoints.length === 0) {
          return vehicle
        }

        const nearestRouteIndex = findNearestRouteIndex(vehicle.position, routePoints)
        const nextPosition = routePoints[nearestRouteIndex]
        const shouldUpdateHeading =
          nextPosition[0] !== vehicle.position[0] || nextPosition[1] !== vehicle.position[1]

        return {
          ...vehicle,
          isFollowingRoute: true,
          routeIndex: nearestRouteIndex,
          position: nextPosition,
          heading: shouldUpdateHeading
            ? getHeadingDegrees(vehicle.position, nextPosition)
            : vehicle.heading ?? 0,
        }
      }),
    )

    previousSelectedIdRef.current = selectedVehicleId
  }, [selectedVehicleId, updateVehicles])

  useEffect(() => {
    hasConnectedRef.current = false
    setIsConnecting(true)
    simulationStartRef.current = Date.now()

    const seededVehicles = BENGALURU_VEHICLES.map((vehicle) =>
      normalizeArrivedVehicle(
        {
          id: vehicle.id,
          label: vehicle.label,
          vehicleNumber: vehicle.vehicleNumber,
          driverName: vehicle.driverName,
          phone: vehicle.phone,
          speedKmph: vehicle.status === 'arrived' ? 0 : 28 + Math.floor(Math.random() * 18),
          etaMinutes: vehicle.status === 'arrived' ? 0 : 18 + Math.floor(Math.random() * 12),
          position: vehicle.position,
          status: vehicle.status,
          isFollowingRoute: false,
          routeIndex: 0,
          heading: 0,
        },
        BENGALURU_OFFICE_CONFIG,
      ),
    )

    setVehicles(seededVehicles)

    enteredVehicleIdsRef.current = new Set(
      seededVehicles.filter((vehicle) => vehicle.status === 'arrived').map((vehicle) => vehicle.id),
    )

    const intervalId = window.setInterval(() => {
      console.log('[MockWebSocket] tick', new Date().toISOString())

      if (!hasConnectedRef.current) {
        setIsConnecting(false)
        hasConnectedRef.current = true
      }

      if (isPlaybackActiveRef.current) {
        return
      }

      updateVehicles((previousVehicles) =>
        previousVehicles.map((vehicle) => {
          const isInsideOffice = isInsideGeofence(
            vehicle.position,
            BENGALURU_OFFICE_CONFIG.coordinates,
            BENGALURU_OFFICE_CONFIG.geofenceRadiusMeters,
          )

          if (vehicle.status === 'arrived') {
            const normalized = normalizeArrivedVehicle(vehicle, BENGALURU_OFFICE_CONFIG)
            return {
              ...normalized,
              speedKmph: 0,
              etaMinutes: 0,
              heading: vehicle.heading ?? 0,
            }
          }

          const normalizedStatus = vehicle.status

          let nextPosition = vehicle.position
          let nextStatus = normalizedStatus
          let enteredGeofence = false
          let routeIndex = vehicle.routeIndex ?? 0
          let isFollowingRoute = vehicle.isFollowingRoute

          if (vehicle.isFollowingRoute) {
            const routeData = PLANNED_ROUTES[vehicle.id]
            const routePoints = routeData?.route ?? []
            if (routePoints.length > 0) {
              const clampedIndex = Math.min(
                Math.max(routeIndex, 0),
                routePoints.length - 1,
              )
              const nextIndex = Math.min(clampedIndex + 1, routePoints.length - 1)

              nextPosition = routePoints[nextIndex]
              routeIndex = nextIndex

              const reachedEnd = nextIndex >= routePoints.length - 1
              const reachedOffice = isInsideGeofence(
                nextPosition,
                BENGALURU_OFFICE_CONFIG.coordinates,
                BENGALURU_OFFICE_CONFIG.geofenceRadiusMeters,
              )

              enteredGeofence = reachedEnd && reachedOffice
              isFollowingRoute = !reachedEnd && !enteredGeofence
              nextStatus = enteredGeofence ? 'arrived' : normalizedStatus
            } else {
              isFollowingRoute = false
            }
          }

          if (!vehicle.isFollowingRoute) {
            const moved = moveTowardOffice(vehicle.position)
            nextPosition = clampPositionToCityBounds(moved, BENGALURU_CITY_CONFIG)

            const reachedGeofence = isInsideGeofence(
              nextPosition,
              BENGALURU_OFFICE_CONFIG.coordinates,
              BENGALURU_OFFICE_CONFIG.geofenceRadiusMeters,
            )

            const arrivalDelay = ARRIVAL_DELAY_MS[vehicle.id] ?? 15000
            const canArrive = Date.now() - simulationStartRef.current >= arrivalDelay
            enteredGeofence = reachedGeofence && canArrive

            const shouldEscalateAlert =
              normalizedStatus !== 'alert' && normalizedStatus !== 'arrived' && Math.random() > 0.92

            if (enteredGeofence) {
              nextStatus = 'arrived'
            } else if (shouldEscalateAlert) {
              nextStatus = 'alert'
            } else if (vehicle.status === 'alert' && Math.random() > 0.7) {
              nextStatus = 'in_progress'
            }
          }

          const finalPosition = enteredGeofence
            ? BENGALURU_OFFICE_CONFIG.coordinates
            : nextPosition

          const shouldUpdateHeading =
            finalPosition[0] !== vehicle.position[0] || finalPosition[1] !== vehicle.position[1]
          const nextHeading = shouldUpdateHeading
            ? getHeadingDegrees(vehicle.position, finalPosition)
            : vehicle.heading ?? 0

          const nextSpeed = Math.max(
            12,
            Math.min(45, (vehicle.speedKmph ?? 28) + (Math.random() - 0.5) * 4),
          )
          const nextEta = Math.max(2, (vehicle.etaMinutes ?? 18) - 1)

          const canEmitAlert = Date.now() - lastAlertAtRef.current >= ALERT_DEBOUNCE_MS

          if (enteredGeofence && !enteredVehicleIdsRef.current.has(vehicle.id)) {
            enteredVehicleIdsRef.current.add(vehicle.id)
            addRecentGeofenceEntry(vehicle.id)
            if (canEmitAlert) {
              addAlert({
                type: 'geofence',
                vehicleId: vehicle.id,
                message: `${vehicle.vehicleNumber} entered office geofence`,
              })
              lastAlertAtRef.current = Date.now()
            }

            if (geofencePulseTimeoutRef.current) {
              clearTimeout(geofencePulseTimeoutRef.current)
            }

            geofencePulseTimeoutRef.current = window.setTimeout(() => {
              setGeofenceHighlighted(false)
            }, ENTRY_HIGHLIGHT_MS)

            const clearEntryTimeoutId = window.setTimeout(() => {
              clearRecentGeofenceEntry(vehicle.id)
            }, ENTRY_HIGHLIGHT_MS)

            entryClearTimeoutsRef.current.add(clearEntryTimeoutId)
          }

          if (nextStatus === 'alert' && vehicle.status !== 'alert' && canEmitAlert) {
            addAlert({
              type: 'delay',
              vehicleId: vehicle.id,
              message: `${vehicle.vehicleNumber} requires operator attention`,
            })
            lastAlertAtRef.current = Date.now()
          }

          const selectedId = selectedVehicleIdRef.current
          const selectedRoute = selectedId ? PLANNED_ROUTES[selectedId] : null
          if (selectedId && selectedRoute && selectedId === vehicle.id) {
            const pickups = selectedRoute.pickups ?? []
            const triggered = pickupTriggeredRef.current.get(vehicle.id) ?? new Set()

            pickups.forEach((pickup, index) => {
              if (triggered.has(index)) {
                return
              }

              const isAtPickup = isInsideGeofence(
                finalPosition,
                pickup.position,
                pickup.radiusMeters,
              )

              if (isAtPickup) {
                triggered.add(index)
                pickupTriggeredRef.current.set(vehicle.id, triggered)
                setPickupNotification({
                  message: `Cab arrived for ${pickup.name}`,
                  employeeName: pickup.name,
                  vehicleId: vehicle.id,
                })
                setPickupPulseVehicleId(vehicle.id)

                if (pickupPulseTimeoutRef.current) {
                  clearTimeout(pickupPulseTimeoutRef.current)
                }

                pickupPulseTimeoutRef.current = window.setTimeout(() => {
                  setPickupPulseVehicleId(null)
                }, PICKUP_PULSE_MS)

                if (pickupNotificationTimeoutRef.current) {
                  clearTimeout(pickupNotificationTimeoutRef.current)
                }

                pickupNotificationTimeoutRef.current = window.setTimeout(() => {
                  clearPickupNotification()
                }, PICKUP_NOTIFICATION_MS)
              }
            })
          }

          return {
            ...vehicle,
            speedKmph: enteredGeofence ? 0 : Math.round(nextSpeed),
            etaMinutes: enteredGeofence ? 0 : nextEta,
            position: finalPosition,
            status: nextStatus,
            isFollowingRoute,
            routeIndex,
            heading: nextHeading,
          }
        }),
      )
    }, UPDATE_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      if (geofencePulseTimeoutRef.current) {
        clearTimeout(geofencePulseTimeoutRef.current)
      }

      if (pickupNotificationTimeoutRef.current) {
        clearTimeout(pickupNotificationTimeoutRef.current)
      }

      if (pickupPulseTimeoutRef.current) {
        clearTimeout(pickupPulseTimeoutRef.current)
      }

      entryClearTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
      entryClearTimeoutsRef.current.clear()
    }
  }, [
    addAlert,
    addRecentGeofenceEntry,
    clearRecentGeofenceEntry,
    connectionAttempt,
    clearPickupNotification,
    setGeofenceHighlighted,
    setIsConnecting,
    setPickupNotification,
    setPickupPulseVehicleId,
    setVehicles,
    updateVehicles,
  ])
}

export default useMockWebSocket