import { memo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import styles from './VehicleMarker.module.css'
import useSmoothMarkerMovement from './useSmoothMarkerMovement'
import { VEHICLE_STATUS_STYLES } from './vehicleStatusConfig'

const getStatusConfig = (status) => {
  return VEHICLE_STATUS_STYLES[status] ?? VEHICLE_STATUS_STYLES.idle
}

function VehicleMarker({
  id,
  position,
  status,
  driverName,
  vehicleNumber,
  speedKmph,
  etaMinutes,
  heading = 0,
  isSelected = false,
  isRecentlyEntered = false,
  isPickupActive = false,
  animationDuration = 1700,
}) {
  const animatedPosition = useSmoothMarkerMovement(position, animationDuration)
  const statusConfig = getStatusConfig(status)
  const markerStyle = `--vehicle-color:${statusConfig.color};--vehicle-glow:${statusConfig.glowColor};--vehicle-heading:${heading}deg;`
  const selectedClass = isSelected ? styles.selected : ''
  const recentEntryClass = isRecentlyEntered ? styles.recentEntry : ''
  const pickupClass = isPickupActive ? styles.pickupPulse : ''

  const icon = divIcon({
    className: styles.pinWrapper,
    html: `<span style="${markerStyle}" class="${styles.pin} ${selectedClass} ${recentEntryClass} ${pickupClass}"></span>`,
    iconSize: isSelected ? [24, 24] : [22, 22],
    iconAnchor: isSelected ? [12, 12] : [11, 11],
  })

  return (
    <Marker position={animatedPosition} icon={icon}>
      <Popup>
        <div className="space-y-1">
          <p>
            {vehicleNumber} ({id})
          </p>
          <p>Driver: {driverName}</p>
          <p>Status: {statusConfig.label}</p>
          <p>Speed: {speedKmph ?? 0} km/h</p>
          <p>ETA: {etaMinutes ?? 0} min</p>
        </div>
      </Popup>
    </Marker>
  )
}

export default memo(VehicleMarker)