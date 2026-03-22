export const SR_LOCKED_MODEL_NAME = 'RealESRGAN_x4plus'
export const SR_DEFAULT_MODEL_VERSION = 'v1.0.0'

export const SR_TASK_TERMINAL_STATUS = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED'])

export const SR_TASK_STATUS_MAP: Record<string, string> = {
  CREATED: '已创建',
  QUEUED: '排队中',
  RUNNING: '处理中',
  SUCCEEDED: '已完成',
  FAILED: '失败',
  CANCELLED: '已取消',
}

export const SR_BIZ_TYPE_MAP: Record<string, string> = {
  image: '图片',
  video: '视频',
}

export const SR_PROGRESS_STAGE_MAP: Record<number, string> = {
  5: '任务已接收',
  20: '视频探测完成',
  30: '进入逐帧处理',
  90: '视频合成完成',
  95: '结果已上传',
  100: '任务结束',
}

export const SR_VIDEO_FORMAT_SET = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'])

export const getSrTaskStatusText = (status?: string) => {
  if (!status) {
    return '未知状态'
  }
  return SR_TASK_STATUS_MAP[status] || status
}

export const getSrBizTypeText = (bizType?: string) => {
  if (!bizType) {
    return '-'
  }
  return SR_BIZ_TYPE_MAP[bizType] || bizType
}

export const getSrProgressStageText = (progress?: number) => {
  if (progress === undefined || progress === null) {
    return '等待调度'
  }

  if (progress >= 95) {
    return SR_PROGRESS_STAGE_MAP[95]
  }
  if (progress >= 90) {
    return SR_PROGRESS_STAGE_MAP[90]
  }
  if (progress >= 30) {
    return SR_PROGRESS_STAGE_MAP[30]
  }
  if (progress >= 20) {
    return SR_PROGRESS_STAGE_MAP[20]
  }
  if (progress >= 5) {
    return SR_PROGRESS_STAGE_MAP[5]
  }
  return '等待调度'
}

export const isVideoMedia = (format?: string) => {
  return SR_VIDEO_FORMAT_SET.has((format || '').toLowerCase())
}
