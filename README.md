# Vehicle Tracking Dashboard

## Project Goal
Build a real-time vehicle tracking dashboard UI focused on operations teams. The project demonstrates map visualization, live vehicle status changes, and alert workflows in a way that can later be backed by production services.

## Architecture Notes
- React + Vite for fast iteration on UI components.
- Leaflet + react-leaflet for map rendering and map controls.
- Zustand for shared UI state (selection, alerts, fleet updates) without coupling panels to map logic.
- UI-first architecture: map, command center, and alerts subscribe to shared stores rather than calling each other directly.

## Real-Time Simulation Approach
In production, vehicle positions, statuses, and alerts would arrive via backend WebSockets. In this project, the `useMockWebSocket` hook simulates that data flow by emitting periodic updates into shared stores.

Key responsibilities:
- Backend (simulated here): vehicle positions, status changes, alert events.
- Frontend (this project): rendering, interaction, animation, and operator UX.

This separation keeps the UI reactive to data changes while allowing future replacement of the mock stream with real WebSocket events.

## How to Demo
1. Start the app: `npm run dev`.
2. Watch vehicle markers update continuously as the simulated backend pushes updates.
3. Click a vehicle in the command center to focus it on the map.
4. Watch alerts appear in the bottom-right feed; click an alert to focus its vehicle.
5. Use the alert actions (Call Driver, Acknowledge, Dismiss) to see operator workflows.
6. Try the Trip Playback controls to replay a historical path (real-time updates pause during playback).

## Notes for Reviewers
All data changes are simulated for UI demonstration. No backend services, WebSockets, or telephony integrations are included in this assignment.

## Backend vs Frontend Responsibility
In a production system, vehicle telemetry, statuses, and alerts are backend-owned and delivered via WebSockets. This UI consumes a simulated stream in `useMockWebSocket` to demonstrate how the frontend reacts to those events without coupling to a real backend.

## Known Limitations
- No persistence on refresh; state resets to the seeded simulation.
- Telephony, notifications, and alert acknowledgements are UI-only.
