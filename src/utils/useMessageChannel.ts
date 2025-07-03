import { ref } from 'vue'
import { message } from 'ant-design-vue'

type MessageInfo = {
  type?: string;
  info?: string;
};

type MessageHandler = (msg: MessageInfo) => void;

class MessageChannel {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private heartbeatTimer: any = null;
  private missedPong = 0;
  private readonly maxMissedPong = 3;
  private readonly wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws/messagepush/connect`;
  private readonly sseUrl = `/api/sse/connect`;
  private handler: MessageHandler;

  constructor(handler: MessageHandler) {
    this.handler = handler;
    this.connectWebSocket();
  }

  private connectWebSocket() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.onopen = () => {
      this.startHeartbeat();
    };
    this.ws.onmessage = (event) => {
      if (event.data === 'pong') {
        this.missedPong = 0;
      } else {
        this.handler(JSON.parse(event.data));
      }
    };
    this.ws.onerror = () => {
      this.cleanupWebSocket();
      this.connectSSE();
    };
    this.ws.onclose = () => {
      this.cleanupWebSocket();
      this.connectSSE();
    };
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        this.missedPong++;
        if (this.missedPong > this.maxMissedPong) {
          this.ws.close();
        }
      }
    }, 10000); // 10秒心跳
  }

  private cleanupWebSocket() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.ws = null;
    this.missedPong = 0;
  }

  private connectSSE() {
    this.sse = new EventSource(this.sseUrl, { withCredentials: true });
    this.sse.onmessage = (event) => {
      this.handler(JSON.parse(event.data));
    };
    this.sse.onerror = () => {
      this.cleanupSSE();
      setTimeout(() => this.connectSSE(), 5000); // 5秒后重连
    };
  }

  private cleanupSSE() {
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
  }

  public close() {
    if (this.ws) this.ws.close();
    if (this.sse) this.sse.close();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }
}

export function useMessageChannel(handler: MessageHandler) {
  const channel = new MessageChannel(handler);
  return {
    close: () => channel.close(),
  };
} 