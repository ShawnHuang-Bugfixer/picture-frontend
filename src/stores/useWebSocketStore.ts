import { ref } from 'vue'
import { defineStore } from 'pinia'
import { connectWebSocket, closeWebSocket, sendWebSocketMessage, isWebSocketConnected } from '@/utils/websocket'
import { connectSSE, closeSSE } from '@/utils/sse'
import { message, Modal } from 'ant-design-vue'

const UNREAD_MODAL_KEY = 'hasShownUnreadModal'

export const useWebSocketStore = defineStore('websocket', () => {
  const isConnected = ref(false)
  const messages = ref<any[]>([])
  // 标记存 sessionStorage，防止刷新/重连重复弹窗
  const hasShownUnreadModal = ref(sessionStorage.getItem(UNREAD_MODAL_KEY) === 'true')
  let sseConnected = false

  /**
   * 初始化 WebSocket 连接
   */
  function initWebSocket() {
    connectWebSocket(
      handleMessage,
      handleConnect,
      handleDisconnect,
      trySSE // WebSocket 失败时自动尝试 SSE
    )
  }

  function trySSE() {
    if (!sseConnected) {
      connectSSE(handleMessage, () => { sseConnected = false })
      sseConnected = true
    }
  }

  /**
   * 处理 WebSocket 连接成功
   */
  function handleConnect() {
    isConnected.value = true
  }

  /**
   * 处理 WebSocket 连接断开
   */
  function handleDisconnect() {
    isConnected.value = false
  }

  /**
   * 处理收到的 WebSocket 消息
   * @param msg 消息内容
   */
  function handleMessage(msg: any) {
    messages.value.push(msg)

    // 1. 首次登录未读消息弹窗（只针对未读消息格式）
    if (!hasShownUnreadModal.value) {
      // 纯数字字符串
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
        // 注意：这里不 return，允许后续业务消息继续处理
      }
      // 对象格式
      else if (msg && msg.info && (!msg.type || msg.type === 'unread')) {
        Modal.info({
          title: '消息提醒',
          content: `您有${msg.info}条未读信息！`,
          okText: '我知道了',
          maskClosable: false,
          closable: false,
        })
        hasShownUnreadModal.value = true
        sessionStorage.setItem(UNREAD_MODAL_KEY, 'true')
        // 注意：这里不 return，允许后续业务消息继续处理
      }
      // 不是未读消息格式，不设置 hasShownUnreadModal
    }

    // 2. 审核消息弹窗
    if (msg && msg.type === 'review' && msg.content) {
      Modal.info({
        title: '审核通知',
        content: msg.content,
        okText: '我知道了',
        maskClosable: false,
        closable: false,
      })
      return
    }

    // 3. 其他类型消息
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

  /**
   * 发送 WebSocket 消息
   * @param data 消息数据
   */
  function sendMessage(data: any) {
    sendWebSocketMessage(data)
  }

  /**
   * 断开 WebSocket 连接
   */
  function disconnect() {
    closeWebSocket()
    closeSSE()
    isConnected.value = false
    messages.value = []
    // 用户登出时清除标记
    hasShownUnreadModal.value = false
    sessionStorage.removeItem(UNREAD_MODAL_KEY)
    sseConnected = false
  }

  /**
   * 检查连接状态
   */
  function checkConnection(): boolean {
    return isWebSocketConnected() || sseConnected
  }

  // 用户每次登录成功后调用
  function resetUnreadModalFlag() {
    hasShownUnreadModal.value = false
    sessionStorage.removeItem(UNREAD_MODAL_KEY)
  }

  return {
    isConnected,
    messages,
    initWebSocket,
    sendMessage,
    disconnect,
    checkConnection,
    resetUnreadModalFlag,
  }
}) 