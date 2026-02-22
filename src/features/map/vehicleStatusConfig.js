export const VEHICLE_STATUS_STYLES = {
  idle: {
    label: 'Idle',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
  },
  in_progress: {
    label: 'In Progress',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.45)',
  },
  delayed: {
    label: 'Delayed',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
  },
  alert: {
    label: 'Alert',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.5)',
  },
  arrived: {
    label: 'Arrived',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.55)',
  },
}

export const STATUS_ORDER = ['idle', 'in_progress', 'delayed', 'alert', 'arrived']