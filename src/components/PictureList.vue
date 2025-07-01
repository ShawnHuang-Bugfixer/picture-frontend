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
      <template #renderItem="{ item: picture }">
        <a-list-item style="padding: 0">
          <a-card class="picture-card" hoverable @click="doClickPicture(picture)">
            <template #cover>
              <img
                :alt="picture.name"
                :src="picture.thumbnailUrl ?? picture.url"
                class="picture-img"
              />
            </template>
            <a-card-meta :title="picture.name">
              <template #description>
                <a-flex>
                  <a-tag color="green">
                    {{ picture.category ?? '默认' }}
                  </a-tag>
                  <a-tag v-for="tag in picture.tags" :key="tag">
                    {{ tag }}
                  </a-tag>
                </a-flex>
              </template>
            </a-card-meta>
            <template v-if="showOp" #actions>
              <ShareAltOutlined @click.stop="doShare(picture, $event)" />
              <SearchOutlined @click.stop="doSearch(picture, $event)" />
              <EditOutlined v-if="canEdit" @click.stop="doEdit(picture, $event)" />
              <DeleteOutlined v-if="canDelete" @click.stop="doDelete(picture, $event)" />
            </template>
          </a-card>
        </a-list-item>
      </template>
    </a-list>
    <div v-if="infinite && loading" class="infinite-loading">加载中...</div>
    <div v-if="infinite && finished && pictures.length === 0" class="infinite-empty">暂无图片</div>
    <!-- Intersection Observer 锚点 -->
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
let observer: IntersectionObserver | null = null
let lastLoadTime = 0 // 记录上次加载时间
const LOAD_INTERVAL = 500 // 设置最小加载间隔

// 通知父组件加载状态变化
watch(loading, (newVal) => {
  emit('loading-change', newVal)
})

const fetchPictures = async (reset = false) => {
  // 防止连续快速加载
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
    const res = await listPictureVoByPageUsingPost(params)
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
    message.error('加载图片失败')
  }
}

// 监听 query 变化时重置分页
watch(() => props.query, () => {
  if (props.autoFetch) {
    current.value = 1
    finished.value = false
    fetchPictures(true)
  }
}, { deep: true, immediate: true })

// Observer滚动检测
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

        // 只处理第一个元素
        const entry = entries[0]
        if (entry.isIntersecting) {
          // 增加防抖检测
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
        rootMargin: '0px 0px 200px 0px' // 提前200px加载
      }
    )

    nextTick(() => {
      if (observerAnchor.value && observer) {
        observer.observe(observerAnchor.value)
      }
    })
  }
}

// 重新设置Observer
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

// 当关键属性变化时重置Observer
watch(() => [props.infinite, props.useObserver, props.query], () => {
  if (props.useObserver && props.infinite) {
    nextTick(() => {
      setupObserver()
    })
  }
})

// 跳转至图片详情页
const doClickPicture = (picture: API.PictureVO) => {
  router.push({
    path: `/picture/${picture.id}`,
  })
}

// 搜索
const doSearch = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  window.open(`/search_picture?pictureId=${picture.id}`)
}

// 编辑
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

// 删除数据
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

// ----- 分享操作 ----
const shareModalRef = ref()
const shareLink = ref<string>()
const doShare = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.id}`
  if (shareModalRef.value) {
    shareModalRef.value.openModal()
  }
}

// 暴露重置方法，供父组件调用
defineExpose({
  resetObserver
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';
.picture-card {
  background: @card-bg;
  border-radius: @border-radius;
  box-shadow: @shadow;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 8px 32px 0 rgba(60, 72, 88, 0.16); }
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
