let socket: WebSocket | null = null;
let heartbeatTimer: number | null = null;
let pongTimeoutTimer: number | null = null;
const HEARTBEAT_INTERVAL = 30000; // 30秒

export interface WebSocketMessage {
  type: string;
  data: any;
}

export function connectWebSocket(
  onMessage: (msg: any) => void,
  onConnect?: () => void,
  onDisconnect?: () => void,
  onError?: () => void
) {
  if (socket && socket.readyState === WebSocket.OPEN) return;

  const wsUrl = 'ws://localhost:8123/api/ws/messagepush/connect';
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    onConnect?.();
    startHeartbeat();
  };

  socket.onmessage = (event) => {
    if (event.data === 'pong') {
      resetPongTimeout();
      return;
    }
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    } catch {
      onMessage(event.data);
    }
  };

  socket.onclose = () => {
    stopHeartbeat();
    onDisconnect?.();
    // 可加重连逻辑
  };

  socket.onerror = () => {
    stopHeartbeat();
    onError?.();
  };
}

export function sendWebSocketMessage(data: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = window.setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }));
      pongTimeoutTimer = window.setTimeout(() => {
        socket?.close();
      }, 5000);
    }
  }, HEARTBEAT_INTERVAL);
}

function resetPongTimeout() {
  if (pongTimeoutTimer) {
    clearTimeout(pongTimeoutTimer);
    pongTimeoutTimer = null;
  }
}

function stopHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (pongTimeoutTimer) clearTimeout(pongTimeoutTimer);
  heartbeatTimer = null;
  pongTimeoutTimer = null;
}

export function closeWebSocket() {
  stopHeartbeat();
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function isWebSocketConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

function showUnreadModal(count: string) {
  console.log('弹窗', count)
  Modal.info({
    title: '消息提醒',
    content: `您有${count}条未读信息！`,
    okText: '我知道了',
    maskClosable: false,
    closable: false,
  })
}

function handleMessage(msg: any) {
  console.log('收到 WebSocket 消息:', msg)
  // 兼容后端推送的未读消息数
  if (typeof msg === 'string' && /^\d+$/.test(msg)) {
    showUnreadModal(msg)
    return
  }
  if (msg && msg.info && (!msg.type || msg.type === 'unread')) {
    showUnreadModal(msg.info)
    return
  }
  // 其他消息类型处理...
  console.log('未处理的消息类型:', msg.type)
} 