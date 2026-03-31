<template>
  <div id="homePage" class="app-page">
    <section class="landing-hero">
      <div class="landing-copy">
        <span class="landing-badge">Cloud AI Workspace</span>
        <h2 class="landing-title">把图片与视频超分任务放进更快、更轻的工作流里。</h2>
        <p class="landing-desc">
          从首页直接发起图片增强、视频超分、案例浏览和批量任务。平台保留现有后端能力，
          但用统一的前端工作台重新组织上传、处理、协作和展示体验。
        </p>
        <div class="landing-actions">
          <a-button
            class="landing-actions__primary"
            type="primary"
            @click="$router.push('/my_space')"
          >
            发起超分任务
          </a-button>
          <a-button size="large" @click="$router.push('/search_picture')">浏览案例展厅</a-button>
          <a-button size="large" @click="$router.push('/my_space')">进入个人工作空间</a-button>
        </div>
        <div class="landing-chips">
          <button
            v-for="chip in quickChips"
            :key="chip.label"
            class="landing-chip"
            type="button"
            @click="$router.push(chip.path)"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>

      <div class="composer-card">
        <div class="composer-window">
          <div class="composer-toolbar">
            <span class="composer-dot" />
            <span class="composer-dot" />
            <span class="composer-dot" />
          </div>
          <div class="composer-body">
            <p class="composer-label">今天准备处理什么素材？</p>
            <div class="composer-input">
              <PlusOutlined />
              <span>上传图片、视频，或直接进入批量任务提交。</span>
              <a-button type="primary" @click="$router.push('/my_space')">开始</a-button>
            </div>
            <div class="app-metric-grid">
              <div class="app-metric">
                <div class="app-metric__label">案例条目</div>
                <div class="app-metric__value">{{ dataList.length }}</div>
              </div>
              <div class="app-metric">
                <div class="app-metric__label">当前分类</div>
                <div class="app-metric__value metric-small">
                  {{ selectedCategory === 'all' ? '全部' : selectedCategory }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="scene-grid">
      <article v-for="scene in sceneCards" :key="scene.title" class="scene-card">
        <p class="scene-card__eyebrow">{{ scene.eyebrow }}</p>
        <h3>{{ scene.title }}</h3>
        <p>{{ scene.desc }}</p>
        <a-button type="link" @click="$router.push(scene.path)">{{ scene.cta }}</a-button>
      </article>
    </section>

    <section class="app-surface-card filter-panel">
      <div class="app-panel-head panel-head">
        <div>
          <h3 class="app-section-title">超分案例展厅</h3>
          <p class="app-section-desc">
            保留公开素材接口，用统一的筛选与展示逻辑浏览当前可公开查看的案例。
          </p>
        </div>
      </div>
      <div class="filter-search">
        <a-input-search
          v-model:value="searchParams.searchText"
          placeholder="搜索案例标题、简介或标签"
          enter-button="搜索案例"
          size="large"
          @search="doSearch"
        />
      </div>
      <a-tabs v-model:active-key="selectedCategory" @change="doSearch">
        <a-tab-pane key="all" tab="全部案例" />
        <a-tab-pane v-for="category in categoryList" :key="category" :tab="category" />
      </a-tabs>
      <div class="tag-bar">
        <span class="tag-label">常用标签</span>
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
    </section>

    <section class="app-surface-card gallery-panel">
      <div class="app-panel-head panel-head">
        <div>
          <h3 class="app-section-title">精选案例</h3>
          <p class="app-section-desc">
            首页精选案例区与公开展厅列表共用同一套图片列表展示逻辑和交互。
          </p>
        </div>
      </div>

      <PictureList :dataList="dataList" :showOp="false" />

      <div v-if="loading" class="load-status">案例加载中...</div>
      <div v-else-if="finished" class="load-status">已经看到全部案例了</div>
      <div ref="loadMoreTrigger" class="load-trigger"></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
} from '@/api/pictureController.ts'
import PictureList from '@/components/PictureList.vue'

const quickChips = [
  { label: '图片增强', path: '/add_picture' },
  { label: '视频超分', path: '/add_picture' },
  { label: '批量任务', path: '/add_picture/batch' },
  { label: '结果中心', path: '/search_picture' },
]

const sceneCards = [
  {
    eyebrow: '个人使用',
    title: '个人工作空间',
    desc: '处理私有素材、管理任务参数，并追踪超分结果与下载记录。',
    cta: '进入工作台',
    path: '/my_space',
  },
  {
    eyebrow: '多人协同',
    title: '团队协作空间',
    desc: '面向团队分工、成员权限、结果沉淀和协同交付场景。',
    cta: '创建协作空间',
    path: '/add_space?type=1',
  },
  {
    eyebrow: '公开展示',
    title: '超分案例展厅',
    desc: '集中浏览公开案例、检索结果和对外展示内容。',
    cta: '浏览案例',
    path: '/search_picture',
  },
]

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

const getQueryParams = () => {
  const tags = tagList.value.filter((_, index) => selectedTagList.value[index])
  return {
    ...searchParams,
    current: page.value,
    pageSize,
    category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
    tags,
  }
}

const fetchData = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  const res = await listPictureVoByPageUsingPost(getQueryParams())
  if (res.data.code === 0 && res.data.data) {
    const records = res.data.data.records ?? []
    if (records.length < pageSize) finished.value = true
    dataList.value.push(...records)
    page.value += 1
  } else {
    message.error('加载案例失败，' + res.data.message)
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
    return
  }
  message.error('获取标签与分类失败，' + res.data.message)
}

onMounted(() => {
  getTagCategoryOptions()
  fetchData()

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        fetchData()
      }
    },
    { rootMargin: '100px' },
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

#homePage {
  gap: 24px;
}

.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.8fr);
  gap: 22px;
}

.landing-copy,
.composer-card,
.scene-card {
  border-radius: @border-radius-lg;
  box-shadow: @shadow-lg;
}

.landing-copy {
  padding: 42px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 24%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(251, 251, 252, 0.92) 100%);
  backdrop-filter: blur(16px);
}

.landing-badge {
  display: inline-flex;
  padding: 7px 14px;
  border-radius: @border-radius-pill;
  background: rgba(37, 99, 235, 0.1);
  color: @accent-color;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.landing-title {
  margin: 18px 0 0;
  max-width: 760px;
  font-size: 56px;
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.landing-desc {
  margin: 20px 0 0;
  max-width: 620px;
  color: @text-secondary;
  font-size: 16px;
  line-height: 1.8;
}

.landing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.landing-actions__primary {
  min-width: 180px;
}

.landing-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.landing-chip {
  padding: 9px 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: @border-radius-pill;
  background: rgba(255, 255, 255, 0.82);
  color: @text-secondary;
  cursor: pointer;
  transition: 0.2s ease;
}

.landing-chip:hover {
  border-color: rgba(37, 99, 235, 0.24);
  color: @text-color;
}

.composer-card {
  padding: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(251, 251, 252, 0.88) 100%);
  backdrop-filter: blur(16px);
}

.composer-window {
  height: 100%;
  padding: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: @border-radius-md;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(247, 247, 248, 0.82) 100%);
}

.composer-toolbar {
  display: flex;
  gap: 8px;
}

.composer-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(107, 114, 128, 0.26);
}

.composer-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 22px;
}

.composer-label {
  margin: 0;
  color: @text-color;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
}

.composer-input {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: @border-radius-md;
  background: rgba(255, 255, 255, 0.8);
  color: @text-secondary;
}

.metric-small {
  font-size: 20px;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.scene-card {
  padding: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84) 0%, rgba(251, 251, 252, 0.9) 100%);
  backdrop-filter: blur(12px);
}

.scene-card__eyebrow {
  margin: 0 0 10px;
  color: @accent-color;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.scene-card h3 {
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.02em;
}

.scene-card p {
  color: @text-secondary;
  line-height: 1.8;
}

.filter-panel,
.gallery-panel {
  padding: 26px;
}

.panel-head {
  margin-bottom: 18px;
}

.filter-search {
  max-width: 720px;
  margin-bottom: 12px;
}

.tag-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.tag-label {
  color: @text-secondary;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.load-status {
  padding-top: 18px;
  color: @text-secondary;
  text-align: center;
}

.load-trigger {
  height: 1px;
}

@media (max-width: 1080px) {
  .landing-hero,
  .scene-grid {
    grid-template-columns: 1fr;
  }

  .landing-copy {
    padding: 28px;
  }

  .landing-title {
    font-size: 40px;
  }

  .composer-input {
    align-items: flex-start;
    flex-direction: column;
    border-radius: @border-radius-md;
  }
}
</style>
