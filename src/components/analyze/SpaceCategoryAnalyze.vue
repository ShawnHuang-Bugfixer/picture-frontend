<template>
  <div class="analyze-shell">
    <a-card title="素材分类分析">
      <v-chart :option="options" style="height: 320px; max-width: 100%" :loading="loading" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import 'echarts'
import { computed, ref, watchEffect } from 'vue'
import { message } from 'ant-design-vue'
import { getSpaceCategoryAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'

interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

type CategoryAnalyzeItem = {
  category?: string
  count?: number
  totalSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  queryAll: false,
  queryPublic: false,
})

const dataList = ref<CategoryAnalyzeItem[]>([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  const res = await getSpaceCategoryAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data as unknown as CategoryAnalyzeItem[]
  } else {
    message.error('获取分析数据失败，' + res.data.message)
  }
  loading.value = false
}

watchEffect(() => {
  fetchData()
})

const options = computed(() => {
  const categories = dataList.value.map((item) => item.category || '未分类')
  const countData = dataList.value.map((item) => item.count ?? 0)
  const sizeData = dataList.value.map((item) =>
    Number(((item.totalSize ?? 0) / (1024 * 1024)).toFixed(2)),
  )

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['素材数量', '素材总大小'], top: 'bottom' },
    xAxis: { type: 'category', data: categories },
    yAxis: [
      {
        type: 'value',
        name: '素材数量',
      },
      {
        type: 'value',
        name: '素材总大小 (MB)',
        position: 'right',
      },
    ],
    series: [
      { name: '素材数量', type: 'bar', data: countData, yAxisIndex: 0 },
      { name: '素材总大小', type: 'bar', data: sizeData, yAxisIndex: 1 },
    ],
  }
})
</script>

<style scoped lang="less">
.analyze-shell :deep(.ant-card) {
  height: 100%;
}
</style>
