// WebSocket hook for camera streams
// TODO: Implement WebSocket connection for camera video feeds

import { useEffect, useState } from 'react'

export function useCameraStream(cameraId: number) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // TODO: Connect to WebSocket for camera stream
    // const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/stream/${cameraId}`)
    // Implement frame reception and display

    return () => {
      // Cleanup on unmount
    }
  }, [cameraId])

  return { connected }
}
