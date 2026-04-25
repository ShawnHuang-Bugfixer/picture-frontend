import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { APP_NAME, APP_SHORT_NAME } from '@/constants/app.ts'

const HomePage = () => import('@/pages/HomePage.vue')
const UserLoginPage = () => import('@/pages/user/UserLoginPage.vue')
const UserRegisterPage = () => import('@/pages/user/UserRegisterPage.vue')
const UserManagePage = () => import('@/pages/admin/UserManagePage.vue')
const AddPicturePage = () => import('@/pages/AddPicturePage.vue')
const UploadCasePage = () => import('@/pages/UploadCasePage.vue')
const PictureManagePage = () => import('@/pages/admin/PictureManagePage.vue')
const PictureDetailPage = () => import('@/pages/PictureDetailPage.vue')
const AddPictureBatchPage = () => import('@/pages/AddPictureBatchPage.vue')
const SpaceManagePage = () => import('@/pages/admin/SpaceManagePage.vue')
const AddSpacePage = () => import('@/pages/AddSpacePage.vue')
const MySpacePage = () => import('@/pages/MySpacePage.vue')
const SpaceDetailPage = () => import('@/pages/SpaceDetailPage.vue')
const SearchPicturePage = () => import('@/pages/SearchPicturePage.vue')
const SpaceAnalyzePage = () => import('@/pages/SpaceAnalyzePage.vue')
const SpaceUserManagePage = () => import('@/pages/admin/SpaceUserManagePage.vue')
const UserExchangeVipPage = () => import('@/pages/UserExchangeVipPage.vue')
const UserProfilePage = () => import('@/pages/user/UserProfilePage.vue')
const SrTaskResultPage = () => import('@/pages/SrTaskResultPage.vue')
const AboutView = () => import('@/views/AboutView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: {
      title: '首页',
      subtitle: '从这里上传低清图片或视频，开始修复任务、查看案例并回到你的处理流程。',
      navGroup: 'core',
      scene: 'home',
      shell: 'workspace',
    },
  },
  {
    path: '/user/login',
    name: '用户登录',
    component: UserLoginPage,
    meta: {
      title: '登录',
      subtitle: '登录后继续处理图片增强、视频超分和团队协作任务。',
      navGroup: 'auth',
      scene: 'auth',
      shell: 'auth',
    },
  },
  {
    path: '/user/register',
    name: '用户注册',
    component: UserRegisterPage,
    meta: {
      title: '注册',
      subtitle: '创建账号后即可进入超分工作台，开始提交图片和视频修复任务。',
      navGroup: 'auth',
      scene: 'auth',
      shell: 'auth',
    },
  },
  {
    path: '/admin/userManage',
    name: '用户管理',
    component: UserManagePage,
    meta: {
      title: '用户管理',
      subtitle: '查看平台成员、账户资料和角色分工，保持协作关系清晰。',
      navGroup: 'admin',
      scene: 'admin',
      shell: 'workspace',
    },
  },
  {
    path: '/admin/pictureManage',
    name: '素材管理',
    component: PictureManagePage,
    meta: {
      title: '素材管理',
      subtitle: '统一查看公开样例、筛选待处理内容，并维护案例库的展示质量。',
      navGroup: 'admin',
      scene: 'admin',
      shell: 'workspace',
    },
  },
  {
    path: '/admin/spaceManage',
    name: '工作台管理',
    component: SpaceManagePage,
    meta: {
      title: '工作台管理',
      subtitle: '查看个人与团队工作台的使用情况，快速定位高频协作区域。',
      navGroup: 'admin',
      scene: 'admin',
      shell: 'workspace',
    },
  },
  {
    path: '/spaceUserManage/:id',
    name: '协作成员管理',
    component: SpaceUserManagePage,
    props: true,
    meta: {
      title: '协作成员管理',
      subtitle: '为团队工作台安排成员分工，确保任务交接和结果沉淀顺畅。',
      navGroup: 'admin',
      scene: 'teamWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/add_picture',
    name: '发起超分任务',
    component: AddPicturePage,
    meta: {
      title: '发起超分任务',
      subtitle: '上传待处理的图片或视频，补充说明后直接开始修复。',
      navGroup: 'core',
      scene: 'personalWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/upload_case',
    name: '上传超分案例',
    component: UploadCasePage,
    meta: {
      title: '上传超分案例',
      subtitle: '把处理前后的样例整理成案例，发布到案例库供后续参考。',
      navGroup: 'core',
      scene: 'caseGallery',
      shell: 'workspace',
    },
  },
  {
    path: '/add_picture/batch',
    name: '批量任务提交',
    component: AddPictureBatchPage,
    meta: {
      title: '批量任务提交',
      subtitle: '一次性导入多份图片素材，集中进入同一批修复流程。',
      navGroup: 'core',
      scene: 'personalWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/picture/:id',
    name: '素材详情',
    component: PictureDetailPage,
    props: true,
    meta: {
      title: '素材详情',
      subtitle: '查看当前图片或视频的基本信息，并继续下载、分享或再次处理。',
      navGroup: 'core',
      scene: 'caseGallery',
      shell: 'workspace',
    },
  },
  {
    path: '/add_space',
    name: '创建工作台',
    component: AddSpacePage,
    meta: {
      title: '创建工作台',
      subtitle: '创建个人或团队工作台，为后续任务、结果和协作预留空间。',
      navGroup: 'core',
      scene: 'personalWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/my_space',
    name: '个人工作台',
    component: MySpacePage,
    meta: {
      title: '个人工作台',
      subtitle: '回到你自己的处理区域，继续上传素材、提交任务和查看结果。',
      navGroup: 'core',
      scene: 'personalWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/space/:id',
    name: '工作台详情',
    component: SpaceDetailPage,
    props: true,
    meta: {
      title: '工作台详情',
      subtitle: '在这里集中查看素材、任务结果、成员分工和使用情况。',
      navGroup: 'core',
      scene: 'workspace',
      shell: 'workspace',
    },
  },
  {
    path: '/space/:id/sr_result',
    name: '结果中心',
    component: SrTaskResultPage,
    props: true,
    meta: {
      title: '结果中心',
      subtitle: '筛选、预览并下载当前工作台里的修复结果，快速对比前后效果。',
      navGroup: 'core',
      scene: 'resultCenter',
      shell: 'workspace',
    },
  },
  {
    path: '/space_analyze',
    name: '工作台分析',
    component: SpaceAnalyzePage,
    meta: {
      title: '工作台分析',
      subtitle: '查看使用量、分类分布和协作趋势，帮助整理当前工作负载。',
      navGroup: 'admin',
      scene: 'admin',
      shell: 'workspace',
    },
  },
  {
    path: '/search_picture',
    name: '案例检索',
    component: SearchPicturePage,
    meta: {
      title: '案例检索',
      subtitle: '按内容风格和视觉特征查找相似案例，快速找到可参考的修复效果。',
      navGroup: 'core',
      scene: 'caseGallery',
      shell: 'workspace',
    },
  },
  {
    path: '/user_exchange_vip',
    name: '容量与规格升级',
    component: UserExchangeVipPage,
    meta: {
      title: '容量与规格升级',
      subtitle: '查看当前工作台可用容量，并扩展更大的处理空间。',
      navGroup: 'account',
      scene: 'personalWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/user/profile',
    name: '账户中心',
    component: UserProfilePage,
    meta: {
      title: '账户中心',
      subtitle: '查看账户资料、消息提醒、我的样例和近期处理记录。',
      navGroup: 'account',
      scene: 'personalWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: {
      title: '关于平台',
      subtitle: '快速了解平台能帮你做什么，以及它适合处理哪些图像修复场景。',
      navGroup: 'secondary',
      scene: 'home',
      shell: 'workspace',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.afterEach((to) => {
  const pageTitle = String(to.meta?.title || APP_SHORT_NAME)
  document.title = `${pageTitle} - ${APP_NAME}`
})

export default router
