let socket: WebSocket | null = null
let heartbeatTimer: number | null = null
let pongTimeoutTimer: number | null = null

const HEARTBEAT_INTERVAL = 30000
const PONG_TIMEOUT = 5000

export interface WebSocketMessage {
  type: string
  data: unknown
}

export function connectWebSocket(
  onMessage: (msg: unknown) => void,
  onConnect?: () => void,
  onDisconnect?: () => void,
  onError?: () => void,
) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return
  }

  const wsBaseUrl = import.meta.env.DEV ? 'ws://localhost:8123' : 'wss://collabimage.afishingcat.xin'
  socket = new WebSocket(`${wsBaseUrl}/api/ws/messagepush/connect`)

  socket.onopen = () => {
    onConnect?.()
    startHeartbeat()
  }

  socket.onmessage = (event) => {
    if (event.data === 'pong') {
      resetPongTimeout()
      return
    }

    try {
      onMessage(JSON.parse(event.data))
    } catch {
      onMessage(event.data)
    }
  }

  socket.onclose = () => {
    stopHeartbeat()
    onDisconnect?.()
  }

  socket.onerror = () => {
    stopHeartbeat()
    onError?.()
  }
}

export function sendWebSocketMessage(data: unknown) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data))
  }
}

function startHeartbeat() {
  stopHeartbeat()
  heartbeatTimer = window.setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }))
      pongTimeoutTimer = window.setTimeout(() => {
        socket?.close()
      }, PONG_TIMEOUT)
    }
  }, HEARTBEAT_INTERVAL)
}

function resetPongTimeout() {
  if (pongTimeoutTimer !== null) {
    clearTimeout(pongTimeoutTimer)
    pongTimeoutTimer = null
  }
}

function stopHeartbeat() {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer)
  }
  if (pongTimeoutTimer !== null) {
    clearTimeout(pongTimeoutTimer)
  }
  heartbeatTimer = null
  pongTimeoutTimer = null
}

export function closeWebSocket() {
  stopHeartbeat()
  if (socket) {
    socket.close()
    socket = null
  }
}

export function isWebSocketConnected() {
  return socket !== null && socket.readyState === WebSocket.OPEN
}
