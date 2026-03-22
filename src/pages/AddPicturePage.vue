<template>
  <div id="addPicturePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">{{ pageTitle }}</h2>
        <p class="app-page__subtitle">
          {{ pageSubtitle }}
        </p>
      </div>
      <div class="app-page__actions">
        <a-button v-if="showBackToResultCenter" @click="backToResultCenter">返回结果中心</a-button>
        <a-button v-else-if="resolvedSpaceId" :href="`/space/${resolvedSpaceId}`" target="_blank">
          返回工作空间
        </a-button>
      </div>
    </section>

    <div class="task-grid">
      <section class="app-card upload-card">
        <div class="card-head">
          <h3 class="app-section-title">{{ uploadCardTitle }}</h3>
          <p class="app-section-desc">{{ uploadCardDesc }}</p>
        </div>
        <a-tabs v-model:activeKey="uploadType">
          <a-tab-pane key="file" tab="文件上传">
            <PictureUpload :picture="picture" :spaceId="resolvedSpaceId" :onSuccess="onSuccess" />
          </a-tab-pane>
          <a-tab-pane v-if="!isGalleryUploadMode" key="url" tab="URL 导入" force-render>
            <UrlPictureUpload
              :picture="picture"
              :spaceId="resolvedSpaceId"
              :onSuccess="onSuccess"
            />
          </a-tab-pane>
        </a-tabs>
      </section>

      <section class="app-card info-card">
        <div class="card-head">
          <h3 class="app-section-title">{{ infoCardTitle }}</h3>
          <p class="app-section-desc">{{ infoCardDesc }}</p>
        </div>
        <a-form name="pictureForm" layout="vertical" :model="pictureForm" @finish="handleSubmit">
          <a-form-item name="name" label="名称">
            <a-input v-model:value="pictureForm.name" placeholder="请输入名称" allow-clear />
          </a-form-item>
          <a-form-item name="introduction" label="简介">
            <a-textarea
              v-model:value="pictureForm.introduction"
              placeholder="请输入简介"
              :auto-size="{ minRows: 2, maxRows: 5 }"
              allow-clear
            />
          </a-form-item>
          <a-form-item name="category" label="分类">
            <a-auto-complete
              v-model:value="pictureForm.category"
              placeholder="请输入分类"
              :options="categoryOptions"
              allow-clear
            />
          </a-form-item>
          <a-form-item name="tags" label="标签">
            <a-select
              v-model:value="pictureForm.tags"
              mode="tags"
              placeholder="输入标签后回车"
              :options="tagOptions"
              allow-clear
            />
          </a-form-item>
          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              style="width: 100%"
              :disabled="!picture?.id"
            >
              保存信息
            </a-button>
          </a-form-item>
        </a-form>
      </section>
    </div>

    <section v-if="picture?.id && !isGalleryUploadMode" class="app-card tool-card">
      <div class="card-head">
        <h3 class="app-section-title">后续处理</h3>
        <p class="app-section-desc">
          上传成功后即可继续裁剪、扩图，并直接提交图片或视频超分任务。
        </p>
      </div>
      <div class="tool-actions">
        <a-button @click="doEditPicture">裁剪素材</a-button>
        <a-button type="primary" ghost @click="doImagePainting">AI 扩图</a-button>
        <a-button type="primary" @click="doSuperResolution">提交超分任务</a-button>
        <a-button @click="showEditInfoModal = true">再次编辑信息</a-button>
      </div>
    </section>

    <ImageCropper
      ref="imageCropperRef"
      :imageUrl="picture?.url"
      :picture="picture"
      :spaceId="resolvedSpaceId"
      :space="space"
      :onSuccess="onCropSuccess"
    />
    <ImageOutPainting
      ref="imageOutPaintingRef"
      :picture="picture"
      :spaceId="resolvedSpaceId"
      :onSuccess="onImageOutPaintingSuccess"
    />
    <ImageSuperResolution
      ref="imageSuperResolutionRef"
      :picture="picture"
      :onSuccess="onSuperResolutionTaskCreated"
    />

    <a-modal
      v-model:open="showEditInfoModal"
      title="素材信息"
      :footer="null"
      @cancel="showEditInfoModal = false"
    >
      <a-form
        name="pictureModalForm"
        layout="vertical"
        :model="pictureForm"
        @finish="handleSubmitModal"
      >
        <a-form-item name="name" label="名称">
          <a-input v-model:value="pictureForm.name" placeholder="请输入名称" allow-clear />
        </a-form-item>
        <a-form-item name="introduction" label="简介">
          <a-textarea
            v-model:value="pictureForm.introduction"
            placeholder="请输入简介"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            allow-clear
          />
        </a-form-item>
        <a-form-item name="category" label="分类">
          <a-auto-complete
            v-model:value="pictureForm.category"
            placeholder="请输入分类"
            :options="categoryOptions"
            allow-clear
          />
        </a-form-item>
        <a-form-item name="tags" label="标签">
          <a-select v-model:value="pictureForm.tags" mode="tags" :options="tagOptions" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" style="width: 100%">保存</a-button>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
} from '@/api/pictureController.ts'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import ImageCropper from '@/components/ImageCropper.vue'
import ImageOutPainting from '@/components/ImageOutPainting.vue'
import ImageSuperResolution from '@/components/ImageSuperResolution.vue'
import PictureUpload from '@/components/PictureUpload.vue'
import UrlPictureUpload from '@/components/UrlPictureUpload.vue'

type SelectOption = {
  value: string
  label: string
}

const router = useRouter()
const route = useRoute()

const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureEditRequest>({
  tags: [],
})
const uploadType = ref<'file' | 'url'>('file')
const categoryOptions = ref<SelectOption[]>([])
const tagOptions = ref<SelectOption[]>([])
const space = ref<API.SpaceVO>()
const showEditInfoModal = ref(false)
const imageCropperRef = ref()
const imageOutPaintingRef = ref()
const imageSuperResolutionRef = ref()

const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value ?? undefined
}

const resolvedSpaceId = computed(() => normalizeQueryValue(route.query?.spaceId))
const pictureId = computed(() => normalizeQueryValue(route.query?.id))
const sourceSpaceId = computed(() => normalizeQueryValue(route.query?.sourceSpaceId))
const isGalleryUploadMode = computed(() => normalizeQueryValue(route.query?.galleryUpload) === '1')
const showBackToResultCenter = computed(() => isGalleryUploadMode.value && Boolean(sourceSpaceId.value))

const pageTitle = computed(() => {
  if (isGalleryUploadMode.value) {
    return '上传至展厅'
  }
  return pictureId.value ? '编辑素材' : '发起超分任务'
})

const pageSubtitle = computed(() => {
  if (isGalleryUploadMode.value) {
    return '复用现有素材上传页，选择本地图片上传到展厅，并完善名称、分类和标签信息。'
  }
  return '在同一个页面里完成素材上传、基础信息编辑、裁剪、扩图和超分任务提交，减少在多个页面间来回切换。'
})

const uploadCardTitle = computed(() => (isGalleryUploadMode.value ? '展厅素材' : '任务素材'))
const uploadCardDesc = computed(() => {
  if (isGalleryUploadMode.value) {
    return '仅支持本地文件上传，上传后素材将进入展厅内容链路。'
  }
  return '支持文件上传和 URL 导入，图片与视频会统一进入当前任务流。'
})

const infoCardTitle = computed(() => (isGalleryUploadMode.value ? '展厅信息' : '任务信息'))
const infoCardDesc = computed(() => {
  if (isGalleryUploadMode.value) {
    return '补齐名称、简介、分类和标签，便于后续在展厅中检索和展示。'
  }
  return '补齐名称、简介、分类和标签，便于后续检索、筛选和结果沉淀。'
})

const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
  pictureForm.name = newPicture.name
  pictureForm.introduction = newPicture.introduction
  pictureForm.category = newPicture.category
  pictureForm.tags = newPicture.tags
}

const handleSubmit = async () => {
  if (!picture.value?.id) {
    return
  }

  const res = await editPictureUsingPost({
    id: picture.value.id,
    ...pictureForm,
  })
  if (res.data.code === 0 && res.data.data) {
    message.success('保存成功')
    router.push({
      path: `/picture/${picture.value.id}`,
    })
    return
  }
  message.error(`保存失败，${res.data.message || '请稍后重试'}`)
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
  message.error(`获取标签与分类失败，${res.data.message || '请稍后重试'}`)
}

const getOldPicture = async () => {
  if (!pictureId.value) {
    return
  }

  const res = await getPictureVoByIdUsingGet({
    id: pictureId.value as any,
  })
  if (res.data.code === 0 && res.data.data) {
    const data = res.data.data
    picture.value = data
    pictureForm.name = data.name
    pictureForm.introduction = data.introduction
    pictureForm.category = data.category
    pictureForm.tags = data.tags
  }
}

const doEditPicture = () => {
  imageCropperRef.value?.openModal()
}

const onCropSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
}

const doImagePainting = () => {
  imageOutPaintingRef.value?.openModal()
}

const onImageOutPaintingSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
}

const doSuperResolution = () => {
  imageSuperResolutionRef.value?.openModal()
}

const onSuperResolutionTaskCreated = (taskId: string) => {
  message.success(`任务 ${taskId} 已进入处理队列`)
  if (resolvedSpaceId.value) {
    router.push(`/space/${resolvedSpaceId.value}/sr_result`)
    return
  }
  if (picture.value?.id) {
    router.push(`/picture/${picture.value.id}`)
  }
}

const fetchSpace = async () => {
  if (!resolvedSpaceId.value) {
    return
  }

  const res = await getSpaceVoByIdUsingGet({
    id: resolvedSpaceId.value as any,
  })
  if (res.data.code === 0 && res.data.data) {
    space.value = res.data.data
  }
}

const handleSubmitModal = async () => {
  await handleSubmit()
  showEditInfoModal.value = false
}

const backToResultCenter = () => {
  if (!sourceSpaceId.value) {
    return
  }
  router.push(`/space/${sourceSpaceId.value}/sr_result`)
}

watchEffect(() => {
  fetchSpace()
})

onMounted(() => {
  if (isGalleryUploadMode.value) {
    uploadType.value = 'file'
  }
  getTagCategoryOptions()
  getOldPicture()
})
</script>

<style scoped lang="less">
.task-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.upload-card,
.info-card,
.tool-card {
  padding: 24px;
}

.card-head {
  margin-bottom: 18px;
}

.tool-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 1080px) {
  .task-grid {
    grid-template-columns: 1fr;
  }
}
</style>
