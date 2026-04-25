<template>
  <div id="mySpacePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">正在进入个人工作台</h2>
        <p class="app-page__subtitle">
          系统会优先定位你已有的个人工作台；如果还没有，会自动带你去创建。
        </p>
      </div>
    </section>

    <section class="app-surface-card status-shell">
      <div class="status-shell__copy">
        <span class="status-shell__eyebrow">Workspace Routing</span>
        <h3 class="status-shell__title">正在确认你的个人工作台</h3>
        <p class="status-shell__desc">
          如果你已经创建过个人工作台，就会直接回到那里；如果没有，就先帮你跳到创建页。
        </p>
      </div>

      <div class="status-shell__meta">
        <a-spin />
        <span>正在查询工作台状态...</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { listSpaceVoByPageUsingPost } from '@/api/spaceController.ts'
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

  const res = await listSpaceVoByPageUsingPost({
    userId: loginUser.id,
    current: 1,
    pageSize: 1,
    spaceType: SPACE_TYPE_ENUM.PRIVATE,
  })

  if (res.data.code === 0) {
    if (res.data.data?.records?.length) {
      const targetSpace = res.data.data.records[0]
      if (targetSpace?.id) {
        router.replace(`/space/${targetSpace.id}`)
        return
      }
    }

    router.replace('/add_space')
    message.warn('你还没有个人工作台，先创建一个吧')
    return
  }

  message.error('加载个人工作台失败，' + res.data.message)
}

onMounted(() => {
  checkUserSpace()
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.status-shell {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  min-height: 260px;
  padding: 30px 32px;
}

.status-shell__copy {
  max-width: 580px;
}

.status-shell__eyebrow {
  color: @accent-color;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.status-shell__title {
  margin: 12px 0 0;
  font-size: 30px;
  letter-spacing: -0.03em;
}

.status-shell__desc {
  margin: 12px 0 0;
  color: @text-secondary;
  line-height: 1.8;
}

.status-shell__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-width: 240px;
  padding: 24px 20px;
  border: 1px solid @border-color;
  border-radius: @border-radius-md;
  background: @card-bg-soft;
  color: @text-secondary;
}

@media (max-width: 960px) {
  .status-shell {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
  }

  .status-shell__meta {
    width: 100%;
  }
}
</style>
