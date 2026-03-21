<template>
  <div class="analyze-card-grid">
    <a-card class="analyze-card" title="存储容量">
      <div class="analyze-meter">
        <h3>{{ formatSize(data.usedSize) }} / {{ data.maxSize ? formatSize(data.maxSize) : '无上限' }}</h3>
        <a-progress type="dashboard" :percent="data.sizeUsageRatio ?? 0" />
      </div>
    </a-card>
    <a-card class="analyze-card" title="素材数量">
      <div class="analyze-meter">
        <h3>{{ data.usedCount ?? 0 }} / {{ data.maxCount ?? '无上限' }}</h3>
        <a-progress type="dashboard" :percent="data.countUsageRatio ?? 0" />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { message } from 'ant-design-vue'
import { getSpaceUsageAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'
import { formatSize } from '@/utils'

interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

const props = withDefaults(defineProps<Props>(), {
  queryAll: false,
  queryPublic: false,
})

const data = ref<API.SpaceUsageAnalyzeResponse>({})

const fetchData = async () => {
  const res = await getSpaceUsageAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0 && res.data.data) {
    data.value = res.data.data
    return
  }
  message.error('获取分析数据失败，' + res.data.message)
}

watchEffect(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.analyze-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.analyze-card {
  height: 100%;
}

.analyze-meter {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  text-align: center;
}

.analyze-meter h3 {
  margin: 0;
  font-size: 24px;
}

@media (max-width: 768px) {
  .analyze-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
