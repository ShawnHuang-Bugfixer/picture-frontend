<template>
  <div ref="listRef" class="picture-list" :style="infinite ? 'height:60vh;overflow:auto;' : ''">
    <div class="picture-list__columns" :style="columnsStyle">
      <div
        v-for="(column, columnIndex) in masonryColumns"
        :key="`column-${columnIndex}`"
        class="picture-list__column"
      >
        <div
          v-for="(item, itemIndex) in column"
          :key="item.id ?? `${columnIndex}-${itemIndex}`"
          class="picture-list__item"
        >
          <slot name="renderItem" :item="item">
            <MediaMasonryCard
              :src="item.thumbnailUrl ?? item.url"
              :thumbnail-src="item.thumbnailUrl ?? item.url"
              :alt="item.name || '素材预览'"
              :title="item.name || '未命名素材'"
              :subtitle="item.introduction || ''"
              :eyebrow="isVideoItem(item) ? '视频素材' : '图片素材'"
              :is-video="isVideoItem(item)"
              :preview-width="item.picWidth"
              :preview-height="item.picHeight"
              :revealed="isCardRevealed(item.id)"
              @card-click="handleCardClick(item)"
            >
              <template #meta>
                <a-tag color="green">
                  {{ item.category || '默认' }}
                </a-tag>
                <a-tag v-for="tag in item.tags || []" :key="tag">
                  {{ tag }}
                </a-tag>
                <span v-if="showId && item.id" class="picture-card__id">
                  ID:
                  <a class="picture-card__id-link" @click.stop="copyId(item.id)">
                    {{ item.id }}
                  </a>
                </span>
              </template>

              <template v-if="showOp" #actions>
                <a-button
                  v-if="showShare"
                  type="text"
                  class="picture-card__action-btn"
                  @click.stop="doShare(item, $event)"
                >
                  <template #icon><ShareAltOutlined /></template>
                </a-button>
                <a-button
                  v-if="showSearch"
                  type="text"
                  class="picture-card__action-btn"
                  @click.stop="doSearch(item, $event)"
                >
                  <template #icon><SearchOutlined /></template>
                </a-button>
                <a-button
                  v-if="canEdit"
                  type="text"
                  class="picture-card__action-btn"
                  @click.stop="doEdit(item, $event)"
                >
                  <template #icon><EditOutlined /></template>
                </a-button>
                <a-button
                  v-if="canDelete"
                  type="text"
                  danger
                  class="picture-card__action-btn"
                  @click.stop="doDelete(item, $event)"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
                <a-button
                  v-if="showSuperResolution && onSuperResolution"
                  type="link"
                  class="picture-card__cta"
                  @click.stop="doSuperResolution(item, $event)"
                >
                  AI超分
                </a-button>
                <a-button
                  v-if="showId && onAppeal"
                  type="link"
                  class="picture-card__cta picture-card__cta--warning"
                  @click.stop="props.onAppeal?.(item)"
                >
                  申诉
                </a-button>
              </template>
            </MediaMasonryCard>
          </slot>
        </div>
      </div>
    </div>

    <div v-if="infinite && loading" class="infinite-loading">加载中...</div>
    <div v-if="infinite && finished && pictures.length === 0" class="infinite-empty">暂无素材</div>
    <div v-if="infinite" ref="observerAnchor" class="observer-anchor"></div>
  </div>
  <ShareModal ref="shareModalRef" title="分享素材" :link="shareLink" />
</template>

<script setup lang="ts">
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { deletePictureUsingPost, listPictureVoByPageUsingPost } from '@/api/pictureController.ts'
import ShareModal from '@/components/ShareModal.vue'
import MediaMasonryCard from '@/components/media/MediaMasonryCard.vue'

interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOp?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onReload?: () => void
  query?: Partial<API.PictureQueryRequest>
  autoFetch?: boolean
  infinite?: boolean
  useObserver?: boolean
  fetchFunc?: (params: any) => Promise<any>
  showShare?: boolean
  showSearch?: boolean
  showId?: boolean
  showSuperResolution?: boolean
  onSuperResolution?: (picture: API.PictureVO) => void
  onAppeal?: (picture: API.PictureVO) => void
}

const MASONRY_GAP = 16
const MASONRY_GAP_MOBILE = 12
const videoFormatSet = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'])

const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOp: false,
  canEdit: false,
  canDelete: false,
  autoFetch: false,
  infinite: false,
  useObserver: false,
  showShare: true,
  showSearch: true,
  showId: false,
  showSuperResolution: false,
  onSuperResolution: undefined,
  onAppeal: undefined,
})

const emit = defineEmits(['loading-change'])

const router = useRouter()
const pictures = ref<API.PictureVO[]>([])
const loading = ref(false)
const finished = ref(false)
const current = ref(1)
const total = ref(0)
const pageSize = ref(20)
const listRef = ref<HTMLElement | null>(null)
const observerAnchor = ref<HTMLElement | null>(null)
const shareModalRef = ref<{ openModal: () => void } | null>(null)
const shareLink = ref('')
const isTouchDevice = ref(false)
const revealedCardId = ref<number | string | undefined>()
const containerWidth = ref(0)
let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let lastLoadTime = 0
const LOAD_INTERVAL = 500

const displayList = computed(() => (props.autoFetch ? pictures.value : props.dataList))

const currentGap = computed(() => (containerWidth.value <= 768 ? MASONRY_GAP_MOBILE : MASONRY_GAP))

const columnCount = computed(() => {
  if (containerWidth.value <= 520) return 1
  if (containerWidth.value <= 768) return 2
  if (containerWidth.value <= 1200) return 3
  if (containerWidth.value <= 1440) return 4
  return 5
})

const columnsStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columnCount.value}, minmax(0, 1fr))`,
  gap: `${currentGap.value}px`,
}))

const estimateCardHeight = (item: API.PictureVO) => {
  const width = Number(item.picWidth)
  const height = Number(item.picHeight)
  const ratioHeight = width > 0 && height > 0 ? height / width : 1.25
  const infoWeight = props.showOp ? 0.42 : 0.26
  return ratioHeight + infoWeight
}

const masonryColumns = computed(() => {
  const columns: API.PictureVO[][] = Array.from({ length: columnCount.value }, () => [])
  const heights = Array.from({ length: columnCount.value }, () => 0)

  displayList.value.forEach((item) => {
    let shortestColumnIndex = 0
    for (let index = 1; index < heights.length; index += 1) {
      if (heights[index] < heights[shortestColumnIndex]) {
        shortestColumnIndex = index
      }
    }
    columns[shortestColumnIndex].push(item)
    heights[shortestColumnIndex] += estimateCardHeight(item)
  })

  return columns
})

watch(loading, (newVal) => {
  emit('loading-change', newVal)
})

const updateTouchMode = () => {
  if (typeof window === 'undefined') return
  isTouchDevice.value = window.matchMedia('(hover: none), (pointer: coarse)').matches
  if (!isTouchDevice.value) {
    revealedCardId.value = undefined
  }
}

const updateContainerWidth = () => {
  containerWidth.value = listRef.value?.getBoundingClientRect().width || 0
}

const collapseReveal = () => {
  revealedCardId.value = undefined
}

const handleOutsidePointerDown = (event: PointerEvent) => {
  const target = event.target as Node | null
  if (!target || !listRef.value) return
  if (!listRef.value.contains(target)) {
    collapseReveal()
  }
}

const fetchPictures = async (reset = false) => {
  const now = Date.now()
  if (now - lastLoadTime < LOAD_INTERVAL) {
    return
  }

  if (!props.autoFetch || !props.query || loading.value || (finished.value && !reset)) return
  loading.value = true
  lastLoadTime = Date.now()

  const params = {
    ...(props.query || {}),
    current: reset ? 1 : current.value,
    pageSize: props.query?.pageSize || pageSize.value,
  }

  try {
    const fetchApi = props.fetchFunc || listPictureVoByPageUsingPost
    const res = await fetchApi(params)
    loading.value = false
    if (res.data.code === 0 && res.data.data) {
      const list = res.data.data.records || []
      total.value = Number(res.data.data.total) || 0
      if (reset) {
        pictures.value = list
        current.value = 1
      } else {
        pictures.value = [...pictures.value, ...list]
      }
      finished.value = pictures.value.length >= total.value || list.length === 0
    }
  } catch (error) {
    loading.value = false
    message.error('加载素材失败')
  }
}

watch(
  () => props.query,
  () => {
    if (props.autoFetch) {
      current.value = 1
      finished.value = false
      fetchPictures(true)
    }
  },
  { deep: true, immediate: true },
)

const setupObserver = () => {
  if (!props.useObserver || !props.infinite) return

  if (observer) {
    observer.disconnect()
    observer = null
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (!props.infinite || finished.value || loading.value) return

        const entry = entries[0]
        if (entry.isIntersecting) {
          const now = Date.now()
          if (now - lastLoadTime > LOAD_INTERVAL) {
            current.value += 1
            fetchPictures()
          }
        }
      },
      {
        root: listRef.value,
        threshold: 0.1,
        rootMargin: '0px 0px 240px 0px',
      },
    )

    nextTick(() => {
      if (observerAnchor.value && observer) {
        observer.observe(observerAnchor.value)
      }
    })
  }
}

const resetObserver = () => {
  if (props.useObserver) {
    setupObserver()
  }
}

onMounted(() => {
  updateTouchMode()
  updateContainerWidth()
  if (props.autoFetch && !props.infinite) fetchPictures(true)
  if (props.useObserver && props.infinite) {
    setupObserver()
  }
  if ('ResizeObserver' in window && listRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerWidth()
    })
    resizeObserver.observe(listRef.value)
  }
  window.addEventListener('resize', updateTouchMode)
  document.addEventListener('pointerdown', handleOutsidePointerDown)
  listRef.value?.addEventListener('scroll', collapseReveal, { passive: true })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', updateTouchMode)
  document.removeEventListener('pointerdown', handleOutsidePointerDown)
  listRef.value?.removeEventListener('scroll', collapseReveal)
})

watch(
  () => [props.infinite, props.useObserver, props.query],
  () => {
    if (props.useObserver && props.infinite) {
      nextTick(() => {
        setupObserver()
      })
    }
  },
)

const doClickPicture = (picture: API.PictureVO) => {
  router.push({
    path: `/picture/${picture.id}`,
  })
}

const handleCardClick = (picture: API.PictureVO) => {
  if (isTouchDevice.value && revealedCardId.value !== picture.id) {
    revealedCardId.value = picture.id
    return
  }
  doClickPicture(picture)
}

const doSearch = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  window.open(`/search_picture?pictureId=${picture.id}`)
}

const doEdit = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  router.push({
    path: '/add_picture',
    query: {
      id: picture.id,
      spaceId: picture.spaceId,
    },
  })
}

const doDelete = async (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  const id = picture.id
  if (!id) return
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    props.onReload?.()
    if (props.autoFetch) fetchPictures(true)
  } else {
    message.error('删除失败')
  }
}

const doSuperResolution = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  props.onSuperResolution?.(picture)
}

const isVideoItem = (picture: API.PictureVO) => {
  const format = (picture.picFormat || '').toLowerCase()
  return videoFormatSet.has(format)
}

const isCardRevealed = (id?: number | string) => {
  return isTouchDevice.value && revealedCardId.value === id
}

const doShare = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.id}`
  shareModalRef.value?.openModal()
}

const copyId = (id: string | number) => {
  if (!id) return
  const text = String(id)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(
      () => {
        message.success('已复制')
      },
      () => {
        message.error('复制失败')
      },
    )
  } else {
    const input = document.createElement('input')
    input.value = text
    document.body.appendChild(input)
    input.select()
    try {
      document.execCommand('copy')
      message.success('已复制')
    } catch (e) {
      message.error('复制失败')
    }
    document.body.removeChild(input)
  }
}

defineExpose({
  resetObserver,
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.picture-list__columns {
  display: grid;
  align-items: start;
}

.picture-list__column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.picture-card__id {
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 500;
}

.picture-card__id-link {
  color: #ffffff;
  user-select: all;
}

.picture-card__action-btn {
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: @border-radius-pill;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.picture-card__action-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.picture-card__cta {
  min-width: 0;
  height: 38px;
  padding: 0 12px;
  border-radius: @border-radius-pill;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-weight: 600;
}

.picture-card__cta:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.22);
}

.picture-card__cta--warning {
  color: #ffe58f;
}

.picture-list :deep(.ant-tag) {
  border: 0;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.infinite-loading {
  padding: 16px 0;
  color: @text-secondary;
  text-align: center;
}

.infinite-empty {
  padding: 32px 0;
  color: @text-secondary;
  text-align: center;
}

.observer-anchor {
  height: 1px;
  pointer-events: none;
}

@media (max-width: 768px) {
  .picture-list__column {
    gap: 12px;
  }

  .picture-card__action-btn,
  .picture-card__cta {
    height: 34px;
  }
}
</style>
