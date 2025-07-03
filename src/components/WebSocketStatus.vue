<template>
  <div class="websocket-status">
    <a-tag :color="webSocketStore.isConnected ? 'green' : 'red'">
      {{ webSocketStore.isConnected ? 'WebSocket 已连接' : 'WebSocket 未连接' }}
    </a-tag>
    <a-button 
      v-if="!webSocketStore.isConnected && loginUserStore.loginUser.id" 
      size="small" 
      @click="reconnect"
      style="margin-left: 8px;"
    >
      重连
    </a-button>
  </div>
</template>

<script lang="ts" setup>
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useWebSocketStore } from '@/stores/useWebSocketStore.ts'

const loginUserStore = useLoginUserStore()
const webSocketStore = useWebSocketStore()

const reconnect = () => {
  webSocketStore.initWebSocket()
}
</script>

<style scoped>
.websocket-status {
  display: flex;
  align-items: center;
}
</style> 