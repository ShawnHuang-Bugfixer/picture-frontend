# WebSocket 功能使用说明

## 概述

本项目已集成 WebSocket 功能，支持用户登录后自动建立实时连接，并在页面切换时保持连接不断开。

## 功能特性

- ✅ 用户登录成功后自动建立 WebSocket 连接
- ✅ 页面切换时保持连接不断开
- ✅ 自动重连机制（最多重连 5 次）
- ✅ 连接状态实时显示
- ✅ 支持发送和接收消息
- ✅ 用户登出时自动断开连接

## 文件结构

```
src/
├── utils/
│   ├── websocket.ts              # WebSocket 核心工具
│   └── websocketExample.ts       # 使用示例
├── stores/
│   └── useWebSocketStore.ts      # WebSocket 状态管理
├── components/
│   └── WebSocketStatus.vue       # 连接状态显示组件
└── layouts/
    └── BasicLayout.vue           # 主布局，包含初始化逻辑
```

## 使用方法

### 1. 自动连接

用户登录成功后，WebSocket 会自动建立连接，无需手动干预。

### 2. 发送消息

```typescript
import { useWebSocketStore } from '@/stores/useWebSocketStore'

const webSocketStore = useWebSocketStore()

// 发送消息
webSocketStore.sendMessage({
  type: 'notification',
  data: {
    message: '这是一条消息',
    timestamp: Date.now()
  }
})
```

### 3. 接收消息

消息会自动处理并显示通知。支持的消息类型：

- `notification`: 通知消息
- `picture_update`: 图片更新
- `space_update`: 空间更新

### 4. 检查连接状态

```typescript
import { useWebSocketStore } from '@/stores/useWebSocketStore'

const webSocketStore = useWebSocketStore()

// 检查是否已连接
if (webSocketStore.isConnected) {
  console.log('WebSocket 已连接')
}
```

### 5. 手动重连

```typescript
import { useWebSocketStore } from '@/stores/useWebSocketStore'

const webSocketStore = useWebSocketStore()

// 手动重连
webSocketStore.initWebSocket()
```

## 消息格式

### 发送消息格式

```typescript
interface WebSocketMessage {
  type: string;    // 消息类型
  data: any;       // 消息数据
}
```

### 示例消息

```typescript
// 通知消息
{
  type: 'notification',
  data: {
    message: '用户 xxx 上传了新图片',
    timestamp: 1640995200000
  }
}

// 图片更新消息
{
  type: 'picture_update',
  data: {
    pictureId: 123,
    action: 'update',
    timestamp: 1640995200000
  }
}

// 空间更新消息
{
  type: 'space_update',
  data: {
    spaceId: 456,
    action: 'update',
    timestamp: 1640995200000
  }
}
```

## 配置说明

### WebSocket 服务器地址

WebSocket 连接会自动使用与当前页面相同的主机和端口：

- 开发环境：`ws://localhost:8123/ws`
- 生产环境：根据实际部署地址自动适配

### 认证方式

使用基于 Cookie 的认证方式，与 HTTP 请求保持一致。

## 注意事项

1. **连接建立时机**：用户登录成功后自动建立，页面刷新时如果用户已登录也会自动建立
2. **连接断开时机**：用户登出时自动断开
3. **重连机制**：连接意外断开时会自动重连，最多重连 5 次，间隔 3 秒
4. **消息处理**：收到的消息会根据类型自动显示相应的通知
5. **状态显示**：在页面头部显示连接状态，支持手动重连

## 扩展功能

如需添加新的消息类型，请在 `useWebSocketStore.ts` 的 `handleMessage` 方法中添加相应的处理逻辑：

```typescript
function handleMessage(msg: WebSocketMessage) {
  switch (msg.type) {
    case 'your_new_type':
      // 处理新消息类型
      break
    // ... 其他类型
  }
}
``` 