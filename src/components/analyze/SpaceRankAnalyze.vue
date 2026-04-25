<template>
  <div class="analyze-shell">
    <a-card title="工作台容量排行">
      <v-chart :option="options" style="height: 320px; max-width: 100%" :loading="loading" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, ref, watchEffect } from 'vue'
import VChart from 'vue-echarts'
import 'echarts'
import { getSpaceRankAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'

interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

type SpaceRankItem = {
  spaceName?: string
  totalSize?: number
}

defineProps<Props>()

const dataList = ref<SpaceRankItem[]>([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  const res = await getSpaceRankAnalyzeUsingPost({
    topN: 10,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data as unknown as SpaceRankItem[]
  } else {
    message.error('获取排行数据失败，' + res.data.message)
  }
  loading.value = false
}

watchEffect(() => {
  fetchData()
})

const options = computed(() => {
  const spaceNames = dataList.value.map((item) => item.spaceName || '未命名工作台')
  const usageData = dataList.value.map((item) =>
    Number(((item.totalSize ?? 0) / (1024 * 1024)).toFixed(2)),
  )

  return {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: spaceNames,
    },
    yAxis: {
      type: 'value',
      name: '容量 (MB)',
    },
    series: [
      {
        name: '容量 (MB)',
        type: 'bar',
        data: usageData,
        itemStyle: {
          color: '#2563eb',
        },
      },
    ],
  }
})
</script>

<style scoped lang="less">
.analyze-shell :deep(.ant-card) {
  height: 100%;
}
</style>
