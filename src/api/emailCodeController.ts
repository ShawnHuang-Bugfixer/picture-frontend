import myAxios from '@/request';

/**
 * 发送邮箱验证码
 * @param email 邮箱地址
 * @returns Promise<API.BaseResponseBoolean_>
 */
export function sendEmailCode(email: string) {
  return myAxios.get<API.BaseResponseBoolean_>('/api/email/sendCode', {
    params: { email },
  });
}

/**
 * 获取滑块验证码一次性 token
 * @returns Promise<API.BaseResponseBoolean_>
 */
export function getSliderToken() {
  return myAxios.get<API.BaseResponseBoolean_>('/api/email/sliderToken');
} 