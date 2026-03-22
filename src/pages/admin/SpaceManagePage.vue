<template>
  <div id="spaceManagePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">工作空间管理</h2>
        <p class="app-page__subtitle">统一管理人工作空间、团队协作空间与容量使用情况。</p>
      </div>
      <div class="app-page__actions">
        <a-button type="primary" href="/add_space" target="_blank">创建工作空间</a-button>
        <a-button href="/space_analyze?queryPublic=1" target="_blank">案例展厅分析</a-button>
        <a-button href="/space_analyze?queryAll=1" target="_blank">全局空间分析</a-button>
      </div>
    </section>

    <section class="app-filter-bar">
      <a-form layout="inline" :model="searchParams" @finish="doSearch">
        <a-form-item label="空间名称">
          <a-input v-model:value="searchParams.spaceName" placeholder="输入空间名称" allow-clear />
        </a-form-item>
        <a-form-item label="空间规格" name="spaceLevel">
          <a-select
            v-model:value="searchParams.spaceLevel"
            style="min-width: 180px"
            placeholder="请选择空间规格"
            :options="SPACE_LEVEL_OPTIONS"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="空间类型" name="spaceType">
          <a-select
            v-model:value="searchParams.spaceType"
            :options="SPACE_TYPE_OPTIONS"
            placeholder="请选择空间类型"
            style="min-width: 180px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="用户 ID">
          <a-input-number v-model:value="searchParams.userId" placeholder="输入用户 ID" style="width: 180px" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">搜索</a-button>
        </a-form-item>
      </a-form>
    </section>

    <section class="app-table-card">
      <a-table :columns="columns" :data-source="dataList" :pagination="pagination" @change="doTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'spaceLevel'">
            {{ SPACE_LEVEL_MAP[record.spaceLevel] }}
          </template>
          <template v-else-if="column.dataIndex === 'spaceType'">
            <a-tag>{{ SPACE_TYPE_MAP[record.spaceType] }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'spaceUseInfo'">
            <div>容量：{{ formatSize(record.totalSize) }} / {{ formatSize(record.maxSize) }}</div>
            <div>数量：{{ record.totalCount }} / {{ record.maxCount }}</div>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.dataIndex === 'editTime'">
            {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space wrap>
              <a-button type="link" :href="`/space_analyze?spaceId=${record.id}`" target="_blank">分析</a-button>
              <a-button type="link" :href="`/add_space?id=${record.id}`" target="_blank">编辑</a-button>
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
import { deleteSpaceUsingPost, listSpaceByPageUsingPost } from '@/api/spaceController.ts'
import {
  SPACE_LEVEL_MAP,
  SPACE_LEVEL_OPTIONS,
  SPACE_TYPE_MAP,
  SPACE_TYPE_OPTIONS,
} from '@/constants/space.ts'
import { formatSize } from '@/utils'

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '空间名称', dataIndex: 'spaceName' },
  { title: '空间规格', dataIndex: 'spaceLevel' },
  { title: '空间类型', dataIndex: 'spaceType' },
  { title: '使用情况', dataIndex: 'spaceUseInfo' },
  { title: '用户 ID', dataIndex: 'userId', width: 90 },
  { title: '创建时间', dataIndex: 'createTime' },
  { title: '更新时间', dataIndex: 'editTime' },
  { title: '操作', key: 'action' },
]

const dataList = ref<API.Space[]>([])
const total = ref(0)

const searchParams = reactive<API.SpaceQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

const fetchData = async () => {
  const res = await listSpaceByPageUsingPost({
    ...searchParams,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
    return
  }
  message.error('获取工作空间失败，' + res.data.message)
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

const doDelete = async (id: string | number) => {
  if (!id) return
  const res = await deleteSpaceUsingPost({ id: id as any })
  if (res.data.code === 0) {
    message.success('删除成功')
    fetchData()
    return
  }
  message.error('删除失败')
}
</script>
