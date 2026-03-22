<template>
  <div id="pictureManagePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">素材管理</h2>
        <p class="app-page__subtitle">审核公开素材、维护案例内容，并对图片类数据做统一治理。</p>
      </div>
      <div class="app-page__actions">
        <a-button href="/add_picture/batch" target="_blank">批量任务提交</a-button>
      </div>
    </section>

    <section class="app-filter-bar">
      <a-form layout="inline" :model="searchParams" @finish="doSearch">
        <a-form-item label="关键词">
          <a-input
            v-model:value="searchParams.searchText"
            placeholder="搜索标题或简介"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="分类">
          <a-input v-model:value="searchParams.category" placeholder="输入分类" allow-clear />
        </a-form-item>
        <a-form-item label="标签">
          <a-select
            v-model:value="searchParams.tags"
            mode="tags"
            placeholder="输入标签"
            style="min-width: 180px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="审核状态" name="reviewStatus">
          <a-select
            v-model:value="searchParams.reviewStatus"
            style="min-width: 180px"
            placeholder="请选择审核状态"
            :options="PIC_REVIEW_STATUS_OPTIONS"
            allow-clear
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">搜索</a-button>
        </a-form-item>
      </a-form>
    </section>

    <section class="app-table-card">
      <a-table
        :columns="columns"
        :data-source="dataList"
        :pagination="pagination"
        @change="doTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'url'">
            <a-image :src="record.url" :width="120" />
          </template>
          <template v-else-if="column.dataIndex === 'tags'">
            <a-space wrap>
              <a-tag v-for="tag in JSON.parse(record.tags || '[]')" :key="tag">{{ tag }}</a-tag>
            </a-space>
          </template>
          <template v-else-if="column.dataIndex === 'picInfo'">
            <div>格式：{{ record.picFormat }}</div>
            <div>宽度：{{ record.picWidth }}</div>
            <div>高度：{{ record.picHeight }}</div>
            <div>比例：{{ record.picScale }}</div>
            <div>大小：{{ (record.picSize / 1024).toFixed(2) }} KB</div>
          </template>
          <template v-else-if="column.dataIndex === 'reviewMessage'">
            <div>状态：{{ PIC_REVIEW_STATUS_MAP[Number(record.reviewStatus)] }}</div>
            <div>信息：{{ record.reviewMessage }}</div>
            <div>审核人：{{ record.reviewerId }}</div>
            <div v-if="record.reviewTime">
              时间：{{ dayjs(record.reviewTime).format('YYYY-MM-DD HH:mm:ss') }}
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.dataIndex === 'editTime'">
            {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space wrap>
              <a-button
                v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.FINAL_APPROVED"
                type="link"
                @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.FINAL_APPROVED)"
              >
                通过
              </a-button>
              <a-button
                v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.FINAL_REJECTED"
                type="link"
                danger
                @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.FINAL_REJECTED)"
              >
                拒绝
              </a-button>
              <a-button type="link" :href="`/add_picture?id=${record.id}`" target="_blank"
                >编辑</a-button
              >
              <a-button danger @click="doDelete(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  deletePictureUsingPost,
  doPictureReviewUsingPost,
  listPictureByPageUsingPost,
} from '@/api/pictureController.ts'
import {
  PIC_REVIEW_STATUS_ENUM,
  PIC_REVIEW_STATUS_MAP,
  PIC_REVIEW_STATUS_OPTIONS,
} from '@/constants/picture.ts'

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '素材', dataIndex: 'url' },
  { title: '名称', dataIndex: 'name' },
  { title: '简介', dataIndex: 'introduction', ellipsis: true },
  { title: '分类', dataIndex: 'category' },
  { title: '标签', dataIndex: 'tags' },
  { title: '素材信息', dataIndex: 'picInfo' },
  { title: '用户 ID', dataIndex: 'userId', width: 90 },
  { title: '空间 ID', dataIndex: 'spaceId', width: 90 },
  { title: '审核信息', dataIndex: 'reviewMessage' },
  { title: '创建时间', dataIndex: 'createTime' },
  { title: '更新时间', dataIndex: 'editTime' },
  { title: '操作', key: 'action' },
]

const dataList = ref<API.Picture[]>([])
const total = ref(0)

const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
  reviewStatus: undefined as number | undefined,
})

const fetchData = async () => {
  const res = await listPictureByPageUsingPost({
    ...searchParams,
    nullSpaceId: true,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
    return
  }
  message.error('获取素材数据失败，' + res.data.message)
}

onMounted(() => {
  fetchData()
})

const pagination = computed(() => ({
  current: searchParams.current,
  pageSize: searchParams.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value: number) => `共 ${value} 条`,
}))

const doTableChange = (page: { current: number; pageSize: number }) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

const doDelete = async (id: number) => {
  if (!id) return
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    fetchData()
    return
  }
  message.error('删除失败')
}

const handleReview = async (record: API.Picture, reviewStatus: number) => {
  const reviewMessage =
    reviewStatus === PIC_REVIEW_STATUS_ENUM.FINAL_APPROVED ? '管理员审核通过' : '管理员审核拒绝'
  const res = await doPictureReviewUsingPost({
    id: record.id,
    reviewStatus,
    reviewMessage,
  })
  if (res.data.code === 0) {
    message.success('审核操作成功')
    fetchData()
    return
  }
  message.error('审核操作失败，' + res.data.message)
}
</script>
