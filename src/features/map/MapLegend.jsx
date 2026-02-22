import { STATUS_ORDER, VEHICLE_STATUS_STYLES } from './vehicleStatusConfig'
import styles from './VehicleMarker.module.css'

function MapLegend({ theme, className = '', inline = false }) {
  const legendThemeClass = theme === 'light' ? 'map-legend--light' : 'map-legend--dark'
  const placementClass = inline ? '' : 'pointer-events-none absolute z-[500]'

  return (
    <aside
      className={`map-legend ${legendThemeClass} ${placementClass} rounded-md px-3 py-2 ${className}`}
    >
      <p className="map-legend__title text-[11px] font-semibold uppercase tracking-wider">Vehicle status</p>
      <ul className="map-legend__list mt-2 space-y-1.5 text-xs">
        {STATUS_ORDER.map((status) => {
          const config = VEHICLE_STATUS_STYLES[status]
          return (
            <li key={status} className="flex items-center gap-2">
              <span
                className={`map-legend__swatch ${styles.legendSwatch}`}
                style={{ backgroundColor: config.color }}
                aria-hidden="true"
              />
              <span>{config.label}</span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export default MapLegend