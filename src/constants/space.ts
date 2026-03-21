export const SPACE_LEVEL_ENUM = {
  COMMON: 0,
  PROFESSIONAL: 1,
  FLAGSHIP: 2,
} as const

export const SPACE_LEVEL_MAP: Record<number, string> = {
  0: '标准版',
  1: '专业版',
  2: '旗舰版',
}

export const SPACE_LEVEL_OPTIONS = Object.keys(SPACE_LEVEL_MAP).map((key) => {
  const value = Number(key)
  return {
    label: SPACE_LEVEL_MAP[value],
    value,
  }
})

export const SPACE_TYPE_ENUM = {
  PRIVATE: 0,
  TEAM: 1,
} as const

export const SPACE_TYPE_MAP: Record<number, string> = {
  0: '人工作空间',
  1: '团队协作空间',
}

export const SPACE_TYPE_OPTIONS = Object.keys(SPACE_TYPE_MAP).map((key) => {
  const value = Number(key)
  return {
    label: SPACE_TYPE_MAP[value],
    value,
  }
})

export const SPACE_ROLE_ENUM = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin',
} as const

export const SPACE_ROLE_MAP: Record<string, string> = {
  viewer: '查看者',
  editor: '协作者',
  admin: '管理员',
}

export const SPACE_ROLE_OPTIONS = Object.keys(SPACE_ROLE_MAP).map((key) => {
  return {
    label: SPACE_ROLE_MAP[key],
    value: key,
  }
})

export const SPACE_PERMISSION_ENUM = {
  ADMIN_UPDATE_IMAGE: 'admin.update.image',
  ADMIN_ANALYZE_PERMISSIONS: 'admin.analyze.permissions',
  ADMIN_BATCH_UPLOAD_IMAGE: 'admin.batchUpload.image',
  USER_MANAGE: 'admin.user.manage',

  PUBLIC_VIEW_IMAGE: 'public.view.image',
  PUBLIC_UPLOAD_IMAGE: 'public.upload.image',
  PUBLIC_MODIFY_IMAGE: 'public.modify.image',
  PUBLIC_DELETE_IMAGE: 'public.delete.image',

  PRIVATE_VIEW_IMAGE: 'private.view.image',
  PRIVATE_UPLOAD_IMAGE: 'private.upload.image',
  PRIVATE_MODIFY_IMAGE: 'private.modify.image',
  PRIVATE_DELETE_IMAGE: 'private.delete.image',
  PRIVATE_ANALYZE_PERMISSIONS: 'private.analyze.permissions',

  TEAM_VIEW_IMAGE: 'team.view.image',
  TEAM_UPLOAD_IMAGE: 'team.upload.image',
  TEAM_MODIFY_IMAGE: 'team.modify.image',
  TEAM_DELETE_IMAGE: 'team.delete.image',
  TEAM_MANAGE_MEMBERS: 'team.manage.members',
  TEAM_ANALYZE_PERMISSIONS: 'team.analyze.permissions',
} as const
