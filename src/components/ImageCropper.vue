<template>
  <a-modal
    class="image-cropper"
    v-model:visible="visible"
    title="编辑素材"
    :footer="false"
    @cancel="closeModal"
  >
    <vue-cropper
      ref="cropperRef"
      :img="imageUrl"
      output-type="png"
      :info="true"
      :can-move-box="true"
      :fixed-box="false"
      :auto-crop="true"
      :center-box="true"
    />
    <div style="margin-bottom: 16px" />
    <div class="image-edit-actions" v-if="isTeamSpace">
      <a-space>
        <a-button v-if="editingUser" disabled>{{ editingUser.userName }} 正在编辑</a-button>
        <a-button v-if="canEnterEdit" type="primary" ghost @click="enterEdit">进入编辑</a-button>
        <a-button v-if="canExitEdit" danger ghost @click="exitEdit">退出编辑</a-button>
      </a-space>
    </div>
    <div style="margin-bottom: 16px" />
    <div class="image-cropper-actions">
      <a-space>
        <a-button @click="rotateLeft" :disabled="!canEdit">向左旋转</a-button>
        <a-button @click="rotateRight" :disabled="!canEdit">向右旋转</a-button>
        <a-button @click="changeScale(1)" :disabled="!canEdit">放大</a-button>
        <a-button @click="changeScale(-1)" :disabled="!canEdit">缩小</a-button>
        <a-button type="primary" :loading="loading" :disabled="!canEdit" @click="handleConfirm">
          确认保存
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onUnmounted, ref, watchEffect } from 'vue'
import { uploadPictureUsingPost } from '@/api/pictureController.ts'
import { getOnceTokenUsingGet } from '@/api/userController.ts'
import { PICTURE_EDIT_ACTION_ENUM, PICTURE_EDIT_MESSAGE_TYPE_ENUM } from '@/constants/picture.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import PictureEditWebSocket from '@/utils/pictureEditWebSocket.ts'

interface Props {
  imageUrl?: string
  picture?: API.PictureVO
  spaceId?: string | number
  space?: API.SpaceVO
  onSuccess?: (newPicture: API.PictureVO) => void
}

type UploadResponse = {
  data: API.BaseResponsePictureVO_
}

const props = defineProps<Props>()

const isTeamSpace = computed(() => props.space?.spaceType === SPACE_TYPE_ENUM.TEAM)
const cropperRef = ref()
const visible = ref(false)
const loading = ref(false)
const loginUserStore = useLoginUserStore()
const loginUser = loginUserStore.loginUser
const editingUser = ref<API.UserVO>()

const canEnterEdit = computed(() => !editingUser.value)
const canExitEdit = computed(() => editingUser.value?.id === loginUser.id)
const canEdit = computed(() => {
  if (!isTeamSpace.value) {
    return true
  }
  return editingUser.value?.id === loginUser.id
})

let websocket: PictureEditWebSocket | null = null

const changeScale = (num: number) => {
  cropperRef.value?.changeScale(num)
  editAction(num > 0 ? PICTURE_EDIT_ACTION_ENUM.ZOOM_IN : PICTURE_EDIT_ACTION_ENUM.ZOOM_OUT)
}

const rotateLeft = () => {
  cropperRef.value?.rotateLeft()
  editAction(PICTURE_EDIT_ACTION_ENUM.ROTATE_LEFT)
}

const rotateRight = () => {
  cropperRef.value?.rotateRight()
  editAction(PICTURE_EDIT_ACTION_ENUM.ROTATE_RIGHT)
}

const handleConfirm = async () => {
  cropperRef.value?.getCropBlob(async (blob: Blob) => {
    const fileName = `${props.picture?.name || 'image'}.png`
    const file = new File([blob], fileName, { type: blob.type })
    try {
      const res = await getOnceTokenUsingGet()
      if (res.data.code === 0 && res.data.data) {
        await handleUpload({ file })
      } else {
        message.error('获取一次性令牌失败，' + res.data.message)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '请稍后重试'
      message.error('获取一次性令牌失败，' + errorMessage)
    }
  })
}

const handleUpload = async ({ file }: { file: File }) => {
  loading.value = true
  try {
    const params: API.PictureUploadRequest = props.picture?.id ? { id: props.picture.id } : {}
    if (props.spaceId) {
      params.spaceId = props.spaceId as any
    }
    const res = (await uploadPictureUsingPost(params, {}, file)) as UploadResponse
    if (res.data.code === 0 && res.data.data) {
      message.success('素材上传成功')
      props.onSuccess?.(res.data.data)
      closeModal()
    } else {
      message.error('素材上传失败，' + res.data.message)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error('素材上传失败，' + errorMessage)
  }
  loading.value = false
}

const openModal = () => {
  visible.value = true
}

const closeModal = () => {
  visible.value = false
  websocket?.disconnect()
  editingUser.value = undefined
}

defineExpose({
  openModal,
})

const initWebsocket = () => {
  const pictureId = props.picture?.id
  if (!pictureId || !visible.value) {
    return
  }

  websocket?.disconnect()

  websocket = new PictureEditWebSocket(pictureId)
  websocket.connect()

  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.INFO, (msg) => {
    message.info(msg.message)
  })

  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.ERROR, (msg) => {
    message.error(msg.message)
  })

  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.ENTER_EDIT, (msg) => {
    message.info(msg.message)
    editingUser.value = msg.user
  })

  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.EDIT_ACTION, (msg) => {
    switch (msg.editAction) {
      case PICTURE_EDIT_ACTION_ENUM.ROTATE_LEFT:
        cropperRef.value?.rotateLeft()
        break
      case PICTURE_EDIT_ACTION_ENUM.ROTATE_RIGHT:
        cropperRef.value?.rotateRight()
        break
      case PICTURE_EDIT_ACTION_ENUM.ZOOM_IN:
        cropperRef.value?.changeScale(1)
        break
      case PICTURE_EDIT_ACTION_ENUM.ZOOM_OUT:
        cropperRef.value?.changeScale(-1)
        break
    }
  })

  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.EXIT_EDIT, (msg) => {
    message.info(msg.message)
    editingUser.value = undefined
  })
}

watchEffect(() => {
  if (isTeamSpace.value) {
    initWebsocket()
  }
})

onUnmounted(() => {
  websocket?.disconnect()
  editingUser.value = undefined
})

const enterEdit = () => {
  websocket?.sendMessage({
    type: PICTURE_EDIT_MESSAGE_TYPE_ENUM.ENTER_EDIT,
  })
}

const exitEdit = () => {
  websocket?.sendMessage({
    type: PICTURE_EDIT_MESSAGE_TYPE_ENUM.EXIT_EDIT,
  })
}

const editAction = (action: string) => {
  websocket?.sendMessage({
    type: PICTURE_EDIT_MESSAGE_TYPE_ENUM.EDIT_ACTION,
    editAction: action,
  })
}
</script>

<style>
.image-cropper {
  text-align: center;
}

.image-cropper .vue-cropper {
  height: 400px !important;
}
</style>
