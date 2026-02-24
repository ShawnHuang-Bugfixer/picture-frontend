<template>
  <div id="srTaskResultPage">
    <a-card>
      <a-flex justify="space-between" align="center">
        <h2>超分结果</h2>
        <a-space>
          <a-tag>{{ spaceTypeText }}</a-tag>
          <a-button @click="backToSpace">返回空间</a-button>
        </a-space>
      </a-flex>

      <a-form layout="inline" :model="searchParams" style="margin-top: 12px">
        <a-form-item label="任务号">
          <a-input
            v-model:value="searchParams.taskNo"
            allow-clear
            placeholder="请输入任务号"
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
        <a-form-item>
          <a-button type="primary" @click="doSearch">查询</a-button>
        </a-form-item>
        <a-form-item>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div style="margin-bottom: 12px" />

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && dataList.length === 0" description="暂无超分结果" />

      <a-list
        v-else
        :data-source="dataList"
        :grid="{ gutter: 16, column: 4, xs: 1, sm: 2, md: 3, lg: 4 }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card hoverable>
              <a-image
                :src="item.outputUrl"
                alt="sr-result"
                style="width: 100%; height: 180px; object-fit: cover"
              />
              <div class="meta">
                <div><span class="label">任务号：</span>{{ item.taskNo || '-' }}</div>
                <div><span class="label">模型：</span>{{ item.modelName || '-' }}</div>
                <div><span class="label">耗时：</span>{{ item.costMs ?? '-' }} ms</div>
                <div v-if="isTeamSpace">
                  <span class="label">创建者：</span>{{ item.userId ?? '-' }}
                </div>
                <a-space style="margin-top: 8px">
                  <a :href="item.outputUrl" target="_blank">查看原图</a>
                  <a :href="item.outputUrl" download>下载</a>
                </a-space>
              </div>
            </a-card>
          </a-list-item>
        </template>
      </a-list>
    </a-spin>

    <a-pagination
      style="text-align: right; margin-top: 16px"
      v-model:current="searchParams.current"
      v-model:pageSize="searchParams.pageSize"
      :total="total"
      show-size-changer
      :page-size-options="['10', '20', '50']"
      @change="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import { getLoginUserUsingGet, getPermissionsUsingPost } from '@/api/userController.ts'
import {
  listMySrTaskResultVoByPageUsingPost,
  listSpaceSrTaskResultVoByPageUsingPost,
  type SrTaskResultVO,
} from '@/api/srTaskController.ts'
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

const searchParams = reactive({
  current: 1,
  pageSize: 12,
  taskNo: undefined as string | undefined,
  modelName: undefined as string | undefined,
})

const isTeamSpace = computed(() => space.value.spaceType === 1)
const spaceTypeText = computed(() => SPACE_TYPE_MAP[space.value.spaceType || 0] || '空间')
const hasViewPermission = computed(() => {
  if (!isTeamSpace.value) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_VIEW_IMAGE)
  }
  return permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_VIEW_IMAGE)
})

const checkAccess = async () => {
  const loginRes = await getLoginUserUsingGet()
  if (loginRes.data.code === 0 && loginRes.data.data) {
    loginUser.value = loginRes.data.data
  }
  const spaceRes = await getSpaceVoByIdUsingGet({ id: props.id })
  if (spaceRes.data.code === 0 && spaceRes.data.data) {
    space.value = spaceRes.data.data
  } else {
    throw new Error(spaceRes.data.message || '空间不存在')
  }
  if (!loginUser.value?.id) {
    throw new Error('请先登录')
  }
  const permissionRes = await getPermissionsUsingPost({
    spaceId: props.id,
    userId: loginUser.value.id,
  })
  if (permissionRes.data.code === 0 && permissionRes.data.data) {
    permissionList.value = permissionRes.data.data
  }
  if (!hasViewPermission.value) {
    throw new Error('无权限查看该空间的超分结果')
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    if (isTeamSpace.value) {
      const res = await listSpaceSrTaskResultVoByPageUsingPost({
        spaceId: props.id,
        current: searchParams.current,
        pageSize: searchParams.pageSize,
        taskNo: searchParams.taskNo,
        modelName: searchParams.modelName,
      })
      if (res.data.code === 0 && res.data.data) {
        dataList.value = res.data.data.records ?? []
        total.value = res.data.data.total ?? 0
      } else {
        message.error('加载超分结果失败，' + (res.data.message || '请稍后重试'))
      }
      return
    }
    const res = await listMySrTaskResultVoByPageUsingPost({
      bizType: 'image',
      current: searchParams.current,
      pageSize: searchParams.pageSize,
      taskNo: searchParams.taskNo,
      modelName: searchParams.modelName,
    })
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
    } else {
      message.error('加载超分结果失败，' + (res.data.message || '请稍后重试'))
    }
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
  fetchData()
}

const backToSpace = () => {
  router.push(`/space/${props.id}`)
}

onMounted(async () => {
  try {
    await checkAccess()
    await fetchData()
  } catch (e: any) {
    message.error(e?.message || '加载超分结果失败')
  }
})
</script>

<style scoped lang="less">
#srTaskResultPage {
  .meta {
    margin-top: 10px;
    font-size: 13px;
    line-height: 1.8;
  }

  .label {
    color: #777;
  }
}
</style>
