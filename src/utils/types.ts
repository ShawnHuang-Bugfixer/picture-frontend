// 消息信息接口
export interface MessageInfo {
  type?: string
  info?: string
}

// 连接事件数据
export interface ConnectionEventData {
  type: ConnectionType
  event?: any
} 