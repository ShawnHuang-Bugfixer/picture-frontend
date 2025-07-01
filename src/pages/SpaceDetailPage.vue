<template>
  <div id="spaceDetailPage">
    <!-- 空间信息 -->
    <a-flex justify="space-between">
      <h2>{{ space.spaceName }}（{{ SPACE_TYPE_MAP[space.spaceType] }}）</h2>
      <a-space size="middle">
        <a-button
          v-if="canUploadPicture"
          type="primary"
          :href="`/add_picture?spaceId=${id}`"
          target="_blank"
        >
          + 创建图片
        </a-button>
        <a-button
          v-if="canManageSpaceUser"
          type="primary"
          ghost
          :icon="h(TeamOutlined)"
          :href="`/spaceUserManage/${id}`"
          target="_blank"
        >
          成员管理
        </a-button>
        <a-button
          v-if="canAnalyseSpace"
          type="primary"
          ghost
          :icon="h(BarChartOutlined)"
          :href="`/space_analyze?spaceId=${id}`"
          target="_blank"
        >
          空间分析
        </a-button>
        <a-button v-if="canEditPicture" :icon="h(EditOutlined)" @click="doBatchEdit"> 批量编辑</a-button>
        <a-tooltip
          :title="`占用空间 ${formatSize(space.totalSize)} / ${formatSize(space.maxSize)}`"
        >
          <a-progress
            type="circle"
            :size="42"
            :percent="((space.totalSize * 100) / space.maxSize).toFixed(1)"
          />
        </a-tooltip>
      </a-space>

    </a-flex>
    <div style="margin-bottom: 16px" />
    <!-- 搜索表单 -->
    <PictureSearchForm :onSearch="onSearch" />
    <div style="margin-bottom: 16px" />
    <!-- 按颜色搜索，跟其他搜索条件独立 -->
    <a-form-item label="按颜色搜索">
      <color-picker format="hex" @pureColorChange="onColorChange" />
    </a-form-item>
    <!-- 图片列表 -->
    <PictureList
      :dataList="dataList"
      :loading="loading"
      :showOp="true"
      :canEdit="canEditPicture"
      :canDelete="canDeletePicture"
      :onReload="fetchData"
    />
    <!-- 分页 -->
    <a-pagination
      style="text-align: right"
      v-model:current="searchParams.current"
      v-model:pageSize="searchParams.pageSize"
      :total="total"
      @change="onPageChange"
    />
    <BatchEditPictureModal
      ref="batchEditPictureModalRef"
      :spaceId="id"
      :pictureList="dataList"
      :onSuccess="onBatchEditPictureSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import {
  listPictureVoByPageUsingPost,
  searchPictureByColorUsingPost,
} from '@/api/pictureController.ts'
import { formatSize } from '@/utils'
import PictureList from '@/components/PictureList.vue'
import PictureSearchForm from '@/components/PictureSearchForm.vue'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
import BatchEditPictureModal from '@/components/BatchEditPictureModal.vue'
import { BarChartOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons-vue'
import { SPACE_PERMISSION_ENUM, SPACE_TYPE_MAP } from '../constants/space.ts'
import { getLoginUserUsingGet, getPermissionsUsingPost } from '@/api/userController.ts'

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const space = ref<API.SpaceVO>({})

// 登录用户信息
const loginUser = ref<API.LoginUserVO>()
// 权限列表
const permissionList = ref<string[]>([])

/**
 * 前端请求权限列表：
 * 1，前端好像使用了 openapi 自动生成了访问函数，将后端新增的接口补充在前端代码中，要求不修改前端代码，只新增不同的接口。
 * 1.1 前端生成的访问函数：
 * 1.2 后端接口：
 * 1.3 前端代码逻辑：使用 post 向后端接口 localhost:8123/api/user/permission 请求权限列表
 * 1.3.1 后端接收的请求参数
 * public class PermissionListRequest {
 *     private Long spaceId;
 *     private Long userId; // 当前登录用户的 userId
 *     private Long pictureId;
 * }
 * 1.3.1 前端函数的参数列表包含 spaceId, userId, pictureId。其中 userId 为当前登录的用户的 userId
 *
 * 重写前端权限校验逻辑：
 * 1. 问题：登录后的用户如何获取？
 * 2. 重新定义前端的权限枚举类
 * 3. 获取权限集合
 * 4. 校验权限
 * @param permission
 */

// 获取登录用户信息
async function fetchLoginUser() {
  const res = await getLoginUserUsingGet()
  if (res.data.code === 0 && res.data.data) {
    loginUser.value = res.data.data
  }
}

// 获取权限列表
const fetchPermissions = async () => {
  if (!loginUser.value?.id || !props.id) return

  try {
    const res = await getPermissionsUsingPost({
      spaceId: props.id,
      userId: loginUser.value.id,
      pictureId: undefined // 不需要特定图片权限时可不传或传undefined
    })
    if (res.data.code === 0 && res.data.data) {
      permissionList.value = res.data.data
    }
  } catch (e) {
    console.error('获取权限失败:', e)
  }
}

// 根据空间类型检查用户是否有某些操作对应的权限。
// spaceType == 0 检查 SPACE_PERMISSION_ENUM.PRIVATE_ANALYZE_PERMISSIONS
// spaceType == 1 检查 SPACE_PERMISSION_ENUM.TEAM_ANALYZE_PERMISSIONS
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

const canManageSpaceUser = computed(() => permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_MANAGE_MEMBERS))
// const canUploadPicture = computed(() => permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_UPLOAD_IMAGE))
// const canEditPicture = computed(() => permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_MODIFY_IMAGE))
// const canDeletePicture = computed(() => permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_DELETE_IMAGE))

// -------- 获取空间详情 --------
const fetchSpaceDetail = async () => {
  try {
    const res = await getSpaceVoByIdUsingGet({
      id: props.id,
    })
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
    } else {
      message.error('获取空间详情失败，' + res.data.message)
    }
  } catch (e: any) {
    message.error('获取空间详情失败：' + e.message)
  }
}

onMounted(async () => {
  await fetchLoginUser() // 先获取登录用户信息
  await fetchPermissions() // 然后获取权限
  await fetchSpaceDetail() // 最后获取空间详情
  fetchData() // 获取图片列表
})

// 当spaceId变化时重新获取数据
watch(
  () => props.id,
  async (newSpaceId) => {
    await fetchPermissions()
    await fetchSpaceDetail()
    fetchData()
  }
)

// --------- 获取图片列表 --------

// 定义数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

// 搜索条件
const searchParams = ref<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  // 转换搜索参数
  const params = {
    spaceId: props.id,
    ...searchParams.value,
  }
  const res = await listPictureVoByPageUsingPost(params)
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}

// 页面加载时获取数据，请求一次
onMounted(() => {
  fetchData()
})

// 分页参数
const onPageChange = (page: number, pageSize: number) => {
  searchParams.value.current = page
  searchParams.value.pageSize = pageSize
  fetchData()
}

// 搜索
const onSearch = (newSearchParams: API.PictureQueryRequest) => {
  console.log('new', newSearchParams)

  searchParams.value = {
    ...searchParams.value,
    ...newSearchParams,
    current: 1,
  }
  console.log('searchparams', searchParams.value)
  fetchData()
}

// 按照颜色搜索
const onColorChange = async (color: string) => {
  loading.value = true
  const res = await searchPictureByColorUsingPost({
    picColor: color,
    spaceId: props.id,
  })
  if (res.data.code === 0 && res.data.data) {
    const data = res.data.data ?? []
    dataList.value = data
    total.value = data.length
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}

// ---- 批量编辑图片 -----
const batchEditPictureModalRef = ref()

// 批量编辑图片成功
const onBatchEditPictureSuccess = () => {
  fetchData()
}

// 打开批量编辑图片弹窗
const doBatchEdit = () => {
  if (batchEditPictureModalRef.value) {
    batchEditPictureModalRef.value.openModal()
  }
}

// 空间 id 改变时，必须重新获取数据
watch(
  () => props.id,
  (newSpaceId) => {
    fetchSpaceDetail()
    fetchData()
  },
)
</script>

<style scoped>
#spaceDetailPage {
  margin-bottom: 16px;
}
</style>
