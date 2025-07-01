// 空间级别枚举
export const SPACE_LEVEL_ENUM = {
  COMMON: 0,
  PROFESSIONAL: 1,
  FLAGSHIP: 2,
} as const

// 空间级别文本映射
export const SPACE_LEVEL_MAP: Record<number, string> = {
  0: '普通版',
  1: '专业版',
  2: '旗舰版',
}

// 空间级别选项映射
export const SPACE_LEVEL_OPTIONS = Object.keys(SPACE_LEVEL_MAP).map((key) => {
  const value = Number(key) // Convert string key to number
  return {
    label: SPACE_LEVEL_MAP[value],
    value,
  }
})

// 空间类型枚举
export const SPACE_TYPE_ENUM = {
  PRIVATE: 0,
  TEAM: 1,
}

// 空间类型文本映射
export const SPACE_TYPE_MAP: Record<number, string> = {
  0: '私有空间',
  1: '团队空间',
}

// 空间类型选项映射
export const SPACE_TYPE_OPTIONS = Object.keys(SPACE_TYPE_MAP).map((key) => {
  const value = Number(key) // 将字符串 key 转换为数字
  return {
    label: SPACE_TYPE_MAP[value],
    value,
  }
})

// 空间角色枚举
export const SPACE_ROLE_ENUM = {
  VIEWER: "viewer",
  EDITOR: "editor",
  ADMIN: "admin",
} as const;

// 空间角色文本映射
export const SPACE_ROLE_MAP: Record<string, string> = {
  viewer: "浏览者",
  editor: "编辑者",
  admin: "管理员",
};

// 空间角色选项映射
export const SPACE_ROLE_OPTIONS = Object.keys(SPACE_ROLE_MAP).map((key) => {
  return {
    label: SPACE_ROLE_MAP[key],
    value: key,
  };
});

/**
 * 空间权限常量
 */
export const SPACE_PERMISSION_ENUM = {
  // 全局权限
  ADMIN_UPDATE_IMAGE: "admin.update.image",
  ADMIN_ANALYZE_PERMISSIONS: "admin.analyze.permissions",
  ADMIN_BATCH_UPLOAD_IMAGE: "admin.batchUpload.image",
  USER_MANAGE: "admin.user.manage",

  // 公共空间权限
  PUBLIC_VIEW_IMAGE: "public.view.image",
  PUBLIC_UPLOAD_IMAGE: "public.upload.image",
  PUBLIC_MODIFY_IMAGE: "public.modify.image",
  PUBLIC_DELETE_IMAGE: "public.delete.image",

  // 私人空间权限
  PRIVATE_VIEW_IMAGE: "private.view.image",
  PRIVATE_UPLOAD_IMAGE: "private.upload.image",
  PRIVATE_MODIFY_IMAGE: "private.modify.image",
  PRIVATE_DELETE_IMAGE: "private.delete.image",
  PRIVATE_ANALYZE_PERMISSIONS: "private.analyze.permissions",

  // 团队空间权限
  TEAM_VIEW_IMAGE: "team.view.image",
  TEAM_UPLOAD_IMAGE: "team.upload.image",
  TEAM_MODIFY_IMAGE: "team.modify.image",
  TEAM_DELETE_IMAGE: "team.delete.image",
  TEAM_MANAGE_MEMBERS: "team.manage.members",
  TEAM_ANALYZE_PERMISSIONS: "team.analyze.permissions",
} as const;
