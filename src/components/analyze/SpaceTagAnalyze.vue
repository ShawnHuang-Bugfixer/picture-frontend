<template>
  <div class="analyze-shell">
    <a-card title="素材标签分析">
      <v-chart class="analyze-chart" :option="options" :loading="loading" autoresize />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import 'echarts'
import 'echarts-wordcloud'
import { computed, ref, watchEffect } from 'vue'
import { message } from 'ant-design-vue'
import { getSpaceTagAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'

interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

type TagAnalyzeItem = {
  tag?: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  queryAll: false,
  queryPublic: false,
})

const dataList = ref<TagAnalyzeItem[]>([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  const res = await getSpaceTagAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data as unknown as TagAnalyzeItem[]
  } else {
    message.error('获取分析数据失败，' + res.data.message)
  }
  loading.value = false
}

watchEffect(() => {
  fetchData()
})

const options = computed(() => {
  const tagData = dataList.value.map((item) => ({
    name: item.tag || '未标记',
    value: item.count ?? 0,
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number }) => `${params.name}: ${params.value} 次`,
    },
    series: [
      {
        type: 'wordCloud',
        gridSize: 10,
        sizeRange: [12, 50],
        rotationRange: [-90, 90],
        shape: 'circle',
        textStyle: {
          color: () =>
            `rgb(${Math.round(Math.random() * 255)}, ${Math.round(
              Math.random() * 255,
            )}, ${Math.round(Math.random() * 255)})`,
        },
        data: tagData,
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
