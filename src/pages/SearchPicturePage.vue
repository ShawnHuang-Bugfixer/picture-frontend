<template>
  <div id="searchPicturePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">案例检索</h2>
        <p class="app-page__subtitle">围绕当前素材查找相似案例，用于参考风格、构图和超分处理效果。</p>
      </div>
    </section>

    <section class="search-grid">
      <div class="app-card source-card">
        <div class="card-head">
          <h3 class="app-section-title">检索源素材</h3>
          <p class="app-section-desc">以当前素材为锚点，查找视觉特征接近的案例结果。</p>
        </div>
        <a-card hoverable>
          <template #cover>
            <img :alt="picture.name" :src="picture.thumbnailUrl ?? picture.url" class="source-image" />
          </template>
        </a-card>
      </div>

      <div class="app-card result-card">
        <div class="card-head">
          <h3 class="app-section-title">相似案例</h3>
          <p class="app-section-desc">结果复用现有相似检索接口，但前端统一解释为案例探索与参考浏览。</p>
        </div>
        <a-list
          :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }"
          :data-source="dataList"
          :loading="loading"
        >
          <template #renderItem="{ item }">
            <a-list-item style="padding: 0">
              <a :href="item.fromUrl" target="_blank">
                <a-card hoverable class="result-item-card">
                  <template #cover>
                    <img :alt="item.name" :src="item.thumbUrl" class="result-image" />
                  </template>
                </a-card>
              </a>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getPictureVoByIdUsingGet, searchPictureByPictureUsingPost } from '@/api/pictureController.ts'

const route = useRoute()
const picture = ref<API.PictureVO>({})
const dataList = ref<API.ImageSearchResult[]>([])
const loading = ref(true)
const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value ?? undefined
}

const pictureId = computed(() => {
  return normalizeQueryValue(route.query?.pictureId)
})

const fetchPictureDetail = async () => {
  if (!pictureId.value) {
    return
  }
  try {
    const res = await getPictureVoByIdUsingGet({
      id: pictureId.value as any,
    })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      return
    }
    message.error('获取素材详情失败，' + res.data.message)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error('获取素材详情失败，' + errorMessage)
  }
}

const fetchResultData = async () => {
  if (!pictureId.value) {
    return
  }
  loading.value = true
  try {
    const res = await searchPictureByPictureUsingPost({
      pictureId: pictureId.value as any,
    })
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data ?? []
      return
    }
    message.error('获取检索结果失败，' + res.data.message)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error('获取检索结果失败，' + errorMessage)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPictureDetail()
  fetchResultData()
})
</script>

<style scoped lang="less">
.search-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
}

.source-card,
.result-card {
  padding: 24px;
}

.card-head {
  margin-bottom: 16px;
}

.source-image,
.result-image {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.result-item-card {
  overflow: hidden;
}

@media (max-width: 1080px) {
  .search-grid {
    grid-template-columns: 1fr;
  }
}
</style>
