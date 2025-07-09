/**
 * 图片审核状态
 */
export const PIC_REVIEW_STATUS_ENUM = {
  PENDING_REVIEW: 0, // 待审核
  AI_SUSPICIOUS: 3,  // 机审存疑
  FINAL_APPROVED: 6, // 最终通过
  FINAL_REJECTED: 7, // 最终拒绝
  APPEAL_PENDING: 8, // 申诉中
}

/**
 * 图片审核状态文案
 */
export const PIC_REVIEW_STATUS_MAP: Record<number, string> = {
  0: '待审核',
  3: '机审存疑',
  6: '最终通过',
  7: '最终拒绝',
  8: '申诉中',
}

/**
 * 图片审核下拉表单选项
 */
export const PIC_REVIEW_STATUS_OPTIONS = Object.keys(PIC_REVIEW_STATUS_MAP).map((key) => {
  const numKey = Number(key) as keyof typeof PIC_REVIEW_STATUS_MAP;
  return {
    label: PIC_REVIEW_STATUS_MAP[numKey],
    value: numKey,
  }
})

/**
 * 图片编辑消息类型枚举
 */
export const PICTURE_EDIT_MESSAGE_TYPE_ENUM = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  ENTER_EDIT: 'ENTER_EDIT',
  EXIT_EDIT: 'EXIT_EDIT',
  EDIT_ACTION: 'EDIT_ACTION',
};

/**
 * 图片编辑消息类型映射
 */
export const PICTURE_EDIT_MESSAGE_TYPE_MAP = {
  INFO: '发送通知',
  ERROR: '发送错误',
  ENTER_EDIT: '进入编辑状态',
  EXIT_EDIT: '退出编辑状态',
  EDIT_ACTION: '执行编辑操作',
};

/**
 * 图片编辑操作枚举
 */
export const PICTURE_EDIT_ACTION_ENUM = {
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ROTATE_LEFT: 'ROTATE_LEFT',
  ROTATE_RIGHT: 'ROTATE_RIGHT',
};

/**
 * 图片编辑操作映射
 */
export const PICTURE_EDIT_ACTION_MAP = {
  ZOOM_IN: '放大操作',
  ZOOM_OUT: '缩小操作',
  ROTATE_LEFT: '左旋操作',
  ROTATE_RIGHT: '右旋操作',
};
