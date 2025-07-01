import axios from "axios";
import {message} from "ant-design-vue";

// 区分开发和生产环境
const DEV_BASE_URL = "http://localhost:8123";
// const PROD_BASE_URL = "http://122.51.30.66";
// 创建 Axios 实例
const myAxios = axios.create({
  baseURL: DEV_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// 全局请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)

// 全局响应拦截器
myAxios.interceptors.response.use(
  async function (response) {
    const { data } = response
    // 未登录
    if (data.code === 40100) {
      try {
        // 1. 首先尝试请求 /user/auth/refresh 获取响应体
        const refreshResponse = await myAxios.post('/api/user/auth/refresh'); // 改为POST方法
        const refreshData = refreshResponse.data;

        // 2. 检查响应体的 data（boolean）是否为 true
        if (refreshData.data === true) {
          // 3. 如果 data 为 true 说明刷新 JWT 成功，不做处理直接放行
          return response;
        } else {
          // 4. 如果 data 为 false 说明刷新 JWT 失败，执行跳转页面逻辑
          handleUnauthorized(response);
        }
      } catch (error) {
        // 刷新token请求失败也执行跳转逻辑
        handleUnauthorized(response);
      }
    }
    return response
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error)
  },
)

function handleUnauthorized(response: any) {
  // 不是获取用户信息的请求，并且用户目前不是已经在用户登录页面，则跳转到登录页面
  if (
    !response.request.responseURL.includes('user/get/login') &&
    !window.location.pathname.includes('/user/login')
  ) {
    message.warning('请先登录')
    window.location.href = `/user/login?redirect=${window.location.href}`
  }
}

export default myAxios;
