import { useEffect, useRef, useState } from 'react'
import CommandCenterVehicleList from './CommandCenterVehicleList'
import RealTimeAlertFeed from './RealTimeAlertFeed'
import TripSummaryPanel from './TripSummaryPanel'
import MapView from '../../features/map/MapView'
import useMockWebSocket from '../../hooks/useMockWebSocket'
import useFleetStore from '../../store/fleetStore'

function MainLayout() {
  const [isSidebarCollapsed] = useState(false)
  const [isMapPanelsMenuOpen, setIsMapPanelsMenuOpen] = useState(false)
  const [mapPanelsVisibility, setMapPanelsVisibility] = useState({
    vehicleStatus: true,
    tripPlayback: true,
    liveAlerts: true,
  })
  const isConnecting = useFleetStore((state) => state.isConnecting)
  const requestReconnect = useFleetStore((state) => state.requestReconnect)
  const mapPanelsMenuRef = useRef(null)
  useMockWebSocket()

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!isMapPanelsMenuOpen) {
        return
      }

      if (mapPanelsMenuRef.current?.contains(event.target)) {
        return
      }

      setIsMapPanelsMenuOpen(false)
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [isMapPanelsMenuOpen])

  const toggleMapPanel = (key) => {
    setMapPanelsVisibility((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  return (
    <div className="main-layout flex h-screen w-full flex-col overflow-x-hidden bg-slate-950">
      <header className="dashboard-header border-b border-slate-800 bg-slate-900/70 px-6 py-3 backdrop-blur">
        {isConnecting ? (
          <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
            <span>Connecting to live feed...</span>
            <button
              type="button"
              onClick={requestReconnect}
              className="rounded-md border border-slate-600 bg-slate-800/80 px-2 py-1 text-xs font-medium text-slate-100 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Retry
            </button>
          </div>
        ) : null}
      </header>

      <div className="dashboard-workspace flex min-h-0 min-w-0 flex-1 flex-col lg:h-[calc(100vh-4.5rem)] lg:flex-row">
        <aside
          className={`command-center-sidebar min-h-0 overflow-y-auto border-b border-r border-slate-800 bg-slate-900/60 p-4 lg:border-b-0 ${
            isSidebarCollapsed
              ? 'lg:w-20 lg:min-w-20 lg:max-w-20 lg:flex-none'
              : 'lg:w-[22rem] lg:min-w-[22rem] lg:max-w-[22rem] lg:flex-none'
          }`}
        >
          <div className="space-y-4">
            <CommandCenterVehicleList />
            <TripSummaryPanel />
          </div>
        </aside>
        <main className="map-workspace relative min-h-0 min-w-0 flex-1 p-3 lg:p-4">
          <MapView
            showVehicleStatusPanel={mapPanelsVisibility.vehicleStatus}
            showTripPlaybackPanel={mapPanelsVisibility.tripPlayback}
            topRightControls={
              <div ref={mapPanelsMenuRef} className="pointer-events-auto relative">
                <button
                  type="button"
                  onClick={() => setIsMapPanelsMenuOpen((open) => !open)}
                  className="rounded-md border border-slate-600 bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm backdrop-blur transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-haspopup="menu"
                  aria-expanded={isMapPanelsMenuOpen}
                >
                  Map Panels
                </button>

                <div
                  className={`absolute right-0 mt-2 w-44 origin-top-right rounded-md border border-slate-700/90 bg-slate-950/90 p-2 shadow-xl backdrop-blur transition-all duration-150 ${
                    isMapPanelsMenuOpen
                      ? 'translate-y-0 scale-100 opacity-100'
                      : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
                  }`}
                  role="menu"
                  aria-label="Toggle map panels"
                >
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800/70">
                    <input
                      type="checkbox"
                      checked={mapPanelsVisibility.vehicleStatus}
                      onChange={() => toggleMapPanel('vehicleStatus')}
                    />
                    Vehicle Status
                  </label>
                  <label className="mt-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800/70">
                    <input
                      type="checkbox"
                      checked={mapPanelsVisibility.tripPlayback}
                      onChange={() => toggleMapPanel('tripPlayback')}
                    />
                    Trip Playback
                  </label>
                  <label className="mt-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800/70">
                    <input
                      type="checkbox"
                      checked={mapPanelsVisibility.liveAlerts}
                      onChange={() => toggleMapPanel('liveAlerts')}
                    />
                    Live Alerts
                  </label>
                </div>
              </div>
            }
          />

          {mapPanelsVisibility.liveAlerts ? (
            <aside className="pointer-events-none absolute bottom-4 right-4 z-[950] w-[min(92vw,24rem)]">
              <div className="pointer-events-auto">
                <RealTimeAlertFeed />
              </div>
            </aside>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default MainLayout