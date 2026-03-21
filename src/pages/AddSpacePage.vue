<template>
  <div id="addSpacePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">{{ isEditMode ? '编辑' : '创建' }}{{ SPACE_TYPE_MAP[spaceType] }}</h2>
        <p class="app-page__subtitle">为个人处理流或团队协作流创建独立工作空间，并选择容量规格。</p>
      </div>
    </section>

    <div class="space-grid">
      <section class="app-form-card">
        <a-form name="spaceForm" layout="vertical" :model="spaceForm" @finish="handleSubmit">
          <a-form-item name="spaceName" label="空间名称">
            <a-input v-model:value="spaceForm.spaceName" placeholder="请输入空间名称" allow-clear />
          </a-form-item>
          <a-form-item name="spaceLevel" label="空间规格">
            <a-select
              v-model:value="spaceForm.spaceLevel"
              style="width: 100%"
              placeholder="请选择空间规格"
              :options="SPACE_LEVEL_OPTIONS"
              allow-clear
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="loading" style="width: 100%">
              提交
            </a-button>
          </a-form-item>
        </a-form>
      </section>

      <section class="app-card app-card--soft level-card">
        <h3 class="app-section-title">空间规格说明</h3>
        <p class="app-section-desc">可先使用标准版空间，后续再进入套餐升级页扩容。</p>
        <div class="level-list">
          <div v-for="spaceLevel in spaceLevelList" :key="spaceLevel.value" class="level-item">
            <strong>{{ spaceLevel.text }}</strong>
            <span>容量 {{ formatSize(spaceLevel.maxSize) }}</span>
            <span>数量 {{ spaceLevel.maxCount }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import {
  addSpaceUsingPost,
  getSpaceVoByIdUsingGet,
  listSpaceLevelUsingGet,
  updateSpaceUsingPost,
} from '@/api/spaceController.ts'
import { SPACE_LEVEL_OPTIONS, SPACE_TYPE_ENUM, SPACE_TYPE_MAP } from '@/constants/space.ts'
import { formatSize } from '@/utils'

type SpaceFormState = {
  spaceName?: string
  spaceLevel?: number
}

const route = useRoute()
const router = useRouter()
const space = ref<API.SpaceVO>()
const spaceForm = reactive<SpaceFormState>({})
const loading = ref(false)
const spaceLevelList = ref<API.SpaceLevel[]>([])

const routeId = computed(() => {
  const rawId = route.query?.id
  return rawId ? Number(rawId) : undefined
})

const isEditMode = computed(() => Boolean(routeId.value))
const spaceType = computed(() => {
  const rawType = route.query?.type
  return rawType ? Number(rawType) : SPACE_TYPE_ENUM.PRIVATE
})

const fetchSpaceLevelList = async () => {
  const res = await listSpaceLevelUsingGet()
  if (res.data.code === 0 && res.data.data) {
    spaceLevelList.value = res.data.data
    return
  }
  message.error('获取空间规格失败，' + res.data.message)
}

const handleSubmit = async () => {
  loading.value = true
  let res
  if (space.value?.id) {
    res = await updateSpaceUsingPost({
      id: space.value.id,
      spaceName: spaceForm.spaceName,
    })
  } else {
    res = await addSpaceUsingPost({
      spaceName: spaceForm.spaceName,
      spaceLevel: spaceForm.spaceLevel,
      spaceType: spaceType.value,
    })
  }

  if (res.data.code === 0 && res.data.data) {
    message.success('操作成功')
    router.push({
      path: `/space/${res.data.data}`,
    })
  } else {
    message.error('操作失败，' + res.data.message)
  }
  loading.value = false
}

const getOldSpace = async () => {
  if (!routeId.value) return

  const res = await getSpaceVoByIdUsingGet({
    id: routeId.value,
  })
  if (res.data.code === 0 && res.data.data) {
    const data = res.data.data
    space.value = data
    spaceForm.spaceName = data.spaceName
    spaceForm.spaceLevel = data.spaceLevel
  }
}

onMounted(() => {
  fetchSpaceLevelList()
  getOldSpace()
})
</script>

<style scoped lang="less">
.space-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}

.level-card {
  padding: 24px;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}

.level-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
}

@media (max-width: 960px) {
  .space-grid {
    grid-template-columns: 1fr;
  }
}
</style>
