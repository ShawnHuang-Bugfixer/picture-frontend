// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** setReviewStatus POST /api/message/ack/review */
export async function setReviewStatusUsingPost(
  body: API.ACKReviewMessage,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/message/ack/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** getUnreadMessageNum GET /api/message/unread/num */
export async function getUnreadMessageNumUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseLong_>('/api/message/unread/num', {
    method: 'GET',
    ...(options || {}),
  })
}

/** getUnreadMessageList GET /api/message/unread/list */
export async function getUnreadMessageListUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListReviewMessage_>('/api/message/unread/list', {
    method: 'GET',
    ...(options || {}),
  })
}
