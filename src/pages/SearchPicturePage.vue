<template>
  <div id="searchPicturePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">{{ isPictureSearchMode ? '案例检索' : '超分案例展厅' }}</h2>
        <p class="app-page__subtitle">
          {{
            isPictureSearchMode
              ? '围绕当前素材查找相似案例，用于参考风格、构图和超分处理效果。'
              : '集中浏览当前可公开查看的图片与视频案例，并统一复用共享图片列表展示逻辑。'
          }}
        </p>
      </div>
    </section>

    <template v-if="isPictureSearchMode">
      <section class="search-grid">
        <div class="app-surface-card source-card">
          <div class="card-head">
            <h3 class="app-section-title">检索源素材</h3>
            <p class="app-section-desc">以当前素材为锚点，查找视觉特征相近的案例结果。</p>
          </div>
          <a-card hoverable>
            <template #cover>
              <video
                v-if="isVideoMedia(picture.picFormat)"
                :src="picture.thumbnailUrl ?? picture.url"
                class="source-image"
                controls
              />
              <img
                v-else
                :alt="picture.name"
                :src="picture.thumbnailUrl ?? picture.url"
                class="source-image"
              />
            </template>
          </a-card>
        </div>

        <div class="app-surface-card result-card">
          <div class="card-head">
            <h3 class="app-section-title">相似案例</h3>
            <p class="app-section-desc">结果继续复用现有相似检索接口，保持按图搜图链路不变。</p>
          </div>
          <a-list
            :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }"
            :data-source="similarResultList"
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
    </template>

    <template v-else>
      <section class="app-surface-card gallery-filter-card">
        <div class="card-head">
          <h3 class="app-section-title">公开案例列表</h3>
          <p class="app-section-desc">保留搜索入口，公开展厅列表统一使用共享图片列表展示逻辑。</p>
        </div>
        <a-input-search
          v-model:value="gallerySearchParams.searchText"
          placeholder="搜索案例名称或简介"
          enter-button="搜索"
          @search="doGallerySearch"
        />
      </section>

      <section class="app-surface-card gallery-card">
        <PictureList :dataList="galleryResultList" :loading="loading" :showOp="false" />

        <a-empty v-if="!loading && galleryResultList.length === 0" description="暂无公开案例" />
        <div v-if="loading" class="load-status">案例加载中...</div>
        <div v-else-if="galleryFinished && galleryResultList.length > 0" class="load-status">
          已经看到全部案例了
        </div>
        <div ref="galleryLoadMoreTrigger" class="load-trigger"></div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  getPictureVoByIdUsingGet,
  listPictureVoByPageUsingPost,
  searchPictureByPictureUsingPost,
} from '@/api/pictureController.ts'
import PictureList from '@/components/PictureList.vue'
import { isVideoMedia } from '@/constants/srTask.ts'

const route = useRoute()

const picture = ref<API.PictureVO>({})
const similarResultList = ref<API.ImageSearchResult[]>([])
const galleryResultList = ref<API.PictureVO[]>([])
const galleryLoadMoreTrigger = ref<HTMLDivElement>()
const loading = ref(false)
const galleryFinished = ref(false)
const galleryPage = ref(1)
const galleryPageSize = 20
let galleryObserver: IntersectionObserver | null = null

const gallerySearchParams = reactive<API.PictureQueryRequest>({
  searchText: '',
  sortField: 'createTime',
  sortOrder: 'descend',
})

const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value ?? undefined
}

const pictureId = computed(() => normalizeQueryValue(route.query?.pictureId))
const isPictureSearchMode = computed(() => Boolean(pictureId.value))

const fetchPictureDetail = async () => {
  if (!pictureId.value) {
    picture.value = {}
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
    picture.value = {}
    message.error(`获取素材详情失败，${res.data.message || '请稍后重试'}`)
  } catch (error: unknown) {
    picture.value = {}
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`获取素材详情失败，${errorMessage}`)
  }
}

const fetchSimilarResultData = async () => {
  if (!pictureId.value) {
    similarResultList.value = []
    return
  }
  loading.value = true
  try {
    const res = await searchPictureByPictureUsingPost({
      pictureId: pictureId.value as any,
    })
    if (res.data.code === 0 && res.data.data) {
      similarResultList.value = res.data.data ?? []
      return
    }
    similarResultList.value = []
    message.error(`获取检索结果失败，${res.data.message || '请稍后重试'}`)
  } catch (error: unknown) {
    similarResultList.value = []
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`获取检索结果失败，${errorMessage}`)
  } finally {
    loading.value = false
  }
}

const getGalleryQueryParams = () => {
  return {
    ...gallerySearchParams,
    current: galleryPage.value,
    pageSize: galleryPageSize,
  }
}

const fetchGalleryData = async () => {
  if (loading.value || galleryFinished.value || isPictureSearchMode.value) {
    return
  }

  loading.value = true
  try {
    const res = await listPictureVoByPageUsingPost(getGalleryQueryParams())
    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records ?? []
      galleryResultList.value.push(...records)
      if (records.length < galleryPageSize) {
        galleryFinished.value = true
      } else {
        galleryPage.value += 1
      }
      return
    }
    message.error(`加载案例失败，${res.data.message || '请稍后重试'}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`加载案例失败，${errorMessage}`)
  } finally {
    loading.value = false
  }
}

const resetGallerySearch = () => {
  galleryPage.value = 1
  galleryFinished.value = false
  galleryResultList.value = []
}

const doGallerySearch = () => {
  resetGallerySearch()
  fetchGalleryData()
}

const setupGalleryObserver = () => {
  if (galleryObserver) {
    galleryObserver.disconnect()
    galleryObserver = null
  }

  if (isPictureSearchMode.value || !galleryLoadMoreTrigger.value) {
    return
  }

  galleryObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        fetchGalleryData()
      }
    },
    { rootMargin: '100px' },
  )

  galleryObserver.observe(galleryLoadMoreTrigger.value)
}

const loadCurrentModeData = async () => {
  if (isPictureSearchMode.value) {
    resetGallerySearch()
    await fetchPictureDetail()
    await fetchSimilarResultData()
    return
  }

  picture.value = {}
  similarResultList.value = []
  resetGallerySearch()
  await fetchGalleryData()
}

watch(
  () => pictureId.value,
  async () => {
    await loadCurrentModeData()
    setupGalleryObserver()
  },
)

onMounted(async () => {
  await loadCurrentModeData()
  setupGalleryObserver()
})

onBeforeUnmount(() => {
  if (galleryObserver) {
    galleryObserver.disconnect()
    galleryObserver = null
  }
})
</script>

<style scoped lang="less">
.search-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
}

.source-card,
.result-card,
.gallery-filter-card,
.gallery-card {
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

.load-status {
  padding-top: 18px;
  color: #64748b;
  text-align: center;
}

.load-trigger {
  height: 1px;
}

@media (max-width: 1080px) {
  .search-grid {
    grid-template-columns: 1fr;
  }
}
</style>
