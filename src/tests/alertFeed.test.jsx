import { fireEvent, render, screen } from '@testing-library/react'
import RealTimeAlertFeed from '../components/layout/RealTimeAlertFeed'
import useAlertsStore from '../store/alertsStore'
import useFleetStore from '../store/fleetStore'

describe('RealTimeAlertFeed', () => {
  beforeEach(() => {
    useAlertsStore.setState({ alerts: [] })
    useFleetStore.setState({ vehicles: [] })
  })

  it('renders unread badge count', () => {
    useAlertsStore.setState({
      alerts: [
        {
          id: 'ALERT-1',
          type: 'geofence',
          message: 'Test alert',
          vehicleId: 'VH-001',
          timestamp: Date.now(),
          read: false,
          acknowledged: false,
        },
      ],
    })

    render(<RealTimeAlertFeed />)

    expect(screen.getByText(/1 unread/i)).toBeInTheDocument()
  })

  it('removes an alert immediately when acknowledged', () => {
    useAlertsStore.setState({
      alerts: [
        {
          id: 'ALERT-1',
          type: 'geofence',
          message: 'Test alert',
          vehicleId: 'VH-001',
          timestamp: Date.now(),
          read: false,
          acknowledged: false,
        },
      ],
      handledAlerts: [],
    })

    render(<RealTimeAlertFeed />)

    fireEvent.click(screen.getByRole('button', { name: /acknowledge alert ALERT-1/i }))

    expect(screen.queryByText('Test alert')).not.toBeInTheDocument()
    expect(screen.getByText(/no alerts yet/i)).toBeInTheDocument()
    expect(useAlertsStore.getState().alerts).toHaveLength(0)
    expect(useAlertsStore.getState().handledAlerts).toHaveLength(1)
    expect(useAlertsStore.getState().handledAlerts[0].acknowledged).toBe(true)
  })
})