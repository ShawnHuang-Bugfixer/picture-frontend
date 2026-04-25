<template>
  <div class="analyze-shell">
    <a-card title="素材大小分布">
      <v-chart class="analyze-chart" :option="options" :loading="loading" autoresize />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import 'echarts'
import { computed, ref, watchEffect } from 'vue'
import { message } from 'ant-design-vue'
import { getSpaceSizeAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'

interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

type SizeAnalyzeItem = {
  sizeRange?: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  queryAll: false,
  queryPublic: false,
})

const dataList = ref<SizeAnalyzeItem[]>([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  const res = await getSpaceSizeAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data as unknown as SizeAnalyzeItem[]
  } else {
    message.error('获取分析数据失败，' + res.data.message)
  }
  loading.value = false
}

watchEffect(() => {
  fetchData()
})

const options = computed(() => {
  const pieData = dataList.value.map((item) => ({
    name: item.sizeRange || '未分类',
    value: item.count ?? 0,
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      top: 'bottom',
    },
    series: [
      {
        name: '素材大小',
        type: 'pie',
        radius: '50%',
        data: pieData,
      },
    ],
  }
})
</script>

<style scoped lang="less">
.analyze-shell {
  min-width: 0;
}

.analyze-shell :deep(.ant-card) {
  height: 100%;
}

.analyze-chart {
  width: 100%;
  height: 320px;
}
</style>
