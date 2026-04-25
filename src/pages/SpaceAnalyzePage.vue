<template>
  <div id="spaceAnalyzePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">工作台分析</h2>
        <p class="app-page__subtitle">
          <span v-if="queryAll">查看全部工作台的整体使用情况。</span>
          <span v-else-if="queryPublic">查看案例库的整体使用情况。</span>
          <span v-else>查看当前工作台的容量、标签、分类与上传行为分析。</span>
        </p>
      </div>
      <div class="app-page__actions" v-if="spaceId">
        <a-button :href="`/space/${spaceId}`" target="_blank">返回工作台</a-button>
      </div>
    </section>

    <section class="analysis-grid">
      <div class="analysis-cell">
        <SpaceUsageAnalyze :spaceId="spaceId as any" :queryAll="queryAll" :queryPublic="queryPublic" />
      </div>
      <div class="analysis-cell">
        <SpaceCategoryAnalyze :spaceId="spaceId as any" :queryAll="queryAll" :queryPublic="queryPublic" />
      </div>
      <div class="analysis-cell">
        <SpaceTagAnalyze :spaceId="spaceId as any" :queryAll="queryAll" :queryPublic="queryPublic" />
      </div>
      <div class="analysis-cell">
        <SpaceSizeAnalyze :spaceId="spaceId as any" :queryAll="queryAll" :queryPublic="queryPublic" />
      </div>
      <div class="analysis-cell">
        <SpaceUserAnalyze :spaceId="spaceId as any" :queryAll="queryAll" :queryPublic="queryPublic" />
      </div>
      <div class="analysis-cell">
        <SpaceRankAnalyze v-if="isAdmin" :spaceId="spaceId as any" :queryAll="queryAll" :queryPublic="queryPublic" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import SpaceUsageAnalyze from '@/components/analyze/SpaceUsageAnalyze.vue'
import SpaceCategoryAnalyze from '@/components/analyze/SpaceCategoryAnalyze.vue'
import SpaceTagAnalyze from '@/components/analyze/SpaceTagAnalyze.vue'
import SpaceSizeAnalyze from '@/components/analyze/SpaceSizeAnalyze.vue'
import SpaceUserAnalyze from '@/components/analyze/SpaceUserAnalyze.vue'
import SpaceRankAnalyze from '@/components/analyze/SpaceRankAnalyze.vue'

const route = useRoute()
const spaceId = computed(() => {
  const rawId = route.query?.spaceId
  if (Array.isArray(rawId)) {
    return rawId[0]
  }
  return rawId ?? undefined
})
const queryAll = computed(() => Boolean(route.query?.queryAll))
const queryPublic = computed(() => Boolean(route.query?.queryPublic))

const loginUserStore = useLoginUserStore()
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')
</script>

<style scoped lang="less">
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.analysis-cell {
  min-width: 0;
}

.analysis-cell > * {
  width: 100%;
  height: 100%;
}

@media (max-width: 960px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }
}
</style>
