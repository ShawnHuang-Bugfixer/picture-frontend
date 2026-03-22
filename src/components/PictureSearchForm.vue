<template>
  <div class="picture-search-form">
    <a-form name="searchForm" layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="关键词" name="searchText">
        <a-input
          v-model:value="searchParams.searchText"
          placeholder="搜索名称或简介"
          allow-clear
        />
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

const doClear = () => {
  Object.keys(searchParams).forEach((key) => {
    ;(searchParams as Record<string, unknown>)[key] = undefined
  })
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
