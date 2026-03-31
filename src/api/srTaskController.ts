import request from '@/request.ts'

export interface SrTaskCreateRequest {
  type?: 'image' | 'video'
  pictureId?: string | number
  inputFileKey?: string
  scale?: 2 | 4
  modelName?: string
  modelVersion?: string
  videoOptions?: {
    keepAudio?: boolean
    extractFrameFirst?: boolean
    fpsOverride?: number
  }
}

export interface SrTaskVO {
  id?: string | number
  pictureId?: string | number
  status?: 'CREATED' | 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
  progress?: number
  outputFileKey?: string
  errorCode?: string
  errorMsg?: string
}

export interface BaseResponseSrTaskVO {
  code?: number
  data?: SrTaskVO
  message?: string
}

export interface SrTaskResultVO {
  id?: string | number
  taskId?: string | number
  taskNo?: string
  userId?: string | number
  spaceId?: string | number
  bizType?: string
  modelName?: string
  modelVersion?: string
  inputFileKey?: string
  inputFileUrl?: string
  outputFileKey?: string
  outputUrl?: string
  outputFormat?: string
  outputSize?: number
  outputWidth?: number
  outputHeight?: number
  durationMs?: number
  fps?: number
  bitrateKbps?: number
  codec?: string
  costMs?: number
  attempt?: number
  traceId?: string
  createTime?: string
  updateTime?: string
}

export interface PageSrTaskResultVO {
  records?: SrTaskResultVO[]
  total?: number
  size?: number
  current?: number
}

export interface BaseResponsePageSrTaskResultVO {
  code?: number
  data?: PageSrTaskResultVO
  message?: string
}

export interface SrTaskResultQueryRequest {
  current?: number
  pageSize?: number
  taskNo?: string
  bizType?: 'image' | 'video'
  modelName?: string
  startTime?: string
  endTime?: string
}

export interface SrTaskSpaceResultQueryRequest {
  spaceId: string | number
  current?: number
  pageSize?: number
  taskNo?: string
  bizType?: 'image' | 'video'
  modelName?: string
  startTime?: string
  endTime?: string
}

/**
 * createSrTask POST /api/sr/task/create
 */
export async function createSrTaskUsingPost(body: SrTaskCreateRequest) {
  return request<API.BaseResponseLong_>('/api/sr/task/create', {
    method: 'POST',
    data: body,
  })
}

/**
 * getSrTaskVOById GET /api/sr/task/get/vo
 */
export async function getSrTaskVoByIdUsingGet(params: { id: string | number }) {
  return request<BaseResponseSrTaskVO>('/api/sr/task/get/vo', {
    method: 'GET',
    params,
  })
}

/**
 * listMySrTaskResultVOByPage POST /api/sr/task/result/list/page/my/vo
 */
export async function listMySrTaskResultVoByPageUsingPost(body: SrTaskResultQueryRequest) {
  return request<BaseResponsePageSrTaskResultVO>('/api/sr/task/result/list/page/my/vo', {
    method: 'POST',
    data: body,
  })
}

/**
 * listSpaceSrTaskResultVOByPage POST /api/sr/task/result/list/page/space/vo
 */
export async function listSpaceSrTaskResultVoByPageUsingPost(body: SrTaskSpaceResultQueryRequest) {
  return request<BaseResponsePageSrTaskResultVO>('/api/sr/task/result/list/page/space/vo', {
    method: 'POST',
    data: body,
  })
}
