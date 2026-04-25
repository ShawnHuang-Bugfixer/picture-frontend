<template>
  <div class="analyze-shell">
    <a-card title="成员上传行为">
      <template #extra>
        <a-space>
          <a-segmented v-model:value="timeDimension" :options="timeDimensionOptions" />
          <a-input-search placeholder="输入用户 ID" enter-button="筛选" @search="doSearch" />
        </a-space>
      </template>
      <v-chart class="analyze-chart" :option="options" :loading="loading" autoresize />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import 'echarts'
import { computed, ref, watchEffect } from 'vue'
import { message } from 'ant-design-vue'
import { getSpaceUserAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'

interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

type UserAnalyzeItem = {
  period?: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  queryAll: false,
  queryPublic: false,
})

const timeDimension = ref<'day' | 'week' | 'month'>('day')
const timeDimensionOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
]
const userId = ref<number | undefined>()
const dataList = ref<UserAnalyzeItem[]>([])
const loading = ref(true)

const doSearch = (value: string) => {
  userId.value = value ? Number(value) : undefined
}

const fetchData = async () => {
  loading.value = true
  const res = await getSpaceUserAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
    timeDimension: timeDimension.value,
    userId: userId.value,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data as unknown as UserAnalyzeItem[]
  } else {
    message.error('获取分析数据失败，' + res.data.message)
  }
  loading.value = false
}

watchEffect(() => {
  fetchData()
})

const options = computed(() => {
  const periods = dataList.value.map((item) => item.period || '-')
  const counts = dataList.value.map((item) => item.count ?? 0)

  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: periods, name: '时间区间' },
    yAxis: { type: 'value', name: '上传数量' },
    series: [
      {
        name: '上传数量',
        type: 'line',
        data: counts,
        smooth: true,
        emphasis: {
          focus: 'series',
        },
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
