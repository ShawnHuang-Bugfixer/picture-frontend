<template>
  <div id="uploadCasePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">{{ pageTitle }}</h2>
        <p class="app-page__subtitle">{{ pageSubtitle }}</p>
      </div>
      <div class="app-page__actions">
        <a-button v-if="showBackToResultCenter" @click="backToResultCenter">返回结果中心</a-button>
        <a-button @click="$router.push('/search_picture')">查看超分案例库</a-button>
      </div>
    </section>

    <div class="task-grid">
      <section class="app-card upload-card">
        <div class="card-head">
          <h3 class="app-section-title">案例素材</h3>
          <p class="app-section-desc">上传图片或视频作为案例样例，整理完成后发布到超分案例库。</p>
        </div>
        <a-tabs v-model:activeKey="uploadType">
          <a-tab-pane key="file" tab="文件上传">
            <PictureUpload :picture="picture" :onSuccess="onSuccess" />
          </a-tab-pane>
          <a-tab-pane key="url" tab="URL 导入" force-render>
            <UrlPictureUpload :picture="picture" :onSuccess="onSuccess" />
          </a-tab-pane>
        </a-tabs>
      </section>

      <section class="app-card info-card">
        <div class="card-head">
          <h3 class="app-section-title">案例信息</h3>
          <p class="app-section-desc">
            补齐标题、简介、分类和标签，便于后续在案例库中检索和展示。
          </p>
        </div>
        <a-form name="pictureForm" layout="vertical" :model="pictureForm" @finish="handleSubmit">
          <a-form-item name="name" label="名称">
            <a-input v-model:value="pictureForm.name" placeholder="请输入案例名称" allow-clear />
          </a-form-item>
          <a-form-item name="introduction" label="简介">
            <a-textarea
              v-model:value="pictureForm.introduction"
              placeholder="请输入案例简介"
              :auto-size="{ minRows: 2, maxRows: 5 }"
              allow-clear
            />
          </a-form-item>
          <a-form-item name="category" label="分类">
            <a-auto-complete
              v-model:value="pictureForm.category"
              placeholder="请输入案例分类"
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
              保存并查看案例
            </a-button>
          </a-form-item>
        </a-form>
      </section>
    </div>

    <section v-if="picture?.id" class="app-card tool-card">
      <div class="card-head">
        <h3 class="app-section-title">案例完善</h3>
        <p class="app-section-desc">上传完成后可以继续裁剪或扩图，让案例更清楚地展示修复效果。</p>
      </div>
      <div class="tool-actions">
        <a-button @click="doEditPicture">裁剪素材</a-button>
        <a-button type="primary" ghost @click="doImagePainting">AI 扩图</a-button>
        <a-button @click="showEditInfoModal = true">再次编辑信息</a-button>
      </div>
    </section>

    <ImageCropper
      ref="imageCropperRef"
      :imageUrl="picture?.url"
      :picture="picture"
      :onSuccess="onCropSuccess"
    />
    <ImageOutPainting
      ref="imageOutPaintingRef"
      :picture="picture"
      :onSuccess="onImageOutPaintingSuccess"
    />

    <a-modal
      v-model:open="showEditInfoModal"
      title="案例信息"
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
          <a-input v-model:value="pictureForm.name" placeholder="请输入案例名称" allow-clear />
        </a-form-item>
        <a-form-item name="introduction" label="简介">
          <a-textarea
            v-model:value="pictureForm.introduction"
            placeholder="请输入案例简介"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            allow-clear
          />
        </a-form-item>
        <a-form-item name="category" label="分类">
          <a-auto-complete
            v-model:value="pictureForm.category"
            placeholder="请输入案例分类"
            :options="categoryOptions"
            allow-clear
          />
        </a-form-item>
        <a-form-item name="tags" label="标签">
          <a-select
            v-model:value="pictureForm.tags"
            mode="tags"
            :options="tagOptions"
            allow-clear
          />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
} from '@/api/pictureController.ts'
import ImageCropper from '@/components/ImageCropper.vue'
import ImageOutPainting from '@/components/ImageOutPainting.vue'
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
const showEditInfoModal = ref(false)
const imageCropperRef = ref()
const imageOutPaintingRef = ref()

const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value ?? undefined
}

const pictureId = computed(() => normalizeQueryValue(route.query?.id))
const sourceSpaceId = computed(() => normalizeQueryValue(route.query?.sourceSpaceId))
const showBackToResultCenter = computed(() => Boolean(sourceSpaceId.value))

const pageTitle = computed(() => (pictureId.value ? '编辑超分案例' : '上传超分案例'))
const pageSubtitle = computed(() => '上传处理前后的样例，补充信息后发布到超分案例库。')

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
    message.success('案例信息保存成功')
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

onMounted(() => {
  const routeUploadType = normalizeQueryValue(route.query?.uploadType)
  if (routeUploadType === 'url') {
    uploadType.value = 'url'
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
