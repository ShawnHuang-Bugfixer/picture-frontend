let sse: EventSource | null = null;

export function connectSSE(onMessage: (msg: any) => void, onError?: () => void) {
  sse = new EventSource('/api/sse/connect');
  sse.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    } catch {
      onMessage(event.data);
    }
  };
  sse.onerror = () => {
    sse?.close();
    onError?.();
  };
}

export function closeSSE() {
  if (sse) {
    sse.close();
    sse = null;
  }
} 