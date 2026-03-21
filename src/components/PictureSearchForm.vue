<template>
  <div class="picture-search-form">
    <a-form name="searchForm" layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="关键词" name="searchText">
        <a-input v-model:value="searchParams.searchText" placeholder="搜索名称或简介" allow-clear />
      </a-form-item>
      <a-form-item name="category" label="分类">
        <a-auto-complete
          v-model:value="searchParams.category"
          style="min-width: 180px"
          placeholder="输入分类"
          :options="categoryOptions"
          allow-clear
        />
      </a-form-item>
      <a-form-item name="tags" label="标签">
        <a-select
          v-model:value="searchParams.tags"
          style="min-width: 180px"
          mode="tags"
          placeholder="输入标签"
          :options="tagOptions"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="日期" name="dateRange">
        <a-range-picker
          style="width: 320px"
          show-time
          v-model:value="dateRange"
          :placeholder="['开始时间', '结束时间']"
          format="YYYY/MM/DD HH:mm:ss"
          :presets="rangePresets"
          @change="onRangeChange"
        />
      </a-form-item>
      <a-form-item label="名称" name="name">
        <a-input v-model:value="searchParams.name" placeholder="名称" allow-clear />
      </a-form-item>
      <a-form-item label="简介" name="introduction">
        <a-input v-model:value="searchParams.introduction" placeholder="简介" allow-clear />
      </a-form-item>
      <a-form-item label="宽度" name="picWidth">
        <a-input-number v-model:value="searchParams.picWidth" />
      </a-form-item>
      <a-form-item label="高度" name="picHeight">
        <a-input-number v-model:value="searchParams.picHeight" />
      </a-form-item>
      <a-form-item label="格式" name="picFormat">
        <a-input v-model:value="searchParams.picFormat" placeholder="格式" allow-clear />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit">搜索</a-button>
          <a-button html-type="reset" @click="doClear">重置</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import { listPictureTagCategoryUsingGet } from '@/api/pictureController.ts'

interface Props {
  onSearch?: (searchParams: API.PictureQueryRequest) => void
}

type SelectOption = {
  value: string
  label: string
}

const props = defineProps<Props>()
const searchParams = reactive<API.PictureQueryRequest>({})
const categoryOptions = ref<SelectOption[]>([])
const tagOptions = ref<SelectOption[]>([])
const dateRange = ref<any[]>([])

const doSearch = () => {
  props.onSearch?.(searchParams)
}

const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagOptions.value = (res.data.data.tagList ?? []).map((item: string) => ({
      value: item,
      label: item,
    }))
    categoryOptions.value = (res.data.data.categoryList ?? []).map((item: string) => ({
      value: item,
      label: item,
    }))
    return
  }
  message.error('获取标签和分类失败，' + res.data.message)
}

onMounted(() => {
  getTagCategoryOptions()
})

const onRangeChange = (dates: any[]) => {
  if (dates?.length >= 2) {
    searchParams.startEditTime = dates[0].toDate()
    searchParams.endEditTime = dates[1].toDate()
  } else {
    searchParams.startEditTime = undefined
    searchParams.endEditTime = undefined
  }
}

const rangePresets = ref([
  { label: '过去 7 天', value: [dayjs().add(-7, 'd'), dayjs()] },
  { label: '过去 14 天', value: [dayjs().add(-14, 'd'), dayjs()] },
  { label: '过去 30 天', value: [dayjs().add(-30, 'd'), dayjs()] },
  { label: '过去 90 天', value: [dayjs().add(-90, 'd'), dayjs()] },
])

const doClear = () => {
  Object.keys(searchParams).forEach((key) => {
    ;(searchParams as Record<string, unknown>)[key] = undefined
  })
  dateRange.value = []
  props.onSearch?.(searchParams)
}
</script>

<style scoped lang="less">
.picture-search-form :deep(.ant-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 0;
}
</style>
