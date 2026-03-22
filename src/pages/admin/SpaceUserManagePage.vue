<template>
  <div id="spaceManagePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">协作成员管理</h2>
        <p class="app-page__subtitle">为当前团队协作空间分配成员、调整角色，并移除不再参与的成员。</p>
      </div>
      <div class="app-page__actions">
        <a-button href="/space_analyze?queryPublic=1" target="_blank">案例展厅分析</a-button>
        <a-button href="/space_analyze?queryAll=1" target="_blank">全局空间分析</a-button>
      </div>
    </section>

    <section class="app-filter-bar">
      <a-form layout="inline" :model="formData" @finish="handleSubmit">
        <a-form-item label="用户 ID" name="userId">
          <a-input-number v-model:value="formData.userId" placeholder="输入用户 ID" style="width: 180px" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">添加成员</a-button>
        </a-form-item>
      </a-form>
    </section>

    <section class="app-table-card">
      <a-table :columns="columns" :data-source="dataList" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'userInfo'">
            <a-space>
              <a-avatar :src="record.user?.userAvatar" />
              {{ record.user?.userName }}
            </a-space>
          </template>
          <template v-else-if="column.dataIndex === 'spaceRole'">
            <a-select
              v-model:value="record.spaceRole"
              :options="SPACE_ROLE_OPTIONS"
              @change="handleRoleChange($event, record)"
            />
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" danger @click="doDelete(record.id)">移除</a-button>
          </template>
        </template>
      </a-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { onMounted, reactive, ref } from 'vue'
import {
  addSpaceUserUsingPost,
  deleteSpaceUserUsingPost,
  editSpaceUserUsingPost,
  listSpaceUserUsingPost,
} from '@/api/spaceUserController.ts'
import { SPACE_ROLE_OPTIONS } from '@/constants/space.ts'

interface Props {
  id: string | number
}

const props = defineProps<Props>()

const columns = [
  { title: '成员', dataIndex: 'userInfo' },
  { title: '角色', dataIndex: 'spaceRole' },
  { title: '加入时间', dataIndex: 'createTime' },
  { title: '操作', key: 'action' },
]

const dataList = ref<API.SpaceUserVO[]>([])
const formData = reactive<API.SpaceUserAddRequest>({})

const fetchData = async () => {
  const res = await listSpaceUserUsingPost({
    spaceId: props.id as any,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data ?? []
    return
  }
  message.error('获取成员数据失败，' + res.data.message)
}

const handleSubmit = async () => {
  const res = await addSpaceUserUsingPost({
    spaceId: props.id as any,
    ...formData,
  })
  if (res.data.code === 0) {
    message.success('添加成功')
    fetchData()
    return
  }
  message.error('添加失败，' + res.data.message)
}

const handleRoleChange = (value: string | number, record: API.SpaceUserVO) => {
  editSpaceRole(String(value), record)
}

const editSpaceRole = async (value: string, record: API.SpaceUserVO) => {
  const res = await editSpaceUserUsingPost({
    id: record.id,
    spaceRole: value,
  })
  if (res.data.code === 0) {
    message.success('角色已更新')
  } else {
    message.error('角色更新失败，' + res.data.message)
  }
}

const doDelete = async (id: string | number) => {
  if (!id) {
    return
  }
  const res = await deleteSpaceUserUsingPost({ id: id as any })
  
  if (res.data.code === 0) {
    message.success('成员已移除')
    fetchData()
    return
  }
  message.error('移除失败')
}

onMounted(() => {
  fetchData()
})
</script>
