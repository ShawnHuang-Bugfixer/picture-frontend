import { useWebSocketStore } from '@/stores/useWebSocketStore'

/**
 * WebSocket 使用示例
 */
export class WebSocketExample {
  private webSocketStore = useWebSocketStore()

  /**
   * 发送消息示例
   */
  sendMessage() {
    // 发送通知消息
    this.webSocketStore.sendMessage({
      type: 'notification',
      data: {
        message: '这是一条测试消息',
        timestamp: Date.now()
      }
    })
  }

  /**
   * 发送图片更新消息
   */
  sendPictureUpdate(pictureId: number) {
    this.webSocketStore.sendMessage({
      type: 'picture_update',
      data: {
        pictureId,
        action: 'update',
        timestamp: Date.now()
      }
    })
  }

  /**
   * 发送空间更新消息
   */
  sendSpaceUpdate(spaceId: number) {
    this.webSocketStore.sendMessage({
      type: 'space_update',
      data: {
        spaceId,
        action: 'update',
        timestamp: Date.now()
      }
    })
  }

  /**
   * 获取所有收到的消息
   */
  getMessages() {
    return this.webSocketStore.messages
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.webSocketStore.isConnected
  }
}

// 导出单例实例
export const webSocketExample = new WebSocketExample() 