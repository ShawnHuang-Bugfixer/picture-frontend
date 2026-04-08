<template>
  <div id="srTaskResultPage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">结果中心</h2>
        <p class="app-page__subtitle">
          筛选并查看当前工作空间内的图片与视频超分结果，支持预览、下载和追踪输出元数据。
        </p>
      </div>
      <div class="app-page__actions">
        <a-tag>{{ spaceTypeText }}</a-tag>
        <a-button type="primary" @click="goToGalleryUpload">上传至展厅</a-button>
        <a-button @click="fetchData">刷新结果</a-button>
        <a-button @click="backToSpace">返回工作空间</a-button>
      </div>
    </section>

    <section class="app-filter-bar">
      <a-form layout="inline" :model="searchParams">
        <a-form-item label="任务号">
          <a-input
            v-model:value="searchParams.taskNo"
            allow-clear
            placeholder="输入任务号"
            style="width: 220px"
          />
        </a-form-item>
        <a-form-item label="模型">
          <a-input
            v-model:value="searchParams.modelName"
            allow-clear
            placeholder="例如 RealESRGAN_x4plus"
            style="width: 220px"
          />
        </a-form-item>
        <a-form-item label="类型">
          <a-select
            v-model:value="searchParams.bizType"
            :options="bizTypeOptions"
            style="width: 140px"
          />
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
          :grid="{ gutter: 16, column: 4, xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <MediaCard
                class="result-card"
                :interactive="true"
                :eyebrow="getSrBizTypeText(item.bizType)"
                :title="item.taskNo || '超分结果'"
                :subtitle="item.modelName || '未记录模型名称'"
              >
                <template #preview>
                  <MediaPreview
                    :src="item.outputUrl"
                    :alt="item.taskNo || '超分结果'"
                    :is-video="isVideoResult(item)"
                    :video-preview-mode="'player'"
                    :controls="false"
                    :muted="true"
                    :interactive="true"
                    :show-overlay="false"
                  />
                </template>

                <template #meta>
                  <div class="meta">
                    <div class="meta-row">
                      <a-tag color="blue">{{ getSrBizTypeText(item.bizType) }}</a-tag>
                      <a-tag>{{ item.modelName || '-' }}</a-tag>
                    </div>
                    <div><span class="label">输出格式：</span>{{ item.outputFormat || '-' }}</div>
                    <div>
                      <span class="label">输出尺寸：</span>{{ formatOutputDimensions(item) }}
                    </div>
                    <div>
                      <span class="label">文件大小：</span>{{ formatSize(item.outputSize) }}
                    </div>
                    <div><span class="label">耗时：</span>{{ formatDuration(item.costMs) }}</div>
                    <div v-if="isVideoResult(item)">
                      <span class="label">视频信息：</span>{{ formatVideoMetrics(item) }}
                    </div>
                    <div><span class="label">尝试次数：</span>{{ item.attempt ?? '-' }}</div>
                    <div><span class="label">输出 Key：</span>{{ item.outputFileKey || '-' }}</div>
                    <div><span class="label">Trace ID：</span>{{ item.traceId || '-' }}</div>
                    <div>
                      <span class="label">完成时间：</span
                      >{{ item.updateTime || item.createTime || '-' }}
                    </div>
                    <div v-if="isTeamSpace">
                      <span class="label">创建者：</span>{{ item.userId ?? '-' }}
                    </div>
                  </div>
                </template>

                <template #actions>
                  <a-space wrap>
                    <a v-if="canCompareResult(item)" @click.prevent="openCompareModal(item)">
                      对比结果
                    </a>
                    <a :href="item.outputUrl" target="_blank">查看文件</a>
                    <a @click.prevent="doDownload(item)">下载</a>
                  </a-space>
                </template>
              </MediaCard>
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

    <CompareImageModal
      :open="compareModalOpen"
      :before-image-url="currentCompareItem?.inputFileUrl"
      :after-image-url="currentCompareItem?.outputUrl"
      :title="currentCompareItem?.taskNo ? `${currentCompareItem.taskNo} 对比结果` : '超分结果对比'"
      @close="closeCompareModal"
    />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import CompareImageModal from '@/components/CompareImageModal.vue'
import MediaCard from '@/components/media/MediaCard.vue'
import MediaPreview from '@/components/media/MediaPreview.vue'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import {
  listMySrTaskResultVoByPageUsingPost,
  listSpaceSrTaskResultVoByPageUsingPost,
  type SrTaskResultVO,
} from '@/api/srTaskController.ts'
import { getLoginUserUsingGet, getPermissionsUsingPost } from '@/api/userController.ts'
import { getSrBizTypeText, isVideoMedia } from '@/constants/srTask.ts'
import { SPACE_PERMISSION_ENUM, SPACE_TYPE_MAP } from '@/constants/space.ts'
import { downloadImage, formatSize } from '@/utils'

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
const compareModalOpen = ref(false)
const currentCompareItem = ref<SrTaskResultVO | null>(null)

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
  return isVideoMedia(item.outputFormat)
}

const canCompareResult = (item: SrTaskResultVO) => {
  return item.bizType === 'image' && !!item.inputFileUrl && !!item.outputUrl
}

const openCompareModal = (item: SrTaskResultVO) => {
  currentCompareItem.value = item
  compareModalOpen.value = true
}

const closeCompareModal = () => {
  compareModalOpen.value = false
  currentCompareItem.value = null
}

const formatOutputDimensions = (item: SrTaskResultVO) => {
  if (!item.outputWidth || !item.outputHeight) {
    return '-'
  }
  return `${item.outputWidth} × ${item.outputHeight}`
}

const formatVideoMetrics = (item: SrTaskResultVO) => {
  const parts = [
    item.durationMs ? `时长 ${formatDuration(item.durationMs)}` : '',
    item.fps ? `FPS ${item.fps}` : '',
    item.codec ? `编码 ${item.codec}` : '',
    item.bitrateKbps ? `码率 ${item.bitrateKbps} kbps` : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : '-'
}

const formatDuration = (value?: number) => {
  if (!value && value !== 0) {
    return '-'
  }
  if (value < 1000) {
    return `${value} ms`
  }
  return `${(value / 1000).toFixed(2)} s`
}

const checkAccess = async () => {
  const loginRes = await getLoginUserUsingGet()
  if (loginRes.data.code === 0 && loginRes.data.data) {
    loginUser.value = loginRes.data.data
  }

  const spaceRes = await getSpaceVoByIdUsingGet({ id: props.id as any })
  if (spaceRes.data.code === 0 && spaceRes.data.data) {
    space.value = spaceRes.data.data
  } else {
    throw new Error(spaceRes.data.message || '工作空间不存在')
  }

  if (!loginUser.value?.id) {
    throw new Error('请先登录')
  }

  const permissionRes = await getPermissionsUsingPost({
    spaceId: props.id as any,
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
    if (isTeamSpace.value) {
      const res = await listSpaceSrTaskResultVoByPageUsingPost({
        spaceId: props.id as any,
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
      message.error(`加载超分结果失败，${res.data.message || '请稍后重试'}`)
      return
    }

    const res = await listMySrTaskResultVoByPageUsingPost({
      bizType: searchParams.bizType,
      current: searchParams.current,
      pageSize: searchParams.pageSize,
      taskNo: searchParams.taskNo,
      modelName: searchParams.modelName,
    })
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
      return
    }
    message.error(`加载超分结果失败，${res.data.message || '请稍后重试'}`)
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

const goToGalleryUpload = () => {
  router.push(`/upload_case?uploadType=file&from=sr_result&sourceSpaceId=${props.id}`)
}

const backToSpace = () => {
  router.push(`/space/${props.id}`)
}

const doDownload = async (item: SrTaskResultVO) => {
  if (!item.outputUrl) {
    return
  }
  try {
    const fileName =
      item.outputFileKey?.split('/').filter(Boolean).pop() ||
      `${item.taskNo || 'sr-result'}.${item.outputFormat || 'png'}`
    await downloadImage(item.outputUrl, fileName)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`下载结果失败，${errorMessage}`)
  }
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
@import '@/styles/variables.less';

.result-shell {
  padding: 24px;
}

.result-card {
  height: 100%;
}

.meta {
  width: 100%;
  font-size: 13px;
  line-height: 1.8;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.label {
  color: @text-secondary;
}
</style>
