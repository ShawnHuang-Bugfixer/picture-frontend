<template>
  <div id="homePage">
    <!-- 搜索框 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="searchParams.searchText"
        placeholder="从海量图片中搜索"
        enter-button="搜索"
        size="large"
        @search="doSearch"
      />
    </div>

    <!-- 分类和标签筛选 -->
    <a-tabs v-model:active-key="selectedCategory" @change="doSearch">
      <a-tab-pane key="all" tab="全部" />
      <a-tab-pane v-for="category in categoryList" :tab="category" :key="category" />
    </a-tabs>

    <div class="tag-bar">
      <span style="margin-right: 8px">标签：</span>
      <a-space :size="[0, 8]" wrap>
        <a-checkable-tag
          v-for="(tag, index) in tagList"
          :key="tag"
          v-model:checked="selectedTagList[index]"
          @change="doSearch"
        >
          {{ tag }}
        </a-checkable-tag>
      </a-space>
    </div>

    <!-- 图片列表（无限加载） -->
    <PictureList :dataList="dataList" :showOp="false" />

    <!-- 加载提示或结束 -->
    <div class="load-status" v-if="loading">世界那么大，上传你的所见吧！</div>
    <div class="load-status" v-else-if="finished">已加载全部内容</div>
    <div ref="loadMoreTrigger" style="height: 1px"></div>
  </div>
  <!-- 悬浮回到顶部按钮 -->
  <a-button
    class="back-to-top-btn"
    type="primary"
    shape="circle"
    size="large"
    @click="scrollToTop"
    v-show="showBackTop"
  >
    <template #icon>
      <!-- 向上箭头 -->
      <svg viewBox="0 0 1024 1024" width="20" height="20"><path d="M512 320c8.2 0 16.4 3.1 22.6 9.4l288 288c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L544 429.3V800c0 17.7-14.3 32-32 32s-32-14.3-32-32V429.3L246.7 662.7c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l288-288c6.2-6.3 14.4-9.4 22.6-9.4z" fill="#fff"/></svg>
    </template>
  </a-button>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import PictureList from '@/components/PictureList.vue'

const dataList = ref<API.PictureVO[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = 20
const loadMoreTrigger = ref<HTMLDivElement>()

const searchParams = reactive<API.PictureQueryRequest>({
  searchText: '',
  sortField: 'createTime',
  sortOrder: 'descend',
})

const categoryList = ref<string[]>([])
const selectedCategory = ref<string>('all')
const tagList = ref<string[]>([])
const selectedTagList = ref<boolean[]>([])

const showBackTop = ref(false)
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const handleScroll = () => {
  showBackTop.value = window.scrollY > 200
}

const getQueryParams = () => {
  const tags = tagList.value.filter((_, index) => selectedTagList.value[index])
  const params: API.PictureQueryRequest = {
    ...searchParams,
    current: page.value,
    pageSize,
    category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
    tags,
  }
  return params
}

const fetchData = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  const res = await listPictureVoByPageUsingPost(getQueryParams())
  if (res.data.code === 0 && res.data.data) {
    const records = res.data.data.records ?? []
    if (records.length < pageSize) finished.value = true
    dataList.value.push(...records)
    page.value++
  } else {
    message.error('加载失败：' + res.data.message)
  }
  loading.value = false
}

const resetAndSearch = () => {
  page.value = 1
  finished.value = false
  dataList.value = []
  fetchData()
}

const doSearch = () => {
  resetAndSearch()
}

const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagList.value = res.data.data.tagList ?? []
    categoryList.value = res.data.data.categoryList ?? []
    selectedTagList.value = new Array(tagList.value.length).fill(false)
  } else {
    message.error('获取标签分类列表失败，' + res.data.message)
  }
}

onMounted(() => {
  getTagCategoryOptions()
  fetchData()

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) fetchData()
  }, { rootMargin: '100px' })
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }

  window.addEventListener('scroll', handleScroll)
})
</script>

<style scoped>
#homePage {
  margin-bottom: 16px;
}
.search-bar {
  max-width: 480px;
  margin: 0 auto 16px;
}
.tag-bar {
  margin-bottom: 16px;
}
.load-status {
  text-align: center;
  color: #888;
  padding: 16px;
}
.back-to-top-btn {
  position: fixed;
  left: 32px;
  bottom: 48px;
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  border: none;
  transition: opacity 0.3s;
}
.back-to-top-btn:hover {
  background: #40a9ff;
}
</style>
