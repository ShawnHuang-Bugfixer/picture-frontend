<template>
  <div id="mySpacePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">正在进入人工工作空间</h2>
        <p class="app-page__subtitle">系统会优先定位你已有的人工工作空间；如果不存在，将自动跳转到创建页。</p>
      </div>
    </section>
    <section class="app-card status-shell">
      <a-spin />
      <p>请稍候，正在定位你的工作台...</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { listSpaceByPageUsingPost } from '@/api/spaceController.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const router = useRouter()
const loginUserStore = useLoginUserStore()

const checkUserSpace = async () => {
  const loginUser = loginUserStore.loginUser
  if (!loginUser?.id) {
    router.replace('/user/login')
    return
  }

  const res = await listSpaceByPageUsingPost({
    userId: loginUser.id,
    current: 1,
    pageSize: 20,
    sortField: 'createTime',
    sortOrder: 'descend',
    spaceType: SPACE_TYPE_ENUM.PRIVATE,
  })

  if (res.data.code === 0 && res.data.data?.records?.length) {
    const targetSpace = res.data.data.records.find((space) => space.id)
    if (targetSpace?.id) {
      router.replace(`/space/${String(targetSpace.id)}`)
      return
    }
  }

  if (res.data.code === 0) {
    router.replace('/add_space')
    message.warn('你还没有人工工作空间，先创建一个吧')
    return
  }

  message.error('加载人工工作空间失败，' + res.data.message)
}

onMounted(() => {
  checkUserSpace()
})
</script>

<style scoped lang="less">
.status-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}
</style>
