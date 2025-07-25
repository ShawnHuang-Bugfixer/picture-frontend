<template>
  <div id="globalHeader">
    <a-row :wrap="false">
      <a-col flex="200px">
        <router-link to="/">
          <div class="title-bar">
            <img class="logo" src="../assets/logo.png" alt="logo" />
            <div class="title">墨灵共绘</div>
          </div>
        </router-link>
      </a-col>
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="items"
          @click="doMenuClick"
        />
      </a-col>
<!-- 用户信息展示栏 -->
<a-col flex="200px">
  <div class="user-login-status">
    <div v-if="loginUserStore.loginUser.id">
      <a-dropdown>
        <div class="avatar-with-name">
          <a-avatar :src="loginUserStore.loginUser.userAvatar" />
          <div class="user-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</div>
        </div>
        <template #overlay>
          <a-menu>
            <a-menu-item>
              <router-link to="/user/profile">
                <UserOutlined />
                个人中心
              </router-link>
            </a-menu-item>
            <a-menu-item @click="doLogout">
              <LogoutOutlined />
              退出登录
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
    <div v-else>
      <a-button type="primary" href="/user/login">登录</a-button>
    </div>
  </div>
</a-col>

    </a-row>
  </div>
</template>
<script lang="ts" setup>
import { computed, h, ref, watch } from 'vue'
import { HomeOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons-vue'
import type { MenuProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useWebSocketStore } from '@/stores/useWebSocketStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'

const loginUserStore = useLoginUserStore()
const webSocketStore = useWebSocketStore()

// 监听用户登录状态变化，自动建立 WebSocket 连接
watch(() => loginUserStore.loginUser, (newUser, oldUser) => {
  const newId = newUser?.id
  const oldId = oldUser?.id
  
  if (newId && !oldId) {
    // 用户登录成功，建立 WebSocket 连接
    console.log('用户登录成功，建立 WebSocket 连接', newId)
    webSocketStore.initWebSocket()
  } else if (!newId && oldId) {
    // 用户登出，断开 WebSocket 连接
    console.log('用户登出，断开 WebSocket 连接')
    webSocketStore.disconnect()
  }
}, { deep: true })

// 未经过滤的菜单项
const originItems = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/add_picture',
    label: '创建图片',
    title: '创建图片',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
  },
  {
    key: '/admin/spaceManage',
    label: '空间管理',
    title: '空间管理',
  }
]

// 根据权限过滤菜单项
const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    // 管理员才能看到 /admin 开头的菜单
    if (menu?.key && String(menu.key).startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

// 展示在菜单的路由数组
const items = computed(() => filterMenus(originItems))

const router = useRouter()
// 当前要高亮的菜单项
const current = ref<string[]>([])
// 监听路由变化，更新高亮菜单项
router.afterEach((to, from, next) => {
  current.value = [to.path]
})

// 路由跳转事件
const doMenuClick = ({ key }: { key: any }) => {
  router.push({
    path: key,
  })
}

// 用户注销
const doLogout = async () => {
  const res = await userLogoutUsingPost()
  if (res.data.code === 0) {
    // 先断开 WebSocket 连接
    webSocketStore.disconnect()
    // 然后清空用户信息
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}
</script>

<style scoped>
#globalHeader .title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: black;
  font-size: 18px;
  margin-left: 16px;
}

.logo {
  height: 48px;
}

.user-login-status {
  height: 100%;
  display: flex;
  align-items: center; /* 整体上下居中 */
}

.avatar-with-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px; /* 头像和名称间距 */
  transform: translateY(2px); /* 微调整体向下，可根据需求微调数值 */
}

.user-name {
  font-size: 12px;
  color: #333;
  line-height: 1.2;
}

</style>
