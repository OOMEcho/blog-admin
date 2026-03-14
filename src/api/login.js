import {postRequest} from "@/utils/request"

/**
 * 登录接口 - 支持账号密码和邮箱验证码两种方式
 * @param {Object} params
 *   loginType: 'password' | 'email'
 *   username/email: 根据类型填写
 *   password/code: 根据类型填写
 *   captchaKey: 验证码 key
 *   slideX: 滑块位置
 */
export function login(params) {
  const {loginType, username, password, email, code, captchaKey, slideX} = params;

  const payload = {
    loginType,
    captchaKey,
    slideX
  };

  switch (loginType) {
    case 'password':
      payload.username = username;
      payload.password = password;
      break;
    case 'email':
      payload.email = email;
      payload.code = code;
      break;
    default:
      throw new Error('不支持的登录类型');
  }

  return postRequest('/login', payload);
}
