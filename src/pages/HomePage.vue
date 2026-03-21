<template>
  <div id="homePage" class="app-page">
    <section class="landing-hero">
      <div class="landing-copy">
        <span class="landing-badge">云端超分工作台</span>
        <h2 class="landing-title">把图片与视频超分任务放进一个更轻、更快的工作流里。</h2>
        <p class="landing-desc">
          从首页直接发起图片增强、老照片修复、视频超分与案例检索。平台保留现有后端能力，但以前端新骨架重建任务入口、协作路径和结果体验。
        </p>
        <div class="landing-actions">
          <a-button type="primary" size="large" @click="$router.push('/add_picture')">发起超分任务</a-button>
          <a-button size="large" @click="$router.push('/search_picture')">浏览案例展厅</a-button>
          <a-button size="large" @click="$router.push('/my_space')">进入人工作空间</a-button>
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
              <span>上传图片、视频，或直接进入批量任务提交</span>
              <a-button type="primary" @click="$router.push('/add_picture')">开始</a-button>
            </div>
            <div class="app-metric-grid">
              <div class="app-metric">
                <div class="app-metric__label">案例条目</div>
                <div class="app-metric__value">{{ dataList.length }}</div>
              </div>
              <div class="app-metric">
                <div class="app-metric__label">当前分类</div>
                <div class="app-metric__value metric-small">{{ selectedCategory === 'all' ? '全部' : selectedCategory }}</div>
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

    <section class="app-card filter-panel">
      <div class="panel-head">
        <div>
          <h3 class="app-section-title">超分案例展厅</h3>
          <p class="app-section-desc">保留原公共内容接口，将公开素材重新组织为案例流与精选成果展示。</p>
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

    <section class="app-card gallery-panel">
      <div class="panel-head">
        <div>
          <h3 class="app-section-title">精选案例</h3>
          <p class="app-section-desc">支持无感滚动浏览，保留既有公共素材流量和详情页跳转逻辑。</p>
        </div>
      </div>

      <PictureList :dataList="dataList" :showOp="false">
        <template #renderItem="{ item }">
          <a-list-item style="padding: 0">
            <a-card class="case-card" hoverable @click="$router.push({ path: `/picture/${item.id}` })">
              <template #cover>
                <img :alt="item.name" :src="item.thumbnailUrl ?? item.url" class="case-cover" />
              </template>
              <div class="case-body">
                <div class="case-meta">
                  <span class="case-category">{{ item.category || '案例' }}</span>
                  <span class="case-name">{{ item.name }}</span>
                </div>
              </div>
            </a-card>
          </a-list-item>
        </template>
      </PictureList>

      <div v-if="loading" class="load-status">案例加载中…</div>
      <div v-else-if="finished" class="load-status">已经看到全部案例了</div>
      <div ref="loadMoreTrigger" class="load-trigger"></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
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
    title: '人工作空间',
    desc: '处理私有素材、管理任务参数、跟踪超分结果与下载记录。',
    cta: '进入工作台',
    path: '/my_space',
  },
  {
    eyebrow: '多人协同',
    title: '团队协作空间',
    desc: '面向协作者分工、成员权限、结果沉淀和内部交付链路。',
    cta: '创建协作空间',
    path: '/add_space?type=1',
  },
  {
    eyebrow: '公开展示',
    title: '超分案例展厅',
    desc: '承接公开案例检索、成果浏览和对外展示场景。',
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

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      fetchData()
    }
  }, { rootMargin: '100px' })

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

#homePage {
  gap: 22px;
}

.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  gap: 20px;
}

.landing-copy,
.composer-card,
.scene-card,
.filter-panel,
.gallery-panel {
  border: 1px solid @border-color;
  border-radius: @border-radius-xl;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: @shadow-lg;
}

.landing-copy {
  padding: 40px;
}

.landing-badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: @border-radius-pill;
  background: @accent-soft;
  color: @accent-color;
  font-size: 13px;
  font-weight: 600;
}

.landing-title {
  margin: 18px 0 0;
  max-width: 720px;
  font-size: 48px;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.landing-desc {
  margin: 18px 0 0;
  max-width: 640px;
  color: @text-secondary;
  font-size: 16px;
  line-height: 1.8;
}

.landing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.landing-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.landing-chip {
  padding: 10px 16px;
  border: 1px solid @border-color;
  border-radius: @border-radius-pill;
  background: #fff;
  color: @text-color;
  cursor: pointer;
}

.composer-card {
  padding: 20px;
}

.composer-window {
  height: 100%;
  padding: 18px;
  border-radius: @border-radius-lg;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 26%),
    linear-gradient(180deg, #fff 0%, #f8fafc 100%);
}

.composer-toolbar {
  display: flex;
  gap: 8px;
}

.composer-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d5d9e0;
}

.composer-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 22px;
}

.composer-label {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
}

.composer-input {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 1px solid @border-color;
  border-radius: @border-radius-pill;
  background: #fff;
  color: @text-secondary;
}

.metric-small {
  font-size: 20px;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.scene-card {
  padding: 24px;
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
}

.scene-card p {
  color: @text-secondary;
  line-height: 1.8;
}

.filter-panel,
.gallery-panel {
  padding: 24px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
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
}

.tag-label {
  color: @text-secondary;
  font-size: 14px;
}

.case-card {
  overflow: hidden;
  border: none;
  border-radius: @border-radius-lg;
  box-shadow: none;
  background: @card-bg-soft;
}

.case-cover {
  display: block;
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.case-body {
  padding: 16px;
}

.case-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.case-category {
  color: @accent-color;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.case-name {
  font-size: 16px;
  font-weight: 600;
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
    font-size: 38px;
  }

  .composer-input {
    align-items: flex-start;
    flex-direction: column;
    border-radius: @border-radius-lg;
  }
}
</style>
