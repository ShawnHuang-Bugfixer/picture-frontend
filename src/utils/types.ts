export type ConnectionType = 'websocket' | 'sse'

export interface MessageInfo {
  type?: string
  info?: string
}

export interface ConnectionEventData {
  type: ConnectionType
  event?: unknown
}
