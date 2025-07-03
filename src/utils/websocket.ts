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
  messages.value.push(msg)
  console.log('收到消息', msg)

  // 首次登录未读消息弹窗
  if (!hasShownUnreadModal.value) {
    if (typeof msg === 'string' && /^\d+$/.test(msg)) {
      Modal.info({
        title: '消息提醒',
        content: `您有${msg}条未读信息！`,
        okText: '我知道了',
        maskClosable: false,
        closable: false,
      })
      hasShownUnreadModal.value = true
      sessionStorage.setItem(UNREAD_MODAL_KEY, 'true')
    } else if (msg && msg.info && (!msg.type || msg.type === 'unread')) {
      Modal.info({
        title: '消息提醒',
        content: `您有${msg.info}条未读信息！`,
        okText: '我知道了',
        maskClosable: false,
        closable: false,
      })
      hasShownUnreadModal.value = true
      sessionStorage.setItem(UNREAD_MODAL_KEY, 'true')
    }
  }

  // 审核消息弹窗
  if (msg && msg.type && msg.type.toLowerCase() === 'review' && msg.content) {
    console.log('弹窗审核消息', msg.content)
    Modal.info({
      title: '审核通知',
      content: msg.content,
      okText: '我知道了',
      maskClosable: false,
      closable: false,
    })
    return
  }

  // 其他类型消息
  switch (msg.type) {
    case 'notification':
      message.info(msg.data?.message || '收到新通知')
      break
    case 'picture_update':
      message.success('图片信息已更新')
      break
    case 'space_update':
      message.success('空间信息已更新')
      break
    default:
      // 未处理的消息类型
  }
} 