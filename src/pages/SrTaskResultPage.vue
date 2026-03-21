<template>
  <div id="srTaskResultPage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">结果中心</h2>
        <p class="app-page__subtitle">筛选并查看当前工作空间内的图片与视频超分结果，支持预览、下载与回到工作台。</p>
      </div>
      <div class="app-page__actions">
        <a-tag>{{ spaceTypeText }}</a-tag>
        <a-button @click="backToSpace">返回工作空间</a-button>
      </div>
    </section>

    <section class="app-filter-bar">
      <a-form layout="inline" :model="searchParams">
        <a-form-item label="任务号">
          <a-input v-model:value="searchParams.taskNo" allow-clear placeholder="输入任务号" style="width: 220px" />
        </a-form-item>
        <a-form-item label="模型">
          <a-input
            v-model:value="searchParams.modelName"
            allow-clear
            placeholder="例如 realesr-animevideov3"
            style="width: 220px"
          />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="searchParams.bizType" :options="bizTypeOptions" style="width: 140px" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="doSearch">查询</a-button>
        </a-form-item>
        <a-form-item>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </section>

    <section class="app-card result-shell">
      <a-spin :spinning="loading">
        <a-empty v-if="!loading && dataList.length === 0" description="暂无超分结果" />
        <a-list
          v-else
          :data-source="dataList"
          :grid="{ gutter: 16, column: 4, xs: 1, sm: 2, md: 3, lg: 4 }"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-card hoverable class="result-card">
                <video v-if="isVideoResult(item)" :src="item.outputUrl" controls class="result-preview" />
                <a-image v-else :src="item.outputUrl" alt="sr-result" class="result-preview" />
                <div class="meta">
                  <div><span class="label">任务号：</span>{{ item.taskNo || '-' }}</div>
                  <div><span class="label">类型：</span>{{ item.bizType || '-' }}</div>
                  <div><span class="label">模型：</span>{{ item.modelName || '-' }}</div>
                  <div><span class="label">耗时：</span>{{ item.costMs ?? '-' }} ms</div>
                  <div v-if="isTeamSpace"><span class="label">创建者：</span>{{ item.userId ?? '-' }}</div>
                  <a-space style="margin-top: 8px">
                    <a :href="item.outputUrl" target="_blank">查看原文件</a>
                    <a :href="item.outputUrl" download>下载</a>
                  </a-space>
                </div>
              </a-card>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>

      <a-pagination
        v-model:current="searchParams.current"
        v-model:pageSize="searchParams.pageSize"
        style="text-align: right; margin-top: 16px"
        :total="total"
        show-size-changer
        :page-size-options="['10', '20', '50']"
        @change="fetchData"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import {
  listSpaceSrTaskResultVoByPageUsingPost,
  type SrTaskResultVO,
} from '@/api/srTaskController.ts'
import { getLoginUserUsingGet, getPermissionsUsingPost } from '@/api/userController.ts'
import { SPACE_PERMISSION_ENUM, SPACE_TYPE_MAP } from '@/constants/space.ts'

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const router = useRouter()

const loading = ref(false)
const total = ref(0)
const dataList = ref<SrTaskResultVO[]>([])
const space = ref<API.SpaceVO>({})
const permissionList = ref<string[]>([])
const loginUser = ref<API.LoginUserVO>()
const videoFormatSet = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'])
const bizTypeOptions = [
  { label: '全部', value: undefined },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
]

const searchParams = reactive({
  current: 1,
  pageSize: 12,
  taskNo: undefined as string | undefined,
  modelName: undefined as string | undefined,
  bizType: undefined as 'image' | 'video' | undefined,
})

const spaceId = computed(() => String(props.id))
const isTeamSpace = computed(() => space.value.spaceType === 1)
const spaceTypeText = computed(() => SPACE_TYPE_MAP[space.value.spaceType || 0] || '工作空间')
const hasViewPermission = computed(() => {
  if (!isTeamSpace.value) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_VIEW_IMAGE)
  }
  return permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_VIEW_IMAGE)
})

const isVideoResult = (item: SrTaskResultVO) => {
  if (item.bizType === 'video') {
    return true
  }
  const format = (item.outputFormat || '').toLowerCase()
  return videoFormatSet.has(format)
}

const checkAccess = async () => {
  const loginRes = await getLoginUserUsingGet()
  if (loginRes.data.code === 0 && loginRes.data.data) {
    loginUser.value = loginRes.data.data
  }

  const spaceRes = await getSpaceVoByIdUsingGet({ id: spaceId.value as any })
  if (spaceRes.data.code === 0 && spaceRes.data.data) {
    space.value = spaceRes.data.data
  } else {
    throw new Error(spaceRes.data.message || '工作空间不存在')
  }

  if (!loginUser.value?.id) {
    throw new Error('请先登录')
  }

  const permissionRes = await getPermissionsUsingPost({
    spaceId: spaceId.value as any,
    userId: loginUser.value.id,
  })
  if (permissionRes.data.code === 0 && permissionRes.data.data) {
    permissionList.value = permissionRes.data.data
  }

  if (!hasViewPermission.value) {
    throw new Error('无权限查看该工作空间的超分结果')
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listSpaceSrTaskResultVoByPageUsingPost({
      spaceId: spaceId.value,
      current: searchParams.current,
      pageSize: searchParams.pageSize,
      taskNo: searchParams.taskNo,
      modelName: searchParams.modelName,
      bizType: searchParams.bizType,
    })
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
      return
    }
    message.error(`加载超分结果失败：${res.data.message || '请稍后重试'}`)
  } finally {
    loading.value = false
  }
}

const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

const resetSearch = () => {
  searchParams.current = 1
  searchParams.pageSize = 12
  searchParams.taskNo = undefined
  searchParams.modelName = undefined
  searchParams.bizType = undefined
  fetchData()
}

const backToSpace = () => {
  router.push(`/space/${props.id}`)
}

onMounted(async () => {
  try {
    await checkAccess()
    await fetchData()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '加载超分结果失败'
    message.error(errorMessage)
  }
})
</script>

<style scoped lang="less">
.result-shell {
  padding: 24px;
}

.result-card {
  overflow: hidden;
}

.result-preview {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.meta {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.8;
}

.label {
  color: #64748b;
}
</style>
