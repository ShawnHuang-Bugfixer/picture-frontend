<template>
  <div class="batch-edit-picture-modal">
    <a-modal v-model:visible="visible" title="批量编辑素材" :footer="false" @cancel="closeModal">
      <a-typography-paragraph type="secondary">仅对当前页面中的素材生效。</a-typography-paragraph>
      <a-form name="formData" layout="vertical" :model="formData" @finish="handleSubmit">
        <a-form-item name="category" label="分类">
          <a-auto-complete
            v-model:value="formData.category"
            placeholder="输入分类"
            :options="categoryOptions"
            allow-clear
          />
        </a-form-item>
        <a-form-item name="tags" label="标签">
          <a-select
            v-model:value="formData.tags"
            mode="tags"
            placeholder="输入标签"
            :options="tagOptions"
            allow-clear
          />
        </a-form-item>
        <a-form-item name="nameRule" label="命名规则">
          <a-input
            v-model:value="formData.nameRule"
            placeholder="输入命名规则，使用 {序号} 自动生成名称"
            allow-clear
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" style="width: 100%">提交</a-button>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { editPictureByBatchUsingPost, listPictureTagCategoryUsingGet } from '@/api/pictureController.ts'

interface Props {
  pictureList: API.PictureVO[]
  spaceId: string | number
  onSuccess: () => void
}

type SelectOption = {
  value: string
  label: string
}

const props = defineProps<Props>()
const visible = ref(false)

const openModal = () => {
  visible.value = true
}

const closeModal = () => {
  visible.value = false
}

defineExpose({
  openModal,
})

const formData = reactive<API.PictureEditByBatchRequest>({
  category: '',
  tags: [],
  nameRule: '',
})

const handleSubmit = async (values: API.PictureEditByBatchRequest) => {
  const pictureIdList = props.pictureList
    .map((picture) => picture.id)
    .filter((id): id is number => typeof id === 'number')

  if (!pictureIdList.length) {
    message.error('当前没有可批量编辑的素材')
    return
  }

  const res = await editPictureByBatchUsingPost({
    pictureIdList,
    spaceId: props.spaceId as any,
    ...values,
  })
  if (res.data.code === 0 && res.data.data) {
    message.success('操作成功')
    closeModal()
    props.onSuccess?.()
    return
  }
  message.error('操作失败，' + res.data.message)
}

const categoryOptions = ref<SelectOption[]>([])
const tagOptions = ref<SelectOption[]>([])

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
</script>
