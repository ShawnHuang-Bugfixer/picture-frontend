<template>
  <div
    class="picture-list"
    ref="listRef"
    :style="infinite ? 'height:60vh;overflow:auto;' : ''"
  >
    <a-list
      :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
      :data-source="autoFetch ? pictures : dataList"
      :loading="loading"
    >
      <template #renderItem="slotProps">
        <slot name="renderItem" v-bind="slotProps">
          <a-list-item style="padding: 0">
            <a-card class="picture-card" hoverable @click="doClickPicture(slotProps.item)">
              <template #cover>
                <video
                  v-if="isVideoItem(slotProps.item)"
                  :src="slotProps.item.thumbnailUrl ?? slotProps.item.url"
                  class="picture-img"
                  muted
                  playsinline
                />
                <img
                  v-else
                  :alt="slotProps.item.name"
                  :src="slotProps.item.thumbnailUrl ?? slotProps.item.url"
                  class="picture-img"
                />
              </template>
              <a-card-meta :title="slotProps.item.name">
                <template #description>
                  <a-flex>
                    <a-tag color="green">
                      {{ slotProps.item.category ?? '默认' }}
                    </a-tag>
                    <a-tag v-for="tag in slotProps.item.tags" :key="tag">
                      {{ tag }}
                    </a-tag>
                  </a-flex>
                  <div v-if="showId" style="color: #999; font-size: 12px; margin-top: 4px">
                    ID:
                    <a
                      style="cursor: pointer; user-select: all"
                      @click.stop="copyId(slotProps.item.id)"
                    >
                      {{ slotProps.item.id }}
                    </a>
                  </div>
                </template>
              </a-card-meta>
              <template v-if="showOp" #actions>
                <ShareAltOutlined v-if="showShare" @click.stop="doShare(slotProps.item, $event)" />
                <SearchOutlined
                  v-if="showSearch"
                  @click.stop="doSearch(slotProps.item, $event)"
                />
                <EditOutlined v-if="canEdit" @click.stop="doEdit(slotProps.item, $event)" />
                <DeleteOutlined v-if="canDelete" @click.stop="doDelete(slotProps.item, $event)" />
                <a
                  v-if="showSuperResolution && onSuperResolution"
                  style="color: #1677ff"
                  @click.stop="doSuperResolution(slotProps.item, $event)"
                >
                  AI超分
                </a>
                <a
                  v-if="showId && onAppeal"
                  style="color: #faad14"
                  @click.stop="props.onAppeal?.(slotProps.item)"
                >
                  申诉
                </a>
              </template>
            </a-card>
          </a-list-item>
        </slot>
      </template>
    </a-list>
    <div v-if="infinite && loading" class="infinite-loading">加载中...</div>
    <div v-if="infinite && finished && pictures.length === 0" class="infinite-empty">暂无图片</div>
    <div v-if="infinite" ref="observerAnchor" class="observer-anchor"></div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'
import { deletePictureUsingPost, listPictureVoByPageUsingPost } from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import ShareModal from '@/components/ShareModal.vue'
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

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
const videoFormatSet = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'])

const router = useRouter()
const pictures = ref<API.PictureVO[]>([])
const loading = ref(false)
const finished = ref(false)
const current = ref(1)
const total = ref(0)
const pageSize = ref(20)
const listRef = ref<HTMLElement | null>(null)
const observerAnchor = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let lastLoadTime = 0
const LOAD_INTERVAL = 500

watch(loading, (newVal) => {
  emit('loading-change', newVal)
})

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
      if (pictures.value.length >= total.value || list.length === 0) {
        finished.value = true
      } else {
        finished.value = false
      }
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
        rootMargin: '0px 0px 200px 0px',
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
  if (props.autoFetch && !props.infinite) fetchPictures(true)
  if (props.useObserver && props.infinite) {
    setupObserver()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
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

const shareModalRef = ref()
const shareLink = ref<string>()
const doShare = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.id}`
  if (shareModalRef.value) {
    shareModalRef.value.openModal()
  }
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

.picture-card {
  background: @card-bg;
  border-radius: @border-radius;
  box-shadow: @shadow;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 8px 32px 0 rgba(60, 72, 88, 0.16);
  }
}

.picture-img {
  border-radius: @border-radius;
  object-fit: cover;
  width: 100%;
  height: 180px;
}

.infinite-loading {
  text-align: center;
  color: @text-secondary;
  padding: 16px 0;
}

.infinite-empty {
  text-align: center;
  color: @text-secondary;
  padding: 32px 0;
}

.observer-anchor {
  height: 1px;
  pointer-events: none;
}
</style>
