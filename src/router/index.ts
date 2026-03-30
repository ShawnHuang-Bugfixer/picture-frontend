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
      subtitle: '从统一入口发起任务、浏览案例并回到你的工作流。',
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
      subtitle: '登录云端超分平台，继续你的任务与协作流程。',
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
      subtitle: '创建账号，开始使用图片与视频超分辨率重构能力。',
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
      subtitle: '查看平台用户、角色分布与基础账户信息。',
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
      subtitle: '审核素材、维护案例内容并处理平台内容治理事务。',
      navGroup: 'admin',
      scene: 'admin',
      shell: 'workspace',
    },
  },
  {
    path: '/admin/spaceManage',
    name: '工作空间管理',
    component: SpaceManagePage,
    meta: {
      title: '工作空间管理',
      subtitle: '管理人工工作空间、团队协作空间及其容量使用情况。',
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
      subtitle: '配置团队成员角色与可执行权限。',
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
      subtitle: '提交图片或视频素材，配置模型与执行参数。',
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
      subtitle: '上传图片或视频素材，完善案例信息，并发布到超分案例展厅。',
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
      subtitle: '批量导入素材，统一提交超分任务。',
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
      subtitle: '查看素材信息、下载、分享或继续后续处理。',
      navGroup: 'core',
      scene: 'caseGallery',
      shell: 'workspace',
    },
  },
  {
    path: '/add_space',
    name: '创建工作空间',
    component: AddSpacePage,
    meta: {
      title: '创建工作空间',
      subtitle: '创建人工工作空间或团队协作空间并初始化容量配置。',
      navGroup: 'core',
      scene: 'personalWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/my_space',
    name: '人工工作空间',
    component: MySpacePage,
    meta: {
      title: '人工工作空间',
      subtitle: '回到你的私有工作台，继续处理素材、任务与结果。',
      navGroup: 'core',
      scene: 'personalWorkspace',
      shell: 'workspace',
    },
  },
  {
    path: '/space/:id',
    name: '工作空间详情',
    component: SpaceDetailPage,
    props: true,
    meta: {
      title: '工作空间详情',
      subtitle: '查看空间内的素材、任务结果、成员与分析信息。',
      navGroup: 'core',
      scene: 'teamWorkspace',
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
      subtitle: '筛选、预览和下载当前工作空间的超分结果。',
      navGroup: 'core',
      scene: 'resultCenter',
      shell: 'workspace',
    },
  },
  {
    path: '/space_analyze',
    name: '工作空间分析',
    component: SpaceAnalyzePage,
    meta: {
      title: '工作空间分析',
      subtitle: '查看容量、分类、标签与使用趋势等多维分析。',
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
      subtitle: '按内容、颜色或结构筛选案例与素材。',
      navGroup: 'core',
      scene: 'caseGallery',
      shell: 'workspace',
    },
  },
  {
    path: '/user_exchange_vip',
    name: '套餐升级',
    component: UserExchangeVipPage,
    meta: {
      title: '套餐升级',
      subtitle: '查看空间规格并升级当前使用方案。',
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
      subtitle: '查看账号信息、内容治理状态和近期创作成果。',
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
      subtitle: '了解平台定位、能力边界与技术实现思路。',
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
