<template>
  <div id="spaceDetailPage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">{{ space.spaceName || '工作空间' }}</h2>
        <p class="app-page__subtitle">
          {{ spaceTypeTitle }}，在这里集中查看素材、权限、结果和协作动作。
        </p>
      </div>
      <div class="app-page__actions">
        <a-button
          v-if="canUploadPicture"
          type="primary"
          :href="`/add_picture?spaceId=${id}`"
          target="_blank"
        >
          发起任务
        </a-button>
        <a-button
          v-if="canManageSpaceUser"
          :icon="h(TeamOutlined)"
          :href="`/spaceUserManage/${id}`"
          target="_blank"
        >
          成员管理
        </a-button>
        <a-button
          v-if="canAnalyseSpace"
          :icon="h(BarChartOutlined)"
          :href="`/space_analyze?spaceId=${id}`"
          target="_blank"
        >
          空间分析
        </a-button>
        <a-button v-if="canViewSrResult" @click="goToSrResultPage">结果中心</a-button>
        <a-button v-if="canEditPicture" :icon="h(EditOutlined)" @click="doBatchEdit"
          >批量编辑</a-button
        >
      </div>
    </section>

    <section class="app-metric-grid">
      <div class="app-metric">
        <div class="app-metric__label">空间类型</div>
        <div class="app-metric__value metric-label">{{ spaceTypeTitle }}</div>
      </div>
      <div class="app-metric">
        <div class="app-metric__label">已用容量</div>
        <div class="app-metric__value metric-label">{{ formatSize(space.totalSize) }}</div>
      </div>
      <div class="app-metric">
        <div class="app-metric__label">可用上限</div>
        <div class="app-metric__value metric-label">{{ formatSize(space.maxSize) }}</div>
      </div>
      <div class="app-metric">
        <div class="app-metric__label">容量占比</div>
        <div class="app-metric__value metric-label">{{ spaceUsagePercent }}%</div>
      </div>
    </section>

    <section class="app-card panel-card">
      <div class="panel-top">
        <div>
          <h3 class="app-section-title">素材列表</h3>
          <p class="app-section-desc">
            保留现有搜索、颜色检索和分页逻辑，并直接接入空间内的超分任务入口。
          </p>
        </div>
        <a-progress type="circle" :size="46" :percent="spaceUsagePercentNumber" />
      </div>
      <PictureSearchForm :onSearch="onSearch" />
      <div class="color-filter">
        <span class="color-filter__label">按颜色搜索</span>
        <color-picker format="hex" @pureColorChange="onColorChange" />
      </div>
    </section>

    <section class="app-card panel-card">
      <PictureList
        :dataList="dataList"
        :loading="loading"
        :showOp="true"
        :canEdit="canEditPicture"
        :canDelete="canDeletePicture"
        :showSuperResolution="canEditPicture"
        :onSuperResolution="openSuperResolutionModal"
        :onReload="fetchData"
      />

      <a-pagination
        v-model:current="searchParams.current"
        v-model:pageSize="searchParams.pageSize"
        style="text-align: right"
        :total="total"
        @change="onPageChange"
      />
    </section>

    <BatchEditPictureModal
      ref="batchEditPictureModalRef"
      :spaceId="props.id"
      :pictureList="dataList"
      :onSuccess="onBatchEditPictureSuccess"
    />
    <ImageSuperResolution
      ref="imageSuperResolutionModalRef"
      :picture="currentSuperResolutionPicture"
      :onSuccess="onSuperResolutionTaskCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { BarChartOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
import {
  listPictureVoByPageUsingPost,
  searchPictureByColorUsingPost,
} from '@/api/pictureController.ts'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import { getSrTaskVoByIdUsingGet } from '@/api/srTaskController.ts'
import { getLoginUserUsingGet, getPermissionsUsingPost } from '@/api/userController.ts'
import BatchEditPictureModal from '@/components/BatchEditPictureModal.vue'
import ImageSuperResolution from '@/components/ImageSuperResolution.vue'
import PictureList from '@/components/PictureList.vue'
import PictureSearchForm from '@/components/PictureSearchForm.vue'
import {
  getSrProgressStageText,
  getSrTaskStatusText,
  SR_TASK_TERMINAL_STATUS,
} from '@/constants/srTask.ts'
import { SPACE_PERMISSION_ENUM, SPACE_TYPE_MAP } from '@/constants/space.ts'
import { formatSize } from '@/utils'

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const router = useRouter()
const space = ref<API.SpaceVO>({})
const loginUser = ref<API.LoginUserVO>()
const permissionList = ref<string[]>([])
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

const searchParams = ref<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
})

const batchEditPictureModalRef = ref()
const imageSuperResolutionModalRef = ref()
const currentSuperResolutionPicture = ref<API.PictureVO>()
const srPollingTimerMap = new Map<string, ReturnType<typeof setInterval>>()

const spaceTypeTitle = computed(() => SPACE_TYPE_MAP[space.value.spaceType || 0] || '工作空间')
const spaceUsagePercentNumber = computed(() => {
  const maxSize = Number(space.value.maxSize || 0)
  const totalSize = Number(space.value.totalSize || 0)
  if (!maxSize) {
    return 0
  }
  return Number(((totalSize * 100) / maxSize).toFixed(1))
})
const spaceUsagePercent = computed(() => spaceUsagePercentNumber.value.toFixed(1))

async function fetchLoginUser() {
  const res = await getLoginUserUsingGet()
  if (res.data.code === 0 && res.data.data) {
    loginUser.value = res.data.data
  }
}

const fetchPermissions = async () => {
  if (!loginUser.value?.id || !props.id) {
    return
  }

  try {
    const res = await getPermissionsUsingPost({
      spaceId: props.id as any,
      userId: loginUser.value.id,
      pictureId: undefined,
    })
    if (res.data.code === 0 && res.data.data) {
      permissionList.value = res.data.data
    }
  } catch (error) {
    console.error('获取权限失败:', error)
  }
}

const canAnalyseSpace = computed(() => {
  return space.value.spaceType === 0
    ? permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_ANALYZE_PERMISSIONS)
    : permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_ANALYZE_PERMISSIONS)
})

const canUploadPicture = computed(() => {
  return space.value.spaceType === 0
    ? permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_UPLOAD_IMAGE)
    : permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_UPLOAD_IMAGE)
})

const canEditPicture = computed(() => {
  return space.value.spaceType === 0
    ? permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_MODIFY_IMAGE)
    : permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_MODIFY_IMAGE)
})

const canDeletePicture = computed(() => {
  return space.value.spaceType === 0
    ? permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_DELETE_IMAGE)
    : permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_DELETE_IMAGE)
})

const canManageSpaceUser = computed(() =>
  permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_MANAGE_MEMBERS),
)

const canViewSrResult = computed(() => {
  return space.value.spaceType === 0
    ? permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_VIEW_IMAGE)
    : permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_VIEW_IMAGE)
})

const fetchSpaceDetail = async () => {
  try {
    const res = await getSpaceVoByIdUsingGet({
      id: props.id as any,
    })
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
      return
    }
    message.error(`获取空间详情失败，${res.data.message || '请稍后重试'}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`获取空间详情失败，${errorMessage}`)
  }
}

const fetchData = async () => {
  loading.value = true
  const res = await listPictureVoByPageUsingPost({
    ...searchParams.value,
    spaceId: props.id as any,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error(`获取素材失败，${res.data.message || '请稍后重试'}`)
  }
  loading.value = false
}

const onPageChange = (current: number, pageSize: number) => {
  searchParams.value.current = current
  searchParams.value.pageSize = pageSize
  fetchData()
}

const onSearch = (newSearchParams: API.PictureQueryRequest) => {
  searchParams.value = {
    ...searchParams.value,
    ...newSearchParams,
    current: 1,
  }
  fetchData()
}

const onColorChange = async (color: string) => {
  loading.value = true
  const res = await searchPictureByColorUsingPost({
    picColor: color,
    spaceId: props.id as any,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data ?? []
    total.value = dataList.value.length
  } else {
    message.error(`按颜色搜索失败，${res.data.message || '请稍后重试'}`)
  }
  loading.value = false
}

const stopSrTaskPolling = (taskId: string, closeMessage = true) => {
  const timer = srPollingTimerMap.get(taskId)
  if (timer) {
    clearInterval(timer)
    srPollingTimerMap.delete(taskId)
  }
  if (closeMessage) {
    message.destroy(`sr-task-${taskId}`)
  }
}

const startSrTaskPolling = (taskId: string) => {
  if (!taskId) {
    return
  }
  stopSrTaskPolling(taskId)

  const messageKey = `sr-task-${taskId}`
  let pollingCount = 0
  const maxPollingCount = 200

  message.loading({
    key: messageKey,
    content: `超分任务已提交（${taskId}），正在进入处理队列...`,
    duration: 0,
  })

  const pollOnce = async () => {
    pollingCount += 1
    try {
      const res = await getSrTaskVoByIdUsingGet({ id: taskId })
      if (res.data.code !== 0 || !res.data.data) {
        if (pollingCount >= maxPollingCount) {
          message.warning({
            key: messageKey,
            content: `超分任务查询超时（${taskId}），请稍后在结果中心查看`,
            duration: 4,
          })
          stopSrTaskPolling(taskId, false)
        }
        return
      }

      const task = res.data.data
      const status = task.status || 'QUEUED'
      const progress = Number(task.progress ?? 0)
      const statusText = getSrTaskStatusText(status)
      const stageText = getSrProgressStageText(progress)

      if (!SR_TASK_TERMINAL_STATUS.has(status)) {
        message.loading({
          key: messageKey,
          content: `超分任务处理中：${statusText}，${progress}% · ${stageText}`,
          duration: 0,
        })
        if (pollingCount >= maxPollingCount) {
          message.warning({
            key: messageKey,
            content: `超分任务处理时间较长（${taskId}），请稍后在结果中心刷新查看`,
            duration: 4,
          })
          stopSrTaskPolling(taskId, false)
        }
        return
      }

      if (status === 'SUCCEEDED') {
        message.success({
          key: messageKey,
          content: '超分任务已完成，正在刷新素材列表',
          duration: 3,
        })
        fetchData()
      } else {
        message.error({
          key: messageKey,
          content: `超分任务失败：${task.errorMsg || statusText}`,
          duration: 4,
        })
      }
      stopSrTaskPolling(taskId, false)
    } catch (error: unknown) {
      if (pollingCount >= maxPollingCount) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        message.error({
          key: messageKey,
          content: `超分任务轮询异常（${taskId}）：${errorMessage}`,
          duration: 4,
        })
        stopSrTaskPolling(taskId, false)
      }
    }
  }

  pollOnce()
  const timer = setInterval(pollOnce, 3000)
  srPollingTimerMap.set(taskId, timer)
}

const onBatchEditPictureSuccess = () => {
  fetchData()
}

const doBatchEdit = () => {
  batchEditPictureModalRef.value?.openModal()
}

const openSuperResolutionModal = (picture: API.PictureVO) => {
  currentSuperResolutionPicture.value = picture
  imageSuperResolutionModalRef.value?.openModal()
}

const onSuperResolutionTaskCreated = (taskId: string) => {
  startSrTaskPolling(taskId)
}

const goToSrResultPage = () => {
  router.push(`/space/${props.id}/sr_result`)
}

onMounted(async () => {
  await fetchLoginUser()
  await fetchPermissions()
  await fetchSpaceDetail()
  fetchData()
})

onBeforeUnmount(() => {
  Array.from(srPollingTimerMap.keys()).forEach((taskId) => stopSrTaskPolling(taskId))
})

watch(
  () => props.id,
  async () => {
    await fetchPermissions()
    await fetchSpaceDetail()
    fetchData()
  },
)
</script>

<style scoped lang="less">
.panel-card {
  padding: 24px;
}

.panel-top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  margin-bottom: 18px;
}

.metric-label {
  font-size: 22px;
}

.color-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.color-filter__label {
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 768px) {
  .panel-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
