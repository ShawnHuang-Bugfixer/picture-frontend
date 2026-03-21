<template>
  <div id="globalSider">
    <router-link class="brand-card" to="/">
      <div class="brand-mark">SR</div>
      <div>
        <p class="brand-overline">Cloud AI</p>
        <h2 class="brand-title">{{ APP_SHORT_NAME }}</h2>
        <p class="brand-desc">图片与视频超分辨率重构平台</p>
      </div>
    </router-link>

    <section class="nav-card">
      <p class="nav-section-title">主场景</p>
      <router-link
        v-for="item in primaryItems"
        :key="item.key"
        class="nav-link"
        :class="{ active: currentPath === item.key }"
        :to="item.key"
      >
        <component :is="item.icon" />
        <span>{{ item.label }}</span>
      </router-link>
    </section>

    <section v-if="teamSpaceList.length" class="nav-card">
      <p class="nav-section-title">最近协作空间</p>
      <router-link
        v-for="spaceUser in teamSpaceList"
        :key="resolveSpaceId(spaceUser)"
        class="space-link"
        :to="`/space/${resolveSpaceId(spaceUser)}`"
      >
        <span class="space-link__name">{{ spaceUser.space?.spaceName || `团队空间 ${resolveSpaceId(spaceUser)}` }}</span>
        <span class="space-link__meta">协作入口</span>
      </router-link>
    </section>

    <section v-if="isAdmin" class="nav-card">
      <p class="nav-section-title">管理后台</p>
      <router-link
        v-for="item in adminItems"
        :key="item.key"
        class="nav-link"
        :class="{ active: currentPath === item.key }"
        :to="item.key"
      >
        <component :is="item.icon" />
        <span>{{ item.label }}</span>
      </router-link>
    </section>

    <div class="status-card">
      <p class="status-card__title">当前状态</p>
      <p class="status-card__value">
        {{ loginUserStore.loginUser.id ? '已登录，可直接提交任务' : '未登录，仅可浏览案例' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AppstoreOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { APP_SHORT_NAME } from '@/constants/app.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const route = useRoute()
const loginUserStore = useLoginUserStore()
const teamSpaceList = ref<API.SpaceUserVO[]>([])

const primaryItems = [
  { key: '/', label: '首页', icon: HomeOutlined },
  { key: '/my_space', label: '人工作空间', icon: UserOutlined },
  { key: '/add_space?type=1', label: '团队协作空间', icon: ClusterOutlined },
  { key: '/search_picture', label: '超分案例展厅', icon: AppstoreOutlined },
  { key: '/add_picture', label: '发起超分任务', icon: DatabaseOutlined },
]

const adminItems = [
  { key: '/admin/userManage', label: '用户管理', icon: UserOutlined },
  { key: '/admin/pictureManage', label: '素材管理', icon: DatabaseOutlined },
  { key: '/admin/spaceManage', label: '工作空间管理', icon: SettingOutlined },
]

const currentPath = computed(() => route.path)
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')

const resolveSpaceId = (spaceUser: API.SpaceUserVO) => {
  return String(spaceUser.space?.id ?? spaceUser.spaceId ?? '')
}

const fetchTeamSpaceList = async () => {
  if (!loginUserStore.loginUser.id) {
    teamSpaceList.value = []
    return
  }
  const res = await listMyTeamSpaceUsingPost()
  if (res.data.code === 0 && res.data.data) {
    teamSpaceList.value = res.data.data
      .filter((item) => Boolean(resolveSpaceId(item)))
      .slice(0, 6)
    return
  }
  message.error('加载团队协作空间失败，' + res.data.message)
}

watch(
  () => loginUserStore.loginUser.id,
  () => {
    fetchTeamSpaceList()
  },
)

onMounted(() => {
  fetchTeamSpaceList()
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

#globalSider {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
}

.brand-card,
.nav-card,
.status-card {
  border: 1px solid @border-color;
  border-radius: @border-radius-xl;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: @shadow-sm;
  backdrop-filter: blur(16px);
}

.brand-card {
  display: flex;
  gap: 14px;
  padding: 18px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1e293b 0%, #2563eb 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
}

.brand-overline {
  margin: 2px 0 4px;
  color: @accent-color;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.brand-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
}

.brand-desc {
  margin: 6px 0 0;
  color: @text-secondary;
  font-size: 13px;
  line-height: 1.6;
}

.nav-card {
  padding: 18px 14px 14px;
}

.nav-section-title {
  margin: 0 0 10px;
  padding: 0 10px;
  color: @text-secondary;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-link,
.space-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  color: @text-color;
  transition: 0.2s ease;
}

.nav-link:hover,
.space-link:hover,
.nav-link.active {
  background: @card-bg-soft;
  color: @primary-color;
}

.space-link {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.space-link__name {
  font-size: 14px;
  font-weight: 600;
}

.space-link__meta {
  color: @text-secondary;
  font-size: 12px;
}

.status-card {
  margin-top: auto;
  padding: 18px;
}

.status-card__title {
  margin: 0;
  color: @text-secondary;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-card__value {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
}
</style>
