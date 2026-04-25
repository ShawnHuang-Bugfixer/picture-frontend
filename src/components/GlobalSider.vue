<template>
  <div id="globalSider">
    <router-link class="brand-card" to="/">
      <div class="brand-mark">SR</div>
      <div>
        <p class="brand-overline">Super Resolution</p>
        <h2 class="brand-title">{{ APP_SHORT_NAME }}</h2>
        <p class="brand-desc">低清图片与视频修复工作台</p>
      </div>
    </router-link>

    <section class="nav-card">
      <p class="nav-section-title">核心入口</p>

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

      <div class="team-group">
        <button
          class="nav-link nav-link--button"
          :class="{ active: isTeamGroupActive }"
          type="button"
          @click="toggleTeamGroup"
        >
          <ClusterOutlined />
          <span>团队协作台</span>
          <DownOutlined class="team-group__arrow" :class="{ expanded: isTeamGroupExpanded }" />
        </button>

        <div v-if="isTeamGroupExpanded" class="team-group__panel">
          <router-link
            v-for="spaceUser in teamSpaceList"
            :key="resolveSpaceId(spaceUser)"
            class="team-group__item"
            :class="{ active: currentTeamSpaceId === resolveSpaceId(spaceUser) }"
            :to="`/space/${resolveSpaceId(spaceUser)}`"
          >
            <span class="team-group__item-name">
              {{ spaceUser.space?.spaceName || `团队工作台 ${resolveSpaceId(spaceUser)}` }}
            </span>
            <span class="team-group__item-meta">协作处理入口</span>
          </router-link>

          <div v-if="teamSpaceList.length === 0" class="team-group__empty">
            还没有加入团队工作台
          </div>

          <button class="team-group__create" type="button" @click="goToCreateTeamSpace">+</button>
        </div>
      </div>

      <router-link
        v-for="item in trailingItems"
        :key="item.key"
        class="nav-link"
        :class="{ active: currentPath === item.key }"
        :to="item.key"
      >
        <component :is="item.icon" />
        <span>{{ item.label }}</span>
      </router-link>
    </section>

    <section v-if="isAdmin" class="nav-card">
      <p class="nav-section-title">平台管理</p>
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
        {{ loginUserStore.loginUser.id ? '已登录，可继续提交修复任务' : '未登录，可先浏览案例库' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AppstoreOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  DownOutlined,
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { APP_SHORT_NAME } from '@/constants/app.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const teamSpaceList = ref<API.SpaceUserVO[]>([])
const isTeamGroupExpanded = ref(false)

const primaryItems = [
  { key: '/', label: '首页', icon: HomeOutlined },
  { key: '/my_space', label: '个人工作台', icon: UserOutlined },
]

const trailingItems = [
  { key: '/search_picture', label: '超分案例库', icon: AppstoreOutlined },
  { key: '/upload_case', label: '上传超分案例', icon: DatabaseOutlined },
]

const adminItems = [
  { key: '/admin/userManage', label: '用户管理', icon: UserOutlined },
  { key: '/admin/pictureManage', label: '素材管理', icon: DatabaseOutlined },
  { key: '/admin/spaceManage', label: '工作台管理', icon: SettingOutlined },
]

const currentPath = computed(() => route.path)
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')

const resolveSpaceId = (spaceUser: API.SpaceUserVO) => {
  return String(spaceUser.space?.id ?? spaceUser.spaceId ?? '')
}

const currentTeamSpaceId = computed(() => {
  if (!String(route.path).startsWith('/space/')) {
    return ''
  }
  const routeSpaceId = String(route.params.id ?? '')
  return teamSpaceList.value.some((item) => resolveSpaceId(item) === routeSpaceId)
    ? routeSpaceId
    : ''
})

const isTeamGroupActive = computed(() => {
  return (
    Boolean(currentTeamSpaceId.value) || (route.path === '/add_space' && route.query.type === '1')
  )
})

const toggleTeamGroup = () => {
  isTeamGroupExpanded.value = !isTeamGroupExpanded.value
}

const goToCreateTeamSpace = () => {
  router.push('/add_space?type=1')
}

const fetchTeamSpaceList = async () => {
  if (!loginUserStore.loginUser.id) {
    teamSpaceList.value = []
    return
  }
  const res = await listMyTeamSpaceUsingPost()
  if (res.data.code === 0 && res.data.data) {
    teamSpaceList.value = res.data.data.filter((item) => Boolean(resolveSpaceId(item))).slice(0, 6)
    return
  }
  message.error('加载团队工作台失败，' + res.data.message)
}

watch(
  () => loginUserStore.loginUser.id,
  () => {
    fetchTeamSpaceList()
  },
)

watch(
  () => [route.path, route.params.id, route.query.type],
  () => {
    if (isTeamGroupActive.value) {
      isTeamGroupExpanded.value = true
    }
  },
  { immediate: true },
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
  padding: 16px;
  border: 1px solid @sidebar-border;
  border-radius: @border-radius-xl;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(251, 251, 252, 0.82) 100%);
  box-shadow: @shadow-md;
  color: @text-color;
  backdrop-filter: blur(18px);
}

.brand-card,
.nav-card,
.status-card {
  border: 1px solid @sidebar-border;
  border-radius: @border-radius-lg;
  background: @sidebar-surface;
  backdrop-filter: blur(10px);
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
  background: linear-gradient(135deg, #202123 0%, #4b5563 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.brand-overline {
  margin: 2px 0 4px;
  color: @text-secondary;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.brand-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  color: @text-color;
}

.brand-desc {
  margin: 6px 0 0;
  color: @text-secondary;
  font-size: 13px;
  line-height: 1.6;
}

.nav-card {
  padding: 16px 12px 12px;
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

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 6px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: @text-color;
  transition: 0.2s ease;
}

.nav-link--button {
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.nav-link:hover,
.nav-link.active,
.team-group__item.active {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(15, 23, 42, 0.08);
  color: @text-color;
}

.team-group {
  margin-bottom: 6px;
}

.team-group__arrow {
  margin-left: auto;
  transition: transform 0.2s ease;
}

.team-group__arrow.expanded {
  transform: rotate(180deg);
}

.team-group__panel {
  margin: 4px 0 8px;
  padding: 4px 8px 4px 16px;
}

.team-group__create {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px dashed @border-strong;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  color: @text-color;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
}

.team-group__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  color: @text-color;
  transition: 0.2s ease;
}

.team-group__item:hover {
  background: rgba(255, 255, 255, 0.88);
  color: @text-color;
}

.team-group__item-name {
  font-size: 14px;
  font-weight: 600;
}

.team-group__item-meta,
.team-group__empty {
  color: @text-secondary;
  font-size: 12px;
}

.team-group__empty {
  padding: 6px 12px 10px;
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
  color: @text-color;
}
</style>
