<template>
  <div id="spaceManagePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">工作台管理</h2>
        <p class="app-page__subtitle">
          统一查看个人工作台、团队协作台和容量使用情况，快速定位高频处理区域。
        </p>
      </div>
      <div class="app-page__actions">
        <a-button href="/space_analyze?queryPublic=1" target="_blank">案例库分析</a-button>
        <a-button href="/space_analyze?queryAll=1" target="_blank">全局分析</a-button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="app-metric">
        <div class="app-metric__label">当前结果数</div>
        <div class="app-metric__value">{{ total }}</div>
      </article>
      <article class="app-metric">
        <div class="app-metric__label">查询规格</div>
        <div class="app-metric__value metric-small">
          {{ searchParams.spaceLevel ? SPACE_LEVEL_MAP[searchParams.spaceLevel] : '全部' }}
        </div>
      </article>
      <article class="app-metric">
        <div class="app-metric__label">查询类型</div>
        <div class="app-metric__value metric-small">
          {{ searchParams.spaceType ? SPACE_TYPE_MAP[searchParams.spaceType] : '全部' }}
        </div>
      </article>
      <article class="app-metric">
        <div class="app-metric__label">页容量</div>
        <div class="app-metric__value">{{ searchParams.pageSize }}</div>
      </article>
    </section>

    <section class="app-surface-card control-panel">
      <div class="app-panel-head control-panel__head">
        <div>
          <h3 class="app-section-title">筛选与检索</h3>
          <p class="app-section-desc">
            按工作台名称、规格、类型和用户 ID 快速筛选，方便集中查看使用情况。
          </p>
        </div>
      </div>

      <a-form class="control-form" layout="inline" :model="searchParams" @finish="doSearch">
        <a-form-item label="工作台名称">
          <a-input v-model:value="searchParams.spaceName" placeholder="输入工作台名称" allow-clear />
        </a-form-item>
        <a-form-item label="工作台规格" name="spaceLevel">
          <a-select
            v-model:value="searchParams.spaceLevel"
            style="min-width: 180px"
            placeholder="请选择工作台规格"
            :options="SPACE_LEVEL_OPTIONS"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="工作台类型" name="spaceType">
          <a-select
            v-model:value="searchParams.spaceType"
            :options="SPACE_TYPE_OPTIONS"
            placeholder="请选择工作台类型"
            style="min-width: 180px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="用户 ID">
          <a-input-number
            v-model:value="searchParams.userId"
            placeholder="输入用户 ID"
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item class="control-form__submit">
          <a-button type="primary" html-type="submit">搜索</a-button>
        </a-form-item>
      </a-form>
    </section>

    <section class="app-table-card">
      <div class="table-head">
        <div>
          <h3 class="app-section-title">工作台列表</h3>
          <p class="app-section-desc">
            查看容量、数量、归属用户与最近编辑时间，并从这里进入分析或编辑流程。
          </p>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="dataList"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        @change="doTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'spaceName'">
            <div class="space-name-cell">
              <span class="space-name-cell__name">{{
                record.spaceName || `工作台 ${record.id}`
              }}</span>
              <span class="space-name-cell__meta">ID {{ record.id }}</span>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'spaceLevel'">
            {{ SPACE_LEVEL_MAP[record.spaceLevel] }}
          </template>
          <template v-else-if="column.dataIndex === 'spaceType'">
            <a-tag>{{ SPACE_TYPE_MAP[record.spaceType] }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'spaceUseInfo'">
            <div class="usage-cell">
              <div>容量：{{ formatSize(record.totalSize) }} / {{ formatSize(record.maxSize) }}</div>
              <div>数量：{{ record.totalCount }} / {{ record.maxCount }}</div>
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
              <a-button type="link" :href="`/space_analyze?spaceId=${record.id}`" target="_blank">
                分析
              </a-button>
              <a-button type="link" :href="`/add_space?id=${record.id}`" target="_blank">
                编辑
              </a-button>
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
  { title: '空间', dataIndex: 'spaceName', width: 240 },
  { title: '规格', dataIndex: 'spaceLevel', width: 120 },
  { title: '类型', dataIndex: 'spaceType', width: 120 },
  { title: '使用情况', dataIndex: 'spaceUseInfo', width: 240 },
  { title: '用户 ID', dataIndex: 'userId', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '更新时间', dataIndex: 'editTime', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
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
  message.error('获取工作台失败，' + res.data.message)
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

<style scoped lang="less">
@import '@/styles/variables.less';

#spaceManagePage {
  gap: 22px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-small {
  font-size: 22px;
}

.control-panel {
  padding: 26px;
}

.control-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
  margin-top: 18px;
}

.control-form__submit {
  margin-left: auto;
}

.table-head {
  margin-bottom: 18px;
}

.space-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.space-name-cell__name {
  font-weight: 600;
}

.space-name-cell__meta,
.usage-cell {
  color: @text-secondary;
}

.usage-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.7;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .control-panel {
    padding: 22px;
  }

  .control-form__submit {
    margin-left: 0;
  }
}
</style>
